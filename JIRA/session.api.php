<?php
/**
 * JIRA Session Management API
 * Manages session tokens for JIRA connections
 * Tracks connection state, session duration, and user activity
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

// CSRF token validation for non-GET requests
if ($method !== 'GET') {
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!verifyCSRFToken($conn, $csrfToken, $clientIP)) {
        logSecurityEvent($conn, 'csrf_validation_failed', 'Invalid CSRF token from IP: ' . $clientIP, $clientIP);
        sendError('Invalid security token', 403);
    }
}

// Route requests
if ($method === 'POST') {
    $data = getJsonInput();
    $action = $data['action'] ?? '';
    
    switch ($action) {
        case 'create':
            createSession($conn);
            break;
        case 'end':
            endSession($conn);
            break;
        case 'validate':
            validateSession($conn);
            break;
        default:
            sendError('Invalid action', 400);
    }
} elseif ($method === 'GET') {
    getActiveSession($conn);
} else {
    sendError('Method not allowed', 405);
}

/**
 * Create a new session when user connects
 */
function createSession($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    $userId = sanitizeInput($data['user_id'] ?? 'unknown', 'text');
    $fingerprint = getClientFingerprint();
    
    // Clean up any existing sessions for this user/IP
    cleanupExpiredSessions($conn);
    
    // End any existing active session for this user/fingerprint
    $stmt = $conn->prepare("UPDATE jira_session_tokens SET expires_at = ? WHERE fingerprint = ? AND ip_address = ? AND expires_at > ?");
    $now = time();
    $stmt->bind_param("issi", $now, $fingerprint, $clientIP, $now);
    $stmt->execute();
    $stmt->close();
    
    // Generate secure session token
    $token = bin2hex(random_bytes(64)); // 128 character token
    $expiresAt = time() + JIRA_SESSION_TIMEOUT; // 1 hour from now
    $lastActivity = time();
    
    // Insert new session
    $stmt = $conn->prepare("INSERT INTO jira_session_tokens (token, user_id, fingerprint, ip_address, expires_at, last_activity) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssii", $token, $userId, $fingerprint, $clientIP, $expiresAt, $lastActivity);
    
    if ($stmt->execute()) {
        $sessionId = $conn->insert_id;
        $stmt->close();
        
        // Log session creation
        logSecurityEvent($conn, 'session_created', "Session created for user: $userId", $clientIP, $fingerprint);
        auditJiraOperation($conn, 'session_create', 'session', $sessionId, $userId, $clientIP, [
            'action' => 'connect',
            'fingerprint' => $fingerprint
        ]);
        
        sendSuccess([
            'session_id' => $sessionId,
            'token' => $token,
            'expires_at' => $expiresAt,
            'user_id' => $userId
        ], 'Session created successfully');
    } else {
        $stmt->close();
        logSecurityEvent($conn, 'session_create_failed', "Failed to create session for user: $userId - " . $conn->error, $clientIP);
        sendError('Failed to create session', 500);
    }
}

/**
 * End an active session when user disconnects
 */
function endSession($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    $token = $data['token'] ?? '';
    $fingerprint = getClientFingerprint();
    
    if (empty($token)) {
        // End all sessions for this fingerprint/IP (soft disconnect)
        $stmt = $conn->prepare("SELECT id, user_id FROM jira_session_tokens WHERE fingerprint = ? AND ip_address = ? AND expires_at > ?");
        $now = time();
        $stmt->bind_param("ssi", $fingerprint, $clientIP, $now);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $sessionsEnded = 0;
        while ($session = $result->fetch_assoc()) {
            $sessionId = $session['id'];
            $userId = $session['user_id'];
            
            // Update session to mark as expired
            $updateStmt = $conn->prepare("UPDATE jira_session_tokens SET expires_at = ? WHERE id = ?");
            $updateStmt->bind_param("ii", $now, $sessionId);
            $updateStmt->execute();
            $updateStmt->close();
            
            // Audit log
            auditJiraOperation($conn, 'session_end', 'session', $sessionId, $userId, $clientIP, [
                'action' => 'disconnect',
                'reason' => 'user_initiated'
            ]);
            
            $sessionsEnded++;
        }
        
        $stmt->close();
        
        logSecurityEvent($conn, 'session_ended', "Ended $sessionsEnded session(s) for fingerprint", $clientIP, $fingerprint);
        sendSuccess(['sessions_ended' => $sessionsEnded], 'Session(s) ended successfully');
        
    } else {
        // End specific session by token
        $stmt = $conn->prepare("SELECT id, user_id FROM jira_session_tokens WHERE token = ? AND expires_at > ?");
        $now = time();
        $stmt->bind_param("si", $token, $now);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($session = $result->fetch_assoc()) {
            $sessionId = $session['id'];
            $userId = $session['user_id'];
            $stmt->close();
            
            // Update session to mark as expired
            $updateStmt = $conn->prepare("UPDATE jira_session_tokens SET expires_at = ? WHERE id = ?");
            $updateStmt->bind_param("ii", $now, $sessionId);
            $updateStmt->execute();
            $updateStmt->close();
            
            // Audit log
            auditJiraOperation($conn, 'session_end', 'session', $sessionId, $userId, $clientIP, [
                'action' => 'disconnect',
                'reason' => 'user_initiated',
                'token' => substr($token, 0, 10) . '...'
            ]);
            
            logSecurityEvent($conn, 'session_ended', "Session ended for user: $userId", $clientIP, $fingerprint);
            sendSuccess(['session_id' => $sessionId], 'Session ended successfully');
        } else {
            $stmt->close();
            sendError('Session not found or already expired', 404);
        }
    }
}

/**
 * Validate an active session
 */
function validateSession($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    $token = $data['token'] ?? '';
    $fingerprint = getClientFingerprint();
    
    if (empty($token)) {
        sendError('Session token required', 400);
    }
    
    // Clean up expired sessions
    cleanupExpiredSessions($conn);
    
    // Check if session is valid
    $stmt = $conn->prepare("SELECT id, user_id, expires_at, last_activity FROM jira_session_tokens WHERE token = ? AND fingerprint = ? AND ip_address = ? AND expires_at > ?");
    $now = time();
    $stmt->bind_param("sssi", $token, $fingerprint, $clientIP, $now);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($session = $result->fetch_assoc()) {
        $sessionId = $session['id'];
        $userId = $session['user_id'];
        $expiresAt = $session['expires_at'];
        $lastActivity = $session['last_activity'];
        $stmt->close();
        
        // Update last activity
        $newLastActivity = time();
        $updateStmt = $conn->prepare("UPDATE jira_session_tokens SET last_activity = ? WHERE id = ?");
        $updateStmt->bind_param("ii", $newLastActivity, $sessionId);
        $updateStmt->execute();
        $updateStmt->close();
        
        sendSuccess([
            'valid' => true,
            'session_id' => $sessionId,
            'user_id' => $userId,
            'expires_at' => $expiresAt,
            'last_activity' => $lastActivity
        ], 'Session is valid');
    } else {
        $stmt->close();
        sendSuccess(['valid' => false], 'Session is invalid or expired');
    }
}

/**
 * Get active session for current user
 */
function getActiveSession($conn) {
    global $clientIP;
    
    $fingerprint = getClientFingerprint();
    
    // Clean up expired sessions
    cleanupExpiredSessions($conn);
    
    // Get active session
    $stmt = $conn->prepare("SELECT id, token, user_id, expires_at, last_activity, created_at FROM jira_session_tokens WHERE fingerprint = ? AND ip_address = ? AND expires_at > ? ORDER BY created_at DESC LIMIT 1");
    $now = time();
    $stmt->bind_param("ssi", $fingerprint, $clientIP, $now);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($session = $result->fetch_assoc()) {
        $stmt->close();
        
        sendSuccess([
            'active' => true,
            'session_id' => $session['id'],
            'user_id' => $session['user_id'],
            'expires_at' => $session['expires_at'],
            'last_activity' => $session['last_activity'],
            'created_at' => $session['created_at']
        ], 'Active session found');
    } else {
        $stmt->close();
        sendSuccess(['active' => false], 'No active session');
    }
}

/**
 * Clean up expired sessions
 */
function cleanupExpiredSessions($conn) {
    $now = time();
    $stmt = $conn->prepare("DELETE FROM jira_session_tokens WHERE expires_at < ?");
    $stmt->bind_param("i", $now);
    $stmt->execute();
    $deletedRows = $stmt->affected_rows;
    $stmt->close();
    
    if ($deletedRows > 0) {
        logSecurityEvent($conn, 'sessions_cleaned', "Cleaned up $deletedRows expired session(s)", 'system');
    }
    
    return $deletedRows;
}
