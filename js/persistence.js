// Data Persistence (Database Storage via PHP API)

// Track deletion context to allow intentional empty saves
let isDeletionInProgress = false;

// Set deletion context (called before deletions)
function setDeletionContext() {
  isDeletionInProgress = true;
}

// Clear deletion context (called after save completes)
function clearDeletionContext() {
  isDeletionInProgress = false;
}

function saveState() {
  // ENHANCED SAFETY CHECK: Prevent saving empty records EXCEPT during intentional deletions
  // This protects against accidental data loss while allowing legitimate deletions
  const recordsEmpty = !state.records || (Array.isArray(state.records) && state.records.length === 0);
  
  // Skip empty records warning for tabs that don't use the main records array
  // Tab 5 = JIRA, Tab 6 = Configuration
  const isNonRecordsTab = state.currentTab === 5 || state.currentTab === 6;
  
  // Check if this is first load (fresh install) - don't warn
  const hasLocalStorageData = localStorage.getItem('sprintTrackerData');
  const isFreshInstall = !hasLocalStorageData || (state.notes && state.notes.length === 0);
  
  if (recordsEmpty && !isDeletionInProgress && !isNonRecordsTab && !isFreshInstall) {
    
    // Still save to localStorage, but log the warning
    try {
      const dataToSave = {
        records: state.records,
        notes: state.notes,
        recordLinks: state.recordLinks,
        notesRecordLinks: state.notesRecordLinks,
        notesTimestamps: state.notesTimestamps,
        tags: state.tags,
        recordTags: state.recordTags,
        jiraStatuses: state.jiraStatuses,
        devopsStatuses: state.devopsStatuses,
        devopsOrgs: state.devopsOrgs,
        columns: state.columns,
        customColumns: state.customColumns,
        jiraUrlTemplate: state.jiraUrlTemplate,
        jiraDisplayFormat: state.jiraDisplayFormat,
        wiUrlTemplate: state.wiUrlTemplate,
        wiDisplayFormat: state.wiDisplayFormat,
        filterCriteria: state.filterCriteria,
        currentTab: state.currentTab,
        tabScrollPositions: state.tabScrollPositions,
        labels: state.labels,
        colors: state.colors,
        fontSettings: state.fontSettings,
        downloadFilename: state.downloadFilename,
        timestampFormat: state.timestampFormat,
        useMatrixBackground: state.useMatrixBackground,
        matrixFontSize: state.matrixFontSize,
        matrixChars: state.matrixChars,
        backgroundImage: state.backgroundImage,
        websiteLogo: state.websiteLogo,
        backupSettings: state.backupSettings,
        backupHistory: state.backupHistory,
        backupLog: state.backupLog,
        automatedStatus: state.automatedStatus,
        sprintCalendar: state.sprintCalendar,
        selectedExportColumns: state.selectedExportColumns,
        lastSaved: new Date().toISOString()
      };
      
      // Save to localStorage only (skip database save to prevent data deletion)
      localStorage.setItem('sprintTrackerData', JSON.stringify(dataToSave));
    } catch (e) {
    }
    return; // Exit early - do NOT call database API
  }
  
  // Add timestamp
  state.lastSaved = new Date().toISOString();
  
  // Ensure all tags used by notes and records exist in state.tags
  ensureAllTagsExist();
  
  const dataToSave = {
    records: state.records,
    notes: state.notes,
    recordLinks: state.recordLinks,
    notesRecordLinks: state.notesRecordLinks,
    notesTimestamps: state.notesTimestamps,
    tags: state.tags,
    recordTags: state.recordTags,
    jiraStatuses: state.jiraStatuses,
    devopsStatuses: state.devopsStatuses,
    devopsOrgs: state.devopsOrgs,
    columns: state.columns,
    customColumns: state.customColumns,
    jiraUrlTemplate: state.jiraUrlTemplate,
    jiraDisplayFormat: state.jiraDisplayFormat,
    wiUrlTemplate: state.wiUrlTemplate,
    wiDisplayFormat: state.wiDisplayFormat,
    filterCriteria: state.filterCriteria,
    currentTab: state.currentTab,
    tabScrollPositions: state.tabScrollPositions,
    labels: state.labels,
    colors: state.colors,
    fontSettings: state.fontSettings,
    downloadFilename: state.downloadFilename,
    timestampFormat: state.timestampFormat,
    useMatrixBackground: state.useMatrixBackground,
    matrixFontSize: state.matrixFontSize,
    matrixChars: state.matrixChars,
    backgroundImage: state.backgroundImage,
    websiteLogo: state.websiteLogo,
    backupSettings: state.backupSettings,
    backupHistory: state.backupHistory,
    backupLog: state.backupLog,
    automatedStatus: state.automatedStatus,
    sprintCalendar: state.sprintCalendar,
    selectedExportColumns: state.selectedExportColumns,
    lastSaved: state.lastSaved
  };
  
  // Save to localStorage immediately (works without server)
  try {
    localStorage.setItem('sprintTrackerData', JSON.stringify(dataToSave));
  } catch (e) {
  }
  
  // Save to database via API
  fetch('Database/data.api.php', {  
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(dataToSave)
  })
  .then(response => {
    if (!response.ok) {
      return response.text().then(text => {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      });
    }
    return response.json();
  })
  .then(data => {
    if (!data.success) {
      alert('Database save failed: ' + (data.error || data.message));
    }
    // Always clear deletion context after save attempt
    clearDeletionContext();
  })
  .catch(error => {
    alert('Database connection failed: ' + error.message + '\n\nData saved to localStorage only.');
    // Always clear deletion context after save attempt
    clearDeletionContext();
  });
}

function loadState() {
  // Try to load from database first
  fetch('Database/data.api.php')
    .then(response => {
      if (!response.ok) {
        throw new Error('Database load failed');
      }
      return response.json();
    })
    .then(data => {
      if (!data || (data.success === false)) {
        loadFromLocalStorage();
        return;
      }
      Object.keys(data).forEach(k => {
        if (data[k] !== undefined) state[k] = data[k];
      });
      // Ensure recordLinks is always an object, not an array
      if (!state.recordLinks || Array.isArray(state.recordLinks)) {
        state.recordLinks = {};
      }
      // Ensure notesRecordLinks is always an object, not an array
      if (Array.isArray(state.notesRecordLinks)) {
        state.notesRecordLinks = {};
      }
      if (Array.isArray(state.notesTimestamps)) {
        state.notesTimestamps = {};
      }
      // Ensure recordTags is always an object, not an array
      if (Array.isArray(state.recordTags)) {
        state.recordTags = {};
      }
      // Ensure colors object exists
      if (!state.colors) {
        state.colors = {};
      }
      // Ensure holidays is always an object, not an array
      if (state.sprintCalendar && Array.isArray(state.sprintCalendar.holidays)) {
      // Ensure sprintDates is always an object, not an array
      if (state.sprintCalendar && Array.isArray(state.sprintCalendar.sprintDates)) {
        state.sprintCalendar.sprintDates = {};
      }
      // Ensure sprintColors is always an object, not an array
      if (state.sprintCalendar && Array.isArray(state.sprintCalendar.sprintColors)) {
        state.sprintCalendar.sprintColors = {};
      }
      // Ensure dismissed is always an object, not an array
      if (state.sprintCalendar && state.sprintCalendar.reminders && Array.isArray(state.sprintCalendar.reminders.dismissed)) {
        state.sprintCalendar.reminders.dismissed = {};
      }
        state.sprintCalendar.holidays = {};
      }
      // Ensure backupSettings exists
      if (!state.backupSettings) {
        state.backupSettings = {
          enabled: false,
          scheduleType: 'daily',
          scheduleTime: '02:00',
          scheduleDay: 'Monday',
          scheduleDate: '1',
          autoDelete: false,
          retentionDays: 30,
          lastBackup: null,
          nextBackup: null
        };
      }
      if (!state.backupHistory) {
        state.backupHistory = [];
      }      if (!state.backupLog) {
        state.backupLog = [];
      }      // Ensure automatedStatus exists
      if (!state.automatedStatus) {
        state.automatedStatus = {
          enabled: false,
          rules: [],
          lastExecution: null,
          executionLog: []
        };
      }
      // Ensure labels object has tab labels
      if (!state.labels) {
        state.labels = {};
      }
      if (!state.labels.tabDashboard) state.labels.tabDashboard = '📊 Dashboard';
      if (!state.labels.tabDataEntry) state.labels.tabDataEntry = '📋 Data Entry';
      if (!state.labels.tabSummary) state.labels.tabSummary = '📈 Detailed Summary';
      if (!state.labels.tabConfig) state.labels.tabConfig = '⚙️ Configuration';
      if (!state.labels.tabNotes) state.labels.tabNotes = '📝 Notes';
      if (!state.labels.tabSprintCalendar) state.labels.tabSprintCalendar = '📅 Sprint Calendar';
      // Ensure sprintCalendar exists
      if (!state.sprintCalendar) {
        state.sprintCalendar = {
          currentMonth: new Date().getMonth(),
          currentYear: new Date().getFullYear(),
          sprintDates: {},
          sprintColors: {},
          viewMode: 'month',
          holidays: {},
          compactMode: false
        };
      }
      if (!state.sprintCalendar.sprintColors) state.sprintCalendar.sprintColors = {};
      if (!state.sprintCalendar.sprintDates) state.sprintCalendar.sprintDates = {};
      if (!state.sprintCalendar.viewMode) state.sprintCalendar.viewMode = 'month';
      if (!state.sprintCalendar.holidays) state.sprintCalendar.holidays = {};
      if (state.sprintCalendar.compactMode === undefined) state.sprintCalendar.compactMode = false;
      
      // Ensure reminders settings exist
      if (!state.sprintCalendar.reminders) {
        state.sprintCalendar.reminders = {
          enabled: true,
          sprintStarting: { enabled: true, days: 1 },
          sprintEnding: { enabled: true, days: 2 },
          sprintOverdue: { enabled: true },
          lastChecked: null,
          dismissed: {}
        };
      }
      // Ensure all columns have order property
      ensureColumnOrder();
      // Migration: Ensure sprint_start and sprint_end columns are correctly configured
      ensureSprintColumns();
      // Migration: Add Work Item 1 (SC) and Work Item 2 (VC) columns if missing
      ensureWorkItemColumns();
      
      // Migration: Add timestamps to existing records
      if (typeof migrateRecordsTimestamps === 'function') {
        migrateRecordsTimestamps();
      }
      populateSelectsFromState();
      renderFormGrid();
      renderCustomColList();
      // Render column toggles after migrations complete
      if (typeof renderColumnToggles === 'function') {
        renderColumnToggles();
      }
      renderTable();
      updateKPIs();
      renderCharts();
      updateRecordCount();
      renderNotes();
      // Render tags management after data is loaded
      if (typeof renderTagsManagement === 'function') {
        renderTagsManagement();
      }
      // Render tags form field after data is loaded
      if (typeof renderTagsFormField === 'function') {
        renderTagsFormField();
      }
      // Update storage info display
      if (typeof updateStorageInfo === 'function') {
        updateStorageInfo();
      }
      // Render backup settings after data is loaded
      if (typeof renderBackupSettingsCard === 'function') {
        renderBackupSettingsCard();
      }
      // Render automated status card after data is loaded
      if (typeof renderAutomatedStatusCard === 'function') {
        renderAutomatedStatusCard();
      }
      // Render sprint calendar after data is loaded
      if (typeof renderSprintCalendarCard === 'function') {
        renderSprintCalendarCard();
      }
      // Initialize logo after data is loaded
      if (typeof initializeLogo === 'function') {
        initializeLogo();
      }
      // Load configuration settings into form fields after data is loaded
      if (typeof loadHyperlinkSettings === 'function') {
        loadHyperlinkSettings();
      }
      if (typeof loadBrandingLabels === 'function') {
        loadBrandingLabels();
      }
      if (typeof applyBrandingLabels === 'function') {
        applyBrandingLabels();
      }
      if (typeof loadTabLabels === 'function') {
        loadTabLabels();
      }
      if (typeof applyTabLabels === 'function') {
        applyTabLabels();
      }
      if (typeof loadFontSettings === 'function') {
        loadFontSettings();
      }
      if (typeof loadDownloadFilename === 'function') {
        loadDownloadFilename();
      }
      
      // Initialize sprint reminders after data is loaded
      if (typeof initializeSprintReminders === 'function') {
        initializeSprintReminders();
      }
      
      // Check if data needs recovery (only if localStorage has data)
      if ((!state.records || state.records.length === 0) && typeof checkIfDataRecoveryNeeded === 'function') {
        const hasLocalStorageData = localStorage.getItem('sprintTrackerData');
        if (hasLocalStorageData) {
          checkIfDataRecoveryNeeded();
          return; // Exit early - recovery will handle cleanup
        }
        // Silent for fresh installs - no warning needed
      }
      
      // Restore active tab after state is loaded
      setTimeout(() => {
        const tabToRestore = state.currentTab !== undefined ? state.currentTab : 0;
        if (tabToRestore >= 0 && tabToRestore <= 6) {
          switchTab(tabToRestore);
        }
      }, 250); // Increased delay to ensure all content is rendered
    })
    .catch(error => {
      loadFromLocalStorage();
    });
}

function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('sprintTrackerData');
    if (savedData) {
      const data = JSON.parse(savedData);
      Object.keys(data).forEach(k => {
        if (data[k] !== undefined) state[k] = data[k];
      });
      // Ensure recordLinks is always an object, not an array
      if (!state.recordLinks || Array.isArray(state.recordLinks)) {
        state.recordLinks = {};
      }
      // Ensure notesRecordLinks is always an object, not an array
      if (Array.isArray(state.notesRecordLinks)) {
        state.notesRecordLinks = {};
      }
      if (Array.isArray(state.notesTimestamps)) {
        state.notesTimestamps = {};
      }
      // Ensure recordTags is always an object, not an array
      if (Array.isArray(state.recordTags)) {
        state.recordTags = {};
      }
      // Ensure colors object exists
      if (!state.colors) {
        state.colors = {};
      }
      // Ensure holidays is always an object, not an array
      if (state.sprintCalendar && Array.isArray(state.sprintCalendar.holidays)) {
      // Ensure sprintDates is always an object, not an array
      if (state.sprintCalendar && Array.isArray(state.sprintCalendar.sprintDates)) {
        state.sprintCalendar.sprintDates = {};
      }
      // Ensure sprintColors is always an object, not an array
      if (state.sprintCalendar && Array.isArray(state.sprintCalendar.sprintColors)) {
        state.sprintCalendar.sprintColors = {};
      }
      // Ensure dismissed is always an object, not an array
      if (state.sprintCalendar && state.sprintCalendar.reminders && Array.isArray(state.sprintCalendar.reminders.dismissed)) {
        state.sprintCalendar.reminders.dismissed = {};
      }
        state.sprintCalendar.holidays = {};
      }
      // Ensure backupSettings exists
      if (!state.backupSettings) {
        state.backupSettings = {
          enabled: false,
          scheduleType: 'daily',
          scheduleTime: '04:30',
          scheduleDay: 'Monday',
          scheduleDate: '1',
          autoDelete: false,
          retentionDays: 30,
          lastBackup: null,
          nextBackup: null
        };
      }
      if (!state.backupHistory) {
        state.backupHistory = [];
      }      if (!state.backupLog) {
        state.backupLog = [];
      }      // Ensure automatedStatus exists
      if (!state.automatedStatus) {
        state.automatedStatus = {
          enabled: false,
          rules: [],
          lastExecution: null,
          executionLog: []
        };
      }
      // Ensure labels object has tab labels
      if (!state.labels) {
        state.labels = {};
      }
      if (!state.labels.tabDashboard) state.labels.tabDashboard = '📊 Dashboard';
      if (!state.labels.tabDataEntry) state.labels.tabDataEntry = '📋 Data Entry';
      if (!state.labels.tabSummary) state.labels.tabSummary = '📈 Detailed Summary';
      if (!state.labels.tabConfig) state.labels.tabConfig = '⚙️ Configuration';
      if (!state.labels.tabNotes) state.labels.tabNotes = '📝 Notes';
      if (!state.labels.tabSprintCalendar) state.labels.tabSprintCalendar = '📅 Sprint Calendar';
      // Ensure sprintCalendar exists
      if (!state.sprintCalendar) {
        state.sprintCalendar = {
          currentMonth: new Date().getMonth(),
          currentYear: new Date().getFullYear(),
          sprintDates: {},
          sprintColors: {},
          viewMode: 'month',
          holidays: {},
          compactMode: false
        };
      }
      if (!state.sprintCalendar.sprintColors) state.sprintCalendar.sprintColors = {};
      if (!state.sprintCalendar.sprintDates) state.sprintCalendar.sprintDates = {};
      if (!state.sprintCalendar.viewMode) state.sprintCalendar.viewMode = 'month';
      if (!state.sprintCalendar.holidays) state.sprintCalendar.holidays = {};
      if (state.sprintCalendar.compactMode === undefined) state.sprintCalendar.compactMode = false;
      
      // Ensure reminders settings exist
      if (!state.sprintCalendar.reminders) {
        state.sprintCalendar.reminders = {
          enabled: true,
          sprintStarting: { enabled: true, days: 1 },
          sprintEnding: { enabled: true, days: 2 },
          sprintOverdue: { enabled: true },
          lastChecked: null,
          dismissed: {}
        };
      }
      // Ensure all columns have order property
      ensureColumnOrder();
      // Migration: Ensure sprint_start and sprint_end columns are correctly configured
      ensureSprintColumns();
      // Migration: Add Work Item 1 (SC) and Work Item 2 (VC) columns if missing
      ensureWorkItemColumns();
      // Migration: Add timestamps to existing records
      if (typeof migrateRecordsTimestamps === 'function') {
        migrateRecordsTimestamps();
      }
      populateSelectsFromState();
      renderFormGrid();
      renderCustomColList();
      // Render column toggles after migrations complete
      if (typeof renderColumnToggles === 'function') {
        renderColumnToggles();
      }
      renderTable();
      updateKPIs();
      renderCharts();
      updateRecordCount();
      renderNotes();
      // Render tags management after data is loaded
      if (typeof renderTagsManagement === 'function') {
        renderTagsManagement();
      }
      // Render tags form field after data is loaded
      if (typeof renderTagsFormField === 'function') {
        renderTagsFormField();
      }
      // Update storage info display
      if (typeof updateStorageInfo === 'function') {
        updateStorageInfo();
      }
      // Render backup settings after data is loaded
      if (typeof renderBackupSettingsCard === 'function') {
        renderBackupSettingsCard();
      }
      // Render automated status card after data is loaded
      if (typeof renderAutomatedStatusCard === 'function') {
        renderAutomatedStatusCard();
      }
      // Render sprint calendar after data is loaded
      if (typeof renderSprintCalendarCard === 'function') {
        renderSprintCalendarCard();
      }
      // Initialize logo after data is loaded
      if (typeof initializeLogo === 'function') {
        initializeLogo();
      }
      // Load configuration settings into form fields after data is loaded
      if (typeof loadHyperlinkSettings === 'function') {
        loadHyperlinkSettings();
      }
      if (typeof loadBrandingLabels === 'function') {
        loadBrandingLabels();
      }
      if (typeof applyBrandingLabels === 'function') {
        applyBrandingLabels();
      }
      if (typeof loadTabLabels === 'function') {
        loadTabLabels();
      }
      if (typeof applyTabLabels === 'function') {
        applyTabLabels();
      }
      if (typeof loadFontSettings === 'function') {
        loadFontSettings();
      }
      if (typeof loadDownloadFilename === 'function') {
        loadDownloadFilename();
      }
      
      // Initialize sprint reminders after data is loaded
      if (typeof initializeSprintReminders === 'function') {
        initializeSprintReminders();
      }
      
      // Restore active tab after state is loaded
      setTimeout(() => {
        const tabToRestore = state.currentTab !== undefined ? state.currentTab : 0;
        if (tabToRestore >= 0 && tabToRestore <= 6) {
          switchTab(tabToRestore);
        }
      }, 250); // Increased delay to ensure all content is rendered
    }
  } catch (e) {
  }
}

// Ensure all columns have order property
function ensureColumnOrder() {
  if (!state.columns) return;
  
  // Assign order to columns that don't have it
  state.columns.forEach((c, idx) => {
    if (c.order === undefined) {
      c.order = idx + 1;
    }
  });
  
  // Assign order to custom columns that don't have it
  if (state.customColumns) {
    state.customColumns.forEach((c, idx) => {
      if (c.order === undefined) {
        c.order = 100 + idx;
      }
    });
  }
}

// Migration function to ensure Work Item 1 (SC) and Work Item 2 (VC) columns exist
function ensureWorkItemColumns() {
  if (!state.columns) return;
  
  const hasWi1 = state.columns.some(c => c.key === 'wi1');
  const hasWi2 = state.columns.some(c => c.key === 'wi2');
  
  if (!hasWi1 || !hasWi2) {
    // Find the jstatus column to insert after it
    const jstatusIndex = state.columns.findIndex(c => c.key === 'jstatus');
    
    if (jstatusIndex !== -1) {
      const jstatusOrder = state.columns[jstatusIndex].order || 5;
      
      // Insert wi1 and wi2 after jstatus
      if (!hasWi1) {
        state.columns.splice(jstatusIndex + 1, 0, {key: 'wi1', label: 'Work Item 1 (SC)', visible: true, system: true, order: jstatusOrder + 1});
      }
      if (!hasWi2) {
        const wi1Index = state.columns.findIndex(c => c.key === 'wi1');
        const wi1Order = state.columns[wi1Index].order || jstatusOrder + 1;
        state.columns.splice(wi1Index + 1, 0, {key: 'wi2', label: 'Work Item 2 (VC)', visible: true, system: true, order: wi1Order + 1});
      }
      
      // Adjust order of subsequent columns
      for (let i = jstatusIndex + 3; i < state.columns.length; i++) {
        if (state.columns[i].order !== undefined) {
          state.columns[i].order += 2;
        }
      }
    }
    // Remove old 'wi' column if it exists
    const oldWiIndex = state.columns.findIndex(c => c.key === 'wi');
    if (oldWiIndex !== -1) {
      state.columns.splice(oldWiIndex, 1);
    }
    // Save the updated state
    saveState();
  }
}

// Migration function to ensure Sprint Start Date and Sprint End Date columns exist
// Migration function to ensure sprint_start and sprint_end columns are correctly configured
function ensureSprintColumns() {
  if (!state.columns) return;
  
  let needsSave = false;
  
  // STEP 1: Remove ALL duplicate sprint_start columns (keep only one)
  const sprintStartIndices = [];
  state.columns.forEach((c, idx) => {
    if (c.key === 'sprint_start') {
      sprintStartIndices.push(idx);
    }
  });
  
  if (sprintStartIndices.length > 1) {
    // Keep only the first one, remove others in reverse order to preserve indices
    for (let i = sprintStartIndices.length - 1; i > 0; i--) {
      state.columns.splice(sprintStartIndices[i], 1);
    }
    needsSave = true;
  }
  
  // STEP 2: Check if sprint_start column exists
  const sprintStartCol = state.columns.find(c => c.key === 'sprint_start');
  
  if (!sprintStartCol) {
    // sprint_start column is missing - add it
    const piIndex = state.columns.findIndex(c => c.key === 'pi');
    if (piIndex !== -1) {
      const piOrder = state.columns[piIndex].order || 1;
      state.columns.splice(piIndex + 1, 0, {
        key: 'sprint_start',
        label: 'Sprint Start',
        visible: true,
        system: true,
        order: piOrder + 1
      });
      needsSave = true;
      
      // Adjust order of subsequent columns
      for (let i = piIndex + 2; i < state.columns.length; i++) {
        if (state.columns[i].order !== undefined) {
          state.columns[i].order += 1;
        }
      }
    }
  } else {
    // sprint_start exists - ensure it has correct label and is visible
    if (sprintStartCol.label !== 'Sprint Start') {
      sprintStartCol.label = 'Sprint Start';
      needsSave = true;
    }
    if (sprintStartCol.visible !== true) {
      sprintStartCol.visible = true;
      needsSave = true;
    }
  }
  
  // STEP 3: Check if sprint_end column exists - ADD IT if missing (hidden by default, can be toggled in Column Visibility)
  const sprintEndCol = state.columns.find(c => c.key === 'sprint_end');
  
  if (!sprintEndCol) {
    // sprint_end column is missing - add it after sprint_start (hidden by default)
    const sprintStartIndex = state.columns.findIndex(c => c.key === 'sprint_start');
    if (sprintStartIndex !== -1) {
      const sprintStartOrder = state.columns[sprintStartIndex].order || 2;
      state.columns.splice(sprintStartIndex + 1, 0, {
        key: 'sprint_end',
        label: 'Sprint End',
        visible: false,
        system: true,
        order: sprintStartOrder + 1
      });
      needsSave = true;
      
      // Adjust order of subsequent columns
      for (let i = sprintStartIndex + 2; i < state.columns.length; i++) {
        if (state.columns[i].order !== undefined) {
          state.columns[i].order += 1;
        }
      }
    }
  } else {
    // sprint_end exists - ensure it has correct label and is HIDDEN (since Sprint column shows combined value)
    let endColChanged = false;
    if (sprintEndCol.label !== 'Sprint End') {
      sprintEndCol.label = 'Sprint End';
      endColChanged = true;
    }
    if (sprintEndCol.visible !== false) {
      sprintEndCol.visible = false;
      endColChanged = true;
    }
    if (endColChanged) needsSave = true;
  }
  
  // STEP 4: Remove old legacy "sprint" column (should be "sprint_start" instead)
  const oldSprintColIndex = state.columns.findIndex(c => c.key === 'sprint');
  if (oldSprintColIndex !== -1) {
    state.columns.splice(oldSprintColIndex, 1);
    needsSave = true;
  }
  
  if (needsSave) {
    saveState();
  }
}

// Ensure all tags used by notes and records exist in state.tags
function ensureAllTagsExist() {
  if (!state.tags) state.tags = [];
  
  const existingTagNames = state.tags.map(t => typeof t === 'string' ? t : t.name);
  const allUsedTags = new Set();
  
  // Collect tags from records
  if (state.recordTags) {
    Object.values(state.recordTags).forEach(tags => {
      if (Array.isArray(tags)) {
        tags.forEach(tag => allUsedTags.add(tag));
      }
    });
  }
  
  // Collect tags from notes
  if (state.notes && Array.isArray(state.notes)) {
    state.notes.forEach(note => {
      if (note.noteTags && Array.isArray(note.noteTags)) {
        note.noteTags.forEach(tag => allUsedTags.add(tag));
      }
    });
  }
  
  // Add any missing tags to state.tags with default color
  allUsedTags.forEach(tagName => {
    if (!existingTagNames.includes(tagName)) {
      state.tags.push({
        name: tagName,
        color: '#94a3b8' // default gray color
      });
    }
  });
}