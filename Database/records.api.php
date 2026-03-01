<?php
/**
 * Records API
 * Handles all CRUD operations for records
 */

require_once 'config.php';

$conn = getDatabaseConnection();

if (!$conn) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getAllRecords($conn);
        break;
    case 'POST':
        createRecord($conn);
        break;
    case 'PUT':
        updateRecord($conn);
        break;
    case 'DELETE':
        deleteRecord($conn);
        break;
    default:
        sendError('Method not allowed', 405);
}

// Get all records with tags and links
function getAllRecords($conn) {
    $sql = "SELECT * FROM records ORDER BY id DESC";
    $result = $conn->query($sql);
    
    if (!$result) {
        sendError('Failed to fetch records: ' . $conn->error, 500);
    }
    
    $records = [];
    while ($row = $result->fetch_assoc()) {
        $record = formatRecord($row);
        $records[] = $record;
    }
    
    sendSuccess($records);
}

// Create new record
function createRecord($conn) {
    $data = getJsonInput();
    
    $id = $data['id'] ?? time() * 1000;
    $pi = $data['pi'] ?? '';
    $sprint_start = $data['sprint_start'] ?? '';
    $sprint_end = $data['sprint_end'] ?? '';
    $jira = $data['jira'] ?? '';
    $desc = $data['desc'] ?? '';
    $jstatus = $data['jstatus'] ?? '';
    $wi1 = $data['wi1'] ?? '';
    $wi2 = $data['wi2'] ?? '';
    $dstatus = $data['dstatus'] ?? '';
    $dorg = $data['dorg'] ?? '';
    $comments = $data['comments'] ?? '';
    
    // Extract custom columns
    $customColumns = [];
    foreach ($data as $key => $value) {
        if (strpos($key, 'cc_') === 0) {
            $customColumns[$key] = $value;
        }
    }
    $customColumnsJson = json_encode($customColumns);
    
    // Timestamps
    $timestamps = $data['timestamps'] ?? null;
    $timestampsJson = $timestamps ? json_encode($timestamps) : null;
    
    $stmt = $conn->prepare("INSERT INTO records (id, pi, sprint_start, sprint_end, jira, `desc`, jstatus, wi1, wi2, dstatus, dorg, comments, custom_columns, timestamps) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssssssssssss", $id, $pi, $sprint_start, $sprint_end, $jira, $desc, $jstatus, $wi1, $wi2, $dstatus, $dorg, $comments, $customColumnsJson, $timestampsJson);
    
    if (!$stmt->execute()) {
        sendError('Failed to create record: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess(['id' => $id], 'Record created successfully');
}

// Update existing record
function updateRecord($conn) {
    $data = getJsonInput();
    
    $id = $data['id'] ?? null;
    if (!$id) {
        sendError('Record ID is required');
    }
    
    $pi = $data['pi'] ?? '';
    $sprint_start = $data['sprint_start'] ?? '';
    $sprint_end = $data['sprint_end'] ?? '';
    $jira = $data['jira'] ?? '';
    $desc = $data['desc'] ?? '';
    $jstatus = $data['jstatus'] ?? '';
    $wi1 = $data['wi1'] ?? '';
    $wi2 = $data['wi2'] ?? '';
    $dstatus = $data['dstatus'] ?? '';
    $dorg = $data['dorg'] ?? '';
    $comments = $data['comments'] ?? '';
    
    // Extract custom columns
    $customColumns = [];
    foreach ($data as $key => $value) {
        if (strpos($key, 'cc_') === 0) {
            $customColumns[$key] = $value;
        }
    }
    $customColumnsJson = json_encode($customColumns);
    
    // Timestamps
    $timestamps = $data['timestamps'] ?? null;
    $timestampsJson = $timestamps ? json_encode($timestamps) : null;
    
    $stmt = $conn->prepare("UPDATE records SET pi=?, sprint_start=?, sprint_end=?, jira=?, `desc`=?, jstatus=?, wi1=?, wi2=?, dstatus=?, dorg=?, comments=?, custom_columns=?, timestamps=? WHERE id=?");
    $stmt->bind_param("sssssssssssssi", $pi, $sprint_start, $sprint_end, $jira, $desc, $jstatus, $wi1, $wi2, $dstatus, $dorg, $comments, $customColumnsJson, $timestampsJson, $id);
    
    if (!$stmt->execute()) {
        sendError('Failed to update record: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    sendSuccess(['id' => $id], 'Record updated successfully');
}

// Delete record
function deleteRecord($conn) {
    $data = getJsonInput();
    $id = $data['id'] ?? null;
    
    if (!$id) {
        sendError('Record ID is required');
    }
    
    // Get JIRA key before deleting to clear the cache link
    $stmt = $conn->prepare("SELECT jira FROM records WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $jiraKey = null;
    if ($row = $result->fetch_assoc()) {
        $jiraKey = $row['jira'];
    }
    $stmt->close();
    
    // Delete record tags
    $stmt = $conn->prepare("DELETE FROM record_tags WHERE record_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    
    // Delete record links
    $stmt = $conn->prepare("DELETE FROM record_links WHERE record_id = ? OR linked_record_id = ?");
    $stmt->bind_param("ii", $id, $id);
    $stmt->execute();
    $stmt->close();
    
    // Delete note-record links
    $stmt = $conn->prepare("DELETE FROM note_record_links WHERE record_id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();
    
    // Delete record
    $stmt = $conn->prepare("DELETE FROM records WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if (!$stmt->execute()) {
        sendError('Failed to delete record: ' . $stmt->error, 500);
    }
    
    $stmt->close();
    
    // Clear the local_record_id link in JIRA cache if this record was linked to a JIRA issue
    if ($jiraKey && !empty($jiraKey)) {
        $conn->query("UPDATE jira_issues_cache SET local_record_id = NULL WHERE issue_key = '" . $conn->real_escape_string($jiraKey) . "'");
    }
    
    sendSuccess([], 'Record deleted successfully');
}

// Format record with custom columns
function formatRecord($row) {
    $record = [
        'id' => (int)$row['id'],
        'pi' => $row['pi'],
        'sprint_start' => $row['sprint_start'],
        'sprint_end' => $row['sprint_end'] ?? '',
        'jira' => $row['jira'],
        'desc' => $row['desc'],
        'jstatus' => $row['jstatus'],
        'wi1' => $row['wi1'],
        'wi2' => $row['wi2'],
        'dstatus' => $row['dstatus'],
        'dorg' => $row['dorg'],
        'comments' => $row['comments'],
    ];
    
    // Add custom columns
    if ($row['custom_columns']) {
        $customColumns = json_decode($row['custom_columns'], true);
        if ($customColumns) {
            $record = array_merge($record, $customColumns);
        }
    }
    
    // Add timestamps
    if ($row['timestamps']) {
        $timestamps = json_decode($row['timestamps'], true);
        if ($timestamps) {
            $record['timestamps'] = $timestamps;
        }
    }
    
    return $record;
}
