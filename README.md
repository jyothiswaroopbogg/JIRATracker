# Sprint Tracker Pro

**Version:** 2.0  
**Project:** TBCRM3 - Salesforce Vlocity Project  
**Updated:** March 2026

A comprehensive, enterprise-grade web-based application for tracking and managing Agile sprints, JIRA stories, and work items. Features advanced automation, bidirectional JIRA synchronization, real-time analytics, visual sprint calendar, and customizable workflows designed for Salesforce Vlocity project management.

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
     - **Project Key**: Your JIRA project key
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

**Enable IP Restrictions**:
   - Navigate to Configuration → Security Settings
   - Enable "IP Whitelist"
   - Add allowed IP addresses:
     - Single IP: `192.168.1.100`
     - CIDR range: `192.168.1.0/24`
     - Multiple: One per line

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
Jira URL Template: https://[Company Name].atlassian.net/browse/{formatted}
Jira Display Format: {number}

Work Item URL Template: https://github.com/org/repo/tree/{formatted}
Work Item Display Format: {number6}
```

Placeholders:
- `{number}`: Story number without padding
- `{number6}`: Story number padded to 6 digits
- `{formatted}`: Fully formatted value

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
   project = [Project Name] AND sprint = "PI-2 Sprint 3"
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
├── index.html                   # Main application (1593 lines, single-page app)
├── favicon.svg                  # Application favicon
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

## 🤝 Contributing

This is a proprietary project for internal use. Contact the development team for contribution guidelines.

## �📝 License

This project is proprietary software. All rights reserved.

## 👥 Support

1. Contact system administrator

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

## 🙏 Acknowledgments

**Built with**:
- [Chart.js](https://www.chartjs.org/) - Beautiful charts
- [jsPDF](https://github.com/parallax/jsPDF) - PDF generation
- [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) - Table generation for PDFs
- [Google Fonts](https://fonts.google.com/) - Syne and DM Sans fonts
- JIRA REST API v3 by Atlassian

## 📞 Contact

**Project Maintained By**: Jyothiswaroop Boggavarapu  
**Email**: [bjyothiswaroop7@gmail.com]

---

**Last Updated**: March 2026  
**Documentation Version**: 2.0.1

---

**Built with ❤️ for efficient sprint tracking and Agile project management**
