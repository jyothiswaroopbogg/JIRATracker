// Application State Management
let state = {
  records: [],
  notes: [],
  recordLinks: {},
  notesRecordLinks: {},
  notesTimestamps: {},
  noteEditIndex: -1,
  noteCurrentPage: 1,
  notePerPage: 10,
  noteSearchQuery: '',
  noteActiveTag: '',
  editingNoteId: null,
  notesSearch: '',
  notesCurrentPage: 1,
  notesPerPage: 10,
  editIndex: -1,
  currentPage: 1,
  perPage: 10,
  searchQuery: '',
  currentTab: 0,
  tabScrollPositions: {}, // Save scroll position for each tab
  filterCriteria: {pi: '', sprint: '', jstatus: '', dstatus: '', dorg: ''},
  selectedRecords: [],
  sortBy: null,
  sortOrder: 'asc',
  charts: {},
  tags: [
    { name: 'Bug', color: '#f87171' },
    { name: 'Enhancement', color: '#60a5fa' },
    { name: 'Task', color: '#fbbf24' },
    { name: 'Story', color: '#34d399' }
  ],
  recordTags: {},
  jiraStatuses: ['Open', 'Ready', 'Refining', 'In Progress', 'Ready for QA Move', 'QA Test Ready', 'QA Testing', 'Ready for UAT Move', 'UAT Testing', 'PO Review', 'Ready for Release', 'Cancelled', 'Completed'],
  devopsStatuses: ['Created', 'Pull Request', 'Deployed'],
  devopsOrgs: ['INT', 'QA', 'UAT', 'PROD'],
  columns: [
    {key: 'pi', label: 'PI', visible: true, system: true, order: 1},
    {key: 'sprint_start', label: 'Sprint Start', visible: true, system: true, order: 2},
    {key: 'sprint_end', label: 'Sprint End', visible: false, system: true, order: 3},
    {key: 'jira', label: 'Jira Story', visible: true, system: true, order: 4},
    {key: 'desc', label: 'Description', visible: true, system: true, order: 5},
    {key: 'jstatus', label: 'Jira Status', visible: true, system: true, order: 6},
    {key: 'wi1', label: 'Work Item 1 (SC)', visible: true, system: true, order: 7},
    {key: 'wi2', label: 'Work Item 2 (VC)', visible: true, system: true, order: 8},
    {key: 'dstatus', label: 'DevOps Status', visible: true, system: true, order: 9},
    {key: 'dorg', label: 'DevOps ORG', visible: true, system: true, order: 10},
    {key: 'comments', label: 'Comments', visible: true, system: true, order: 11},
    {key: 'tags', label: 'Tags', visible: true, system: true, order: 12},
    {key: 'timestamps', label: 'Timestamps', visible: true, system: true, order: 13},
  ],
  customColumns: [],
  colors: {},
  fontSettings: {
    logoIcon: 'ST',
    fontFamily: 'DM Sans',
    baseFontSize: 13
  },
  downloadFilename: 'sprint-tracker',
  timestampFormat: 'datetime',
  jiraUrlTemplate: 'https://sentara.atlassian.net/browser/{formatted}',
  jiraDisplayFormat: 'TBCRM3-{number}',
  wiUrlTemplate: 'https://github.com/sentara-health/Salesforce-SentaraHealth-Vlocity/tree/{formatted}',
  wiDisplayFormat: 'WI-{number6}',
  selectedExportColumns: {
    record: [],
    notes: ['title', 'content', 'createdOn', 'noteTags']
  },
  // Branding & Labels
  labels: {
    pageTitle: 'Sprint Tracker Pro — TBCRM3',
    logoText: 'Sprint',
    logoTextHighlight: 'Track',
    logoTextEnd: 'Pro',
    headerMeta: 'TBCRM3 · Salesforce Vlocity Project',
    appName: 'Sprint Track Pro',
    // Tab Labels
    tabDashboard: '📊 Dashboard',
    tabDataEntry: '📋 Data Entry',
    tabSummary: '📈 Detailed Summary',
    tabNotes: '📝 Notes',
    tabSprintCalendar: '📅 Sprint Calendar',
    tabJira: '🔗 JIRA',
    tabConfig: '⚙️ Configuration'
  },
  // Matrix Background Settings
  useMatrixBackground: true,
  matrixFontSize: 12,
  matrixChars: 'ﾊﾐﾋｰｳﾆﾜﾄﾁﾙﾒﾓﾔﾔﾗﾘﾜﾇﾌﾆﾌﾞﾔﾂﾘﾌﾆﾄﾁﾙﾒﾓﾔ',
  backgroundImage: null,
  websiteLogo: null,
  // Scheduled Backup Settings
  backupSettings: {
    enabled: false,
    scheduleType: 'daily',
    scheduleTime: '02:00',
    scheduleDay: 'Monday',
    scheduleDate: '1',
    autoDelete: false,
    retentionDays: 30,
    lastBackup: null,
    nextBackup: null
  },
  backupHistory: [],
  backupLog: [],
  // Automated Status Updates
  automatedStatus: {
    enabled: false,
    rules: [],
    lastExecution: null,
    executionLog: []
  },
  // Sprint Calendar
  sprintCalendar: {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    sprintDates: {},
    sprintColors: {}
  },
  // Timestamps
  lastSaved: null
};
