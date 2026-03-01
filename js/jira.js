// JIRA Integration JavaScript

// JIRA State
let jiraState = {
  config: {
    jira_url: '',
    jira_email: '',
    jira_project_key: '',
    is_configured: false
  },
  stories: [],
  cachedStories: [],
  filteredStories: [], // Store currently filtered stories
  fieldMappings: [],
  currentPage: 1,
  issuesPerPage: 10,
  totalStories: 0,
  lastSyncTime: null,
  selectedStoryKeys: [],
  csrfToken: null,
  selectedPersons: [], // Person filter
  addedStories: new Set(), // Track added stories
  isConnected: false, // Track connection state
  sessionToken: null, // Session token for connection tracking
  sessionId: null, // Session ID
  sortColumn: null, // Current sort column
  sortDirection: null, // 'asc', 'desc', or null (normal)
  originalOrder: [], // Original unsorted order
  autoSync: {
    enabled: false,
    mode: 'interval', // 'interval' or 'scheduled'
    interval: 3600, // Default: 1 hour in seconds (for interval mode)
    scheduleType: 'daily', // 'daily', 'weekly', 'monthly', 'yearly' (for scheduled mode)
    scheduleTime: '09:00', // Time of day (HH:MM)
    scheduleDayOfWeek: 1, // Monday (0-6, for weekly)
    scheduleDayOfMonth: 1, // 1st day (1-31, for monthly)
    scheduleMonth: 0, // January (0-11, for yearly)
    scheduleYearlyDay: 1, // 1st day (1-31, for yearly)
    lastRun: null,
    nextRun: null
  }
};

// Get CSRF Token (always fresh)
async function getCSRFToken(forceRefresh = false) {
  if (jiraState.csrfToken && !forceRefresh) {
    return jiraState.csrfToken;
  }
  
  try {
    const response = await fetch('JIRA/csrf-token.api.php');
    const result = await response.json();
    
    if (result.success) {
      jiraState.csrfToken = result.data.token;
      return jiraState.csrfToken;
    }
  } catch (error) {
  }
  
  return null;
}

// Helper function for making secure API calls
async function jiraFetch(url, options = {}) {
  // Add CSRF token for non-GET requests (always get fresh token)
  if (options.method && options.method !== 'GET') {
    const csrfToken = await getCSRFToken(true); // Force refresh each time
    if (csrfToken) {
      options.headers = options.headers || {};
      options.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  try {
    const response = await fetch(url, options);
    
    // If CSRF token is invalid, refresh and retry once
    if (response.status === 403) {
      try {
        const result = await response.json();
        if (result.error && (result.error.includes('security token') || result.error.includes('CSRF'))) {
          jiraState.csrfToken = null;
          const newToken = await getCSRFToken(true);
          if (newToken && options.headers) {
            options.headers['X-CSRF-Token'] = newToken;
            return await fetch(url, options);
          }
        }
      } catch (e) {
        // If response isn't JSON, just return the original response
        return response;
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
}

// Initialize JIRA tab
async function initJiraTab() {
  // Get CSRF token first
  await getCSRFToken();
  
  // Wait for config to load before proceeding
  await loadJiraConfig();
  await loadFieldMappings();
  await loadCachedIssues();  // Load cached stories from database
  await loadAutoSyncSettings();
  renderJiraStats();
  renderPersonTags();
}

// Toggle API token visibility
function toggleApiTokenVisibility() {
  const input = document.getElementById('jiraApiToken');
  const icon = document.getElementById('jiraTokenToggleIcon');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = '🙈'; // Hide icon
  } else {
    input.type = 'password';
    icon.textContent = '👁️'; // Show icon
  }
}

// Load JIRA configuration
async function loadJiraConfig() {
  try {
    const response = await jiraFetch('JIRA/config.api.php');
    const result = await response.json();
    
    if (result.success) {
      jiraState.config = result.data;
      
      // Populate form fields
      const urlField = document.getElementById('jiraUrl');
      if (urlField) urlField.value = jiraState.config.jira_url || '';
      
      const emailField = document.getElementById('jiraEmail');
      if (emailField) emailField.value = jiraState.config.jira_email || '';
      
      const projectKeyField = document.getElementById('jiraProjectKey');
      if (projectKeyField) projectKeyField.value = jiraState.config.jira_project_key || '';
      
      // Update connection status and auto-verify connection
      if (jiraState.config.is_configured) {
        // Check if there's an active session first
        const hasActiveSession = await validateJiraSession();
        
        if (hasActiveSession) {
          // Session is valid, verify JIRA connection
          showConnectionStatus('Verifying connection...', 'info');
          
          try {
            const testResponse = await jiraFetch('JIRA/test-connection.api.php', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ use_saved: true })
            });
            
            const testResult = await testResponse.json();
            
            if (testResult.success) {
              const userData = testResult.data || {};
              const userName = userData.user || userData.email || 'User';
              showConnectionStatus(`✅ Connected as ${userName}`, 'success');
              updateConnectionButton(true, userName);
            } else {
              // Connection test failed - end the session
              await endJiraSession();
              showConnectionStatus('⚠️ Connection issue: ' + (testResult.error || 'Please connect'), 'error');
              updateConnectionButton(false);
            }
          } catch (error) {
            // If test fails, end session and show configured status
            await endJiraSession();
            showConnectionStatus('Configured (click Connect to verify)', 'info');
            updateConnectionButton(false);
          }
        } else {
          // No active session
          showConnectionStatus('Configured (click Connect to verify)', 'info');
          updateConnectionButton(false);
        }
      } else {
        showConnectionStatus('Not configured', 'info');
        updateConnectionButton(false);
      }
    }
  } catch (error) {
    toast('Failed to load JIRA configuration', 'error');
  }
}

// Save JIRA configuration
async function saveJiraConfig() {
  const jiraUrl = document.getElementById('jiraUrl').value.trim();
  const jiraEmail = document.getElementById('jiraEmail').value.trim();
  const jiraApiToken = document.getElementById('jiraApiToken').value.trim();
  const jiraProjectKey = document.getElementById('jiraProjectKey').value.trim();
  
  if (!jiraUrl || !jiraEmail || !jiraApiToken) {
    toast('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    const response = await jiraFetch('JIRA/config.api.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        jira_url: jiraUrl,
        jira_email: jiraEmail,
        jira_api_token: jiraApiToken,
        jira_project_key: jiraProjectKey
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      toast('JIRA configuration saved successfully', 'success');
      loadJiraConfig();
      // Clear the API token field for security
      document.getElementById('jiraApiToken').value = '';
    } else {
      toast('Failed to save configuration: ' + result.error, 'error');
    }
  } catch (error) {
    toast('Failed to save JIRA configuration', 'error');
  }
}

// Clear JIRA configuration
function clearJiraConfig() {
  document.getElementById('jiraUrl').value = '';
  document.getElementById('jiraEmail').value = '';
  document.getElementById('jiraApiToken').value = '';
  document.getElementById('jiraProjectKey').value = '';
  showConnectionStatus('', 'none');
  updateConnectionButton(false);
}

// Update connection button state
function updateConnectionButton(connected, userName = '') {
  const btn = document.getElementById('jiraTestBtn');
  if (!btn) return;
  
  jiraState.isConnected = connected;
  
  if (connected) {
    // Change to Disconnect state
    btn.innerHTML = '🔌 Disconnect';
    btn.className = 'jira-btn jira-btn-danger';
    btn.title = userName ? `Connected as ${userName}` : 'Connected to JIRA';
  } else {
    // Change to Connect state
    btn.innerHTML = '🔌 Connect';
    btn.className = 'jira-btn jira-btn-success';
    btn.title = 'Connect to JIRA';
  }
}

// Toggle JIRA connection (Connect/Disconnect)
async function toggleJiraConnection() {
  // If already connected, disconnect
  if (jiraState.isConnected) {
    await disconnectJira();
    return;
  }
  
  // Otherwise, connect
  const jiraUrl = document.getElementById('jiraUrl').value.trim();
  const jiraEmail = document.getElementById('jiraEmail').value.trim();
  const jiraApiToken = document.getElementById('jiraApiToken').value.trim();
  
  // Check if config is already saved
  const isConfigSaved = jiraState.config && jiraState.config.is_configured;
  
  showConnectionStatus('Connecting...', 'info');
  document.getElementById('jiraTestBtn').disabled = true;
  
  try {
    let requestBody;
    
    // If config is saved and no new token entered, test using saved credentials
    if (isConfigSaved && !jiraApiToken) {
      requestBody = { use_saved: true };
    } else {
      // Test with provided credentials (without saving)
      if (!jiraUrl || !jiraEmail || !jiraApiToken) {
        toast('Please fill in all required fields first', 'error');
        showConnectionStatus('', 'none');
        return;
      }
      
      requestBody = {
        use_saved: false,
        jira_url: jiraUrl,
        jira_email: jiraEmail,
        jira_api_token: jiraApiToken
      };
    }
    
    const response = await jiraFetch('JIRA/test-connection.api.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    
    if (result.success) {
      const userData = result.data || {};
      const userName = userData.user || userData.email || 'User';
      
      // Create session after successful connection
      const sessionCreated = await createJiraSession(userName);
      
      if (sessionCreated) {
        showConnectionStatus(`✅ Connected as ${userName}`, 'success');
        updateConnectionButton(true, userName);
        toast('Successfully connected to JIRA', 'success');
      } else {
        showConnectionStatus('⚠️ Connected but session creation failed', 'warning');
        updateConnectionButton(true, userName);
        toast('Connected to JIRA (session tracking unavailable)', 'warning');
      }
    } else {
      showConnectionStatus('❌ ' + result.error, 'error');
      updateConnectionButton(false);
      toast(result.error, 'error');
    }
  } catch (error) {
    showConnectionStatus('❌ Connection error', 'error');
    updateConnectionButton(false);
    toast('Failed to connect', 'error');
  } finally {
    document.getElementById('jiraTestBtn').disabled = false;
  }
}

// Disconnect from JIRA
async function disconnectJira() {
  showConnectionStatus('Disconnecting...', 'info');
  
  try {
    // End the session
    await endJiraSession();
    
    showConnectionStatus('Not connected', 'info');
    updateConnectionButton(false);
    toast('Disconnected from JIRA', 'info');
  } catch (error) {
    // Even if session ending fails, still disconnect locally
    showConnectionStatus('Not connected', 'info');
    updateConnectionButton(false);
    toast('Disconnected from JIRA', 'info');
  }
}

// Create JIRA session
async function createJiraSession(userId) {
  try {
    const response = await jiraFetch('JIRA/session.api.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        action: 'create',
        user_id: userId || 'unknown'
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      jiraState.sessionToken = result.data.token;
      jiraState.sessionId = result.data.session_id;
      
      // Store session info in localStorage for persistence
      localStorage.setItem('jira_session_token', result.data.token);
      localStorage.setItem('jira_session_id', result.data.session_id);
      
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// End JIRA session
async function endJiraSession() {
  try {
    const response = await jiraFetch('JIRA/session.api.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        action: 'end',
        token: jiraState.sessionToken || ''
      })
    });
    
    const result = await response.json();
    
    // Clear session state regardless of API response
    jiraState.sessionToken = null;
    jiraState.sessionId = null;
    jiraState.isConnected = false;
    
    // Remove from localStorage
    localStorage.removeItem('jira_session_token');
    localStorage.removeItem('jira_session_id');
    
    return result.success;
  } catch (error) {
    // Clear session state even if API call fails
    jiraState.sessionToken = null;
    jiraState.sessionId = null;
    jiraState.isConnected = false;
    
    localStorage.removeItem('jira_session_token');
    localStorage.removeItem('jira_session_id');
    
    return false;
  }
}

// Validate JIRA session
async function validateJiraSession() {
  const sessionToken = localStorage.getItem('jira_session_token');
  
  if (!sessionToken) {
    return false;
  }
  
  try {
    const response = await jiraFetch('JIRA/session.api.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        action: 'validate',
        token: sessionToken
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.data.valid) {
      jiraState.sessionToken = sessionToken;
      jiraState.sessionId = localStorage.getItem('jira_session_id');
      return true;
    }
    
    // Session is invalid, clean up
    localStorage.removeItem('jira_session_token');
    localStorage.removeItem('jira_session_id');
    return false;
  } catch (error) {
    return false;
  }
}

// Legacy function - kept for backward compatibility
async function testJiraConnection() {
  await toggleJiraConnection();
}

// Show connection status
function showConnectionStatus(message, type) {
  const statusEl = document.getElementById('jiraConnectionStatus');
  if (!statusEl) return;
  
  if (!message) {
    statusEl.style.display = 'none';
    return;
  }
  
  statusEl.textContent = message;
  statusEl.className = 'connection-status ' + type;
  statusEl.style.display = 'flex';
}

// Core sync function with JQL parameter (used by both manual and auto-sync)
async function syncJiraStories(jql) {
  const syncBtn = document.getElementById('jiraSyncBtn');
  const syncFilterBtn = document.getElementById('jiraSyncFilterBtn');
  if (syncBtn) syncBtn.disabled = true;
  if (syncFilterBtn) syncFilterBtn.disabled = true;
  
  try {
    const requestBody = {
      jql: jql
      // No maxResults - fetch ALL stories using pagination
    };
    
    const response = await jiraFetch('JIRA/sync.api.php', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      toast(`✓ Synced ${result.data.synced} of ${result.data.total} stories`, 'success');
      jiraState.lastSyncTime = new Date();
      
      // Save filter values BEFORE reloading (they will be cleared during dropdown rebuild)
      const selectedStatus = document.getElementById('jiraFilterStatus')?.value || '';
      const selectedPI = document.getElementById('jiraFilterPI')?.value || '';
      const selectedQuarter = document.getElementById('jiraFilterQuarter')?.value || '';
      const selectedSprint = document.getElementById('jiraFilterSprint')?.value || '';
      const hasFilters = !!(selectedStatus || selectedPI || selectedQuarter || selectedSprint);
      
      // Load cached stories with preserved filters
      await loadCachedIssues(hasFilters, {
        status: selectedStatus,
        pi: selectedPI,
        quarter: selectedQuarter,
        sprint: selectedSprint
      });
      
      // Apply filters if any were used during sync
      if (hasFilters) {
        filterJiraIssues();
      }
      
      renderJiraStats();
      return result;
    } else {
      toast('Sync failed: ' + result.error, 'error');
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Sync error:', error);
    toast('Failed to sync from JIRA: ' + (error.message || 'Network error'), 'error');
    throw error;
  } finally {
    if (syncBtn) syncBtn.disabled = false;
    if (syncFilterBtn) syncFilterBtn.disabled = false;
  }
}

// Sync from JIRA
async function syncFromJira() {
  if (!jiraState.config.is_configured) {
    toast('Please configure JIRA first', 'error');
    return;
  }
  
  // Build JQL query based on filter selections
  let jql = document.getElementById('jiraJqlInput').value.trim();
  
  if (!jql) {
    // Get filter values
    const statusEl = document.getElementById('jiraFilterStatus');
    const selectedStatus = statusEl ? statusEl.value : '';
    
    const piEl = document.getElementById('jiraFilterPI');
    const selectedPI = piEl ? piEl.value : '';
    
    const quarterEl = document.getElementById('jiraFilterQuarter');
    const selectedQuarter = quarterEl ? quarterEl.value : '';
    
    const sprintEl = document.getElementById('jiraFilterSprint');
    const selectedSprint = sprintEl ? sprintEl.value : '';
    
    // Start with base project filter (no quotes for simple alphanumeric project keys)
    jql = `project = ${jiraState.config.jira_project_key}`;
    
    // Add status filter if selected
    if (selectedStatus) {
      jql += ` AND status = "${selectedStatus}"`;
    }
    
    // Build sprint filter based on selections
    if (selectedSprint && selectedQuarter && selectedPI) {
      // All three selected: "26.1.Sprint3*"
      jql += ` AND Sprint ~ "${selectedPI}.${selectedQuarter}.Sprint${selectedSprint}*"`;
    } else if (selectedSprint && selectedPI) {
      // PI and Sprint only: "26.*.Sprint3*"
      jql += ` AND Sprint ~ "${selectedPI}.*.Sprint${selectedSprint}*"`;
    } else if (selectedQuarter && selectedPI) {
      // PI and Quarter only: "26.1.*"
      jql += ` AND Sprint ~ "${selectedPI}.${selectedQuarter}.*"`;
    } else if (selectedSprint) {
      // Sprint only: "*.Sprint3*"
      jql += ` AND Sprint ~ "*.Sprint${selectedSprint}*"`;
    } else if (selectedQuarter) {
      // Quarter only: "*.1.*"
      jql += ` AND Sprint ~ "*.${selectedQuarter}.*"`;
    } else if (selectedPI) {
      // PI only: "26.*"
      jql += ` AND Sprint ~ "${selectedPI}.*"`;
    }
    
    jql += ' ORDER BY updated DESC';
    
    // Show user what's being synced
    let syncMessage = 'Syncing';
    const filters = [];
    
    if (selectedStatus) filters.push(`Status: ${selectedStatus}`);
    if (selectedPI && selectedQuarter && selectedSprint) {
      filters.push(`PI ${selectedPI}.${selectedQuarter}, Sprint ${selectedSprint}`);
    } else if (selectedPI && selectedQuarter) {
      filters.push(`PI ${selectedPI}.${selectedQuarter}`);
    } else if (selectedPI && selectedSprint) {
      filters.push(`PI ${selectedPI}, Sprint ${selectedSprint}`);
    } else if (selectedPI) {
      filters.push(`PI ${selectedPI}`);
    } else if (selectedQuarter) {
      filters.push(`Quarter ${selectedQuarter}`);
    } else if (selectedSprint) {
      filters.push(`Sprint ${selectedSprint}`);
    }
    
    if (filters.length > 0) {
      syncMessage += ` ${filters.join(', ')} stories from JIRA...`;
    } else {
      syncMessage = 'Syncing all stories from JIRA...';
    }
    
    toast(syncMessage, 'info');
  } else {
    toast('Syncing from JIRA...', 'info');
  }
  
  // Call the core sync function with the JQL
  await syncJiraStories(jql);
}

// Load cached stories
async function loadCachedIssues(skipRender = false, preserveFilters = {}) {
  try {
    const response = await jiraFetch(`JIRA/issues.api.php?action=cache&project=${jiraState.config.jira_project_key || ''}&limit=10000`);
    const result = await response.json();
    
    if (result.success) {
      jiraState.cachedStories = result.data.stories || [];
      jiraState.filteredStories = result.data.stories || []; // Initialize filtered stories
      jiraState.originalOrder = [...(result.data.stories || [])]; // Save original order
      jiraState.totalStories = result.data.count || 0;
      jiraState.currentPage = 1; // Reset to page 1
      jiraState.sortColumn = null; // Reset sort
      jiraState.sortDirection = null;
      
      // Populate addedStories Set with stories that have local_record_id
      // This ensures the button state persists across page refreshes
      jiraState.addedStories.clear(); // Clear existing set
      jiraState.cachedStories.forEach(story => {
        if (story.local_record_id) {
          jiraState.addedStories.add(story.issue_key);
        }
      });
      
      // Debug: Log first story to check field values
      if (jiraState.cachedStories.length > 0) {
      }
      
      // Only render if not skipping (filter will handle rendering)
      if (!skipRender) {
        renderJiraIssues(jiraState.filteredStories);
      }
      
      renderJiraStats();
      
      // Populate dropdowns
      populateStatusFilter();
      populateSprintFilter();
      populatePIFilter();
      
      // Restore filter selections if provided
      if (preserveFilters.status) {
        const statusEl = document.getElementById('jiraFilterStatus');
        if (statusEl) statusEl.value = preserveFilters.status;
      }
      if (preserveFilters.pi) {
        const piEl = document.getElementById('jiraFilterPI');
        if (piEl) piEl.value = preserveFilters.pi;
      }
      if (preserveFilters.quarter) {
        const quarterEl = document.getElementById('jiraFilterQuarter');
        if (quarterEl) quarterEl.value = preserveFilters.quarter;
      }
      if (preserveFilters.sprint) {
        const sprintEl = document.getElementById('jiraFilterSprint');
        if (sprintEl) sprintEl.value = preserveFilters.sprint;
      }
    } else {
      toast('Failed to load cached stories: ' + result.error, 'error');
    }
  } catch (error) {
    toast('Failed to load cached stories', 'error');
  }
}

// Search JIRA stories
async function searchJiraIssues(query) {
  // Reset to page 1 when searching
  jiraState.currentPage = 1;
  jiraState.sortColumn = null; // Reset sort
  jiraState.sortDirection = null;
  
  if (!query || query.length < 2) {
    jiraState.filteredStories = jiraState.cachedStories;
    jiraState.originalOrder = [...jiraState.cachedStories];
    renderJiraIssues(jiraState.filteredStories);
    return;
  }
  
  const filtered = jiraState.cachedStories.filter(issue => 
    issue.issue_key.toLowerCase().includes(query.toLowerCase()) ||
    issue.summary.toLowerCase().includes(query.toLowerCase()) ||
    (issue.description && issue.description.toLowerCase().includes(query.toLowerCase()))
  );
  
  jiraState.filteredStories = filtered;
  jiraState.originalOrder = [...filtered]; // Save original order
  renderJiraIssues(filtered);
}

// Filter JIRA stories by status and sprint
function filterJiraIssues() {
  const statusEl = document.getElementById('jiraFilterStatus');
  const status = statusEl ? statusEl.value : '';
  
  const piEl = document.getElementById('jiraFilterPI');
  const pi = piEl ? piEl.value : '';
  
  const quarterEl = document.getElementById('jiraFilterQuarter');
  const quarter = quarterEl ? quarterEl.value : '';
  
  const sprintEl = document.getElementById('jiraFilterSprint');
  const sprint = sprintEl ? sprintEl.value : '';
  
  // Reset to page 1 when filtering
  jiraState.currentPage = 1;
  
  // If no filters, show all
  if (!status && !pi && !quarter && !sprint) {
    jiraState.filteredStories = jiraState.cachedStories;
    renderJiraIssues(jiraState.filteredStories);
    return;
  }
  
  let filtered = jiraState.cachedStories;
  
  // Apply status filter
  if (status) {
    filtered = filtered.filter(issue => issue.status === status);
  }
  
  // Apply PI filter
  if (pi) {
    filtered = filtered.filter(issue => {
      const piNum = parsePINumber(issue.sprint);
      return piNum === pi;
    });
  }
  
  // Apply Quarter filter
  if (quarter) {
    filtered = filtered.filter(issue => {
      const quarterNum = parseQuarterNumber(issue.sprint);
      return quarterNum === quarter;
    });
  }
  
  // Apply sprint filter (sprint is now a number, match against parsed sprint number)
  if (sprint) {
    filtered = filtered.filter(issue => {
      const issueSprintNum = parseSprintNumber(issue.sprint);
      return issueSprintNum === sprint;
    });
  }
  
  jiraState.filteredStories = filtered;
  jiraState.originalOrder = [...filtered]; // Save original order
  jiraState.sortColumn = null; // Reset sort when filtering
  jiraState.sortDirection = null;
  renderJiraIssues(filtered);
}

// Populate status filter dropdown with unique statuses from cached stories
function populateStatusFilter() {
  const statusSelect = document.getElementById('jiraFilterStatus');
  if (!statusSelect) return;
  
  // Get current selection to preserve it
  const currentValue = statusSelect.value;
  
  // Clear existing options except "All Statuses"
  statusSelect.innerHTML = '<option value="">All Statuses</option>';
  
  // Extract unique statuses from cached stories
  const uniqueStatuses = new Set();
  jiraState.cachedStories.forEach(story => {
    if (story.status) {
      uniqueStatuses.add(story.status);
    }
  });
  
  // Sort statuses alphabetically
  const sortedStatuses = Array.from(uniqueStatuses).sort();
  
  // Add status options
  sortedStatuses.forEach(status => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    statusSelect.appendChild(option);
  });
  
  // Restore previous selection if it still exists
  if (currentValue && sortedStatuses.includes(currentValue)) {
    statusSelect.value = currentValue;
  }
}

// Populate sprint filter dropdown with sprint numbers 1-9
function populateSprintFilter() {
  const sprintSelect = document.getElementById('jiraFilterSprint');
  if (!sprintSelect) return;
  
  // Clear existing options except "All Sprints"
  sprintSelect.innerHTML = '<option value="">All Sprints</option>';
  
  // Add sprint options 1-9
  for (let i = 1; i <= 9; i++) {
    const option = document.createElement('option');
    option.value = i.toString(); // Use sprint number as value
    option.textContent = i.toString(); // Display the number
    sprintSelect.appendChild(option);
  }
}

// Handle PI filter change - just refilter (sprint dropdown is static 1-9)
function onPIFilterChange() {
  // Apply filters
  filterJiraIssues();
}

// Populate PI filter dropdown with unique PI values
function populatePIFilter() {
  const piSelect = document.getElementById('jiraFilterPI');
  if (!piSelect) return;
  
  // Get unique PI numbers (excluding null/empty)
  const piMap = new Map();
  jiraState.cachedStories.forEach(issue => {
    if (issue.sprint && issue.sprint.trim() !== '') {
      const piNum = parsePINumber(issue.sprint);
      if (piNum !== '—' && !piMap.has(piNum)) {
        piMap.set(piNum, true);
      }
    }
  });
  
  // Sort PI numbers numerically
  const sortedPIs = Array.from(piMap.keys())
    .sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
  
  // Clear existing options except "All PIs"
  piSelect.innerHTML = '<option value="">All PIs</option>';
  
  // Add PI options
  sortedPIs.forEach(piNum => {
    const option = document.createElement('option');
    option.value = piNum;
    option.textContent = piNum;
    piSelect.appendChild(option);
  });
}

// Execute JQL query
async function executeJqlQuery() {
  if (!jiraState.config.is_configured) {
    toast('Please configure JIRA first', 'error');
    return;
  }
  
  const jql = document.getElementById('jiraJqlInput').value.trim();
  
  if (!jql) {
    toast('Please enter a JQL query', 'error');
    return;
  }
  
  toast('Executing JQL query...', 'info');
  
  try {
    const response = await jiraFetch(`JIRA/issues.api.php?action=fetch&jql=${encodeURIComponent(jql)}&maxResults=500`);
    const result = await response.json();
    
    if (result.success) {
      const issues = result.data.issues || [];
      toast(`Found ${issues.length} stories`, 'success');
      
      // Cache these stories
      for (const issue of issues) {
        await cacheIssue(issue);
      }
      
      loadCachedIssues();
    } else {
      toast('Query failed: ' + result.error, 'error');
    }
  } catch (error) {
    toast('Failed to execute JQL query', 'error');
  }
}

// Cache a single story
async function cacheIssue(issue) {
  // This is handled by the backend when syncing
  return true;
}

// Refresh JIRA stories
function refreshJiraIssues() {
  loadCachedIssues();
}

// Parse PI number from sprint string (e.g., "26.1.Sprint3-CRM3" -> "26")
function parsePINumber(sprintString) {
  if (!sprintString || sprintString === '0') return '—';
  const match = sprintString.match(/^(\d+)/);
  return match ? match[1] : '—';
}

// Parse Quarter number from sprint string (e.g., "26.1.Sprint3-CRM3" -> "1")
function parseQuarterNumber(sprintString) {
  if (!sprintString || sprintString === '0') return '—';
  
  // If it's already just a plain number (e.g., "1" from dropdown), return it
  if (/^\d+$/.test(sprintString)) {
    return sprintString;
  }
  
  // Try to match "XX.Y" format to extract quarter (e.g., "26.1" -> "1")
  const match = sprintString.match(/^\d+\.(\d+)/);
  return match ? match[1] : '—';
}

// Parse Sprint number from sprint string (e.g., "26.1.Sprint3-CRM3" -> "3")
function parseSprintNumber(sprintString) {
  if (!sprintString || sprintString === '0') return '—';
  
  // If it's already just a plain number (e.g., "4" from dropdown), return it
  if (/^\d+$/.test(sprintString)) {
    return sprintString;
  }
  
  // Try to match "SprintX" format first
  const sprintMatch = sprintString.match(/Sprint(\d+)/);
  if (sprintMatch) {
    return sprintMatch[1];
  }
  
  // Try to match "XX.Y" format (e.g., "26.1" -> "1")
  const dotMatch = sprintString.match(/^\d+\.(\d+)/);
  if (dotMatch) {
    return dotMatch[1];
  }
  
  // If still no match, return dash
  return '—';
}

// Sort JIRA stories by column
function sortJiraStories(column) {
  // Cycle through: null -> 'asc' -> 'desc' -> null
  if (jiraState.sortColumn === column) {
    if (jiraState.sortDirection === 'asc') {
      jiraState.sortDirection = 'desc';
    } else if (jiraState.sortDirection === 'desc') {
      jiraState.sortDirection = null;
      jiraState.sortColumn = null;
    }
  } else {
    jiraState.sortColumn = column;
    jiraState.sortDirection = 'asc';
  }
  
  // If sort is cleared, restore original order
  if (jiraState.sortDirection === null) {
    jiraState.filteredStories = [...jiraState.originalOrder];
    renderJiraIssues(jiraState.filteredStories);
    return;
  }
  
  // Sort the filtered stories
  const sorted = [...jiraState.filteredStories].sort((a, b) => {
    let aVal, bVal;
    
    switch(column) {
      case 'pi':
        aVal = parseInt(parsePINumber(a.sprint)) || 0;
        bVal = parseInt(parsePINumber(b.sprint)) || 0;
        break;
      case 'quarter':
        aVal = parseInt(parseQuarterNumber(a.sprint)) || 0;
        bVal = parseInt(parseQuarterNumber(b.sprint)) || 0;
        break;
      case 'sprint':
        aVal = parseInt(parseSprintNumber(a.sprint)) || 0;
        bVal = parseInt(parseSprintNumber(b.sprint)) || 0;
        break;
      case 'key':
        aVal = a.issue_key || '';
        bVal = b.issue_key || '';
        return jiraState.sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      case 'summary':
        aVal = (a.summary || '').toLowerCase();
        bVal = (b.summary || '').toLowerCase();
        return jiraState.sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      case 'status':
        aVal = (a.status || '').toLowerCase();
        bVal = (b.status || '').toLowerCase();
        return jiraState.sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      case 'assignee':
        aVal = (a.assignee || '').toLowerCase();
        bVal = (b.assignee || '').toLowerCase();
        return jiraState.sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      case 'points':
        aVal = parseFloat(a.story_points) || 0;
        bVal = parseFloat(b.story_points) || 0;
        break;
      case 'type':
        aVal = (a.issue_type || '').toLowerCase();
        bVal = (b.issue_type || '').toLowerCase();
        return jiraState.sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      default:
        return 0;
    }
    
    // For numeric comparisons
    if (jiraState.sortDirection === 'asc') {
      return aVal - bVal;
    } else {
      return bVal - aVal;
    }
  });
  
  jiraState.filteredStories = sorted;
  renderJiraIssues(sorted);
}

// Get sort indicator for table header
function getSortIndicator(column) {
  if (jiraState.sortColumn !== column) {
    return '';
  }
  return jiraState.sortDirection === 'asc' ? ' ▲' : ' ▼';
}

// Render JIRA stories
function renderJiraIssues(issues = null) {
  let issuesToRender = issues || jiraState.filteredStories;
  
  // Apply person filter if any persons are selected
  if (jiraState.selectedPersons.length > 0) {
    issuesToRender = issuesToRender.filter(issue => {
      if (!issue.assignee) return false;
      return jiraState.selectedPersons.some(person => 
        issue.assignee.toLowerCase().includes(person.toLowerCase())
      );
    });
  }
  
  const issuesList = document.getElementById('jiraIssuesList');
  const issuesCount = document.getElementById('jiraIssuesCount');
  
  if (!issuesList) return; // Exit if container doesn't exist
  
  if (issuesCount) {
    issuesCount.textContent = `${issuesToRender.length} ${issuesToRender.length !== 1 ? 'stories' : 'story'}`;
  }
  
  if (issuesToRender.length === 0) {
    issuesList.innerHTML = `
      <div class="jira-empty-state">
        <div class="jira-empty-icon">📋</div>
        <div class="jira-empty-text">No stories found</div>
        <div class="jira-empty-subtext">
          ${jiraState.selectedPersons.length > 0 
            ? 'Try adjusting your person filter' 
            : 'Click "Sync from JIRA" to load stories'}
        </div>
      </div>
    `;
    return;
  }
  
  // Build table HTML
  let html = `
    <table class="jira-table">
      <thead>
        <tr>
          <th>Actions</th>  
          <th onclick="sortJiraStories('pi')" style="cursor:pointer;user-select:none;">PI${getSortIndicator('pi')}</th>
          <th onclick="sortJiraStories('quarter')" style="cursor:pointer;user-select:none;">Quarter${getSortIndicator('quarter')}</th>
          <th onclick="sortJiraStories('sprint')" style="cursor:pointer;user-select:none;">Sprint${getSortIndicator('sprint')}</th>
          <th onclick="sortJiraStories('key')" style="cursor:pointer;user-select:none;">Story Key${getSortIndicator('key')}</th>
          <th onclick="sortJiraStories('summary')" style="cursor:pointer;user-select:none;">Summary${getSortIndicator('summary')}</th>
          <th onclick="sortJiraStories('status')" style="cursor:pointer;user-select:none;">Status${getSortIndicator('status')}</th>
          <th onclick="sortJiraStories('assignee')" style="cursor:pointer;user-select:none;">Assignee${getSortIndicator('assignee')}</th>
          <th onclick="sortJiraStories('points')" style="cursor:pointer;user-select:none;">Points${getSortIndicator('points')}</th>
          <th onclick="sortJiraStories('type')" style="cursor:pointer;user-select:none;">Type${getSortIndicator('type')}</th>
        </tr>
      </thead>
      <tbody>
  `;
  
  const startIdx = (jiraState.currentPage - 1) * jiraState.issuesPerPage;
  const endIdx = Math.min(startIdx + jiraState.issuesPerPage, issuesToRender.length);
  
  for (let i = startIdx; i < endIdx; i++) {
    const issue = issuesToRender[i];
    const statusClass = getStatusClass(issue.status);
    const isAdded = jiraState.addedStories.has(issue.issue_key);
    
    html += `
      <tr class="jira-table-row">
        <td class="jira-story-actions">
          <div class="jira-action-buttons-cell">
            <button class="jira-btn-table-add ${isAdded ? 'added' : ''}" 
                    onclick="addIssueToRecords('${issue.issue_key}')"
                    ${isAdded ? 'disabled' : ''}
                    title="${isAdded ? 'Already Added' : 'Add to Records'}">
              ${isAdded ? '✓' : '➕'}
            </button>
            <button class="jira-btn-table-view" 
                    onclick="viewIssueDetails('${issue.issue_key}')"
                    title="View Story Details">
              👁️
            </button>
          </div>
        </td>
        <td class="jira-story-pi">${parsePINumber(issue.sprint)}</td>
        <td class="jira-story-quarter">${parseQuarterNumber(issue.sprint)}</td>
        <td class="jira-story-sprint">${parseSprintNumber(issue.sprint)}</td>
        <td class="jira-story-key">${escapeHtml(issue.issue_key)}</td>
        <td class="jira-story-summary" title="${escapeHtml(issue.summary)}">
          ${escapeHtml(issue.summary)}
        </td>
        <td class="jira-story-status">
          <span class="jira-status-badge status-${statusClass}">${escapeHtml(issue.status || 'Unknown')}</span>
        </td>
        <td class="jira-story-assignee">${issue.assignee ? escapeHtml(issue.assignee) : '—'}</td>        
        <td class="jira-story-points">${issue.story_points ? issue.story_points : '—'}</td>
                <td class="jira-story-type">
          <span class="jira-type-badge">${escapeHtml(issue.issue_type || 'Story')}</span>
        </td>
      </tr>
    `;
  }
  
  html += `
      </tbody>
    </table>
  `;
  
  issuesList.innerHTML = html;
  
  // Update pagination
  updateJiraPagination(issuesToRender.length);
}

// Toggle story selection
function toggleIssueSelection(issueKey) {
  const idx = jiraState.selectedIssueKeys.indexOf(issueKey);
  if (idx > -1) {
    jiraState.selectedIssueKeys.splice(idx, 1);
  } else {
    jiraState.selectedIssueKeys.push(issueKey);
  }
  renderJiraIssues(jiraState.filteredStories);
}

// Get status class
function getStatusClass(status) {
  if (!status) return 'todo';
  
  const statusLower = status.toLowerCase();
  if (statusLower.includes('done') || statusLower.includes('complete') || statusLower.includes('closed')) {
    return 'done';
  }
  if (statusLower.includes('progress') || statusLower.includes('development') || statusLower.includes('review')) {
    return 'inprogress';
  }
  return 'todo';
}

// Update pagination
function updateJiraPagination(totalIssues) {
  const totalPages = Math.ceil(totalIssues / jiraState.issuesPerPage);
  
  const pageInfoEl = document.getElementById('jiraPageInfo');
  if (pageInfoEl) {
    pageInfoEl.textContent = `Page ${jiraState.currentPage} of ${totalPages || 1}`;
  }
  
  const prevBtn = document.getElementById('jiraPrevBtn');
  if (prevBtn) {
    prevBtn.disabled = jiraState.currentPage <= 1;
  }
  
  const nextBtn = document.getElementById('jiraNextBtn');
  if (nextBtn) {
    nextBtn.disabled = jiraState.currentPage >= totalPages;
  }
}

// Navigate pages
function jiraPrevPage() {
  if (jiraState.currentPage > 1) {
    jiraState.currentPage--;
    // Use current filtered stories (which defaults to all stories if no filter)
    renderJiraIssues(jiraState.filteredStories);
  }
}

function jiraNextPage() {
  const totalPages = Math.ceil(jiraState.filteredStories.length / jiraState.issuesPerPage);
  if (jiraState.currentPage < totalPages) {
    jiraState.currentPage++;
    renderJiraIssues(jiraState.filteredStories);
  }
}

// View story details
async function viewIssueDetails(issueKey) {
  const issue = jiraState.cachedStories.find(i => i.issue_key === issueKey);
  if (!issue) {
    toast('Story not found', 'error');
    return;
  }
  
  // Store the issue key for the "Open in JIRA" button
  window.currentViewingIssueKey = issueKey;
  
  // Show loading state
  document.getElementById('jiraStoryDetailsContent').innerHTML = '<div style="padding: 40px; text-align: center;"><div class="spinner"></div><p>Loading full story details...</p></div>';
  document.getElementById('jiraStoryDetailsModal').classList.add('show');
  
  try {
    // Fetch full issue details including custom fields
    const response = await fetch(`JIRA/issues.api.php?action=getSingle&issueKey=${encodeURIComponent(issueKey)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch issue details');
    }
    
    // Build the details HTML with full data
    const html = buildStoryDetailsHTML(data.data);
    
    // Populate the modal
    document.getElementById('jiraStoryDetailsContent').innerHTML = html;
  } catch (error) {
    console.error('Error fetching issue details:', error);
    // Fallback to basic issue data if fetch fails
    const html = buildStoryDetailsHTML(issue);
    document.getElementById('jiraStoryDetailsContent').innerHTML = html;
    toast('Could not load full details, showing cached data', 'warning');
  }
}

// Build story details HTML
function buildStoryDetailsHTML(issue) {
  const statusClass = getStatusClass(issue.status);
  
  // Parse sprint components
  const pi = parsePINumber(issue.sprint);
  const quarter = parseQuarterNumber(issue.sprint);
  const sprint = parseSprintNumber(issue.sprint);
  
  // Format dates
  const createdDate = issue.created_date ? new Date(issue.created_date).toLocaleString() : '—';
  const updatedDate = issue.updated_date ? new Date(issue.updated_date).toLocaleString() : '—';
  
  // Parse labels if they exist
  let labels = [];
  if (issue.labels) {
    try {
      labels = typeof issue.labels === 'string' ? JSON.parse(issue.labels) : issue.labels;
    } catch (e) {
      labels = [];
    }
  }
  
  // Parse custom fields if they exist
  let customFields = {};
  let acceptanceCriteria = '';
  let acceptanceCriteriaHTML = '';
  let hasACMedia = false;
  let allComments = '';
  let allCommentsHTML = '';
  let hasCommentsMedia = false;
  let priorityValue = '';
  let priorityColor = '';
  let projectKeyValue = '';
  let descriptionFromADF = '';
  let descriptionHTML = '';
  let hasDescMedia = false;
  
  // Get JIRA base URL for image loading
  const jiraBaseUrl = jiraState.config.jira_url ? jiraState.config.jira_url.replace(/\/$/, '') : '';
  
  // Extract attachments early for image mapping
  let attachments = [];
  
  if (issue.custom_fields) {
    try {
      customFields = typeof issue.custom_fields === 'string' ? JSON.parse(issue.custom_fields) : issue.custom_fields;
      
      // Extract attachments from customFields for image mapping
      if (customFields.attachment && Array.isArray(customFields.attachment)) {
        attachments = customFields.attachment;
        console.log('Found attachments for issue - count:', attachments.length);
        console.log('Full attachment data:', JSON.stringify(attachments, null, 2));
        if (attachments.length > 0) {
          console.log('First attachment keys:', Object.keys(attachments[0]));
          console.log('Sample attachment:', attachments[0]);
        }
      }
      
      // Search for acceptance criteria in all custom fields
      let acFieldKey = null;
      let acceptanceCriteriaContent = null;
      
      // Known comment-related fields to exclude from AC search
      const commentFieldIds = ['customfield_10710', 'customfield_10711', 'customfield_10712'];
      
      // Common acceptance criteria field IDs
      const acFieldIds = ['customfield_10570', 'customfield_10104', 'customfield_10411', 'customfield_10008', 'customfield_10007'];
      
      // Strategy 1: Check known AC field IDs first
      for (let fieldId of acFieldIds) {
        if (customFields[fieldId]) {
          const value = customFields[fieldId];
          
          // Skip if value looks like an ID reference (contains pipe and random chars)
          if (typeof value === 'string' && /^\d+\|[a-z0-9:]+$/.test(value)) {
            continue;
          }
          
          // Check if it has actual content
          if (typeof value === 'object' && value !== null) {
            const extractedText = extractTextFromADF(value);
            if (extractedText && extractedText.length > 10) {
              acceptanceCriteriaContent = { text: extractedText, adf: value };
              acFieldKey = fieldId;
              break;
            }
          } else if (typeof value === 'string' && value.length > 10) {
            acceptanceCriteriaContent = { text: value, adf: null };
            acFieldKey = fieldId;
            break;
          }
        }
      }
      
      // Strategy 2: Search field names containing "acceptance" and "criteria"
      if (!acceptanceCriteriaContent) {
        for (let key in customFields) {
          const lowerKey = key.toLowerCase();
          const value = customFields[key];
          
          // Skip comment fields
          if (commentFieldIds.includes(key)) {
            continue;
          }
          
          // Skip if value looks like an ID reference (contains pipe and random chars)
          if (typeof value === 'string' && /^\d+\|[a-z0-9:]+$/.test(value)) {
            continue;
          }
          
          // Check if field name explicitly suggests acceptance criteria
          if (lowerKey.includes('acceptance') && lowerKey.includes('criteria')) {
            // Check if it has actual content
            if (typeof value === 'object' && value !== null) {
              // Try to extract text from object
              const extractedText = extractTextFromADF(value);
              if (extractedText && extractedText.length > 10) {
                acceptanceCriteriaContent = { text: extractedText, adf: value };
                acFieldKey = key;
                break;
              }
            } else if (typeof value === 'string' && value.length > 10) {
              acceptanceCriteriaContent = { text: value, adf: null };
              acFieldKey = key;
              break;
            }
          }
        }
      }
      
      // Set the final acceptance criteria
      if (acceptanceCriteriaContent) {
        // Process acceptance criteria to preserve line breaks
        // Add line breaks before common BDD keywords if they're not already on new lines
        let processedAC = acceptanceCriteriaContent.text;
        
        // Add line breaks before AC patterns (AC1, AC2, AC3, etc.)
        processedAC = processedAC.replace(/(AC\d+[-\s])/gi, '\n$1');
        
        // Replace common patterns: Given/When/Then/And at the start or after punctuation
        processedAC = processedAC.replace(/([.!,])\s*(Given|When|Then|And)\s/gi, '$1\n$2 ');
        processedAC = processedAC.replace(/^(Given|When|Then|And)\s/gi, '$1 ');
        
        // Also handle cases where Given/When/Then appear after a comma without space
        processedAC = processedAC.replace(/,(Given|When|Then|And)\s/gi, '\n$1 ');
        
        acceptanceCriteria = processedAC.trim();
        
        // Extract HTML with images if ADF format
        if (acceptanceCriteriaContent.adf) {
          const htmlResult = extractHTMLFromADF(acceptanceCriteriaContent.adf, jiraBaseUrl, attachments);
          // Also apply AC pattern line breaks to HTML
          let processedHTML = htmlResult.html;
          processedHTML = processedHTML.replace(/(AC\d+[-\s])/gi, '<br>$1');
          acceptanceCriteriaHTML = processedHTML;
          hasACMedia = htmlResult.hasMedia;
        }
        
        if (acFieldKey) {
          delete customFields[acFieldKey]; // Remove from custom fields to show separately
        }
      }
    } catch (e) {
      customFields = {};
    }
  }
  
  // Helper function to extract text from JIRA's Atlassian Document Format
  function extractTextFromADF(adf) {
    if (!adf || typeof adf !== 'object') return '';
    
    let text = [];
    
    if (adf.content && Array.isArray(adf.content)) {
      for (let node of adf.content) {
        if (node.type === 'paragraph' && node.content) {
          for (let subNode of node.content) {
            if (subNode.text) {
              text.push(subNode.text);
            }
          }
          text.push('\n');
        } else if (node.type === 'bulletList' && node.content) {
          for (let item of node.content) {
            if (item.content) {
              text.push('• ');
              for (let para of item.content) {
                if (para.content) {
                  for (let subNode of para.content) {
                    if (subNode.text) {
                      text.push(subNode.text);
                    }
                  }
                }
              }
              text.push('\n');
            }
          }
        } else if (node.type === 'orderedList' && node.content) {
          let index = 1;
          for (let item of node.content) {
            if (item.content) {
              text.push(`${index}. `);
              for (let para of item.content) {
                if (para.content) {
                  for (let subNode of para.content) {
                    if (subNode.text) {
                      text.push(subNode.text);
                    }
                  }
                }
              }
              text.push('\n');
              index++;
            }
          }
        } else if (node.text) {
          text.push(node.text);
        }
      }
    } else if (adf.text) {
      text.push(adf.text);
    }
    
    return text.join('').trim();
  }
  
  // Helper function to get file icon based on extension or mime type
  function getFileIcon(filename, mimeType) {
    const lower = filename.toLowerCase();
    
    if (mimeType) {
      if (mimeType.includes('pdf')) return '📄';
      if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
      if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
      if (mimeType.includes('zip') || mimeType.includes('compressed')) return '📦';
      if (mimeType.includes('video')) return '🎥';
      if (mimeType.includes('audio')) return '🎵';
    }
    
    // Check by file extension
    if (lower.endsWith('.pdf')) return '📄';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return '📝';
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx')) return '📊';
    if (lower.endsWith('.ppt') || lower.endsWith('.pptx')) return '📽️';
    if (lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.7z')) return '📦';
    if (lower.endsWith('.txt')) return '📃';
    if (lower.endsWith('.csv')) return '📋';
    
    return '📎'; // Default attachment icon
  }
  
  // Helper function to extract HTML with images from JIRA's Atlassian Document Format
  function extractHTMLFromADF(adf, jiraBaseUrl, attachments = []) {
    if (!adf || typeof adf !== 'object') return { html: '', hasMedia: false };
    
    let html = [];
    let hasMedia = false;
    
    function processNode(node) {
      if (!node) return;
      
      if (node.type === 'paragraph' && node.content) {
        html.push('<p>');
        for (let subNode of node.content) {
          if (subNode.text) {
            // Add line breaks before AC patterns for better formatting
            let processedText = escapeHtml(subNode.text);
            processedText = processedText.replace(/(AC\d+[-\s])/gi, '<br>$1');
            html.push(processedText);
          } else if (subNode.type === 'hardBreak') {
            html.push('<br>');
          }
        }
        html.push('</p>');
      } else if (node.type === 'mediaSingle' || node.type === 'mediaGroup') {
        // Handle images/media - use proxy to fetch with authentication
        if (node.content && Array.isArray(node.content)) {
          for (let mediaNode of node.content) {
            if (mediaNode.type === 'media' && mediaNode.attrs) {
              hasMedia = true;
              const attrs = mediaNode.attrs;
              
              // Debug: log the media attributes
              console.log('Media node attributes:', JSON.stringify(attrs, null, 2));
              
              let imageUrl = '';
              let attachmentId = null;
              const altText = attrs.alt || 'Attachment';
              
              // Strategy 1: Try to match by UUID in filename
              // JIRA often embeds UUIDs in filenames like "document (uuid).pdf"
              if (!attachmentId && attrs.id && attachments && attachments.length > 0) {
                const uuidPattern = attrs.id;
                const matchedAttachment = attachments.find(att => {
                  const attFilename = att.filename || att.name || att.title || '';
                  // Check if filename contains the UUID
                  return attFilename.includes(uuidPattern);
                });
                if (matchedAttachment) {
                  attachmentId = matchedAttachment.id || matchedAttachment.attachmentId || matchedAttachment.fileId;
                  console.log('✅ Matched attachment by UUID in filename:', { 
                    uuid: attrs.id, 
                    filename: matchedAttachment.filename,
                    actualId: attachmentId 
                  });
                }
              }
              
              // Strategy 2: Try to match with attachments array by exact filename
              if (!attachmentId && attachments && attachments.length > 0 && altText) {
                const matchedAttachment = attachments.find(att => {
                  const attFilename = att.filename || att.name || att.title || '';
                  return attFilename === altText || 
                         attFilename.includes(altText) ||
                         altText.includes(attFilename);
                });
                if (matchedAttachment) {
                  attachmentId = matchedAttachment.id || matchedAttachment.attachmentId || matchedAttachment.fileId;
                  console.log('✅ Matched attachment by filename:', { filename: altText, id: attachmentId });
                }
              }
              
              // Strategy 3: Try to match by numeric ID
              if (!attachmentId && attrs.id && attachments && attachments.length > 0) {
                const matchedAttachment = attachments.find(att => {
                  const attId = att.id || att.attachmentId || att.fileId || '';
                  return String(attId) === String(attrs.id);
                });
                if (matchedAttachment) {
                  attachmentId = matchedAttachment.id || matchedAttachment.attachmentId || matchedAttachment.fileId;
                  console.log('✅ Matched attachment by numeric ID:', attachmentId);
                }
              }
              
              // Strategy 3: Try to extract ID from URL
              if (!attachmentId && attrs.url) {
                // Try to extract ID from URL
                // Pattern 1: /attachment/12345/
                let idMatch = attrs.url.match(/\/attachment\/(\d+)\//);
                if (idMatch && idMatch[1]) {
                  attachmentId = idMatch[1];
                  console.log('Extracted ID from URL pattern 1:', attachmentId);
                } else {
                  // Pattern 2: /12345/filename.png
                  idMatch = attrs.url.match(/\/(\d+)\//);
                  if (idMatch && idMatch[1]) {
                    attachmentId = idMatch[1];
                    console.log('Extracted ID from URL pattern 2:', attachmentId);
                  }
                }
              }
              
              // Strategy 4: Use collection/occurrenceKey
              if (!attachmentId && attrs.collection && attrs.occurrenceKey) {
                attachmentId = attrs.occurrenceKey;
                console.log('Using occurrenceKey:', attachmentId);
              }
              
              // If we have an attachment ID, determine if it's an image or document
              if (attachmentId) {
                // Check if this is likely an image based on filename extension
                const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
                let isImage = imageExtensions.some(ext => altText.toLowerCase().endsWith(ext));
                
                // Also check matched attachment's mimeType and get actual filename
                let mimeType = null;
                let actualFilename = altText; // Default to altText
                if (attachments && attachments.length > 0) {
                  const matchedAtt = attachments.find(att => {
                    const attId = att.id || att.attachmentId || att.fileId || '';
                    const attFilename = att.filename || att.name || att.title || '';
                    return String(attId) === String(attachmentId) || attFilename === altText;
                  });
                  if (matchedAtt) {
                    const attMimeType = matchedAtt.mimeType || matchedAtt.type || matchedAtt.contentType || '';
                    if (attMimeType) {
                      mimeType = attMimeType;
                      // If mimeType starts with 'image/', it's definitely an image
                      if (mimeType.startsWith('image/')) {
                        isImage = true;
                      } else {
                        isImage = false;
                      }
                    }
                    // Use the actual filename from the matched attachment
                    const attFilename = matchedAtt.filename || matchedAtt.name || matchedAtt.title || '';
                    if (attFilename) {
                      actualFilename = attFilename;
                    }
                  }
                }
                
                if (isImage) {
                  // Render as image
                  imageUrl = `JIRA/attachment-proxy.api.php?id=${encodeURIComponent(attachmentId)}&filename=${encodeURIComponent(actualFilename)}`;
                  const imageId = 'img-' + attachmentId + '-' + Math.random().toString(36).substr(2, 9);
                  html.push(`<div style="margin:10px 0;">
                    <img id="${imageId}" src="${escapeHtml(imageUrl)}" 
                         style="max-width:100%;height:auto;border-radius:4px;border:1px solid var(--border);cursor:pointer;" 
                         alt="${escapeHtml(altText)}" 
                         onclick="window.open(this.src, '_blank')"
                         onload="console.log('✅ Image loaded successfully:', '${escapeHtml(actualFilename)}', '${imageUrl}');"
                         onerror="console.error('❌ Image failed to load:', '${escapeHtml(actualFilename)}', '${imageUrl}'); this.style.display='none';this.nextElementSibling.style.display='block';">
                    <div style="display:none;padding:8px;background:rgba(255,165,0,0.1);border-radius:4px;color:var(--text);border:1px solid rgba(255,165,0,0.3);">
                      📎 Unable to load image: ${escapeHtml(actualFilename)} (ID: ${escapeHtml(attachmentId)})
                    </div>
                  </div>`);
                } else {
                  // Render as download link for documents (PDF, DOC, etc.)
                  const downloadUrl = `JIRA/attachment-proxy.api.php?id=${encodeURIComponent(attachmentId)}&filename=${encodeURIComponent(actualFilename)}&download=1`;
                  const fileIcon = getFileIcon(actualFilename, mimeType);
                  console.log('📄 Document download link created:', { 
                    id: attachmentId, 
                    filename: actualFilename, 
                    mimeType: mimeType,
                    url: downloadUrl 
                  });
                  html.push(`<div style="margin:10px 0;padding:12px;background:rgba(59,130,246,0.1);border-radius:4px;border:1px solid rgba(59,130,246,0.3);">
                    <a href="${escapeHtml(downloadUrl)}" download="${escapeHtml(actualFilename)}" style="color:var(--accent);text-decoration:none;display:flex;align-items:center;gap:8px;">
                      <span style="font-size:24px;">${fileIcon}</span>
                      <div>
                        <div style="font-weight:600;">${escapeHtml(actualFilename)}</div>
                        ${mimeType ? `<div style="font-size:12px;opacity:0.7;">${escapeHtml(mimeType)} • ID: ${escapeHtml(attachmentId)}</div>` : ''}
                      </div>
                    </a>
                  </div>`);
                }
              } else {
                // No valid attachment ID found
                console.warn('Could not extract attachment ID for:', altText, attrs);
                html.push(`<div style="display:block;padding:8px;background:rgba(255,165,0,0.1);border-radius:4px;color:var(--text);border:1px solid rgba(255,165,0,0.3);">
                  📎 Unable to load attachment: ${escapeHtml(altText)} (No attachment ID found)
                </div>`);
              }
            }
          }
        }
      } else if (node.type === 'bulletList' && node.content) {
        html.push('<ul style="margin:8px 0;padding-left:20px;">');
        for (let item of node.content) {
          if (item.content) {
            html.push('<li>');
            for (let para of item.content) {
              if (para.content) {
                for (let subNode of para.content) {
                  if (subNode.text) {
                    html.push(escapeHtml(subNode.text));
                  }
                }
              }
            }
            html.push('</li>');
          }
        }
        html.push('</ul>');
      } else if (node.type === 'orderedList' && node.content) {
        html.push('<ol style="margin:8px 0;padding-left:20px;">');
        for (let item of node.content) {
          if (item.content) {
            html.push('<li>');
            for (let para of item.content) {
              if (para.content) {
                for (let subNode of para.content) {
                  if (subNode.text) {
                    html.push(escapeHtml(subNode.text));
                  }
                }
              }
            }
            html.push('</li>');
          }
        }
        html.push('</ol>');
      } else if (node.text) {
        html.push(escapeHtml(node.text));
      }
    }
    
    if (adf.content && Array.isArray(adf.content)) {
      for (let node of adf.content) {
        processNode(node);
      }
    } else {
      processNode(adf);
    }
    
    return { html: html.join(''), hasMedia };
  }
  
  // Extract ALL comments using the helper function
  if (customFields.comment && typeof customFields.comment === 'object') {
    const commentData = customFields.comment;
    if (commentData.comments && Array.isArray(commentData.comments) && commentData.comments.length > 0) {
      let commentsArray = [];
      let commentsHTMLArray = [];
      
      // Loop through all comments
      for (let i = 0; i < commentData.comments.length; i++) {
        const comment = commentData.comments[i];
        if (comment.body) {
          let commentText = '';
          let commentHTML = '';
          let hasMedia = false;
          
          // Extract text and HTML from ADF format
          if (typeof comment.body === 'object') {
            commentText = extractTextFromADF(comment.body);
            const htmlResult = extractHTMLFromADF(comment.body, jiraBaseUrl, attachments);
            commentHTML = htmlResult.html;
            hasMedia = htmlResult.hasMedia;
            if (hasMedia) hasCommentsMedia = true;
          } else if (typeof comment.body === 'string') {
            commentText = comment.body;
            commentHTML = escapeHtml(comment.body).replace(/\n/g, '<br>');
          }
          
          // Add author and date if available
          if (comment.author && comment.author.displayName) {
            const author = comment.author.displayName;
            const date = comment.created ? new Date(comment.created).toLocaleDateString() + ' ' + new Date(comment.created).toLocaleTimeString() : '';
            commentText = `👤 ${author} • ${date}\n\n${commentText}`;
            commentHTML = `<div style="font-weight:600;margin-bottom:8px;color:var(--accent);">👤 ${escapeHtml(author)} • ${escapeHtml(date)}</div>${commentHTML}`;
          }
          
          commentsArray.push(commentText);
          commentsHTMLArray.push(commentHTML);
        }
      }
      
      // Join all comments with separator
      allComments = commentsArray.join('\n\n' + '─'.repeat(50) + '\n\n');
      allCommentsHTML = commentsHTMLArray.join('<div style="margin:16px 0;border-bottom:1px solid var(--border);"></div>');
    }
  }
  
  // Extract priority from customfield_10992
  if (customFields['customfield_10992']) {
    const priorityField = customFields['customfield_10992'];
    if (typeof priorityField === 'object' && priorityField.value) {
      priorityValue = priorityField.value;
      // Map priority values to colors
      const priorityColors = {
        'Critical': '#dc2626',
        'High': '#ea580c',
        'Medium': '#eab308',
        'Low': '#3b82f6',
        'Lowest': '#6b7280'
      };
      priorityColor = priorityColors[priorityValue] || '#6b7280';
    }
  }
  
  // Extract project name from customFields
  if (customFields.project && typeof customFields.project === 'object' && customFields.project.name) {
    projectKeyValue = customFields.project.name;
  }
  
  // Extract description from ADF format to preserve line breaks and images
  if (customFields.description && typeof customFields.description === 'object') {
    descriptionFromADF = extractTextFromADF(customFields.description);
    const htmlResult = extractHTMLFromADF(customFields.description, jiraBaseUrl, attachments);
    descriptionHTML = htmlResult.html;
    hasDescMedia = htmlResult.hasMedia;
  }
  
  // Extract demand code from custom fields
  let demandCode = '';
  if (customFields['customfield_10620']) {
    demandCode = customFields['customfield_10620'];
  }
  
  return `
    <div class="story-details-container">
      <!-- Header Section -->
      <div class="story-details-header">
        <div class="story-key-badge">${escapeHtml(issue.issue_key)}</div>
        <div class="story-type-badge">${escapeHtml(issue.issue_type || 'Story')}</div>
        <div class="story-status-badge status-${statusClass}">${escapeHtml(issue.status || 'Unknown')}</div>
      </div>
      
      <!-- Summary -->
      <div class="story-details-section">
        <div class="story-details-label">📝 Summary</div>
        <div class="story-details-value large">${escapeHtml(issue.summary)}</div>
      </div>
      
      <!-- Description -->
      ${(descriptionFromADF || issue.description) ? `
      <div class="story-details-section">
        <div class="story-details-label">📄 Description</div>
        <div class="story-details-value ${hasDescMedia ? '' : 'pre-wrap'}" style="max-height:300px;overflow-y:auto;padding:12px;background:rgba(0,0,0,0.2);border-radius:6px;border:1px solid var(--border);line-height:1.6;${hasDescMedia ? '' : 'white-space:pre-wrap;'}">${hasDescMedia ? descriptionHTML : escapeHtml(descriptionFromADF || issue.description)}</div>
      </div>
      ` : ''}
      
      <!-- Acceptance Criteria -->
      ${acceptanceCriteria ? `
      <div class="story-details-section">
        <div class="story-details-label">✅ Acceptance Criteria</div>
        <div class="story-details-value ${hasACMedia ? '' : 'pre-wrap'}" style="max-height:250px;overflow-y:auto;padding:12px;background:rgba(16,185,129,0.05);border-radius:6px;border:1px solid rgba(16,185,129,0.2);line-height:1.6;font-size:13px;${hasACMedia ? '' : 'white-space:pre-wrap;'}">${hasACMedia ? acceptanceCriteriaHTML : escapeHtml(acceptanceCriteria)}</div>
      </div>
      ` : ''}
      
      <!-- Comments -->
      <div class="story-details-section">
        <div class="story-details-label">💬 Comments (All)</div>
        ${allComments ? `
        <div class="story-details-value ${hasCommentsMedia ? '' : 'pre-wrap'}" style="max-height:400px;overflow-y:auto;padding:12px;background:rgba(59,130,246,0.05);border-radius:6px;border:1px solid rgba(59,130,246,0.2);line-height:1.6;font-size:13px;${hasCommentsMedia ? '' : 'white-space:pre-wrap;'}">${hasCommentsMedia ? allCommentsHTML : escapeHtml(allComments)}</div>
        ` : (issue.comments ? `
        <div class="story-details-value pre-wrap" style="max-height:250px;overflow-y:auto;padding:12px;background:rgba(59,130,246,0.05);border-radius:6px;border:1px solid rgba(59,130,246,0.2);line-height:1.6;font-size:13px;white-space:pre-wrap;">${escapeHtml(issue.comments)}</div>
        ` : `
        <div style="padding:16px;text-align:center;color:var(--text3);font-size:13px;background:rgba(255,255,255,0.02);border-radius:6px;border:1px dashed var(--border);">
          No comments available. <a href="#" onclick="openStoryInJira();return false;" style="color:var(--accent);text-decoration:underline;">View in JIRA</a> to see all comments.
        </div>
        `)}
      </div>
      
      <!-- Main Info Grid -->
      <div class="story-info-grid">
        <!-- Sprint Information -->
        <div class="story-info-card">
          <div class="story-info-card-title">🎯 Sprint Information</div>
          <div class="story-info-row">
            <span class="story-info-label">PI:</span>
            <span class="story-info-value">${escapeHtml(pi)}</span>
          </div>
          <div class="story-info-row">
            <span class="story-info-label">Quarter:</span>
            <span class="story-info-value">${escapeHtml(quarter)}</span>
          </div>
          <div class="story-info-row">
            <span class="story-info-label">Sprint:</span>
            <span class="story-info-value">${escapeHtml(sprint)}</span>
          </div>
          <div class="story-info-row">
            <span class="story-info-label">Full Sprint:</span>
            <span class="story-info-value">${escapeHtml(issue.sprint || '—')}</span>
          </div>
        </div>
        
        <!-- People -->
        <div class="story-info-card">
          <div class="story-info-card-title">👥 People</div>
          <div class="story-info-row">
            <span class="story-info-label">Assignee:</span>
            <span class="story-info-value">${escapeHtml(issue.assignee || '—')}</span>
          </div>
          <div class="story-info-row">
            <span class="story-info-label">Reporter:</span>
            <span class="story-info-value">${escapeHtml(issue.reporter || '—')}</span>
          </div>
        </div>
        
        <!-- Project & Priority -->
        <div class="story-info-card">
          <div class="story-info-card-title">⚙️ Details</div>
          <div class="story-info-row">
            <span class="story-info-label">Project:</span>
            <span class="story-info-value">${escapeHtml(projectKeyValue || issue.project_key || '—')}</span>
          </div>
          <div class="story-info-row">
            <span class="story-info-label">Priority:</span>
            <span class="story-info-value" style="${priorityColor ? 'color:' + priorityColor + ';font-weight:600;' : ''}">${escapeHtml(priorityValue || issue.priority || '—')}</span>
          </div>
          <div class="story-info-row">
            <span class="story-info-label">Story Points:</span>
            <span class="story-info-value">${issue.story_points || '—'}</span>
          </div>
          <div class="story-info-row">
            <span class="story-info-label">Demand Code:</span>
            <span class="story-info-value">${escapeHtml(demandCode || '—')}</span>
          </div>
          ${issue.parent_key ? `
          <div class="story-info-row">
            <span class="story-info-label">Parent:</span>
            <span class="story-info-value">${escapeHtml(issue.parent_key)}</span>
          </div>
          ` : ''}
        </div>
        
        <!-- Timestamps -->
        <div class="story-info-card">
          <div class="story-info-card-title">🕐 Timestamps</div>
          <div class="story-info-row">
            <span class="story-info-label">Created:</span>
            <span class="story-info-value">${escapeHtml(createdDate)}</span>
          </div>
          <div class="story-info-row">
            <span class="story-info-label">Updated:</span>
            <span class="story-info-value">${escapeHtml(updatedDate)}</span>
          </div>
          ${issue.local_record_id ? `
          <div class="story-info-row">
            <span class="story-info-label">Local ID:</span>
            <span class="story-info-value">${escapeHtml(issue.local_record_id)}</span>
          </div>
          ` : ''}
        </div>
      </div>
      
      <!-- Labels -->
      ${labels.length > 0 ? `
      <div class="story-details-section">
        <div class="story-details-label">🏷️ Labels</div>
        <div class="story-labels">
          ${labels.map(label => `<span class="story-label">${escapeHtml(label)}</span>`).join('')}
        </div>
      </div>
      ` : ''}
      
      <!-- Attachments -->
      ${attachments && attachments.length > 0 ? `
      <div class="story-details-section">
        <div class="story-details-label">📎 Attachments</div>
        <div style="display:grid;gap:8px;padding:12px;background:rgba(0,0,0,0.2);border-radius:6px;border:1px solid var(--border);">
          ${attachments.map(att => {
            const filename = att.filename || att.name || att.title || 'Unknown file';
            const mimeType = att.mimeType || att.type || att.contentType || '';
            const attId = att.id || att.attachmentId || att.fileId || '';
            const size = att.size ? `${(att.size / 1024).toFixed(1)} KB` : '';
            
            if (!attId) {
              return `<div style="padding:8px;background:rgba(255,165,0,0.1);border-radius:4px;border:1px solid rgba(255,165,0,0.3);">
                <span style="opacity:0.7;">⚠️ ${escapeHtml(filename)} (No ID available)</span>
              </div>`;
            }
            
            const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
            const isImage = imageExtensions.some(ext => filename.toLowerCase().endsWith(ext)) || (mimeType && mimeType.startsWith('image/'));
            
            if (isImage) {
              const imageUrl = `JIRA/attachment-proxy.api.php?id=${encodeURIComponent(attId)}&filename=${encodeURIComponent(filename)}`;
              return `<div style="padding:8px;background:rgba(59,130,246,0.05);border-radius:4px;border:1px solid rgba(59,130,246,0.2);">
                <div style="margin-bottom:8px;">
                  <strong>${escapeHtml(filename)}</strong>
                  ${size ? `<span style="opacity:0.6;font-size:12px;margin-left:8px;">${size}</span>` : ''}
                </div>
                <img src="${escapeHtml(imageUrl)}" style="max-width:100%;max-height:200px;border-radius:4px;cursor:pointer;" 
                     onclick="window.open(this.src, '_blank')" 
                     alt="${escapeHtml(filename)}"
                     onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
                <div style="display:none;padding:8px;background:rgba(255,0,0,0.1);color:#ff6b6b;">Failed to load image</div>
              </div>`;
            } else {
              const downloadUrl = `JIRA/attachment-proxy.api.php?id=${encodeURIComponent(attId)}&filename=${encodeURIComponent(filename)}&download=1`;
              const fileIcon = getFileIcon(filename, mimeType);
              return `<div style="padding:8px;background:rgba(59,130,246,0.05);border-radius:4px;border:1px solid rgba(59,130,246,0.2);">
                <a href="${escapeHtml(downloadUrl)}" download="${escapeHtml(filename)}" style="color:var(--accent);text-decoration:none;display:flex;align-items:center;gap:8px;">
                  <span style="font-size:20px;">${fileIcon}</span>
                  <div style="flex:1;">
                    <div><strong>${escapeHtml(filename)}</strong></div>
                    ${mimeType || size ? `<div style="font-size:11px;opacity:0.6;">${escapeHtml(mimeType || '')} ${size ? '• ' + size : ''}</div>` : ''}
                  </div>
                </a>
              </div>`;
            }
          }).join('\n')}
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

// Close story details modal
function closeJiraStoryDetailsModal() {
  document.getElementById('jiraStoryDetailsModal').classList.remove('show');
  window.currentViewingIssueKey = null;
}

// Open current story in JIRA
function openStoryInJira() {
  const issueKey = window.currentViewingIssueKey;
  if (!issueKey || !jiraState.config.jira_url) return;
  
  const url = `${jiraState.config.jira_url}/browse/${issueKey}`;
  window.open(url, '_blank');
}

// Import single story
async function importSingleIssue(issueKey) {
  await importJiraIssuesToRecords([issueKey]);
}

// Import JIRA stories to records
async function importJiraIssuesToRecords(issueKeys = null) {
  const keys = issueKeys || document.getElementById('importJiraKeys').value
    .split(',')
    .map(k => k.trim())
    .filter(k => k);
  
  if (keys.length === 0) {
    toast('Please enter at least one story key', 'error');
    return;
  }
  
  toast(`Importing ${keys.length} ${keys.length === 1 ? 'story' : 'stories'}...`, 'info');
  
  try {
    const response = await jiraFetch('JIRA/issues.api.php?action=import', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        issueKeys: keys
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      toast(`Imported ${result.data.imported} of ${result.data.total} stories`, 'success');
      
      // Clear the input
      if (!issueKeys) {
        document.getElementById('importJiraKeys').value = '';
      }
      
      // Reload records
      loadState();
      renderJiraStats();
    } else {
      toast('Import failed: ' + result.error, 'error');
    }
  } catch (error) {
    toast('Failed to import stories', 'error');
  }
}

// Export records to JIRA


// Render JIRA stats
function renderJiraStats() {
  const totalEl = document.getElementById('jiraStatTotal');
  if (totalEl) {
    totalEl.textContent = jiraState.cachedStories.length;
  }
  
  const synced = jiraState.cachedStories.filter(i => i.local_record_id).length;
  const syncedEl = document.getElementById('jiraStatSynced');
  if (syncedEl) {
    syncedEl.textContent = synced;
  }
  
  const pending = jiraState.cachedStories.length - synced;
  const pendingEl = document.getElementById('jiraStatPending');
  if (pendingEl) {
    pendingEl.textContent = pending;
  }
  
  if (jiraState.lastSyncTime) {
    const timeStr = jiraState.lastSyncTime.toLocaleString();
    const lastSyncEl = document.getElementById('jiraLastSync');
    if (lastSyncEl) {
      lastSyncEl.textContent = `Last sync: ${timeStr}`;
    }
  }
}

// Load field mappings
async function loadFieldMappings() {
  // Load from localStorage or use defaults
  const saved = localStorage.getItem('jiraFieldMappings');
  
  if (saved) {
    try {
      jiraState.fieldMappings = JSON.parse(saved);
    } catch (e) {
      jiraState.fieldMappings = getDefaultFieldMappings();
    }
  } else {
    jiraState.fieldMappings = getDefaultFieldMappings();
    saveFieldMappingsToStorage();
  }
  
  renderFieldMappings();
  populateJiraFieldDropdown();
}

// Get default field mappings
function getDefaultFieldMappings() {
  return [
    {local_field: 'jira', jira_field: 'key', jira_field_name: 'Issue Key'},
    {local_field: 'desc', jira_field: 'summary', jira_field_name: 'Summary'},
    {local_field: 'jstatus', jira_field: 'status', jira_field_name: 'Status'}
  ];
}

// Save field mappings to localStorage
function saveFieldMappingsToStorage() {
  try {
    localStorage.setItem('jiraFieldMappings', JSON.stringify(jiraState.fieldMappings));
  } catch (e) {
  }
}

// ============================================
// PERSON FILTERING FUNCTIONS
// ============================================

// Add person to filter
function addPersonToFilter() {
  const input = document.getElementById('jiraPersonInput');
  const personName = input.value.trim();
  
  if (!personName) {
    toast('Please enter a person name', 'error');
    return;
  }
  
  if (jiraState.selectedPersons.includes(personName)) {
    toast('Person already added', 'warning');
    return;
  }
  
  jiraState.selectedPersons.push(personName);
  input.value = '';
  
  renderPersonTags();
  renderJiraIssues(jiraState.filteredStories);
}

// Remove person from filter
function removePersonFromFilter(personName) {
  const idx = jiraState.selectedPersons.indexOf(personName);
  if (idx > -1) {
    jiraState.selectedPersons.splice(idx, 1);
    renderPersonTags();
    renderJiraIssues(jiraState.filteredStories);
  }
}

// Clear all persons filter
function clearPersonsFilter() {
  jiraState.selectedPersons = [];
  renderPersonTags();
  renderJiraIssues(jiraState.filteredStories);
}

// Render person tags
function renderPersonTags() {
  const container = document.getElementById('selectedPersonsContainer');
  
  if (!container) return;
  
  if (jiraState.selectedPersons.length === 0) {
    container.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:4px;">No person filter active</div>';
    return;
  }
  
  let html = '';
  for (const person of jiraState.selectedPersons) {
    html += `
      <div class="person-tag">
        <span>${escapeHtml(person)}</span>
        <div class="person-tag-remove" onclick="removePersonFromFilter('${escapeHtml(person)}')">×</div>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// ============================================
// ADD STORY TO RECORDS FUNCTION
// ============================================

// Add individual story to records table
async function addIssueToRecords(issueKey) {
  const issue = jiraState.cachedStories.find(i => i.issue_key === issueKey);
  if (!issue) {
    toast('Story not found', 'error');
    return;
  }
  
  // Check if already added
  if (jiraState.addedStories.has(issueKey)) {
    toast('Story already added to records', 'warning');
    return;
  }
  
  toast(`Adding ${issueKey} to records...`, 'info');
  
  try {
    // Fetch full issue data with all custom fields from cache
    const fetchResponse = await jiraFetch(`JIRA/issues.api.php?action=getSingle&issueKey=${issueKey}`);
    const fetchResult = await fetchResponse.json();
    
    let fullIssue = issue;
    if (fetchResult.success && fetchResult.data) {
      fullIssue = fetchResult.data;
    }
    
    const response = await jiraFetch('JIRA/issues.api.php?action=addToRecords', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        issueKey: issueKey,
        issue: fullIssue,
        fieldMappings: jiraState.fieldMappings || []
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      jiraState.addedStories.add(issueKey);
      
      // Update the cached story's local_record_id if the API returns it
      if (result.data && result.data.record_id) {
        const cachedStory = jiraState.cachedStories.find(s => s.issue_key === issueKey);
        if (cachedStory) {
          cachedStory.local_record_id = result.data.record_id;
        }
        // Also update in filteredStories if it exists there
        const filteredStory = jiraState.filteredStories.find(s => s.issue_key === issueKey);
        if (filteredStory) {
          filteredStory.local_record_id = result.data.record_id;
        }
      }
      
      toast(`✓ ${issueKey} added to records successfully`, 'success');
      
      // Re-render to update button state
      renderJiraIssues(jiraState.filteredStories);
      
      // Reload records if we're on that tab
      if (typeof loadState === 'function') {
        loadState();
      }
    } else {
      toast('Failed to add story: ' + result.error, 'error');
    }
  } catch (error) {
    toast('Failed to add story to records', 'error');
  }
}

// ============================================
// FIELD MAPPINGS
// ============================================

// Render field mappings
function renderFieldMappings() {
  const mappingList = document.getElementById('jiraFieldMappingList');
  const countEl = document.getElementById('jiraMappingCount');
  
  if (!mappingList) return; // Exit if container doesn't exist
  
  // Update count
  if (countEl) {
    const count = jiraState.fieldMappings?.length || 0;
    countEl.textContent = count;
  }
  
  if (!jiraState.fieldMappings || jiraState.fieldMappings.length === 0) {
    mappingList.innerHTML = `
      <div style="padding:40px 20px;text-align:center;color:var(--text3);">
        <div style="font-size:48px;margin-bottom:12px;opacity:0.5;">🔗</div>
        <div style="font-size:13px;font-weight:600;margin-bottom:6px;">No mappings yet</div>
        <div style="font-size:12px;">Create your first field mapping using the form on the left</div>
      </div>
    `;
    return;
  }
  
  let html = '';
  for (let i = 0; i < jiraState.fieldMappings.length; i++) {
    const mapping = jiraState.fieldMappings[i];
    html += `
      <div style="padding:12px;margin-bottom:8px;background:var(--surface2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:6px;transition:all 0.2s ease;" onmouseover="this.style.background='rgba(0,212,255,0.05)';this.style.borderLeftWidth='4px';" onmouseout="this.style.background='var(--surface2)';this.style.borderLeftWidth='3px';">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div style="font-size:12px;font-weight:700;color:var(--text);font-family:'Courier New',monospace;">${escapeHtml(mapping.local_field)}</div>
          <button onclick="deleteFieldMapping(${i})" style="padding:4px 8px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:4px;color:#ef4444;font-size:11px;cursor:pointer;font-weight:600;transition:all 0.2s;" onmouseover="this.style.background='#ef4444';this.style.color='white';" onmouseout="this.style.background='rgba(239,68,68,0.1)';this.style.color='#ef4444';" title="Delete mapping">✖ Delete</button>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.5px;">Maps to</div>
          <div style="font-size:18px;color:var(--accent);">→</div>
          <div style="font-size:12px;color:var(--text3);">${escapeHtml(mapping.jira_field_name || mapping.jira_field)}</div>
        </div>
        <div style="font-size:10px;color:var(--text3);margin-top:4px;font-family:'Courier New',monospace;font-style:italic;">${escapeHtml(mapping.jira_field)}</div>
      </div>
    `;
  }
  
  mappingList.innerHTML = html;
}

// Populate JIRA field dropdown with available fields from cached stories
function populateJiraFieldDropdown() {
  const dropdown = document.getElementById('mappingJiraField');
  if (!dropdown) return;
  
  // Common JIRA fields with display names
  const jiraFields = [
    { value: 'key', label: 'Issue Key' },
    { value: 'summary', label: 'Summary' },
    { value: 'description', label: 'Description' },
    { value: 'status', label: 'Status' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'reporter', label: 'Reporter' },
    { value: 'priority', label: 'Priority' },
    { value: 'issue_type', label: 'Issue Type' },
    { value: 'created', label: 'Created Date' },
    { value: 'updated', label: 'Updated Date' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'resolution', label: 'Resolution' },
    { value: 'labels', label: 'Labels' },
    { value: 'components', label: 'Components' },
    { value: 'fix_versions', label: 'Fix Versions' },
    { value: 'story_points', label: 'Story Points' },
    { value: 'sprint', label: 'Sprint (Full)' },
    { value: 'pi', label: 'PI (Program Increment)' },
    { value: 'quarter', label: 'Quarter' },
    { value: 'sprint_number', label: 'Sprint Number' },
    { value: 'epic_link', label: 'Epic Link' },
    { value: 'parent', label: 'Parent' },
    { value: 'environment', label: 'Environment' },
    { value: 'time_estimate', label: 'Time Estimate' },
    { value: 'time_spent', label: 'Time Spent' },
    { value: 'remaining_estimate', label: 'Remaining Estimate' }
  ];
  
  // If we have cached stories, extract additional fields from them
  if (jiraState.cachedStories && jiraState.cachedStories.length > 0) {
    const sampleStory = jiraState.cachedStories[0];
    const existingFieldValues = new Set(jiraFields.map(f => f.value));
    
    // Add any fields from the story that aren't already in our list
    Object.keys(sampleStory).forEach(key => {
      if (!existingFieldValues.has(key) && key !== 'id' && key !== 'sync_date' && key !== 'local_record_id') {
        jiraFields.push({
          value: key,
          label: formatFieldName(key)
        });
      }
    });
  }
  
  // Sort alphabetically by label
  jiraFields.sort((a, b) => a.label.localeCompare(b.label));
  
  // Populate dropdown
  let html = '<option value="">Select JIRA Field</option>';
  jiraFields.forEach(field => {
    html += `<option value="${field.value}">${field.label}</option>`;
  });
  
  dropdown.innerHTML = html;
}

// Format field name for display (convert snake_case to Title Case)
function formatFieldName(fieldName) {
  return fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Handle JIRA field selection - auto-populate display name
function onJiraFieldSelected() {
  const jiraFieldDropdown = document.getElementById('mappingJiraField');
  
  if (!jiraFieldDropdown) return;
  
  const selectedValue = jiraFieldDropdown.value;
  if (!selectedValue) {
    return;
  }
  
  // Get the display text from the selected option
  const selectedOption = jiraFieldDropdown.options[jiraFieldDropdown.selectedIndex];
  const displayLabel = selectedOption.text;
  
  // Store the display name in a data attribute for later use
  jiraFieldDropdown.dataset.displayName = displayLabel;
}

// Clear mapping form
function clearMappingForm() {
  const localFieldInput = document.getElementById('mappingLocalField');
  const jiraFieldDropdown = document.getElementById('mappingJiraField');
  
  if (localFieldInput) localFieldInput.value = '';
  if (jiraFieldDropdown) {
    jiraFieldDropdown.value = '';
    delete jiraFieldDropdown.dataset.displayName;
  }
}

// Save field mapping
function saveFieldMapping() {
  const localFieldInput = document.getElementById('mappingLocalField');
  const jiraFieldDropdown = document.getElementById('mappingJiraField');
  
  const localField = localFieldInput?.value.trim();
  const jiraField = jiraFieldDropdown?.value.trim();
  const jiraFieldName = jiraFieldDropdown?.dataset.displayName || jiraField;
  
  // Validation
  if (!localField) {
    toast('Please enter a local field name', 'error');
    localFieldInput?.focus();
    return;
  }
  
  // Validate local field format (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(localField)) {
    toast('Local field name can only contain letters, numbers, and underscores', 'error');
    localFieldInput?.focus();
    return;
  }
  
  if (!jiraField) {
    toast('Please select a JIRA field', 'error');
    jiraFieldDropdown?.focus();
    return;
  }
  
  // Check if mapping already exists for this local field
  const existingIndex = jiraState.fieldMappings.findIndex(m => m.local_field === localField);
  if (existingIndex !== -1) {
    if (!confirm(`A mapping for "${localField}" already exists. Replace it?`)) {
      return;
    }
    // Remove existing mapping
    jiraState.fieldMappings.splice(existingIndex, 1);
  }
  
  // Add new mapping
  jiraState.fieldMappings.push({
    local_field: localField,
    jira_field: jiraField,
    jira_field_name: jiraFieldName
  });
  
  // Save to localStorage
  saveFieldMappingsToStorage();
  
  // Re-render
  renderFieldMappings();
  
  // Clear form
  clearMappingForm();
  
  toast(`✓ Mapping created: ${localField} → ${jiraFieldName}`, 'success');
}

// Delete field mapping
function deleteFieldMapping(index) {
  const mapping = jiraState.fieldMappings[index];
  if (!mapping) return;
  
  if (!confirm(`Delete mapping:\n"${mapping.local_field}" → "${mapping.jira_field_name || mapping.jira_field}"?`)) {
    return;
  }
  
  jiraState.fieldMappings.splice(index, 1);
  saveFieldMappingsToStorage();
  renderFieldMappings();
  toast('✓ Mapping deleted', 'success');
}

// Toggle JQL help
function toggleJqlHelp() {
  const helpBox = document.getElementById('jqlHelpBox');
  helpBox.style.display = helpBox.style.display === 'none' ? 'block' : 'none';
}

// Open import JIRA modal
function openImportJiraModal() {
  // Focus on the import textarea
  document.getElementById('importJiraKeys').focus();
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// AUTO-SYNC FUNCTIONALITY
// ========================================

let autoSyncTimer = null;
let currentSyncRunId = null;

// Load auto-sync settings
async function loadAutoSyncSettings() {
  try {
    const response = await jiraFetch('JIRA/auto-sync.api.php?action=get');
    const result = await response.json();
    
    if (result.success && result.data) {
      jiraState.autoSync = {
        enabled: result.data.enabled || false,
        mode: result.data.mode || 'interval',
        interval: result.data.sync_interval || 3600,
        scheduleType: result.data.schedule_type || 'daily',
        scheduleTime: result.data.schedule_time || '09:00',
        scheduleDayOfWeek: result.data.schedule_day_of_week || 1,
        scheduleDayOfMonth: result.data.schedule_day_of_month || 1,
        scheduleMonth: result.data.schedule_month || 0,
        scheduleYearlyDay: result.data.schedule_yearly_day || 1,
        lastRun: result.data.last_run ? new Date(result.data.last_run) : null,
        nextRun: result.data.next_run ? new Date(result.data.next_run) : null
      };
      
      // Update UI
      document.getElementById('autoSyncEnabled').checked = jiraState.autoSync.enabled;
      document.getElementById('autoSyncMode').value = jiraState.autoSync.mode;
      document.getElementById('autoSyncInterval').value = jiraState.autoSync.interval;
      document.getElementById('scheduleType').value = jiraState.autoSync.scheduleType;
      document.getElementById('scheduleTime').value = jiraState.autoSync.scheduleTime;
      document.getElementById('scheduleDayOfWeek').value = jiraState.autoSync.scheduleDayOfWeek;
      document.getElementById('scheduleDayOfMonth').value = jiraState.autoSync.scheduleDayOfMonth;
      document.getElementById('scheduleMonth').value = jiraState.autoSync.scheduleMonth;
      document.getElementById('scheduleYearlyDay').value = jiraState.autoSync.scheduleYearlyDay;
      
      // Show/hide options
      const autoSyncOptions = document.getElementById('autoSyncOptions');
      if (jiraState.autoSync.enabled) {
        autoSyncOptions.classList.remove('d-none');
        autoSyncOptions.classList.add('d-block');
      } else {
        autoSyncOptions.classList.add('d-none');
        autoSyncOptions.classList.remove('d-block');
      }
      
      // Show correct mode options
      toggleAutoSyncMode();
      updateScheduleType();
      updateSchedulePreview();
      updateAutoSyncDisplay();
      
      // Load sync runs history
      loadSyncRuns(true);
      
      // Start timer if enabled
      if (jiraState.autoSync.enabled) {
        startAutoSyncTimer();
      }
    }
  } catch (error) {
    // Auto-sync not configured yet, use defaults
    // Still try to load sync runs
    loadSyncRuns(true);
  }
}

// Toggle auto-sync
function toggleAutoSync() {
  const enabled = document.getElementById('autoSyncEnabled').checked;
  const autoSyncOptions = document.getElementById('autoSyncOptions');
  
  if (enabled) {
    autoSyncOptions.classList.remove('d-none');
  } else {
    autoSyncOptions.classList.add('d-none');
    stopAutoSyncTimer();
  }
}

// Toggle between interval and scheduled modes
function toggleAutoSyncMode() {
  const mode = document.getElementById('autoSyncMode').value;
  jiraState.autoSync.mode = mode;
  
  const intervalOptions = document.getElementById('intervalBasedOptions');
  const scheduleOptions = document.getElementById('scheduleBasedOptions');
  
  if (mode === 'interval') {
    intervalOptions.classList.remove('d-none');
    intervalOptions.classList.add('d-block');
    scheduleOptions.classList.remove('d-block');
    scheduleOptions.classList.add('d-none');
  } else {
    intervalOptions.classList.remove('d-block');
    intervalOptions.classList.add('d-none');
    scheduleOptions.classList.remove('d-none');
    scheduleOptions.classList.add('d-block');
    updateSchedulePreview();
  }
}

// Update schedule type and show/hide relevant options
function updateScheduleType() {
  const scheduleType = document.getElementById('scheduleType').value;
  jiraState.autoSync.scheduleType = scheduleType;
  
  // Hide all schedule-specific options
  const weeklyOptions = document.getElementById('weeklyOptions');
  const monthlyOptions = document.getElementById('monthlyOptions');
  const yearlyOptions = document.getElementById('yearlyOptions');
  
  weeklyOptions.classList.remove('d-block');
  weeklyOptions.classList.add('d-none');
  monthlyOptions.classList.remove('d-block');
  monthlyOptions.classList.add('d-none');
  yearlyOptions.classList.remove('d-block');
  yearlyOptions.classList.add('d-none');
  
  // Show relevant options based on schedule type
  if (scheduleType === 'weekly') {
    weeklyOptions.classList.remove('d-none');
    weeklyOptions.classList.add('d-block');
  } else if (scheduleType === 'monthly') {
    monthlyOptions.classList.remove('d-none');
    monthlyOptions.classList.add('d-block');
  } else if (scheduleType === 'yearly') {
    yearlyOptions.classList.remove('d-none');
    yearlyOptions.classList.add('d-block');
  }
  
  updateSchedulePreview();
}

// Update schedule time
function updateScheduleTime() {
  jiraState.autoSync.scheduleTime = document.getElementById('scheduleTime').value;
  updateSchedulePreview();
}

// Update day of week
function updateScheduleDayOfWeek() {
  jiraState.autoSync.scheduleDayOfWeek = parseInt(document.getElementById('scheduleDayOfWeek').value);
  updateSchedulePreview();
}

// Update day of month
function updateScheduleDayOfMonth() {
  jiraState.autoSync.scheduleDayOfMonth = parseInt(document.getElementById('scheduleDayOfMonth').value);
  updateSchedulePreview();
}

// Update month
function updateScheduleMonth() {
  jiraState.autoSync.scheduleMonth = parseInt(document.getElementById('scheduleMonth').value);
  updateSchedulePreview();
}

// Update yearly day
function updateScheduleYearlyDay() {
  jiraState.autoSync.scheduleYearlyDay = parseInt(document.getElementById('scheduleYearlyDay').value);
  updateSchedulePreview();
}

// Update schedule preview
function updateSchedulePreview() {
  const previewDiv = document.getElementById('schedulePreview');
  const previewText = document.getElementById('schedulePreviewText');
  
  if (jiraState.autoSync.mode === 'scheduled') {
    const type = jiraState.autoSync.scheduleType;
    const time = jiraState.autoSync.scheduleTime;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    let preview = '';
    
    if (type === 'daily') {
      preview = `Daily at ${time}`;
    } else if (type === 'weekly') {
      const day = days[jiraState.autoSync.scheduleDayOfWeek];
      preview = `Every ${day} at ${time}`;
    } else if (type === 'monthly') {
      const day = jiraState.autoSync.scheduleDayOfMonth;
      const suffix = (day === 1 || day === 21 || day === 31) ? 'st' : (day === 2 || day === 22) ? 'nd' : (day === 3 || day === 23) ? 'rd' : 'th';
      preview = `On the ${day}${suffix} of every month at ${time}`;
    } else if (type === 'yearly') {
      const month = months[jiraState.autoSync.scheduleMonth];
      const day = jiraState.autoSync.scheduleYearlyDay;
      const suffix = (day === 1 || day === 21 || day === 31) ? 'st' : (day === 2 || day === 22) ? 'nd' : (day === 3 || day === 23) ? 'rd' : 'th';
      preview = `Every ${month} ${day}${suffix} at ${time}`;
    }
    
    previewText.textContent = preview;
    previewDiv.classList.remove('d-none');
    previewDiv.classList.add('d-block');
  } else {
    previewDiv.classList.remove('d-block');
    previewDiv.classList.add('d-none');
  }
}

// Update auto-sync interval
function updateAutoSyncInterval() {
  const interval = parseInt(document.getElementById('autoSyncInterval').value);
  jiraState.autoSync.interval = interval;
}

// Save auto-sync settings
async function saveAutoSyncSettings(showToast = true) {
  const enabled = document.getElementById('autoSyncEnabled').checked;
  const mode = document.getElementById('autoSyncMode').value;
  const interval = parseInt(document.getElementById('autoSyncInterval').value);
  
  // Prepare request body
  const requestBody = {
    enabled: enabled,
    mode: mode,
    sync_interval: interval,
    schedule_type: jiraState.autoSync.scheduleType,
    schedule_time: jiraState.autoSync.scheduleTime,
    schedule_day_of_week: jiraState.autoSync.scheduleDayOfWeek,
    schedule_day_of_month: jiraState.autoSync.scheduleDayOfMonth,
    schedule_month: jiraState.autoSync.scheduleMonth,
    schedule_yearly_day: jiraState.autoSync.scheduleYearlyDay
  };
  
  // Include last_run and next_run if available
  if (jiraState.autoSync.lastRun) {
    requestBody.last_run = jiraState.autoSync.lastRun.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  // Calculate next run based on mode
  const nextRun = calculateNextRun();
  if (nextRun) {
    requestBody.next_run = nextRun.toISOString().slice(0, 19).replace('T', ' ');
    jiraState.autoSync.nextRun = nextRun;
  }
  
  try {
    const response = await jiraFetch('JIRA/auto-sync.api.php?action=save', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(requestBody)
    });
    
    const result = await response.json();
    
    if (result.success) {
      jiraState.autoSync.enabled = enabled;
      jiraState.autoSync.mode = mode;
      jiraState.autoSync.interval = interval;
      
      if (enabled) {
        startAutoSyncTimer();
        if (showToast) toast('Auto-sync enabled successfully', 'success');
      } else {
        stopAutoSyncTimer();
        if (showToast) toast('Auto-sync disabled', 'info');
      }
      
      updateAutoSyncDisplay();
    } else {
      if (showToast) toast('Failed to save auto-sync settings: ' + result.error, 'error');
    }
  } catch (error) {
    if (showToast) toast('Failed to save auto-sync settings', 'error');
  }
}

// Calculate next run time based on mode and schedule
function calculateNextRun() {
  if (!jiraState.autoSync.enabled) {
    return null;
  }
  
  const now = new Date();
  
  if (jiraState.autoSync.mode === 'interval') {
    // Interval mode: add interval seconds to current time
    return new Date(now.getTime() + (jiraState.autoSync.interval * 1000));
  } else {
    // Scheduled mode: calculate next occurrence
    const [hours, minutes] = jiraState.autoSync.scheduleTime.split(':').map(Number);
    let nextRun = new Date(now);
    
    if (jiraState.autoSync.scheduleType === 'daily') {
      // Daily: today at specified time, or tomorrow if time has passed
      nextRun.setHours(hours, minutes, 0, 0);
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
    } else if (jiraState.autoSync.scheduleType === 'weekly') {
      // Weekly: next occurrence of specified day and time
      const targetDay = jiraState.autoSync.scheduleDayOfWeek;
      const currentDay = nextRun.getDay();
      let daysUntil = targetDay - currentDay;
      
      if (daysUntil < 0 || (daysUntil === 0 && now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes)) {
        daysUntil += 7;
      }
      
      nextRun.setDate(nextRun.getDate() + daysUntil);
      nextRun.setHours(hours, minutes, 0, 0);
    } else if (jiraState.autoSync.scheduleType === 'monthly') {
      // Monthly: next occurrence of specified day of month at time
      const targetDay = jiraState.autoSync.scheduleDayOfMonth;
      nextRun.setDate(targetDay);
      nextRun.setHours(hours, minutes, 0, 0);
      
      if (nextRun <= now) {
        // Move to next month
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
    } else if (jiraState.autoSync.scheduleType === 'yearly') {
      // Yearly: next occurrence of specified month and day at time
      const targetMonth = jiraState.autoSync.scheduleMonth;
      const targetDay = jiraState.autoSync.scheduleYearlyDay;
      nextRun.setMonth(targetMonth);
      nextRun.setDate(targetDay);
      nextRun.setHours(hours, minutes, 0, 0);
      
      if (nextRun <= now) {
        // Move to next year
        nextRun.setFullYear(nextRun.getFullYear() + 1);
      }
    }
    
    return nextRun;
  }
}

// Run auto-sync now
async function runAutoSyncNow() {
  // Check if JIRA is fully configured
  if (!jiraState.config || !jiraState.config.is_configured) {
    toast('Please configure JIRA connection first', 'warning');
    return;
  }
  
  if (!jiraState.config.jira_url || !jiraState.config.jira_project_key) {
    toast('JIRA configuration incomplete. Please configure JIRA first.', 'warning');
    return;
  }
  
  toast('Running auto-sync...', 'info');
  
  const jql = `project = ${jiraState.config.jira_project_key} ORDER BY updated DESC`;
  let runId = null;
  let storiesTotal = 0;
  let storiesSynced = 0;
  let storiesFailed = 0;
  
  try {
    // Start sync run log
    runId = await startSyncRunLog('manual', 'user', jql);
    
    // Use the same sync function but with default JQL
    // Add timeout to prevent hanging
    const syncTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sync operation timed out after 5 minutes')), 300000);
    });
    
    const result = await Promise.race([syncJiraStories(jql), syncTimeout]);
    
    // Extract results if available
    if (result && result.success && result.data) {
      storiesTotal = result.data.total || 0;
      storiesSynced = result.data.synced || 0;
      storiesFailed = Math.max(0, storiesTotal - storiesSynced);
    }
    
    // Update last run time
    jiraState.autoSync.lastRun = new Date();
    
    // Save last run time to backend (without waiting)
    saveAutoSyncSettings(false);
    
    updateAutoSyncDisplay();
    
    // End sync run log with success
    if (runId) {
      await endSyncRunLog(runId, 'success', storiesTotal, storiesSynced, storiesFailed);
    }
    
    toast('Auto-sync completed successfully', 'success');
  } catch (error) {
    console.error('Auto-sync error:', error);
    
    // End sync run log with error
    if (runId) {
      await endSyncRunLog(runId, 'error', storiesTotal, storiesSynced, storiesFailed, error.message || 'Unknown error');
    }
    
    toast('Auto-sync failed: ' + (error.message || 'Unknown error'), 'error');
  }
}

// Start auto-sync timer
function startAutoSyncTimer() {
  stopAutoSyncTimer(); // Clear any existing timer
  
  if (!jiraState.autoSync.enabled || !jiraState.config.jira_url) {
    return;
  }
  
  if (jiraState.autoSync.mode === 'interval') {
    // Interval mode: run every X seconds
    const intervalMs = jiraState.autoSync.interval * 1000;
    
    autoSyncTimer = setInterval(async () => {
      const jql = `project = ${jiraState.config.jira_project_key} ORDER BY updated DESC`;
      let runId = null;
      let storiesTotal = 0;
      let storiesSynced = 0;
      let storiesFailed = 0;
      
      try {
        // Start sync run log
        runId = await startSyncRunLog('interval', 'system', jql);
        
        const result = await syncJiraStories(jql);
        
        // Extract results if available
        if (result && result.data) {
          storiesTotal = result.data.total || 0;
          storiesSynced = result.data.synced || 0;
          storiesFailed = Math.max(0, storiesTotal - storiesSynced);
        }
        
        jiraState.autoSync.lastRun = new Date();
        jiraState.autoSync.nextRun = calculateNextRun();
        
        // Save last run time to backend (without waiting)
        saveAutoSyncSettings(false);
        
        updateAutoSyncDisplay();
        
        // End sync run log with success
        if (runId) {
          await endSyncRunLog(runId, 'success', storiesTotal, storiesSynced, storiesFailed);
        }
      } catch (error) {
        // End sync run log with error
        if (runId) {
          await endSyncRunLog(runId, 'error', storiesTotal, storiesSynced, storiesFailed, error.message || 'Background sync error');
        }
        // Silent fail for background sync
      }
    }, intervalMs);
    
    // Calculate next run
    jiraState.autoSync.nextRun = calculateNextRun();
    updateAutoSyncDisplay();
  } else {
    // Scheduled mode: check every minute if it's time to run
    autoSyncTimer = setInterval(async () => {
      const now = new Date();
      const nextRun = jiraState.autoSync.nextRun;
      
      // Check if it's time to run (within 1 minute tolerance)
      if (nextRun && now >= new Date(nextRun.getTime() - 30000)) {
        const jql = `project = ${jiraState.config.jira_project_key} ORDER BY updated DESC`;
        let runId = null;
        let storiesTotal = 0;
        let storiesSynced = 0;
        let storiesFailed = 0;
        
        try {
          // Start sync run log
          runId = await startSyncRunLog('scheduled', 'system', jql);
          
          const result = await syncJiraStories(jql);
          
          // Extract results if available
          if (result && result.data) {
            storiesTotal = result.data.total || 0;
            storiesSynced = result.data.synced || 0;
            storiesFailed = Math.max(0, storiesTotal - storiesSynced);
          }
          
          jiraState.autoSync.lastRun = new Date();
          jiraState.autoSync.nextRun = calculateNextRun();
          
          // Save last run time to backend (without waiting)
          saveAutoSyncSettings(false);
          
          updateAutoSyncDisplay();
          
          // End sync run log with success
          if (runId) {
            await endSyncRunLog(runId, 'success', storiesTotal, storiesSynced, storiesFailed);
          }
        } catch (error) {
          // End sync run log with error
          if (runId) {
            await endSyncRunLog(runId, 'error', storiesTotal, storiesSynced, storiesFailed, error.message || 'Scheduled sync error');
          }
          // Silent fail for background sync
        }
      }
    }, 60000); // Check every minute
    
    // Calculate next run
    jiraState.autoSync.nextRun = calculateNextRun();
    updateAutoSyncDisplay();
  }
}

// Stop auto-sync timer
function stopAutoSyncTimer() {
  if (autoSyncTimer) {
    clearInterval(autoSyncTimer);
    autoSyncTimer = null;
  }
  
  jiraState.autoSync.nextRun = null;
  updateAutoSyncDisplay();
}

// Update auto-sync display
function updateAutoSyncDisplay() {
  // Update stat card
  const statElement = document.getElementById('jiraStatAutoSync');
  if (statElement) {
    if (jiraState.autoSync.enabled) {
      statElement.textContent = 'ON';
      statElement.style.color = '#10b981';
    } else {
      statElement.textContent = 'OFF';
      statElement.style.color = '#6b7280';
    }
  }
  
  // Update last run
  const lastRunElement = document.getElementById('autoSyncLastRun');
  if (lastRunElement) {
    if (jiraState.autoSync.lastRun) {
      lastRunElement.textContent = jiraState.autoSync.lastRun.toLocaleString();
    } else {
      lastRunElement.textContent = 'Never';
    }
  }
  
  // Update next run
  const nextRunElement = document.getElementById('autoSyncNextRun');
  if (nextRunElement) {
    if (jiraState.autoSync.nextRun && jiraState.autoSync.enabled) {
      nextRunElement.textContent = jiraState.autoSync.nextRun.toLocaleString();
    } else {
      nextRunElement.textContent = jiraState.autoSync.enabled ? 'Calculating...' : 'Not scheduled';
    }
  }
}

// ========================================
// SYNC RUN TRACKING FUNCTIONALITY
// ========================================

// Start a sync run log
async function startSyncRunLog(runType = 'manual', triggerSource = 'user', jqlQuery = '') {
  try {
    const response = await jiraFetch('JIRA/auto-sync.api.php?action=start-run', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        run_type: runType,
        trigger_source: triggerSource,
        jql_query: jqlQuery,
        sync_settings_id: jiraState.autoSync.settingsId || null
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      currentSyncRunId = result.data.run_id;
      return currentSyncRunId;
    } else {
      console.error('Failed to start sync run log:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error starting sync run log:', error);
    return null;
  }
}

// End a sync run log
async function endSyncRunLog(runId, status = 'success', storiesTotal = 0, storiesSynced = 0, storiesFailed = 0, errorMessage = null) {
  if (!runId) {
    return;
  }
  
  try {
    const response = await jiraFetch('JIRA/auto-sync.api.php?action=end-run', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        run_id: runId,
        status: status,
        stories_total: storiesTotal,
        stories_synced: storiesSynced,
        stories_failed: storiesFailed,
        error_message: errorMessage
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Refresh sync runs display
      loadSyncRuns(true);
      return true;
    } else {
      console.error('Failed to end sync run log:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error ending sync run log:', error);
    return false;
  } finally {
    if (runId === currentSyncRunId) {
      currentSyncRunId = null;
    }
  }
}

// Load sync run history
async function loadSyncRuns(refresh = false) {
  // Check if elements exist (may not exist on other tabs)
  const tableBody = document.getElementById('syncRunsTableBody');
  if (!tableBody) {
    return; // Not on JIRA tab, skip
  }
  
  if (refresh) {
    tableBody.innerHTML = '';
  }
  
  try {
    // Load all sync runs (limit 100 to prevent performance issues)
    const response = await jiraFetch(`JIRA/auto-sync.api.php?action=get-runs&limit=100&offset=0`);
    
    // Check if response is ok
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.data) {
      displaySyncRuns(result.data.runs, result.data.total);
    } else {
      showSyncRunsError('Failed to load sync history');
    }
  } catch (error) {
    console.error('Error loading sync runs:', error);
    showSyncRunsError('Error loading sync history');
  }
}

// Display sync runs in the table
function displaySyncRuns(runs, total) {
  const tableBody = document.getElementById('syncRunsTableBody');
  const table = document.getElementById('syncRunsTable');
  const loading = document.getElementById('syncRunsLoading');
  const empty = document.getElementById('syncRunsEmpty');
  
  // Null checks - elements may not exist
  if (!tableBody || !table || !loading || !empty) {
    return;
  }
  
  loading.classList.add('d-none');
  
  if (total === 0) {
    table.classList.add('d-none');
    empty.classList.remove('d-none');
    empty.classList.add('d-block');
    return;
  }
  
  table.classList.remove('d-none');
  table.classList.add('d-block');
  empty.classList.add('d-none');
  
  tableBody.innerHTML = '';
  
  runs.forEach(run => {
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid var(--border)';
    row.style.cursor = 'pointer';
    row.onclick = () => showSyncRunDetails(run);
    
    // Format date with day of week
    let dateDisplay = 'Unknown';
    let dayOfWeek = '';
    let dateStr = '';
    let timeStr = '';
    
    if (run.start_time) {
      const date = new Date(run.start_time);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayOfWeek = days[date.getDay()];
      
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      dateStr = `${day}/${month}`;
      
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      timeStr = `${hours}:${minutes}`;
      
      dateDisplay = `${dayOfWeek}, ${dateStr}`;
    }
    
    // Status styling
    let statusColor = '#6b7280';
    let statusIcon = '⏸️';
    
    switch (run.status) {
      case 'success':
        statusColor = '#10b981';
        statusIcon = '✅';
        break;
      case 'error':
        statusColor = '#ef4444';
        statusIcon = '❌';
        break;
      case 'running':
        statusColor = '#3b82f6';
        statusIcon = '🔄';
        break;
      case 'timeout':
        statusColor = '#f59e0b';
        statusIcon = '⏰';
        break;
    }
    
    // Type styling
    let typeColor = '#6b7280';
    let typeIcon = '👤';
    
    switch (run.run_type) {
      case 'manual':
        typeColor = '#3b82f6';
        typeIcon = '👤';
        break;
      case 'interval':
        typeColor = '#10b981';
        typeIcon = '⏱️';
        break;
      case 'scheduled':
        typeColor = '#8b5cf6';
        typeIcon = '📅';
        break;
    }
    
    // Add status indicators
    let statusIndicator = '';
    let statusBg = '';
    let statusText = '';
    
    switch(run.status) {
      case 'success':
        statusIndicator = '✓';
        statusText = 'success';
        statusBg = 'background: rgba(34, 197, 94, 0.3); color: #22c55e;';
        break;
      case 'completed':
        statusIndicator = '✓';
        statusText = 'OK';
        statusBg = 'background: rgba(34, 197, 94, 0.3); color: #22c55e;';
        break;
      case 'error':
      case 'failed':
        statusIndicator = '✗';
        statusText = 'error';
        statusBg = 'background: rgba(239, 68, 68, 0.3); color: #ef4444;';
        break;
      case 'running':
        statusIndicator = '⟳';
        statusText = 'RUN';
        statusBg = 'background: rgba(59, 130, 246, 0.3); color: #3b82f6;';
        break;
      default:
        statusIndicator = '?';
        statusText = run.status || 'UNK';
        statusBg = 'background: rgba(156, 163, 175, 0.3); color: #9ca3af;';
        break;
    }
    
    row.innerHTML = `
      <td>
        <div style="font-weight:500;font-size:10px;white-space:nowrap;">${dayOfWeek} ${dateStr} ${timeStr}</div>
      </td>
      <td>
        <div style="font-weight:600; color: var(--accent); font-size:12px;">${run.run_type.substring(0,1).toUpperCase()}</div>
      </td>
      <td>
        <div style="font-weight:600; font-size:12px;">${run.stories_synced || 0}</div>
      </td>
      <td style="${statusBg} border-radius: 3px;">
        <div style="font-weight:600; font-size:10px;">${statusText}</div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Show sync run details in a modal/tooltip
function showSyncRunDetails(run) {
  const details = `
Run ID: ${run.id}
Type: ${run.run_type}
Trigger: ${run.trigger_source}
Start Time: ${run.start_time ? new Date(run.start_time).toLocaleString() : 'Unknown'}
End Time: ${run.end_time ? new Date(run.end_time).toLocaleString() : 'Not finished'}
Duration: ${run.duration_seconds ? run.duration_seconds + ' seconds' : 'N/A'}
Status: ${run.status}
Stories Total: ${run.stories_total || 0}
Stories Synced: ${run.stories_synced || 0}
Stories Failed: ${run.stories_failed || 0}
${run.error_message ? '\nError: ' + run.error_message : ''}
${run.jql_query ? '\nJQL: ' + run.jql_query : ''}
  `.trim();
  
  alert(details); // Simple alert for now - could be improved with a proper modal
}

// Show sync runs error
function showSyncRunsError(message) {
  const container = document.getElementById('syncRunsContainer');
  if (!container) {
    return; // Element doesn't exist
  }
  
  container.innerHTML = `
    <div style="text-align:center;padding:40px;color:#ef4444;">
      <div style="font-size:24px;margin-bottom:8px;">⚠️</div>
      ${message}
    </div>
  `;
}

// Refresh sync runs (called by refresh button)
function refreshSyncRuns() {
  const loading = document.getElementById('syncRunsLoading');
  const table = document.getElementById('syncRunsTable');
  const empty = document.getElementById('syncRunsEmpty');
  
  if (!loading || !table || !empty) {
    return; // Elements don't exist
  }
  
  loading.classList.remove('d-none');
  loading.classList.add('d-block');
  table.classList.add('d-none');
  empty.classList.add('d-none');
  loadSyncRuns(true);
}
