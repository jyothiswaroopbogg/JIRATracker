<?php
/**
 * Notes API
 * Handles all CRUD operations for notes
 */

require_once 'config.php';

$conn = getDatabaseConnection();

if (!$conn) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getAllNotes($conn);
        break;
    case 'POST':
        createNote($conn);
        break;
    case 'PUT':
        updateNote($conn);
        break;
    case 'DELETE':
        deleteNote($conn);
        break;
    default:
        sendError('Method not allowed', 405);
}

// Get all notes with tags and record links
function getAllNotes($conn) {
    $sql = "SELECT * FROM notes ORDER BY id DESC";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendError('Failed to fetch notes: ' . $conn->error, 500);
    }
    
    $notes = [];
    while ($row = $result->fetch_assoc()) {
        $note = formatNote($row, $conn);
        $notes[] = $note;
    }
    
    sendSuccess($notes);
}

// Create new note
function createNote($conn) {
    $data = getJsonInput();
    
    $id = $data['id'] ?? time() * 1000;
    $title = $data['title'] ?? '';
    $content = $data['content'] ?? '';
    $color = $data['color'] ?? 'yellow';
    
    // Timestamps
    $timestamps = $data['timestamps'] ?? null;
    $timestampsJson = $timestamps ? json_encode($timestamps) : null;
    
    $stmt = $conn->prepare("INSERT INTO notes (id, title, content, color, timestamps) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("issss", $id, $title, $content, $color, $timestampsJson);
    
    if (!$stmt->execute()) {
        sendError('Failed to create note: ' . $stmt->error, 500);
    }
    
    // Save note tags if provided
    if (isset($data['noteTags']) && is_array($data['noteTags'])) {
        foreach ($data['noteTags'] as $tagName) {
            $tagStmt = $conn->prepare("INSERT INTO note_tags (note_id, tag_name) VALUES (?, ?)");
            $tagStmt->bind_param("is", $id, $tagName);
            $tagStmt->execute();
            $tagStmt->close();
        }
    }
    
    $stmt->close();
    sendSuccess(['id' => $id], 'Note created successfully');
}

// Update existing note
function updateNote($conn) {
    $data = getJsonInput();
    
    $id = $data['id'] ?? null;
    if (!$id) {
        sendError('Note ID is required');
    }
    
    $title = $data['title'] ?? '';
    $content = $data['content'] ?? '';
    $color = $data['color'] ?? 'yellow';
    
    // Timestamps
    $timestamps = $data['timestamps'] ?? null;
    $timestampsJson = $timestamps ? json_encode($timestamps) : null;
    
    $stmt = $conn->prepare("UPDATE notes SET title=?, content=?, color=?, timestamps=? WHERE id=?");
    $stmt->bind_param("ssssi", $title, $content, $color, $timestampsJson, $id);
    
    if (!$stmt->execute()) {
        sendError('Failed to update note: ' . $stmt->error, 500);
    }
    
    // Update note tags
    if (isset($data['noteTags'])) {
        // Delete existing tags
        $deleteStmt = $conn->prepare("DELETE FROM note_tags WHERE note_id = ?");
        $deleteStmt->bind_param("i", $id);
        $deleteStmt->execute();
        $deleteStmt->close();
        
        // Insert new tags
        if (is_array($data['noteTags'])) {
            foreach ($data['noteTags'] as $tagName) {
                $tagStmt = $conn->prepare("INSERT INTO note_tags (note_id, tag_name) VALUES (?, ?)");
                $tagStmt->bind_param("is", $id, $tagName);
                $tagStmt->execute();
                $tagStmt->close();
            }
        }
    }
    
    $stmt->close();
    sendSuccess(['id' => $id], 'Note updated successfully');
}

// Delete note
function deleteNote($conn) {
    $data = getJsonInput();
    $id = $data['id'] ?? null;
    
    if (!$id) {
        sendError('Note ID is required');
    }
    
    // Delete note tags
    $stmt = $conn->prepare("DELETE FROM note_tags WHERE note_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    
    // Delete note-record links
    $stmt = $conn->prepare("DELETE FROM note_record_links WHERE note_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    
    // Delete note
    $stmt = $conn->prepare("DELETE FROM notes WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if (!$stmt->execute()) {
        sendError('Failed to delete note: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess([], 'Note deleted successfully');
}

// Format note with tags and record links
function formatNote($row, $conn) {
    $note = [
        'id' => (int)$row['id'],
        'title' => $row['title'],
        'content' => $row['content'],
        'color' => $row['color'],
        'noteTags' => []
    ];
    
    // Get note tags
    $stmt = $conn->prepare("SELECT tag_name FROM note_tags WHERE note_id = ?");
    $noteId = $row['id'];
    $stmt->bind_param("i", $noteId);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($tagRow = $result->fetch_assoc()) {
        $note['noteTags'][] = $tagRow['tag_name'];
    }
    $stmt->close();
    
    // Add timestamps
    if ($row['timestamps']) {
        $timestamps = json_decode($row['timestamps'], true);
        if ($timestamps) {
            $note['timestamps'] = $timestamps;
        }
    }
    
    return $note;
}
