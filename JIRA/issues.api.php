<?php
/**
 * JIRA Stories API
 * Handles JIRA story operations (fetch, create, update, sync)
 */

require_once '../Database/config.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/config.api.php';

// Start session for CSRF protection
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$conn = getDatabaseConnection();

if (!$conn) {
    sendError('Database connection failed', 500);
}

// Security checks
$clientIP = $_SERVER['REMOTE_ADDR'];
$method = $_SERVER['REQUEST_METHOD'];
$action = sanitizeInput($_GET['action'] ?? '', 'string');

// Check IP whitelist
if (!checkIPWhitelist($conn, $clientIP)) {
    logSecurityEvent($conn, 'ip_blocked', 'Access denied from IP: ' . $clientIP, $clientIP);
    sendError('Access denied', 403);
}

// Check rate limit (very lenient for localhost, stricter for remote)
$isLocalhost = in_array($clientIP, ['127.0.0.1', '::1', 'localhost']);
if ($isLocalhost) {
    // Localhost: very high limits for development
    if (!checkRateLimit($conn, $clientIP, 1000, 10000)) {
        logSecurityEvent($conn, 'rate_limit_exceeded', 'Rate limit exceeded for IP: ' . $clientIP, $clientIP);
        sendError('Too many requests. Please try again later.', 429);
    }
} elseif ($method === 'GET') {
    // Remote GET: moderate limits
    if (!checkRateLimit($conn, $clientIP, 60, 500)) {
        logSecurityEvent($conn, 'rate_limit_exceeded', 'Rate limit exceeded for IP: ' . $clientIP, $clientIP);
        sendError('Too many requests. Please try again later.', 429);
    }
} else {
    // Remote POST/PUT: stricter limits
    if (!checkRateLimit($conn, $clientIP, 20, 200)) {
        logSecurityEvent($conn, 'rate_limit_exceeded', 'Rate limit exceeded for IP: ' . $clientIP, $clientIP);
        sendError('Too many requests. Please try again later.', 429);
    }
}

// Set security headers
setSecurityHeaders();

// CSRF token validation for non-GET requests
if ($method !== 'GET') {
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!verifyCSRFToken($conn, $csrfToken, $clientIP)) {
        logSecurityEvent($conn, 'csrf_validation_failed', 'Invalid CSRF token from IP: ' . $clientIP, $clientIP);
        sendError('Invalid security token', 403);
    }
}

switch ($method) {
    case 'GET':
        if ($action === 'fetch') {
            fetchJiraIssues($conn);
        } elseif ($action === 'search') {
            searchJiraIssues($conn);
        } elseif ($action === 'cache') {
            getCachedIssues($conn);
        } elseif ($action === 'getSingle') {
            getSingleIssue($conn);
        } else {
            sendError('Invalid action', 400);
        }
        break;
    case 'POST':
        if ($action === 'sync') {
            syncFromJira($conn);
        } elseif ($action === 'import') {
            importJiraIssues($conn);
        } elseif ($action === 'addToRecords') {
            addSingleIssueToRecords($conn);
        } else {
            sendError('Invalid action', 400);
        }
        break;
    default:
        sendError('Method not allowed', 405);
}

// Get JIRA config
function getActiveJiraConfig($conn) {
    // Use the secure decrypted config function from config.api.php
    return getDecryptedJiraConfig($conn);
}

// Make JIRA API request
function jiraRequest($config, $endpoint, $method = 'GET', $data = null) {
    global $conn, $clientIP;
    
    $url = rtrim($config['jira_url'], '/') . $endpoint;
    
    // For search endpoints, ALWAYS use POST with data in body (Atlassian deprecated GET)
    $isSearchEndpoint = (strpos($endpoint, '/search') !== false);
    
    if ($isSearchEndpoint && $method === 'GET') {
        $method = 'POST';
    }
    
    // For true GET requests (not converted), convert data array to query string
    if ($method === 'GET' && is_array($data) && !empty($data)) {
        // Build query string from data array
        $queryParams = [];
        foreach ($data as $key => $value) {
            if ($key === 'fields' && is_array($value)) {
                // Fields parameter needs to be comma-separated
                $fieldsValue = implode(',', $value);
                $queryParams[] = 'fields=' . $fieldsValue;
            } elseif ($key === 'jql') {
                // JQL needs to be URL encoded
                $queryParams[] = 'jql=' . urlencode($value);
            } else {
                $queryParams[] = $key . '=' . urlencode($value);
            }
        }
        $url .= '?' . implode('&', $queryParams);
        $data = null; // Clear data since it's in the URL now
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Basic ' . base64_encode($config['jira_email'] . ':' . $config['jira_api_token']),
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logSecurityEvent($conn, 'jira_connection_error', 'JIRA API connection error: ' . $error, $clientIP);
        return ['success' => false, 'error' => 'Connection error: ' . $error];
    }
    
    $responseData = json_decode($response, true);
    
    if ($httpCode < 200 || $httpCode >= 300) {
        // Extract detailed error information
        $errorMessages = $responseData['errorMessages'] ?? [];
        $errors = $responseData['errors'] ?? [];
        $message = $responseData['message'] ?? '';
        
        $errorMsg = !empty($errorMessages) ? implode(', ', $errorMessages) : 
                    (!empty($errors) ? json_encode($errors) : 
                    ($message ?: 'HTTP ' . $httpCode));
        
        // Log detailed error for debugging
        $logDetails = json_encode([
            'httpCode' => $httpCode,
            'errorMessages' => $errorMessages,
            'errors' => $errors,
            'message' => $message,
            'endpoint' => $endpoint
        ]);
        logSecurityEvent($conn, 'jira_api_error', 'JIRA API error: ' . $logDetails, $clientIP);
        return ['success' => false, 'error' => $errorMsg, 'httpCode' => $httpCode, 'details' => $responseData];
    }
    
    return ['success' => true, 'data' => $responseData, 'httpCode' => $httpCode];
}

// Make JIRA API request with query parameters (for new /search/jql endpoint)
function jiraRequestWithQueryParams($config, $endpoint, $method = 'POST', $data = null) {
    global $conn, $clientIP;
    
    $url = rtrim($config['jira_url'], '/') . $endpoint;
    
    // Build query string from data array
    if (is_array($data) && !empty($data)) {
        $queryParams = [];
        foreach ($data as $key => $value) {
            if ($key === 'fields' && is_array($value)) {
                // Fields parameter needs to be comma-separated
                $fieldsValue = implode(',', $value);
                $queryParams[] = 'fields=' . $fieldsValue;
            } elseif ($key === 'jql') {
                // JQL needs to be URL encoded
                $queryParams[] = 'jql=' . urlencode($value);
            } else {
                $queryParams[] = $key . '=' . urlencode($value);
            }
        }
        $url .= '?' . implode('&', $queryParams);
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Basic ' . base64_encode($config['jira_email'] . ':' . $config['jira_api_token']),
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        // Empty POST body - data is in query string
        curl_setopt($ch, CURLOPT_POSTFIELDS, '');
    } elseif ($method === 'PUT') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    }
    // For GET, no additional setup needed
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logSecurityEvent($conn, 'jira_connection_error', 'JIRA API connection error: ' . $error, $clientIP);
        return ['success' => false, 'error' => 'Connection error: ' . $error];
    }
    
    $responseData = json_decode($response, true);
    
    if ($httpCode < 200 || $httpCode >= 300) {
        $errorMessages = $responseData['errorMessages'] ?? [];
        $errors = $responseData['errors'] ?? [];
        $message = $responseData['message'] ?? '';
        
        $errorMsg = !empty($errorMessages) ? implode(', ', $errorMessages) : 
                    (!empty($errors) ? json_encode($errors) : 
                    ($message ?: 'HTTP ' . $httpCode));
        
        $logDetails = json_encode([
            'httpCode' => $httpCode,
            'errorMessages' => $errorMessages,
            'errors' => $errors,
            'message' => $message,
            'endpoint' => $endpoint
        ]);
        logSecurityEvent($conn, 'jira_api_error', 'JIRA API error: ' . $logDetails, $clientIP);
        return ['success' => false, 'error' => $errorMsg, 'httpCode' => $httpCode, 'details' => $responseData];
    }
    
    return ['success' => true, 'data' => $responseData, 'httpCode' => $httpCode];
}

// Fetch JIRA stories by JQL
function fetchJiraIssues($conn) {
    global $clientIP;
    
    $config = getActiveJiraConfig($conn);
    if (!$config) {
        logSecurityEvent($conn, 'config_not_found', 'Attempted to fetch JIRA stories without configuration', $clientIP);
        sendError('JIRA not configured', 400);
    }
    
    $jql = sanitizeInput($_GET['jql'] ?? '', 'jql');
    $maxResults = sanitizeInput($_GET['maxResults'] ?? 50, 'int');
    $startAt = sanitizeInput($_GET['startAt'] ?? 0, 'int');
    
    // Limit max results to prevent abuse
    if ($maxResults > 500) {
        $maxResults = 500;
    }
    
    if (empty($jql)) {
        $jql = 'project = ' . $config['jira_project_key'] . ' ORDER BY created DESC';
    }
    
    $requestData = [
        'jql' => $jql,
        'maxResults' => $maxResults,
        'startAt' => $startAt,
        'fields' => ['*all']
    ];
    
    // Try new /search/jql endpoint with JSON POST body first (CHANGE-2046 compliant)
    $result = jiraRequest($config, '/rest/api/3/search/jql', 'POST', $requestData);
    
    if (!$result['success'] && isset($result['httpCode']) && ($result['httpCode'] == 410 || $result['httpCode'] == 404 || $result['httpCode'] == 400)) {
        $result = jiraRequest($config, '/rest/api/3/search', 'POST', $requestData);
        
        if (isset($result['httpCode']) && $result['httpCode'] == 410) {
            $result = jiraRequestWithQueryParams($config, '/rest/api/3/search', 'GET', $requestData);
            
            if (!$result['success']) {
                $result = jiraRequest($config, '/rest/api/2/search', 'POST', $requestData);
                
                if (!$result['success']) {
                    sendError($result['error']);
                }
            }
        } else if (!$result['success']) {
            sendError($result['error']);
        }
    } else if (!$result['success']) {
        sendError($result['error']);
    }
    
    // Audit log
    auditJiraOperation($conn, 'read', 'stories', null, null, $clientIP, [
        'jql' => $jql,
        'count' => count($result['data']['issues'] ?? [])
    ]);
    
    sendSuccess($result['data']);
}

// Search JIRA stories
function searchJiraIssues($conn) {
    global $clientIP;
    
    $config = getActiveJiraConfig($conn);
    if (!$config) {
        logSecurityEvent($conn, 'config_not_found', 'Attempted to search JIRA stories without configuration', $clientIP);
        sendError('JIRA not configured', 400);
    }
    
    $searchText = sanitizeInput($_GET['q'] ?? '', 'string');
    
    if (empty($searchText)) {
        sendError('Search query is required');
    }
    
    // Prevent injection attacks
    $searchText = str_replace('"', '', $searchText);
    
    $jql = 'project = ' . $config['jira_project_key'] . ' AND text ~ "' . addslashes($searchText) . '" ORDER BY updated DESC';
    
    $requestData = [
        'jql' => $jql,
        'maxResults' => 500,
        'fields' => ['*all']
    ];
    
    // Try new /search/jql endpoint with JSON POST body first (CHANGE-2046 compliant)
    $result = jiraRequest($config, '/rest/api/3/search/jql', 'POST', $requestData);
    
    if (!$result['success'] && isset($result['httpCode']) && ($result['httpCode'] == 410 || $result['httpCode'] == 404 || $result['httpCode'] == 400)) {
        $result = jiraRequest($config, '/rest/api/3/search', 'POST', $requestData);
        
        if (isset($result['httpCode']) && $result['httpCode'] == 410) {
            $result = jiraRequestWithQueryParams($config, '/rest/api/3/search', 'GET', $requestData);
            
            if (!$result['success']) {
                $result = jiraRequest($config, '/rest/api/2/search', 'POST', $requestData);
                
                if (!$result['success']) {
                    sendError($result['error']);
                }
            }
        } else if (!$result['success']) {
            sendError($result['error']);
        }
    } else if (!$result['success']) {
        sendError($result['error']);
    }
    
    // Audit log
    auditJiraOperation($conn, 'search', 'stories', null, null, $clientIP, [
        'query' => maskSensitiveData($searchText),
        'count' => count($result['data']['issues'] ?? [])
    ]);
    
    sendSuccess($result['data']);
}

// Get cached JIRA stories
function getCachedIssues($conn) {
    global $clientIP;
    
    $projectKey = sanitizeInput($_GET['project'] ?? '', 'string');
    $limit = sanitizeInput($_GET['limit'] ?? 10000, 'int');
    
    // Limit max results to prevent memory issues
    if ($limit > 50000) {
        $limit = 50000;
    }
    
    
    // Select only essential fields to reduce memory usage (exclude custom_fields which can be huge)
    // Note: acceptance_criteria is extracted separately if needed
    $sql = "SELECT issue_key, project_key, issue_type, summary, description, status, " .
           "assignee, reporter, priority, labels, sprint, story_points, parent_key, " .
           "created_date, updated_date, local_record_id, last_synced_at " .
           "FROM jira_issues_cache";
    $whereConditions = [];
    
    // Only filter by project if a valid short key is provided (e.g., TBCRM3, not full name)
    // Project keys in JIRA are typically uppercase acronyms without spaces
    if ($projectKey && !str_contains($projectKey, ' ')) {
        $whereConditions[] = "project_key = '" . $conn->real_escape_string($projectKey) . "'";
    }
    
    if (count($whereConditions) > 0) {
        $sql .= " WHERE " . implode(' AND ', $whereConditions);
    }
    
    $sql .= " ORDER BY updated_date DESC LIMIT " . $limit;
    
    $result = $conn->query($sql);
    
    if (!$result) {
        logSecurityEvent($conn, 'cache_fetch_failed', 'Failed to fetch cached stories: ' . $conn->error, $clientIP);
        sendError('Failed to fetch cached stories: ' . $conn->error, 500);
    }
    
    $issues = [];
    while ($row = $result->fetch_assoc()) {
        // Parse JSON fields
        $row['labels'] = json_decode($row['labels'] ?? '[]', true);
        $issues[] = $row;
    }
    
    // Audit log
    auditJiraOperation($conn, 'read', 'cache', null, null, $clientIP, [
        'project' => $projectKey,
        'count' => count($issues)
    ]);
    
    sendSuccess(['stories' => $issues, 'count' => count($issues)]);
}

// Get single issue with full custom fields (for detailed view)
function getSingleIssue($conn) {
    global $clientIP;
    
    // Increase memory limit for this operation
    ini_set('memory_limit', '256M');
    
    $issueKey = sanitizeInput($_GET['issueKey'] ?? '', 'string');
    
    if (empty($issueKey)) {
        sendError('Issue key is required', 400);
    }
    
    try {
        // Fetch single issue WITH custom_fields
        $sql = "SELECT issue_key, project_key, issue_type, summary, description, status, " .
               "assignee, reporter, priority, labels, sprint, story_points, parent_key, " .
               "custom_fields, created_date, updated_date, local_record_id, last_synced_at " .
               "FROM jira_issues_cache WHERE issue_key = ?";
        
        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            error_log("getSingleIssue: Failed to prepare statement: " . $conn->error);
            sendError('Database error', 500);
        }
        
        $stmt->bind_param("s", $issueKey);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            sendError('Issue not found in cache', 404);
        }
        
        $issue = $result->fetch_assoc();
        $stmt->close();
        
        // Parse JSON fields
        $issue['labels'] = json_decode($issue['labels'] ?? '[]', true);
        if (isset($issue['custom_fields']) && !empty($issue['custom_fields'])) {
            $issue['custom_fields'] = json_decode($issue['custom_fields'], true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("getSingleIssue: JSON decode error for custom_fields: " . json_last_error_msg());
                $issue['custom_fields'] = [];
            }
        } else {
            $issue['custom_fields'] = [];
        }
        
        // Audit log
        auditJiraOperation($conn, 'read', 'cache_single', $issueKey, null, $clientIP, []);
        
        sendSuccess($issue);
        
    } catch (Exception $e) {
        error_log("getSingleIssue: Exception - " . $e->getMessage());
        sendError('Error fetching issue: ' . $e->getMessage(), 500);
    }
}

// Sync stories from JIRA to cache
// SYNC FUNCTION - Clean implementation using JIRA Search API
function syncFromJira($conn) {
    global $clientIP;
    
    $config = getActiveJiraConfig($conn);
    if (!$config) {
        logSecurityEvent($conn, 'config_not_found', 'Attempted to sync JIRA stories without configuration', $clientIP);
        sendError('JIRA not configured', 400);
    }
    
    $data = getJsonInput();
    $jql = sanitizeInput($data['jql'] ?? 'project = ' . $config['jira_project_key'] . ' ORDER BY updated DESC', 'jql');
    $maxResults = min(sanitizeInput($data['maxResults'] ?? 100, 'int'), 100);
    
    // Build JIRA API URL with query parameters
    $url = rtrim($config['jira_url'], '/') . '/rest/api/3/search';
    $url .= '?jql=' . urlencode($jql);
    $url .= '&maxResults=' . $maxResults;
    $url .= '&fields=*all';
    
    // Make direct CURL request (similar to test-connection.api.php)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Basic ' . base64_encode($config['jira_email'] . ':' . $config['jira_api_token']),
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);
    
    if ($curlError) {
        logSecurityEvent($conn, 'sync_failed', 'JIRA connection error: ' . $curlError, $clientIP);
        sendError('Connection error: ' . $curlError);
    }
    
    if ($httpCode < 200 || $httpCode >= 300) {
        $responseData = json_decode($response, true);
        $errorMsg = $responseData['errorMessages'][0] ?? $responseData['message'] ?? 'HTTP ' . $httpCode;
        logSecurityEvent($conn, 'sync_failed', 'JIRA sync failed (HTTP ' . $httpCode . '): ' . $errorMsg, $clientIP);
        sendError('Failed to sync from JIRA (HTTP ' . $httpCode . '): ' . $errorMsg);
    }
    
    $responseData = json_decode($response, true);
    $issues = $responseData['issues'] ?? [];
    $total = $responseData['total'] ?? 0;
    $syncedCount = 0;
    $errors = [];
    
    foreach ($issues as $issue) {
        try {
            if (cacheJiraIssue($conn, $issue)) {
                $syncedCount++;
                logJiraSync($conn, 'import', 'from_jira', $issue['key'] ?? 'unknown', null, 'success', 'Story cached successfully', $clientIP);
            }
        } catch (Exception $e) {
            $errors[] = ['key' => $issue['key'] ?? 'unknown', 'error' => $e->getMessage()];
            logJiraSync($conn, 'import', 'from_jira', $issue['key'] ?? 'unknown', null, 'failed', $e->getMessage(), $clientIP);
        }
    }
    
    auditJiraOperation($conn, 'sync', 'stories', null, null, $clientIP, [
        'jql' => maskSensitiveData($jql),
        'synced' => $syncedCount,
        'total' => $total
    ]);
    
    sendSuccess([
        'synced' => $syncedCount,
        'total' => $total,
        'errors' => $errors
    ], 'Synced ' . $syncedCount . ' of ' . $total . ' stories from JIRA');
}

/**
 * Extract text from JIRA's structured description format (API v3)
 * JIRA API v3 returns descriptions in Atlassian Document Format (ADF)
 */
function extractTextFromDescription($description) {
    if (is_string($description)) {
        return $description;
    }
    
    if (!is_array($description)) {
        return '';
    }
    
    $text = [];
    
    // ADF structure: content array with nested content
    if (isset($description['content']) && is_array($description['content'])) {
        foreach ($description['content'] as $node) {
            if (isset($node['content']) && is_array($node['content'])) {
                foreach ($node['content'] as $subNode) {
                    if (isset($subNode['text'])) {
                        $text[] = $subNode['text'];
                    }
                }
            } elseif (isset($node['text'])) {
                $text[] = $node['text'];
            }
        }
    }
    
    return implode(' ', $text);
}

// Cache a single JIRA story
function cacheJiraIssue($conn, $issue) {
    // Validate story structure
    if (!isset($issue['key']) || empty($issue['key'])) {
        throw new Exception('Invalid story structure: missing story key');
    }
    
    if (!isset($issue['fields']) || !is_array($issue['fields'])) {
        throw new Exception('Invalid story structure: missing fields');
    }
    
    $key = $issue['key'];
    $fields = $issue['fields'];
    
    $projectKey = $issue['fields']['project']['key'] ?? '';
    $issueType = $fields['issuetype']['name'] ?? '';
    $summary = $fields['summary'] ?? '';
    
    // Handle description - JIRA API v3 returns structured content
    $description = '';
    if (isset($fields['description'])) {
        if (is_string($fields['description'])) {
            $description = $fields['description'];
        } elseif (is_array($fields['description'])) {
            // Extract text from structured content
            $description = extractTextFromDescription($fields['description']);
        }
    }
    
    $status = $fields['status']['name'] ?? '';
    $assignee = $fields['assignee']['displayName'] ?? null;
    $reporter = $fields['reporter']['displayName'] ?? null;
    $priority = $fields['priority']['name'] ?? null;
    $labels = json_encode($fields['labels'] ?? []);
    
    // Handle sprint field - try multiple common custom field IDs
    $sprint = null;
    // Common sprint field IDs in JIRA - customfield_10103 is for this JIRA instance
    $sprintFieldIds = ['customfield_10103', 'sprint', 'customfield_10020', 'customfield_10018', 'customfield_10001', 'customfield_10000'];
    foreach ($sprintFieldIds as $fieldId) {
        if (isset($fields[$fieldId]) && !empty($fields[$fieldId])) {
            if (is_array($fields[$fieldId]) && !empty($fields[$fieldId])) {
                // Sprint is typically an array, prioritize active sprint over closed ones
                $sprintArray = $fields[$fieldId];
                
                // First, try to find an active sprint
                foreach (array_reverse($sprintArray) as $sprintObj) {
                    if (is_array($sprintObj) && isset($sprintObj['name']) && isset($sprintObj['state'])) {
                        if ($sprintObj['state'] === 'active') {
                            $sprint = $sprintObj['name'];
                            break 2; // Break both foreach loops
                        }
                    }
                }
                
                // If no active sprint, get the last sprint (most recent)
                $lastSprint = end($sprintArray);
                if (is_array($lastSprint) && isset($lastSprint['name'])) {
                    $sprint = $lastSprint['name'];
                    break;
                } elseif (is_string($lastSprint)) {
                    // Parse sprint string format: "com.atlassian.greenhopper.service.sprint.Sprint@...name=Sprint 1,..."
                    if (preg_match('/name=([^,\]]+)/', $lastSprint, $matches)) {
                        $sprint = $matches[1];
                        break;
                    }
                }
            } elseif (is_string($fields[$fieldId])) {
                $sprint = $fields[$fieldId];
                break;
            }
        }
    }
    
    // Handle story points - try multiple common custom field IDs
    // customfield_10414 is for this JIRA instance
    $storyPoints = null;
    $storyPointsFieldIds = ['customfield_10414', 'customfield_10016', 'customfield_10026', 'customfield_10004', 'customfield_10005', 'storyPoints'];
    foreach ($storyPointsFieldIds as $fieldId) {
        if (isset($fields[$fieldId]) && !empty($fields[$fieldId])) {
            $storyPoints = $fields[$fieldId];
            break;
        }
    }
    
    $parentKey = $fields['parent']['key'] ?? null;
    $customFields = json_encode($fields);
    $createdDate = isset($fields['created']) ? date('Y-m-d H:i:s', strtotime($fields['created'])) : null;
    $updatedDate = isset($fields['updated']) ? date('Y-m-d H:i:s', strtotime($fields['updated'])) : null;
    
    $stmt = $conn->prepare("INSERT INTO jira_issues_cache 
        (issue_key, project_key, issue_type, summary, description, status, assignee, reporter, priority, labels, sprint, story_points, parent_key, custom_fields, created_date, updated_date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        project_key = VALUES(project_key),
        issue_type = VALUES(issue_type),
        summary = VALUES(summary),
        description = VALUES(description),
        status = VALUES(status),
        assignee = VALUES(assignee),
        reporter = VALUES(reporter),
        priority = VALUES(priority),
        labels = VALUES(labels),
        sprint = VALUES(sprint),
        story_points = VALUES(story_points),
        parent_key = VALUES(parent_key),
        custom_fields = VALUES(custom_fields),
        created_date = VALUES(created_date),
        updated_date = VALUES(updated_date)");
    
    $stmt->bind_param("sssssssssssdssss", 
        $key, $projectKey, $issueType, $summary, $description, $status, 
        $assignee, $reporter, $priority, $labels, $sprint, $storyPoints, 
        $parentKey, $customFields, $createdDate, $updatedDate);
    
    $result = $stmt->execute();
    
    $stmt->close();
    
    return $result;
}

// Import JIRA stories to local records
function importJiraIssues($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    $issueKeys = $data['issueKeys'] ?? [];
    
    if (empty($issueKeys)) {
        sendError('No story keys provided');
    }
    
    // Limit number of stories to import at once
    if (count($issueKeys) > 50) {
        sendError('Cannot import more than 50 stories at once');
    }
    
    $config = getActiveJiraConfig($conn);
    if (!$config) {
        logSecurityEvent($conn, 'config_not_found', 'Attempted to import JIRA stories without configuration', $clientIP);
        sendError('JIRA not configured', 400);
    }
    
    $imported = 0;
    $errors = [];
    
    foreach ($issueKeys as $issueKey) {
        // Get story from JIRA - try v3 first, fallback to v2
        $result = jiraRequest($config, '/rest/api/3/issue/' . $issueKey . '?fields=*all');
        
        if (!$result['success']) {
            $result = jiraRequest($config, '/rest/api/2/issue/' . $issueKey . '?fields=*all');
        }
        
        if (!$result['success']) {
            $errors[] = ['key' => $issueKey, 'error' => $result['error']];
            continue;
        }
        
        $issue = $result['data'];
        $fields = $issue['fields'];
        
        // Create local record
        $recordId = time() . rand(1000, 9999);
        $jira = $issueKey;
        $desc = $fields['summary'] ?? '';
        $jstatus = $fields['status']['name'] ?? '';
        $comments = $fields['description'] ?? '';
        
        $stmt = $conn->prepare("INSERT INTO records (id, jira, `desc`, jstatus, comments) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issss", $recordId, $jira, $desc, $jstatus, $comments);
        
        if ($stmt->execute()) {
            $imported++;
            
            // Cache the story
            cacheJiraIssue($conn, $issue);
            
            // Update cache with local record ID
            $conn->query("UPDATE jira_issues_cache SET local_record_id = $recordId WHERE issue_key = '$issueKey'");
            
            // Log the import
            logJiraSync($conn, 'import', 'from_jira', $issueKey, $recordId, 'success', 'Story imported to local records', $clientIP);
        } else {
            $errors[] = ['key' => $issueKey, 'error' => $stmt->error];
            logJiraSync($conn, 'import', 'from_jira', $issueKey, null, 'failed', $stmt->error, $clientIP);
        }
        
        $stmt->close();
    }
    
    // Audit log
    auditJiraOperation($conn, 'import', 'stories', null, null, $clientIP, [
        'imported' => $imported,
        'total' => count($issueKeys),
        'errors' => count($errors)
    ]);
    
    sendSuccess([
        'imported' => $imported,
        'total' => count($issueKeys),
        'errors' => $errors
    ], 'Imported ' . $imported . ' stories');
}

// Add single JIRA story to records
function addSingleIssueToRecords($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    $issueKey = $data['issueKey'] ?? '';
    $issue = $data['issue'] ?? null;
    $fieldMappings = $data['fieldMappings'] ?? [];
    
    if (empty($issueKey) || !$issue) {
        sendError('Story key and story data required');
    }
    
    // Create local record
    $recordId = time() . rand(1000, 9999);
    
    // Available database columns in records table
    $availableColumns = ['pi', 'sprint_start', 'sprint_end', 'jira', 'desc', 'jstatus', 'wi1', 'wi2', 'dstatus', 'dorg', 'comments'];
    
    // Default mappings (fallback)
    $recordData = [
        'id' => $recordId,
        'jira' => $issue['issue_key'] ?? $issueKey,
        'desc' => $issue['summary'] ?? '',
        'jstatus' => $issue['status'] ?? '',
        'comments' => $issue['description'] ?? ''
    ];
    
    // Tags will be handled separately
    $tagsToInsert = [];
    
    // Parse custom_fields if it exists
    $customFields = [];
    if (isset($issue['custom_fields'])) {
        if (is_string($issue['custom_fields'])) {
            $customFields = json_decode($issue['custom_fields'], true) ?? [];
        } elseif (is_array($issue['custom_fields'])) {
            $customFields = $issue['custom_fields'];
        }
    }
    
    // Apply field mappings
    foreach ($fieldMappings as $mapping) {
        $localField = $mapping['local_field'] ?? '';
        $jiraField = $mapping['jira_field'] ?? '';
        
        if (empty($localField) || empty($jiraField)) {
            continue;
        }
        
        // Get value from JIRA issue
        $value = null;
        
        // Handle special parsed fields from sprint
        if ($jiraField === 'pi' || $jiraField === 'quarter' || $jiraField === 'sprint_number') {
            $sprintValue = $issue['sprint'] ?? '';
            if (!empty($sprintValue) && $sprintValue !== '0') {
                if ($jiraField === 'pi') {
                    // Extract PI number (first digits before dot)
                    if (preg_match('/^(\d+)/', $sprintValue, $matches)) {
                        $value = $matches[1];
                    }
                } elseif ($jiraField === 'quarter') {
                    // Extract Quarter number (digits after first dot)
                    if (preg_match('/^\d+\.(\d+)/', $sprintValue, $matches)) {
                        $value = $matches[1];
                    }
                } elseif ($jiraField === 'sprint_number') {
                    // Extract Sprint number (digits after "Sprint")
                    if (preg_match('/Sprint(\d+)/', $sprintValue, $matches)) {
                        $value = $matches[1];
                    } elseif (preg_match('/^\d+\.(\d+)/', $sprintValue, $matches)) {
                        $value = $matches[1];
                    }
                }
            }
        }
        // Special handling: If mapping sprint to sprint_start or sprint_end, extract sprint number only
        elseif ($jiraField === 'sprint' && (in_array($localField, ['sprint_start', 'sprint_end', 'pi']))) {
            $sprintValue = $issue['sprint'] ?? '';
            if (!empty($sprintValue) && $sprintValue !== '0') {
                // If mapping to pi, extract PI number
                if ($localField === 'pi') {
                    if (preg_match('/^(\d+)/', $sprintValue, $matches)) {
                        $value = $matches[1];
                    }
                } else {
                    // For sprint_start/sprint_end, extract just the sprint number
                    if (preg_match('/Sprint(\d+)/', $sprintValue, $matches)) {
                        $value = $matches[1];
                    } elseif (preg_match('/^\d+\.(\d+)/', $sprintValue, $matches)) {
                        $value = $matches[1];
                    }
                }
            }
        }
        // Check if it's a standard field
        elseif (isset($issue[$jiraField])) {
            $value = $issue[$jiraField];
        } elseif (isset($customFields[$jiraField])) {
            // Check custom fields
            $value = $customFields[$jiraField];
        }
        
        // Handle tags separately (they go to record_tags table)
        if ($localField === 'tags') {
            if ($value !== null) {
                if (is_array($value)) {
                    // Array of labels
                    $tagsToInsert = array_merge($tagsToInsert, $value);
                } elseif (is_string($value)) {
                    // Comma-separated string or single value
                    $tagArray = array_map('trim', explode(',', $value));
                    $tagsToInsert = array_merge($tagsToInsert, $tagArray);
                }
            }
            continue; // Don't add to recordData
        }
        
        // Only map to actual database columns
        if (!in_array($localField, $availableColumns)) {
            continue;
        }
        
        // Handle special cases for regular columns
        if ($value !== null) {
            if (is_array($value)) {
                if ($jiraField === 'labels') {
                    // Labels array - join as comma-separated
                    $value = implode(', ', $value);
                } elseif (isset($value['name'])) {
                    // Object with name property
                    $value = $value['name'];
                } elseif (isset($value[0]['name'])) {
                    // Array of objects with name property
                    $value = implode(', ', array_column($value, 'name'));
                } else {
                    // Fallback: JSON encode
                    $value = json_encode($value);
                }
            }
            
            // Store in recordData
            $recordData[$localField] = is_string($value) ? $value : (string)$value;
        }
    }
    
    // Store unmapped metadata in custom_columns as JSON
    $customColumns = [
        'assignee' => $issue['assignee'] ?? null,
        'sprint' => $issue['sprint'] ?? null,
        'story_points' => $issue['story_points'] ?? null,
        'issue_type' => $issue['issue_type'] ?? null
    ];
    $customColumnsJson = json_encode($customColumns);
    
    // Timestamps
    $timestamps = [
        'created_at' => date('Y-m-d H:i:s'),
        'modified_at' => date('Y-m-d H:i:s')
    ];
    $timestampsJson = json_encode($timestamps);
    
    // Build dynamic INSERT query based on available data
    $columns = ['id', 'custom_columns', 'timestamps'];
    $values = [$recordId, $customColumnsJson, $timestampsJson];
    $types = 'iss';
    
    foreach ($availableColumns as $col) {
        if (isset($recordData[$col])) {
            $columns[] = ($col === 'desc') ? '`desc`' : $col;
            $values[] = $recordData[$col];
            $types .= 's';
        }
    }
    
    $columnList = implode(', ', $columns);
    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    
    $sql = "INSERT INTO records ($columnList) VALUES ($placeholders)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$values);
    
    if ($stmt->execute()) {
        $stmt->close();
        
        // Insert tags into record_tags table if any
        if (!empty($tagsToInsert)) {
            // Remove duplicates and clean up
            $tagsToInsert = array_unique(array_map('trim', $tagsToInsert));
            $tagsToInsert = array_filter($tagsToInsert); // Remove empty values
            
            foreach ($tagsToInsert as $tag) {
                // Sanitize tag name (alphanumeric, spaces, hyphens, underscores only)
                $tag = preg_replace('/[^a-zA-Z0-9\s\-_]/', '', $tag);
                if (empty($tag) || strlen($tag) > 100) {
                    continue; // Skip invalid tags
                }
                
                // Check if tag exists in tags table (case-insensitive)
                $checkTag = $conn->prepare("SELECT name FROM tags WHERE LOWER(name) = LOWER(?)");
                $checkTag->bind_param("s", $tag);
                $checkTag->execute();
                $tagResult = $checkTag->get_result();
                
                $actualTagName = '';
                
                if ($tagResult->num_rows > 0) {
                    // Get the actual tag name from database (correct case)
                    $actualTagName = $tagResult->fetch_assoc()['name'];
                } else {
                    // Tag doesn't exist - create it with unique color
                    $availableColors = ['blue', 'green', 'red', 'purple', 'orange', 'pink', 'teal', 'yellow', 'indigo', 'cyan'];
                    
                    // Get already used colors
                    $usedColorsQuery = $conn->query("SELECT DISTINCT color FROM tags");
                    $usedColors = [];
                    while ($row = $usedColorsQuery->fetch_assoc()) {
                        $usedColors[] = $row['color'];
                    }
                    
                    // Find colors that aren't used yet
                    $unusedColors = array_diff($availableColors, $usedColors);
                    
                    // If all colors are used, pick randomly from all colors
                    $colorToUse = !empty($unusedColors) ? $unusedColors[array_rand($unusedColors)] : $availableColors[array_rand($availableColors)];
                    
                    $insertNewTag = $conn->prepare("INSERT INTO tags (name, color) VALUES (?, ?)");
                    $insertNewTag->bind_param("ss", $tag, $colorToUse);
                    
                    if ($insertNewTag->execute()) {
                        $actualTagName = $tag;
                    }
                    $insertNewTag->close();
                }
                
                $checkTag->close();
                
                // Now link the tag to the record if we have a valid tag name
                if (!empty($actualTagName)) {
                    // Check if this tag is already associated with this record
                    $checkExisting = $conn->prepare("SELECT 1 FROM record_tags WHERE record_id = ? AND tag_name = ?");
                    $checkExisting->bind_param("is", $recordId, $actualTagName);
                    $checkExisting->execute();
                    $existingResult = $checkExisting->get_result();
                    
                    // Only insert if not already associated
                    if ($existingResult->num_rows === 0) {
                        $insertTag = $conn->prepare("INSERT INTO record_tags (record_id, tag_name) VALUES (?, ?)");
                        $insertTag->bind_param("is", $recordId, $actualTagName);
                        $insertTag->execute();
                        $insertTag->close();
                    }
                    
                    $checkExisting->close();
                }
            }
        }
        
        // Update cache with local record ID
        $conn->query("UPDATE jira_issues_cache SET local_record_id = $recordId WHERE issue_key = '" . $conn->real_escape_string($issueKey) . "'");
        
        // Log the import
        logJiraSync($conn, 'add', 'from_jira', $issueKey, $recordId, 'success', 'Story added to local records', $clientIP);
        
        // Audit log
        auditJiraOperation($conn, 'add_to_records', 'stories', $issueKey, null, $clientIP, [
            'record_id' => $recordId,
            'tags_added' => count(array_filter($tagsToInsert))
        ]);
        
        sendSuccess([
            'record_id' => $recordId,
            'issue_key' => $issueKey
        ], 'Story added to records successfully');
    } else {
        $error = $stmt->error;
        $stmt->close();
        logJiraSync($conn, 'add', 'from_jira', $issueKey, null, 'failed', $error, $clientIP);
        sendError('Failed to add story to records: ' . $error);
    }
}

// Log JIRA sync operation
function logJiraSync($conn, $syncType, $direction, $jiraKey, $recordId, $status, $message, $ipAddress = null) {
    if ($ipAddress === null) {
        $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    $fingerprint = getClientFingerprint();
    
    $stmt = $conn->prepare("INSERT INTO jira_sync_log (sync_type, sync_direction, jira_issue_key, record_id, status, message, ip_address, fingerprint) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssissss", $syncType, $direction, $jiraKey, $recordId, $status, $message, $ipAddress, $fingerprint);
    $stmt->execute();
    $stmt->close();
}
