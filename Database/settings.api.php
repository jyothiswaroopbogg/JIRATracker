<?php
/**
 * Settings API
 * Handles application settings and configuration
 */

require_once 'config.php';

$conn = getDatabaseConnection();

if (!$conn) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_REQUEST['action'] ?? '';

switch ($method) {
    case 'GET':
        handleGetRequest($conn, $action);
        break;
    case 'POST':
        handlePostRequest($conn, $action);
        break;
    default:
        sendError('Method not allowed', 405);
}

// Handle GET requests
function handleGetRequest($conn, $action) {
    switch ($action) {
        case 'getSetting':
            getSetting($conn);
            break;
        case 'getIPWhitelist':
            getIPWhitelist($conn);
            break;
        case 'getSettings':
        default:
            getAllSettings($conn);
            break;
    }
}

// Handle POST requests
function handlePostRequest($conn, $action) {
    $data = getJsonInput();
    
    switch ($action) {
        case 'updateSetting':
            updateSetting($conn, $data);
            break;
        case 'addIPToWhitelist':
            addIPToWhitelist($conn, $data);
            break;
        case 'removeIPFromWhitelist':
            removeIPFromWhitelist($conn, $data);
            break;
        case 'toggleIPActive':
            toggleIPActive($conn, $data);
            break;
        default:
            saveSetting($conn);
            break;
    }
}

// Get single setting by key
function getSetting($conn) {
    $key = $_GET['key'] ?? null;
    
    if (!$key) {
        sendError('Setting key is required');
    }
    
    $stmt = $conn->prepare("SELECT setting_key, setting_value FROM settings WHERE setting_key = ?");
    $stmt->bind_param("s", $key);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $value = json_decode($row['setting_value'], true);
        sendSuccess([
            'setting_key' => $row['setting_key'],
            'setting_value' => ($value !== null) ? $value : $row['setting_value']
        ]);
    } else {
        sendSuccess(null, 'Setting not found');
    }
    
    $stmt->close();
}

// Get all settings
function getAllSettings($conn) {
    $sql = "SELECT setting_key, setting_value FROM settings";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendError('Failed to fetch settings: ' . $conn->error, 500);
    }
    
    $settings = [];
    while ($row = $result->fetch_assoc()) {
        $value = json_decode($row['setting_value'], true);
        // If JSON decode fails, use the raw value
        $settings[$row['setting_key']] = ($value !== null) ? $value : $row['setting_value'];
    }
    
    sendSuccess($settings);
}

// Update a single setting
function updateSetting($conn, $data) {
    $key = $data['key'] ?? null;
    $value = $data['value'] ?? null;
    
    if (!$key) {
        sendError('Setting key is required');
    }
    
    // Convert value to JSON string if it's not a simple string
    $valueJson = is_string($value) ? $value : json_encode($value);
    
    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->bind_param("sss", $key, $valueJson, $valueJson);
    
    if (!$stmt->execute()) {
        sendError('Failed to update setting: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess(['key' => $key], 'Setting updated successfully');
}

// Save or update a setting (legacy method)
function saveSetting($conn) {
    $data = getJsonInput();
    
    $key = $data['key'] ?? null;
    $value = $data['value'] ?? null;
    
    if (!$key) {
        sendError('Setting key is required');
    }
    
    // Convert value to JSON string
    $valueJson = json_encode($value);
    
    $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
    $stmt->bind_param("sss", $key, $valueJson, $valueJson);
    
    if (!$stmt->execute()) {
        sendError('Failed to save setting: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess(['key' => $key], 'Setting saved successfully');
}

// Get IP Whitelist
function getIPWhitelist($conn) {
    $sql = "SELECT id, ip_address, description, is_active, created_at FROM jira_ip_whitelist ORDER BY created_at DESC";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendError('Failed to fetch IP whitelist: ' . $conn->error, 500);
    }
    
    $whitelist = [];
    while ($row = $result->fetch_assoc()) {
        $whitelist[] = [
            'id' => (int)$row['id'],
            'ip_address' => $row['ip_address'],
            'description' => $row['description'],
            'is_active' => (bool)$row['is_active'],
            'created_at' => $row['created_at']
        ];
    }
    
    sendSuccess($whitelist);
}

// Add IP to Whitelist
function addIPToWhitelist($conn, $data) {
    $ipAddress = $data['ip_address'] ?? null;
    $description = $data['description'] ?? '';
    
    if (!$ipAddress) {
        sendError('IP address is required');
    }
    
    // Check if IP already exists
    $checkStmt = $conn->prepare("SELECT id FROM jira_ip_whitelist WHERE ip_address = ?");
    $checkStmt->bind_param("s", $ipAddress);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        $checkStmt->close();
        sendError('IP address already exists in whitelist');
    }
    $checkStmt->close();
    
    // Add new IP
    $stmt = $conn->prepare("INSERT INTO jira_ip_whitelist (ip_address, description, is_active) VALUES (?, ?, TRUE)");
    $stmt->bind_param("ss", $ipAddress, $description);
    
    if (!$stmt->execute()) {
        sendError('Failed to add IP to whitelist: ' . $stmt->error, 500);
    }
    
    $insertId = $stmt->insert_id;
    $stmt->close();
    
    sendSuccess(['id' => $insertId], 'IP address added to whitelist');
}

// Remove IP from Whitelist
function removeIPFromWhitelist($conn, $data) {
    $id = $data['id'] ?? null;
    
    if (!$id) {
        sendError('IP ID is required');
    }
    
    $stmt = $conn->prepare("DELETE FROM jira_ip_whitelist WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if (!$stmt->execute()) {
        sendError('Failed to remove IP from whitelist: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess(null, 'IP address removed from whitelist');
}

// Toggle IP Active Status
function toggleIPActive($conn, $data) {
    $id = $data['id'] ?? null;
    $isActive = $data['is_active'] ?? false;
    
    if (!$id) {
        sendError('IP ID is required');
    }
    
    $activeValue = $isActive ? 1 : 0;
    $stmt = $conn->prepare("UPDATE jira_ip_whitelist SET is_active = ? WHERE id = ?");
    $stmt->bind_param("ii", $activeValue, $id);
    
    if (!$stmt->execute()) {
        sendError('Failed to update IP status: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess(null, 'IP status updated');
}

