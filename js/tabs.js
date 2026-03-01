// Tab Navigation
function switchTab(idx) {
  // Save scroll position of current tab before switching
  if (state.currentTab !== undefined && state.currentTab >= 0 && state.currentTab <= 6) {
    if (!state.tabScrollPositions) state.tabScrollPositions = {};
    state.tabScrollPositions[state.currentTab] = window.pageYOffset || document.documentElement.scrollTop;
  }
  
  state.currentTab = idx;
  saveState();
  
  [0, 1, 2, 3, 4, 5, 6].forEach(i => {
    document.getElementById('tab' + i).classList.toggle('active', i === idx);
    document.getElementById('panel' + i).classList.toggle('active', i === idx);
  });
  
  // Restore scroll position for the new tab
  setTimeout(() => {
    if (state.tabScrollPositions && state.tabScrollPositions[idx] !== undefined) {
      window.scrollTo({
        top: state.tabScrollPositions[idx],
        behavior: 'instant'
      });
    } else {
      // If no saved scroll position, scroll to top
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
    }
  }, 100);
  
  if (idx === 0) setTimeout(() => {
    renderCharts();
    // Show all charts immediately
    if (typeof showAllChartsImmediately !== 'undefined') {
      setTimeout(showAllChartsImmediately, 100);
    }
  }, 120);
  if (idx === 1) setTimeout(renderTable, 120);
  if (idx === 2) setTimeout(() => {
    renderDetailedSummary();
    // Show all charts immediately
    if (typeof showAllChartsImmediately !== 'undefined') {
      setTimeout(showAllChartsImmediately, 100);
    }
  }, 120);
  if (idx === 4) setTimeout(renderSprintCalendarCard, 120);
  if (idx === 5) setTimeout(() => {
    // Initialize JIRA tab
    if (typeof initJiraTab === 'function') initJiraTab();
  }, 120);
  if (idx === 6) setTimeout(() => {
    // Reload configuration form values when switching to config tab
    if (typeof loadHyperlinkSettings === 'function') loadHyperlinkSettings();
    if (typeof loadBrandingLabels === 'function') loadBrandingLabels();
    if (typeof loadTabLabels === 'function') loadTabLabels();
    if (typeof loadFontSettings === 'function') loadFontSettings();
    if (typeof loadDownloadFilename === 'function') loadDownloadFilename();
    // Re-render configuration lists
    if (typeof renderPicklistTags === 'function') renderPicklistTags();
    if (typeof renderColumnToggles === 'function') renderColumnToggles();
    if (typeof renderCustomColList === 'function') renderCustomColList();
    if (typeof renderTagsManagement === 'function') renderTagsManagement();
    if (typeof renderSprintColorsManagement === 'function') renderSprintColorsManagement();
    if (typeof loadIPWhitelist === 'function') loadIPWhitelist(); // Load IP Whitelist settings
    // Update logo display
    if (typeof initializeLogo === 'function') initializeLogo();
  }, 120);
}
