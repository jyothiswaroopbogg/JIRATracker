<?php
/**
 * JIRA Sync API - NEW IMPLEMENTATION
 * Clean, simple, and reliable JIRA story synchronization
 */

require_once '../Database/config.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/config.api.php';

// Increase execution time for large syncs (allow up to 5 minutes)
ini_set('max_execution_time', '300');
set_time_limit(300);

// Start session for CSRF protection
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$conn = getDatabaseConnection();

if (!$conn) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Security checks
$clientIP = $_SERVER['REMOTE_ADDR'];
$method = $_SERVER['REQUEST_METHOD'];

// Check IP whitelist
if (!checkIPWhitelist($conn, $clientIP)) {
    logSecurityEvent($conn, 'ip_blocked', 'Access denied from IP: ' . $clientIP, $clientIP);
    header('Content-Type: application/json');
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Access denied']);
    exit;
}

// Check rate limit (lenient for localhost)
$isLocalhost = in_array($clientIP, ['127.0.0.1', '::1', 'localhost']);
if ($isLocalhost) {
    if (!checkRateLimit($conn, $clientIP, 1000, 10000)) {
        header('Content-Type: application/json');
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many requests']);
        exit;
    }
} else {
    if (!checkRateLimit($conn, $clientIP, 20, 200)) {
        header('Content-Type: application/json');
        http_response_code(429);
        echo json_encode(['success' => false, 'error' => 'Too many requests']);
        exit;
    }
}

// Set security headers
setSecurityHeaders();

// CSRF token validation for POST requests
if ($method === 'POST') {
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!verifyCSRFToken($conn, $csrfToken, $clientIP)) {
        logSecurityEvent($conn, 'csrf_validation_failed', 'Invalid CSRF token from IP: ' . $clientIP, $clientIP);
        header('Content-Type: application/json');
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid security token']);
        exit;
    }
}

// Only accept POST requests
if ($method !== 'POST') {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Get JIRA configuration
$config = getDecryptedJiraConfig($conn);
if (!$config || empty($config['jira_url']) || empty($config['jira_email']) || empty($config['jira_api_token'])) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'JIRA not configured or missing credentials']);
    exit;
}

// Get request parameters
$input = file_get_contents('php://input');
$data = json_decode($input, true) ?? [];

$jql = $data['jql'] ?? 'project = ' . $config['jira_project_key'] . ' ORDER BY updated DESC';

// Fetch ALL stories using CURSOR-BASED pagination (POST method, not GET!)
// Reference: https://developer.atlassian.com/changelog/#CHANGE-2046
$maxResults = 100; // JIRA API allows up to 100 per request
$nextPageToken = null; // Cursor for pagination (replaces startAt)
$totalSynced = 0;
$totalErrors = [];

$baseUrl = rtrim($config['jira_url'], '/');
$endpoint = '/rest/api/3/search/jql';
$url = $baseUrl . $endpoint;

// Keep fetching until we have all stories (using nextPageToken cursor)
do {
    // Build request body for POST (cursor-based pagination)
    $requestData = [
        'jql' => $jql,
        'maxResults' => $maxResults,
        'fields' => ['*all'], // Request all fields
        'expand' => 'renderedFields' // Also get rendered HTML content for custom fields
    ];
    
    // Add nextPageToken if we have one (for subsequent pages)
    if ($nextPageToken !== null) {
        $requestData['nextPageToken'] = $nextPageToken;
    }
    
    $postBody = json_encode($requestData);

    // Make CURL request to JIRA with POST method (required for /search/jql)
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true); // POST method required!
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postBody); // Send JSON body
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Basic ' . base64_encode($config['jira_email'] . ':' . $config['jira_api_token']),
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 120);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    // Check for connection errors
    if ($curlError) {
        logSecurityEvent($conn, 'sync_failed', 'JIRA connection error: ' . $curlError, $clientIP);
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Connection error: ' . $curlError]);
        exit;
    }

    // Check for HTTP errors
    if ($httpCode < 200 || $httpCode >= 300) {
        $responseData = json_decode($response, true);
        $errorMsg = 'Unknown error';
        
        if ($responseData) {
            $errorMsg = $responseData['errorMessages'][0] ?? $responseData['message'] ?? 'HTTP ' . $httpCode;
        }
        
        logSecurityEvent($conn, 'sync_failed', 'JIRA sync failed (HTTP ' . $httpCode . '): ' . $errorMsg, $clientIP);
        header('Content-Type: application/json');
        http_response_code($httpCode);
        echo json_encode(['success' => false, 'error' => 'Failed to sync from JIRA (HTTP ' . $httpCode . '): ' . $errorMsg]);
        exit;
    }

    // Parse response
    $responseData = json_decode($response, true);
    if (!$responseData) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON response from JIRA']);
        exit;
    }

    $batchIssues = $responseData['issues'] ?? [];
    
    // Get nextPageToken for cursor-based pagination
    $nextPageToken = $responseData['nextPageToken'] ?? null;
    $isLast = $responseData['isLast'] ?? true;
    
    // Cache stories immediately (instead of storing in memory)
    $batchSynced = 0;
    foreach ($batchIssues as $issue) {
        try {
            if (cacheJiraIssue($conn, $issue)) {
                $batchSynced++;
                $totalSynced++;
            }
        } catch (Exception $e) {
            $issueKey = $issue['key'] ?? 'unknown';
            $totalErrors[] = ['key' => $issueKey, 'error' => $e->getMessage()];
            logSecurityEvent($conn, 'sync_cache_error', 'Failed to cache story ' . $issueKey . ': ' . $e->getMessage(), $clientIP);
        }
    }
    
    // Clear batch from memory
    unset($batchIssues);
    
    // Check if this is the last page (cursor pagination)
    if ($isLast || $nextPageToken === null) {
        break;
    }
    
    // Safety check: stop if this batch had no issues
    if ($batchSynced === 0) {
        break;
    }
    
    // Continue to next page using the nextPageToken cursor
    
    // Safety check: max 100,000 stories to avoid infinite loops
    if ($totalSynced >= 100000) {
        logSecurityEvent($conn, 'sync_limit_reached', 'Reached maximum sync limit of 100,000 stories', $clientIP);
        break;
    }
    
    unset($responseData);
    
    // Small delay to avoid rate limiting
    usleep(100000); // 0.1 second
    
} while (true);

// Log the sync operation
logSecurityEvent($conn, 'sync_success', 'Synced ' . $totalSynced . ' stories from JIRA', $clientIP);
auditJiraOperation($conn, 'sync', 'stories', null, null, $clientIP, [
    'jql' => maskSensitiveData($jql),
    'synced' => $totalSynced,
    'total' => $totalAvailable ?? $totalSynced,
    'errors_count' => count($totalErrors)
]);

// Return success response
header('Content-Type: application/json');
http_response_code(200);
echo json_encode([
    'success' => true,
    'data' => [
        'synced' => $totalSynced,
        'total' => $totalAvailable ?? $totalSynced,
        'errors' => $totalErrors
    ],
    'message' => 'Synced ' . $totalSynced . ' of ' . ($totalAvailable ?? $totalSynced) . ' stories from JIRA'
]);

// ===== HELPER FUNCTIONS =====

/**
 * Cache a single JIRA issue in the database
 */
function cacheJiraIssue($conn, $issue) {
    // Validate issue structure
    if (!isset($issue['key']) || empty($issue['key'])) {
        throw new Exception('Invalid issue structure: missing key');
    }
    
    if (!isset($issue['fields']) || !is_array($issue['fields'])) {
        throw new Exception('Invalid issue structure: missing fields');
    }
    
    $key = $issue['key'];
    $fields = $issue['fields'];
    $renderedFields = $issue['renderedFields'] ?? [];
    
    // Extract fields
    $projectKey = $fields['project']['key'] ?? '';
    $issueType = $fields['issuetype']['name'] ?? '';
    $summary = $fields['summary'] ?? '';
    
    // Handle description (JIRA API v3 returns structured content)
    $description = '';
    if (isset($fields['description'])) {
        if (is_string($fields['description'])) {
            $description = $fields['description'];
        } elseif (is_array($fields['description'])) {
            $description = extractTextFromDescription($fields['description']);
        }
    }
    
    // Extract acceptance criteria from rendered fields (HTML)
    // Look for common acceptance criteria field IDs
    $acceptanceCriteriaFieldIds = ['customfield_10104', 'customfield_10411', 'customfield_10008', 'customfield_10007'];
    $acExtracted = false;
    foreach ($acceptanceCriteriaFieldIds as $fieldId) {
        if (isset($renderedFields[$fieldId]) && !empty($renderedFields[$fieldId])) {
            // Strip HTML tags to get plain text
            $acHtml = $renderedFields[$fieldId];
            $acText = strip_tags($acHtml);
            $acText = html_entity_decode($acText, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $acText = trim($acText);
            
            if (!empty($acText) && strlen($acText) > 10) {
                // Store it back in the fields array so it gets saved in custom_fields JSON
                $fields[$fieldId] = $acText;
                error_log("SYNC: Extracted AC for $key from $fieldId: " . substr($acText, 0, 100));
                $acExtracted = true;
                break;
            }
        }
    }
    
    if (!$acExtracted && count($renderedFields) > 0) {
        error_log("SYNC: No AC extracted for $key, renderedFields keys: " . implode(', ', array_keys($renderedFields)));
    } elseif (!$acExtracted) {
        error_log("SYNC: No renderedFields returned for $key");
    }
    
    $status = $fields['status']['name'] ?? '';
    $assignee = $fields['assignee']['displayName'] ?? null;
    $reporter = $fields['reporter']['displayName'] ?? null;
    $priority = $fields['priority']['name'] ?? null;
    $labels = json_encode($fields['labels'] ?? []);
    
    // Handle sprint field - try common custom field IDs
    $sprint = null;
    $sprintFieldIds = ['customfield_10103', 'sprint', 'customfield_10020', 'customfield_10018'];
    foreach ($sprintFieldIds as $fieldId) {
        if (isset($fields[$fieldId]) && !empty($fields[$fieldId])) {
            if (is_array($fields[$fieldId]) && !empty($fields[$fieldId])) {
                $sprintArray = $fields[$fieldId];
                
                // Find active sprint first
                foreach (array_reverse($sprintArray) as $sprintObj) {
                    if (is_array($sprintObj) && isset($sprintObj['name']) && isset($sprintObj['state'])) {
                        if ($sprintObj['state'] === 'active') {
                            $sprint = $sprintObj['name'];
                            break 2;
                        }
                    }
                }
                
                // Get last sprint if no active sprint
                $lastSprint = end($sprintArray);
                if (is_array($lastSprint) && isset($lastSprint['name'])) {
                    $sprint = $lastSprint['name'];
                    break;
                } elseif (is_string($lastSprint)) {
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
    
    // Handle story points - try common custom field IDs
    $storyPoints = null;
    $storyPointsFieldIds = ['customfield_10414', 'customfield_10016', 'customfield_10026', 'customfield_10004'];
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
    
    // Insert or update in database
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

/**
 * Extract text from JIRA's Atlassian Document Format (ADF)
 */
function extractTextFromDescription($description) {
    if (is_string($description)) {
        return $description;
    }
    
    if (!is_array($description)) {
        return '';
    }
    
    $text = [];
    
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
