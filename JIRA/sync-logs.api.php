<?php
/**
 * JIRA Sync Logs API
 * Handles JIRA sync logs and history
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

switch ($method) {
    case 'GET':
        getSyncLogs($conn);
        break;
    case 'DELETE':
        clearSyncLogs($conn);
        break;
    default:
        sendError('Method not allowed', 405);
}

// Get sync logs
function getSyncLogs($conn) {
    global $clientIP;
    
    $limit = sanitizeInput($_GET['limit'] ?? 100, 'int');
    $syncType = sanitizeInput($_GET['sync_type'] ?? '', 'string');
    $status = sanitizeInput($_GET['status'] ?? '', 'string');
    
    // Limit max results
    if ($limit > 1000) {
        $limit = 1000;
    }
    
    $sql = "SELECT * FROM jira_sync_log";
    $whereConditions = [];
    
    if ($syncType) {
        $whereConditions[] = "sync_type = '" . $conn->real_escape_string($syncType) . "'";
    }
    
    if ($status) {
        $whereConditions[] = "status = '" . $conn->real_escape_string($status) . "'";
    }
    
    if (count($whereConditions) > 0) {
        $sql .= " WHERE " . implode(' AND ', $whereConditions);
    }
    
    $sql .= " ORDER BY created_at DESC LIMIT " . $limit;
    
    $result = $conn->query($sql);
    
    if (!$result) {
        logSecurityEvent($conn, 'sync_logs_fetch_failed', 'Failed to fetch sync logs: ' . $conn->error, $clientIP);
        sendError('Failed to fetch sync logs: ' . $conn->error, 500);
    }
    
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $row['sync_data'] = json_decode($row['sync_data'] ?? '{}', true);
        $logs[] = $row;
    }
    
    // Audit log
    auditJiraOperation($conn, 'read', 'sync_logs', null, null, $clientIP, [
        'count' => count($logs),
        'type' => $syncType,
        'status' => $status
    ]);
    
    sendSuccess(['logs' => $logs, 'count' => count($logs)]);
}

// Clear sync logs
function clearSyncLogs($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    $olderThan = sanitizeInput($data['older_than_days'] ?? 30, 'int');
    
    // Security: prevent deletion of recent logs
    if ($olderThan < 1) {
        sendError('Cannot delete logs newer than 1 day');
    }
    
    $stmt = $conn->prepare("DELETE FROM jira_sync_log WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)");
    $stmt->bind_param("i", $olderThan);
    
    if (!$stmt->execute()) {
        logSecurityEvent($conn, 'sync_logs_clear_failed', 'Failed to clear sync logs: ' . $stmt->error, $clientIP);
        sendError('Failed to clear sync logs: ' . $stmt->error, 500);
    }
    
    $deletedCount = $stmt->affected_rows;
    $stmt->close();
    
    // Audit log
    auditJiraOperation($conn, 'delete', 'sync_logs', null, null, $clientIP, [
        'deleted_count' => $deletedCount,
        'older_than_days' => $olderThan
    ]);
    
    logSecurityEvent($conn, 'sync_logs_cleared', 'Cleared ' . $deletedCount . ' sync log entries', $clientIP);
    sendSuccess(['deleted' => $deletedCount], 'Deleted ' . $deletedCount . ' log entries');
}
