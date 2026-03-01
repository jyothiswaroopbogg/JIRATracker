<?php
/**
 * JIRA Test Connection API
 * Tests JIRA connection without saving configuration
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

$method = $_SERVER['REQUEST_METHOD'];

// CSRF token validation
if ($method !== 'GET') {
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!verifyCSRFToken($conn, $csrfToken, $clientIP)) {
        logSecurityEvent($conn, 'csrf_validation_failed', 'Invalid CSRF token from IP: ' . $clientIP, $clientIP);
        sendError('Invalid security token', 403);
    }
}

if ($method === 'POST') {
    testJiraConnectionOnly($conn);
} else {
    sendError('Method not allowed', 405);
}

/**
 * Test JIRA connection without saving
 */
function testJiraConnectionOnly($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    
    // Check if testing saved config or new credentials
    $useSavedConfig = $data['use_saved'] ?? false;
    
    if ($useSavedConfig) {
        // Test using saved configuration
        $config = getDecryptedJiraConfig($conn);
        
        if (!$config) {
            logSecurityEvent($conn, 'test_failed', 'No active JIRA configuration found for testing', $clientIP);
            sendError('No active JIRA configuration found. Please save your configuration first.');
        }
        
        $url = $config['jira_url'];
        $email = $config['jira_email'];
        $token = $config['jira_api_token'];
    } else {
        // Test using provided credentials (without saving)
        $url = sanitizeInput($data['jira_url'] ?? '', 'url');
        $email = sanitizeInput($data['jira_email'] ?? '', 'email');
        $token = $data['jira_api_token'] ?? '';
        
        if (empty($url) || empty($email) || empty($token)) {
            logSecurityEvent($conn, 'invalid_input', 'Missing required fields for JIRA connection test', $clientIP);
            sendError('JIRA URL, email, and API token are required');
        }
        
        // Validate JIRA URL format
        if (!validateJiraUrl($url)) {
            logSecurityEvent($conn, 'invalid_url', 'Invalid JIRA URL format: ' . maskSensitiveData($url), $clientIP);
            sendError('Invalid JIRA URL. Must be HTTPS and a valid domain.');
        }
    }
    
    // Perform connection test
    $testResult = testJiraConnection($url, $email, $token, $conn);
    
    if ($testResult['success']) {
        logSecurityEvent($conn, 'test_success', 'JIRA connection test successful', $clientIP);
        
        $userData = $testResult['data'] ?? [];
        $response = [
            'connection' => 'successful',
            'user' => $userData['displayName'] ?? 'Unknown',
            'email' => $userData['emailAddress'] ?? $email
        ];
        
        sendSuccess($response, 'JIRA connection test passed');
    } else {
        logSecurityEvent($conn, 'test_failed', 'JIRA connection test failed: ' . $testResult['error'], $clientIP);
        sendError('Connection test failed: ' . $testResult['error']);
    }
}

/**
 * Test JIRA connection
 */
function testJiraConnection($url, $email, $token, $conn) {
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
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
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
    
    if ($httpCode === 401) {
        return ['success' => false, 'error' => 'Authentication failed. Please check your email and API token.'];
    }
    
    if ($httpCode === 403) {
        return ['success' => false, 'error' => 'Access forbidden. Check your JIRA permissions.'];
    }
    
    if ($httpCode === 404) {
        return ['success' => false, 'error' => 'JIRA instance not found. Check your URL.'];
    }
    
    if ($httpCode !== 200) {
        return ['success' => false, 'error' => 'HTTP ' . $httpCode . ': ' . ($response ?: 'Unknown error')];
    }
    
    $userData = json_decode($response, true);
    return ['success' => true, 'data' => $userData];
}

/**
 * Get active JIRA configuration with decrypted API token
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
    
    // Check if account is locked
    if ($config['locked_until'] && strtotime($config['locked_until']) > time()) {
        logSecurityEvent($conn, 'account_locked', 'Attempted to use locked JIRA config', $clientIP);
        return null;
    }
    
    // Decrypt API token
    $decrypted_token = decryptData($config['jira_api_token']);
    if (!$decrypted_token) {
        logSecurityEvent($conn, 'decryption_failed', 'Failed to decrypt JIRA API token', $clientIP);
        return null;
    }
    
    $config['jira_api_token'] = $decrypted_token;
    
    return $config;
}
