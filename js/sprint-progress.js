// ============================================
// Sprint Progress - Modern Redesign
// ============================================

// Helper function to convert hex color to RGB values
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

// Get current/active PI (highest PI number with active or upcoming sprints)
function getCurrentActivePIs() {
  const sprints = extractSprintsFromRecords();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const piData = {};
  
  sprints.forEach(sprint => {
    if (!sprint.startDate || !sprint.endDate) return;
    
    const pi = sprint.pi || 'No PI';
    const endDate = new Date(sprint.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    if (!piData[pi]) {
      piData[pi] = {
        piNumber: parseInt(pi.match(/\d+/)?.[0] || 0),
        latestEndDate: endDate,
        hasActiveSprints: false
      };
    }
    
    if (endDate > piData[pi].latestEndDate) {
      piData[pi].latestEndDate = endDate;
    }
    
    // Check if sprint is active or upcoming
    if (endDate >= today) {
      piData[pi].hasActiveSprints = true;
    }
  });
  
  // Find the active PIs (ones with active/upcoming sprints)
  const activePIs = Object.keys(piData)
    .filter(pi => piData[pi].hasActiveSprints)
    .sort((a, b) => piData[b].piNumber - piData[a].piNumber);
  
  return activePIs;
}

// Render sprint progress bars section
function renderSprintProgressSection() {
  const sprints = extractSprintsFromRecords();
  
  // Filter only sprints with dates
  const sprintsWithDates = sprints.filter(s => s.startDate && s.endDate);
  
  if (sprintsWithDates.length === 0) {
    return `
      <div class="sprint-progress-container">
        <div class="sprint-progress-header">
          <div class="sprint-progress-header-title">
            <span class="sprint-progress-header-icon">📊</span>
            <span>Sprint Progress</span>
          </div>
        </div>
        <div class="sprint-progress-empty">
          No sprints with dates found. Add dates to your sprints to see progress.
        </div>
      </div>
    `;
  }
  
  // Get current active PIs
  const activePIs = getCurrentActivePIs();
  
  // Filter sprints to show only active PI sprints
  const activeSprintsFiltered = sprintsWithDates.filter(sprint => {
    return activePIs.includes(sprint.pi || 'No PI');
  });
  
  // Deduplicate sprints by name (same sprint name = same sprint regardless of PI)
  const uniqueSprints = {};
  activeSprintsFiltered.forEach(sprint => {
    const key = sprint.name;
    if (!uniqueSprints[key]) {
      uniqueSprints[key] = sprint;
    } else {
      // Merge story, note, and linked records counts if duplicate
      uniqueSprints[key].storyCount += sprint.storyCount;
      uniqueSprints[key].noteCount += sprint.noteCount;
      uniqueSprints[key].linkedRecordsCount = (uniqueSprints[key].linkedRecordsCount || 0) + (sprint.linkedRecordsCount || 0);
    }
  });
  
  const deduplicatedSprints = Object.values(uniqueSprints);
  
  // Calculate summary stats
  const totalSprints = deduplicatedSprints.length;
  const activeSprints = deduplicatedSprints.filter(s => {
    const progress = calculateSprintProgress(s);
    return progress.status === 'active';
  }).length;
  const completedSprints = deduplicatedSprints.filter(s => {
    const progress = calculateSprintProgress(s);
    return progress.status === 'completed';
  }).length;
  const upcomingSprints = deduplicatedSprints.filter(s => {
    const progress = calculateSprintProgress(s);
    return progress.status === 'upcoming';
  }).length;
  
  // Group by PI
  const piGroups = {};
  deduplicatedSprints.forEach(sprint => {
    const pi = sprint.pi || 'No PI';
    if (!piGroups[pi]) {
      piGroups[pi] = [];
    }
    piGroups[pi].push(sprint);
  });
  
  let html = `
    <div class="sprint-progress-container">
      <div class="sprint-progress-header">
        <div class="sprint-progress-header-title">
          <span class="sprint-progress-header-icon">📊</span>
          <span>Sprint Progress Dashboard</span>
        </div>
        <div class="sprint-progress-summary">
          <div class="sprint-progress-summary-item">
            <span>📦</span>
            <span>${totalSprints} Total</span>
          </div>
          <div class="sprint-progress-summary-item">
            <span>🔄</span>
            <span>${activeSprints} Active</span>
          </div>
          <div class="sprint-progress-summary-item">
            <span>✅</span>
            <span>${completedSprints} Completed</span>
          </div>
          <div class="sprint-progress-summary-item">
            <span>⏳</span>
            <span>${upcomingSprints} Upcoming</span>
          </div>
        </div>
      </div>
      <div class="sprint-progress-list">
  `;
  
  // Sort PIs
  const sortedPIs = Object.keys(piGroups).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || 0);
    const numB = parseInt(b.match(/\d+/)?.[0] || 0);
    return numA - numB;
  });
  
  sortedPIs.forEach(pi => {
    // Sort sprints within each PI
    piGroups[pi].sort((a, b) => {
      const numA = parseInt(a.name.match(/\d+/)?.[0] || 0);
      const numB = parseInt(b.name.match(/\d+/)?.[0] || 0);
      return numA - numB;
    });
    
    piGroups[pi].forEach(sprint => {
      const progress = calculateSprintProgress(sprint);
      html += renderSprintProgressCard(sprint, progress);
    });
  });
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}

// Calculate sprint progress
function calculateSprintProgress(sprint) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Parse dates manually to avoid timezone issues
  const [startYear, startMonth, startDay] = sprint.startDate.split('-').map(Number);
  const startDate = new Date(startYear, startMonth - 1, startDay);
  startDate.setHours(0, 0, 0, 0);
  
  const [endYear, endMonth, endDay] = sprint.endDate.split('-').map(Number);
  const endDate = new Date(endYear, endMonth - 1, endDay);
  endDate.setHours(0, 0, 0, 0);
  
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const elapsedDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  let status = 'upcoming';
  let percentage = 0;
  let daysRemaining = 0;
  
  if (today < startDate) {
    // Not started yet
    status = 'upcoming';
    percentage = 0;
    daysRemaining = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
  } else if (today > endDate) {
    // Sprint ended
    status = 'completed';
    percentage = 100;
    daysRemaining = 0;
  } else {
    // Sprint in progress
    status = 'active';
    percentage = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  }
  
  return {
    status,
    percentage: Math.round(percentage),
    totalDays,
    elapsedDays: Math.max(0, elapsedDays),
    daysRemaining: Math.max(0, daysRemaining),
    startDate,
    endDate,
    today
  };
}

// Render individual sprint progress card
function renderSprintProgressCard(sprint, progress) {
  const statusClass = progress.status;
  
  // Status labels with icons
  const statusConfig = {
    'upcoming': { icon: '⏳', label: 'Upcoming' },
    'active': { icon: '🔄', label: 'Active' },
    'completed': { icon: '✅', label: 'Completed' },
    'overdue': { icon: '⚠️', label: 'Overdue' }
  };
  
  const currentStatus = statusConfig[progress.status] || { icon: '❓', label: 'Unknown' };
  
  // Time information
  let timeInfo = '';
  if (progress.status === 'upcoming') {
    timeInfo = `Starts in ${progress.daysRemaining} day${progress.daysRemaining !== 1 ? 's' : ''}`;
  } else if (progress.status === 'completed') {
    timeInfo = 'Sprint Ended';
  } else {
    timeInfo = `${progress.daysRemaining} day${progress.daysRemaining !== 1 ? 's' : ''} remaining`;
  }
  
  // Calculate today marker position (if active)
  let todayMarkerHtml = '';
  if (progress.status === 'active') {
    todayMarkerHtml = `<div class="sprint-progress-today-marker" style="left:${progress.percentage}%;"></div>`;
  }
  
  // Format dates
  const startDateFormatted = formatDate(sprint.startDate);
  const endDateFormatted = formatDate(sprint.endDate);
  
  // Determine progress bar color based on percentage
  let progressBarColor = '';
  if (progress.status === 'completed') {
    progressBarColor = '#10b981'; // Green for completed
  } else if (progress.status === 'upcoming') {
    progressBarColor = '#6b7280'; // Gray for upcoming
  } else {
    // Active sprints - color based on percentage
    if (progress.percentage < 20) {
      progressBarColor = '#10b981'; // Green
    } else if (progress.percentage < 40) {
      progressBarColor = '#22c55e'; // Light green
    } else if (progress.percentage < 60) {
      progressBarColor = '#eab308'; // Yellow
    } else if (progress.percentage < 80) {
      progressBarColor = '#f59e0b'; // Orange
    } else {
      progressBarColor = '#ef4444'; // Red
    }
  }
  
  const sprintColorRgb = hexToRgb(sprint.color);
  
  return `
    <div class="sprint-progress-item" style="--sprint-color: ${sprint.color}; --sprint-color-rgb: ${sprintColorRgb}; --progress-bar-color: ${progressBarColor};">
      <div class="sprint-progress-item-content">
        <div class="sprint-progress-item-header">
          <div class="sprint-progress-item-title">
            <div class="sprint-progress-item-name">
              <div class="sprint-progress-color-indicator"></div>
              <span>${sprint.name}</span>
            </div>
          </div>
          <div class="sprint-progress-item-pi">PI ${sprint.pi}</div>
        </div>
        
        <div class="sprint-progress-item-dates">
          ${startDateFormatted} → ${endDateFormatted}
        </div>
        
        <div class="sprint-progress-bar-wrapper">
          <div class="sprint-progress-bar-label">
            <span>Time Progress</span>
            <span class="sprint-progress-percentage">${progress.percentage}%</span>
          </div>
          <div class="sprint-progress-bar-container">
            <div class="sprint-progress-bar ${statusClass}" style="width:${progress.percentage}%;"></div>
            ${todayMarkerHtml}
          </div>
        </div>
        
        <div class="sprint-progress-stats">
          <div class="sprint-progress-stat-item">
            <span class="sprint-progress-stat-icon">📦</span>
            <span class="sprint-progress-stat-label">Records</span>
            <span class="sprint-progress-stat-value">${sprint.storyCount}</span>
          </div>
          <div class="sprint-progress-stat-item">
            <span class="sprint-progress-stat-icon">📝</span>
            <span class="sprint-progress-stat-label">Notes</span>
            <span class="sprint-progress-stat-value">${sprint.noteCount}</span>
          </div>
          ${sprint.linkedRecordsCount > 0 ? `
          <div class="sprint-progress-stat-item">
            <span class="sprint-progress-stat-icon">🔗</span>
            <span class="sprint-progress-stat-label">Links</span>
            <span class="sprint-progress-stat-value">${sprint.linkedRecordsCount}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="sprint-progress-footer">
          <div class="sprint-progress-status-badge ${statusClass}">
            <span>${currentStatus.icon}</span>
            <span>${currentStatus.label}</span>
          </div>
          <div class="sprint-progress-time-info">
            ${timeInfo}
          </div>
        </div>
      </div>
    </div>
  `;
}
