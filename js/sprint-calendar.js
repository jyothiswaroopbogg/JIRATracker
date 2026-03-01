// Sprint Calendar Functionality

// Generate color for sprint based on name
function getSprintColor(sprintName) {
  if (!state.sprintCalendar.sprintColors) {
    state.sprintCalendar.sprintColors = {};
  }
  
  // Return color from database if exists
  if (state.sprintCalendar.sprintColors[sprintName]) {
    return state.sprintCalendar.sprintColors[sprintName];
  }
  
  // Fallback: Generate a color based on sprint name hash for consistency
  const colors = [
    '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#ef4444',
    '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#06b6d4', '#a855f7',
    '#eab308', '#22c55e', '#8b5cf6', '#10b981', '#f59e0b', '#3b82f6'
  ];
  
  // Use sprint name to generate consistent index
  let hash = 0;
  for (let i = 0; i < sprintName.length; i++) {
    hash = ((hash << 5) - hash) + sprintName.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % colors.length;
  
  const color = colors[index];
  state.sprintCalendar.sprintColors[sprintName] = color;
  
  return color;
}

// Time-based vertical line updater
let timeLineUpdateInterval = null;

// Initialize time line updater
function initializeTimeLineUpdater() {
  // Clear any existing interval
  if (timeLineUpdateInterval) {
    clearInterval(timeLineUpdateInterval);
  }
  
  // Update immediately
  updateTimeLinePosition();
  
  // Update every second to show accurate time with seconds
  timeLineUpdateInterval = setInterval(updateTimeLinePosition, 1000);
}

// Update the vertical line position based on current time
function updateTimeLinePosition() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  // Calculate position based on 24-hour day
  // 00:00 (midnight) = 0%, 12:00 (noon) = 50%, 23:59 = ~100%
  const totalMinutesInDay = 24 * 60; // 1440 minutes
  const currentMinutes = hours * 60 + minutes;
  const position = (currentMinutes / totalMinutesInDay) * 100;
  
  // Format time with seconds for tooltip
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  
  // Apply the CSS variable to the root or calendar container
  const calendarContainer = document.querySelector('.sprint-calendar-day.today');
  if (calendarContainer) {
    calendarContainer.style.setProperty('--time-line-position', `${position}%`);
    calendarContainer.setAttribute('data-time', timeString);
    
    // Setup hover events for custom tooltip only once
    if (!calendarContainer.hasAttribute('data-tooltip-initialized')) {
      setupTimeTooltip(calendarContainer);
      calendarContainer.setAttribute('data-tooltip-initialized', 'true');
    }
  }
  
  // Also set it globally for all today cells
  document.documentElement.style.setProperty('--time-line-position', `${position}%`);
}

// Setup custom tooltip for time display
function setupTimeTooltip(container) {
  // Create or get tooltip element
  let tooltip = document.getElementById('timeTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'timeTooltip';
    tooltip.className = 'time-tooltip';
    document.body.appendChild(tooltip);
  }
  
  let updateInterval = null;
  
  // Mouse enter handler
  const showTooltip = (e) => {
    const currentTime = container.getAttribute('data-time') || '00:00:00';
    tooltip.textContent = currentTime;
    
    const rect = container.getBoundingClientRect();
    
    // Position tooltip above the cell, centered
    // Set position first before showing to calculate dimensions
    tooltip.style.display = 'block';
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // For position: fixed, use viewport coordinates (no scrollY needed)
    const leftPos = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    const topPos = rect.top - tooltipRect.height - 15;
    
    tooltip.style.left = `${leftPos}px`;
    tooltip.style.top = `${topPos}px`;
    
    // Add visible class with slight delay for animation
    requestAnimationFrame(() => {
      tooltip.classList.add('visible');
    });
    
    // Update tooltip time every 100ms to show running seconds
    updateInterval = setInterval(() => {
      const updatedTime = container.getAttribute('data-time') || '00:00:00';
      tooltip.textContent = updatedTime;
    }, 100);
  };
  
  // Mouse leave handler
  const hideTooltip = () => {
    tooltip.classList.remove('visible');
    
    // Clear the update interval
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
    
    // Hide after animation completes
    setTimeout(() => {
      if (!tooltip.classList.contains('visible')) {
        tooltip.style.display = 'none';
      }
    }, 300);
  };
  
  // Attach events
  container.addEventListener('mouseenter', showTooltip);
  container.addEventListener('mouseleave', hideTooltip);
}

// Initialize sprint calendar state
function initializeSprintCalendarState() {
  if (!state.sprintCalendar) {
    state.sprintCalendar = {
      currentMonth: new Date().getMonth(),
      currentYear: new Date().getFullYear(),
      sprintDates: {}, // { 'Sprint 1': { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', pi: 'PI 1' } }
      sprintColors: {}, // { 'Sprint 1': '#8b5cf6' }
      viewMode: 'month', // 'month', 'week', 'quarter'
      holidays: {}, // { 'YYYY-MM-DD': 'Holiday Name' }
      compactMode: false // true for compact view
    };
  }
  // Ensure currentMonth exists and is valid
  if (state.sprintCalendar.currentMonth === undefined || state.sprintCalendar.currentMonth === null) {
    state.sprintCalendar.currentMonth = new Date().getMonth();
  }
  // Ensure currentYear exists and is valid
  if (!state.sprintCalendar.currentYear) {
    state.sprintCalendar.currentYear = new Date().getFullYear();
  }
  if (!state.sprintCalendar.sprintColors) {
    state.sprintCalendar.sprintColors = {};
  }
  if (!state.sprintCalendar.sprintDates) {
    state.sprintCalendar.sprintDates = {};
  }
  
  // Clean up any malformed sprint keys containing 'undefined'
  if (state.sprintCalendar.sprintDates) {
    const keysToRemove = [];
    Object.keys(state.sprintCalendar.sprintDates).forEach(key => {
      if (key.includes('undefined') || key === 'undefined' || !key || key.trim() === '') {
        keysToRemove.push(key);
      }
    });
    keysToRemove.forEach(key => {
      delete state.sprintCalendar.sprintDates[key];
      if (state.sprintCalendar.sprintColors && state.sprintCalendar.sprintColors[key]) {
        delete state.sprintCalendar.sprintColors[key];
      }
    });
    if (keysToRemove.length > 0) {
      saveState(); // Save cleaned state
    }
  }
  
  if (!state.sprintCalendar.viewMode) {
    state.sprintCalendar.viewMode = 'month';
  }
  if (!state.sprintCalendar.holidays) {
    state.sprintCalendar.holidays = {};
  }
  if (state.sprintCalendar.compactMode === undefined) {
    state.sprintCalendar.compactMode = false;
  }
  
  // Initialize time-based vertical line updater
  initializeTimeLineUpdater();
}

// Render Sprint Calendar Card
function renderSprintCalendarCard() {
  const container = document.getElementById('sprintCalendarMainContainer');
  if (!container) return;

  initializeSprintCalendarState();

  const settings = state.sprintCalendar;
  const sprints = extractSprintsFromRecords();

  const uniquePIs = [...new Set(state.records.map(r => r.pi).filter(Boolean))].length;
  
  container.innerHTML = `
    <div style="padding:20px;">
      
      <!-- Stats -->
      <div class="sprint-calendar-stats">
        <div class="sprint-calendar-stat-card">
          <div class="sprint-calendar-stat-label">Total Sprints</div>
          <div class="sprint-calendar-stat-value">${sprints.length}</div>
        </div>
        <div class="sprint-calendar-stat-card">
          <div class="sprint-calendar-stat-label">Active Sprints</div>
          <div class="sprint-calendar-stat-value">${getActiveSprintCount(sprints)}</div>
        </div>
        <div class="sprint-calendar-stat-card">
          <div class="sprint-calendar-stat-label">Total PI</div>
          <div class="sprint-calendar-stat-value">${uniquePIs}</div>
        </div>
        <div class="sprint-calendar-stat-card">
          <div class="sprint-calendar-stat-label">Total Stories</div>
          <div class="sprint-calendar-stat-value">${state.records.length}</div>
        </div>
      </div>

      <!-- Sprint Progress Bars -->
      ${renderSprintProgressSection()}

      <!-- Calendar Navigation -->
      <div class="sprint-calendar-header">
        <div style="display:flex;align-items:center;gap:8px;">
          <button class="btn btn-secondary btn-sm" onclick="previousMonth()">◀</button>
          <button class="btn btn-primary btn-sm" onclick="jumpToToday()" title="Jump to Today">📅 Today</button>
          <button class="btn btn-secondary btn-sm" onclick="nextMonth()">▶</button>
        </div>
        <div class="sprint-calendar-month">${getViewTitle()}</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="btn-group" style="display:flex;gap:4px;">
            <button class="btn ${settings.viewMode === 'week' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="changeViewMode('week')" title="Week View">Week</button>
            <button class="btn ${settings.viewMode === 'month' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="changeViewMode('month')" title="Month View">Month</button>
            <button class="btn ${settings.viewMode === 'quarter' ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="changeViewMode('quarter')" title="Quarter View">Quarter</button>
          </div>
          <button class="btn ${settings.compactMode ? 'btn-primary' : 'btn-secondary'} btn-sm" onclick="toggleCompactMode()" title="Toggle Compact View">⊡ ${settings.compactMode ? 'Expand' : 'Compact'}</button>
          <button class="btn btn-secondary btn-sm" onclick="openHolidayManager()" title="Manage Holidays">🎉 Holidays</button>
          <button class="btn btn-secondary btn-sm" onclick="manualCheckReminders()" title="Check Sprint Reminders">🔔 Reminders</button>
          <button class="btn btn-primary btn-sm" onclick="openSprintReportSelector()" title="Generate Sprint Report">📄 Report</button>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div class="sprint-calendar-container" style="position:relative;">
        ${renderCalendarGrid()}
      </div>

      <!-- Legend -->
      <div class="sprint-calendar-legend">
        <div class="sprint-calendar-legend-item">
          <div class="sprint-calendar-legend-box today"></div>
          <span>Today</span>
        </div>
        ${(() => {
          const uniqueSprints = [];
          const seenNames = new Set();
          sprints.forEach(sprint => {
            if (!seenNames.has(sprint.name)) {
              seenNames.add(sprint.name);
              uniqueSprints.push(sprint);
            }
          });
          // Sort sprints numerically
          uniqueSprints.sort((a, b) => {
            const numA = parseInt(a.name) || 0;
            const numB = parseInt(b.name) || 0;
            return numA - numB;
          });
          return uniqueSprints.map((sprint, index) => `
            <div class="sprint-calendar-legend-item">
              <div class="sprint-calendar-legend-box" style="background:${sprint.color};border-color:${sprint.color};"></div>
              <span>${sprint.name}</span>
            </div>
          `).join('');
        })()}
      </div>

      <!-- Sprint List -->
      ${sprints.length > 0 ? renderSprintList(sprints) : '<div style="text-align:center;padding:20px;color:var(--text3);font-size:12px;">No sprints found in your data</div>'}
    </div>
  `;
  
  // Wait for DOM to be ready before setting up tooltip
  setTimeout(() => {
    updateTimeLinePosition();
  }, 100);
}

// Extract unique sprints from records with counts
function extractSprintsFromRecords() {
  const sprintMap = new Map();
  
  // First, add sprints from records
  state.records.forEach(record => {
    if (record.sprint_start) {
      const sprint = record.sprint_start.trim();
      const pi = record.pi || 'No PI';
      const key = `${pi}|${sprint}`; // Use PI+Sprint as unique key
      
      if (!sprintMap.has(key)) {
        // Use PI+Sprint key for dates to allow different dates per PI
        const sprintData = state.sprintCalendar?.sprintDates?.[key];
        sprintMap.set(key, {
          name: sprint,
          pi: pi,
          storyCount: 0,
          noteCount: 0,
          linkedRecordsCount: 0,
          startDate: sprintData?.start || null,
          endDate: sprintData?.end || null,
          color: getSprintColor(sprint),
          key: key // Store the key for later reference
        });
      }
      sprintMap.get(key).storyCount++;
    }
  });
  
  // Then, add sprints from calendar dates that don't have records yet
  if (state.sprintCalendar?.sprintDates) {
    Object.keys(state.sprintCalendar.sprintDates).forEach(sprintKey => {
      if (!sprintMap.has(sprintKey)) {
        const sprintData = state.sprintCalendar.sprintDates[sprintKey];
        const [pi, sprint] = sprintKey.includes('|') ? sprintKey.split('|') : ['No PI', sprintKey];
        sprintMap.set(sprintKey, {
          name: sprint,
          pi: pi,
          storyCount: 0,
          noteCount: 0,
          linkedRecordsCount: 0,
          startDate: sprintData?.start || null,
          endDate: sprintData?.end || null,
          color: getSprintColor(sprint),
          key: sprintKey
        });
      }
    });
  }

  // Count notes per sprint
  state.notes.forEach(note => {
    // Check if note has linked records
    const linkedRecordIds = state.notesRecordLinks?.[note.id];
    
    // Ensure linkedRecordIds is an array
    if (linkedRecordIds && Array.isArray(linkedRecordIds)) {
      linkedRecordIds.forEach(recordId => {
        const record = state.records.find(r => r.id === recordId);
        if (record && record.sprint_start) {
          const sprint = record.sprint_start.trim();
          const pi = record.pi || 'No PI';
          const key = `${pi}|${sprint}`;
          if (sprintMap.has(key)) {
            sprintMap.get(key).noteCount++;
          }
        }
      });
    }
  });
  
  // Count linked records per sprint
  if (state.recordLinks) {
    state.records.forEach(record => {
      if (record.sprint_start) {
        const sprint = record.sprint_start.trim();
        const pi = record.pi || 'No PI';
        const key = `${pi}|${sprint}`;
        const linkedCount = (state.recordLinks[record.id] || []).length;
        if (sprintMap.has(key) && linkedCount > 0) {
          sprintMap.get(key).linkedRecordsCount += linkedCount;
        }
      }
    });
  }

  return Array.from(sprintMap.values()).sort((a, b) => {
    // Sort by PI first, then by sprint number
    if (a.pi !== b.pi) {
      const piNumA = parseInt(a.pi.match(/\d+/)?.[0] || 0);
      const piNumB = parseInt(b.pi.match(/\d+/)?.[0] || 0);
      return piNumA - piNumB;
    }
    const numA = parseInt(a.name.match(/\d+/)?.[0] || 0);
    const numB = parseInt(b.name.match(/\d+/)?.[0] || 0);
    return numA - numB;
  });
}

// Get count of active sprints
function getActiveSprintCount(sprints) {
  if (sprints.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let activeCount = 0;
  
  sprints.forEach(sprint => {
    if (sprint.startDate && sprint.endDate) {
      const startDate = new Date(sprint.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(sprint.endDate);
      endDate.setHours(0, 0, 0, 0);
      
      // Sprint is active if today is between start and end dates
      if (today >= startDate && today <= endDate) {
        activeCount++;
      }
    }
  });
  
  return activeCount;
}

// Render calendar grid
function renderCalendarGrid() {
  const settings = state.sprintCalendar;
  
  // Route to appropriate view renderer
  if (settings.viewMode === 'week') {
    return renderWeekView();
  } else if (settings.viewMode === 'quarter') {
    return renderQuarterView();
  } else {
    return renderMonthView();
  }
}

// Render month view
function renderMonthView() {
  const settings = state.sprintCalendar;
  const firstDay = new Date(settings.currentYear, settings.currentMonth, 1);
  const lastDay = new Date(settings.currentYear, settings.currentMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  const today = new Date();
  const isCurrentMonth = today.getMonth() === settings.currentMonth && 
                         today.getFullYear() === settings.currentYear;
  const todayDate = today.getDate();

  const minHeight = settings.compactMode ? '60px' : '100px';

  let html = '<div class="sprint-calendar-grid">';
  
  // Day headers
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    html += `<div class="sprint-calendar-day-header">${day}</div>`;
  });

  // Previous month days
  const prevMonthLastDay = new Date(settings.currentYear, settings.currentMonth, 0).getDate();
  const prevMonth = settings.currentMonth === 0 ? 11 : settings.currentMonth - 1;
  const prevYear = settings.currentMonth === 0 ? settings.currentYear - 1 : settings.currentYear;
  
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sprintsOnDate = getSprintsOnDate(dateStr);
    const holiday = isHoliday(dateStr);
    
    html += `<div class="sprint-calendar-day other-month ${sprintsOnDate.length > 0 ? 'has-sprint' : ''} ${holiday ? 'holiday' : ''}" onclick="openCalendarDateModal('${dateStr}')" style="cursor:pointer;min-height:${minHeight};">
      <div class="sprint-calendar-day-number">${day}</div>
      ${holiday ? `<div class="holiday-marker" title="${state.sprintCalendar.holidays[dateStr]}">🎉</div>` : ''}
    </div>`;
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = isCurrentMonth && day === todayDate;
    const dateStr = `${settings.currentYear}-${String(settings.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sprintsOnDate = getSprintsOnDate(dateStr);
    const holiday = isHoliday(dateStr);
    
    const classes = ['sprint-calendar-day'];
    if (isToday) classes.push('today');
    if (sprintsOnDate.length > 0) classes.push('has-sprint');
    if (holiday) classes.push('holiday');

    html += `<div class="${classes.join(' ')}" onclick="openCalendarDateModal('${dateStr}')" style="cursor:pointer;min-height:${minHeight};">
      <div class="sprint-calendar-day-number">${day}</div>
      ${holiday ? `<div class="holiday-marker" title="${state.sprintCalendar.holidays[dateStr]}">🎉</div>` : ''}
    </div>`;
  }

  // Next month days to fill grid
  const totalCells = Math.ceil((startingDayOfWeek + daysInMonth) / 7) * 7;
  const remainingCells = totalCells - (startingDayOfWeek + daysInMonth);
  const nextMonth = settings.currentMonth === 11 ? 0 : settings.currentMonth + 1;
  const nextYear = settings.currentMonth === 11 ? settings.currentYear + 1 : settings.currentYear;
  
  for (let day = 1; day <= remainingCells; day++) {
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const sprintsOnDate = getSprintsOnDate(dateStr);
    const holiday = isHoliday(dateStr);
    
    html += `<div class="sprint-calendar-day other-month ${sprintsOnDate.length > 0 ? 'has-sprint' : ''} ${holiday ? 'holiday' : ''}" onclick="openCalendarDateModal('${dateStr}')" style="cursor:pointer;min-height:${minHeight};">
      <div class="sprint-calendar-day-number">${day}</div>
      ${holiday ? `<div class="holiday-marker" title="${state.sprintCalendar.holidays[dateStr]}">🎉</div>` : ''}
    </div>`;
  }

  html += '</div>';
  
  // Add sprint bars overlay (show in both compact and expanded modes)
  html += renderSprintBars(settings, startingDayOfWeek, daysInMonth);
  
  return html;
}

// Render week view
function renderWeekView() {
  const settings = state.sprintCalendar;
  const today = new Date();
  
  // Start from today and go back to Sunday
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  
  let html = '<div style="display:flex;flex-direction:column;gap:2px;">';
  
  // Render 7 days
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
    const sprintsOnDate = getSprintsOnDate(dateStr);
    const dayOfWeek = currentDate.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const isToday = currentDate.toDateString() === today.toDateString();
    const holiday = isHoliday(dateStr);
    
    html += `
      <div style="display:flex;gap:12px;padding:16px;background:${isToday ? 'rgba(0,212,255,0.15)' : 'var(--surface)'};border:2px solid ${isToday ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius-sm);cursor:pointer;transition:all 0.2s;" onclick="openCalendarDateModal('${dateStr}')" onmouseover="this.style.background='var(--surface3)'" onmouseout="this.style.background='${isToday ? 'rgba(0,212,255,0.15)' : 'var(--surface)'}'">
        <div style="min-width:120px;">
          <div style="font-size:14px;font-weight:700;color:var(--text);">${dayNames[dayOfWeek]}</div>
          <div style="font-size:20px;font-weight:700;color:${isToday ? 'var(--accent)' : 'var(--text2)'};">${currentDate.getDate()}</div>
          ${holiday ? `<div style="font-size:11px;color:var(--accent);">🎉 ${state.sprintCalendar.holidays[dateStr]}</div>` : ''}
        </div>
        <div style="flex:1;">
          ${sprintsOnDate.length > 0 ? `
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              ${sprintsOnDate.map(sprintName => `
                <span style="background:${getSprintColor(sprintName)};color:#fff;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:600;">${sprintName}</span>
              `).join('')}
            </div>
          ` : '<div style="color:var(--text3);font-size:12px;">No sprints</div>'}
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

// Render quarter view (3 months)
function renderQuarterView() {
  const settings = state.sprintCalendar;
  const quarter = Math.floor(settings.currentMonth / 3);
  const quarterStartMonth = quarter * 3;
  
  let html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">';
  
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const month = quarterStartMonth + monthOffset;
    const monthDate = new Date(settings.currentYear, month, 1);
    const daysInMonth = new Date(settings.currentYear, month + 1, 0).getDate();
    
    html += `
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
        <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;text-align:center;">${getMonthName(month)}</div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;font-size:10px;">
    `;
    
    // Day headers
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayNames.forEach(day => {
      html += `<div style="text-align:center;color:var(--text3);font-weight:600;padding:4px;">${day}</div>`;
    });
    
    // Empty cells before month starts
    const startDay = monthDate.getDay();
    for (let i = 0; i < startDay; i++) {
      html += '<div style="padding:4px;"></div>';
    }
    
    // Days of month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${settings.currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const sprintsOnDate = getSprintsOnDate(dateStr);
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === settings.currentYear;
      const holiday = isHoliday(dateStr);
      
      // Get sprint color for first sprint on this date
      let sprintColor = 'transparent';
      if (sprintsOnDate.length > 0) {
        sprintColor = getSprintColor(sprintsOnDate[0]);
        sprintColor = sprintColor + '33'; // Add transparency
      }
      const bgColor = sprintsOnDate.length > 0 ? sprintColor : (holiday ? 'rgba(255,215,0,0.1)' : 'transparent');
      
      html += `
        <div onclick="openCalendarDateModal('${dateStr}')" style="text-align:center;padding:4px;cursor:pointer;background:${bgColor};border-radius:3px;color:${isToday ? 'var(--accent)' : 'var(--text)'};font-weight:${isToday ? '700' : '400'};" onmouseover="this.style.background='var(--surface3)'" onmouseout="this.style.background='${bgColor}'">
          ${day}${holiday ? '🎉' : ''}
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

// Render sprint bars that span across dates
function renderSprintBars(settings, startingDayOfWeek, daysInMonth) {
  if (!state.sprintCalendar?.sprintDates) return '';
  
  const sprintBars = [];
  const currentMonthStart = new Date(settings.currentYear, settings.currentMonth, 1);
  const currentMonthEnd = new Date(settings.currentYear, settings.currentMonth, daysInMonth);
  
  // Process each sprint
  Object.keys(state.sprintCalendar.sprintDates).forEach(sprintKey => {
    const sprintData = state.sprintCalendar.sprintDates[sprintKey];
    if (!sprintData || !sprintData.start || !sprintData.end) return;
    
    const [startYear, startMonth, startDay] = sprintData.start.split('-').map(Number);
    const sprintStart = new Date(startYear, startMonth - 1, startDay);
    
    const [endYear, endMonth, endDay] = sprintData.end.split('-').map(Number);
    const sprintEnd = new Date(endYear, endMonth - 1, endDay);
    
    // Skip sprints that don't overlap with current month
    if (sprintEnd < currentMonthStart || sprintStart > currentMonthEnd) return;
    
    // Calculate visible start and end within current month
    const visibleStart = sprintStart < currentMonthStart ? currentMonthStart : sprintStart;
    const visibleEnd = sprintEnd > currentMonthEnd ? currentMonthEnd : sprintEnd;
    
    // Skip weekends
    let currentDate = new Date(visibleStart);
    while (currentDate <= visibleEnd) {
      const dayOfWeek = currentDate.getDay();
      
      // Find start of continuous weekday span
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        const spanStart = new Date(currentDate);
        let spanEnd = new Date(currentDate);
        
        // Extend span until weekend or end date
        while (spanEnd <= visibleEnd) {
          const nextDay = new Date(spanEnd);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayOfWeek = nextDay.getDay();
          
          if (nextDay > visibleEnd || nextDayOfWeek === 0 || nextDayOfWeek === 6) {
            break;
          }
          spanEnd = nextDay;
        }
        
        // Calculate position
        const startDayOfMonth = spanStart.getDate();
        const endDayOfMonth = spanEnd.getDate();
        
        // Grid position (after headers)
        const startCol = (startingDayOfWeek + startDayOfMonth - 1) % 7;
        const startRow = Math.floor((startingDayOfWeek + startDayOfMonth - 1) / 7) + 1;
        
        const endCol = (startingDayOfWeek + endDayOfMonth - 1) % 7;
        const endRow = Math.floor((startingDayOfWeek + endDayOfMonth - 1) / 7) + 1;
        
        const sprintName = sprintKey.includes('|') ? sprintKey.split('|')[1] : sprintKey;
        const pi = sprintKey.includes('|') ? sprintKey.split('|')[0] : '';
        const displayName = pi ? `PI ${pi} - Sprint ${sprintName}` : sprintName;
        const color = getSprintColor(sprintName);
        
        if (startRow === endRow) {
          // Single row bar
          const width = endCol - startCol + 1;
          sprintBars.push({
            sprintName: displayName,
            color,
            row: startRow,
            col: startCol,
            width: width,
            sprintKey,
            startDate: spanStart.toISOString().split('T')[0]
          });
        } else {
          // Multi-row bars
          // First row
          sprintBars.push({
            sprintName: displayName,
            color,
            row: startRow,
            col: startCol,
            width: 7 - startCol,
            sprintKey,
            startDate: spanStart.toISOString().split('T')[0]
          });
          
          // Middle rows
          for (let row = startRow + 1; row < endRow; row++) {
            sprintBars.push({
              sprintName: displayName,
              color,
              row: row,
              col: 0,
              width: 7,
              sprintKey,
              startDate: spanStart.toISOString().split('T')[0]
            });
          }
          
          // Last row
          if (endRow > startRow) {
            sprintBars.push({
              sprintName: displayName,
              color,
              row: endRow,
              col: 0,
              width: endCol + 1,
              sprintKey,
              startDate: spanStart.toISOString().split('T')[0]
            });
          }
        }
        
        // Move to day after span end
        currentDate = new Date(spanEnd);
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  });
  
  // Group bars by row for stacking
  const barsByRow = {};
  sprintBars.forEach(bar => {
    if (!barsByRow[bar.row]) barsByRow[bar.row] = [];
    barsByRow[bar.row].push(bar);
  });
  
  // Render bars as absolute positioned overlay
  let html = '';
  Object.keys(barsByRow).forEach(row => {
    barsByRow[row].forEach((bar, index) => {
      // Calculate position based on grid and compact mode
      // Compact mode: 60px + 2px gap = 62px per row
      // Normal mode: 100px + 2px gap = 102px per row
      const rowHeight = settings.compactMode ? 62 : 102;
      const headerHeight = 36; // Approximate header height
      const barTopPadding = settings.compactMode ? 20 : 30; // Less padding in compact mode
      const topOffset = headerHeight + ((parseInt(row) - 1) * rowHeight) + barTopPadding + (index * 20);
      
      // Calculate left position and width based on columns
      const colWidth = 100 / 7; // Percentage width per column
      const leftOffset = (bar.col * colWidth);
      const widthPercent = (bar.width * colWidth) - 0.5;
      
      html += `
        <div style="
          position:absolute;
          top:${topOffset}px;
          left:${leftOffset}%;
          width:${widthPercent}%;
          height:16px;
          background:${bar.color};
          border-radius:4px;
          display:flex;
          align-items:center;
          padding:0 6px;
          font-size:10px;
          font-weight:600;
          color:#fff;
          pointer-events:none;
          z-index:20;
          box-shadow:0 1px 3px rgba(0,0,0,0.3);
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        " title="${bar.sprintName}">
          ${bar.sprintName}
        </div>
      `;
    });
  });
  
  return html;
}

// Get sprints that are active on a specific date
function getSprintsOnDate(dateStr) {
  const sprints = [];
  
  // Parse date string as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  
  // Skip weekends (Saturday=6, Sunday=0)
  const dayOfWeek = targetDate.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return sprints; // Return empty array for weekends
  }
  
  if (!state.sprintCalendar?.sprintDates) return sprints;
  
  Object.keys(state.sprintCalendar.sprintDates).forEach(sprintKey => {
    const sprintData = state.sprintCalendar.sprintDates[sprintKey];
    if (sprintData && sprintData.start && sprintData.end) {
      const [startYear, startMonth, startDay] = sprintData.start.split('-').map(Number);
      const startDate = new Date(startYear, startMonth - 1, startDay);
      
      const [endYear, endMonth, endDay] = sprintData.end.split('-').map(Number);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      if (targetDate >= startDate && targetDate <= endDate) {
        // Extract sprint name from key (format: "PI|Sprint" or just "Sprint")
        const sprintName = sprintKey.includes('|') ? sprintKey.split('|')[1] : sprintKey;
        sprints.push(sprintName);
      }
    }
  });
  
  return sprints;
}

// Check if any sprint has activity on this date (legacy function)
function hasSprintOnDate(year, month, day) {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return getSprintsOnDate(dateStr).length > 0;
}

// Render sprint list grouped by PI
function renderSprintList(sprints) {
  // Group sprints by PI
  const piGroups = {};
  sprints.forEach(sprint => {
    const pi = sprint.pi || 'No PI';
    if (!piGroups[pi]) {
      piGroups[pi] = [];
    }
    piGroups[pi].push(sprint);
  });

  let html = `
    <div style="margin-top:16px;">
      <div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:16px;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);">
        📋 All PI Table
      </div>
  `;
  
  Object.keys(piGroups).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || 0);
    const numB = parseInt(b.match(/\d+/)?.[0] || 0);
    return numA - numB;
  }).forEach(pi => {
    const piSprints = piGroups[pi];
    const totalStories = piSprints.reduce((sum, s) => sum + s.storyCount, 0);
    const totalNotes = piSprints.reduce((sum, s) => sum + s.noteCount, 0);
    const totalLinkedRecords = piSprints.reduce((sum, s) => sum + (s.linkedRecordsCount || 0), 0);
    const piId = pi.replace(/\s+/g, '-');
    
    html += `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:16px;overflow:hidden;">
        <div onclick="togglePISection('${piId}')" style="background:rgba(0,212,255,0.1);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='rgba(0,212,255,0.15)';" onmouseout="this.style.background='rgba(0,212,255,0.1)';">
          <div style="display:flex;align-items:center;gap:12px;">
            <span id="pi-arrow-${piId}" style="font-size:14px;transition:transform 0.2s;display:inline-block;">▼</span>
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--accent);margin-bottom:4px;">📊 ${pi}</div>
              <div style="font-size:11px;color:var(--text3);">${piSprints.length} ${piSprints.length === 1 ? 'sprint' : 'sprints'} • 📦 ${totalStories} stories • 📝 ${totalNotes} notes${totalLinkedRecords > 0 ? ` • 🔗 ${totalLinkedRecords} links` : ''}</div>
            </div>
          </div>
        </div>
        <div id="pi-content-${piId}" style="padding:16px;display:flex;flex-wrap:wrap;gap:8px;">
    `;
    
    piSprints.forEach(sprint => {
      const hasDates = sprint.startDate && sprint.endDate;
      const dateDisplay = hasDates 
        ? `${formatDate(sprint.startDate)} → ${formatDate(sprint.endDate)}` 
        : 'No dates set';
      
      html += `
        <div onclick="editSprintDates('${escapeHtml(sprint.name)}', '${escapeHtml(sprint.key)}')" style="width:165px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:all 0.2s ease;border-top:3px solid ${sprint.color};flex-shrink:0;" onmouseover="this.style.background='var(--surface3)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)';" onmouseout="this.style.background='var(--surface2)';this.style.transform='translateY(0)';this.style.boxShadow='none';">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:6px;">
              <div style="width:8px;height:8px;border-radius:2px;background:${sprint.color};"></div>
              <div style="font-size:12px;font-weight:700;color:var(--text);">${sprint.name}</div>
            </div>
            <div style="display:flex;gap:6px;">
              <div style="font-size:10px;color:var(--text2);font-weight:600;">📦 ${sprint.storyCount}</div>
              <div style="font-size:10px;color:var(--text2);font-weight:600;">📝 ${sprint.noteCount}</div>
              ${sprint.linkedRecordsCount > 0 ? `<div style="font-size:10px;color:var(--accent3);font-weight:600;" title="Linked Records">🔗 ${sprint.linkedRecordsCount}</div>` : ''}
            </div>
          </div>
          <div style="font-size:8px;color:var(--text3);">${dateDisplay}</div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
  });

  html += '</div>';
  return html;
}

// Toggle PI section visibility
function togglePISection(piId) {
  const content = document.getElementById(`pi-content-${piId}`);
  const arrow = document.getElementById(`pi-arrow-${piId}`);
  
  if (content && arrow) {
    if (content.style.display === 'none') {
      content.style.display = 'flex';
      arrow.style.transform = 'rotate(0deg)';
    } else {
      content.style.display = 'none';
      arrow.style.transform = 'rotate(-90deg)';
    }
  }
}

// Format date for display with year
function formatDate(dateStr) {
  if (!dateStr) return '';
  // Parse date string directly to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[month - 1]} ${day}, ${year}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Open calendar date modal to view/edit sprint assignments
function openCalendarDateModal(dateStr) {
  // Parse date string manually to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  
  // Check if it's a weekend (Saturday=6, Sunday=0)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const dayName = dayOfWeek === 0 ? 'Sunday' : 'Saturday';
    toast(`${dayName} is a weekend day. Sprints are only scheduled on weekdays.`, 'info');
    return;
  }
  
  const formattedDate = formatDate(dateStr);
  
  // Get all sprint keys (PI|Sprint) that match this date
  const sprintKeysOnDate = [];
  if (state.sprintCalendar?.sprintDates) {
    Object.keys(state.sprintCalendar.sprintDates).forEach(sprintKey => {
      const sprintData = state.sprintCalendar.sprintDates[sprintKey];
      if (sprintData && sprintData.start && sprintData.end) {
        // Parse dates manually to avoid timezone issues
        const [startYear, startMonth, startDay] = sprintData.start.split('-').map(Number);
        const startDate = new Date(startYear, startMonth - 1, startDay);
        
        const [endYear, endMonth, endDay] = sprintData.end.split('-').map(Number);
        const endDate = new Date(endYear, endMonth - 1, endDay);
        
        const [targetYear, targetMonth, targetDay] = dateStr.split('-').map(Number);
        const targetDate = new Date(targetYear, targetMonth - 1, targetDay);
        
        // Skip weekends
        const dayOfWeek = targetDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) return;
        
        if (targetDate >= startDate && targetDate <= endDate) {
          sprintKeysOnDate.push(sprintKey);
        }
      }
    });
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'calendarDateModal';
  
  let modalContent = '';
  
  if (sprintKeysOnDate.length > 0) {
    // Show list of sprints with delete buttons
    let sprintListHtml = '<div style="margin-top:16px;"><div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;">Sprints on this date:</div>';
    sprintKeysOnDate.forEach(sprintKey => {
      const sprintData = state.sprintCalendar.sprintDates[sprintKey];
      const sprintName = sprintKey.includes('|') ? sprintKey.split('|')[1] : sprintKey;
      const pi = sprintKey.includes('|') ? sprintKey.split('|')[0] : getPIForSprint(sprintName);
      const color = getSprintColor(sprintName);
      
      sprintListHtml += `
        <div style="padding:12px;background:var(--surface2);border:1px solid var(--border);border-left:4px solid ${color};border-radius:var(--radius-sm);margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:start;">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <div style="width:10px;height:10px;border-radius:2px;background:${color};"></div>
                <div style="font-size:13px;font-weight:600;color:var(--text);">${sprintName}</div>
              </div>
              <div style="font-size:11px;color:var(--text3);margin-left:18px;">📊 ${pi}</div>
              <div style="font-size:11px;color:var(--text3);margin-left:18px;">${formatDate(sprintData.start)} → ${formatDate(sprintData.end)}</div>
            </div>
            <button class="btn btn-danger" style="margin-left:12px;padding:6px 12px;font-size:11px;" onclick="deleteSprintFromDate('${escapeHtml(sprintKey)}', '${dateStr}')">🗑 Delete</button>
          </div>
        </div>
      `;
    });
    sprintListHtml += '</div>';
    
    modalContent = `
      <div class="modal" style="max-width:500px;">
        <div class="modal-header">
          <div class="modal-title">📅 ${formattedDate}</div>
          <button class="modal-close" onclick="closeCalendarDateModal()">×</button>
        </div>
        <div style="padding:20px;">
          ${sprintListHtml}
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="closeCalendarDateModal()">Close</button>
        </div>
      </div>
    `;
  } else {
    // Get unique PI and Sprint values from records
    const uniquePIs = [...new Set(state.records.map(r => r.pi).filter(Boolean))].sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
    const uniqueSprints = [...new Set(state.records.map(r => r.sprint_start).filter(Boolean))].sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
    
    // Show form to add new sprint with tabs for Manual and Automated
    modalContent = `
      <div class="modal" style="max-width:700px;">
        <div class="modal-header">
          <div class="modal-title">📅 Add Sprint to ${formattedDate}</div>
          <button class="modal-close" onclick="closeCalendarDateModal()">×</button>
        </div>
        <div style="padding:20px;">
          <div style="margin-bottom:16px;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);font-size:12px;color:var(--text3);">
            Create a sprint manually or select from existing PI/Sprint combinations, then set dates that include <strong style="color:var(--text2);">${formattedDate}</strong>
          </div>
          
          <!-- Side by Side Layout -->
          <div style="display:grid;grid-template-columns:1fr 2px 1fr;gap:20px;margin-bottom:16px;">
            
            <!-- Manual Entry Section -->
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                <span>✍️</span>
                <span>Manual Entry</span>
              </div>
              
              <div class="form-group" style="margin-bottom:12px;">
                <label for="newManualPI" style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;display:block;">PI *</label>
                <input type="text" id="newManualPI" placeholder="e.g., 26" style="width:100%;padding:9px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;">
              </div>
              
              <div class="form-group" style="margin-bottom:12px;">
                <label for="newManualSprint" style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;display:block;">Sprint *</label>
                <input type="text" id="newManualSprint" placeholder="e.g., 5" style="width:100%;padding:9px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;">
              </div>
              
              <button class="btn btn-primary" style="width:100%;margin-top:8px;" onclick="setCreateMode('manual')">Use Manual Entry</button>
            </div>
            
            <!-- Vertical Separator -->
            <div style="background:var(--border);width:2px;height:100%;"></div>
            
            <!-- From Existing Section -->
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                <span>🤖</span>
                <span>From Existing</span>
              </div>
              
              <div class="form-group" style="margin-bottom:12px;">
                <label for="automatedPI" style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;display:block;">Select PI *</label>
                <select id="automatedPI" style="width:100%;padding:9px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;cursor:pointer;">
                  <option value="">-- Select PI --</option>
                  ${uniquePIs.map(pi => `<option value="${pi}">${pi}</option>`).join('')}
                </select>
              </div>
              
              <div class="form-group" style="margin-bottom:12px;">
                <label for="automatedSprint" style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;display:block;">Select Sprint *</label>
                <select id="automatedSprint" style="width:100%;padding:9px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;cursor:pointer;">
                  <option value="">-- Select Sprint --</option>
                  ${uniqueSprints.map(sprint => `<option value="${sprint}">${sprint}</option>`).join('')}
                </select>
              </div>
              
              <button class="btn btn-primary" style="width:100%;margin-top:8px;" onclick="setCreateMode('automated')">Use From Existing</button>
            </div>
          </div>
          
          <!-- Common Date Fields -->
          <div style="border-top:2px solid var(--border);padding-top:16px;margin-top:16px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label for="sprintStartDate" style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;display:block;">Start Date *</label>
                <input type="date" id="sprintStartDate" value="${dateStr}" style="width:100%;padding:9px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;">
              </div>
              <div class="form-group">
                <label for="sprintEndDate" style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;display:block;">End Date *</label>
                <input type="date" id="sprintEndDate" value="${dateStr}" style="width:100%;padding:9px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;">
              </div>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="closeCalendarDateModal()">Cancel</button>
          <button id="createSprintBtn" class="btn btn-primary" onclick="createSelectedSprint()" disabled style="opacity:0.5;">💾 Create Sprint</button>
        </div>
      </div>
    `;
  }
  
  overlay.innerHTML = modalContent;
  document.body.appendChild(overlay);
}

// Close calendar date modal
function closeCalendarDateModal() {
  const modal = document.getElementById('calendarDateModal');
  if (modal) {
    modal.remove();
  }
}

// Get PI for a sprint from records
function getPIForSprint(sprintName) {
  const record = state.records.find(r => r.sprint_start === sprintName);
  return record?.pi || 'No PI';
}

// Edit sprint dates
function editSprintDates(sprintName, sprintKey) {
  // If no key provided, try to find it from records
  if (!sprintKey) {
    const record = state.records.find(r => r.sprint_start === sprintName);
    const pi = record?.pi || 'No PI';
    sprintKey = `${pi}|${sprintName}`;
  }
  
  const existingData = state.sprintCalendar.sprintDates[sprintKey] || {};
  const startDate = existingData.start || '';
  const endDate = existingData.end || '';
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'sprintDateModal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:450px;">
      <div class="modal-header">
        <div class="modal-title">📅 Set Dates for ${escapeHtml(sprintName)}</div>
        <button class="modal-close" onclick="closeSprintDateModal()">×</button>
      </div>
      <div style="padding:20px;">
        <div class="form-group" style="margin-bottom:15px;">
          <label for="sprintStartDate" style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:6px;display:block;">Start Date</label>
          <input type="date" id="sprintStartDate" name="sprintStartDate" value="${startDate}" style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;">
        </div>
        
        <div class="form-group" style="margin-bottom:20px;">
          <label for="sprintEndDate" style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:6px;display:block;">End Date</label>
          <input type="date" id="sprintEndDate" name="sprintEndDate" value="${endDate}" style="width:100%;padding:10px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:13px;">
        </div>
      </div>
      <div class="form-actions" style="justify-content:space-between;padding:0 20px 20px;">
        <div>
          ${existingData.start ? `<button class="btn btn-danger" onclick="clearSprintDates('${escapeHtml(sprintName)}', '${escapeHtml(sprintKey)}')">🗑 Clear Dates</button>` : ''}
        </div>
        <div style="display:flex;gap:10px;">
          <button class="btn btn-secondary" onclick="closeSprintDateModal()">Cancel</button>
          <button class="btn btn-primary" onclick="saveSprintDates('${escapeHtml(sprintName)}', '${escapeHtml(sprintKey)}')">💾 Save Dates</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

// Close sprint date modal
function closeSprintDateModal() {
  const modal = document.getElementById('sprintDateModal');
  if (modal) {
    modal.remove();
  }
}

// Save sprint dates
function saveSprintDates(sprintName, sprintKey) {
  const startDate = document.getElementById('sprintStartDate').value;
  const endDate = document.getElementById('sprintEndDate').value;
  
  if (!startDate || !endDate) {
    toast('Please select both start and end dates', 'error');
    return;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    toast('Start date cannot be after end date', 'error');
    return;
  }
  
  // Check for date overlaps with other sprints
  const overlappingSprints = checkDateOverlaps(sprintKey, startDate, endDate);
  if (overlappingSprints.length > 0) {
    const sprintList = overlappingSprints.map(key => {
      const [pi, name] = key.includes('|') ? key.split('|') : ['', key];
      return name ? `${name} (PI ${pi})` : key;
    }).join(', ');
    toast(`Cannot save dates: They overlap with existing sprint(s): ${sprintList}`, 'error');
    return;
  }
  
  saveSprintDatesConfirmed(sprintName, sprintKey, startDate, endDate);
}

// Helper function to save sprint dates after confirmation
function saveSprintDatesConfirmed(sprintName, sprintKey, startDate, endDate) {
  if (!state.sprintCalendar.sprintDates) {
    state.sprintCalendar.sprintDates = {};
  }
  
  // Extract PI from the sprintKey
  const [pi, sprint] = sprintKey.includes('|') ? sprintKey.split('|') : ['No PI', sprintKey];
  
  // Use PI+Sprint key for storage
  state.sprintCalendar.sprintDates[sprintKey] = {
    start: startDate,
    end: endDate,
    pi: pi
  };
  
  // Ensure color is generated and stored for this sprint
  const sprintColor = getSprintColor(sprintName);
  
  saveState();
  closeSprintDateModal();
  renderSprintCalendarCard();
  toast(`Dates saved for ${sprintName}`, 'success');
}

// Check for date overlaps with other sprints
function checkDateOverlaps(currentSprint, startDate, endDate) {
  const overlapping = [];
  const newStart = new Date(startDate);
  const newEnd = new Date(endDate);
  
  if (!state.sprintCalendar.sprintDates) return overlapping;
  
  Object.keys(state.sprintCalendar.sprintDates).forEach(sprintName => {
    if (sprintName === currentSprint) return; // Skip checking against itself
    
    const existingData = state.sprintCalendar.sprintDates[sprintName];
    if (!existingData || !existingData.start || !existingData.end) return;
    
    const existingStart = new Date(existingData.start);
    const existingEnd = new Date(existingData.end);
    
    // Check if date ranges overlap
    if (newStart <= existingEnd && newEnd >= existingStart) {
      overlapping.push(sprintName);
    }
  });
  
  return overlapping;
}

// Clear sprint dates
function clearSprintDates(sprintName, sprintKey) {
  showConfirmModal(
    'Clear Sprint Dates',
    `Clear dates for ${sprintName}?`,
    () => {
      if (state.sprintCalendar.sprintDates && state.sprintCalendar.sprintDates[sprintKey]) {
        delete state.sprintCalendar.sprintDates[sprintKey];
        saveState();
        closeSprintDateModal();
        renderSprintCalendarCard();
        toast(`Dates cleared for ${sprintName}`, 'info');
      }
    },
    'Clear',
    'btn-danger'
  );
}

// Get month name
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month];
}

// Navigate to previous month
function previousMonth() {
  if (!state.sprintCalendar) initializeSprintCalendarState();
  
  state.sprintCalendar.currentMonth--;
  if (state.sprintCalendar.currentMonth < 0) {
    state.sprintCalendar.currentMonth = 11;
    state.sprintCalendar.currentYear--;
  }
  
  renderSprintCalendarCard();
  saveState();
}

// Navigate to next month
function nextMonth() {
  if (!state.sprintCalendar) initializeSprintCalendarState();
  
  state.sprintCalendar.currentMonth++;
  if (state.sprintCalendar.currentMonth > 11) {
    state.sprintCalendar.currentMonth = 0;
    state.sprintCalendar.currentYear++;
  }
  
  renderSprintCalendarCard();
  saveState();
}

// Jump to today
function jumpToToday() {
  if (!state.sprintCalendar) initializeSprintCalendarState();
  
  const today = new Date();
  state.sprintCalendar.currentMonth = today.getMonth();
  state.sprintCalendar.currentYear = today.getFullYear();
  
  renderSprintCalendarCard();
  saveState();
  toast('Jumped to current month', 'success');
}

// Change view mode
function changeViewMode(mode) {
  if (!state.sprintCalendar) initializeSprintCalendarState();
  
  state.sprintCalendar.viewMode = mode;
  renderSprintCalendarCard();
  saveState();
}

// Toggle compact mode
function toggleCompactMode() {
  if (!state.sprintCalendar) initializeSprintCalendarState();
  
  state.sprintCalendar.compactMode = !state.sprintCalendar.compactMode;
  renderSprintCalendarCard();
  saveState();
}

// Get view title based on current view mode
function getViewTitle() {
  const settings = state.sprintCalendar;
  
  if (settings.viewMode === 'week') {
    // Calculate week range
    const weekStart = new Date(settings.currentYear, settings.currentMonth, 1);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `${getMonthName(weekStart.getMonth())} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${settings.currentYear}`;
  } else if (settings.viewMode === 'quarter') {
    const quarter = Math.floor(settings.currentMonth / 3) + 1;
    return `Q${quarter} ${settings.currentYear}`;
  } else {
    return `${getMonthName(settings.currentMonth)} ${settings.currentYear}`;
  }
}

// Open holiday manager modal
function openHolidayManager() {
  const holidays = state.sprintCalendar.holidays || {};
  
  let holidayListHtml = '';
  const sortedDates = Object.keys(holidays).sort();
  
  if (sortedDates.length > 0) {
    holidayListHtml = '<div style="margin-bottom:16px;max-height:200px;overflow-y:auto;">';
    sortedDates.forEach(dateStr => {
      holidayListHtml += `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;">
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--text);">${holidays[dateStr]}</div>
            <div style="font-size:10px;color:var(--text3);">${formatDate(dateStr)}</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="deleteHoliday('${dateStr}')" style="padding:4px 8px;font-size:10px;">🗑</button>
        </div>
      `;
    });
    holidayListHtml += '</div>';
  } else {
    holidayListHtml = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:12px;">No holidays added yet</div>';
  }
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'holidayManagerModal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:700px;width:90%;">
      <div class="modal-header">
        <div class="modal-title">🎉 Holiday Management</div>
        <button class="modal-close" onclick="closeHolidayManager()">×</button>
      </div>
      <div style="padding:20px;display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <!-- Left Side: Form -->
        <div style="border-right:1px solid var(--border);padding-right:20px;">
          <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:12px;">Add New Holiday</div>
          <div class="form-group" style="margin-bottom:10px;">
            <label for="holidayDate" style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:4px;display:block;">Date</label>
            <input type="date" id="holidayDate" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:12px;">
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label for="holidayName" style="font-size:11px;font-weight:600;color:var(--text2);margin-bottom:4px;display:block;">Holiday Name</label>
            <input type="text" id="holidayName" placeholder="e.g., New Year's Day" style="width:100%;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:12px;">
          </div>
          <button class="btn btn-primary btn-sm" onclick="addHoliday()" style="width:100%;">➕ Add Holiday</button>
        </div>
        
        <!-- Right Side: Holiday List -->
        <div>
          <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:12px;">Existing Holidays</div>
          ${sortedDates.length > 0 ? `
            <div style="max-height:300px;overflow-y:auto;">
              ${sortedDates.map(dateStr => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;">
                  <div>
                    <div style="font-size:12px;font-weight:600;color:var(--text);">${holidays[dateStr]}</div>
                    <div style="font-size:10px;color:var(--text3);">${formatDate(dateStr)}</div>
                  </div>
                  <button class="btn btn-danger btn-sm" onclick="deleteHoliday('${dateStr}')" style="padding:4px 8px;font-size:10px;">🗑</button>
                </div>
              `).join('')}
            </div>
          ` : '<div style="text-align:center;padding:40px 20px;color:var(--text3);font-size:12px;">No holidays added yet</div>'}
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeHolidayManager()">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

// Close holiday manager
function closeHolidayManager() {
  const modal = document.getElementById('holidayManagerModal');
  if (modal) {
    modal.remove();
  }
}

// Add holiday
function addHoliday() {
  const dateInput = document.getElementById('holidayDate');
  const nameInput = document.getElementById('holidayName');
  
  const date = dateInput.value;
  const name = nameInput.value.trim();
  
  if (!date) {
    toast('Please select a date', 'error');
    return;
  }
  
  if (!name) {
    toast('Please enter a holiday name', 'error');
    return;
  }
  
  if (!state.sprintCalendar.holidays) {
    state.sprintCalendar.holidays = {};
  }
  
  state.sprintCalendar.holidays[date] = name;
  saveState();
  toast(`Holiday added: ${name}`, 'success');
  
  // Clear the form inputs
  dateInput.value = '';
  nameInput.value = '';
  
  // Refresh the holiday list without closing the modal
  closeHolidayManager();
  openHolidayManager();
  renderSprintCalendarCard();
}

// Delete holiday
function deleteHoliday(dateStr) {
  const holidayName = state.sprintCalendar.holidays[dateStr];
  showConfirmModal(
    'Delete Holiday',
    `Remove holiday "${holidayName}"?`,
    () => {
      delete state.sprintCalendar.holidays[dateStr];
      saveState();
      toast('Holiday removed', 'info');
      
      closeHolidayManager();
      openHolidayManager(); // Reopen to refresh list
      renderSprintCalendarCard();
    }
  );
}

// Check if date is a holiday
function isHoliday(dateStr) {
  return state.sprintCalendar?.holidays?.[dateStr] !== undefined;
}

// Delete sprint from calendar
function deleteSprintFromDate(sprintKey, dateStr) {
  const sprintName = sprintKey.includes('|') ? sprintKey.split('|')[1] : sprintKey;
  
  showConfirmModal(
    'Delete Sprint Dates',
    `Delete dates for ${sprintName}?\n\nThis will remove the sprint from the calendar but keep the sprint data in your records.`,
    () => {
      if (state.sprintCalendar.sprintDates && state.sprintCalendar.sprintDates[sprintKey]) {
        delete state.sprintCalendar.sprintDates[sprintKey];
        saveState();
        closeCalendarDateModal();
        renderSprintCalendarCard();
        toast(`Dates removed for ${sprintName}`, 'success');
      }
    },
    'Delete',
    'btn-danger'
  );
}

// Save new sprint from date modal
function saveNewSprintFromDate() {
  const sprintKey = document.getElementById('newSprintSelect').value;
  const startDate = document.getElementById('newSprintStartDate').value;
  const endDate = document.getElementById('newSprintEndDate').value;
  
  if (!sprintKey) {
    toast('Please select a sprint', 'error');
    return;
  }
  
  if (!startDate || !endDate) {
    toast('Please select both start and end dates', 'error');
    return;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    toast('Start date cannot be after end date', 'error');
    return;
  }
  
  // Check for date overlaps
  const overlappingSprints = checkDateOverlaps(sprintKey, startDate, endDate);
  if (overlappingSprints.length > 0) {
    const sprintList = overlappingSprints.join(', ');
    const message = `Warning: These dates overlap with existing sprints:\n${sprintList}\n\nDo you want to continue anyway?`;
    showConfirmModal(
      'Overlapping Dates',
      message,
      () => {
        saveNewSprintConfirmed(sprintKey, startDate, endDate);
      },
      'Continue',
      'btn-warning'
    );
    return;
  }
  
  saveNewSprintConfirmed(sprintKey, startDate, endDate);
}

// Set create mode for sprint creation
let sprintCreateMode = null;

function setCreateMode(mode) {
  sprintCreateMode = mode;
  const createBtn = document.getElementById('createSprintBtn');
  if (createBtn) {
    createBtn.disabled = false;
    createBtn.style.opacity = '1';
  }
}

// Create sprint based on selected mode
function createSelectedSprint() {
  if (sprintCreateMode === 'manual') {
    saveNewManualSprint();
  } else if (sprintCreateMode === 'automated') {
    saveNewAutomatedSprint();
  } else {
    toast('Please select a creation method', 'error');
  }
}

// Save new manually created sprint
function saveNewManualSprint() {
  const pi = document.getElementById('newManualPI')?.value.trim();
  const sprint = document.getElementById('newManualSprint')?.value.trim();
  const startDate = document.getElementById('sprintStartDate')?.value;
  const endDate = document.getElementById('sprintEndDate')?.value;
  
  if (!pi) {
    toast('Please enter a PI value', 'error');
    return;
  }
  
  if (!sprint) {
    toast('Please enter a Sprint value', 'error');
    return;
  }
  
  if (!startDate || !endDate) {
    toast('Please select both start and end dates', 'error');
    return;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    toast('Start date cannot be after end date', 'error');
    return;
  }
  
  // Create sprint key (PI|Sprint format)
  const sprintKey = `${pi}|${sprint}`;
  
  // Check for date overlaps
  const overlappingSprints = checkDateOverlaps(sprintKey, startDate, endDate);
  if (overlappingSprints.length > 0) {
    const sprintList = overlappingSprints.map(key => {
      const [pi, name] = key.includes('|') ? key.split('|') : ['', key];
      return name ? `${name} (PI ${pi})` : key;
    }).join(', ');
    toast(`Cannot create sprint: Dates overlap with existing sprint(s): ${sprintList}`, 'error');
    return;
  }
  
  saveNewSprintConfirmed(sprintKey, startDate, endDate);
}

// Save new sprint from automated selection (dropdowns)
function saveNewAutomatedSprint() {
  const pi = document.getElementById('automatedPI')?.value.trim();
  const sprint = document.getElementById('automatedSprint')?.value.trim();
  const startDate = document.getElementById('sprintStartDate')?.value;
  const endDate = document.getElementById('sprintEndDate')?.value;
  
  if (!pi) {
    toast('Please select a PI', 'error');
    return;
  }
  
  if (!sprint) {
    toast('Please select a Sprint', 'error');
    return;
  }
  
  if (!startDate || !endDate) {
    toast('Please select both start and end dates', 'error');
    return;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    toast('Start date cannot be after end date', 'error');
    return;
  }
  
  // Create sprint key (PI|Sprint format)
  const sprintKey = `${pi}|${sprint}`;
  
  // Check for date overlaps
  const overlappingSprints = checkDateOverlaps(sprintKey, startDate, endDate);
  if (overlappingSprints.length > 0) {
    const sprintList = overlappingSprints.map(key => {
      const [pi, name] = key.includes('|') ? key.split('|') : ['', key];
      return name ? `${name} (PI ${pi})` : key;
    }).join(', ');
    toast(`Cannot create sprint: Dates overlap with existing sprint(s): ${sprintList}`, 'error');
    return;
  }
  
  saveNewSprintConfirmed(sprintKey, startDate, endDate);
}

// Helper function to save new sprint after confirmation
function saveNewSprintConfirmed(sprintKey, startDate, endDate) {
  if (!state.sprintCalendar.sprintDates) {
    state.sprintCalendar.sprintDates = {};
  }
  
  // Extract PI from the sprintKey
  const [pi, sprintName] = sprintKey.includes('|') ? sprintKey.split('|') : ['No PI', sprintKey];
  
  state.sprintCalendar.sprintDates[sprintKey] = {
    start: startDate,
    end: endDate,
    pi: pi
  };
  
  // Ensure color is generated and stored for this sprint
  const sprintColor = getSprintColor(sprintName);
  
  saveState();
  closeCalendarDateModal();
  renderSprintCalendarCard();
  toast(`Sprint ${sprintName} added to calendar`, 'success');
}