<?php
/**
 * JIRA Configuration API
 * Handles JIRA connection settings and configuration
 */

require_once '../Database/config.php';
require_once __DIR__ . '/security.php';

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

// Check IP whitelist
if (!checkIPWhitelist($conn, $clientIP)) {
    logSecurityEvent($conn, 'ip_blocked', 'Access denied from IP: ' . $clientIP, $clientIP);
    sendError('Access denied', 403);
}

// Check rate limit
if (!checkRateLimit($conn, $clientIP)) {
    logSecurityEvent($conn, 'rate_limit_exceeded', 'Rate limit exceeded for IP: ' . $clientIP, $clientIP);
    sendError('Too many requests. Please try again later.', 429);
}

// Set security headers
setSecurityHeaders();

// Only run routing if this file is being accessed directly (not included)
if (basename($_SERVER['SCRIPT_NAME']) === 'config.api.php') {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_REQUEST['action'] ?? '';

    // Special action to get current IP (no CSRF needed)
    if ($action === 'getCurrentIP') {
        $isLocalhost = ($clientIP === '127.0.0.1' || $clientIP === '::1' || $clientIP === 'localhost');
        
        $response = [
            'success' => true,
            'ip' => $clientIP,
            'isLocalhost' => $isLocalhost
        ];
        
        // If localhost, try to get public IP
        if ($isLocalhost) {
            // Try to get public IP from external service
            $publicIP = @file_get_contents('https://api.ipify.org?format=text');
            if ($publicIP !== false && filter_var($publicIP, FILTER_VALIDATE_IP)) {
                $response['publicIP'] = trim($publicIP);
            }
        }
        
        echo json_encode($response);
        exit;
    }

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
            getJiraConfig($conn);
            break;
        case 'POST':
            saveJiraConfig($conn);
            break;
        case 'PUT':
            updateJiraConfig($conn);
            break;
        case 'DELETE':
            deleteJiraConfig($conn);
            break;
        default:
            sendError('Method not allowed', 405);
    }
}

// Get JIRA configuration
function getJiraConfig($conn) {
    global $clientIP;
    
    $sql = "SELECT id, jira_url, jira_email, jira_project_key, is_active, created_at, modified_at, last_used_at 
            FROM jira_config WHERE is_active = TRUE ORDER BY id DESC LIMIT 1";
    $result = $conn->query($sql);
    
    if (!$result) {
        logSecurityEvent($conn, 'config_fetch_error', 'Failed to fetch JIRA config', $clientIP);
        sendError('Failed to fetch JIRA config: ' . $conn->error, 500);
    }
    
    $config = $result->fetch_assoc();
    
    if (!$config) {
        // Return empty config if none exists
        sendSuccess([
            'jira_url' => '',
            'jira_email' => '',
            'jira_project_key' => '',
            'is_configured' => false
        ]);
        return;
    }
    
    // Check token expiration (90 days)
    if (!checkTokenExpiration($config['modified_at'])) {
        logSecurityEvent($conn, 'token_expired', 'JIRA API token has expired', $clientIP);
        $config['token_expired'] = true;
    }
    
    $config['is_configured'] = true;
    // Don't send API token to frontend for security
    unset($config['jira_api_token']);
    
    // Audit log
    auditJiraOperation($conn, 'read', 'config', $config['id'], null, $clientIP);
    
    sendSuccess($config);
}

// Save new JIRA configuration
function saveJiraConfig($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    
    // Sanitize and validate inputs
    $jira_url = sanitizeInput($data['jira_url'] ?? '', 'url');
    $jira_email = sanitizeInput($data['jira_email'] ?? '', 'email');
    $jira_api_token = $data['jira_api_token'] ?? '';
    $jira_project_key = sanitizeInput($data['jira_project_key'] ?? '', 'string');
    
    if (empty($jira_url) || empty($jira_email) || empty($jira_api_token)) {
        logSecurityEvent($conn, 'invalid_input', 'Missing required fields for JIRA config', $clientIP);
        sendError('JIRA URL, email, and API token are required');
    }
    
    // Validate JIRA URL format
    if (!validateJiraUrl($jira_url)) {
        logSecurityEvent($conn, 'invalid_url', 'Invalid JIRA URL format: ' . maskSensitiveData($jira_url), $clientIP);
        sendError('Invalid JIRA URL. Must be HTTPS and a valid domain.');
    }
    
    // Test connection before saving
    $testResult = testJiraConnection($jira_url, $jira_email, $jira_api_token, $conn);
    if (!$testResult['success']) {
        logSecurityEvent($conn, 'connection_test_failed', 'JIRA connection test failed for URL: ' . maskSensitiveData($jira_url), $clientIP);
        sendError('JIRA connection test failed: ' . $testResult['error']);
    }
    
    // Encrypt API token before storing
    $encrypted_token = encryptData($jira_api_token);
    if (!$encrypted_token) {
        logSecurityEvent($conn, 'encryption_failed', 'Failed to encrypt API token', $clientIP);
        sendError('Failed to encrypt API token', 500);
    }
    
    // Deactivate all existing configs
    $conn->query("UPDATE jira_config SET is_active = FALSE");
    
    // Insert new config with encrypted token
    $stmt = $conn->prepare("INSERT INTO jira_config (jira_url, jira_email, jira_api_token, jira_project_key, is_active, created_by_ip) VALUES (?, ?, ?, ?, TRUE, ?)");
    $stmt->bind_param("sssss", $jira_url, $jira_email, $encrypted_token, $jira_project_key, $clientIP);
    
    if (!$stmt->execute()) {
        logSecurityEvent($conn, 'config_save_failed', 'Failed to save JIRA config: ' . $stmt->error, $clientIP);
        sendError('Failed to save JIRA config: ' . $stmt->error, 500);
    }
    
    $configId = $conn->insert_id;
    $stmt->close();
    
    // Audit log
    auditJiraOperation($conn, 'create', 'config', $configId, null, $clientIP, [
        'jira_url' => maskSensitiveData($jira_url),
        'jira_email' => maskSensitiveData($jira_email),
        'jira_project_key' => $jira_project_key
    ]);
    
    logSecurityEvent($conn, 'config_created', 'JIRA configuration created successfully', $clientIP);
    sendSuccess(['id' => $configId], 'JIRA configuration saved successfully');
}

// Update existing JIRA configuration
function updateJiraConfig($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    
    $id = sanitizeInput($data['id'] ?? null, 'int');
    $jira_url = sanitizeInput($data['jira_url'] ?? '', 'url');
    $jira_email = sanitizeInput($data['jira_email'] ?? '', 'email');
    $jira_api_token = $data['jira_api_token'] ?? null;
    $jira_project_key = sanitizeInput($data['jira_project_key'] ?? '', 'string');
    
    if (!$id) {
        logSecurityEvent($conn, 'invalid_input', 'Missing config ID for update', $clientIP);
        sendError('Config ID is required');
    }
    
    if (empty($jira_url) || empty($jira_email)) {
        logSecurityEvent($conn, 'invalid_input', 'Missing required fields for JIRA config update', $clientIP);
        sendError('JIRA URL and email are required');
    }
    
    // Validate JIRA URL format
    if (!validateJiraUrl($jira_url)) {
        logSecurityEvent($conn, 'invalid_url', 'Invalid JIRA URL format during update: ' . maskSensitiveData($jira_url), $clientIP);
        sendError('Invalid JIRA URL. Must be HTTPS and a valid domain.');
    }
    
    $changes = [
        'jira_url' => maskSensitiveData($jira_url),
        'jira_email' => maskSensitiveData($jira_email),
        'jira_project_key' => $jira_project_key
    ];
    
    // Build update query based on whether API token is being updated
    if ($jira_api_token) {
        // Test connection with new token
        $testResult = testJiraConnection($jira_url, $jira_email, $jira_api_token, $conn);
        if (!$testResult['success']) {
            logSecurityEvent($conn, 'connection_test_failed', 'JIRA connection test failed during update', $clientIP);
            sendError('JIRA connection test failed: ' . $testResult['error']);
        }
        
        // Encrypt new API token
        $encrypted_token = encryptData($jira_api_token);
        if (!$encrypted_token) {
            logSecurityEvent($conn, 'encryption_failed', 'Failed to encrypt API token during update', $clientIP);
            sendError('Failed to encrypt API token', 500);
        }
        
        $stmt = $conn->prepare("UPDATE jira_config SET jira_url = ?, jira_email = ?, jira_api_token = ?, jira_project_key = ? WHERE id = ?");
        $stmt->bind_param("ssssi", $jira_url, $jira_email, $encrypted_token, $jira_project_key, $id);
        $changes['api_token'] = 'updated';
    } else {
        $stmt = $conn->prepare("UPDATE jira_config SET jira_url = ?, jira_email = ?, jira_project_key = ? WHERE id = ?");
        $stmt->bind_param("sssi", $jira_url, $jira_email, $jira_project_key, $id);
    }
    
    if (!$stmt->execute()) {
        logSecurityEvent($conn, 'config_update_failed', 'Failed to update JIRA config: ' . $stmt->error, $clientIP);
        sendError('Failed to update JIRA config: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    
    // Audit log
    auditJiraOperation($conn, 'update', 'config', $id, null, $clientIP, $changes);
    
    logSecurityEvent($conn, 'config_updated', 'JIRA configuration updated successfully', $clientIP);
    sendSuccess([], 'JIRA configuration updated successfully');
}

// Delete JIRA configuration
function deleteJiraConfig($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    $id = sanitizeInput($data['id'] ?? null, 'int');
    
    if (!$id) {
        logSecurityEvent($conn, 'invalid_input', 'Missing config ID for delete', $clientIP);
        sendError('Config ID is required');
    }
    
    // Fetch config before deletion for audit log
    $stmt = $conn->prepare("SELECT jira_url, jira_email FROM jira_config WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $config = $result->fetch_assoc();
    $stmt->close();
    
    if (!$config) {
        logSecurityEvent($conn, 'config_not_found', 'Attempted to delete non-existent config ID: ' . $id, $clientIP);
        sendError('Configuration not found', 404);
    }
    
    // Delete config
    $stmt = $conn->prepare("DELETE FROM jira_config WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if (!$stmt->execute()) {
        logSecurityEvent($conn, 'config_delete_failed', 'Failed to delete JIRA config: ' . $stmt->error, $clientIP);
        sendError('Failed to delete JIRA config: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    
    // Audit log
    auditJiraOperation($conn, 'delete', 'config', $id, null, $clientIP, [
        'jira_url' => maskSensitiveData($config['jira_url']),
        'jira_email' => maskSensitiveData($config['jira_email'])
    ]);
    
    logSecurityEvent($conn, 'config_deleted', 'JIRA configuration deleted successfully', $clientIP);
    sendSuccess([], 'JIRA configuration deleted successfully');
}

// Test JIRA connection
function testJiraConnection($url, $email, $token, $conn = null) {
    if ($conn === null) {
        global $conn;
    }
    global $clientIP;
    
    // Remove trailing slash from URL
    $url = rtrim($url, '/');
    
    // Test endpoint: Get current user
    $endpoint = $url . '/rest/api/3/myself';
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Basic ' . base64_encode($email . ':' . $token),
        'Content-Type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        logSecurityEvent($conn, 'connection_error', 'JIRA connection error: ' . $error . ' for URL: ' . maskSensitiveData($url), $clientIP);
        return ['success' => false, 'error' => 'Connection error: ' . $error];
    }
    
    if ($httpCode !== 200) {
        logSecurityEvent($conn, 'auth_failed', 'JIRA authentication failed (HTTP ' . $httpCode . ') for URL: ' . maskSensitiveData($url), $clientIP);
        
        // Increment failed attempts
        $stmt = $conn->prepare("UPDATE jira_config SET failed_attempts = failed_attempts + 1 WHERE jira_url = ? AND is_active = TRUE");
        $stmt->bind_param("s", $url);
        $stmt->execute();
        $stmt->close();
        
        return ['success' => false, 'error' => 'HTTP ' . $httpCode . ': Authentication failed'];
    }
    
    // Reset failed attempts on success
    $stmt = $conn->prepare("UPDATE jira_config SET failed_attempts = 0, last_used_at = NOW() WHERE jira_url = ? AND is_active = TRUE");
    $stmt->bind_param("s", $url);
    $stmt->execute();
    $stmt->close();
    
    return ['success' => true, 'data' => json_decode($response, true)];
}

/**
 * Get active JIRA configuration with decrypted API token (for internal use only)
 * This function should never send decrypted token to frontend
 */
function getDecryptedJiraConfig($conn) {
    global $clientIP;
    
    $sql = "SELECT id, jira_url, jira_email, jira_api_token, jira_project_key, last_used_at, modified_at, failed_attempts, locked_until
            FROM jira_config WHERE is_active = TRUE ORDER BY id DESC LIMIT 1";
    $result = $conn->query($sql);
    
    if (!$result) {
        logSecurityEvent($conn, 'config_fetch_error', 'Failed to fetch JIRA config for decryption', $clientIP);
        return null;
    }
    
    $config = $result->fetch_assoc();
    
    if (!$config) {
        return null;
    }
    
    // Check if account is locked due to failed attempts
    if ($config['locked_until'] && strtotime($config['locked_until']) > time()) {
        logSecurityEvent($conn, 'account_locked', 'Attempted to use locked JIRA config', $clientIP);
        return null;
    }
    
    // Lock account if too many failed attempts
    if ($config['failed_attempts'] >= 5) {
        $lockUntil = date('Y-m-d H:i:s', strtotime('+30 minutes'));
        $stmt = $conn->prepare("UPDATE jira_config SET locked_until = ? WHERE id = ?");
        $stmt->bind_param("si", $lockUntil, $config['id']);
        $stmt->execute();
        $stmt->close();
        
        logSecurityEvent($conn, 'account_locked', 'JIRA config locked due to failed attempts', $clientIP);
        return null;
    }
    
    // Check token expiration
    if (!checkTokenExpiration($config['modified_at'])) {
        logSecurityEvent($conn, 'token_expired', 'JIRA API token has expired (last modified: ' . $config['modified_at'] . ')', $clientIP);
        return null;
    }
    
    // Decrypt API token
    $decrypted_token = decryptData($config['jira_api_token']);
    if (!$decrypted_token) {
        logSecurityEvent($conn, 'decryption_failed', 'Failed to decrypt JIRA API token', $clientIP);
        return null;
    }
    
    $config['jira_api_token'] = $decrypted_token;
    
    // Update last used timestamp
    $stmt = $conn->prepare("UPDATE jira_config SET last_used_at = NOW() WHERE id = ?");
    $stmt->bind_param("i", $config['id']);
    $stmt->execute();
    $stmt->close();
    
    return $config;
}
