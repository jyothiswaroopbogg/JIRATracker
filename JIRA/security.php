<?php
/**
 * JIRA Security Helper
 * Advanced security functions for JIRA integration
 * Implements encryption, rate limiting, CSRF protection, and audit logging
 */

// Security Configuration
define('JIRA_ENCRYPTION_METHOD', 'AES-256-CBC');
define('JIRA_MAX_REQUESTS_PER_MINUTE', 30);
define('JIRA_MAX_REQUESTS_PER_HOUR', 500);
define('JIRA_TOKEN_EXPIRY_DAYS', 90);
define('JIRA_SESSION_TIMEOUT', 3600); // 1 hour

/**
 * Get or generate encryption key
 * Stores key securely in settings table
 */
function getEncryptionKey($conn) {
    static $key = null;
    
    if ($key !== null) {
        return $key;
    }
    
    // Try to get existing key
    $sql = "SELECT setting_value FROM settings WHERE setting_key = 'jira_encryption_key' LIMIT 1";
    $result = $conn->query($sql);
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $key = json_decode($row['setting_value'], true);
        return $key;
    }
    
    // Generate new key if not exists
    $key = base64_encode(random_bytes(32));
    
    // Save to database
    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('jira_encryption_key', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $keyJson = json_encode($key);
    $stmt->bind_param("ss", $keyJson, $keyJson);
    $stmt->execute();
    $stmt->close();
    
    return $key;
}

/**
 * Encrypt sensitive data (API tokens)
 */
function encryptData($data, $conn = null) {
    if (empty($data)) {
        return '';
    }
    
    if ($conn === null) {
        global $conn;
    }
    
    $key = base64_decode(getEncryptionKey($conn));
    $iv = random_bytes(openssl_cipher_iv_length(JIRA_ENCRYPTION_METHOD));
    
    $encrypted = openssl_encrypt($data, JIRA_ENCRYPTION_METHOD, $key, 0, $iv);
    
    // Combine IV and encrypted data
    return base64_encode($iv . '::' . $encrypted);
}

/**
 * Decrypt sensitive data (API tokens)
 */
function decryptData($encryptedData, $conn = null) {
    if (empty($encryptedData)) {
        return '';
    }
    
    if ($conn === null) {
        global $conn;
    }
    
    $key = base64_decode(getEncryptionKey($conn));
    $parts = explode('::', base64_decode($encryptedData));
    
    if (count($parts) !== 2) {
        error_log('JIRA Security: Invalid encrypted data format');
        return '';
    }
    
    list($iv, $encrypted) = $parts;
    
    return openssl_decrypt($encrypted, JIRA_ENCRYPTION_METHOD, $key, 0, $iv);
}

/**
 * Rate limiting check
 * Prevents API abuse
 */
function checkRateLimit($conn, $identifier = null, $perMinute = null, $perHour = null) {
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'jira_rate_limit'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        // Table doesn't exist, allow access (no rate limiting)
        return true;
    }
    
    if ($identifier === null) {
        $identifier = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    if ($perMinute === null) {
        $perMinute = JIRA_MAX_REQUESTS_PER_MINUTE;
    }
    
    if ($perHour === null) {
        $perHour = JIRA_MAX_REQUESTS_PER_HOUR;
    }
    
    $now = time();
    $minuteAgo = $now - 60;
    $hourAgo = $now - 3600;
    
    // Clean old entries
    $stmt = $conn->prepare("DELETE FROM jira_rate_limit WHERE timestamp < ?");
    $stmt->bind_param("i", $hourAgo);
    $stmt->execute();
    $stmt->close();
    
    // Check minute limit
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM jira_rate_limit WHERE identifier = ? AND timestamp > ?");
    $stmt->bind_param("si", $identifier, $minuteAgo);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $minuteCount = $row['count'];
    $stmt->close();
    
    if ($minuteCount >= $perMinute) {
        logSecurityEvent($conn, 'rate_limit_exceeded', 'Rate limit exceeded: minute', $identifier);
        return false;
    }
    
    // Check hour limit
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM jira_rate_limit WHERE identifier = ? AND timestamp > ?");
    $stmt->bind_param("si", $identifier, $hourAgo);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $hourCount = $row['count'];
    $stmt->close();
    
    if ($hourCount >= $perHour) {
        logSecurityEvent($conn, 'rate_limit_exceeded', 'Rate limit exceeded: hour', $identifier);
        return false;
    }
    
    // Record this request
    $stmt = $conn->prepare("INSERT INTO jira_rate_limit (identifier, timestamp) VALUES (?, ?)");
    $stmt->bind_param("si", $identifier, $now);
    $stmt->execute();
    $stmt->close();
    
    return true;
}

/**
 * Generate CSRF token
 */
function generateCSRFToken($conn, $ipAddress = null) {
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'jira_csrf_tokens'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        // Table doesn't exist, return a basic token without storing
        return bin2hex(random_bytes(32));
    }
    
    $token = bin2hex(random_bytes(32));
    $expiresAt = time() + JIRA_SESSION_TIMEOUT;
    
    // Store in database
    $stmt = $conn->prepare("INSERT INTO jira_csrf_tokens (token, expires_at, created_by_ip) VALUES (?, ?, ?)");
    $ip = $ipAddress ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $stmt->bind_param("sis", $token, $expiresAt, $ip);
    $stmt->execute();
    $stmt->close();
    
    // Clean expired tokens
    $now = time();
    $conn->query("DELETE FROM jira_csrf_tokens WHERE expires_at < $now");
    
    return $token;
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken($conn, $token, $ipAddress = null) {
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'jira_csrf_tokens'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        // Table doesn't exist, allow access (no CSRF protection)
        return true;
    }
    
    if (empty($token)) {
        logSecurityEvent($conn, 'csrf_missing', 'CSRF token missing');
        return false;
    }
    
    $now = time();
    $ip = $ipAddress ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    $stmt = $conn->prepare("SELECT id, created_by_ip FROM jira_csrf_tokens WHERE token = ? AND expires_at > ? LIMIT 1");
    $stmt->bind_param("si", $token, $now);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        $stmt->close();
        logSecurityEvent($conn, 'csrf_invalid', 'Invalid or expired CSRF token', $token);
        return false;
    }
    
    $row = $result->fetch_assoc();
    $stmt->close();
    
    // Verify IP matches (optional but recommended)
    if ($row['created_by_ip'] !== $ip) {
        logSecurityEvent($conn, 'csrf_ip_mismatch', "CSRF token IP mismatch: {$row['created_by_ip']} vs $ip", $token);
        return false;
    }
    
    // Delete used token (one-time use)
    $stmt = $conn->prepare("DELETE FROM jira_csrf_tokens WHERE token = ?");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $stmt->close();
    
    return true;
}

/**
 * Input validation and sanitization
 */
function sanitizeInput($input, $type = 'string') {
    if ($input === null) {
        return null;
    }
    
    switch ($type) {
        case 'url':
            $input = filter_var($input, FILTER_SANITIZE_URL);
            if (!filter_var($input, FILTER_VALIDATE_URL)) {
                return false;
            }
            // Ensure HTTPS
            if (strpos($input, 'https://') !== 0) {
                return false;
            }
            break;
            
        case 'email':
            $input = filter_var($input, FILTER_SANITIZE_EMAIL);
            if (!filter_var($input, FILTER_VALIDATE_EMAIL)) {
                return false;
            }
            break;
            
        case 'int':
            $input = filter_var($input, FILTER_SANITIZE_NUMBER_INT);
            if (!filter_var($input, FILTER_VALIDATE_INT)) {
                return false;
            }
            break;
            
        case 'jql':
            // For JQL queries, only strip tags but preserve quotes and special chars
            // since they're needed for JQL syntax. JSON encoding will handle escaping.
            $input = strip_tags($input);
            // Remove null bytes and control characters for security
            $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input);
            break;
            
        case 'string':
        default:
            $input = strip_tags($input);
            $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
            break;
    }
    
    return $input;
}

/**
 * Validate JIRA URL
 */
function validateJiraUrl($url) {
    // Must be HTTPS
    if (strpos($url, 'https://') !== 0) {
        return false;
    }
    
    // Must be valid URL
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        return false;
    }
    
    // Check for common JIRA domains
    $parsed = parse_url($url);
    $host = $parsed['host'] ?? '';
    
    // Allow atlassian.net domain or custom domains
    if (strpos($host, 'atlassian.net') === false) {
        // Allow custom domains but log for review
        error_log("JIRA Security: Custom domain detected: $host");
    }
    
    return true;
}

/**
 * Check IP whitelist
 */
function checkIPWhitelist($conn, $ip = null) {
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'jira_ip_whitelist'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        // Table doesn't exist, allow access (no IP filtering)
        return true;
    }
    
    if ($ip === null) {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    // Check if IP whitelisting is enabled
    $sql = "SELECT setting_value FROM settings WHERE setting_key = 'jira_ip_whitelist_enabled' LIMIT 1";
    $result = $conn->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        return true; // Whitelist not enabled
    }
    
    $row = $result->fetch_assoc();
    $enabled = json_decode($row['setting_value'], true);
    
    if (!$enabled) {
        return true;
    }
    
    // Get whitelist
    $sql = "SELECT ip_address FROM jira_ip_whitelist WHERE is_active = TRUE";
    $result = $conn->query($sql);
    
    if (!$result) {
        return true; // Error, allow access
    }
    
    while ($row = $result->fetch_assoc()) {
        if ($row['ip_address'] === $ip || $row['ip_address'] === '*') {
            return true;
        }
        
        // Support CIDR notation
        if (strpos($row['ip_address'], '/') !== false) {
            if (ipInRange($ip, $row['ip_address'])) {
                return true;
            }
        }
    }
    
    logSecurityEvent($conn, 'ip_blocked', "IP not in whitelist: $ip");
    return false;
}

/**
 * Check if IP is in CIDR range
 */
function ipInRange($ip, $cidr) {
    list($subnet, $mask) = explode('/', $cidr);
    
    $ip = ip2long($ip);
    $subnet = ip2long($subnet);
    $mask = -1 << (32 - $mask);
    
    return ($ip & $mask) == ($subnet & $mask);
}

/**
 * Check token expiration
 */
function checkTokenExpiration($modifiedAt, $configId = null) {
    if ($modifiedAt === null) {
        return false;
    }
    
    $lastModified = is_numeric($modifiedAt) ? $modifiedAt : strtotime($modifiedAt);
    $expiryDate = $lastModified + (JIRA_TOKEN_EXPIRY_DAYS * 24 * 60 * 60);
    
    if (time() > $expiryDate) {
        if ($configId) {
            error_log("JIRA Security: API token expired for config ID: $configId");
        }
        return false;
    }
    
    // Warn if expiring soon (within 7 days)
    $warnDate = $expiryDate - (7 * 24 * 60 * 60);
    if (time() > $warnDate) {
        $daysLeft = ceil(($expiryDate - time()) / (24 * 60 * 60));
        if ($configId) {
            error_log("JIRA Security: API token expiring in $daysLeft days for config ID: $configId");
        }
    }
    
    return true;
}

/**
 * Log security events
 */
function logSecurityEvent($conn, $eventType, $message, $ipAddress = null, $details = null) {
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'jira_security_log'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        // Table doesn't exist, only log to PHP error log
        $ip = $ipAddress ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        error_log("JIRA Security Event [$eventType]: $message (IP: $ip)");
        return;
    }
    
    $ip = $ipAddress ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    $requestUri = $_SERVER['REQUEST_URI'] ?? 'unknown';
    
    $detailsJson = json_encode([
        'details' => $details,
        'user_agent' => $userAgent,
        'request_uri' => $requestUri
    ]);
    
    $stmt = $conn->prepare("INSERT INTO jira_security_log (event_type, message, ip_address, details) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $eventType, $message, $ip, $detailsJson);
    $stmt->execute();
    $stmt->close();
    
    // Also log to PHP error log for critical events
    $criticalEvents = ['csrf_invalid', 'rate_limit_exceeded', 'ip_blocked', 'token_expired'];
    if (in_array($eventType, $criticalEvents)) {
        error_log("JIRA Security Event [$eventType]: $message (IP: $ip)");
    }
}

/**
 * Add security headers
 */
function addSecurityHeaders() {
    // Prevent clickjacking
    header('X-Frame-Options: DENY');
    
    // Prevent MIME sniffing
    header('X-Content-Type-Options: nosniff');
    
    // XSS Protection
    header('X-XSS-Protection: 1; mode=block');
    
    // Content Security Policy
    header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
    
    // Referrer Policy
    header('Referrer-Policy: strict-origin-when-cross-origin');
    
    // Feature Policy
    header("Permissions-Policy: geolocation=(), microphone=(), camera=()");
    
    // Strict Transport Security (HSTS)
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
    }
}

/**
 * Set security headers (wrapper for addSecurityHeaders)
 */
function setSecurityHeaders() {
    addSecurityHeaders();
}

/**
 * Mask sensitive data in logs
 */
function maskSensitiveData($data, $keysToMask = ['jira_api_token', 'api_token', 'password', 'token']) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            if (in_array($key, $keysToMask)) {
                $data[$key] = '***MASKED***';
            } elseif (is_array($value)) {
                $data[$key] = maskSensitiveData($value, $keysToMask);
            }
        }
    }
    
    return $data;
}

/**
 * Verify request origin
 */
function verifyRequestOrigin() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    
    // Allow same-origin requests
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $scheme = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $expectedOrigin = $scheme . '://' . $host;
    
    if ($origin !== $expectedOrigin && !empty($origin)) {
        return false;
    }
    
    return true;
}

/**
 * Get client fingerprint for additional security
 */
function getClientFingerprint() {
    $fingerprint = [
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'accept_language' => $_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? 'unknown',
        'accept_encoding' => $_SERVER['HTTP_ACCEPT_ENCODING'] ?? 'unknown'
    ];
    
    return hash('sha256', json_encode($fingerprint));
}

/**
 * Audit trail for JIRA operations
 */
function auditJiraOperation($conn, $operation, $entityType, $entityId, $userId = null, $ipAddress = null, $changes = null) {
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'jira_audit_log'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        // Table doesn't exist, skip audit logging
        return;
    }
    
    $userId = $userId ?? $_SESSION['user_id'] ?? 'system';
    $ip = $ipAddress ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $fingerprint = getClientFingerprint();
    
    $changesJson = json_encode(maskSensitiveData($changes ?? []));
    
    $stmt = $conn->prepare("INSERT INTO jira_audit_log (operation, entity_type, entity_id, user_id, ip_address, fingerprint, changes) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $operation, $entityType, $entityId, $userId, $ip, $fingerprint, $changesJson);
    $stmt->execute();
    $stmt->close();
}
