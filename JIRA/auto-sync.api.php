<?php
/**
 * JIRA Auto-Sync API
 * Manages automatic synchronization settings and execution
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
$method = $_SERVER['REQUEST_METHOD'];
$action = sanitizeInput($_GET['action'] ?? '', 'string');

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

// CSRF token validation for non-GET requests
if ($method !== 'GET') {
    $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!verifyCSRFToken($conn, $csrfToken, $clientIP)) {
        logSecurityEvent($conn, 'csrf_validation_failed', 'Invalid CSRF token from IP: ' . $clientIP, $clientIP);
        sendError('Invalid security token', 403);
    }
}

// Route requests
switch ($action) {
    case 'get':
        getAutoSyncSettings($conn);
        break;
    case 'save':
        saveAutoSyncSettings($conn);
        break;
    case 'status':
        getAutoSyncStatus($conn);
        break;
    case 'start-run':
        startSyncRun($conn);
        break;
    case 'end-run':
        endSyncRun($conn);
        break;
    case 'get-runs':
        getSyncRuns($conn);
        break;
    default:
        sendError('Invalid action', 400);
}

/**
 * Get auto-sync settings
 */
function getAutoSyncSettings($conn) {
    global $clientIP;
    
    $sql = "SELECT * FROM jira_auto_sync_settings ORDER BY id DESC LIMIT 1";
    $result = $conn->query($sql);
    
    if (!$result) {
        // Table might not exist, return defaults
        sendSuccess([
            'enabled' => false,
            'mode' => 'interval',
            'sync_interval' => 3600,
            'schedule_type' => 'daily',
            'schedule_time' => '09:00',
            'schedule_day_of_week' => 1,
            'schedule_day_of_month' => 1,
            'schedule_month' => 0,
            'schedule_yearly_day' => 1,
            'last_run' => null,
            'next_run' => null
        ]);
        return;
    }
    
    $settings = $result->fetch_assoc();
    
    if (!$settings) {
        // No settings yet, return defaults
        sendSuccess([
            'enabled' => false,
            'mode' => 'interval',
            'sync_interval' => 3600,
            'schedule_type' => 'daily',
            'schedule_time' => '09:00',
            'schedule_day_of_week' => 1,
            'schedule_day_of_month' => 1,
            'schedule_month' => 0,
            'schedule_yearly_day' => 1,
            'last_run' => null,
            'next_run' => null
        ]);
        return;
    }
    
    // Audit log
    auditJiraOperation($conn, 'read', 'auto_sync_settings', $settings['id'], null, $clientIP);
    
    sendSuccess([
        'enabled' => (bool)$settings['enabled'],
        'mode' => $settings['mode'] ?? 'interval',
        'sync_interval' => (int)$settings['sync_interval'],
        'schedule_type' => $settings['schedule_type'] ?? 'daily',
        'schedule_time' => $settings['schedule_time'] ?? '09:00',
        'schedule_day_of_week' => (int)($settings['schedule_day_of_week'] ?? 1),
        'schedule_day_of_month' => (int)($settings['schedule_day_of_month'] ?? 1),
        'schedule_month' => (int)($settings['schedule_month'] ?? 0),
        'schedule_yearly_day' => (int)($settings['schedule_yearly_day'] ?? 1),
        'last_run' => $settings['last_run'],
        'next_run' => $settings['next_run']
    ]);
}

/**
 * Save auto-sync settings
 */
function saveAutoSyncSettings($conn) {
    global $clientIP;
    
    $data = getJsonInput();
    
    $enabled = isset($data['enabled']) ? (bool)$data['enabled'] : false;
    $mode = sanitizeInput($data['mode'] ?? 'interval', 'string');
    $syncInterval = sanitizeInput($data['sync_interval'] ?? 3600, 'int');
    $scheduleType = sanitizeInput($data['schedule_type'] ?? 'daily', 'string');
    $scheduleTime = sanitizeInput($data['schedule_time'] ?? '09:00', 'string');
    $scheduleDayOfWeek = sanitizeInput($data['schedule_day_of_week'] ?? 1, 'int');
    $scheduleDayOfMonth = sanitizeInput($data['schedule_day_of_month'] ?? 1, 'int');
    $scheduleMonth = sanitizeInput($data['schedule_month'] ?? 0, 'int');
    $scheduleYearlyDay = sanitizeInput($data['schedule_yearly_day'] ?? 1, 'int');
    $lastRun = isset($data['last_run']) ? sanitizeInput($data['last_run'], 'string') : null;
    $nextRun = isset($data['next_run']) ? sanitizeInput($data['next_run'], 'string') : null;
    
    // Validate interval (minimum 15 minutes = 900 seconds)
    if ($syncInterval < 900) {
        sendError('Sync interval must be at least 15 minutes (900 seconds)');
    }
    
    // Validate schedule parameters
    if (!in_array($mode, ['interval', 'scheduled'])) {
        sendError('Invalid mode. Must be interval or scheduled.');
    }
    
    if (!in_array($scheduleType, ['daily', 'weekly', 'monthly', 'yearly'])) {
        sendError('Invalid schedule type. Must be daily, weekly, monthly, or yearly.');
    }
    
    // Calculate next run time if not provided and enabled
    if ($enabled && !$nextRun) {
        if ($mode === 'interval') {
            $nextRun = date('Y-m-d H:i:s', time() + $syncInterval);
        } else {
            // For scheduled mode, we'll calculate it on the frontend
            $nextRun = null;
        }
    }
    
    // Check if settings exist
    $checkSql = "SELECT id FROM jira_auto_sync_settings LIMIT 1";
    $checkResult = $conn->query($checkSql);
    
    if ($checkResult && $checkResult->num_rows > 0) {
        // Update existing settings
        $row = $checkResult->fetch_assoc();
        $settingsId = $row['id'];
        
        $stmt = $conn->prepare("UPDATE jira_auto_sync_settings SET enabled = ?, mode = ?, sync_interval = ?, schedule_type = ?, schedule_time = ?, schedule_day_of_week = ?, schedule_day_of_month = ?, schedule_month = ?, schedule_yearly_day = ?, last_run = ?, next_run = ?, modified_at = NOW() WHERE id = ?");
        $stmt->bind_param("isissiiiissi", $enabled, $mode, $syncInterval, $scheduleType, $scheduleTime, $scheduleDayOfWeek, $scheduleDayOfMonth, $scheduleMonth, $scheduleYearlyDay, $lastRun, $nextRun, $settingsId);
    } else {
        // Insert new settings
        $stmt = $conn->prepare("INSERT INTO jira_auto_sync_settings (enabled, mode, sync_interval, schedule_type, schedule_time, schedule_day_of_week, schedule_day_of_month, schedule_month, schedule_yearly_day, last_run, next_run) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isissiiiiss", $enabled, $mode, $syncInterval, $scheduleType, $scheduleTime, $scheduleDayOfWeek, $scheduleDayOfMonth, $scheduleMonth, $scheduleYearlyDay, $lastRun, $nextRun);
    }
    
    if (!$stmt->execute()) {
        logSecurityEvent($conn, 'auto_sync_save_failed', 'Failed to save auto-sync settings: ' . $stmt->error, $clientIP);
        sendError('Failed to save auto-sync settings: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    
    // Audit log
    auditJiraOperation($conn, 'update', 'auto_sync_settings', $settingsId ?? $conn->insert_id, null, $clientIP, [
        'enabled' => $enabled,
        'mode' => $mode,
        'sync_interval' => $syncInterval,
        'schedule_type' => $scheduleType
    ]);
    
    logSecurityEvent($conn, 'auto_sync_configured', 'Auto-sync settings saved (enabled: ' . ($enabled ? 'true' : 'false') . ', mode: ' . $mode . ')', $clientIP);
    sendSuccess([
        'enabled' => $enabled, 
        'mode' => $mode, 
        'sync_interval' => $syncInterval, 
        'schedule_type' => $scheduleType,
        'schedule_time' => $scheduleTime,
        'schedule_day_of_week' => $scheduleDayOfWeek,
        'schedule_day_of_month' => $scheduleDayOfMonth,
        'schedule_month' => $scheduleMonth,
        'schedule_yearly_day' => $scheduleYearlyDay,
        'last_run' => $lastRun, 
        'next_run' => $nextRun
    ], 'Auto-sync settings saved successfully');
}

/**
 * Get auto-sync status
 */
function getAutoSyncStatus($conn) {
    global $clientIP;
    
    $sql = "SELECT enabled, last_run, next_run FROM jira_auto_sync_settings ORDER BY id DESC LIMIT 1";
    $result = $conn->query($sql);
    
    if (!$result || $result->num_rows === 0) {
        sendSuccess([
            'enabled' => false,
            'status' => 'Not configured',
            'last_run' => null,
            'next_run' => null
        ]);
        return;
    }
    
    $settings = $result->fetch_assoc();
    
    $status = 'Disabled';
    if ($settings['enabled']) {
        $now = time();
        $nextRun = $settings['next_run'] ? strtotime($settings['next_run']) : null;
        
        if ($nextRun && $nextRun > $now) {
            $status = 'Scheduled';
        } else {
            $status = 'Due now';
        }
    }
    
    sendSuccess([
        'enabled' => (bool)$settings['enabled'],
        'status' => $status,
        'last_run' => $settings['last_run'],
        'next_run' => $settings['next_run']
    ]);
}

/**
 * Start a sync run (create log entry)
 */
function startSyncRun($conn) {
    global $clientIP;
    
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'jira_auto_sync_runs'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        sendError('Auto-sync runs table does not exist. Please run database setup.', 500);
        return;
    }
    
    $data = getJsonInput();
    
    $runType = sanitizeInput($data['run_type'] ?? 'manual', 'string');
    $triggerSource = sanitizeInput($data['trigger_source'] ?? 'user', 'string');
    $jqlQuery = sanitizeInput($data['jql_query'] ?? '', 'string');
    $syncSettingsId = isset($data['sync_settings_id']) ? sanitizeInput($data['sync_settings_id'], 'int') : null;
    
    // Validate run type
    if (!in_array($runType, ['manual', 'interval', 'scheduled'])) {
        sendError('Invalid run type. Must be manual, interval, or scheduled.');
    }
    
    $stmt = $conn->prepare("INSERT INTO jira_auto_sync_runs (run_type, trigger_source, jql_query, sync_settings_id, client_ip, status) VALUES (?, ?, ?, ?, ?, 'running')");
    $stmt->bind_param("sssis", $runType, $triggerSource, $jqlQuery, $syncSettingsId, $clientIP);
    
    if (!$stmt->execute()) {
        sendError('Failed to start sync run log: ' . $stmt->error, 500);
    }
    
    $runId = $conn->insert_id;
    $stmt->close();
    
    // Audit log
    auditJiraOperation($conn, 'create', 'auto_sync_run', $runId, null, $clientIP, [
        'run_type' => $runType,
        'trigger_source' => $triggerSource
    ]);
    
    sendSuccess([
        'run_id' => $runId,
        'status' => 'started'
    ], 'Sync run started successfully');
}

/**
 * End a sync run (update log entry with results)
 */
function endSyncRun($conn) {
    global $clientIP;
    
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'jira_auto_sync_runs'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        sendError('Auto-sync runs table does not exist. Please run database setup.', 500);
        return;
    }
    
    $data = getJsonInput();
    
    $runId = sanitizeInput($data['run_id'] ?? 0, 'int');
    $status = sanitizeInput($data['status'] ?? 'success', 'string');
    $storiesTotal = sanitizeInput($data['stories_total'] ?? 0, 'int');
    $storiesSynced = sanitizeInput($data['stories_synced'] ?? 0, 'int');
    $storiesFailed = sanitizeInput($data['stories_failed'] ?? 0, 'int');
    $errorMessage = isset($data['error_message']) ? sanitizeInput($data['error_message'], 'string') : null;
    
    // Validate status
    if (!in_array($status, ['success', 'error', 'timeout'])) {
        sendError('Invalid status. Must be success, error, or timeout.');
    }
    
    if ($runId <= 0) {
        sendError('Invalid run ID.');
    }
    
    // Calculate duration
    $durationSql = "SELECT TIMESTAMPDIFF(SECOND, start_time, NOW()) as duration FROM jira_auto_sync_runs WHERE id = ?";
    $durationStmt = $conn->prepare($durationSql);
    $durationStmt->bind_param("i", $runId);
    $durationStmt->execute();
    $durationResult = $durationStmt->get_result();
    $duration = 0;
    
    if ($durationResult && $durationResult->num_rows > 0) {
        $row = $durationResult->fetch_assoc();
        $duration = (int)$row['duration'];
    }
    $durationStmt->close();
    
    $stmt = $conn->prepare("UPDATE jira_auto_sync_runs SET end_time = NOW(), duration_seconds = ?, status = ?, stories_total = ?, stories_synced = ?, stories_failed = ?, error_message = ? WHERE id = ?");
    $stmt->bind_param("isiiisi", $duration, $status, $storiesTotal, $storiesSynced, $storiesFailed, $errorMessage, $runId);
    
    if (!$stmt->execute()) {
        sendError('Failed to update sync run log: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    
    // Audit log
    auditJiraOperation($conn, 'update', 'auto_sync_run', $runId, null, $clientIP, [
        'status' => $status,
        'stories_synced' => $storiesSynced,
        'duration_seconds' => $duration
    ]);
    
    sendSuccess([
        'run_id' => $runId,
        'status' => 'completed',
        'duration_seconds' => $duration
    ], 'Sync run completed successfully');
}

/**
 * Get sync run history
 */
function getSyncRuns($conn) {
    global $clientIP;
    
    $limit = sanitizeInput($_GET['limit'] ?? 20, 'int');
    $offset = sanitizeInput($_GET['offset'] ?? 0, 'int');
    
    // Limit to reasonable range
    if ($limit > 100) $limit = 100;
    if ($limit < 1) $limit = 20;
    if ($offset < 0) $offset = 0;
    
    // Check if table exists
    $tableCheck = $conn->query("SHOW TABLES LIKE 'jira_auto_sync_runs'");
    if (!$tableCheck || $tableCheck->num_rows === 0) {
        // Table doesn't exist, return empty result
        sendSuccess([
            'runs' => [],
            'total' => 0,
            'limit' => $limit,
            'offset' => $offset
        ]);
        return;
    }
    
    $sql = "SELECT 
                id, run_type, trigger_source, start_time, end_time, 
                duration_seconds, status, stories_total, stories_synced, 
                stories_failed, error_message, jql_query
            FROM jira_auto_sync_runs 
            ORDER BY start_time DESC 
            LIMIT ? OFFSET ?";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        sendError('Failed to prepare statement: ' . $conn->error, 500);
        return;
    }
    
    $stmt->bind_param("ii", $limit, $offset);
    
    if (!$stmt->execute()) {
        sendError('Failed to get sync runs: ' . $stmt->error, 500);
        return;
    }
    
    $result = $stmt->get_result();
    $runs = [];
    
    while ($row = $result->fetch_assoc()) {
        // Format dates
        $row['start_time'] = $row['start_time'] ? date('Y-m-d H:i:s', strtotime($row['start_time'])) : null;
        $row['end_time'] = $row['end_time'] ? date('Y-m-d H:i:s', strtotime($row['end_time'])) : null;
        
        // Convert numeric fields
        $row['duration_seconds'] = (int)$row['duration_seconds'];
        $row['stories_total'] = (int)$row['stories_total'];
        $row['stories_synced'] = (int)$row['stories_synced'];
        $row['stories_failed'] = (int)$row['stories_failed'];
        
        $runs[] = $row;
    }
    
    $stmt->close();
    
    // Get total count
    $countSql = "SELECT COUNT(*) as total FROM jira_auto_sync_runs";
    $countResult = $conn->query($countSql);
    $totalRuns = 0;
    
    if ($countResult) {
        $countRow = $countResult->fetch_assoc();
        $totalRuns = (int)$countRow['total'];
    }
    
    sendSuccess([
        'runs' => $runs,
        'total' => $totalRuns,
        'limit' => $limit,
        'offset' => $offset
    ]);
}
