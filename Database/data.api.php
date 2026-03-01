<?php
/**
 * Data API - Main entry point for application data
 * Handles loading and saving complete application state
 */

require_once 'config.php';

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in response
ini_set('log_errors', 1); // Log errors to PHP error log

$conn = getDatabaseConnection();

if (!$conn) {
    error_log('CRITICAL: Database connection failed in data.api.php');
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        loadAllData($conn);
        break;
    case 'POST':
        saveAllData($conn);
        break;
    default:
        sendError('Method not allowed', 405);
}

// Load all application data
function loadAllData($conn) {
    $data = [];
    
    // Load records
    $sql = "SELECT * FROM records ORDER BY id DESC";
    $result = $conn->query($sql);
    $data['records'] = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $record = formatRecord($row);
            $data['records'][] = $record;
        }
    } else {
        // Table might not exist - log error but continue
        error_log("Failed to query records table: " . $conn->error);
    }
    
    // Load notes
    $sql = "SELECT * FROM notes ORDER BY id DESC";
    $result = $conn->query($sql);
    $data['notes'] = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $note = formatNote($row, $conn);
            $data['notes'][] = $note;
        }
    } else {
        error_log("Failed to query notes table: " . $conn->error);
    }
    
    // Load tags
    $sql = "SELECT * FROM tags ORDER BY name";
    $result = $conn->query($sql);
    $data['tags'] = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $data['tags'][] = [
                'name' => $row['name'],
                'color' => $row['color']
            ];
        }
    }
    
    // Load record tags
    $sql = "SELECT record_id, tag_name FROM record_tags";
    $result = $conn->query($sql);
    $data['recordTags'] = new stdClass();
    if ($result) {
        $recordTags = [];
        while ($row = $result->fetch_assoc()) {
            $recordId = (string)$row['record_id'];
            if (!isset($recordTags[$recordId])) {
                $recordTags[$recordId] = [];
            }
            $recordTags[$recordId][] = $row['tag_name'];
        }
        $data['recordTags'] = (object)$recordTags;
    }
    
    // Load record links
    $sql = "SELECT record_id, linked_record_id FROM record_links";
    $result = $conn->query($sql);
    $data['recordLinks'] = new stdClass();
    if ($result) {
        $recordLinks = [];
        while ($row = $result->fetch_assoc()) {
            $recordId = (string)$row['record_id'];
            if (!isset($recordLinks[$recordId])) {
                $recordLinks[$recordId] = [];
            }
            $recordLinks[$recordId][] = (int)$row['linked_record_id'];
        }
        $data['recordLinks'] = (object)$recordLinks;
    }
    
    // Load note-record links
    $sql = "SELECT note_id, record_id FROM note_record_links";
    $result = $conn->query($sql);
    $data['notesRecordLinks'] = new stdClass();
    if ($result) {
        $noteRecordLinks = [];
        while ($row = $result->fetch_assoc()) {
            $noteId = (string)$row['note_id'];
            if (!isset($noteRecordLinks[$noteId])) {
                $noteRecordLinks[$noteId] = ['recordIds' => []];
            }
            $noteRecordLinks[$noteId]['recordIds'][] = (string)$row['record_id'];
        }
        $data['notesRecordLinks'] = (object)$noteRecordLinks;
    }
    
    // Load sprint dates
    $sql = "SELECT sprint_key, sprint_name, pi, start_date, end_date, color FROM sprint_dates";
    $result = $conn->query($sql);
    $sprintDates = [];
    
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $sprintDates[$row['sprint_key']] = [
                'start' => $row['start_date'],
                'end' => $row['end_date'],
                'pi' => $row['pi']
            ];
            if ($row['color']) {
                if (!isset($data['sprintCalendar'])) {
                    $data['sprintCalendar'] = [];
                }
                if (!isset($data['sprintCalendar']['sprintColors'])) {
                    $data['sprintCalendar']['sprintColors'] = [];
                }
                $data['sprintCalendar']['sprintColors'][$row['sprint_name']] = $row['color'];
            }
        }
    }
    if (!isset($data['sprintCalendar'])) {
        $data['sprintCalendar'] = [];
    }
    $data['sprintCalendar']['sprintDates'] = (object)$sprintDates;
    
    // Load sprint colors from sprint_colors table (PRIORITY - overrides sprint_dates colors)
    $sql = "SELECT sprint_name, color FROM sprint_colors ORDER BY display_order";
    $result = $conn->query($sql);
    if ($result) {
        if (!isset($data['sprintCalendar']['sprintColors'])) {
            $data['sprintCalendar']['sprintColors'] = [];
        }
        while ($row = $result->fetch_assoc()) {
            // ALWAYS override - sprint_colors table has priority over sprint_dates.color
            $data['sprintCalendar']['sprintColors'][$row['sprint_name']] = $row['color'];
        }
    }
    
    // Load holidays
    $sql = "SELECT holiday_date, holiday_name, holiday_type FROM holidays";
    $result = $conn->query($sql);
    $holidays = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $holidays[$row['holiday_date']] = $row['holiday_name'];
        }
    }
    if (!isset($data['sprintCalendar'])) {
        $data['sprintCalendar'] = [];
    }
    $data['sprintCalendar']['holidays'] = (object)$holidays;
    
    // Load status colors
    $sql = "SELECT status_type, status_value, color FROM status_colors";
    $result = $conn->query($sql);
    $colors = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            if (!isset($colors[$row['status_type']])) {
                $colors[$row['status_type']] = [];
            }
            $colors[$row['status_type']][$row['status_value']] = $row['color'];
        }
    }
    if (!empty($colors)) {
        $data['colors'] = $colors;
    }
    
    // Load theme colors (CSS variables for current/custom theme)
    $sql = "SELECT color_key, color_value FROM theme_colors WHERE theme_name = 'current' ORDER BY color_key";
    $result = $conn->query($sql);
    $themeColors = [];
    if ($result && $result->num_rows > 0) {
        // User has custom theme colors
        while ($row = $result->fetch_assoc()) {
            $themeColors[$row['color_key']] = $row['color_value'];
        }
        $data['colors'] = $themeColors;
    } else {
        // No custom theme, try loading from 'default' theme
        $sql = "SELECT color_key, color_value FROM theme_colors WHERE theme_name = 'default' ORDER BY color_key";
        $result = $conn->query($sql);
        if ($result && $result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $themeColors[$row['color_key']] = $row['color_value'];
            }
            $data['colors'] = $themeColors;
        }
    }
    
    // Load automated status rules
    $sql = "SELECT id, rule_name, conditions, actions, enabled, order_index FROM automated_status_rules ORDER BY order_index";
    $result = $conn->query($sql);
    $rules = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            // Decode conditions to extract logicOperator metadata
            $conditions = json_decode($row['conditions'], true);
            $logicOperator = 'AND'; // Default
            
            // Check if conditions array has logicOperator as metadata in first element
            if (is_array($conditions) && !empty($conditions)) {
                if (isset($conditions[0]['logicOperator'])) {
                    $logicOperator = $conditions[0]['logicOperator'];
                    // Remove logicOperator from conditions array (it's metadata, not a condition property)
                    unset($conditions[0]['logicOperator']);
                }
            }
            
            $rules[] = [
                'id' => (int)$row['id'],
                'name' => $row['rule_name'],
                'conditions' => $conditions,
                'targets' => json_decode($row['actions'], true), // Map 'actions' DB column to 'targets' for frontend
                'logicOperator' => $logicOperator,
                'enabled' => (bool)$row['enabled'],
                'order' => (int)$row['order_index']
            ];
        }
    }
    if (!isset($data['automatedStatus'])) {
        $data['automatedStatus'] = [];
    }
    $data['automatedStatus']['rules'] = $rules;
    
    // Load automated status log
    $sql = "SELECT rule_id, record_id, timestamp, old_value, new_value, action_taken, details FROM automated_status_log ORDER BY id DESC LIMIT 100";
    $result = $conn->query($sql);
    $executionLog = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $logEntry = [
                'ruleId' => $row['rule_id'] ? (int)$row['rule_id'] : null,
                'recordId' => $row['record_id'] ? (int)$row['record_id'] : null,
                'timestamp' => $row['timestamp'],
                'oldValue' => $row['old_value'],
                'newValue' => $row['new_value']
            ];
            
            // Generate message from database fields
            // If action_taken exists, use it as message
            if (!empty($row['action_taken'])) {
                $logEntry['message'] = $row['action_taken'];
            } else {
                // Generate message from old/new values
                if (!empty($row['old_value']) && !empty($row['new_value'])) {
                    $logEntry['message'] = "Status changed from '{$row['old_value']}' to '{$row['new_value']}'";
                } else if (!empty($row['new_value'])) {
                    $logEntry['message'] = "Status set to '{$row['new_value']}'";
                } else {
                    $logEntry['message'] = 'Status updated';
                }
                
                // Add record info if available (check for non-null instead of !empty for record_id which could be 0)
                if ($row['record_id'] !== null && $row['record_id'] !== '') {
                    $logEntry['message'] .= " (Record #{$row['record_id']})";
                }
            }
            
            // Set type based on details or default to 'info'
            if (!empty($row['details'])) {
                $detailsData = json_decode($row['details'], true);
                $logEntry['type'] = $detailsData['type'] ?? 'info';
            } else {
                $logEntry['type'] = 'info';
            }
            
            $executionLog[] = $logEntry;
        }
    }
    if (!isset($data['automatedStatus'])) {
        $data['automatedStatus'] = [];
    }
    $data['automatedStatus']['executionLog'] = $executionLog;
    
    // Load backup log
    $sql = "SELECT timestamp, level, message, backup_id, error FROM backup_log ORDER BY id DESC LIMIT 100";
    $result = $conn->query($sql);
    $backupLog = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $logEntry = [
                'id' => time() . rand(1000, 9999), // Generate a unique ID
                'timestamp' => $row['timestamp'],
                'type' => $row['level'],
                'message' => $row['message'],
                'backupId' => $row['backup_id'] ? (int)$row['backup_id'] : null
            ];
            
            if ($row['error']) {
                $errorData = json_decode($row['error'], true);
                $logEntry['errorDetails'] = $errorData ?: $row['error'];
            }
            
            $backupLog[] = $logEntry;
        }
    }
    $data['backupLog'] = $backupLog;
    
    // Load sprint reminders dismissed
    $sql = "SELECT sprint_key, dismissed_at FROM sprint_reminders_dismissed";
    $result = $conn->query($sql);
    $dismissed = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $dismissed[$row['sprint_key']] = $row['dismissed_at'];
        }
    }
    if (!isset($data['sprintCalendar'])) {
        $data['sprintCalendar'] = [];
    }
    if (!isset($data['sprintCalendar']['reminders'])) {
        $data['sprintCalendar']['reminders'] = [];
    }
    $data['sprintCalendar']['reminders']['dismissed'] = (object)$dismissed;
    
    // Load fonts
    $sql = "SELECT id, font_name, font_family, is_default FROM fonts WHERE enabled = 1 ORDER BY order_index";
    $result = $conn->query($sql);
    $fonts = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $fonts[] = [
                'id' => (int)$row['id'],
                'name' => $row['font_name'],
                'family' => $row['font_family'],
                'isDefault' => (bool)$row['is_default']
            ];
        }
    }
    $data['fonts'] = $fonts;
    
    // Load settings
    $sql = "SELECT setting_key, setting_value FROM settings";
    $result = $conn->query($sql);
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            // Handle backupLog migration: if backup_log table is empty but settings has data, use settings data
            if ($row['setting_key'] === 'backupLog') {
                // Only use settings data if we didn't load anything from backup_log table
                if (empty($data['backupLog'])) {
                    $value = json_decode($row['setting_value'], true);
                    $data['backupLog'] = ($value !== null) ? $value : [];
                }
                continue; // Skip normal processing
            }
            
            // Handle automatedStatus migration: Skip settings table entry, use dedicated tables instead
            if ($row['setting_key'] === 'automatedStatus') {
                // Only load 'enabled' flag from settings if not already set
                if (!isset($data['automatedStatus'])) {
                    $data['automatedStatus'] = [];
                }
                $value = json_decode($row['setting_value'], true);
                if (is_array($value) && isset($value['enabled'])) {
                    $data['automatedStatus']['enabled'] = $value['enabled'];
                }
                if (is_array($value) && isset($value['lastExecution'])) {
                    $data['automatedStatus']['lastExecution'] = $value['lastExecution'];
                }
                continue; // Skip overwriting rules and executionLog from settings table
            }
            
            // Handle colors migration: Skip settings table entry, use theme_colors table instead
            if ($row['setting_key'] === 'colors') {
                continue; // Skip colors from settings table - theme_colors table is the source of truth
            }
            
            // Handle sprintCalendar: Skip settings table entry, use dedicated sprint_dates table instead
            if ($row['setting_key'] === 'sprintCalendar') {
                // Merge some settings properties but preserve sprintDates from sprint_dates table
                $value = json_decode($row['setting_value'], true);
                if (is_array($value)) {
                    // Copy non-date properties from settings
                    if (isset($value['currentMonth'])) $data['sprintCalendar']['currentMonth'] = $value['currentMonth'];
                    if (isset($value['currentYear'])) $data['sprintCalendar']['currentYear'] = $value['currentYear'];
                    if (isset($value['viewMode'])) $data['sprintCalendar']['viewMode'] = $value['viewMode'];
                    if (isset($value['compactMode'])) $data['sprintCalendar']['compactMode'] = $value['compactMode'];
                    if (isset($value['reminders'])) $data['sprintCalendar']['reminders'] = $value['reminders'];
                    // DO NOT overwrite sprintDates - it comes from sprint_dates table
                    // DO NOT overwrite sprintColors - it comes from sprint_dates table
                    // DO NOT overwrite holidays - it comes from holidays table
                }
                continue; // Skip normal processing to prevent overwriting sprintDates
            }
            
            $value = json_decode($row['setting_value'], true);
            $data[$row['setting_key']] = ($value !== null) ? $value : $row['setting_value'];
        }
    }
    
    // Ensure sprintCalendar has required properties
    if (isset($data['sprintCalendar'])) {
        // Set currentMonth and currentYear if not present
        if (!isset($data['sprintCalendar']['currentMonth'])) {
            $data['sprintCalendar']['currentMonth'] = (int)date('n') - 1; // JavaScript uses 0-11
        }
        if (!isset($data['sprintCalendar']['currentYear'])) {
            $data['sprintCalendar']['currentYear'] = (int)date('Y');
        }
        if (!isset($data['sprintCalendar']['viewMode'])) {
            $data['sprintCalendar']['viewMode'] = 'month';
        }
        if (!isset($data['sprintCalendar']['compactMode'])) {
            $data['sprintCalendar']['compactMode'] = false;
        }
    }
    
    // Add timestamp
    $data['lastSaved'] = date('c');
    $data['success'] = true;
    
    sendJson($data);
}

// Save all application data
function saveAllData($conn) {
    $data = getJsonInput();
    
    // Start transaction
    $conn->begin_transaction();
    
    try {
        // IMPORTANT: Save tags FIRST before records/notes
        // This prevents foreign key cascade deletes when tags table is cleared
        if (isset($data['tags'])) {
            saveTags($conn, $data['tags']);
        }
        
        // Save records
        if (isset($data['records'])) {
            saveRecords($conn, $data['records']);
        }
        
        // Save notes
        if (isset($data['notes'])) {
            saveNotes($conn, $data['notes']);
        }
        
        // Save record tags
        if (isset($data['recordTags'])) {
            saveRecordTags($conn, $data['recordTags']);
        }
        
        // Save record links
        if (isset($data['recordLinks'])) {
            saveRecordLinks($conn, $data['recordLinks']);
        }
        
        // Save note-record links
        if (isset($data['notesRecordLinks'])) {
            saveNoteRecordLinks($conn, $data['notesRecordLinks']);
        }
        
        // Save sprint dates and colors
        if (isset($data['sprintCalendar'])) {
            if (isset($data['sprintCalendar']['sprintDates'])) {
                saveSprintDates($conn, $data['sprintCalendar']['sprintDates'], $data['sprintCalendar']['sprintColors'] ?? []);
            }
            if (isset($data['sprintCalendar']['sprintColors'])) {
                saveSprintColors($conn, $data['sprintCalendar']['sprintColors']);
            }
            if (isset($data['sprintCalendar']['holidays'])) {
                saveHolidays($conn, $data['sprintCalendar']['holidays']);
            }
            if (isset($data['sprintCalendar']['reminders']['dismissed'])) {
                saveSprintRemindersDismissed($conn, $data['sprintCalendar']['reminders']['dismissed']);
            }
            
            // Prepare sprintCalendar settings for settings table (non-table data)
            $sprintCalendarSettings = [
                'currentMonth' => $data['sprintCalendar']['currentMonth'] ?? (int)date('n') - 1,
                'currentYear' => $data['sprintCalendar']['currentYear'] ?? (int)date('Y'),
                'viewMode' => $data['sprintCalendar']['viewMode'] ?? 'month',
                'compactMode' => $data['sprintCalendar']['compactMode'] ?? false,
                'reminders' => $data['sprintCalendar']['reminders'] ?? []
            ];
            
            // Save sprintCalendar settings to settings table
            $valueJson = json_encode($sprintCalendarSettings);
            $key = 'sprintCalendar';
            $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->bind_param("sss", $key, $valueJson, $valueJson);
            $stmt->execute();
            $stmt->close();
        }
        
        // Save status colors
        if (isset($data['colors'])) {
            saveThemeColors($conn, $data['colors']);
        }
        
        // Save automated status rules and logs
        if (isset($data['automatedStatus'])) {
            if (isset($data['automatedStatus']['rules'])) {
                saveAutomatedRules($conn, $data['automatedStatus']['rules']);
            }
            if (isset($data['automatedStatus']['executionLog'])) {
                saveAutomatedLog($conn, $data['automatedStatus']['executionLog']);
            }
            // Prepare filtered automatedStatus for settings (only enabled and lastExecution)
            $data['automatedStatus'] = [
                'enabled' => $data['automatedStatus']['enabled'] ?? false,
                'lastExecution' => $data['automatedStatus']['lastExecution'] ?? null
            ];
        }
        
        // Save backup log
        if (isset($data['backupLog'])) {
            saveBackupLog($conn, $data['backupLog']);
        }
        
        // Save settings
        saveSettings($conn, $data);
        
        // Commit transaction
        $conn->commit();
        
        sendSuccess(['lastSaved' => date('c')], 'Data saved successfully');
        
    } catch (Exception $e) {
        $conn->rollback();
        error_log('Database save failed: ' . $e->getMessage());
        sendError('Failed to save data: ' . $e->getMessage(), 500);
    }
}

// Helper functions

function saveRecords($conn, $records) {
    // Clear existing records
    $conn->query("DELETE FROM records");
    
    // Collect all JIRA keys from the records being saved
    $jiraKeys = [];
    
    // Insert records
    foreach ($records as $record) {
        $id = $record['id'] ?? time() * 1000;
        $pi = $record['pi'] ?? '';
        $sprint_start = $record['sprint_start'] ?? '';
        $sprint_end = $record['sprint_end'] ?? '';
        $jira = $record['jira'] ?? '';
        $desc = $record['desc'] ?? '';
        $jstatus = $record['jstatus'] ?? '';
        $wi1 = $record['wi1'] ?? '';
        $wi2 = $record['wi2'] ?? '';
        $dstatus = $record['dstatus'] ?? '';
        $dorg = $record['dorg'] ?? '';
        $comments = $record['comments'] ?? '';
        
        // Track JIRA keys for cache update
        if (!empty($jira)) {
            $jiraKeys[] = $jira;
        }
        
        // Extract custom columns
        $customColumns = [];
        foreach ($record as $key => $value) {
            if (strpos($key, 'cc_') === 0) {
                $customColumns[$key] = $value;
            }
        }
        $customColumnsJson = json_encode($customColumns);
        
        // Timestamps - handle both formats: timestamps object OR createdAt/modifiedAt properties
        $timestamps = null;
        if (isset($record['timestamps'])) {
            // New format: timestamps object
            $timestamps = $record['timestamps'];
        } else if (isset($record['createdAt']) || isset($record['modifiedAt'])) {
            // Old format: direct properties - convert to timestamps object
            $timestamps = [
                'createdAt' => $record['createdAt'] ?? null,
                'modifiedAt' => $record['modifiedAt'] ?? null
            ];
        }
        $timestampsJson = $timestamps ? json_encode($timestamps) : null;
        
        $stmt = $conn->prepare("INSERT INTO records (id, pi, sprint_start, sprint_end, jira, `desc`, jstatus, wi1, wi2, dstatus, dorg, comments, custom_columns, timestamps) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isssssssssssss", $id, $pi, $sprint_start, $sprint_end, $jira, $desc, $jstatus, $wi1, $wi2, $dstatus, $dorg, $comments, $customColumnsJson, $timestampsJson);
        $stmt->execute();
        $stmt->close();
    }
    
    // Clear local_record_id for JIRA issues that are no longer linked to records
    // This ensures the + icon shows on JIRA stories tab when records are deleted
    if (!empty($jiraKeys)) {
        // Escape each JIRA key for SQL
        $escapedKeys = array_map(function($key) use ($conn) {
            return "'" . $conn->real_escape_string($key) . "'";
        }, $jiraKeys);
        $keysList = implode(',', $escapedKeys);
        
        // Clear local_record_id for issues NOT in the current records
        $conn->query("UPDATE jira_issues_cache SET local_record_id = NULL WHERE issue_key NOT IN ($keysList) AND local_record_id IS NOT NULL");
    } else {
        // No records with JIRA keys - clear all
        $conn->query("UPDATE jira_issues_cache SET local_record_id = NULL WHERE local_record_id IS NOT NULL");
    }
}

function saveNotes($conn, $notes) {
    // Clear existing notes
    $conn->query("DELETE FROM notes");
    $conn->query("DELETE FROM note_tags");
    
    // Insert notes
    foreach ($notes as $note) {
        $id = $note['id'] ?? time() * 1000;
        $title = $note['title'] ?? '';
        $content = $note['content'] ?? '';
        $color = $note['color'] ?? 'yellow';
        
        // Timestamps - handle both formats
        $timestamps = null;
        if (isset($note['timestamps'])) {
            // New format: timestamps object
            $timestamps = $note['timestamps'];
        } else if (isset($note['createdOn']) || isset($note['lastModified']) || isset($note['createdAt']) || isset($note['modifiedAt'])) {
            // Old format: direct properties - convert to timestamps object
            $timestamps = [
                'createdOn' => $note['createdOn'] ?? $note['createdAt'] ?? null,
                'lastModified' => $note['lastModified'] ?? $note['modifiedAt'] ?? null,
                'createdAt' => $note['createdAt'] ?? $note['createdOn'] ?? null,
                'modifiedAt' => $note['modifiedAt'] ?? $note['lastModified'] ?? null
            ];
        }
        $timestampsJson = $timestamps ? json_encode($timestamps) : null;
        
        $stmt = $conn->prepare("INSERT INTO notes (id, title, content, color, timestamps) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("issss", $id, $title, $content, $color, $timestampsJson);
        $stmt->execute();
        $stmt->close();
        
        // Save note tags
        if (isset($note['noteTags']) && is_array($note['noteTags'])) {
            foreach ($note['noteTags'] as $tagName) {
                // First, ensure the tag exists in the tags table (INSERT IGNORE)
                // This prevents foreign key constraint errors
                $insertTag = $conn->prepare("INSERT IGNORE INTO tags (name, color) VALUES (?, '#94a3b8')");
                $insertTag->bind_param("s", $tagName);
                $insertTag->execute();
                $insertTag->close();
                
                // Now insert the note-tag association
                $tagStmt = $conn->prepare("INSERT INTO note_tags (note_id, tag_name) VALUES (?, ?)");
                $tagStmt->bind_param("is", $id, $tagName);
                $tagStmt->execute();
                $tagStmt->close();
            }
        }
    }
}

function saveTags($conn, $tags) {
    // Clear existing tags
    $conn->query("DELETE FROM tags");
    
    // Insert tags
    foreach ($tags as $tag) {
        $name = is_array($tag) ? ($tag['name'] ?? '') : $tag;
        $color = is_array($tag) ? ($tag['color'] ?? '#94a3b8') : '#94a3b8';
        
        if ($name) {
            $stmt = $conn->prepare("INSERT INTO tags (name, color) VALUES (?, ?)");
            $stmt->bind_param("ss", $name, $color);
            $stmt->execute();
            $stmt->close();
        }
    }
}

function saveRecordTags($conn, $recordTags) {
    // Clear existing record tags
    $conn->query("DELETE FROM record_tags");
    
    // Insert record tags
    foreach ($recordTags as $recordId => $tags) {
        if (is_array($tags)) {
            foreach ($tags as $tagName) {
                // First, ensure the tag exists in the tags table (INSERT IGNORE)
                // This prevents foreign key constraint errors
                $insertTag = $conn->prepare("INSERT IGNORE INTO tags (name, color) VALUES (?, '#94a3b8')");
                $insertTag->bind_param("s", $tagName);
                $insertTag->execute();
                $insertTag->close();
                
                // Now insert the record-tag association
                $stmt = $conn->prepare("INSERT INTO record_tags (record_id, tag_name) VALUES (?, ?)");
                $recordIdInt = (int)$recordId;
                $stmt->bind_param("is", $recordIdInt, $tagName);
                $stmt->execute();
                $stmt->close();
            }
        }
    }
}

function saveRecordLinks($conn, $recordLinks) {
    // Clear existing record links
    $conn->query("DELETE FROM record_links");
    
    // Insert record links
    foreach ($recordLinks as $recordId => $linkedIds) {
        if (is_array($linkedIds)) {
            foreach ($linkedIds as $linkedId) {
                $stmt = $conn->prepare("INSERT INTO record_links (record_id, linked_record_id) VALUES (?, ?)");
                $recordIdInt = (int)$recordId;
                $linkedIdInt = (int)$linkedId;
                $stmt->bind_param("ii", $recordIdInt, $linkedIdInt);
                $stmt->execute();
                $stmt->close();
            }
        }
    }
}

function saveNoteRecordLinks($conn, $noteRecordLinks) {
    // Clear existing note-record links
    $conn->query("DELETE FROM note_record_links");
    
    // Insert note-record links
    foreach ($noteRecordLinks as $noteId => $linkData) {
        $recordIds = is_array($linkData) && isset($linkData['recordIds']) ? $linkData['recordIds'] : [];
        
        if (is_array($recordIds)) {
            foreach ($recordIds as $recordId) {
                $stmt = $conn->prepare("INSERT INTO note_record_links (note_id, record_id) VALUES (?, ?)");
                $noteIdInt = (int)$noteId;
                $recordIdInt = (int)$recordId;
                $stmt->bind_param("ii", $noteIdInt, $recordIdInt);
                $stmt->execute();
                $stmt->close();
            }
        }
    }
}

function saveSettings($conn, $data) {
    $settingsKeys = [
        'jiraStatuses', 'devopsStatuses', 'devopsOrgs', 'columns', 'customColumns',
        'jiraUrlTemplate', 'jiraDisplayFormat', 'wiUrlTemplate', 'wiDisplayFormat',
        'filterCriteria', 'currentTab', 'tabScrollPositions', 'labels',
        'fontSettings', 'downloadFilename', 'timestampFormat', 'useMatrixBackground',
        'matrixFontSize', 'matrixChars', 'backgroundImage', 'websiteLogo',
        'backupSettings', 'backupHistory', // NOTE: backupLog is now saved to backup_log table, not settings
        'automatedStatus', // Save automatedStatus settings (enabled, lastExecution)
        'selectedExportColumns', 'notesTimestamps'
    ];
    
    foreach ($settingsKeys as $key) {
        if (isset($data[$key])) {
            $valueJson = json_encode($data[$key]);
            $stmt = $conn->prepare("INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?");
            $stmt->bind_param("sss", $key, $valueJson, $valueJson);
            $stmt->execute();
            $stmt->close();
        }
    }
}

function saveSprintDates($conn, $sprintDates, $sprintColors = []) {
    // Clear existing sprint dates
    $conn->query("DELETE FROM sprint_dates");
    
    // Insert sprint dates
    foreach ($sprintDates as $sprintKey => $dateInfo) {
        
        // Convert object to array if needed
        if (is_object($dateInfo)) {
            $dateInfo = (array)$dateInfo;
        }
        
        if (is_array($dateInfo) && isset($dateInfo['start']) && isset($dateInfo['end'])) {
            // Extract sprint name from key (format: "PI|Sprint")
            $parts = explode('|', $sprintKey);
            $sprintName = isset($parts[1]) ? $parts[1] : $sprintKey;
            $pi = $dateInfo['pi'] ?? (isset($parts[0]) ? $parts[0] : '');
            $start = $dateInfo['start'];
            $end = $dateInfo['end'];
            $color = isset($sprintColors[$sprintName]) ? $sprintColors[$sprintName] : null;
            
            $stmt = $conn->prepare("INSERT INTO sprint_dates (sprint_key, sprint_name, pi, start_date, end_date, color) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssssss", $sprintKey, $sprintName, $pi, $start, $end, $color);
            $stmt->execute();
            $stmt->close();
        }
    }
}

function saveHolidays($conn, $holidays) {
    // Clear existing holidays
    $conn->query("DELETE FROM holidays");
    
    // Insert holidays
    foreach ($holidays as $date => $name) {
        if ($date && $name) {
            $type = 'public'; // Default type
            $stmt = $conn->prepare("INSERT INTO holidays (holiday_date, holiday_name, holiday_type) VALUES (?, ?, ?)");
            $stmt->bind_param("sss", $date, $name, $type);
            $stmt->execute();
            $stmt->close();
        }
    }
}

function saveSprintColors($conn, $sprintColors) {
    // Clear existing sprint colors
    $conn->query("DELETE FROM sprint_colors");
    
    // Convert object to array if needed
    if (is_object($sprintColors)) {
        $sprintColors = (array)$sprintColors;
    }
    
    if (!is_array($sprintColors)) {
        return; // Invalid data type
    }
    
    // Insert sprint colors with display order
    $displayOrder = 1;
    foreach ($sprintColors as $sprintName => $color) {
        if ($sprintName && $color) {
            $stmt = $conn->prepare("INSERT INTO sprint_colors (sprint_name, color, display_order) VALUES (?, ?, ?)");
            $stmt->bind_param("ssi", $sprintName, $color, $displayOrder);
            $stmt->execute();
            $stmt->close();
            $displayOrder++;
        }
    }
}

function saveStatusColors($conn, $colors) {
    // Clear existing status colors
    $conn->query("DELETE FROM status_colors");
    
    // Insert status colors
    foreach ($colors as $statusType => $statusValues) {
        if (is_array($statusValues)) {
            foreach ($statusValues as $statusValue => $color) {
                if ($statusValue && $color) {
                    $stmt = $conn->prepare("INSERT INTO status_colors (status_type, status_value, color) VALUES (?, ?, ?)");
                    $stmt->bind_param("sss", $statusType, $statusValue, $color);
                    $stmt->execute();
                    $stmt->close();
                }
            }
        }
    }
}

function saveThemeColors($conn, $colors) {
    // This function saves theme colors (CSS variables) to theme_colors table
    // Colors should be in format: { "--bg": "#0a0e1a", "--surface": "#111827", ... }
    
    // Check if colors are status colors (nested arrays) or theme colors (flat key-value)
    $isStatusColors = false;
    foreach ($colors as $key => $value) {
        if (is_array($value)) {
            $isStatusColors = true;
            break;
        }
    }
    
    if ($isStatusColors) {
        // This is status colors, save to status_colors table
        saveStatusColors($conn, $colors);
        return;
    }
    
    // This is theme colors (CSS variables)
    // Delete existing 'current' theme
    $conn->query("DELETE FROM theme_colors WHERE theme_name = 'current'");
    
    // Insert new theme colors as 'current' theme
    foreach ($colors as $colorKey => $colorValue) {
        if ($colorKey && $colorValue && strpos($colorKey, '--') === 0) {
            $themeName = 'current';
            $isDefault = 0;
            $stmt = $conn->prepare("INSERT INTO theme_colors (theme_name, color_key, color_value, is_default) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("sssi", $themeName, $colorKey, $colorValue, $isDefault);
            $stmt->execute();
            $stmt->close();
        }
    }
}

function saveAutomatedRules($conn, $rules) {
    // Clear existing rules
    $conn->query("DELETE FROM automated_status_rules");
    
    // Insert rules
    foreach ($rules as $rule) {
        $name = $rule['name'] ?? '';
        $conditions = $rule['conditions'] ?? [];
        
        // Add logicOperator as metadata to first condition for persistence
        $logicOperator = $rule['logicOperator'] ?? 'AND';
        if (!empty($conditions) && is_array($conditions)) {
            // Store logicOperator in first condition as metadata
            $conditions[0]['logicOperator'] = $logicOperator;
        }
        
        $conditionsJson = json_encode($conditions);
        
        // Map 'targets' from frontend to 'actions' for DB storage
        $targets = $rule['targets'] ?? $rule['actions'] ?? [];
        $actions = json_encode($targets);
        $enabled = isset($rule['enabled']) ? (int)$rule['enabled'] : 1;
        $order = $rule['order'] ?? 0;
        
        if ($name) {
            $stmt = $conn->prepare("INSERT INTO automated_status_rules (rule_name, conditions, actions, enabled, order_index) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssii", $name, $conditionsJson, $actions, $enabled, $order);
            $stmt->execute();
            $stmt->close();
        }
    }
}

function saveAutomatedLog($conn, $executionLog) {
    // Clear all existing logs first
    $conn->query("DELETE FROM automated_status_log");
    
    // If executionLog is empty, we're done (user clicked "Clear Log" or no logs)
    if (empty($executionLog) || !is_array($executionLog)) {
        return;
    }
    
    // Insert new log entries (only keep last 100 to match frontend limit)
    $logsToSave = array_slice($executionLog, -100);
    
    foreach ($logsToSave as $logEntry) {
        $ruleId = $logEntry['ruleId'] ?? 0;
        $recordId = $logEntry['recordId'] ?? 0;
        $timestamp = $logEntry['timestamp'] ?? date('c');
        $oldValue = $logEntry['oldValue'] ?? '';
        $newValue = $logEntry['newValue'] ?? '';
        
        // Extract message and type for storage
        $actionTaken = $logEntry['message'] ?? null;
        $type = $logEntry['type'] ?? 'info';
        
        // Store type in details JSON
        $details = json_encode(['type' => $type]);
        
        // Check if rule_id exists in automated_status_rules table
        // If not, set to NULL to avoid foreign key constraint error
        $validRuleId = null;
        if ($ruleId > 0) {
            $checkStmt = $conn->prepare("SELECT id FROM automated_status_rules WHERE id = ? LIMIT 1");
            $checkStmt->bind_param("i", $ruleId);
            $checkStmt->execute();
            $checkResult = $checkStmt->get_result();
            if ($checkResult->num_rows > 0) {
                $validRuleId = $ruleId;
            }
            $checkStmt->close();
        }
        
        // Insert with NULL rule_id if rule doesn't exist (avoids foreign key constraint error)
        $stmt = $conn->prepare("INSERT INTO automated_status_log (rule_id, record_id, timestamp, old_value, new_value, action_taken, details) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iisssss", $validRuleId, $recordId, $timestamp, $oldValue, $newValue, $actionTaken, $details);
        $stmt->execute();
        $stmt->close();
    }
}

function saveSprintRemindersDismissed($conn, $dismissed) {
    // Clear existing dismissed reminders
    $conn->query("DELETE FROM sprint_reminders_dismissed");
    
    // Insert dismissed reminders
    foreach ($dismissed as $sprintKey => $dismissedAt) {
        if ($sprintKey && $dismissedAt) {
            $stmt = $conn->prepare("INSERT INTO sprint_reminders_dismissed (sprint_key, dismissed_at) VALUES (?, ?)");
            $stmt->bind_param("ss", $sprintKey, $dismissedAt);
            $stmt->execute();
            $stmt->close();
        }
    }
}

function saveBackupLog($conn, $backupLog) {
    // If backupLog is empty, clear all database entries (user clicked "Clear Log")
    if (empty($backupLog) || !is_array($backupLog)) {
        $conn->query("DELETE FROM backup_log");
        return;
    }
    
    // Otherwise, limit the total to 100 most recent entries
    $conn->query("DELETE FROM backup_log WHERE id NOT IN (SELECT id FROM (SELECT id FROM backup_log ORDER BY id DESC LIMIT 100) AS temp)");
    
    // Insert new log entries (skip duplicates based on timestamp+message)
    foreach ($backupLog as $logEntry) {
        $timestamp = $logEntry['timestamp'] ?? date('m/d/Y, h:i:s A');
        $level = $logEntry['type'] ?? 'info'; // JavaScript uses 'type', database uses 'level'
        $message = $logEntry['message'] ?? '';
        $backupId = isset($logEntry['backupId']) && $logEntry['backupId'] ? (int)$logEntry['backupId'] : null;
        
        // Convert errorDetails object to JSON string for database
        $error = null;
        if (isset($logEntry['errorDetails'])) {
            $error = is_array($logEntry['errorDetails']) || is_object($logEntry['errorDetails']) 
                ? json_encode($logEntry['errorDetails']) 
                : $logEntry['errorDetails'];
        }
        
        // Check if this log entry already exists (by timestamp and message)
        $checkStmt = $conn->prepare("SELECT id FROM backup_log WHERE timestamp = ? AND message = ? LIMIT 1");
        $checkStmt->bind_param("ss", $timestamp, $message);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        $exists = $checkResult->num_rows > 0;
        $checkStmt->close();
        
        // Only insert if it doesn't exist
        if (!$exists) {
            $stmt = $conn->prepare("INSERT INTO backup_log (timestamp, level, message, backup_id, error) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssis", $timestamp, $level, $message, $backupId, $error);
            $stmt->execute();
            $stmt->close();
        }
    }
}

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
    
    // Add timestamps - expand to both formats for compatibility
    if ($row['timestamps']) {
        $timestamps = json_decode($row['timestamps'], true);
        if ($timestamps) {
            $record['timestamps'] = $timestamps;
            // Also set as direct properties for UI compatibility
            if (isset($timestamps['createdAt'])) {
                $record['createdAt'] = $timestamps['createdAt'];
            }
            if (isset($timestamps['modifiedAt'])) {
                $record['modifiedAt'] = $timestamps['modifiedAt'];
            }
        }
    }
    
    return $record;
}

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
    
    // Add timestamps - expand to both formats for compatibility  
    if ($row['timestamps']) {
        $timestamps = json_decode($row['timestamps'], true);
        if ($timestamps) {
            $note['timestamps'] = $timestamps;
            // Also set as direct properties for UI compatibility
            // Support both createdOn/lastModified (notes) and createdAt/modifiedAt (records)
            if (isset($timestamps['createdOn'])) {
                $note['createdOn'] = $timestamps['createdOn'];
            } else if (isset($timestamps['createdAt'])) {
                $note['createdOn'] = $timestamps['createdAt'];
            }
            if (isset($timestamps['lastModified'])) {
                $note['lastModified'] = $timestamps['lastModified'];
            } else if (isset($timestamps['modifiedAt'])) {
                $note['lastModified'] = $timestamps['modifiedAt'];
            }
        }
    }
    
    return $note;
}
