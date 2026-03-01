// Initialization Functions

// Data Recovery Checker - Called if no records are found
function checkIfDataRecoveryNeeded() {
  // Check localStorage for any backup data
  try {
    const savedData = localStorage.getItem('sprintTrackerData');
    if (savedData) {
      const data = JSON.parse(savedData);
      if (data && data.records && data.records.length > 0) {
        // Auto-clear old localStorage data and start fresh with database
        localStorage.removeItem('sprintTrackerData');
        // Don't reload, just continue with empty state from database
        return;
      }
    }
  } catch (error) {
  }
  
  // No warning needed for fresh install - both sources empty is normal
}

function init() {
  loadState(); // Load from database first
  initializeDefaultTags(); // Then merge default tags with loaded tags
  ensureTagsColumn();
  renderFormGrid();
  populateSelectsFromState();
  renderPicklistTags();
  // renderColumnToggles(); // Moved to loadState() completion handler
  renderCustomColList();
  renderTableHeader();
  renderTable();
  updateKPIs();
  renderCharts();
  updateRecordCount();
  // NOTE: Configuration load functions moved to loadState() completion handler
  // so they populate forms AFTER database data loads
  renderCustomFormFields();
  renderTagsFormField();
  renderTagsManagement();
  renderNotes();
  renderBackgroundSettings();
  renderMatrixSettings();
  renderAutomatedStatusCard();
  renderSprintCalendarCard();
  applyBackground();
  // Don't render backup settings here - it will be rendered after loadState completes
  
  // Initialize custom dropdown close on outside click
  initializeCustomDropdowns();
  
  // Apply saved colors after a short delay to ensure DOM is ready
  setTimeout(() => {
    applySavedColors();
    // Show all charts immediately after initial render
    if (typeof showAllChartsImmediately !== 'undefined') {
      setTimeout(showAllChartsImmediately, 100);
    }
    // Show initialization complete notification
    toast('Application initialized and ready to use', 'success');
  }, 100);
}

// Close custom dropdowns when clicking outside
function initializeCustomDropdowns() {
  document.addEventListener('click', function(event) {
    const fontDropdown = document.getElementById('fontFamilyDropdown');
    if (fontDropdown && !fontDropdown.contains(event.target)) {
      fontDropdown.classList.remove('open');
    }
  });
}

function ensureTagsColumn() {
  // Check if tags column exists
  const tagsColumnExists = state.columns.some(col => col.key === 'tags');
  
  if (!tagsColumnExists) {
    // Add tags column after comments
    const commentsIndex = state.columns.findIndex(col => col.key === 'comments');
    if (commentsIndex >= 0) {
      state.columns.splice(commentsIndex + 1, 0, {
        key: 'tags',
        label: 'Tags',
        visible: true,
        system: true
      });
    } else {
      // If comments doesn't exist, just add at the end
      state.columns.push({
        key: 'tags',
        label: 'Tags',
        visible: true,
        system: true
      });
    }
    saveState();
  }
}

function updateRecordCount() {
  document.getElementById('recordCount').textContent = state.records.length + ' records';
}
