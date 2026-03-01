<?php
/**
 * Record Links API
 * Handles record-to-record linking
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
        if ($action === 'note_record_links') {
            getNoteRecordLinks($conn);
        } else {
            getAllRecordLinks($conn);
        }
        break;
    case 'POST':
        createRecordLink($conn);
        break;
    case 'DELETE':
        deleteRecordLink($conn);
        break;
    default:
        sendError('Method not allowed', 405);
}

// Get all record links (returns object with record_id as key)
function getAllRecordLinks($conn) {
    $sql = "SELECT record_id, linked_record_id FROM record_links";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendError('Failed to fetch record links: ' . $conn->error, 500);
    }
    
    $recordLinks = [];
    while ($row = $result->fetch_assoc()) {
        $recordId = (string)$row['record_id'];
        if (!isset($recordLinks[$recordId])) {
            $recordLinks[$recordId] = [];
        }
        $recordLinks[$recordId][] = (int)$row['linked_record_id'];
    }
    
    sendSuccess($recordLinks);
}

// Get note-record links (returns object with note_id as key)
function getNoteRecordLinks($conn) {
    $sql = "SELECT note_id, record_id FROM note_record_links";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendError('Failed to fetch note-record links: ' . $conn->error, 500);
    }
    
    $noteRecordLinks = [];
    while ($row = $result->fetch_assoc()) {
        $noteId = (string)$row['note_id'];
        if (!isset($noteRecordLinks[$noteId])) {
            $noteRecordLinks[$noteId] = ['recordIds' => []];
        }
        $noteRecordLinks[$noteId]['recordIds'][] = (string)$row['record_id'];
    }
    
    sendSuccess($noteRecordLinks);
}

// Create record link
function createRecordLink($conn) {
    $data = getJsonInput();
    
    $recordId = $data['recordId'] ?? null;
    $linkedRecordId = $data['linkedRecordId'] ?? null;
    
    if (!$recordId || !$linkedRecordId) {
        sendError('Both record IDs are required', 400);
    }
    
    $stmt = $conn->prepare("INSERT INTO record_links (record_id, linked_record_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $recordId, $linkedRecordId);
    
    if (!$stmt->execute()) {
        sendError('Failed to create record link: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess([], 'Record link created successfully');
}

// Delete record link
function deleteRecordLink($conn) {
    $data = getJsonInput();
    
    $recordId = $data['recordId'] ?? null;
    $linkedRecordId = $data['linkedRecordId'] ?? null;
    
    if (!$recordId || !$linkedRecordId) {
        sendError('Both record IDs are required', 400);
    }
    
    $stmt = $conn->prepare("DELETE FROM record_links WHERE record_id = ? AND linked_record_id = ?");
    $stmt->bind_param("ii", $recordId, $linkedRecordId);
    
    if (!$stmt->execute()) {
        sendError('Failed to delete record link: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess([], 'Record link deleted successfully');
}
