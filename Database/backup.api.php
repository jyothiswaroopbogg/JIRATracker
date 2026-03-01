<?php
/**
 * Backup API
 * Handles backup operations - save, retrieve, and delete backups
 */

require_once 'config.php';

$conn = getDatabaseConnection();

if (!$conn) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        if ($action === 'list') {
            listBackups($conn);
        } elseif ($action === 'download') {
            downloadBackup($conn);
        } else {
            sendError('Invalid action');
        }
        break;
    case 'POST':
        if ($action === 'save') {
            saveBackup($conn);
        } elseif ($action === 'log') {
            logBackupEvent($conn);
        } else {
            sendError('Invalid action');
        }
        break;
    case 'DELETE':
        deleteBackup($conn);
        break;
    default:
        sendError('Method not allowed', 405);
}

// List all backups
function listBackups($conn) {
    $sql = "SELECT * FROM backup_history ORDER BY id DESC LIMIT 50";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendError('Failed to fetch backups: ' . $conn->error, 500);
    }
    
    $backups = [];
    while ($row = $result->fetch_assoc()) {
        $backups[] = [
            'id' => (int)$row['id'],
            'timestamp' => $row['timestamp'],
            'filename' => $row['filename'],
            'recordCount' => (int)$row['record_count'],
            'size' => (int)$row['size'],
            'scheduleType' => $row['schedule_type']
        ];
    }
    
    sendSuccess($backups);
}

// Save backup metadata to database
function saveBackup($conn) {
    $data = getJsonInput();
    
    $id = $data['id'] ?? time() * 1000;
    $timestamp = $data['timestamp'] ?? date('m/d/Y H:i:s');
    $filename = $data['filename'] ?? 'backup_' . $id . '.json';
    $recordCount = $data['recordCount'] ?? 0;
    $size = $data['size'] ?? 0;
    $scheduleType = $data['scheduleType'] ?? 'manual';
    
    $stmt = $conn->prepare("INSERT INTO backup_history (id, timestamp, filename, record_count, size, schedule_type) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssis", $id, $timestamp, $filename, $recordCount, $size, $scheduleType);
    
    if (!$stmt->execute()) {
        sendError('Failed to save backup metadata: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    
    // Save backup file to disk
    $backupData = $data['data'] ?? [];
    $backupDir = __DIR__ . '/../backup/';
    
    // Create backup directory if it doesn't exist
    if (!file_exists($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    
    $backupFile = $backupDir . $filename;
    $backupJson = json_encode($backupData, JSON_PRETTY_PRINT);
    
    if (file_put_contents($backupFile, $backupJson) === false) {
        sendError('Failed to write backup file', 500);
    }
    
    sendSuccess(['id' => $id, 'filename' => $filename], 'Backup saved successfully');
}

// Download backup file
function downloadBackup($conn) {
    $filename = $_GET['filename'] ?? '';
    
    if (!$filename) {
        sendError('Filename is required');
    }
    
    $backupDir = __DIR__ . '/../backup/';
    $backupFile = $backupDir . $filename;
    
    if (!file_exists($backupFile)) {
        sendError('Backup file not found', 404);
    }
    
    header('Content-Type: application/json');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($backupFile));
    
    readfile($backupFile);
    exit;
}

// Delete backup
function deleteBackup($conn) {
    $data = getJsonInput();
    $filename = $data['filename'] ?? '';
    
    if (!$filename) {
        sendError('Filename is required');
    }
    
    // Delete from database
    $stmt = $conn->prepare("DELETE FROM backup_history WHERE filename = ?");
    $stmt->bind_param("s", $filename);
    $stmt->execute();
    $stmt->close();
    
    // Delete file from disk
    $backupDir = __DIR__ . '/../backup/';
    $backupFile = $backupDir . $filename;
    
    if (file_exists($backupFile)) {
        if (unlink($backupFile)) {
            sendSuccess(['filename' => $filename], 'Backup deleted successfully');
        } else {
            sendError('Failed to delete backup file', 500);
        }
    } else {
        sendSuccess(['filename' => $filename], 'Backup metadata deleted (file not found)');
    }
}

// Log backup event
function logBackupEvent($conn) {
    $data = getJsonInput();
    
    $timestamp = $data['timestamp'] ?? date('m/d/Y H:i:s');
    $level = $data['level'] ?? 'info';
    $message = $data['message'] ?? '';
    $backupId = $data['backupId'] ?? null;
    $error = $data['error'] ?? null;
    
    $stmt = $conn->prepare("INSERT INTO backup_log (timestamp, level, message, backup_id, error) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssis", $timestamp, $level, $message, $backupId, $error);
    
    if (!$stmt->execute()) {
        sendError('Failed to log backup event: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess([], 'Backup event logged');
}
