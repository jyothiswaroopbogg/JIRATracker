// Sprint Reminders Functionality

// Initialize sprint reminders
function initializeSprintReminders() {
  if (!state.sprintCalendar) {
    state.sprintCalendar = {};
  }
  
  // Initialize reminders settings
  if (!state.sprintCalendar.reminders) {
    state.sprintCalendar.reminders = {
      enabled: true,
      sprintStarting: { enabled: true, days: 1 }, // Remind 1 day before sprint starts
      sprintEnding: { enabled: true, days: 2 }, // Remind 2 days before sprint ends
      sprintOverdue: { enabled: true }, // Remind when sprint is overdue
      lastChecked: null,
      dismissed: {} // Track dismissed reminders { sprintKey: timestamp }
    };
  }
  
  // Check reminders on load
  checkSprintReminders();
  
  // Check reminders every hour
  setInterval(checkSprintReminders, 60 * 60 * 1000);
}

// Check sprint reminders
function checkSprintReminders() {
  if (!state.sprintCalendar?.reminders?.enabled) return;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const reminders = [];
  
  // Get all sprints with dates
  const sprints = extractSprintsFromRecords();
  const sprintsWithDates = sprints.filter(s => s.startDate && s.endDate);
  
  sprintsWithDates.forEach(sprint => {
    const sprintKey = sprint.key;
    const dismissed = state.sprintCalendar.reminders.dismissed[sprintKey];
    
    // Skip if reminder was dismissed in the last 24 hours
    if (dismissed && (Date.now() - dismissed) < 24 * 60 * 60 * 1000) {
      return;
    }
    
    // Parse dates manually
    const [startYear, startMonth, startDay] = sprint.startDate.split('-').map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);
    startDate.setHours(0, 0, 0, 0);
    
    const [endYear, endMonth, endDay] = sprint.endDate.split('-').map(Number);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    endDate.setHours(0, 0, 0, 0);
    
    // Check for sprint starting soon
    if (state.sprintCalendar.reminders.sprintStarting.enabled) {
      const daysUntilStart = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilStart > 0 && daysUntilStart <= state.sprintCalendar.reminders.sprintStarting.days) {
        reminders.push({
          type: 'starting',
          sprint: sprint,
          days: daysUntilStart,
          icon: '🚀',
          priority: 'high'
        });
      }
    }
    
    // Check for sprint ending soon
    if (state.sprintCalendar.reminders.sprintEnding.enabled) {
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      
      // Sprint is active and ending soon
      if (today >= startDate && daysUntilEnd > 0 && daysUntilEnd <= state.sprintCalendar.reminders.sprintEnding.days) {
        reminders.push({
          type: 'ending',
          sprint: sprint,
          days: daysUntilEnd,
          icon: '⏰',
          priority: 'medium'
        });
      }
    }
    
    // Check for overdue sprint
    if (state.sprintCalendar.reminders.sprintOverdue.enabled) {
      if (today > endDate) {
        const daysOverdue = Math.ceil((today - endDate) / (1000 * 60 * 60 * 24));
        reminders.push({
          type: 'overdue',
          sprint: sprint,
          days: daysOverdue,
          icon: '⚠️',
          priority: 'critical'
        });
      }
    }
  });
  
  // Update last checked timestamp and save (only if we have records)
  state.sprintCalendar.reminders.lastChecked = Date.now();
  
  // Only save if there are records to avoid triggering safety warnings on fresh database
  if (state.records && state.records.length > 0) {
    saveState();
  }
  
  // Show reminders if any
  if (reminders.length > 0) {
    showSprintRemindersModal(reminders);
  }
}

// Show sprint reminders modal
function showSprintRemindersModal(reminders) {
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  reminders.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  let html = '';
  
  reminders.forEach(reminder => {
    let message = '';
    let bgColor = '';
    
    if (reminder.type === 'starting') {
      message = `<strong>${reminder.sprint.name}</strong> (${reminder.sprint.pi}) starts in <strong>${reminder.days} ${reminder.days === 1 ? 'day' : 'days'}</strong>`;
      bgColor = 'rgba(59, 130, 246, 0.1)';
    } else if (reminder.type === 'ending') {
      message = `<strong>${reminder.sprint.name}</strong> (${reminder.sprint.pi}) ends in <strong>${reminder.days} ${reminder.days === 1 ? 'day' : 'days'}</strong>`;
      bgColor = 'rgba(249, 115, 22, 0.1)';
    } else if (reminder.type === 'overdue') {
      message = `<strong>${reminder.sprint.name}</strong> (${reminder.sprint.pi}) is <strong>${reminder.days} ${reminder.days === 1 ? 'day' : 'days'}</strong> overdue`;
      bgColor = 'rgba(239, 68, 68, 0.1)';
    }
    
    html += `
      <div style="padding:12px;background:${bgColor};border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:24px;">${reminder.icon}</div>
          <div style="flex:1;">
            <div style="font-size:13px;color:var(--text);line-height:1.6;">${message}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:4px;">
              📅 ${formatDate(reminder.sprint.startDate)} → ${formatDate(reminder.sprint.endDate)} • 
              📦 ${reminder.sprint.storyCount} stories
            </div>
          </div>
          <button class="btn btn-sm btn-secondary" onclick="dismissReminder('${escapeHtml(reminder.sprint.key)}')" style="padding:6px 10px;font-size:11px;">Dismiss</button>
        </div>
      </div>
    `;
  });
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'sprintRemindersModal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-header">
        <div class="modal-title">🔔 Sprint Reminders</div>
        <button class="modal-close" onclick="closeSprintRemindersModal()">×</button>
      </div>
      <div style="padding:20px;">
        <div style="font-size:12px;color:var(--text3);margin-bottom:16px;">
          You have ${reminders.length} sprint ${reminders.length === 1 ? 'reminder' : 'reminders'}
        </div>
        ${html}
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="openReminderSettings()">⚙️ Settings</button>
        <button class="btn btn-primary" onclick="closeSprintRemindersModal()">Got it</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

// Close sprint reminders modal
function closeSprintRemindersModal() {
  const modal = document.getElementById('sprintRemindersModal');
  if (modal) {
    modal.remove();
  }
}

// Dismiss reminder for a sprint
function dismissReminder(sprintKey) {
  if (!state.sprintCalendar.reminders.dismissed) {
    state.sprintCalendar.reminders.dismissed = {};
  }
  
  state.sprintCalendar.reminders.dismissed[sprintKey] = Date.now();
  saveState();
  
  closeSprintRemindersModal();
  toast('Reminder dismissed for 24 hours', 'info');
}

// Open reminder settings modal
function openReminderSettings() {
  closeSprintRemindersModal();
  
  const settings = state.sprintCalendar.reminders;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'reminderSettingsModal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:500px;">
      <div class="modal-header">
        <div class="modal-title">⚙️ Reminder Settings</div>
        <button class="modal-close" onclick="closeReminderSettingsModal()">×</button>
      </div>
      <div style="padding:20px;">
        <!-- Enable/Disable Reminders -->
        <div style="padding:12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:16px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="remindersEnabled" ${settings.enabled ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer;">
            <span style="font-size:13px;font-weight:600;color:var(--text);">Enable Sprint Reminders</span>
          </label>
        </div>
        
        <!-- Sprint Starting Reminder -->
        <div style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:12px;">
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;">
            <input type="checkbox" id="sprintStartingEnabled" ${settings.sprintStarting.enabled ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;">
            <span style="font-size:12px;font-weight:600;color:var(--text);">🚀 Sprint Starting Soon</span>
          </label>
          <div style="display:flex;align-items:center;gap:8px;margin-left:24px;">
            <label style="font-size:11px;color:var(--text3);">Remind me</label>
            <input type="number" id="sprintStartingDays" value="${settings.sprintStarting.days}" min="1" max="7" style="width:60px;padding:6px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:11px;text-align:center;">
            <label style="font-size:11px;color:var(--text3);">days before sprint starts</label>
          </div>
        </div>
        
        <!-- Sprint Ending Reminder -->
        <div style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:12px;">
          <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;cursor:pointer;">
            <input type="checkbox" id="sprintEndingEnabled" ${settings.sprintEnding.enabled ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;">
            <span style="font-size:12px;font-weight:600;color:var(--text);">⏰ Sprint Ending Soon</span>
          </label>
          <div style="display:flex;align-items:center;gap:8px;margin-left:24px;">
            <label style="font-size:11px;color:var(--text3);">Remind me</label>
            <input type="number" id="sprintEndingDays" value="${settings.sprintEnding.days}" min="1" max="7" style="width:60px;padding:6px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:11px;text-align:center;">
            <label style="font-size:11px;color:var(--text3);">days before sprint ends</label>
          </div>
        </div>
        
        <!-- Sprint Overdue Reminder -->
        <div style="padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:12px;">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" id="sprintOverdueEnabled" ${settings.sprintOverdue.enabled ? 'checked' : ''} style="width:16px;height:16px;cursor:pointer;">
            <span style="font-size:12px;font-weight:600;color:var(--text);">⚠️ Sprint Overdue</span>
          </label>
          <div style="font-size:10px;color:var(--text3);margin-left:24px;margin-top:4px;">
            Get notified when sprints are past their end date
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeReminderSettingsModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveReminderSettings()">💾 Save Settings</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

// Close reminder settings modal
function closeReminderSettingsModal() {
  const modal = document.getElementById('reminderSettingsModal');
  if (modal) {
    modal.remove();
  }
}

// Save reminder settings
function saveReminderSettings() {
  state.sprintCalendar.reminders.enabled = document.getElementById('remindersEnabled').checked;
  state.sprintCalendar.reminders.sprintStarting.enabled = document.getElementById('sprintStartingEnabled').checked;
  state.sprintCalendar.reminders.sprintStarting.days = parseInt(document.getElementById('sprintStartingDays').value) || 1;
  state.sprintCalendar.reminders.sprintEnding.enabled = document.getElementById('sprintEndingEnabled').checked;
  state.sprintCalendar.reminders.sprintEnding.days = parseInt(document.getElementById('sprintEndingDays').value) || 2;
  state.sprintCalendar.reminders.sprintOverdue.enabled = document.getElementById('sprintOverdueEnabled').checked;
  
  saveState();
  closeReminderSettingsModal();
  toast('Reminder settings saved', 'success');
}

// Manual check button for reminders
function manualCheckReminders() {
  // Check if there are any records
  if (state.records.length === 0) {
    toast('No records found. Add records first to set up sprint reminders.', 'info');
    return;
  }
  
  // Check if there are any sprints with dates
  const sprints = extractSprintsFromRecords();
  const sprintsWithDates = sprints.filter(s => s.startDate && s.endDate);
  
  if (sprintsWithDates.length === 0) {
    toast('No sprints with dates found. Add dates to sprints first.', 'info');
    return;
  }
  
  checkSprintReminders();
}
