-- ============================================
-- Sprint Tracker Database Schema
-- ============================================
-- Created: February 25, 2026
-- Database: sprint_tracker_db
-- Description: Complete database schema for Sprint Tracker application
-- ============================================

-- Create Database
CREATE DATABASE IF NOT EXISTS sprint_tracker_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE sprint_tracker_db;

-- ============================================
-- Drop Tables (if exists) - For Clean Setup
-- ============================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS record_tags;
DROP TABLE IF EXISTS note_tags;
DROP TABLE IF EXISTS record_links;
DROP TABLE IF EXISTS note_record_links;
DROP TABLE IF EXISTS records;
DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS backup_history;
DROP TABLE IF EXISTS backup_log;
DROP TABLE IF EXISTS sprint_colors;
DROP TABLE IF EXISTS sprint_dates;
DROP TABLE IF EXISTS holidays;
DROP TABLE IF EXISTS status_colors;
DROP TABLE IF EXISTS theme_colors;
DROP TABLE IF EXISTS automated_status_rules;
DROP TABLE IF EXISTS automated_status_log;
DROP TABLE IF EXISTS sprint_reminders_dismissed;
DROP TABLE IF EXISTS fonts;
DROP TABLE IF EXISTS jira_audit_log;
DROP TABLE IF EXISTS jira_security_log;
DROP TABLE IF EXISTS jira_session_tokens;
DROP TABLE IF EXISTS jira_csrf_tokens;
DROP TABLE IF EXISTS jira_rate_limit;
DROP TABLE IF EXISTS jira_ip_whitelist;
DROP TABLE IF EXISTS jira_issues_cache;
DROP TABLE IF EXISTS jira_field_mapping;
DROP TABLE IF EXISTS jira_sync_log;
DROP TABLE IF EXISTS jira_auto_sync_settings;
DROP TABLE IF EXISTS jira_auto_sync_runs;
DROP TABLE IF EXISTS jira_config;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Table: records
-- Description: Main sprint tracking records
-- ============================================

CREATE TABLE records (
    id BIGINT PRIMARY KEY COMMENT 'Unique record identifier',
    pi VARCHAR(100) COMMENT 'Program Increment',
    sprint_start VARCHAR(100) COMMENT 'Starting sprint number/name',
    sprint_end VARCHAR(100) COMMENT 'Ending sprint number/name (optional for multi-sprint stories)',
    jira VARCHAR(100) COMMENT 'Jira story number',
    `desc` TEXT COMMENT 'Description',
    jstatus VARCHAR(100) COMMENT 'Jira status',
    wi1 VARCHAR(100) COMMENT 'Work Item 1 (SC)',
    wi2 VARCHAR(100) COMMENT 'Work Item 2 (VC)',
    dstatus VARCHAR(100) COMMENT 'DevOps status',
    dorg VARCHAR(50) COMMENT 'DevOps organization',
    comments TEXT COMMENT 'Additional comments',
    custom_columns JSON COMMENT 'Custom column values as JSON',
    timestamps JSON COMMENT 'Created/Modified timestamps as JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pi (pi),
    INDEX idx_sprint_start (sprint_start),
    INDEX idx_sprint_end (sprint_end),
    INDEX idx_jira (jira),
    INDEX idx_jstatus (jstatus),
    INDEX idx_dstatus (dstatus),
    INDEX idx_dorg (dorg),
    INDEX idx_created (created_at),
    INDEX idx_modified (modified_at)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Sprint tracking records with custom fields';

-- ============================================
-- Table: notes
-- Description: Notes with color coding
-- ============================================

CREATE TABLE notes (
    id BIGINT PRIMARY KEY COMMENT 'Unique note identifier',
    title VARCHAR(500) COMMENT 'Note title',
    content TEXT COMMENT 'Note content',
    color VARCHAR(50) DEFAULT 'yellow' COMMENT 'Note color theme',
    timestamps JSON COMMENT 'Created/Modified timestamps as JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_color (color),
    INDEX idx_created (created_at),
    INDEX idx_title (title(100)),
    FULLTEXT idx_content (content)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Notes with color coding and timestamps';

-- ============================================
-- Table: tags
-- Description: Tag definitions with colors
-- ============================================

CREATE TABLE tags (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Auto-increment tag ID',
    name VARCHAR(100) UNIQUE NOT NULL COMMENT 'Tag name (unique)',
    color VARCHAR(50) COMMENT 'Tag color (hex or name)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Tag definitions with colors';

-- ============================================
-- Table: record_tags
-- Description: Many-to-many relationship between records and tags
-- ============================================

CREATE TABLE record_tags (
    record_id BIGINT NOT NULL COMMENT 'Record ID',
    tag_name VARCHAR(100) NOT NULL COMMENT 'Tag name',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (record_id, tag_name),
    INDEX idx_record (record_id),
    INDEX idx_tag (tag_name),
    FOREIGN KEY (tag_name) REFERENCES tags(name) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Record to tag relationships';

-- ============================================
-- Table: note_tags
-- Description: Many-to-many relationship between notes and tags
-- ============================================

CREATE TABLE note_tags (
    note_id BIGINT NOT NULL COMMENT 'Note ID',
    tag_name VARCHAR(100) NOT NULL COMMENT 'Tag name',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, tag_name),
    INDEX idx_note (note_id),
    INDEX idx_tag (tag_name),
    FOREIGN KEY (tag_name) REFERENCES tags(name) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Note to tag relationships';

-- ============================================
-- Table: record_links
-- Description: Record-to-record linking (relationships)
-- ============================================

CREATE TABLE record_links (
    record_id BIGINT NOT NULL COMMENT 'Source record ID',
    linked_record_id BIGINT NOT NULL COMMENT 'Linked record ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (record_id, linked_record_id),
    INDEX idx_record (record_id),
    INDEX idx_linked (linked_record_id)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Record to record linking';

-- ============================================
-- Table: note_record_links
-- Description: Note-to-record linking
-- ============================================

CREATE TABLE note_record_links (
    note_id BIGINT NOT NULL COMMENT 'Note ID',
    record_id BIGINT NOT NULL COMMENT 'Linked record ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (note_id, record_id),
    INDEX idx_note (note_id),
    INDEX idx_record (record_id)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Note to record linking';

-- ============================================
-- Table: settings
-- Description: Application settings and configuration
-- ============================================

CREATE TABLE settings (
    setting_key VARCHAR(100) PRIMARY KEY COMMENT 'Setting key (unique)',
    setting_value LONGTEXT COMMENT 'Setting value (JSON or text)',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_updated (updated_at)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Application settings and configuration';

-- ============================================
-- Table: backup_history
-- Description: Backup metadata and history
-- ============================================

CREATE TABLE backup_history (
    id BIGINT PRIMARY KEY COMMENT 'Backup ID (timestamp-based)',
    timestamp VARCHAR(50) COMMENT 'Backup timestamp',
    filename VARCHAR(255) COMMENT 'Backup filename',
    record_count INT COMMENT 'Number of records in backup',
    size BIGINT COMMENT 'Backup file size in bytes',
    schedule_type VARCHAR(50) COMMENT 'Backup type (manual, daily, weekly, etc)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_timestamp (timestamp),
    INDEX idx_created (created_at),
    INDEX idx_schedule (schedule_type)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Backup history and metadata';

-- ============================================
-- Table: backup_log
-- Description: Backup operation logs
-- ============================================

CREATE TABLE backup_log (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Log entry ID',
    timestamp VARCHAR(50) COMMENT 'Log timestamp',
    level VARCHAR(20) COMMENT 'Log level (info, warning, error)',
    message TEXT COMMENT 'Log message',
    backup_id BIGINT COMMENT 'Related backup ID',
    error TEXT COMMENT 'Error details if any',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_level (level),
    INDEX idx_backup (backup_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Backup operation logs';

-- ============================================
-- Table: sprint_colors
-- Description: Unique colors for each sprint
-- ============================================

CREATE TABLE sprint_colors (
    sprint_name VARCHAR(100) PRIMARY KEY COMMENT 'Sprint name (e.g., "1", "2", "3")',
    color VARCHAR(50) NOT NULL COMMENT 'Hex color code',
    display_order INT DEFAULT 0 COMMENT 'Display order',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Unique colors for sprints';

-- ============================================
-- Table: sprint_dates
-- Description: Sprint date ranges and colors
-- ============================================

CREATE TABLE sprint_dates (
    sprint_key VARCHAR(200) PRIMARY KEY COMMENT 'Composite key: PI|Sprint',
    sprint_name VARCHAR(100) NOT NULL COMMENT 'Sprint name',
    pi VARCHAR(100) COMMENT 'Program Increment',
    start_date DATE COMMENT 'Sprint start date',
    end_date DATE COMMENT 'Sprint end date',
    color VARCHAR(50) COMMENT 'Sprint color for calendar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sprint_name (sprint_name),
    INDEX idx_pi (pi),
    INDEX idx_start_date (start_date),
    INDEX idx_end_date (end_date),
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Sprint date ranges and calendar colors';

-- ============================================
-- Table: holidays
-- Description: Holiday dates for calendar
-- ============================================

CREATE TABLE holidays (
    holiday_date DATE PRIMARY KEY COMMENT 'Holiday date',
    holiday_name VARCHAR(200) NOT NULL COMMENT 'Holiday name/description',
    holiday_type VARCHAR(50) DEFAULT 'public' COMMENT 'Holiday type (public, company, custom)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (holiday_name),
    INDEX idx_type (holiday_type)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Holiday dates for sprint calendar';

-- ============================================
-- Table: status_colors
-- Description: Custom colors for statuses
-- ============================================

CREATE TABLE status_colors (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Color assignment ID',
    status_type VARCHAR(50) NOT NULL COMMENT 'Status type (jira, devops, org, custom)',
    status_value VARCHAR(100) NOT NULL COMMENT 'Status value',
    color VARCHAR(50) NOT NULL COMMENT 'Color (hex or name)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_status (status_type, status_value),
    INDEX idx_type (status_type),
    INDEX idx_value (status_value)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Custom colors for statuses and values';

-- ============================================
-- Table: theme_colors
-- Description: Theme color definitions for UI customization
-- ============================================

CREATE TABLE theme_colors (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Color definition ID',
    theme_name VARCHAR(50) NOT NULL COMMENT 'Theme name (default, midnight, forest, ocean, crimson, light, current)',
    color_key VARCHAR(50) NOT NULL COMMENT 'CSS variable name (e.g., --bg, --accent)',
    color_value VARCHAR(50) NOT NULL COMMENT 'Color value (hex code)',
    is_default BOOLEAN DEFAULT 0 COMMENT 'Is this the default theme',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_theme_color (theme_name, color_key),
    INDEX idx_theme (theme_name),
    INDEX idx_default (is_default)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Theme color definitions for UI customization';

-- ============================================
-- Table: automated_status_rules
-- Description: Automated status update rules
-- ============================================

CREATE TABLE automated_status_rules (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Rule ID',
    rule_name VARCHAR(200) NOT NULL COMMENT 'Rule name',
    conditions JSON NOT NULL COMMENT 'Rule conditions as JSON',
    actions JSON NOT NULL COMMENT 'Actions to perform as JSON',
    enabled BOOLEAN DEFAULT TRUE COMMENT 'Is rule enabled',
    order_index INT DEFAULT 0 COMMENT 'Execution order',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (enabled),
    INDEX idx_order (order_index)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Automated status update rules';

-- ============================================
-- Table: automated_status_log
-- Description: Execution log for automated rules
-- ============================================

CREATE TABLE automated_status_log (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Log entry ID',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Execution timestamp',
    rule_id INT COMMENT 'Rule that was executed',
    record_id BIGINT COMMENT 'Record that was affected',
    action_taken VARCHAR(200) COMMENT 'Action performed',
    old_value VARCHAR(200) COMMENT 'Old status value',
    new_value VARCHAR(200) COMMENT 'New status value',
    details TEXT COMMENT 'Additional details',
    INDEX idx_rule (rule_id),
    INDEX idx_record (record_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (rule_id) REFERENCES automated_status_rules(id) ON DELETE CASCADE
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Automated status rule execution log';

-- ============================================
-- Table: sprint_reminders_dismissed
-- Description: Tracks dismissed sprint reminders
-- ============================================

CREATE TABLE sprint_reminders_dismissed (
    sprint_key VARCHAR(200) PRIMARY KEY COMMENT 'Sprint key (PI|Sprint)',
    dismissed_at BIGINT NOT NULL COMMENT 'Timestamp when dismissed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_dismissed (dismissed_at)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Dismissed sprint reminders';

-- ============================================
-- Table: fonts
-- Description: Available fonts for the application
-- ============================================

CREATE TABLE fonts (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Font ID',
    font_name VARCHAR(100) NOT NULL COMMENT 'Display name',
    font_family VARCHAR(200) NOT NULL COMMENT 'CSS font-family value',
    is_default BOOLEAN DEFAULT FALSE COMMENT 'Is this the default font',
    enabled BOOLEAN DEFAULT TRUE COMMENT 'Is font available for selection',
    order_index INT DEFAULT 0 COMMENT 'Display order in dropdown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_font_family (font_family),
    INDEX idx_enabled (enabled),
    INDEX idx_order (order_index)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Available fonts for typography';

-- ============================================
-- Insert Default Tags
-- ============================================

INSERT INTO tags (name, color) VALUES
('Bug', '#f87171'),
('Enhancement', '#60a5fa'),
('Task', '#fbbf24'),
('Story', '#34d399')
ON DUPLICATE KEY UPDATE color=VALUES(color);

-- ============================================
-- Insert Default Theme Colors
-- ============================================

-- Default Theme
INSERT INTO theme_colors (theme_name, color_key, color_value, is_default) VALUES
('default', '--bg', '#0a0e1a', 1),
('default', '--surface', '#111827', 1),
('default', '--surface2', '#1a2236', 1),
('default', '--surface3', '#202d42', 1),
('default', '--accent', '#00d4ff', 1),
('default', '--accent2', '#7c3aed', 1),
('default', '--accent3', '#f59e0b', 1),
('default', '--accent4', '#10b981', 1),
('default', '--accent5', '#ef4444', 1),
('default', '--text', '#e2e8f0', 1),
('default', '--text2', '#94a3b8', 1),
('default', '--text3', '#64748b', 1),
('default', '--border', '#2a3a55', 1)
ON DUPLICATE KEY UPDATE color_value=VALUES(color_value);

-- Midnight Theme
INSERT INTO theme_colors (theme_name, color_key, color_value, is_default) VALUES
('midnight', '--bg', '#000000', 0),
('midnight', '--surface', '#0d0d0d', 0),
('midnight', '--surface2', '#1a1a1a', 0),
('midnight', '--surface3', '#262626', 0),
('midnight', '--accent', '#ffffff', 0),
('midnight', '--accent2', '#555555', 0),
('midnight', '--accent3', '#888888', 0),
('midnight', '--accent4', '#aaaaaa', 0),
('midnight', '--accent5', '#ff4444', 0),
('midnight', '--text', '#dddddd', 0),
('midnight', '--text2', '#999999', 0),
('midnight', '--text3', '#666666', 0),
('midnight', '--border', '#333333', 0)
ON DUPLICATE KEY UPDATE color_value=VALUES(color_value);

-- Forest Theme
INSERT INTO theme_colors (theme_name, color_key, color_value, is_default) VALUES
('forest', '--bg', '#0d1a0f', 0),
('forest', '--surface', '#122316', 0),
('forest', '--surface2', '#1a2e1f', 0),
('forest', '--surface3', '#223928', 0),
('forest', '--accent', '#22c55e', 0),
('forest', '--accent2', '#15803d', 0),
('forest', '--accent3', '#a3e635', 0),
('forest', '--accent4', '#86efac', 0),
('forest', '--accent5', '#ff5555', 0),
('forest', '--text', '#dcfce7', 0),
('forest', '--text2', '#bbf7d0', 0),
('forest', '--text3', '#86efac', 0),
('forest', '--border', '#1e4d2b', 0)
ON DUPLICATE KEY UPDATE color_value=VALUES(color_value);

-- Ocean Theme
INSERT INTO theme_colors (theme_name, color_key, color_value, is_default) VALUES
('ocean', '--bg', '#0a1628', 0),
('ocean', '--surface', '#0f2040', 0),
('ocean', '--surface2', '#152a58', 0),
('ocean', '--surface3', '#1b3470', 0),
('ocean', '--accent', '#38bdf8', 0),
('ocean', '--accent2', '#0284c7', 0),
('ocean', '--accent3', '#f0abfc', 0),
('ocean', '--accent4', '#7dd3fc', 0),
('ocean', '--accent5', '#ff6b9d', 0),
('ocean', '--text', '#e0f2fe', 0),
('ocean', '--text2', '#bae6fd', 0),
('ocean', '--text3', '#7dd3fc', 0),
('ocean', '--border', '#1e3a8a', 0)
ON DUPLICATE KEY UPDATE color_value=VALUES(color_value);

-- Crimson Theme
INSERT INTO theme_colors (theme_name, color_key, color_value, is_default) VALUES
('crimson', '--bg', '#1a0a0a', 0),
('crimson', '--surface', '#271010', 0),
('crimson', '--surface2', '#341616', 0),
('crimson', '--surface3', '#411c1c', 0),
('crimson', '--accent', '#ef4444', 0),
('crimson', '--accent2', '#b91c1c', 0),
('crimson', '--accent3', '#fbbf24', 0),
('crimson', '--accent4', '#fca5a5', 0),
('crimson', '--accent5', '#dc2626', 0),
('crimson', '--text', '#fee2e2', 0),
('crimson', '--text2', '#fecaca', 0),
('crimson', '--text3', '#fca5a5', 0),
('crimson', '--border', '#7f1d1d', 0)
ON DUPLICATE KEY UPDATE color_value=VALUES(color_value);

-- Light Theme
INSERT INTO theme_colors (theme_name, color_key, color_value, is_default) VALUES
('light', '--bg', '#f8fafc', 0),
('light', '--surface', '#ffffff', 0),
('light', '--surface2', '#f1f5f9', 0),
('light', '--surface3', '#e2e8f0', 0),
('light', '--accent', '#3b82f6', 0),
('light', '--accent2', '#7c3aed', 0),
('light', '--accent3', '#d97706', 0),
('light', '--accent4', '#059669', 0),
('light', '--accent5', '#dc2626', 0),
('light', '--text', '#1e293b', 0),
('light', '--text2', '#475569', 0),
('light', '--text3', '#94a3b8', 0),
('light', '--border', '#cbd5e1', 0)
ON DUPLICATE KEY UPDATE color_value=VALUES(color_value);

-- ============================================
-- Insert Default Fonts
-- ============================================

INSERT INTO fonts (font_name, font_family, is_default, enabled, order_index) VALUES
('DM Sans (Default)', 'DM Sans', 1, 1, 1),
('Inter', 'Inter', 0, 1, 2),
('Roboto', 'Roboto', 0, 1, 3),
('Poppins', 'Poppins', 0, 1, 4),
('Ubuntu', 'Ubuntu', 0, 1, 5),
('Open Sans', 'Open Sans', 0, 1, 6),
('Lato', 'Lato', 0, 1, 7),
('Montserrat', 'Montserrat', 0, 1, 8),
('Raleway', 'Raleway', 0, 1, 9),
('Nunito', 'Nunito', 0, 1, 10),
('Merriweather', 'Merriweather', 0, 1, 11),
('Playfair Display', 'Playfair Display', 0, 1, 12),
('Source Sans Pro', 'Source Sans Pro', 0, 1, 13),
('Work Sans', 'Work Sans', 0, 1, 14),
('Arial', 'Arial', 0, 1, 15),
('Times New Roman', 'Times New Roman', 0, 1, 16),
('Trebuchet MS', 'Trebuchet MS', 0, 1, 17),
('Courier New', 'Courier New', 0, 1, 18),
('Georgia', 'Georgia', 0, 1, 19),
('Verdana', 'Verdana', 0, 1, 20)
ON DUPLICATE KEY UPDATE font_name=VALUES(font_name), is_default=VALUES(is_default), enabled=VALUES(enabled), order_index=VALUES(order_index);

-- ============================================
-- JIRA Integration Database Schema
-- ============================================
-- Description: Database tables for JIRA integration
-- ============================================

-- ============================================
-- Table: jira_config
-- Description: JIRA connection configuration
-- ============================================

CREATE TABLE IF NOT EXISTS jira_config (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Config ID',
    jira_url VARCHAR(500) NOT NULL COMMENT 'JIRA instance URL (e.g., https://yourcompany.atlassian.net)',
    jira_email VARCHAR(255) NOT NULL COMMENT 'JIRA user email for API authentication',
    jira_api_token TEXT NOT NULL COMMENT 'JIRA API token (encrypted)',
    jira_project_key VARCHAR(50) COMMENT 'Default JIRA project key (e.g., TBCRM3)',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this config is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='JIRA connection configuration';

-- ============================================
-- Table: jira_sync_log
-- Description: Log of JIRA synchronization operations
-- ============================================

CREATE TABLE IF NOT EXISTS jira_sync_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Log entry ID',
    sync_type VARCHAR(50) NOT NULL COMMENT 'Sync type (import, export, update)',
    sync_direction VARCHAR(20) NOT NULL COMMENT 'Direction (to_jira, from_jira)',
    jira_issue_key VARCHAR(100) COMMENT 'JIRA issue key (e.g., TBCRM3-123)',
    record_id BIGINT COMMENT 'Local record ID',
    status VARCHAR(50) NOT NULL COMMENT 'Status (success, failed, partial)',
    message TEXT COMMENT 'Sync message or error details',
    sync_data JSON COMMENT 'Data that was synced',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_jira_key (jira_issue_key),
    INDEX idx_record_id (record_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='JIRA synchronization logs';

-- ============================================
-- Table: jira_field_mapping
-- Description: Mapping between local fields and JIRA fields
-- ============================================

CREATE TABLE IF NOT EXISTS jira_field_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Mapping ID',
    local_field VARCHAR(100) NOT NULL COMMENT 'Local field name',
    jira_field VARCHAR(200) NOT NULL COMMENT 'JIRA field ID or key',
    jira_field_name VARCHAR(200) COMMENT 'JIRA field display name',
    field_type VARCHAR(50) COMMENT 'Field type (string, number, date, select, etc)',
    is_required BOOLEAN DEFAULT FALSE COMMENT 'Whether field is required',
    is_bidirectional BOOLEAN DEFAULT TRUE COMMENT 'Sync both ways',
    transform_rule VARCHAR(50) COMMENT 'Transformation rule (if any)',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether this mapping is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_local_field (local_field),
    INDEX idx_jira_field (jira_field),
    INDEX idx_active (is_active)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Field mapping between local and JIRA';

-- ============================================
-- Table: jira_issues_cache
-- Description: Cached JIRA issues for performance
-- ============================================

CREATE TABLE IF NOT EXISTS jira_issues_cache (
    issue_key VARCHAR(100) PRIMARY KEY COMMENT 'JIRA issue key',
    project_key VARCHAR(50) COMMENT 'JIRA project key',
    issue_type VARCHAR(50) COMMENT 'Issue type (Story, Task, Bug, etc)',
    summary TEXT COMMENT 'Issue summary',
    description TEXT COMMENT 'Issue description',
    status VARCHAR(100) COMMENT 'Current status',
    assignee VARCHAR(255) COMMENT 'Assigned user',
    reporter VARCHAR(255) COMMENT 'Reporter user',
    priority VARCHAR(50) COMMENT 'Priority',
    labels JSON COMMENT 'Labels array',
    sprint VARCHAR(100) COMMENT 'Sprint name/ID',
    story_points DECIMAL(10,2) COMMENT 'Story points',
    parent_key VARCHAR(100) COMMENT 'Parent issue key (for sub-tasks/stories)',
    custom_fields JSON COMMENT 'Custom field values',
    created_date DATETIME COMMENT 'JIRA creation date',
    updated_date DATETIME COMMENT 'JIRA last update date',
    local_record_id BIGINT COMMENT 'Linked local record ID',
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_project_key (project_key),
    INDEX idx_status (status),
    INDEX idx_sprint (sprint),
    INDEX idx_record_id (local_record_id),
    INDEX idx_synced (last_synced_at),
    INDEX idx_created_date (created_date),
    INDEX idx_updated_date (updated_date)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Cached JIRA issues for performance';

-- ============================================
-- Insert Default Field Mappings
-- ============================================

INSERT INTO jira_field_mapping (local_field, jira_field, jira_field_name, field_type, is_required, is_bidirectional) VALUES
('jira', 'key', 'Issue Key', 'string', TRUE, TRUE),
('desc', 'summary', 'Summary', 'string', TRUE, TRUE),
('jstatus', 'status', 'Status', 'select', FALSE, TRUE),
('sprint_start', 'sprint', 'Sprint', 'string', FALSE, TRUE),
('pi', 'customfield_pi', 'Program Increment', 'string', FALSE, TRUE),
('comments', 'comment', 'Comments', 'string', FALSE, FALSE)
ON DUPLICATE KEY UPDATE modified_at = CURRENT_TIMESTAMP;

-- ============================================
-- JIRA Security Enhancement Schema
-- ============================================
-- Description: Additional security tables for JIRA integration
-- ============================================

-- ============================================
-- Table: jira_rate_limit
-- Description: Track API requests for rate limiting
-- ============================================

CREATE TABLE IF NOT EXISTS jira_rate_limit (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Rate limit entry ID',
    identifier VARCHAR(100) NOT NULL COMMENT 'Client identifier (IP address)',
    timestamp INT NOT NULL COMMENT 'Request timestamp (Unix time)',
    INDEX idx_identifier (identifier),
    INDEX idx_timestamp (timestamp),
    INDEX idx_identifier_timestamp (identifier, timestamp)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Rate limiting for JIRA API requests';

-- ============================================
-- Table: jira_csrf_tokens
-- Description: CSRF token management
-- ============================================

CREATE TABLE IF NOT EXISTS jira_csrf_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Token ID',
    token VARCHAR(64) UNIQUE NOT NULL COMMENT 'CSRF token',
    expires_at INT NOT NULL COMMENT 'Expiration timestamp',
    created_by_ip VARCHAR(45) COMMENT 'IP that created token',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='CSRF tokens for request validation';

-- ============================================
-- Table: jira_security_log
-- Description: Security events and violations
-- ============================================

CREATE TABLE IF NOT EXISTS jira_security_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Log entry ID',
    event_type VARCHAR(50) NOT NULL COMMENT 'Type of security event',
    message TEXT COMMENT 'Event message',
    ip_address VARCHAR(45) COMMENT 'Client IP address',
    details JSON COMMENT 'Additional event details',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Security events and violations log';

-- ============================================
-- Table: jira_audit_log
-- Description: Audit trail for all JIRA operations
-- ============================================

CREATE TABLE IF NOT EXISTS jira_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Audit entry ID',
    operation VARCHAR(50) NOT NULL COMMENT 'Operation type (create, update, delete, sync)',
    entity_type VARCHAR(50) COMMENT 'Entity type (config, issue, etc)',
    entity_id VARCHAR(100) COMMENT 'Entity identifier',
    user_id VARCHAR(100) COMMENT 'User who performed operation',
    ip_address VARCHAR(45) COMMENT 'Client IP address',
    fingerprint VARCHAR(64) COMMENT 'Client fingerprint hash',
    changes JSON COMMENT 'Changes made (masked sensitive data)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_operation (operation),
    INDEX idx_entity_type (entity_type),
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail for JIRA operations';

-- ============================================
-- Table: jira_ip_whitelist
-- Description: IP whitelist for restricted access
-- ============================================

CREATE TABLE IF NOT EXISTS jira_ip_whitelist (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Whitelist entry ID',
    ip_address VARCHAR(100) NOT NULL COMMENT 'IP address or CIDR range',
    description VARCHAR(255) COMMENT 'Description of IP/range',
    is_active BOOLEAN DEFAULT TRUE COMMENT 'Whether entry is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ip_address (ip_address),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='IP whitelist for JIRA access control';

-- ============================================
-- Table: jira_session_tokens
-- Description: Secure session management for JIRA operations
-- ============================================

CREATE TABLE IF NOT EXISTS jira_session_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'Session token ID',
    token VARCHAR(128) UNIQUE NOT NULL COMMENT 'Session token',
    user_id VARCHAR(100) COMMENT 'Associated user ID',
    fingerprint VARCHAR(64) COMMENT 'Client fingerprint',
    ip_address VARCHAR(45) COMMENT 'Client IP address',
    expires_at INT NOT NULL COMMENT 'Expiration timestamp',
    last_activity INT NOT NULL COMMENT 'Last activity timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at),
    INDEX idx_fingerprint (fingerprint)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Secure session tokens for JIRA operations';

-- ============================================
-- Table: jira_auto_sync_settings
-- Description: Settings for automatic JIRA synchronization
-- ============================================

CREATE TABLE IF NOT EXISTS jira_auto_sync_settings (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Settings ID',
    enabled BOOLEAN DEFAULT FALSE COMMENT 'Whether auto-sync is enabled',
    mode VARCHAR(20) DEFAULT 'interval' COMMENT 'Mode: interval or scheduled',
    sync_interval INT NOT NULL DEFAULT 3600 COMMENT 'Sync interval in seconds (for interval mode)',
    schedule_type VARCHAR(20) DEFAULT 'daily' COMMENT 'Schedule type: daily, weekly, monthly, yearly',
    schedule_time TIME DEFAULT '09:00:00' COMMENT 'Time of day to run sync',
    schedule_day_of_week TINYINT DEFAULT 1 COMMENT 'Day of week (0-6, for weekly)',
    schedule_day_of_month TINYINT DEFAULT 1 COMMENT 'Day of month (1-31, for monthly)',
    schedule_month TINYINT DEFAULT 0 COMMENT 'Month (0-11, for yearly)',
    schedule_yearly_day TINYINT DEFAULT 1 COMMENT 'Day of month for yearly (1-31)',
    last_run TIMESTAMP NULL COMMENT 'Last sync execution time',
    next_run TIMESTAMP NULL COMMENT 'Next scheduled sync time',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_enabled (enabled),
    INDEX idx_next_run (next_run)
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='Automatic JIRA synchronization settings';

-- ============================================
-- Table: jira_auto_sync_runs
-- Description: Track history of automatic JIRA sync executions
-- ============================================

CREATE TABLE IF NOT EXISTS jira_auto_sync_runs (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Run ID',
    run_type ENUM('manual', 'interval', 'scheduled') NOT NULL COMMENT 'Type of sync run',
    trigger_source VARCHAR(50) DEFAULT 'system' COMMENT 'What triggered the sync',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When sync started',
    end_time TIMESTAMP NULL COMMENT 'When sync completed',
    duration_seconds INT NULL COMMENT 'Sync duration in seconds',
    status ENUM('running', 'success', 'error', 'timeout') DEFAULT 'running' COMMENT 'Run status',
    stories_total INT DEFAULT 0 COMMENT 'Total stories processed',
    stories_synced INT DEFAULT 0 COMMENT 'Successfully synced stories',
    stories_failed INT DEFAULT 0 COMMENT 'Failed to sync stories',
    error_message TEXT NULL COMMENT 'Error details if failed',
    jql_query TEXT NULL COMMENT 'JQL query used',
    sync_settings_id INT NULL COMMENT 'Reference to auto-sync settings',
    client_ip VARCHAR(45) NULL COMMENT 'Client IP that triggered manual sync',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_run_type (run_type),
    INDEX idx_status (status),
    INDEX idx_start_time (start_time),
    INDEX idx_sync_settings (sync_settings_id),
    FOREIGN KEY (sync_settings_id) REFERENCES jira_auto_sync_settings(id) ON DELETE SET NULL
) ENGINE=InnoDB 
DEFAULT CHARSET=utf8mb4 
COLLATE=utf8mb4_unicode_ci
COMMENT='History log of JIRA auto-sync executions';

-- ============================================
-- Modify jira_config table to add security fields
-- ============================================

ALTER TABLE jira_config 
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP NULL COMMENT 'Last time config was used',
ADD COLUMN IF NOT EXISTS failed_attempts INT DEFAULT 0 COMMENT 'Failed authentication attempts',
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL COMMENT 'Lock timeout for failed attempts',
ADD COLUMN IF NOT EXISTS created_by_ip VARCHAR(45) COMMENT 'IP that created config',
ADD INDEX IF NOT EXISTS idx_last_used (last_used_at);

-- ============================================
-- Modify jira_sync_log to add security fields
-- ============================================

ALTER TABLE jira_sync_log
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45) COMMENT 'IP that initiated sync',
ADD COLUMN IF NOT EXISTS fingerprint VARCHAR(64) COMMENT 'Client fingerprint',
ADD INDEX IF NOT EXISTS idx_ip_address (ip_address);

-- ============================================
-- Insert default IP whitelist entries (localhost)
-- ============================================

INSERT INTO jira_ip_whitelist (ip_address, description, is_active) VALUES
('127.0.0.1', 'Localhost IPv4', TRUE),
('::1', 'Localhost IPv6', TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- ============================================
-- Create function to clean expired tokens
-- ============================================

DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS clean_expired_jira_tokens()
BEGIN
    DECLARE ts_now INT;
    SET ts_now = UNIX_TIMESTAMP();
    
    -- Clean expired CSRF tokens
    DELETE FROM jira_csrf_tokens WHERE expires_at < ts_now;
    
    -- Clean expired session tokens
    DELETE FROM jira_session_tokens WHERE expires_at < ts_now;
    
    -- Clean old rate limit entries (older than 1 hour)
    DELETE FROM jira_rate_limit WHERE timestamp < (ts_now - 3600);
    
    -- Clean old security logs (older than 90 days)
    DELETE FROM jira_security_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Clean old audit logs (older than 1 year)
    DELETE FROM jira_audit_log WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
END$$

DELIMITER ;


-- ============================================
-- Insert Default Settings
-- ============================================

-- Jira Statuses
INSERT INTO settings (setting_key, setting_value) VALUES
('jiraStatuses', '["Open","Ready","Refining","In Progress","Ready for QA Move","QA Test Ready","QA Testing","Ready for UAT Move","UAT Testing","PO Review","Ready for Release","Cancelled","Completed"]')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- DevOps Statuses
INSERT INTO settings (setting_key, setting_value) VALUES
('devopsStatuses', '["Created","Pull Request","Deployed"]')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- DevOps Organizations
INSERT INTO settings (setting_key, setting_value) VALUES
('devopsOrgs', '["INT","QA","UAT","PROD"]')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- System Columns Configuration
INSERT INTO settings (setting_key, setting_value) VALUES
('columns', '[{"key":"pi","label":"PI","visible":true,"system":true,"order":1},{"key":"sprint_start","label":"Sprint","visible":true,"system":true,"order":2},{"key":"jira","label":"Jira Story","visible":true,"system":true,"order":3},{"key":"desc","label":"Description","visible":true,"system":true,"order":4},{"key":"jstatus","label":"Jira Status","visible":true,"system":true,"order":5},{"key":"wi1","label":"Work Item 1 (SC)","visible":true,"system":true,"order":6},{"key":"wi2","label":"Work Item 2 (VC)","visible":true,"system":true,"order":7},{"key":"dstatus","label":"DevOps Status","visible":true,"system":true,"order":8},{"key":"dorg","label":"DevOps ORG","visible":true,"system":true,"order":9},{"key":"comments","label":"Comments","visible":true,"system":true,"order":10},{"key":"tags","label":"Tags","visible":true,"system":true,"order":11},{"key":"timestamps","label":"Timestamps","visible":true,"system":true,"order":12}]')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Custom Columns (initially empty)
INSERT INTO settings (setting_key, setting_value) VALUES
('customColumns', '[]')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- URL Templates
INSERT INTO settings (setting_key, setting_value) VALUES
('jiraUrlTemplate', '"https://sentara.atlassian.net/browser/{formatted}"'),
('jiraDisplayFormat', '"TBCRM3-{number}"'),
('wiUrlTemplate', '"https://github.com/sentara-health/Salesforce-SentaraHealth-Vlocity/tree/WI-{formatted}"'),
('wiDisplayFormat', '"WI-{number6}"')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Branding Labels
INSERT INTO settings (setting_key, setting_value) VALUES
('labels', '{"pageTitle":"Sprint Tracker Pro — TBCRM3","logoText":"Sprint","logoTextHighlight":"Track","logoTextEnd":"Pro","headerMeta":"TBCRM3 · Salesforce Vlocity Project","appName":"Sprint Track Pro","tabDashboard":"📊 Dashboard","tabDataEntry":"📋 Data Entry","tabSummary":"📈 Detailed Summary","tabConfig":"⚙️ Configuration","tabNotes":"📝 Notes","tabSprintCalendar":"📅 Sprint Calendar"}')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Font Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('fontSettings', '{"logoIcon":"ST","fontFamily":"DM Sans","baseFontSize":13}')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Download Filename
INSERT INTO settings (setting_key, setting_value) VALUES
('downloadFilename', '"sprint-tracker"')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Timestamp Format
INSERT INTO settings (setting_key, setting_value) VALUES
('timestampFormat', '"datetime"')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Matrix Background Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('useMatrixBackground', 'true'),
('matrixFontSize', '12'),
('matrixChars', '"ﾊﾐﾋｰｳﾆﾜﾄﾁﾙﾒﾓﾔﾔﾗﾘﾜﾇﾌﾆﾌﾞﾔﾂﾘﾌﾆﾄﾁﾙﾒﾓﾔ"')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Backup Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('backupSettings', '{"enabled":false,"scheduleType":"daily","scheduleTime":"02:00","scheduleDay":"Monday","scheduleDate":"1","autoDelete":false,"retentionDays":30,"lastBackup":null,"nextBackup":null}'),
('backupHistory', '[]'),
('backupLog', '[]')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Automated Status Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('automatedStatus', '{"enabled":false,"rules":[],"lastExecution":null,"executionLog":[]}')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Sprint Calendar Settings
INSERT INTO settings (setting_key, setting_value) VALUES
('sprintCalendar', '{"currentMonth":1,"currentYear":2026,"sprintDates":{},"sprintColors":{},"viewMode":"month","holidays":{},"compactMode":false,"reminders":{"enabled":true,"sprintStarting":{"enabled":true,"days":1},"sprintEnding":{"enabled":true,"days":2},"sprintOverdue":{"enabled":true},"lastChecked":null,"dismissed":{}}}')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Filter Criteria (initially empty)
INSERT INTO settings (setting_key, setting_value) VALUES
('filterCriteria', '{"pi":"","sprint_start":"","jstatus":"","dstatus":"","dorg":""}')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Colors (initially empty)
INSERT INTO settings (setting_key, setting_value) VALUES
('colors', '{}')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- Export Columns Selection
INSERT INTO settings (setting_key, setting_value) VALUES
('selectedExportColumns', '{"record":[],"notes":["title","content","createdOn","noteTags"]}')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- ============================================
-- Sample Data (Optional - Uncomment to use)
-- ============================================

/*
-- Sample Record
INSERT INTO records (id, pi, sprint, jira, `desc`, jstatus, wi1, wi2, dstatus, dorg, comments, custom_columns, timestamps) VALUES
(1709000000000, 'PI-1', 'Sprint 1', '12345', 'Sample Story', 'In Progress', '000001', '000001', 'Created', 'INT', 'Sample comment', '{}', '{"created":"2026-02-25T10:00:00Z","modified":"2026-02-25T10:00:00Z"}');

-- Sample Note
INSERT INTO notes (id, title, content, color, timestamps) VALUES
(1709000000001, 'Sample Note', 'This is a sample note for testing', 'yellow', '{"created":"2026-02-25T10:00:00Z"}');

-- Link sample record to Bug tag
INSERT INTO record_tags (record_id, tag_name) VALUES
(1709000000000, 'Bug');

-- Link sample note to Enhancement tag
INSERT INTO note_tags (note_id, tag_name) VALUES
(1709000000001, 'Enhancement');

-- Sample Sprint Date
INSERT INTO sprint_dates (sprint_key, sprint_name, pi, start_date, end_date, color) VALUES
('PI-1|Sprint 1', 'Sprint 1', 'PI-1', '2026-02-01', '2026-02-14', '#8b5cf6');

-- Sample Sprint Colors (Unique colors for sprints 1-6)
INSERT INTO sprint_colors (sprint_name, color, display_order) VALUES
('1', '#8b5cf6', 1),  -- Purple
('2', '#10b981', 2),  -- Green
('3', '#f59e0b', 3),  -- Orange
('4', '#3b82f6', 4),  -- Blue
('5', '#ec4899', 5),  -- Pink
('6', '#ef4444', 6);  -- Red

-- Sync sprint_dates colors with official sprint_colors table
-- This ensures existing sprint_dates entries have the correct colors
UPDATE sprint_dates sd
INNER JOIN sprint_colors sc ON sd.sprint_name = sc.sprint_name
SET sd.color = sc.color;

-- Sample Holiday
INSERT INTO holidays (holiday_date, holiday_name, holiday_type) VALUES
('2026-07-04', 'Independence Day', 'public'),
('2026-12-25', 'Christmas', 'public');

-- Sample Status Color
INSERT INTO status_colors (status_type, status_value, color) VALUES
('jira', 'In Progress', '#3b82f6'),
('devops', 'Deployed', '#10b981');

-- Sample Automated Rule
INSERT INTO automated_status_rules (rule_name, conditions, actions, enabled, order_index) VALUES
('Auto-complete deployed items', 
'{"field":"dstatus","operator":"equals","value":"Deployed"}',
'{"field":"jstatus","value":"Completed"}',
TRUE, 1);
*/

-- ============================================
-- Useful Queries for Maintenance
-- ============================================

-- View all records with their tags
-- SELECT r.*, GROUP_CONCAT(rt.tag_name) as tags
-- FROM records r
-- LEFT JOIN record_tags rt ON r.id = rt.record_id
-- GROUP BY r.id;

-- View all notes with their tags
-- SELECT n.*, GROUP_CONCAT(nt.tag_name) as tags
-- FROM notes n
-- LEFT JOIN note_tags nt ON n.id = nt.note_id
-- GROUP BY n.id;

-- Count records by status
-- SELECT jstatus, COUNT(*) as count
-- FROM records
-- GROUP BY jstatus
-- ORDER BY count DESC;

-- View sprints with date ranges
-- SELECT sprint_key, sprint_name, pi, start_date, end_date, color,
--        DATEDIFF(end_date, start_date) as duration_days
-- FROM sprint_dates
-- ORDER BY start_date DESC;

-- View active sprints (current date within range)
-- SELECT * FROM sprint_dates
-- WHERE CURDATE() BETWEEN start_date AND end_date
-- ORDER BY start_date;

-- View upcoming holidays
-- SELECT * FROM holidays
-- WHERE holiday_date >= CURDATE()
-- ORDER BY holiday_date;

-- View records in a specific sprint with their tags
-- SELECT r.*, GROUP_CONCAT(rt.tag_name) as tags
-- FROM records r
-- LEFT JOIN record_tags rt ON r.id = rt.record_id
-- WHERE r.sprint_start = 'Sprint 1'
-- GROUP BY r.id;

-- View automated rule execution history
-- SELECT asl.*, asr.rule_name, r.jira, r.desc
-- FROM automated_status_log asl
-- LEFT JOIN automated_status_rules asr ON asl.rule_id = asr.id
-- LEFT JOIN records r ON asl.record_id = r.id
-- ORDER BY asl.timestamp DESC
-- LIMIT 100;

-- Count records per sprint
-- SELECT sprint, COUNT(*) as record_count
-- FROM records
-- WHERE sprint IS NOT NULL AND sprint != ''
-- GROUP BY sprint
-- ORDER BY record_count DESC;

-- View record links (relationships)
-- SELECT r1.jira as source_jira, r1.desc as source_desc,
--        r2.jira as linked_jira, r2.desc as linked_desc
-- FROM record_links rl
-- JOIN records r1 ON rl.record_id = r1.id
-- JOIN records r2 ON rl.linked_record_id = r2.id;

-- Recent backups
-- SELECT * FROM backup_history
-- ORDER BY created_at DESC
-- LIMIT 10;

-- Database size information
-- SELECT 
--     table_name AS 'Table',
--     ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)',
--     table_rows AS 'Rows'
-- FROM information_schema.TABLES
-- WHERE table_schema = 'sprint_tracker_db'
-- ORDER BY (data_length + index_length) DESC;

-- ============================================
-- Optimize Tables (Run periodically)
-- ============================================

-- OPTIMIZE TABLE records;
-- OPTIMIZE TABLE notes;
-- OPTIMIZE TABLE tags;
-- OPTIMIZE TABLE record_tags;
-- OPTIMIZE TABLE note_tags;
-- OPTIMIZE TABLE sprint_dates;
-- OPTIMIZE TABLE holidays;
-- OPTIMIZE TABLE status_colors;
-- OPTIMIZE TABLE theme_colors;
-- OPTIMIZE TABLE automated_status_rules;
-- OPTIMIZE TABLE settings;

-- ============================================
-- Backup Current Data (Run before major changes)
-- ============================================

-- mysqldump -u root -p sprint_tracker_db > backup_sprint_tracker.sql

-- ============================================
-- Restore from Backup
-- ============================================

-- mysql -u root -p sprint_tracker_db < backup_sprint_tracker.sql

-- ============================================
-- Database Setup Complete!
-- ============================================

SELECT 
    'Database setup completed successfully!' AS Status,
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE table_schema = 'sprint_tracker_db') AS 'Tables Created',
    (SELECT COUNT(*) FROM tags) AS 'Default Tags',
    (SELECT COUNT(*) FROM theme_colors) AS 'Theme Colors',
    (SELECT COUNT(*) FROM settings) AS 'Settings Configured',
    (SELECT COUNT(*) FROM sprint_dates) AS 'Sprints Defined',
    (SELECT COUNT(*) FROM holidays) AS 'Holidays Set';

-- Show all tables
SHOW TABLES;