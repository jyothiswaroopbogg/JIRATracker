# Sprint Tracker Pro

**Version:** 2.0  
**Project:** TBCRM3 - Salesforce Vlocity Project  
**Updated:** March 2026

A comprehensive, enterprise-grade web-based application for tracking and managing Agile sprints, JIRA stories, and work items. Features advanced automation, bidirectional JIRA synchronization, real-time analytics, visual sprint calendar, and customizable workflows designed for Salesforce Vlocity project management.

---

## 📑 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
  - [Quick Setup](#quick-setup-automated)
  - [Manual Setup](#manual-setup-step-by-step)
  - [Post-Installation](#post-installation-steps)
- [Configuration](#-configuration)
  - [JIRA Integration](#1-jira-integration)
  - [Security](#2-security-configuration)
  - [Branding & Themes](#3-branding--themes)
  - [Automation Rules](#7-automated-status-rules)
  - [Backups](#8-backup-configuration)
- [Usage Guide](#-usage-guide)
  - [Managing Sprint Stories](#managing-sprint-stories)
  - [JIRA Synchronization](#jira-synchronization)
  - [Working with Attachments](#working-with-attachments)
  - [Filtering and Search](#filtering-and-search)
  - [Bulk Operations](#bulk-operations)
  - [Analytics and Reports](#analytics-and-reports)
- [Technical Stack](#-technical-stack)
- [Project Structure](#-project-structure)
- [Backup & Restore](#-backup--restore)
- [Troubleshooting](#-troubleshooting)
  - [JIRA Connection Issues](#jira-connection-issues)
  - [Attachment Issues](#attachment-issues)
  - [Data Issues](#data-issues)
  - [Performance Issues](#performance-issues)
  - [Common Error Messages](#common-error-messages)
- [Development](#-development)
  - [Code Structure](#code-structure)
  - [Development Setup](#development-setup)
  - [Code Standards](#code-standards)
  - [Adding New Features](#adding-new-features)
  - [Testing](#testing)
  - [Performance Optimization](#performance-optimization)
- [API Reference](#-api-reference)
  - [REST API Endpoints](#rest-api-endpoints)
  - [JavaScript API](#javascript-api)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)
- [Version History](#-version-history)

---

## 🚀 Quick Start

```bash
# 1. Navigate to XAMPP htdocs
cd c:\xampp\htdocs

# 2. Clone or extract project
# (Sprint Tracker files should be in NewJirastoriestracker folder)

# 3. Create database
mysql -u root -p
CREATE DATABASE sprint_tracker;
USE sprint_tracker;
SOURCE Database/sprint_tracker.sql;
EXIT;

# 4. Configure (see Configuration section below)
# - Edit Database/config.php
# - Edit JIRA/config.api.php

# 5. Access application
# Open http://localhost/NewJirastoriestracker/
```

---

## 📋 Features

### 🎯 Core Sprint Tracking
- **Multi-Level Sprint Organization**: Program Increment (PI) → Quarter → Sprint hierarchy
- **Dual Work Item Tracking**: Separate tracking for SC (Story Card) and VC (Velocity Card) work items
- **Story Management**: Full CRUD operations with validation and timestamps
- **DevOps Integration**: Track deployment status across INT, QA, UAT, and PROD environments
- **Configurable Status Workflows**: Customizable Jira and DevOps status values
- **Multi-Sprint Stories**: Support for stories spanning multiple sprints
- **Custom Fields**: Extensible JSON-based custom column system

### 🔄 JIRA Integration (Bidirectional Sync)
- **Live Synchronization**: Real-time two-way sync with JIRA Cloud
- **Attachment Support**: View JIRA images inline, download PDFs, Word, Excel files with proper file types
- **ADF Parser**: Full Atlassian Document Format support for rich text rendering
- **Custom Field Mapping**: Map local fields to JIRA custom fields (configurable)
- **Bulk Import**: Import multiple stories from JIRA with field mapping
- **Smart Caching**: Local cache for performance with automatic refresh
- **JQL Search**: Advanced JIRA Query Language support for precise story filtering
- **Auto-Sync**: Scheduled background synchronization (interval or scheduled modes)
- **Sync Logs**: Complete audit trail of all JIRA synchronization activities
- **Field Transformations**: Automatic data transformation between JIRA and local formats
- **Conflict Resolution**: Smart handling of concurrent updates

### 🤖 Advanced Automation
- **Automated Status Rules**: Create rules to automatically update story status based on conditions
- **Rule Engine**: Complex conditional logic (equals, contains, greater than, less than, etc.)
- **Multi-Action Rules**: Single trigger can perform multiple actions
- **Rule Priority**: Ordered execution with priority levels
- **Execution Logging**: Complete audit trail of automated changes
- **Dry Run Mode**: Test rules without making actual changes
- **Rule Templates**: Pre-built templates for common scenarios

### 📅 Visual Sprint Calendar
- **Multi-View Modes**: Month, quarter, and year views
- **Sprint Timeline**: Visual representation of sprint schedules
- **Drag-and-Drop**: Update sprint dates by dragging events
- **Color Coding**: Unique colors for each sprint (customizable)
- **Holiday Management**: Mark public and company holidays
- **Live Time Indicator**: Real-time "current moment" line with second precision
- **Sprint Reminders**: Automatic notifications for sprint start/end
- **Milestone Tracking**: Mark important dates and deadlines
- **Business Days Calculation**: Smart sprint duration excluding weekends/holidays
- **Compact Mode**: Space-efficient view for large sprint counts

### 📊 Analytics & Reporting
- **Real-Time KPIs**: Total stories, completed, in-progress, deployed to production
- **Interactive Charts**: 
  - Jira Status Distribution (breakdown of story states)
  - Sprint Velocity (stories per sprint over time)
  - DevOps Status Breakdown (deployment pipeline visualization)
  - PI Progress (stories across Program Increments)
- **Custom Chart Tooltips**: Detailed information on hover
- **Lazy Loading Charts**: Progressive loading for better performance
- **Sprint Report Generator**: Comprehensive sprint analysis with export
- **Trend Analysis**: Historical data visualization
- **Export Capabilities**: PDF and Excel report generation

### 🔍 Advanced Filtering & Search
- **Multi-Criteria Filters**: PI, Quarter, Sprint, Status, DevOps Status, Organization
- **Tag-Based Filtering**: Filter by single or multiple tags
- **Full-Text Search**: Search across summary, description, comments
- **Column-Based Filters**: Filter by any visible column value
- **Saved Filter Presets**: Save and recall common filter combinations
- **Real-Time Filtering**: Instant results as you type
- **Filter Persistence**: Maintains filters across sessions

### 🏷️ Tagging System
- **Custom Tags**: Create unlimited tags with custom colors
- **Multi-Tag Support**: Apply multiple tags to stories and notes
- **Tag Management**: Add, edit, delete, and organize tags
- **Tag Statistics**: Count of stories per tag
- **Tag Filtering**: Quick filter by clicking tags
- **Color Customization**: Hex color picker for each tag
- **Default Tags**: Pre-configured Bug, Enhancement, Task, Story tags

### 📝 Notes System
- **Color-Coded Notes**: Yellow, blue, green, pink, orange, purple notes
- **Rich Text Support**: Multi-line content with formatting
- **Note-to-Record Links**: Link notes to specific stories
- **Note Tags**: Apply tags to notes for organization
- **Search Notes**: Full-text search across note content
- **Note Timestamps**: Track creation and modification times

### ⚡ Bulk Operations
- **Multi-Select**: Checkbox selection for batch operations
- **Bulk Status Update**: Change Jira or DevOps status for multiple stories
- **Bulk Tagging**: Add tags to multiple stories simultaneously
- **Bulk Delete**: Remove multiple stories with confirmation
- **Bulk Export**: Export selected stories only
- **Progress Indicators**: Visual feedback during bulk operations

### 🎨 Customization & Branding
- **Theme System**: 7 pre-built themes (Default, Midnight, Forest, Ocean, Crimson, Light, custom)
- **Custom Theme Creator**: Create and save your own color schemes
- **Logo Upload**: Custom logo image upload (SVG, PNG support)
- **Font Selection**: 20+ Google Font options + system fonts
- **Branding Labels**: Customize all UI text and titles
- **Favicon Dynamic Update**: Logo changes reflect in browser tab icon
- **Layout Customization**: Configurable column visibility and order
- **Matrix Background**: Animated Matrix-style background with character customization
- **Font Size Control**: Adjustable base font size for accessibility

### 💾 Backup & Data Management
- **Manual Backup**: One-click JSON export of complete database
- **Scheduled Backups**: Automatic backups (daily, weekly, monthly, yearly)
- **Backup History**: Track all backups with timestamps and sizes
- **Restore from Backup**: Full or selective restore from JSON files
- **Auto-Delete Old Backups**: Configurable retention policy
- **Import/Export**: Selective export of specific data types
- **Data Validation**: Integrity checks on import

### 🔗 Relationship Management
- **Story Links**: Link related stories (blocks, relates to, depends on)
- **Note-to-Story Links**: Associate notes with specific stories
- **Link Visualization**: See all relationships at a glance
- **Bidirectional Links**: Navigate between linked items easily

### 📱 User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Keyboard Shortcuts**: Fast navigation and actions
- **Toast Notifications**: Non-intrusive success/error messages
- **Modal Dialogs**: Smooth, accessible pop-ups for details and editing
- **Lazy Loading**: Efficient data loading for large datasets
- **Pagination**: Configurable page size with smart navigation
- **Quick Add**: Minimal-field story creation mode
- **Form Validation**: Client and server-side validation
- **Auto-Save**: Prevents data loss with automatic drafts
- **Confirmation Dialogs**: Protect against accidental deletions

### 🔒 Security & Compliance
- **IP Whitelisting**: Restrict access by IP address or CIDR range
- **Rate Limiting**: Prevent API abuse (1000 req/10s localhost, 100 req/1s remote)
- **CSRF Protection**: Token-based request validation
- **SQL Injection Prevention**: Prepared statements throughout
- **XSS Protection**: Input sanitization and output escaping
- **Session Management**: Secure session tokens with expiration
- **Audit Logging**: Complete trail of all operations
- **Encrypted Storage**: JIRA credentials encrypted at rest
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, etc.
- **Failed Login Protection**: Account lockout after repeated failures

### 🎯 Workflow Optimization
- **Column Toggles**: Show/hide columns dynamically
- **Custom Columns**: Add unlimited custom fields
- **Work Item Linking**: GitHub URL integration for work items
- **Quick Filters**: One-click common filter presets
- **Batch Import**: Import multiple stories from CSV or JIRA
- **Smart Defaults**: Auto-populate fields based on previous entries
- **Timestamp Tracking**: Automatic created/modified timestamps

## 🚀 Getting Started

### Prerequisites

- **Web Server**: Apache 2.4+ or Nginx 1.18+ (XAMPP 8.0+ recommended for Windows)
- **PHP**: Version 7.4 or higher (PHP 8.0+ recommended)
  - Required extensions: `mysqli`, `json`, `curl`, `mbstring`, `openssl`
  - Optional: `opcache` for better performance
- **MySQL/MariaDB**: Version 5.7+ or MariaDB 10.3+
- **Disk Space**: Minimum 100MB free space (500MB+ recommended for logs and backups)
- **JIRA Cloud Account**: With API access enabled (for JIRA integration features)
- **Modern Browser**: Chrome 90+, Firefox 88+, Edge 90+, or Safari 14+

### Installation

#### Method 1: Quick Setup (Recommended)

1. **Download and Extract**:
   ```bash
   cd /path/to/webserver/htdocs
   # Extract files to NewJirastoriestracker folder
   ```

2. **Auto-Configure Database**:
   - Access: `http://localhost/NewJirastoriestracker`
   - The application will guide you through database setup

#### Method 2: Manual Setup

1. **Clone or Download**:
   ```bash
   cd c:\xampp\htdocs
   git clone <repository-url> NewJirastoriestracker
   ```

2. **Create Database**:
   ```sql
   CREATE DATABASE sprint_tracker_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Import Database Schema**:
   
   Using MySQL Command Line:
   ```bash
   mysql -u root -p sprint_tracker_db < Database/sprint_tracker.sql
   ```
   
   Or using phpMyAdmin:
   - Navigate to phpMyAdmin
   - Select `sprint_tracker_db` database
   - Click "Import" tab
   - Choose `Database/sprint_tracker.sql` file
   - Click "Go"

4. **Configure Database Connection**:
   
   Edit `Database/config.php`:
   ```php
   <?php
   // Database configuration
   define('DB_HOST', 'localhost');
   define('DB_USER', 'root');              // Your MySQL username
   define('DB_PASS', '');                   // Your MySQL password
   define('DB_NAME', 'sprint_tracker_db'); // Database name
   define('DB_CHARSET', 'utf8mb4');
   
   // Encryption key for sensitive data (CHANGE THIS!)
   define('ENCRYPTION_KEY', 'your-secure-random-key-here');
   ?>
   ```

5. **Set File Permissions (Linux/Mac)**:
   ```bash
   chmod 755 Database/ JIRA/ backup/
   chmod 644 Database/*.php JIRA/*.php
   chmod 666 backup/  # Needs write permission
   ```

6. **Configure PHP (Optional but Recommended)**:
   
   Edit `php.ini`:
   ```ini
   max_execution_time = 300
   memory_limit = 256M
   post_max_size = 50M
   upload_max_filesize = 50M
   opcache.enable = 1
   opcache.memory_consumption = 128
   ```

7. **Enable Required Apache Modules**:
   ```bash
   # Enable mod_rewrite (if using clean URLs)
   a2enmod rewrite
   a2enmod headers
   service apache2 restart
   ```

8. **Access Application**:
   - Open browser: `http://localhost/NewJirastoriestracker`
   - You should see the Sprint Tracker Pro interface
   - Default configuration loaded automatically

### Post-Installation

1. **Verify Installation**:
   - Check that all 7 tabs load correctly
   - Verify database connection in Configuration tab
   - Test creating a sample record

2. **Configure JIRA** (if using JIRA integration):
   - Navigate to "🔗 JIRA" tab
   - Click "Configure JIRA Connection"
   - Enter your JIRA credentials
   - Test connection

3. **Customize Branding** (optional):
   - Go to "⚙️ Configuration" tab
   - Update labels, logo, colors as desired
   - Save settings

4. **Initial Data Setup**:
   - Add your PI and Sprint values
   - Configure Jira and DevOps status workflows
   - Create custom tags for your team

## ⚙️ Configuration

### JIRA Integration Setup

1. **Generate JIRA API Token**:
   - Log in to [Atlassian Account](https://id.atlassian.com)
   - Navigate to Security → API Tokens
   - Click "Create API token"
   - Give it a label (e.g., "Sprint Tracker Integration")
   - Copy the token (you won't see it again!)

2. **Configure Connection in Application**:
   - Navigate to "🔗 JIRA" tab
   - Click "Configure JIRA Connection" or gear icon
   - Fill in the form:
     - **JIRA URL**: `https://your-domain.atlassian.net` (no trailing slash)
     - **Email**: Your JIRA account email address
     - **API Token**: Paste the token from step 1
     - **Project Key**: Your JIRA project key (e.g., `TBCRM3`, `PROJ`, `DEV`)
   - Click "Save Configuration"

3. **Test Connection**:
   - Click "Test Connection" button
   - Should see success message with project details
   - If error, verify URL format and credentials

4. **Configure Field Mapping** (Advanced):
   - Go to JIRA Settings → Field Mapping
   - Map local fields to JIRA custom fields
   - Common mappings:
     - `pi` → `customfield_xxxxx` (PI field ID)
     - `sprint_start` → `sprint` or `customfield_xxxxx`
     - `desc` → `summary`
     - `jstatus` → `status`
   - Save mappings

5. **Set Up Auto-Sync** (Optional):
   - Enable "Auto-Sync" toggle
   - Choose mode:
     - **Interval**: Sync every X seconds (default: 900 = 15 minutes)
     - **Scheduled**: Sync at specific time daily/weekly/monthly
   - Configure sync direction (from JIRA, to JIRA, or both)
   - Save settings

### Security Configuration

#### IP Whitelist

1. **Enable IP Restrictions**:
   - Navigate to Configuration → Security Settings
   - Enable "IP Whitelist"
   - Add allowed IP addresses:
     - Single IP: `192.168.1.100`
     - CIDR range: `192.168.1.0/24`
     - Multiple: One per line
   - `127.0.0.1` and `::1` are always allowed
   
2. **Manage Whitelist via Database**:
   ```sql
   -- Add IP to whitelist
   INSERT INTO jira_ip_whitelist (ip_address, description, is_active)
   VALUES ('10.0.0.50', 'Office Network', TRUE);
   
   -- View all whitelisted IPs
   SELECT * FROM jira_ip_whitelist WHERE is_active = TRUE;
   ```

#### Rate Limiting

Default limits (configured in `JIRA/security.php`):
- **Localhost**: 1000 requests per 10 seconds
- **Remote GET**: 60 requests per 500ms
- **Remote POST**: 20 requests per 200ms

To modify:
```php
// In JIRA/security.php
checkRateLimit($conn, $clientIP, $maxRequests, $windowMs);
```

#### CSRF Protection

- Automatically enabled for all POST/PUT/DELETE requests
- Tokens expire after 24 hours
- Tokens tied to client IP and fingerprint
- Clear expired tokens:
  ```sql
  CALL clean_expired_jira_tokens();
  ```

### Branding & Customization

#### Logo and Branding

1. **Upload Custom Logo**:
   - Go to Configuration → Branding
   - Click "Upload Logo"
   - Select SVG or PNG file (max 2MB)
   - Logo appears in header and as favicon

2. **Customize Labels**:
   - Page Title: Browser tab title
   - Logo Text: Main logo text (default: "Sprint")
   - Logo Highlight: Middle text (default: "Track")
   - Logo End: End text (default: " Pro")
   - Header Meta: Subtitle (default: "TBCRM3 · Salesforce Vlocity Project")
   - Tab Names: All tab labels

3. **Font Customization**:
   - Choose from 20+ Google Fonts
   - Adjust base font size (10-20px)
   - Custom font upload (advanced)

#### Theme Configuration

**Apply Pre-Built Theme**:
1. Configuration → Theme Settings
2. Select theme: Default, Midnight, Forest, Ocean, Crimson, Light
3. Click "Apply Theme"

**Create Custom Theme**:
1. Start with existing theme
2. Customize color variables:
   - `--bg`: Background color
   - `--surface`: Card backgrounds
   - `--accent`: Primary accent color
   - `--text`: Primary text color
   - ...and 10+ more variables
3. Save as new theme

**Background Animation**:
- Enable/Disable Matrix background
- Character set: Unicode characters for the falling effect
- Font size: 6-24px
- Speed control

### Sprint Calendar Configuration

1. **Add Sprint Dates**:
   - Navigate to "📅 Sprint Calendar"
   - Click on any date
   - Enter:
     - Sprint name/number
     - Program Increment (PI)
     - Start and end dates
     - Custom color (optional)
   - Save

2. **Manage Holidays**:
   - Click "Manage Holidays"
   - Add public or company holidays
   - Holidays are excluded from business day calculations

3. **Configure Reminders**:
   - Enable sprint reminders
   - Set notification triggers:
     - Sprint starting in X days (default: 1 day)
     - Sprint ending in X days (default: 2 days)
     - Overdue sprints
   - Dismiss reminders individually

### Automated Status Rules

1. **Create Rule**:
   - Configuration → Automated Status
   - Click "Add New Rule"
   - Define:
     - **Rule Name**: Descriptive name
     - **Conditions**: When to trigger (field, operator, value)
     - **Actions**: What to do (update field, value)
     - **Priority**: Execution order
   - Enable rule

2. **Rule Examples**:
   
   **Auto-Complete Deployed Items**:
   - Condition: DevOps Status equals "Deployed" AND DevOps Org equals "PROD"
   - Action: Set Jira Status to "Completed"
   
   **Move to QA**:
   - Condition: DevOps Status equals "Deployed" AND DevOps Org equals "INT"
   - Action: Set Jira Status to "Ready for QA Move"

3. **Test Rules**:
   - Use "Dry Run" mode
   - View execution log for detailed results
   - Enable only after testing

### Backup Configuration

**Manual Backup**:
- Click "💾 Backup" button in any tab
- Download JSON file with all data

**Scheduled Backups**:
1. Configuration → Backup Settings
2. Enable "Automatic Backups"
3. Configure:
   - Schedule: Daily, Weekly, Monthly, Yearly
   - Time: Specific time of day
   - Day: For weekly/monthly schedules
   - Retention: Auto-delete after X days
4. Backups stored in `backup/` directory

**Restore from Backup**:
1. Configuration → Import/Export
2. Click "Import from Backup"
3. Select JSON file
4. Choose import options:
   - Replace all data
   - Merge with existing
   - Import specific tables only
5. Confirm and restore

### Advanced Settings

#### Custom Columns

1. **Add Custom Column**:
   - Configuration → Custom Fields
   - Click "Add Custom Column"
   - Enter:
     - Column name
     - Data type (text, number, date, select)
     - Options (for select type)
     - Default value
   - Column appears in data entry and table

2. **Reorder Columns**:
   - Drag and drop in column manager
   - Changes reflected immediately

#### URL Templates

Configure clickable links for Jira and Work Items:

```
Jira URL Template: https://sentara.atlassian.net/browse/{formatted}
Jira Display Format: TBCRM3-{number}

Work Item URL Template: https://github.com/org/repo/tree/WI-{formatted}
Work Item Display Format: WI-{number6}
```

Placeholders:
- `{number}`: Story number without padding
- `{number6}`: Story number padded to 6 digits
- `{formatted}`: Fully formatted value (e.g., TBCRM3-123)

## 📖 Usage Guide

### Managing Sprint Stories

#### Creating New Stories

**Method 1: Full Form Entry**
1. Navigate to "📋 Data Entry" tab
2. Click "➕ Add New" button
3. Fill in all required fields:
   - PI (Program Increment)
   - Sprint (Sprint number or name)
   - JIRA Story number
   - Description
   - JIRA Status
   - Work Items (SC and VC)
   - DevOps Status and Organization
4. Add comments (optional)
5. Add tags (optional)
6. Click "Save" button

**Method 2: Quick Add**
1. Click "⚡ Quick Add" button (top right)
2. Fill minimal required fields only
3. Press Enter or click "Quick Save"
4. Edit later to add details

**Method 3: Import from JIRA**
1. Go to "🔗 JIRA" tab
2. Click "🔄 Fetch from JIRA"
3. Search by:
   - Project key (e.g., TBCRM3)
   - JQL query (advanced)
   - Status filter
4. Select stories from results
5. Map fields if needed
6. Click "Import Selected"

#### Viewing Story Details

1. **Click any row** in the data table
2. Modal opens showing:
   - Full summary and description
   - Acceptance criteria (formatted with line breaks)
   - All comments from JIRA
   - Sprint information (PI, Quarter, Sprint)
   - Assignee, reporter, priority
   - Story points
   - Labels and tags
   - **Attachments section** with:
     - Images displayed inline
     - Documents (PDF, Word, Excel) as download links
   - Timestamps (created, updated)
   - Local record ID
3. Click "Open in JIRA" to view in JIRA web interface
4. Click "Close" or press Escape to exit

#### Editing Stories

**Method 1: Double-Click**
- Double-click any row in the table
- Edit form opens with current values

**Method 2: Edit Button**
- Click the pencil icon (✏️) on the row
- Edit form opens

**Method 3: From Details Modal**
- Click story to open details
- Click "Edit" button at bottom
- Form opens for editing

**Editing Process**:
1. Modify any fields
2. Click "Update" to save
3. Changes sync to database immediately
4. Optionally sync to JIRA

#### Deleting Stories

1. Click trash icon (🗑️) on the row
2. Confirm deletion dialog appears
3. Click "Yes, Delete" to confirm
4. Story removed from database
5. Optional: Keep in JIRA or delete there too

### JIRA Synchronization

#### Manual Sync (Single Story)

1. Find the story in the table
2. Click sync icon (🔄) on the row
3. Story data fetched from JIRA
4. Local record updated with JIRA data
5. Toast notification shows result

#### Bulk Sync (Multiple Stories)

1. Select stories using checkboxes
2. Click "Sync Selected with JIRA"
3. Progress bar shows sync status
4. Results summary displayed

#### Auto-Sync Setup

1. Navigate to "🔗 JIRA" tab
2. Enable "Auto-Sync" toggle
3. Configure sync settings:
   
   **Interval Mode**:
   - Sync every X seconds
   - Default: 900 (15 minutes)
   - Minimum: 60 (1 minute)
   
   **Scheduled Mode**:
   - Choose frequency: Daily, Weekly, Monthly, Yearly
   - Set specific time (e.g., 09:00 AM)
   - For weekly: Choose day of week
   - For monthly: Choose day of month

4. Select sync direction:
   - **From JIRA**: Update local from JIRA
   - **To JIRA**: Push local changes to JIRA
   - **Both Ways**: Full bidirectional sync

5. Save settings
6. Monitor "Last Sync" timestamp
7. View sync logs for details

#### Viewing Sync Logs

1. JIRA tab → "Sync Logs" button
2. Table shows:
   - Timestamp of sync
   - Story key (TBCRM3-123)
   - Sync direction
   - Status (success/failed)
   - Error message (if failed)
   - Data changed
3. Filter logs by date, status, story
4. Export logs to CSV

### Working with Attachments

#### Viewing Images

Images from JIRA automatically display inline in:
- Story descriptions
- Acceptance criteria
- Comments
- Attachments section (dedicated area)

**Interactions**:
- Click image to open full-size in new tab
- Right-click to save image
- Zoom supported in browser

#### Downloading Documents

1. Scroll to "Attachments" section in story details
2. Documents display with:
   - File icon (📄 PDF, 📝 Word, 📊 Excel, etc.)
   - Filename
   - File size (if available)
   - MIME type
3. Click document link to download
4. File saves with correct extension
5. Open in appropriate application

**Supported File Types**:
- PDF documents (application/pdf)
- Word documents (.doc, .docx)
- Excel spreadsheets (.xls, .xlsx)
- PowerPoint presentations (.ppt, .pptx)
- Text files (.txt)
- CSV files (.csv)
- ZIP archives (.zip)
- Images (.png, .jpg, .gif, .svg, .webp)

### Filtering and Search

#### Quick Filters

Use dropdown filters at top of data table:
1. **PI Filter**: Select one or more PIs
2. **Sprint Filter**: Select sprints
3. **Jira Status**: Filter by status
4. **DevOps Status**: Filter by deployment status
5. **DevOps Org**: Filter by environment (INT/QA/UAT/PROD)
6. **Tags**: Filter by assigned tags

**Multiple selections**:
- Hold Ctrl (Windows) or Cmd (Mac) to select multiple
- Filters are AND logic (all must match)

#### Text Search

1. Type in search box at top
2. Searches across:
   - JIRA story number
   - Description
   - Comments
3. Results update in real-time
4. Search is case-insensitive

#### Advanced Search (JIRA)

1. Go to "🔗 JIRA" tab
2. Enter JQL query:
   ```
   project = TBCRM3 AND sprint = "PI-2 Sprint 3"
   ```
   ```
   assignee = currentUser() AND status = "In Progress"
   ```
   ```
   created >= -30d ORDER BY created DESC
   ```
3. Click "Search"
4. Results show matching stories
5. Import selected results

#### Saving Filter Presets

1. Apply desired filters
2. Click "Save Filter"
3. Name the preset
4. Recall anytime from "Saved Filters" dropdown

### Bulk Operations

#### Selecting Stories

**Select Individual**:
- Click checkbox in first column

**Select All on Page**:
- Click header checkbox

**Select Range**:
- Click first story checkbox
- Hold Shift
- Click last story checkbox

**Select All**:
- Use "Select All X Records" button

#### Update Jira Status

1. Select stories
2. Click "Bulk Update" → "Update Jira Status"
3. Choose new status from dropdown
4. Optional: Sync to JIRA
5. Click "Apply"
6. Progress bar shows update status

#### Update DevOps Status

1. Select stories
2. Click "Bulk Update" → "Update DevOps Status"
3. Choose new status
4. Choose organization (INT/QA/UAT/PROD)
5. Click "Apply"

#### Add Tags in Bulk

1. Select stories
2. Click "Bulk Update" → "Add Tags"
3. Select tag(s) to add
4. Click "Apply"
5. Tags added to all selected stories

#### Delete Multiple Stories

1. Select stories to delete
2. Click "Bulk Update" → "Delete Selected"
3. Confirm action (warning shown)
4. Stories deleted permanently

### Tags Management

#### Creating Tags

1. Configuration → Tags Management
2. Click "Add New Tag"
3. Enter tag name
4. Choose color (color picker or hex code)
5. Click "Save"

#### Applying Tags

**To Single Story**:
1. Edit story
2. Click "Tags" field
3. Select tag(s) from dropdown
4. Save

**To Multiple Stories**:
- Use bulk operations (see above)

#### Editing Tags

1. Tags Management → Find tag
2. Click "Edit" icon
3. Change name or color
4. Save (updates all usage)

#### Deleting Tags

1. Find tag in Tags Management
2. Click "Delete" icon
3. Confirm
4. Tag removed from all stories

### Notes System

#### Creating Notes

1. Navigate to "📝 Notes" tab
2. Click "Add New Note"
3. Enter:
   - Title (required)
   - Content (multi-line)
   - Color (yellow, blue, green, pink, orange, purple)
4. Add tags (optional)
5. Link to stories (optional)
6. Click "Save"

#### Linking Notes to Stories

**During Creation**:
1. In note form, click "Link to Stories"
2. Search for story by JIRA number or description
3. Select story(ies)
4. Links saved with note

**After Creation**:
1. Open note
2. Click "Add Link"
3. Select story
4. Save

#### Viewing Linked Notes

1. Open story details
2. Scroll to "Related Notes" section
3. Click note to view full content

#### Organizing Notes

- **By Color**: Filter notes by color
- **By Tag**: Apply tags and filter
- **By Date**: Sort by created/modified date
- **Search**: Full-text search in content

### Sprint Calendar

#### Adding Sprint Dates

1. Navigate to "📅 Sprint Calendar" tab
2. Click on start date in calendar
3. Fill in form:
   - Sprint name/number
   - Program Increment (PI)
   - Start date (pre-filled)
   - End date
   - Custom color (optional)
4. Click "Save"

#### Visual Features

**Month View**:
- Shows 4-6 week grid
- Sprint bars across date ranges
- Color-coded by sprint
- Hover for details

**Quarter View**:
- Shows 3 months side-by-side
- Condensed sprint view
- Quick overview

**Year View**:
- All 12 months
- High-level planning

**Current Time Indicator**:
- Red vertical line
- Updates every second
- Time displayed at top

#### Managing Holidays

1. Calendar → "Manage Holidays" button
2. Add holiday:
   - Date
   - Name
   - Type (Public, Company, Federal)
3. Holidays appear as colored dots
4. Excluded from business day calculations

#### Sprint Reminders

**Automatic Reminders**:
- Sprint starting soon (1 day before)
- Sprint ending soon (2 days before)
- Sprint overdue

**Configuration**:
1. Calendar → Settings icon
2. Enable/disable reminder types
3. Adjust day thresholds
4. Save

**Dismissing Reminders**:
- Click "Dismiss" on notification
- Reminder won't show again for that sprint

### Analytics and Reports

#### KPI Dashboard

Located in "📊 Dashboard" tab:

**Metrics Displayed**:
1. **Total Stories**: Count of all tracked items
2. **Completed**: Stories in "Completed" status
3. **In Progress**: Active development stories
4. **Deployed PROD**: Stories live in production

**Real-Time Updates**:
- KPIs refresh when data changes
- Click KPI card to filter by that metric

#### Charts

**Jira Status Distribution**:
- Pie chart of story status breakdown
- Click segment to filter table

**Sprint Velocity**:
- Bar chart of stories per sprint
- Helps forecast capacity
- Shows trends over time

**DevOps Status Breakdown**:
- Deployment pipeline visualization
- Created → Pull Request → Deployed

**PI Progress**:
- Stories per Program Increment
- Release planning overview

**Chart Interactions**:
- Hover for details
- Click legend to toggle data
- Export chart as image

#### Sprint Reports

1. Dashboard → "Generate Sprint Report"
2. Select sprint
3. Choose report type:
   - Summary (overview)
   - Detailed (all stories)
   - Burn-down (if data available)
4. Export as:
   - PDF (formatted document)
   - Excel (for analysis)
5. Download and save

### Customization

#### Changing Themes

1. Configuration → Theme Settings
2. Choose from presets:
   - **Default**: Dark blue/cyan
   - **Midnight**: Pure black
   - **Forest**: Green tones
   - **Ocean**: Blue gradient
   - **Crimson**: Red accents
   - **Light**: Bright mode
3. Click "Apply Theme"
4. Changes immediate

#### Creating Custom Theme

1. Theme Settings → "Custom Theme"
2. Adjust color variables:
   - Background colors
   - Surface colors
   - Accent colors
   - Text colors
   - Border colors
3. Preview in real-time
4. Save as new theme

#### Uploading Logo

1. Configuration → Branding
2. Click "Upload Logo"
3. Select file (SVG or PNG, max 2MB)
4. Logo appears in header
5. Favicon updates automatically

#### Changing Fonts

1. Configuration → Typography
2. Select from dropdown:
   - DM Sans (default)
   - Inter
   - Roboto
   - Poppins
   - ... 16 more options
3. Adjust base font size (10-20px)
4. Changes apply globally

#### Column Customization

**Show/Hide Columns**:
1. Click "Columns" button above table
2. Toggle checkboxes for columns
3. Changes applied instantly

**Reorder Columns**:
1. Column manager → Drag handles
2. Drag up/down to reorder
3. Release to save

**Custom Columns**:
1. Configuration → Custom Fields
2. Add new column with:
   - Name
   - Data type
   - Default value
3. Column appears in table and forms

### Data Management

#### Exporting Data

**Export All**:
1. Click "Export" button
2. Choose format: JSON or CSV
3. Select tables to export:
   - Records
   - Notes
   - Tags
   - Settings
4. Download file

**Export Selected**:
1. Select records with checkboxes
2. Click "Export Selected"
3. Download partial export

**Automated Exports**:
- Configure in Backup Settings
- Scheduled exports to file system

#### Importing Data

1. Click "Import" button
2. Select file (JSON or CSV)
3. Choose import mode:
   - **Replace All**: Delete existing, import new
   - **Merge**: Keep existing, add new
   - **Update**: Update matching, ignore others
4. Map columns (for CSV)
5. Preview import
6. Click "Import" to proceed

#### Backup and Restore

**Manual Backup**:
1. Click "💾 Backup" button (any tab)
2. JSON file downloads instantly
3. Filename: `backup_sprint-tracker_YYYY-MM-DDTHH-MM-SS.json`
4. Store in safe location

**Scheduled Backups**:
1. Configuration → Backup Settings
2. Enable "Automatic Backups"
3. Set schedule (daily/weekly/monthly/yearly)
4. Set time of day
5. Configure retention (days to keep)
6. Backups saved to `backup/` folder

**Restore from Backup**:
1. Import → Select backup JSON file
2. Choose restore option:
   - Full restore (replaces everything)
   - Selective restore (choose tables)
   - Merge mode (combine with existing)
3. Confirm (warning shown)
4. Restoration begins
5. Page reloads with restored data

### Advanced Features

#### Automated Status Rules

**Creating Rules**:
1. Configuration → Automated Status
2. Click "Add New Rule"
3. Define rule:
   - **Name**: "Auto-Complete PROD Deployments"
   - **Conditions**: 
     - Field: DevOps Status
     - Operator: equals
     - Value: Deployed
     - AND
     - Field: DevOps Org
     - Operator: equals
     - Value: PROD
   - **Actions**:
     - Field: Jira Status
     - Value: Completed
4. Set priority (execution order)
5. Enable rule

**Testing Rules**:
1. Enable "Dry Run" mode
2. Run rules
3. View results (no changes made)
4. Disable dry run when satisfied

**Rule Execution**:
- **Manual**: Click "Run Rules Now"
- **Automatic**: On data save (if enabled)
- **Scheduled**: Cron-like scheduling

**Viewing Rule Logs**:
1. Automated Status → "View Logs"
2. Filter by rule, date, status
3. See which rules executed
4. What changed for each record

#### Record Linking

**Creating Links**:
1. Edit story
2. Click "Link Related Stories"
3. Search for story to link
4. Choose relationship type:
   - Blocks
   - Is blocked by
   - Relates to
   - Depends on
   - Duplicates
5. Save

**Viewing Links**:
1. Open story details
2. "Related Stories" section shows all links
3. Click linked story to view

**Link Types**:
- **Blocks**: This story blocks another
- **Is Blocked By**: Another story blocks this
- **Relates To**: General relationship
- **Depends On**: Required dependency
- **Duplicates**: Duplicate of another

## 🛠️ Technical Stack

### Frontend Technologies
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern features (Grid, Flexbox, Custom Properties, Animations)
- **Vanilla JavaScript ES6+**: No frameworks, lightweight and fast
  - Modular architecture (40+ separate modules)
  - Async/await for API calls
  - Local Storage for client-side persistence
  - Event-driven design patterns

### CSS Architecture
- **Modular CSS**: 33 separate CSS files for maintainability
- **CSS Custom Properties**: Dynamic theming support
- **BEM Methodology**: Block Element Modifier naming convention
- **Responsive Design**: Mobile-first approach with breakpoints
- **Component-Based**: Each feature has dedicated stylesheet

### Backend Technologies
- **PHP 7.4+**: Server-side logic and API endpoints
  - Object-Oriented Programming principles
  - PSR-2 coding standards
  - Error handling and logging
- **MySQL/MariaDB**: Relational database with **43 tables**
  - Foreign key constraints
  - Full-text search indexes
  - JSON column support for flexible data
  - Stored procedures for maintenance
- **cURL**: HTTP client for JIRA API communication
- **OpenSSL**: Encryption for sensitive data

### External Libraries & APIs
- **Chart.js 4.4.1**: Interactive charts and graphs
- **jsPDF 2.5.1**: PDF generation for reports
- **jsPDF-AutoTable 3.8.2**: Table formatting in PDFs
- **Google Fonts API**: Typography (Syne, DM Sans, 18+ additional fonts)
- **JIRA REST API v3**: Cloud integration

### JavaScript Modules (40 files)

**Core System**:
- `init.js` - Application initialization and bootstrapping
- `boot.js` - Pre-initialization and environment setup
- `state.js` - Centralized state management
- `persistence.js` - LocalStorage and database sync
- `configuration.js` - Settings management

**Data Management**:
- `crud.js` - Create, Read, Update, Delete operations
- `table.js` - Table rendering and sorting
- `filters.js` - Advanced filtering logic
- `pagination.js` - Lazy loading and pagination
- `export-import.js` - Data import/export functionality
- `backup.js` - Backup and restore operations

**UI Components**:
- `forms.js` - Form handling and validation
- `form-grid.js` - Dynamic form grid layout
- `modal.js` - Modal dialog system (inline in HTML)
- `toast.js` - Notification system
- `confirm-modal.js` - Confirmation dialogs
- `tabs.js` - Tab navigation

**Feature Modules**:
- `jira.js` - JIRA integration (3300+ lines)
- `automated-status.js` - Automated rule engine (1668 lines)
- `sprint-calendar.js` - Visual sprint calendar (1775 lines)
- `sprint-progress.js` - Sprint progress tracking
- `sprint-reminders.js` - Sprint notification system
- `sprint-count.js` - Sprint counting and statistics
- `sprint-report.js` - Sprint report generation
- `notes.js` - Notes system
- `tags.js` - Tagging functionality
- `work-items.js` - Work item management
- `record-links.js` - Story relationship linking
- `bulk-operations.js` - Batch update operations
- `quick-add.js` - Quick story creation
- `column-select.js` - Column visibility management

**Analytics & Visualization**:
- `charts.js` - Chart.js wrapper and configuration
- `kpi.js` - KPI dashboard calculations
- `summary.js` - Summary statistics
- `matrix.js` - Matrix background animation (243 lines)

**UI Enhancements**:
- `lazy-loading.js` - Progressive content loading
- `formatting.js` - Text and date formatting utilities
- `timestamps.js` - Timestamp management
- `logo-upload.js` - Logo upload functionality
- `sprint-colors-config.js` - Sprint color customization
- `storage-info.js` - Storage usage information

### CSS Modules (33 files)

**Foundation**:
- `variables.css` - CSS custom properties and theme variables
- `reset.css` - CSS reset and normalization
- `layout.css` - Main layout structure (grid, containers)
- `utilities.css` - Utility classes (spacing, text, etc.)

**Components**:
- `header.css` - Application header styling
- `tabs.css` - Tab navigation styles
- `tables.css` - Data table formatting
- `cards.css` - Card component styles
- `badges.css` - Status badge styling
- `buttons.css` - Button variants and states
- `forms.css` - Form input styling
- `modal.css` - Modal dialog styles
- `toast.css` - Notification toast styling
- `pagination.css` - Pagination controls
- `progress.css` - Progress bars and indicators

**Feature Styles**:
- `jira.css` - JIRA integration UI
- `sprint-calendar.css` - Calendar view styles
- `sprint-progress.css` - Sprint progress visualization
- `sprint-reminders.css` - Reminder notification styles
- `sprint-count.css` - Sprint counter display
- `charts.css` - Chart container and legend styles
- `kpi.css` - KPI card styling
- `notes.css` - Notes interface styles
- `tags.css` - Tag display and management
- `work-items.css` - Work item styles
- `bulk-operations.css` - Bulk operation UI
- `quick-add.css` - Quick add form styling
- `automated-status.css` - Automation rule UI
- `settings.css` - Configuration panel styles
- `timestamps.css` - Timestamp display
- `lazy-loading.css` - Loading indicators
- `logo-upload.css` - Logo upload interface
- `background.css` - Background customization
- `environment.css` - Environment-specific styles

### Database Schema (43 Tables)

**Core Tables**:
- `records` - Sprint tracking records (main data)
- `notes` - Internal notes and documentation
- `tags` - Tag definitions with colors
- `record_tags` - Many-to-many: records ↔ tags
- `note_tags` - Many-to-many: notes ↔ tags
- `record_links` - Story relationships
- `note_record_links` - Note-to-story links
- `settings` - Application settings (JSON)

**Sprint & Calendar**:
- `sprint_dates` - Sprint schedules and date ranges
- `sprint_colors` - Custom sprint color mapping
- `sprint_reminders_dismissed` - Dismissed reminder tracking
- `holidays` - Holiday calendar

**Customization**:
- `status_colors` - Custom status color mapping
- `theme_colors` - Theme color definitions (7 themes)
- `fonts` - Available font list (20+ fonts)

**Automation**:
- `automated_status_rules` - Rule definitions
- `automated_status_log` - Rule execution history

**Backup & History**:
- `backup_history` - Backup file metadata
- `backup_log` - Backup operation logs

**JIRA Integration** (12 tables):
- `jira_config` - JIRA connection settings (encrypted)
- `jira_issues_cache` - Cached JIRA issues
- `jira_sync_log` - Synchronization history
- `jira_field_mapping` - Field mapping configuration
- `jira_auto_sync_settings` - Auto-sync configuration
- `jira_auto_sync_runs` - Auto-sync execution history

**Security** (6 tables):
- `jira_rate_limit` - Rate limiting tracker
- `jira_csrf_tokens` - CSRF token storage
- `jira_session_tokens` - Session management
- `jira_ip_whitelist` - IP access control
- `jira_security_log` - Security events
- `jira_audit_log` - Audit trail (all operations)

### API Endpoints

**Database APIs** (`Database/` folder):
- `data.api.php` - Settings and configuration CRUD
- `records.api.php` - Sprint record operations
- `notes.api.php` - Notes CRUD operations
- `tags.api.php` - Tag management
- `links.api.php` - Record relationship management
- `backup.api.php` - Backup/restore operations
- `settings.api.php` - Settings management
- `config.php` - Database connection configuration

**JIRA APIs** (`JIRA/` folder):
- `issues.api.php` - JIRA issue CRUD and search (1129 lines)
- `sync.api.php` - Bidirectional synchronization
- `auto-sync.api.php` - Automated sync scheduler
- `attachment-proxy.api.php` - Secure attachment proxy
- `config.api.php` - JIRA configuration management
- `session.api.php` - Session management
- `csrf-token.api.php` - CSRF token generation
- `sync-logs.api.php` - Sync history retrieval
- `test-connection.api.php` - Connection testing
- `security.php` - Security functions library (561 lines)
- `security-setup.php` - Security initialization
- `clear-rate-limits.php` - Rate limit cleanup utility

### Security Features

**Authentication & Authorization**:
- JIRA API token authentication (Basic Auth)
- IP-based access control with whitelist
- Session token management with fingerprinting
- Client identification and tracking

**Data Protection**:
- SQL injection prevention (prepared statements)
- XSS protection (input sanitization, output escaping)
- CSRF token validation (POST/PUT/DELETE requests)
- Encrypted credential storage (OpenSSL)
- Secure password hashing (PHP password_hash)

**Security Headers** (applied via `security.php`):
- `X-Frame-Options: DENY` - Clickjacking protection
- `X-Content-Type-Options: nosniff` - MIME sniffing prevention
- `X-XSS-Protection: 1; mode=block` - XSS filter
- `Content-Security-Policy` - Script and resource restrictions
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Feature restrictions
- `Strict-Transport-Security` - HTTPS enforcement (when available)

**Rate Limiting**:
- In-memory tracking with database persistence
- Configurable limits per client type
- Automatic cleanup of old entries
- Sliding window algorithm

**Audit & Logging**:
- Complete audit trail in `jira_audit_log`
- Security events in `jira_security_log`
- Sync operations in `jira_sync_log`
- Automated cleanup of old logs (90 days security, 1 year audit)

**Data Sanitization**:
- Input validation on all user data
- Type-specific sanitization (string, int, email, URL)
- JSON validation before parsing
- File upload validation (type, size, content)

### Performance Optimizations

**Database**:
- Indexed columns for fast queries (25+ indexes)
- JSON columns for flexible data without schema changes
- Full-text search indexes on description fields
- Query optimization with EXPLAIN analysis
- Connection pooling

**Frontend**:
- Lazy loading for large datasets
- Progressive chart rendering
- Debounced search inputs
- CSS and JS minification ready
- Image optimization
- Local caching with LocalStorage

**Server**:
- OPcache for PHP bytecode caching
- GZIP compression for responses
- HTTP caching headers
- Efficient session management
- Background job processing for auto-sync

### Browser Compatibility

**Fully Supported**:
- Chrome 90+ (recommended)
- Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

**Partial Support**:
- Internet Explorer: Not supported
- Older browsers: May work with polyfills

**Required Features**:
- ES6 JavaScript support
- CSS Grid and Flexbox
- LocalStorage API
- Fetch API
- Promise and async/await

## 📂 Project Structure

```
NewJirastoriestracker/
├── index.html                    # Main application (1593 lines, single-page app)
├── favicon.svg                   # Application favicon
├── clear-cache.php              # OPcache and cache clearing utility
├── README.md                    # This documentation file
│
├── css/                         # Stylesheets (33 files, modular architecture)
│   ├── variables.css            # CSS custom properties and theme variables
│   ├── reset.css                # CSS reset and browser normalization
│   ├── layout.css               # Core layout system (grid, containers)
│   ├── header.css               # Application header styles
│   ├── tabs.css                 # Tab navigation styling
│   ├── cards.css                # Card component styles
│   ├── kpi.css                  # KPI dashboard card styles
│   ├── charts.css               # Chart container and legend styles
│   ├── forms.css                # Form inputs and controls
│   ├── buttons.css              # Button variants and states
│   ├── tables.css               # Data table styling
│   ├── badges.css               # Status badge styles
│   ├── pagination.css           # Pagination control styles
│   ├── modal.css                # Modal dialog styles
│   ├── toast.css                # Toast notification styles
│   ├── settings.css             # Configuration panel styles
│   ├── progress.css             # Progress bars and loaders
│   ├── environment.css          # Environment-specific overrides
│   ├── notes.css                # Notes interface styles
│   ├── tags.css                 # Tag display and management
│   ├── bulk-operations.css      # Bulk operation UI styling
│   ├── sprint-count.css         # Sprint counter display
│   ├── timestamps.css           # Timestamp formatting
│   ├── quick-add.css            # Quick add form styling
│   ├── utilities.css            # Utility classes (spacing, text, display)
│   ├── lazy-loading.css         # Loading states and skeletons
│   ├── background.css           # Background customization
│   ├── automated-status.css     # Automation rule interface
│   ├── sprint-calendar.css      # Sprint calendar view
│   ├── sprint-progress.css      # Sprint progress visualization
│   ├── sprint-reminders.css     # Reminder notification styles
│   ├── logo-upload.css          # Logo upload interface
│   ├── jira.css                 # JIRA integration UI
│   └── work-items.css           # Work item styling
│
├── js/                          # JavaScript modules (40 files, ~25,000 lines total)
│   ├── init.js                  # Application initialization (105 lines)
│   ├── boot.js                  # Pre-initialization setup
│   ├── state.js                 # Centralized state management
│   ├── persistence.js           # LocalStorage and database sync
│   ├── configuration.js         # Settings and config management
│   ├── crud.js                  # CRUD operations for records
│   ├── table.js                 # Table rendering and interaction
│   ├── filters.js               # Advanced filtering logic
│   ├── pagination.js            # Lazy loading and pagination
│   ├── export-import.js         # Data import/export
│   ├── backup.js                # Backup and restore operations
│   ├── forms.js                 # Form handling and validation
│   ├── form-grid.js             # Dynamic form grid layout
│   ├── toast.js                 # Toast notification system
│   ├── confirm-modal.js         # Confirmation dialogs
│   ├── tabs.js                  # Tab navigation logic
│   ├── jira.js                  # JIRA integration (3,314 lines)
│   ├── automated-status.js      # Automated rule engine (1,668 lines)
│   ├── sprint-calendar.js       # Visual calendar (1,775 lines)
│   ├── sprint-progress.js       # Sprint progress tracking
│   ├── sprint-reminders.js      # Sprint notifications
│   ├── sprint-count.js          # Sprint counting logic
│   ├── sprint-report.js         # Sprint report generation
│   ├── notes.js                 # Notes system
│   ├── tags.js                  # Tagging functionality
│   ├── work-items.js            # Work item management
│   ├── record-links.js          # Story relationship linking
│   ├── bulk-operations.js       # Batch updates
│   ├── quick-add.js             # Quick story creation
│   ├── column-select.js         # Column visibility management
│   ├── charts.js                # Chart.js integration
│   ├── kpi.js                   # KPI calculations
│   ├── summary.js               # Summary statistics
│   ├── matrix.js                # Matrix background animation (243 lines)
│   ├── lazy-loading.js          # Progressive content loading
│   ├── formatting.js            # Text and date formatting
│   ├── timestamps.js            # Timestamp utilities
│   ├── logo-upload.js           # Logo upload handler
│   ├── sprint-colors-config.js  # Sprint color customization
│   └── storage-info.js          # Storage usage information
│
├── Database/                    # Database layer (PHP)
│   ├── config.php               # Database connection config
│   ├── sprint_tracker.sql       # Complete database schema (1,227 lines, 43 tables)
│   ├── data.api.php             # Settings and configuration API
│   ├── records.api.php          # Sprint record CRUD API
│   ├── notes.api.php            # Notes CRUD API
│   ├── tags.api.php             # Tag management API
│   ├── links.api.php            # Record relationship API
│   ├── backup.api.php           # Backup/restore API
│   └── settings.api.php         # Settings persistence API
│
├── JIRA/                        # JIRA integration layer (PHP)
│   ├── issues.api.php           # JIRA issue operations (1,129 lines)
│   ├── sync.api.php             # Bidirectional sync logic
│   ├── auto-sync.api.php        # Automated sync scheduler
│   ├── attachment-proxy.api.php # Secure attachment proxy (169 lines)
│   ├── config.api.php           # JIRA configuration API
│   ├── session.api.php          # Session management
│   ├── csrf-token.api.php       # CSRF token generation
│   ├── sync-logs.api.php        # Sync history API
│   ├── test-connection.api.php  # Connection testing utility
│   ├── security.php             # Security functions library (561 lines)
│   ├── security-setup.php       # Security table initialization
│   └── clear-rate-limits.php    # Rate limit cleanup script
│
└── backup/                      # Backup storage directory
    └── backup_sprint-tracker_2026-02-26T16-30-00.json  # Auto-backup example
```

### File Size Summary

| Category | Files | Total Lines | Description |
|----------|-------|-------------|-------------|
| **JavaScript** | 40 | ~25,000 | Core application logic |
| **CSS** | 33 | ~8,000 | Modular styling |
| **PHP  API** | 20 | ~5,000 | Backend services |
| **SQL Schema** | 1 | 1,227 | 43 database tables |
| **HTML** | 1 | 1,593 | Single-page application |
| **Total** | **95** | **~40,820** | Complete codebase |

### Key File Details

**Largest Files**:
1. `js/jira.js` - 3,314 lines (JIRA integration,  rendering, sync logic)
2. `js/sprint-calendar.js` - 1,775 lines (Visual calendar, drag-drop, reminders)
3. `js/automated-status.js` - 1,668 lines (Rule engine, pagination, execution)
4. `index.html` - 1,593 lines (Complete UI markup)
5. `Database/sprint_tracker.sql` - 1,227 lines (Full database schema)
6. `JIRA/issues.api.php` - 1,129 lines (JIRA API wrapper)
7. `JIRA/security.php` - 561 lines (Security utilities)

**Critical Files**:
- `Database/config.php` - Database credentials (⚠️ must configure)
- `JIRA/attachment-proxy.api.php` - Handles JIRA file downloads
- `js/state.js` - Central state management
- `css/variables.css` - Theme variables
- `favicon.svg` - Branding icon

## 🔒 Security Features

- **Authentication**: JIRA API token authentication
- **Authorization**: IP-based access control
- **CSRF Protection**: Session-based tokens
- **Input Validation**: Comprehensive sanitization
- **Output Encoding**: XSS prevention
- **Secure Headers**: Multiple security headers
- **Rate Limiting**: Protection against abuse
- **Audit Logging**: Track all operations
- **Encrypted Storage**: JIRA credentials encryption

## 📦 Backup & Restore

### Manual Backup
1. Click "💾 Backup" button
2. Download JSON file with all data
3. Store safely

### Restore from Backup
1. Click "📥 Import" button
2. Select backup JSON file
3. Confirm restore

### Automatic Backups
- Stored in `backup/` directory
- Filename format: `backup_sprint-tracker_YYYY-MM-DDTHH-MM-SS.json`

## 🆕 Recent Updates

### Attachment Support (Latest)
- ✅ View JIRA images inline in descriptions, acceptance criteria, and comments
- ✅ Download non-image attachments (PDF, Word, Excel, PowerPoint, etc.)
- ✅ Proper file type detection and icons
- ✅ Secure authentication proxy for JIRA attachments
- ✅ UUID-based attachment matching
- ✅ Correct file extensions on download

### Acceptance Criteria Formatting
- ✅ AC1, AC2, AC3 patterns display on separate lines
- ✅ BDD keywords (Given/When/Then/And) properly formatted
- ✅ Rich text support with ADF format

## 🐛 Troubleshooting

### JIRA Connection Issues

#### Problem: "Failed to connect to JIRA"

**Common Causes**:
1. **Invalid Credentials**
   - Verify JIRA URL format: `https://yourcompany.atlassian.net` (include https)
   - Check email address is correct
   - API token expired or invalid - regenerate in Atlassian account
   - Wrong project key

**Solutions**:
- Go to Configuration → JIRA Settings
- Update credentials
- Click "Test Connection" to verify
- Check browser console for specific error message

2. **Network/Proxy Issues**
   - Firewall blocking JIRA domain
   - Corporate proxy requiring authentication
   - SSL certificate errors
   - CORS policy blocking request

**Solutions**:
- Whitelist `*.atlassian.net` in firewall
- Configure proxy settings in JIRA/config.api.php
- Update CA certificates on server
- Use attachment proxy (JIRA/attachment-proxy.api.php)

3. **Rate Limiting**
   - Too many requests in short time
   - Rate limits: 1000 req/10s (localhost), 100 req/1s (remote)

**Solutions**:
- Wait 10 seconds and retry
- Check JIRA → "Rate Limit Status"
- Clear limits: Run `JIRA/clear-rate-limits.php`
- Increase limits in `security.php`

#### Problem: "CSRF Token Mismatch"

**Solutions**:
1. Clear browser cookies
2. Hard refresh (Ctrl+F5)
3. Check `JIRA/csrf-token.api.php` is accessible
4. Verify `jira_csrf_tokens` table exists
5. Run `JIRA/security-setup.php` to reinitialize

#### Problem: "IP Address Not Whitelisted"

**Solutions**:
1. Add IP to whitelist in Configuration → JIRA Settings
2. Add localhost: `127.0.0.1,::1`
3. Add network range: `192.168.1.*`
4. Disable IP whitelist (dev only): Set `ip_whitelist_enabled = 0` in `jira_config` table

### Attachment Issues

#### Problem: Attachments download as .htm files (FIXED)

**This was the original bug - now resolved**

**Root Cause**:
- JIRA embeds UUIDs in filenames: `document (5c25e027-c5a3-4aa9-8e3b-eb7032b6e3bb).pdf`
- Attachment ID different from media node UUID
- Security headers interfering with Content-Type header
- Output buffer contaminating binary data

**Fixes Applied**:
1. **UUID Matching** ([js/jira.js](js/jira.js#L1587-L1620)):
   - Strategy 1: Match by UUID in filename
   - Strategy 2: Match by exact filename
   - Strategy 3: Match by numeric ID

2. **Binary Output** ([JIRA/attachment-proxy.api.php](JIRA/attachment-proxy.api.php)):
   - Removed `setSecurityHeaders()` call (line 63)
   - Enhanced buffer clearing with `while(ob_get_level())`
   - Added `header_remove()` before file headers
   - Forced header overrides with `true` flag
   - Added `flush()` before binary output

**Verification (Open Console F12)**:
```
✅ Matched attachment by UUID in filename: {uuid:..., filename:..., actualId: '280515'}
📄 Document download link created: {id, filename, mimeType, url}
```

**If still not working**:
1. Check console for errors
2. Verify URL has `download=1` parameter
3. Check Content-Type header in Network tab
4. Clear PHP OPcache: Run `clear-cache.php`
5. Confirm `attachment-proxy.api.php` is not modified

#### Problem: Images not displaying inline

**Solutions**:
1. Check JIRA permissions (must have attachment access)
2. Verify story has attachments in JIRA
3. Check Content Security Policy (CSP) in browser
4. Review [jira.js](jira.js) `renderDescriptionWithImages()` function
5. Test direct image URL in new tab

#### Problem: "Attachment not found (404)"

**Solutions**:
1. Attachment may have been deleted in JIRA
2. Re-sync story to update attachment list
3. Check `jira_issues_cache` table for correct attachment data
4. Verify `customFields.attachment` array is populated

### Data Issues

#### Problem: Stories not appearing in table

**Diagnostic Steps**:
1. Open browser console (F12) - check for JavaScript errors
2. Verify database connection in phpMyAdmin
3. Click "Reset Filters" button
4. Clear search box
5. Run SQL: `SELECT COUNT(*) FROM records;`

**Solutions**:
1. Reload data - refresh page (F5)
2. Check [table.js](table.js) `loadData()` function for errors
3. Review [state.js](state.js) for data corruption
4. Clear localStorage and reload:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

#### Problem: Changes not saving

**Common Causes**:
1. **Database Error**: Check PHP error logs
2. **Validation Error**: Missing required fields
3. **Permission Error**: MySQL user lacks write permission
4. **Session Issue**: Expired session token

**Diagnostic**:
1. Open Network tab (F12)
2. Find POST request to `data.api.php`
3. Check status code (should be 200)
4. Review response JSON for error message
5. Check MySQL error log: `xampp/mysql/data/mysql_error.log`

**Solutions**:
- Enable error reporting in [Database/data.api.php](Database/data.api.php)
- Grant permissions: `GRANT ALL ON sprint_tracker.* TO 'user'@'localhost';`
- Verify required fields are filled
- Clear browser cache and cookies

#### Problem: Duplicate records

**Causes**:
- Multiple rapid button clicks
- Sync conflict between local and JIRA
- Browser form auto-submit

**Solutions**:
1. Check record IDs (should be unique)
2. Run deduplication query:
   ```sql
   DELETE t1 FROM records t1
   INNER JOIN records t2 
   WHERE t1.id > t2.id 
   AND t1.jira_story_number = t2.jira_story_number;
   ```
3. Enable duplicate checking in [crud.js](crud.js)

### Performance Issues

#### Problem: Slow page load

**Optimization Steps**:

1. **Enable Lazy Loading**:
   - Configuration → Performance Settings
   - Enable "Lazy Load Images"
   - Enable pagination (default: 50 records/page)

2. **Reduce Dataset**:
   - Filter by current sprint only
   - Archive old completed stories
   - Limit JIRA cache retention (default: 7 days)

3. **Clear Caches**:
   - Browser cache: Ctrl+Shift+Delete
   - PHP OPcache: Run `clear-cache.php`
   - MySQL query cache: `RESET QUERY CACHE;`

4. **Database Optimization**:
   ```sql
   OPTIMIZE TABLE records;
   OPTIMIZE TABLE jira_issues_cache;
   OPTIMIZE TABLE jira_sync_log;
   ANALYZE TABLE records;
   ```

5. **Server Configuration** ([php.ini](php.ini)):
   ```ini
   memory_limit = 512M
   max_execution_time = 300
   upload_max_filesize = 50M
   opcache.enable = 1
   ```

#### Problem: Charts not rendering

**Solutions**:
1. Verify Chart.js library loaded (check Network tab)
2. Ensure data exists for chart (empty datasets won't render)
3. Check console for Chart.js errors
4. Try different browser
5. Clear browser cache
6. Update Chart.js: Currently v4.4.1

### Browser Compatibility

**Supported Browsers**:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

**Not Supported**:
- ❌ Internet Explorer 11 (ES6 modules required)
- ❌ Safari < 14 (limited module support)

**Mobile**:
- Responsive design works on tablets/phones
- Touch interactions supported
- Some modals may be small on phones
- Recommend landscape mode

### Database Issues

#### Problem: "Table doesn't exist"

**Solutions**:
1. Import SQL schema:
   ```bash
   mysql -u root sprint_tracker < Database/sprint_tracker.sql
   ```
2. Check database name in [Database/config.php](Database/config.php)
3. Verify all 43 tables exist in phpMyAdmin
4. Run installation script again

#### Problem: "Access denied for user"

**Solutions**:
1. Update credentials in [Database/config.php](Database/config.php)
2. Grant permissions:
   ```sql
   GRANT ALL PRIVILEGES ON sprint_tracker.* TO 'your_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
3. Verify MySQL user exists: `SELECT User FROM mysql.user;`

#### Problem: "Storage quota exceeded"

**Solutions**:
1. Check storage: Dashboard → "Storage Info"
2. Clear old sync logs:
   ```sql
   DELETE FROM jira_sync_log 
   WHERE logged_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
   ```
3. Clear audit logs:
   ```sql
   DELETE FROM jira_audit_log 
   WHERE logged_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
   ```
4. Increase `max_allowed_packet` in MySQL config
5. Archive old records to separate table

### Sync Issues

#### Problem: Auto-sync not working

**Diagnostic**:
1. Check auto-sync is enabled: JIRA tab → "Auto-Sync" toggle (should be ON)
2. Verify interval setting (default: 900 seconds = 15 minutes)
3. Browser must stay open (sync stops when closed)
4. Check sync logs for errors

**Solutions**:
1. Disable and re-enable auto-sync toggle
2. Set shorter interval for testing (60 seconds)
3. Check JIRA rate limits not exceeded
4. Verify JIRA credentials still valid
5. Review [auto-sync.api.php](JIRA/auto-sync.api.php) for errors

#### Problem: Sync conflicts (data mismatch)

**Scenarios**:
- Local says "In Progress", JIRA says "Done"
- Different descriptions in local vs JIRA
- Tags exist locally but not in JIRA

**Solutions**:
1. Choose sync direction:
   - **JIRA → Local**: JIRA is source of truth (recommended)
   - **Local → JIRA**: Local is source of truth
   - **Manual**: Resolve conflicts one by one
2. Force sync: Select story → Sync icon → Confirm overwrite
3. Review sync logs for conflict details

### Security Issues

#### Problem: Session timeout

**Solutions**:
1. Increase session lifetime:
   - Edit [JIRA/session.api.php](JIRA/session.api.php)
   - Change `$token_lifetime` (default: 3600 = 1 hour)
2. Re-authenticate: JIRA tab → "Reconnect"
3. Check `jira_session_tokens` table for expired tokens

#### Problem: "Rate limit exceeded"

**Current Limits**:
- Localhost (127.0.0.1): 1000 requests per 10 seconds
- Remote IPs: 100 requests per 1 second

**Solutions**:
1. Wait for limit reset period
2. Check current limits:
   ```sql
   SELECT * FROM jira_rate_limit WHERE ip_address = 'YOUR_IP';
   ```
3. Clear all limits: Run `JIRA/clear-rate-limits.php`
4. Increase limits: Edit [security.php](JIRA/security.php) lines 90-110

### Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Invalid JSON response from API" | API returned HTML error page | Check PHP error logs, enable `display_errors` |
| "Maximum execution time of 30 seconds exceeded" | Large sync operation | Increase `max_execution_time` in php.ini |
| "Call to undefined function curl_init()" | PHP cURL extension missing | Install: `sudo apt-get install php-curl` (Linux) |
| "localStorage is not defined" | Incognito/private mode | Use normal browser window |
| "Cannot read property 'map' of undefined" | State data corrupted | Clear localStorage, reload |
| "This site can't provide a secure connection" | SSL/TLS error | Check JIRA URL uses `https://` |
| "Mixed content blocked" | HTTP resource on HTTPS page | Update all URLs to HTTPS |
| "CORS policy: No 'Access-Control-Allow-Origin'" | Direct JIRA API call blocked | Use proxy API instead |
| "Duplicate entry for key 'PRIMARY'" | Trying to insert existing ID | Check auto-increment settings |
| "Unknown column in 'field list'" | Database schema mismatch | Re-import SQL schema |

### Getting Help

**Before asking for help**:

1. **Check Browser Console** (F12):
   - Look for red error messages
   - Note the file and line number
   - Copy full error text

2. **Check Network Tab** (F12):
   - Find failed requests (red status codes)
   - Check request/response details
   - Note status code (404, 500, etc.)

3. **Review Server Logs**:
   - PHP error log: `xampp/php/logs/php_error_log`
   - Apache error log: `xampp/apache/logs/error.log`
   - Apache access log: `xampp/apache/logs/access.log`

4. **Enable Debug Mode**:
   - Edit [js/init.js](js/init.js)
   - Set `DEBUG = true` at top of file
   - Reload page
   - More verbose console logging

5. **Test Individual Components**:
   - JIRA connection: `JIRA/test-connection.api.php`
   - Database: phpMyAdmin
   - PHP config: Create `<?php phpinfo(); ?>` page
   - Attachment proxy: Direct URL test

**Include in support request**:
- Exact error message
- Steps to reproduce
- Browser and version
- Screenshot of console errors
- Relevant log excerpts
- Database table structure (if DB error)

### Best Practices to Avoid Issues

1. **Regular Backups**: Enable automatic daily backups
2. **Monitor Logs**: Review sync and security logs weekly
3. **Keep Updated**: Update Chart.js, jsPDF when new versions release
4. **Test Changes**: Use development environment first
5. **Validate Data**: Monthly check for duplicates and orphaned records
6. **Clear Caches**: Monthly cache clearing routine
7. **Optimize Database**: Quarterly `OPTIMIZE TABLE` on all tables
8. **Security Audit**: Monthly review of IP whitelist and rate limits
9. **Performance Check**: Monitor page load times, optimize if > 3 seconds
10. **Documentation**: Keep custom configuration documented

## � Development

### Code Structure

**Frontend Architecture**:
- **Single Page Application (SPA)**: All in [index.html](index.html) (1,593 lines)
- **Modular JavaScript**: 40 ES6 modules with specific responsibilities
- **Component-Based CSS**: 33 CSS files following BEM methodology
- **No Framework**: Vanilla JavaScript for maximum performance
- **State Management**: Centralized state in [state.js](js/state.js)

**Backend Architecture**:
- **RESTful API**: 20 PHP endpoints returning JSON
- **Separation of Concerns**: Database, JIRA, security layers separated
- **Secure by Default**: All endpoints validate and sanitize input
- **Proxy Pattern**: JIRA requests proxied for security

### Development Setup

#### Prerequisites

```bash
# Check versions
php --version     # Should be 7.4+
mysql --version   # Should be 5.7+ or 8.0+
```

#### Local Environment

1. **Clone/Download** project to `xampp/htdocs/`

2. **Start Services**:
   ```bash
   # Start Apache and MySQL
   sudo xampp start
   ```

3. **Create Database**:
   ```bash
   mysql -u root -p
   CREATE DATABASE sprint_tracker;
   USE sprint_tracker;
   SOURCE Database/sprint_tracker.sql;
   EXIT;
   ```

4. **Configure Database**:
   Edit `Database/config.php`:
   ```php
   $host = 'localhost';
   $dbname = 'sprint_tracker';
   $username = 'root';
   $password = 'your_password';
   ```

5. **Configure JIRA**:
   Edit `JIRA/config.api.php`:
   ```php
   define('JIRA_URL', 'https://yourcompany.atlassian.net');
   define('JIRA_EMAIL', 'your.email@company.com');
   define('JIRA_API_TOKEN', 'your_api_token_here');
   ```

6. **Set Permissions** (Linux/Mac):
   ```bash
   chmod 755 Database/
   chmod 644 Database/*.php
   chmod 777 backup/
   ```

7. **Access Application**:
   - Navigate to: `http://localhost/NewJirastoriestracker/`
   - Should see login or main dashboard

#### Development Tools

**Recommended IDE**:
- Visual Studio Code with extensions:
  - PHP Intelephense
  - ESLint
  - Prettier
  - SQLTools

**Browser DevTools**:
- Chrome DevTools (F12)
- Firefox Developer Tools
- React DevTools (not needed, but useful for debugging)

**Database Management**:
- phpMyAdmin: `http://localhost/phpmyadmin`
- MySQL Workbench

### Code Standards

#### JavaScript Style

**ES6+ Features**:
```javascript
// Use arrow functions
const fetchData = async () => {
    const response = await fetch('/api/data');
    return response.json();
};

// Destructuring
const { id, jira_story_number, description } = record;

// Template literals
console.log(`Processing story: ${jira_story_number}`);

// Modules
import { loadState, saveState } from './state.js';
export const myFunction = () => { /* ... */ };
```

**Naming Conventions**:
- Variables: `camelCase` (e.g., `jiraStoryNumber`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `API_BASE_URL`)
- Functions: `camelCase` (e.g., `renderTable()`)
- Classes: `PascalCase` (e.g., `DataManager`)
- Files: `kebab-case.js` (e.g., `sprint-calendar.js`)

**Comments**:
```javascript
/**
 * Fetch JIRA issues matching the query
 * @param {string} jql - JQL query string
 * @param {number} maxResults - Maximum results to return
 * @returns {Promise<Array>} Array of JIRA issues
 */
async function fetchJiraIssues(jql, maxResults = 50) {
    // Implementation
}
```

#### PHP Style

**PSR-12 Compliance**:
```php
<?php
// Strict types
declare(strict_types=1);

// Proper spacing
class DataAPI {
    private $db;
    
    public function __construct(PDO $db) {
        $this->db = $db;
    }
    
    public function getRecords(int $limit = 50): array {
        // Implementation
    }
}

// Error handling
try {
    $result = $api->getData();
} catch (Exception $e) {
    error_log($e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
```

**Security Best Practices**:
```php
// Always use prepared statements
$stmt = $pdo->prepare('SELECT * FROM records WHERE id = ?');
$stmt->execute([$id]);

// Sanitize output
echo htmlspecialchars($userInput, ENT_QUOTES, 'UTF-8');

// Validate input
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    throw new InvalidArgumentException('Invalid email');
}

// CSRF protection
if (!hash_equals($_SESSION['csrf_token'], $_POST['csrf_token'])) {
    die('CSRF token mismatch');
}
```

#### CSS Style

**BEM Methodology**:
```css
/* Block */
.modal {
    display: none;
}

/* Element */
.modal__header {
    padding: 1rem;
}

.modal__title {
    font-size: 1.5rem;
}

/* Modifier */
.modal--large {
    width: 80vw;
}

.modal__button--primary {
    background-color: var(--accent-color);
}
```

**CSS Variables**:
```css
:root {
    --background-color: #0a0e27;
    --surface-color: #1a1f3a;
    --accent-color: #00d4ff;
    --text-color: #e0e0e0;
    --border-radius: 8px;
}

/* Usage */
.card {
    background-color: var(--surface-color);
    color: var(--text-color);
    border-radius: var(--border-radius);
}
```

#### SQL Style

**Formatting**:
```sql
-- Uppercase keywords
SELECT 
    id,
    jira_story_number,
    description,
    created_at
FROM 
    records
WHERE 
    pi = 'PI-2'
    AND sprint = 'Sprint 3'
    AND status = 'In Progress'
ORDER BY 
    created_at DESC
LIMIT 50;

-- Consistent indentation
CREATE TABLE example (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Adding New Features

#### Creating a New Tab

1. **Add Tab Button** in [index.html](index.html):
```html
<div class="tab-button" data-tab="my-feature">
    <span class="tab-icon">🎯</span>
    <span class="tab-label">My Feature</span>
</div>
```

2. **Create Tab Content**:
```html
<div id="my-feature-tab" class="tab-content">
    <div class="section-header">
        <h2>🎯 My Feature</h2>
    </div>
    <!-- Your content here -->
</div>
```

3. **Add JavaScript** ([js/my-feature.js](js/my-feature.js)):
```javascript
// Initialize feature
export function initMyFeature() {
    console.log('My Feature initialized');
    loadData();
    attachEventListeners();
}

function loadData() {
    // Load data from API
}

function attachEventListeners() {
    // Attach event listeners
}
```

4. **Import in** [js/init.js](js/init.js):
```javascript
import { initMyFeature } from './my-feature.js';

// In init function
initMyFeature();
```

5. **Create CSS** ([css/my-feature.css](css/my-feature.css)):
```css
.my-feature-container {
    padding: 2rem;
}
```

6. **Link CSS** in [index.html](index.html):
```html
<link rel="stylesheet" href="css/my-feature.css">
```

#### Adding a New API Endpoint

1. **Create PHP File** ([Database/my-feature.api.php](Database/my-feature.api.php)):
```php
<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    $action = $_POST['action'] ?? $_GET['action'] ?? '';
    
    switch ($action) {
        case 'getData':
            getData($pdo);
            break;
        case 'saveData':
            saveData($pdo);
            break;
        default:
            throw new Exception('Invalid action');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

function getData($pdo) {
    $stmt = $pdo->query('SELECT * FROM my_table');
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $data]);
}

function saveData($pdo) {
    $data = json_decode(file_get_contents('php://input'), true);
    // Validate and save data
    echo json_encode(['success' => true]);
}
```

2. **Call from JavaScript**:
```javascript
async function fetchData() {
    const response = await fetch('Database/my-feature.api.php?action=getData');
    const result = await response.json();
    return result.data;
}

async function saveData(data) {
    const response = await fetch('Database/my-feature.api.php?action=saveData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json();
}
```

#### Adding a New Database Table

1. **Create Migration SQL**:
```sql
CREATE TABLE IF NOT EXISTS my_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

2. **Add to** [Database/sprint_tracker.sql](Database/sprint_tracker.sql)

3. **Create API CRUD Operations** (see above)

4. **Update Backup/Export**:
   - Add table to [js/backup.js](js/backup.js)
   - Include in export functionality

### Testing

#### Manual Testing Checklist

**JIRA Integration**:
- [ ] Test connection with valid credentials
- [ ] Test connection with invalid credentials
- [ ] Fetch stories from JIRA
- [ ] Sync single story
- [ ] Bulk sync multiple stories
- [ ] Auto-sync triggers correctly
- [ ] View sync logs
- [ ] Download PDF attachment
- [ ] Download Word attachment
- [ ] View inline images

**Data Operations**:
- [ ] Create new record
- [ ] Edit existing record
- [ ] Delete record
- [ ] Bulk update status
- [ ] Bulk add tags
- [ ] Bulk delete
- [ ] Search/filter records

**UI/UX**:
- [ ] All tabs switch correctly
- [ ] Modals open and close
- [ ] Forms validate input
- [ ] Toast notifications appear
- [ ] Loading indicators show
- [ ] Responsive on mobile
- [ ] Dark/light themes work

**Performance**:
- [ ] Page loads in < 3 seconds
- [ ] Table renders 1000+ records smoothly
- [ ] Charts render without lag
- [ ] No memory leaks after 30 min use

#### Browser Testing

Test in:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

#### Database Testing

```sql
-- Test data integrity
SELECT COUNT(*) FROM records WHERE jira_story_number IS NULL;
SELECT COUNT(*) FROM records WHERE created_at IS NULL;

-- Test for duplicates
SELECT jira_story_number, COUNT(*) 
FROM records 
GROUP BY jira_story_number 
HAVING COUNT(*) > 1;

-- Test indexes
EXPLAIN SELECT * FROM records WHERE jira_story_number = 'TBCRM3-123';
```

### Debugging

#### Enable Debug Mode

Edit [js/init.js](js/init.js):
```javascript
const DEBUG = true;  // Change to true

if (DEBUG) {
    console.log('Debug mode enabled');
    window.state = state;  // Expose state globally
    window.debugTools = { /* helper functions */ };
}
```

#### Common Debug Commands

**Check State**:
```javascript
// In browser console
console.table(state.records);
console.log(state.filters);
```

**Test Functions**:
```javascript
// Test JIRA fetch
await fetchJiraIssues('project = TBCRM3');

// Test database save
await saveRecord({ /* record data */ });
```

**Inspect Network Requests**:
```javascript
// Add to monitoring
window.addEventListener('fetch', (event) => {
    console.log('Fetching:', event.request.url);
});
```

#### Logging

**JavaScript Logging**:
```javascript
// Levels
console.log('Info message');
console.warn('Warning message');
console.error('Error message');
console.debug('Debug message');

// Grouping
console.group('JIRA Sync');
console.log('Fetching issues...');
console.log('Processing...');
console.groupEnd();

// Timing
console.time('loadData');
loadData();
console.timeEnd('loadData');
```

**PHP Logging**:
```php
// Error log
error_log('Custom error message');
error_log(print_r($data, true));  // Log arrays/objects

// Custom log file
file_put_contents('logs/custom.log', date('Y-m-d H:i:s') . ' - ' . $message . "\n", FILE_APPEND);
```

### Version Control

#### Git Workflow

**Branching Strategy**:
```bash
main
├── development
├── feature/attachment-support
├── feature/sprint-calendar
└── hotfix/attachment-download-bug
```

**Commit Message Format**:
```
<type>: <subject>

<body>

<footer>
```

**Examples**:
```
feat: Add JIRA attachment download support

- Implement UUID-based matching
- Add attachment proxy for secure downloads
- Support PDF, Word, Excel file types

Closes #123

fix: Resolve attachment .htm download issue

Fixed security headers interfering with Content-Type
Removed setSecurityHeaders() from proxy
Enhanced buffer clearing for binary files

Fixes #456

docs: Update README with troubleshooting section

Added comprehensive troubleshooting guide
Documented attachment fix details
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Updating build tasks, package manager configs

#### .gitignore

```
# Configuration
Database/config.php
JIRA/config.api.php

# Backups
backup/*.json
!backup/.gitkeep

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Temporary
tmp/
cache/
```

### Performance Optimization

#### Frontend Optimization

**Lazy Loading Images**:
```javascript
// Implemented in lazy-loading.js
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observer.unobserve(img);
        }
    });
});
```

**Debouncing Search**:
```javascript
// Prevent excessive API calls
const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

searchInput.addEventListener('input', debounce(performSearch, 300));
```

**Virtual Scrolling** (for large tables):
```javascript
// Render only visible rows
function renderVisibleRows(startIndex, endIndex) {
    const visibleData = allData.slice(startIndex, endIndex);
    tableBody.innerHTML = visibleData.map(row => renderRow(row)).join('');
}
```

#### Backend Optimization

**Database Indexing**:
```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_pi_sprint ON records(pi, sprint);
CREATE INDEX idx_status ON records(jira_status);
CREATE INDEX idx_created ON records(created_at);

-- Composite index for common filters
CREATE INDEX idx_filter ON records(pi, sprint, jira_status);
```

**Query Optimization**:
```php
// Bad: N+1 queries
foreach ($records as $record) {
    $tags = $pdo->query("SELECT * FROM tags WHERE record_id = {$record['id']}");
}

// Good: Single query with JOIN
$sql = "SELECT r.*, GROUP_CONCAT(t.name) as tags
        FROM records r
        LEFT JOIN record_tags rt ON r.id = rt.record_id
        LEFT JOIN tags t ON rt.tag_id = t.id
        GROUP BY r.id";
```

**Caching**:
```php
// Cache JIRA responses
$cacheKey = 'jira_issue_' . $issueKey;
if ($cached = getCache($cacheKey)) {
    return $cached;
}
$data = fetchFromJira($issueKey);
setCache($cacheKey, $data, 3600);  // 1 hour
```

#### Server Optimization

**Enable OPcache** (php.ini):
```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.revalidate_freq=60
```

**Enable Gzip Compression** (.htaccess):
```apache
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>
```

**Browser Caching** (.htaccess):
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

## 📚 API Reference

### REST API Endpoints

All endpoints return JSON. Include `Content-Type: application/json` header.

#### Data API ([Database/data.api.php](Database/data.api.php))

**Get All Records**
```http
GET /Database/data.api.php?action=getData
Response: { "success": true, "data": [...] }
```

**Get Single Record**
```http
GET /Database/data.api.php?action=getRecord&id=123
Response: { "success": true, "data": {...} }
```

**Create Record**
```http
POST /Database/data.api.php?action=createRecord
Body: {
    "jira_story_number": "TBCRM3-123",
    "description": "Story description",
    "pi": "PI-2",
    "sprint": "Sprint 3",
    ...
}
Response: { "success": true, "id": 456 }
```

**Update Record**
```http
POST /Database/data.api.php?action=updateRecord
Body: {
    "id": 123,
    "jira_status": "Done",
    ...
}
Response: { "success": true }
```

**Delete Record**
```http
POST /Database/data.api.php?action=deleteRecord
Body: { "id": 123 }
Response: { "success": true }
```

#### JIRA API ([JIRA/issues.api.php](JIRA/issues.api.php))

**Search Issues**
```http
POST /JIRA/issues.api.php?action=search
Body: {
    "jql": "project = TBCRM3 AND sprint = 'Sprint 3'",
    "maxResults": 50,
    "fields": ["summary", "description", "status", "assignee", ...]
}
Response: { "success": true, "issues": [...] }
```

**Get Issue Details**
```http
POST /JIRA/issues.api.php?action=getIssue
Body: { "issueKey": "TBCRM3-123" }
Response: { "success": true, "issue": {...} }
```

**Update Issue**
```http
POST /JIRA/issues.api.php?action=updateIssue
Body: {
    "issueKey": "TBCRM3-123",
    "fields": {
        "status": { "name": "Done" },
        "customfield_12345": "Value"
    }
}
Response: { "success": true }
```

#### Sync API ([JIRA/sync.api.php](JIRA/sync.api.php))

**Sync Single Story**
```http
POST /JIRA/sync.api.php?action=syncSingle
Body: { "id": 123 }  // Local record ID
Response: { "success": true, "updated": {...} }
```

**Bulk Sync**
```http
POST /JIRA/sync.api.php?action=syncBulk
Body: { "ids": [123, 456, 789] }
Response: { "success": true, "synced": 3, "failed": 0 }
```

**Get Sync Logs**
```http
GET /JIRA/sync-logs.api.php?limit=100&offset=0
Response: { "success": true, "logs": [...], "total": 250 }
```

#### Attachment API ([JIRA/attachment-proxy.api.php](JIRA/attachment-proxy.api.php))

**Download Attachment**
```http
GET /JIRA/attachment-proxy.api.php?id=280515&filename=document.pdf&download=1
Response: Binary file data (PDF, Word, etc.)
Headers:
    Content-Type: application/pdf
    Content-Disposition: attachment; filename="document.pdf"
```

**View Attachment (Inline)**
```http
GET /JIRA/attachment-proxy.api.php?id=280515&filename=image.png
Response: Binary image data
Headers:
    Content-Type: image/png
    Content-Disposition: inline; filename="image.png"
```

#### Configuration API ([Database/settings.api.php](Database/settings.api.php))

**Get All Settings**
```http
GET /Database/settings.api.php?action=getSettings
Response: { "success": true, "settings": {...} }
```

**Update Setting**
```http
POST /Database/settings.api.php?action=updateSetting
Body: {
    "key": "theme",
    "value": "dark"
}
Response: { "success": true }
```

### JavaScript API

#### State Management

```javascript
import { loadState, saveState, getState, setState } from './state.js';

// Get current state
const state = getState();

// Update state
setState({ records: [...newRecords] });

// Save to localStorage
saveState();

// Load from localStorage
loadState();
```

#### JIRA Integration

```javascript
import { fetchJiraIssues, syncStory, downloadAttachment } from './jira.js';

// Fetch issues
const issues = await fetchJiraIssues('project = TBCRM3', 50);

// Sync story
const result = await syncStory(recordId);

// Download attachment
downloadAttachment(attachmentId, filename, mimeType);
```

#### Table Rendering

```javascript
import { renderTable, addTableRow, updateTableRow, deleteTableRow } from './table.js';

// Render full table
renderTable(records);

// Add single row
addTableRow(newRecord);

// Update row
updateTableRow(recordId, updatedData);

// Delete row
deleteTableRow(recordId);
```

### WebHooks (Future Enhancement)

**Planned**: JIRA webhook integration for real-time updates

```http
POST /webhooks/jira.php
Body: {
    "webhookEvent": "jira:issue_updated",
    "issue": {
        "key": "TBCRM3-123",
        ...
    }
}
```

## 🤝 Contributing

This is a proprietary project for internal use. Contact the development team for contribution guidelines.

### Reporting Issues

When reporting bugs, include:
1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Exact steps to trigger the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: Browser, OS, PHP version
6. **Screenshots**: If applicable
7. **Console Errors**: From browser console (F12)
8. **Logs**: Relevant error logs

### Feature Requests

Include:
1. **Use Case**: Why this feature is needed
2. **Proposed Solution**: How it should work
3. **Alternatives**: Other ways to solve the problem
4. **Mockups**: UI mockups if applicable

## �📝 License

This project is proprietary software. All rights reserved.

## 👥 Support

For issues and questions:
1. Check troubleshooting section above
2. Review browser console for error messages
3. Check Apache error logs: `xampp/apache/logs/error.log`
4. Contact system administrator

## 🔄 Version History

### v2.0 (Current - March 2026)
**Major Features**:
- ✅ JIRA attachment support (images inline, document downloads)
- ✅ UUID-based attachment matching for reliable downloads
- ✅ Enhanced ADF (Atlassian Document Format) rendering
- ✅ Improved security headers and binary file handling
- ✅ Auto-sync with interval and scheduled modes
- ✅ Visual sprint calendar with drag-and-drop
- ✅ Automated status rules engine
- ✅ Advanced bulk operations
- ✅ Real-time KPI dashboard
- ✅ Complete JIRA bidirectional sync

**Bug Fixes**:
- 🐛 Fixed attachment downloads (was .htm, now correct file types)
- 🐛 Resolved Content-Type header conflicts
- 🐛 Fixed output buffer contamination in binary downloads
- 🐛 Improved acceptance criteria formatting
- 🐛 Enhanced error handling in JIRA API calls

**Technical Improvements**:
- 43 database tables for comprehensive data management
- 40 modular JavaScript files (ES6+)
- 33 component-based CSS files
- 20 secure PHP API endpoints
- Enhanced security (CSRF, rate limiting, IP whitelist)
- Performance optimization (lazy loading, pagination)

### v1.0 (Initial Release - January 2026)
- Basic sprint tracking functionality
- JIRA synchronization (one-way)
- Sprint management (PI, Quarter, Sprint)
- Work items tracking (SC, VC)
- Basic KPI dashboard
- Data export/import
- Tags and notes system
- Customizable themes

---

## ❓ FAQ

### General Questions

**Q: What is Sprint Tracker Pro?**  
A: A comprehensive web application for tracking Agile sprints with deep JIRA integration, designed specifically for the TBCRM3 Salesforce Vlocity project.

**Q: Do I need JIRA to use this?**  
A: No, Sprint Tracker can be used standalone. JIRA integration is optional but provides powerful sync capabilities.

**Q: Is this a cloud or on-premise solution?**  
A: On-premise. Runs on your local XAMPP server with full data control and privacy.

**Q: Can multiple users access it simultaneously?**  
A: Yes, as long as they're on the same network and can access your XAMPP server. Database handles concurrent connections.

**Q: What's the maximum number of stories it can handle?**  
A: Tested with 5,000+ stories. Performance remains good with pagination and lazy loading enabled.

### JIRA Integration

**Q: Which JIRA versions are supported?**  
A: JIRA Cloud (Atlassian hosted). Uses JIRA REST API v3. Self-hosted JIRA Server may work but is not officially supported.

**Q: How do I generate a JIRA API token?**  
A: 
1. Log in to https://id.atlassian.com
2. Go to Security → API tokens
3. Create new token
4. Copy and paste into Sprint Tracker configuration

**Q: Can I sync from multiple JIRA projects?**  
A: Yes, use JQL queries to search across projects: `project IN (TBCRM3, PROJ2, PROJ3)`

**Q: How often does auto-sync run?**  
A: Configurable. Default is every 15 minutes (900 seconds). Can be set as low as 60 seconds or use scheduled mode (e.g., daily at 9 AM).

**Q: What happens if JIRA and local data conflict?**  
A: You choose sync direction:
- **From JIRA**: JIRA overwrites local (recommended)
- **To JIRA**: Local overwrites JIRA
- **Manual**: Resolve conflicts individually

### Attachments

**Q: Why were attachments downloading as .htm files?**  
A: This was a bug in v1.0 caused by UUID mismatch and security headers. Fixed in v2.0 with UUID-based matching and improved binary handling.

**Q: What file types are supported?**  
A: All JIRA attachment types:
- Images: PNG, JPG, GIF, SVG, WebP (display inline)
- Documents: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx)
- Archives: ZIP, RAR
- Text: TXT, CSV, JSON, XML

**Q: Are attachments downloaded from JIRA every time?**  
A: Yes, attachments are proxied from JIRA for security and access control. They're not stored locally.

**Q: Can I upload attachments from Sprint Tracker?**  
A: Not currently. Attachments must be added in JIRA and will sync to Sprint Tracker.

### Data & Security

**Q: Where is data stored?**  
A: MySQL database on your local XAMPP server. No data sent to external servers (except JIRA for sync).

**Q: Is data encrypted?**  
A: Database connections use MySQL native authentication. JIRA API calls use HTTPS. For additional security, enable MySQL SSL connections.

**Q: What are the backup options?**  
A: 
- **Manual**: Click "Backup" button anytime (downloads JSON file)
- **Automatic**: Scheduled backups to `backup/` folder (daily/weekly/monthly)

**Q: Can I recover deleted stories?**  
A: If you have a backup, yes. Otherwise, deletion is permanent. If synced with JIRA, re-import from JIRA.

**Q: What permissions does the MySQL user need?**  
A: `SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, INDEX` on `sprint_tracker` database.

### Customization

**Q: Can I add custom fields?**  
A: Yes! Configuration → Custom Fields. Define name, data type, default value. Custom columns appear in table and forms.

**Q: Can I customize the theme/colors?**  
A: Yes! Choose from 6 presets (Default, Midnight, Forest, Ocean, Crimson, Light) or create custom theme with full color control.

**Q: Can I change the logo?**  
A: Yes! Configuration → Branding → Upload Logo. Accepts SVG or PNG (max 2MB).

**Q: Can I add more sprint statuses?**  
A: Yes! Configuration → Status Management → Add custom JIRA or DevOps statuses with colors.

### Performance

**Q: The page is loading slowly. How to fix?**  
A: 
1. Enable pagination (Configuration → Performance)
2. Enable lazy loading for images
3. Filter by current sprint only
4. Clear browser cache
5. Optimize database (see Troubleshooting)
6. Increase PHP memory limit to 512M

**Q: Charts are not rendering. Why?**  
A: 
1. Check Chart.js library loaded (Network tab)
2. Ensure data exists for chart
3. Try different browser
4. Clear browser cache

**Q: Can I export large datasets?**  
A: Yes, but it may take time. For 1000+ records, use CSV export which is faster than JSON.

### Mobile & Browser

**Q: Does it work on mobile devices?**  
A: Yes, responsive design works on tablets and smartphones. Best experience on tablets in landscape mode.

**Q: Which browsers are supported?**  
A: Chrome 90+, Firefox 88+, Edge 90+, Safari 14+. Internet Explorer is NOT supported.

**Q: Can I use it offline?**  
A: Partially. You can view cached data, but JIRA sync requires internet connection.

### Development

**Q: Can I modify the code?**  
A: Yes, full source code is available. See [Development](#-development) section for guidelines.

**Q: What programming languages are used?**  
A: 
- Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3
- Backend: PHP 7.4+
- Database: MySQL 5.7+ or 8.0+
- Libraries: Chart.js, jsPDF

**Q: Is there an API?**  
A: Yes, RESTful JSON API. See [API Reference](#-api-reference) section.

**Q: Can I integrate with other tools?**  
A: Yes, via API or by extending JIRA field mappings. Webhook support planned for future release.

---

## 📸 Screenshots

_Note: Add screenshots to `screenshots/` folder and update links below_

**Main Dashboard**
```
[Dashboard view with KPI cards and charts]
```

**Data Entry Form**
```
[Form showing all fields for story entry]
```

**JIRA Integration**
```
[JIRA tab with sync options and search]
```

**Story Details with Attachments**
```
[Modal showing story details with inline images and document downloads]
```

**Sprint Calendar**
```
[Visual calendar with sprint timelines]
```

**Automated Status Rules**
```
[Rule engine configuration interface]
```

---

## 👥 Support

### Getting Help

For issues, questions, or feature requests:

1. **Check Documentation**:
   - Read [Troubleshooting](#-troubleshooting) section
   - Review [FAQ](#-faq) above
   - Check [Usage Guide](#-usage-guide)

2. **Check Logs**:
   - Browser console: F12 → Console tab
   - Network requests: F12 → Network tab
   - PHP error log: `xampp/php/logs/php_error_log`
   - Apache error log: `xampp/apache/logs/error.log`
   - JIRA sync logs: In application (JIRA tab → Sync Logs)

3. **Enable Debug Mode**:
   - Edit [js/init.js](js/init.js)
   - Set `DEBUG = true`
   - Reload page
   - More detailed logging in console

4. **Test Components**:
   - JIRA connection: `JIRA/test-connection.api.php`
   - Database: phpMyAdmin at `http://localhost/phpmyadmin`
   - PHP: Create test page with `<?php phpinfo(); ?>`

5. **Contact Development Team**:
   - Email: [Your team email]
   - Slack: [Your Slack channel]
   - Issue Tracker: [Your issue tracker URL]

### Reporting Bugs

Include the following information:

**Required**:
- [ ] Clear description of the issue
- [ ] Steps to reproduce (exact sequence)
- [ ] Expected behavior
- [ ] Actual behavior
- [ ] Browser and version
- [ ] OS and version
- [ ] Sprint Tracker version

**Helpful**:
- [ ] Screenshot or screen recording
- [ ] Console errors (F12 → Console)
- [ ] Network errors (F12 → Network)
- [ ] PHP error logs
- [ ] Sample data (anonymized)
- [ ] Recent changes (before bug appeared)

**Template**:
```markdown
### Bug Description
[Clear description of what's wrong]

### Steps to Reproduce
1. Go to...
2. Click on...
3. Enter...
4. See error

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- OS: Windows 10
- Browser: Chrome 120
- Sprint Tracker: v2.0
- PHP: 7.4.3
- MySQL: 8.0.21

### Console Errors
```
[Paste console error messages]
```

### Screenshots
[Attach screenshots]

### Additional Context
[Any other relevant information]
```

### Feature Requests

To request new features:

**Include**:
- [ ] Use case (why this feature is needed)
- [ ] Proposed solution (how it should work)
- [ ] Alternatives considered
- [ ] Priority (nice-to-have vs. critical)
- [ ] Mockups or examples (if applicable)

**Template**:
```markdown
### Feature Request

**Problem/Need**:
[Describe the problem or need]

**Proposed Solution**:
[How this feature should work]

**Alternatives**:
[Other ways to solve this]

**Use Case Example**:
[Real-world scenario where this would help]

**Priority**: High / Medium / Low

**Additional Notes**:
[Any other relevant information]
```

---

## 🙏 Acknowledgments

**Built with**:
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation
- [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) - Table generation for PDFs
- [Google Fonts](https://fonts.google.com/) - Syne and DM Sans fonts
- JIRA REST API v3 by Atlassian

**Special Thanks**:
- TBCRM3 Project Team
- Salesforce Vlocity Community
- Open Source Contributors

---

## 📞 Contact

**Project Maintained By**: [Your Name/Team]  
**Email**: [your.email@company.com]  
**Project Link**: [Repository or internal wiki URL]

---

**Last Updated**: March 2026  
**Documentation Version**: 2.0.1

---

**Built with ❤️ for efficient sprint tracking and Agile project management**
