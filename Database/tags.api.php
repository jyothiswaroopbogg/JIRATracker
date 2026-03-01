<?php
/**
 * Tags API
 * Handles tag management and record/note tag associations
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
        if ($action === 'record_tags') {
            getRecordTags($conn);
        } else {
            getAllTags($conn);
        }
        break;
    case 'POST':
        if ($action === 'save_record_tags') {
            saveRecordTags($conn);
        } elseif ($action === 'save_note_record_links') {
            saveNoteRecordLinks($conn);
        } else {
            createTag($conn);
        }
        break;
    case 'PUT':
        updateTag($conn);
        break;
    case 'DELETE':
        deleteTag($conn);
        break;
    default:
        sendError('Method not allowed', 405);
}

// Get all tags
function getAllTags($conn) {
    $sql = "SELECT * FROM tags ORDER BY name";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendError('Failed to fetch tags: ' . $conn->error, 500);
    }
    
    $tags = [];
    while ($row = $result->fetch_assoc()) {
        $tags[] = [
            'name' => $row['name'],
            'color' => $row['color']
        ];
    }
    
    sendSuccess($tags);
}

// Create new tag
function createTag($conn) {
    $data = getJsonInput();
    
    $name = $data['name'] ?? '';
    $color = $data['color'] ?? '#94a3b8';
    
    if (!$name) {
        sendError('Tag name is required');
    }
    
    $stmt = $conn->prepare("INSERT INTO tags (name, color) VALUES (?, ?) ON DUPLICATE KEY UPDATE color = ?");
    $stmt->bind_param("sss", $name, $color, $color);
    
    if (!$stmt->execute()) {
        sendError('Failed to create tag: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess(['name' => $name], 'Tag created successfully');
}

// Update existing tag
function updateTag($conn) {
    $data = getJsonInput();
    
    $oldName = $data['oldName'] ?? '';
    $newName = $data['name'] ?? '';
    $color = $data['color'] ?? '#94a3b8';
    
    if (!$oldName || !$newName) {
        sendError('Tag names are required');
    }
    
    // Update tag
    $stmt = $conn->prepare("UPDATE tags SET name = ?, color = ? WHERE name = ?");
    $stmt->bind_param("sss", $newName, $color, $oldName);
    
    if (!$stmt->execute()) {
        sendError('Failed to update tag: ' . $stmt->error, 500);
    }
    
    // Update record tags references
    $stmt2 = $conn->prepare("UPDATE record_tags SET tag_name = ? WHERE tag_name = ?");
    $stmt2->bind_param("ss", $newName, $oldName);
    $stmt2->execute();
    $stmt2->close();
    
    // Update note tags references
    $stmt3 = $conn->prepare("UPDATE note_tags SET tag_name = ? WHERE tag_name = ?");
    $stmt3->bind_param("ss", $newName, $oldName);
    $stmt3->execute();
    $stmt3->close();
    
    $stmt->close();
    sendSuccess(['name' => $newName], 'Tag updated successfully');
}

// Delete tag
function deleteTag($conn) {
    $data = getJsonInput();
    $name = $data['name'] ?? '';
    
    if (!$name) {
        sendError('Tag name is required');
    }
    
    // Delete record tags
    $stmt = $conn->prepare("DELETE FROM record_tags WHERE tag_name = ?");
    $stmt->bind_param("s", $name);
    $stmt->execute();
    $stmt->close();
    
    // Delete note tags
    $stmt2 = $conn->prepare("DELETE FROM note_tags WHERE tag_name = ?");
    $stmt2->bind_param("s", $name);
    $stmt2->execute();
    $stmt2->close();
    
    // Delete tag
    $stmt3 = $conn->prepare("DELETE FROM tags WHERE name = ?");
    $stmt3->bind_param("s", $name);
    
    if (!$stmt3->execute()) {
        sendError('Failed to delete tag: ' . $stmt3->error, 500);
    }
    
    $stmt3->close();
    sendSuccess([], 'Tag deleted successfully');
}

// Get record tags (returns object with record_id as key)
function getRecordTags($conn) {
    $sql = "SELECT record_id, tag_name FROM record_tags";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendError('Failed to fetch record tags: ' . $conn->error, 500);
    }
    
    $recordTags = [];
    while ($row = $result->fetch_assoc()) {
        $recordId = (string)$row['record_id'];
        if (!isset($recordTags[$recordId])) {
            $recordTags[$recordId] = [];
        }
        $recordTags[$recordId][] = $row['tag_name'];
    }
    
    sendSuccess($recordTags);
}

// Save record tags
function saveRecordTags($conn) {
    $data = getJsonInput();
    
    $recordId = $data['recordId'] ?? null;
    $tags = $data['tags'] ?? [];
    
    if (!$recordId) {
        sendError('Record ID is required');
    }
    
    // Delete existing tags for this record
    $stmt = $conn->prepare("DELETE FROM record_tags WHERE record_id = ?");
    $stmt->bind_param("i", $recordId);
    $stmt->execute();
    $stmt->close();
    
    // Insert new tags
    if (is_array($tags) && count($tags) > 0) {
        foreach ($tags as $tagName) {
            $stmt = $conn->prepare("INSERT INTO record_tags (record_id, tag_name) VALUES (?, ?)");
            $stmt->bind_param("is", $recordId, $tagName);
            $stmt->execute();
            $stmt->close();
        }
    }
    
    sendSuccess([], 'Record tags saved successfully');
}

// Save note-record links
function saveNoteRecordLinks($conn) {
    $data = getJsonInput();
    
    $noteId = $data['noteId'] ?? null;
    $recordIds = $data['recordIds'] ?? [];
    
    if (!$noteId) {
        sendError('Note ID is required');
    }
    
    // Delete existing links for this note
    $stmt = $conn->prepare("DELETE FROM note_record_links WHERE note_id = ?");
    $stmt->bind_param("i", $noteId);
    $stmt->execute();
    $stmt->close();
    
    // Insert new links
    if (is_array($recordIds) && count($recordIds) > 0) {
        foreach ($recordIds as $recordId) {
            $stmt = $conn->prepare("INSERT INTO note_record_links (note_id, record_id) VALUES (?, ?)");
            $stmt->bind_param("ii", $noteId, $recordId);
            $stmt->execute();
            $stmt->close();
        }
    }
    
    sendSuccess([], 'Note-record links saved successfully');
}
