// Scheduled Data Export & Backup Functions

function createBackup() {
  try {
    const now = new Date();
    
    // Create timestamp in local time format: MM/DD/YYYY HH:MM:SS
    const y = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const timestamp = `${mo}/${d}/${y} ${h}:${min}:${s}`;
  
  // Generate filename using download settings
  const baseFilename = state.downloadFilename || 'sprint-tracker';
  const filenameTimestamp = getFormattedTimestamp();
  const filename = filenameTimestamp ? `backup_${baseFilename}_${filenameTimestamp}.json` : `backup_${baseFilename}_${Date.now()}.json`;
  
  const backup = {
    id: Date.now(),
    timestamp: timestamp,
    filename: filename, // Store the actual filename
    recordCount: state.records.length,
    scheduleType: state.backupSettings?.scheduleType || 'manual',
    data: {
      records: state.records,
      notes: state.notes,
      jiraStatuses: state.jiraStatuses,
      devopsStatuses: state.devopsStatuses,
      devopsOrgs: state.devopsOrgs,
      columns: state.columns,
      customColumns: state.customColumns,
      jiraUrlTemplate: state.jiraUrlTemplate,
      jiraDisplayFormat: state.jiraDisplayFormat,
      wiUrlTemplate: state.wiUrlTemplate,
      wiDisplayFormat: state.wiDisplayFormat,
      labels: state.labels,
      tags: state.tags,
      recordTags: state.recordTags,
      notesRecordLinks: state.notesRecordLinks,
      notesTimestamps: state.notesTimestamps,
      colors: state.colors,
      fontSettings: state.fontSettings,
      downloadFilename: state.downloadFilename,
      timestampFormat: state.timestampFormat,
      backupSettings: state.backupSettings,
      useMatrixBackground: state.useMatrixBackground,
      matrixFontSize: state.matrixFontSize,
      matrixChars: state.matrixChars,
      backgroundImage: state.backgroundImage,
      filterCriteria: state.filterCriteria
    }
  };
  
  // Calculate backup size in bytes
  const backupJson = JSON.stringify(backup.data);
  backup.size = backupJson.length;
  
  // Add to history
  if (!state.backupHistory) state.backupHistory = [];
  state.backupHistory.unshift(backup);
  
  // Update last backup time
  state.backupSettings.lastBackup = backup.timestamp;
  
  // Calculate next backup time
  calculateNextBackupTime();
  
  // Auto-delete old backups based on retention policy
  if (state.backupSettings.autoDelete && state.backupSettings.retentionDays > 0) {
    const cutoffDate = new Date(Date.now() - state.backupSettings.retentionDays * 24 * 60 * 60 * 1000);
    const oldBackups = state.backupHistory.filter(b => new Date(b.timestamp) < cutoffDate);
    
    // Delete old backups from history
    state.backupHistory = state.backupHistory.filter(b => new Date(b.timestamp) >= cutoffDate);
    
    // Delete physical files from server for old backups
    oldBackups.forEach(oldBackup => {
      const filename = oldBackup.filename || `backup_${oldBackup.id}.json`;
      fetch('Database/backup.api.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filename })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
        } else {
        }
      })
      .catch(error => {
      });
    });
    
    if (oldBackups.length > 0) {
      logBackupEvent('info', `Auto-deleted ${oldBackups.length} old backup(s) (retention: ${state.backupSettings.retentionDays} days)`);
    }
  }
  
  // Keep only last 50 backups to prevent memory issues
  if (state.backupHistory.length > 50) {
    const excessBackups = state.backupHistory.slice(50);
    state.backupHistory = state.backupHistory.slice(0, 50);
    
    // Delete physical files for excess backups
    excessBackups.forEach(excessBackup => {
      const filename = excessBackup.filename || `backup_${excessBackup.id}.json`;
      fetch('Database/backup.api.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filename })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
        }
      })
      .catch(error => {
      });
    });
    
    if (excessBackups.length > 0) {
    }
  }
  
  // Save backup to server folder
  saveBackupToServer(backup);
  
    saveState();
    logBackupEvent('info', `Backup created: ${backup.recordCount} records, ${backup.size} bytes`, backup);
    return backup;
  } catch (error) {
    logBackupEvent('error', `Failed to create backup: ${error.message}`, null, error);
    throw error; // Re-throw to allow caller to handle
  }
}

function saveBackupToServer(backup) {
  
  // Generate filename using download settings: backup_{downloadFilename}_{timestamp}.json
  const baseFilename = state.downloadFilename || 'sprint-tracker';
  const timestamp = getFormattedTimestamp();
  const filename = timestamp ? `backup_${baseFilename}_${timestamp}.json` : `backup_${baseFilename}_${backup.id}.json`;
  
  fetch('Database/backup.api.php?action=save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      id: backup.id,
      timestamp: backup.timestamp,
      filename: filename,
      recordCount: backup.recordCount,
      size: backup.size,
      scheduleType: backup.scheduleType,
      data: backup.data
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      toast('Backup file saved: ' + data.data.filename, 'success');
    } else {
      toast('Failed to save backup file', 'error');
    }
  })
  .catch(error => {
    toast('Error saving backup file: ' + error.message, 'error');
  });
}

function calculateNextBackupTime() {
  if (!state.backupSettings.enabled) return;
  
  const now = new Date();
  const scheduleType = state.backupSettings.scheduleType;
  const timeStr = state.backupSettings.scheduleTime || '02:00';
  const [hours, mins] = (timeStr.includes(':') ? timeStr : timeStr + ':00').split(':').map(Number);
  
  let nextTime = new Date(now);
  nextTime.setSeconds(0, 0); // Always set seconds and milliseconds to 0
  
  if (scheduleType === 'hourly') {
    // For hourly backups, run at the specified minute of every hour
    nextTime.setMinutes(mins);
    // If we've passed this minute in current hour, move to next hour
    if (nextTime <= now) {
      nextTime.setHours(nextTime.getHours() + 1);
      nextTime.setMinutes(mins);
    }
  } else if (scheduleType === 'daily') {
    // For daily backups, run at the exact time every day
    nextTime.setHours(hours, mins);
    // If time has passed today, schedule for tomorrow
    if (nextTime <= now) {
      nextTime.setDate(nextTime.getDate() + 1);
    }
  } else if (scheduleType === 'weekly') {
    // For weekly backups, run at the exact time on the specified day
    const dayMap = {Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 0};
    const targetDay = dayMap[state.backupSettings.scheduleDay] || 1;
    nextTime.setHours(hours, mins);
    
    const currentDay = nextTime.getDay();
    let daysAhead = targetDay - currentDay;
    
    // If target day is today but time has passed, schedule for next week
    if (daysAhead === 0 && nextTime <= now) {
      daysAhead = 7;
    } else if (daysAhead < 0) {
      daysAhead += 7;
    }
    
    if (daysAhead > 0) {
      nextTime.setDate(nextTime.getDate() + daysAhead);
    }
  } else if (scheduleType === 'monthly') {
    // For monthly backups, run at the exact time on the specified date
    const targetDate = parseInt(state.backupSettings.scheduleDate) || 1;
    nextTime.setHours(hours, mins);
    nextTime.setDate(targetDate);
    
    // If the date/time has passed this month, schedule for next month
    if (nextTime <= now) {
      nextTime.setMonth(nextTime.getMonth() + 1);
      nextTime.setDate(targetDate);
    }
  } else if (scheduleType === 'yearly') {
    // For yearly backups, run at the exact time on January 1st
    nextTime.setHours(hours, mins);
    nextTime.setMonth(0);
    nextTime.setDate(1);
    
    // If Jan 1st has passed this year, schedule for next year
    if (nextTime <= now) {
      nextTime.setFullYear(nextTime.getFullYear() + 1);
    }
  }
  
  state.backupSettings.nextBackup = nextTime.toISOString();
  saveState();
}

// Backup Execution Log System
function logBackupEvent(type, message, backup = null, error = null) {
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  const logEntry = {
    id: Date.now(),
    timestamp: timestamp,
    type: type, // 'success', 'error', 'warning', 'info'
    message: message,
    backupId: backup?.id || null,
    recordCount: backup?.recordCount || null,
    size: backup?.size || null,
    scheduleType: backup?.scheduleType || state.backupSettings?.scheduleType || null,
    errorDetails: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : null
  };
  
  // Initialize backup log if it doesn't exist
  if (!state.backupLog) state.backupLog = [];
  
  // Add to beginning of log
  state.backupLog.unshift(logEntry);
  
  // Keep only last 100 log entries
  if (state.backupLog.length > 100) {
    state.backupLog = state.backupLog.slice(0, 100);
  }
  
  saveState();
  
  // Update log display if visible
  renderBackupLog();
}

function checkAndExecuteBackup() {
  if (!state.backupSettings?.enabled) {
    // Don't log when backups are disabled to avoid spam
    return;
  }
  
  const now = new Date();
  
  // Calculate next backup if not already set
  if (!state.backupSettings.nextBackup) {
    calculateNextBackupTime();
    return;
  }
  
  const nextBackup = new Date(state.backupSettings.nextBackup);
  
  // Check if we've reached or passed the scheduled time
  // Use 5-second tolerance for precise backup timing
  const tolerance = 5000; // 5 seconds for precise execution
  const timeDiff = now.getTime() - nextBackup.getTime();
  
  // Only execute if:
  // 1. We're past the scheduled time (timeDiff >= 0)
  // 2. We're within tolerance window (timeDiff < tolerance)
  // 3. Last backup was more than 30 seconds ago (to prevent duplicates)
  const lastBackupTime = state.backupSettings.lastBackup ? new Date(state.backupSettings.lastBackup).getTime() : 0;
  const timeSinceLastBackup = now.getTime() - lastBackupTime;
  const minTimeBetweenBackups = 30000; // 30 seconds
  
  if (timeDiff >= 0 && timeDiff < tolerance && timeSinceLastBackup >= minTimeBetweenBackups) {
    
    try {
      const backup = createBackup();
      
      // Log successful backup
      logBackupEvent('success', `Scheduled backup completed successfully`, backup);
      
      // Mark this backup time as processed by calculating the NEXT backup
      // This prevents re-triggering during the tolerance window
      calculateNextBackupTime();
      
      // Update UI
      renderBackupHistoryTable();
      updateStorageInfo();
      renderBackupSettingsCard();
      
      toast('Scheduled backup completed', 'success');
    } catch (error) {
      // Log backup failure
      logBackupEvent('error', `Backup failed: ${error.message}`, null, error);
      toast('Backup failed: ' + error.message, 'error');
    }
  } else if (timeDiff >= tolerance) {
    // Missed backup window completely, skip and calculate next
    const missedMessage = `Missed backup window (scheduled: ${nextBackup.toLocaleString()}, checked: ${now.toLocaleString()})`;
    logBackupEvent('warning', missedMessage);
    calculateNextBackupTime();
  }
  // else: we're still waiting for the scheduled time
}

function restoreBackup(backupId) {
  const backup = state.backupHistory.find(b => b.id === backupId);
  if (!backup) {
    toast('Backup not found', 'error');
    return;
  }
  
  if (!confirm('Restore backup from ' + new Date(backup.timestamp).toLocaleString() + '? Current unsaved data will be lost.')) {
    return;
  }
  
  // Restore all data from backup
  Object.keys(backup.data).forEach(k => {
    state[k] = backup.data[k];
  });
  
  saveState();
  
  // Refresh UI
  location.reload();
}

function deleteBackup(backupId) {
  const backup = state.backupHistory.find(b => b.id === backupId);
  if (!backup) {
    toast('Backup not found', 'error');
    logBackupEvent('error', 'Failed to delete backup: Backup not found');
    return;
  }
  
  if (!confirm('Delete this backup permanently? This will remove it from history and delete the backup file.')) return;
  
  // Store backup info for logging
  const backupTimestamp = backup.timestamp;
  const backupRecords = backup.recordCount;
  
  // Remove from state
  state.backupHistory = state.backupHistory.filter(b => b.id !== backupId);
  saveState();
  
  // Delete the physical backup file from server
  // Send the actual filename stored in the backup object
  const filename = backup.filename || `backup_${backup.id}.json`;
  
  fetch('Database/backup.api.php', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: filename })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      toast('Backup deleted from all locations', 'success');
      logBackupEvent('info', `Manually deleted backup from ${backupTimestamp} (${backupRecords} records, ${data.filename})`);
    } else {
      toast('Backup removed from history (file may remain on server)', 'warning');
      logBackupEvent('warning', `Backup deleted from history but file deletion failed: ${data.error}`);
    }
  })
  .catch(error => {
    toast('Backup removed from history (file deletion failed)', 'warning');
    logBackupEvent('error', `Backup deleted from history but file deletion error: ${error.message}`);
  });
  
  // Update UI immediately
  renderBackupHistoryTable();
  updateStorageInfo();
}

function renderBackupHistoryTable() {
  const container = document.getElementById('backupHistoryContainer');
  if (!container) return;
  
  if (!state.backupHistory || state.backupHistory.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3);">No backups yet. Enable scheduled backups and they will appear here.</div>';
    return;
  }
  
  const formatSize = bytes => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  };
  
  const formatTimestamp = ts => {
    // Parse the timestamp correctly
    // If it's already a Date object or milliseconds, use it directly
    // If it's a string in MM/DD/YYYY format, parse it correctly
    let date;
    if (typeof ts === 'string') {
      // Handle MM/DD/YYYY HH:MM:SS format
      date = new Date(ts);
    } else {
      date = new Date(ts);
    }
    
    // Format the date properly with seconds
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };
  
  let html = '<div style="margin-bottom:8px;font-size:12px;font-weight:600;color:var(--text2);">Backup History</div>';
  html += '<div style="max-height:180px;overflow-y:auto;overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius-sm);"><table style="width:100%;border-collapse:collapse;table-layout:auto;min-width:600px;"><thead><tr>';
  html += '<th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface2);position:sticky;top:0;z-index:1;white-space:nowrap;">Timestamp</th>';
  html += '<th style="padding:6px 8px;text-align:center;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface2);position:sticky;top:0;z-index:1;width:70px;">Records</th>';
  html += '<th style="padding:6px 8px;text-align:center;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface2);position:sticky;top:0;z-index:1;width:60px;">Notes</th>';
  html += '<th style="padding:6px 8px;text-align:center;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface2);position:sticky;top:0;z-index:1;width:60px;">Tags</th>';
  html += '<th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface2);position:sticky;top:0;z-index:1;width:70px;">Size</th>';
  html += '<th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface2);position:sticky;top:0;z-index:1;width:80px;">Type</th>';
  html += '<th style="padding:6px 8px;text-align:center;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface2);position:sticky;top:0;z-index:1;width:120px;">Actions</th>';
  html += '</tr></thead><tbody>';
  
  state.backupHistory.forEach(backup => {
    const createdTime = formatTimestamp(backup.timestamp);
    const size = formatSize(backup.size);
    const type = (backup.scheduleType || 'manual').charAt(0).toUpperCase() + (backup.scheduleType || 'manual').slice(1);
    const notesCount = backup.data?.notes?.length || 0;
    const tagsCount = backup.data?.tags?.length || 0;
    
    html += `<tr style="border-bottom:1px solid var(--border);">`;
    html += `<td style="padding:4px 6px;font-size:10px;color:var(--text2);white-space:nowrap;">${createdTime}</td>`;
    html += `<td style="padding:4px 6px;font-size:11px;text-align:center;color:var(--accent);font-weight:600;">${backup.recordCount}</td>`;
    html += `<td style="padding:4px 6px;font-size:11px;text-align:center;color:var(--accent);font-weight:600;">${notesCount}</td>`;
    html += `<td style="padding:4px 6px;font-size:11px;text-align:center;color:var(--accent);font-weight:600;">${tagsCount}</td>`;
    html += `<td style="padding:4px 6px;font-size:10px;color:var(--text3);">${size}</td>`;
    html += `<td style="padding:4px 6px;font-size:9px;"><span style="padding:2px 4px;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.3);color:var(--accent4);border-radius:8px;font-weight:500;">${type}</span></td>`;
    html += `<td style="padding:4px 6px;text-align:center;"><div style="display:flex;gap:3px;justify-content:center;"><button class="btn btn-success btn-sm" onclick="downloadBackupJSON(${backup.id})" title="Download backup" style="padding:4px 8px;font-size:10px;">📥</button><button class="btn btn-primary btn-sm" onclick="restoreBackup(${backup.id})" title="Restore" style="padding:4px 8px;font-size:10px;">↩️</button><button class="btn btn-danger btn-sm" onclick="deleteBackup(${backup.id})" title="Delete" style="padding:4px 8px;font-size:10px;">🗑</button></div></td>`;
    html += `</tr>`;
  });
  
  html += '</tbody></table></div>';
  container.innerHTML = html;
  
  // Update backup history badge count
  const backupBadge = document.getElementById('backupHistoryBadge');
  if (backupBadge) {
    backupBadge.textContent = state.backupHistory?.length || 0;
  }
  
  // Also update in case badge is in multiple locations
  document.querySelectorAll('#backupHistoryBadge').forEach(b => {
    b.textContent = state.backupHistory?.length || 0;
  });
}

function renderBackupLog() {
  const container = document.getElementById('backupLogContainer');
  if (!container) return;
  
  if (!state.backupLog || state.backupLog.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:11px;">No log entries yet. Logs will appear here when backups run.</div>';
    return;
  }
  
  const getLogIcon = type => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };
  
  const getLogColor = type => {
    switch(type) {
      case 'success': return 'var(--accent4)';
      case 'error': return '#f87171';
      case 'warning': return '#fbbf24';
      case 'info': return 'var(--accent)';
      default: return 'var(--text2)';
    }
  };
  
  let html = '<div style="max-height:180px;overflow-y:auto;overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius-sm);">';
  html += '<table style="width:100%;font-size:11px;border-collapse:collapse;table-layout:auto;min-width:600px;"><thead><tr>';
  html += '<th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:1;white-space:nowrap;">Time</th>';
  html += '<th style="padding:6px 8px;text-align:center;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:1;width:70px;">Status</th>';
  html += '<th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:1;">Message</th>';
  html += '<th style="padding:6px 8px;text-align:center;font-size:10px;font-weight:600;text-transform:uppercase;color:var(--text3);border-bottom:1px solid var(--border);background:var(--surface);position:sticky;top:0;z-index:1;width:80px;">Records</th>';
  html += '</tr></thead><tbody>';
  
  // Show only last 20 log entries
  const recentLogs = state.backupLog.slice(0, 20);
  
  recentLogs.forEach(log => {
    const icon = getLogIcon(log.type);
    const color = getLogColor(log.type);
    
    html += `<tr style="border-bottom:1px solid var(--border);">`;
    html += `<td style="padding:4px 6px;color:var(--text3);font-size:10px;white-space:nowrap;">${log.timestamp}</td>`;
    html += `<td style="padding:4px 6px;text-align:center;"><span style="font-size:14px;" title="${log.type}">${icon}</span></td>`;
    html += `<td style="padding:4px 6px;color:${color};font-size:10px;">${log.message}`;
    
    // Add error details if present
    if (log.errorDetails) {
      html += `<div style="margin-top:4px;padding:6px;background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.3);border-radius:4px;font-size:9px;color:#f87171;">`;
      html += `<strong>Error:</strong> ${log.errorDetails.name}<br>`;
      html += `<strong>Details:</strong> ${log.errorDetails.message}`;
      html += `</div>`;
    }
    
    html += `</td>`;
    html += `<td style="padding:4px 6px;text-align:center;color:var(--accent);font-weight:600;font-size:10px;">${log.recordCount !== null ? log.recordCount : '-'}</td>`;
    html += `</tr>`;
  });
  
  html += '</tbody></table></div>';
  
  // Add clear log button
  html += '<button class="btn btn-secondary btn-sm" onclick="clearBackupLog()" style="width:100%;margin-top:8px;font-size:10px;padding:6px;">🗑️ Clear Log</button>';
  
  container.innerHTML = html;
  
  // Update badge count in multiple locations to ensure it updates
  const badge = document.getElementById('backupLogBadge');
  if (badge) {
    badge.textContent = state.backupLog?.length || 0;
  }
  
  // Also update in case badge is in a different location
  document.querySelectorAll('#backupLogBadge').forEach(b => {
    b.textContent = state.backupLog?.length || 0;
  });
}

function clearBackupLog() {
  if (!confirm('Clear all backup log entries?')) return;
  state.backupLog = [];
  saveState();
  renderBackupLog();
  
  // Force badge update after clearing
  const badge = document.getElementById('backupLogBadge');
  if (badge) {
    badge.textContent = '0';
  }
  document.querySelectorAll('#backupLogBadge').forEach(b => {
    b.textContent = '0';
  });
  
  toast('Backup log cleared', 'success');
}

function downloadBackupJSON(backupId) {
  const backup = state.backupHistory.find(b => b.id === backupId);
  if (!backup) {
    toast('Backup not found', 'error');
    return;
  }
  
  // Use download filename settings: backup_{downloadFilename}_{timestamp}.json
  const baseFilename = state.downloadFilename || 'sprint-tracker';
  const timestamp = getFormattedTimestamp();
  const filename = timestamp ? `backup_${baseFilename}_${timestamp}.json` : `backup_${baseFilename}.json`;
  const backupData = JSON.stringify(backup.data, null, 2);
  
  const blob = new Blob([backupData], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  toast('Backup downloaded', 'success');
}

function downloadAllBackups() {
  if (!state.backupHistory || state.backupHistory.length === 0) {
    toast('No backups to download', 'error');
    return;
  }
  
  const allBackups = {
    exportDate: new Date().toISOString(),
    backupCount: state.backupHistory.length,
    backups: state.backupHistory
  };
  
  // Use download filename settings: backup-all_{downloadFilename}_{timestamp}.json
  const baseFilename = state.downloadFilename || 'sprint-tracker';
  const timestamp = getFormattedTimestamp();
  const filename = timestamp ? `backup-all_${baseFilename}_${timestamp}.json` : `backup-all_${baseFilename}.json`;
  const backupData = JSON.stringify(allBackups, null, 2);
  
  const blob = new Blob([backupData], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  
  toast('All backups downloaded (' + state.backupHistory.length + ' files)', 'success');
}

function restoreFromFile() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const backupData = JSON.parse(event.target.result);
        
        if (!confirm('Restore from file? This will replace all current data.')) {
          return;
        }
        
        // Restore data
        Object.keys(backupData).forEach(k => {
          state[k] = backupData[k];
        });
        
        saveState();
        location.reload();
      } catch (error) {
        toast('Invalid backup file', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

function cleanupOldBackups() {
  if (!state.backupSettings.autoDelete || state.backupSettings.retentionDays <= 0) {
    return;
  }
  
  const cutoffDate = new Date(Date.now() - state.backupSettings.retentionDays * 24 * 60 * 60 * 1000);
  const oldBackups = state.backupHistory.filter(b => new Date(b.timestamp) < cutoffDate);
  
  if (oldBackups.length === 0) {
    return;
  }
  
  // Delete old backups from history
  state.backupHistory = state.backupHistory.filter(b => new Date(b.timestamp) >= cutoffDate);
  
  // Delete physical files from server for old backups
  oldBackups.forEach(oldBackup => {
    const filename = oldBackup.filename || `backup_${oldBackup.id}.json`;
    fetch('Database/backup.api.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: filename })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
      } else {
      }
    })
    .catch(error => {
    });
  });
  
  logBackupEvent('info', `Cleaned up ${oldBackups.length} old backup(s) (retention: ${state.backupSettings.retentionDays} days)`);
  
  saveState();
  renderBackupHistoryTable();
  updateStorageInfo();
}

function updateBackupSettings() {
  state.backupSettings.enabled = document.getElementById('backupEnabled').checked;
  state.backupSettings.scheduleType = document.getElementById('backupScheduleType').value;
  state.backupSettings.scheduleTime = document.getElementById('backupScheduleTime').value;
  state.backupSettings.scheduleDay = document.getElementById('backupScheduleDay')?.value || 'Monday';
  state.backupSettings.scheduleDate = document.getElementById('backupScheduleDate')?.value || '1';
  state.backupSettings.autoDelete = document.getElementById('backupAutoDelete').checked;
  state.backupSettings.retentionDays = parseInt(document.getElementById('backupRetentionDays').value) || 30;
  
  calculateNextBackupTime();
  
  // Immediately clean up old backups if auto-delete is enabled
  if (state.backupSettings.autoDelete && state.backupSettings.retentionDays > 0) {
    cleanupOldBackups();
  }
  
  saveState();
  renderBackupSettingsCard();
  
  // Immediately check if we should execute a backup
  if (state.backupSettings.enabled) {
    checkAndExecuteBackup();
  }
  
  toast('Backup settings updated', 'success');
}

function renderBackupSettingsCard() {
  const container = document.getElementById('backupSettingsContainer');
  if (!container) return;
  
  const settings = state.backupSettings;
  const formatTimestamp = ts => {
    if (!ts) return 'Not scheduled';
    const date = new Date(ts);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  const nextBackupTime = formatTimestamp(settings.nextBackup);
  const lastBackupTime = settings.lastBackup ? formatTimestamp(settings.lastBackup) : 'Never';
  
  container.innerHTML = `
    <div class="setting-card" style="max-width:100%;width:100%;">
      <div class="setting-card-title" style="margin-bottom:20px;">💾 Scheduled Data Export & Backup</div>
      
      <!-- Horizontal 3-column layout with flexible sizing -->
      <div style="display:grid;grid-template-columns:minmax(280px,1fr) minmax(350px,1.8fr) minmax(280px,1fr);gap:18px;align-items:start;">
        
        <!-- LEFT COLUMN: Settings & Schedule -->
        <div style="display:flex;flex-direction:column;gap:14px;">
          <!-- Status Info Box -->
          <div style="background:linear-gradient(135deg,rgba(16,185,129,0.12),rgba(6,182,212,0.08));border:1px solid rgba(16,185,129,0.25);border-radius:var(--radius-sm);padding:14px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
              <div>
                <div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Last Backup</div>
                <div style="font-size:12px;color:var(--accent4);margin-top:2px;font-weight:600;">${lastBackupTime}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Next Scheduled</div>
                <div style="font-size:12px;color:var(--accent3);margin-top:2px;font-weight:600;">${nextBackupTime}</div>
              </div>
            </div>
            <div style="font-size:10px;color:var(--text3);line-height:1.5;border-top:1px solid rgba(16,185,129,0.15);padding-top:8px;">
              ${settings.enabled 
                ? '✅ <strong>Active:</strong> Automated backups are running' 
                : '⚠️ <strong>Disabled:</strong> Enable scheduled backups below'}
            </div>
          </div>
          
          <!-- Enable Toggle -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;font-weight:600;color:var(--text);" for="backupEnabled">
              <input type="checkbox" id="backupEnabled" name="backupEnabled" ${settings.enabled ? 'checked' : ''} onchange="updateBackupSettings()" style="accent-color:var(--accent);cursor:pointer;width:20px;height:20px;flex-shrink:0;">
              <span style="font-size:13px;">Enable Scheduled Backups</span>
            </label>
          </div>
          
          <!-- Schedule Settings -->
          <div style="background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.2);border-radius:var(--radius-sm);padding:14px;${!settings.enabled ? 'opacity:0.5;pointer-events:none' : ''}">
            <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;">⏱️ Schedule Configuration</div>
            
            <div class="form-group" style="margin-bottom:12px;">
              <label for="backupScheduleType" style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Frequency</label>
              <select id="backupScheduleType" name="backupScheduleType" onchange="updateBackupSettings()" style="width:100%;">
                <option value="hourly" ${settings.scheduleType === 'hourly' ? 'selected' : ''}>⏰ Every Hour</option>
                <option value="daily" ${settings.scheduleType === 'daily' ? 'selected' : ''}>📅 Daily</option>
                <option value="weekly" ${settings.scheduleType === 'weekly' ? 'selected' : ''}>📆 Weekly</option>
                <option value="monthly" ${settings.scheduleType === 'monthly' ? 'selected' : ''}>🗓️ Monthly</option>
                <option value="yearly" ${settings.scheduleType === 'yearly' ? 'selected' : ''}>📖 Yearly</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom:12px;">
              <label for="backupScheduleTime" style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">${settings.scheduleType === 'hourly' ? 'Minute of Hour (HH:MM:SS)' : 'Time (HH:MM:SS)'}</label>
              <input type="time" id="backupScheduleTime" name="backupScheduleTime" value="${settings.scheduleTime}" onchange="updateBackupSettings()" step="1" style="width:100%;">
              ${settings.scheduleType === 'hourly' ? '<div style="font-size:9px;color:var(--text3);margin-top:4px;">💡 Backup will run every hour at minute ' + settings.scheduleTime.split(':')[1] + '</div>' : '<div style="font-size:9px;color:var(--text3);margin-top:4px;">💡 Backup will run at exactly ' + settings.scheduleTime + '</div>'}
            </div>
            
            <div class="form-group" style="margin-bottom:0;${settings.scheduleType !== 'weekly' ? 'display:none' : ''}">
              <label for="backupScheduleDay" style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Day of Week</label>
              <select id="backupScheduleDay" name="backupScheduleDay" onchange="updateBackupSettings()" style="width:100%;">
                <option value="Monday" ${settings.scheduleDay === 'Monday' ? 'selected' : ''}>Monday</option>
                <option value="Tuesday" ${settings.scheduleDay === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
                <option value="Wednesday" ${settings.scheduleDay === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
                <option value="Thursday" ${settings.scheduleDay === 'Thursday' ? 'selected' : ''}>Thursday</option>
                <option value="Friday" ${settings.scheduleDay === 'Friday' ? 'selected' : ''}>Friday</option>
                <option value="Saturday" ${settings.scheduleDay === 'Saturday' ? 'selected' : ''}>Saturday</option>
                <option value="Sunday" ${settings.scheduleDay === 'Sunday' ? 'selected' : ''}>Sunday</option>
              </select>
            </div>
            
            <div class="form-group" style="margin-bottom:0;${settings.scheduleType !== 'monthly' ? 'display:none' : ''}">
              <label for="backupScheduleDate" style="font-size:10px;font-weight:600;color:var(--text3);text-transform:uppercase;display:block;margin-bottom:4px;">Day of Month</label>
              <input type="number" id="backupScheduleDate" name="backupScheduleDate" value="${settings.scheduleDate}" min="1" max="31" onchange="updateBackupSettings()" style="width:100%;">
            </div>
          </div>
          
          <!-- Auto-Delete Settings -->
          <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:var(--radius-sm);padding:14px;">
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:12px;font-weight:600;" for="backupAutoDelete">
              <input type="checkbox" id="backupAutoDelete" name="backupAutoDelete" ${settings.autoDelete ? 'checked' : ''} onchange="updateBackupSettings()" style="accent-color:var(--accent);cursor:pointer;width:18px;height:18px;flex-shrink:0;">
              <span style="font-size:12px;">🗑️ Auto-Delete Old Backups</span>
            </label>
            
            <div class="form-group" style="margin-bottom:0;${!settings.autoDelete ? 'opacity:0.5;pointer-events:none' : ''}">
              <label for="backupRetentionDays" style="font-size:10px;color:var(--text3);font-weight:600;display:block;margin-bottom:4px;">Retention Period (days)</label>
              <input type="number" id="backupRetentionDays" name="backupRetentionDays" value="${settings.retentionDays}" min="1" max="365" onchange="updateBackupSettings()" style="width:100%;">
              <div style="font-size:9px;color:var(--text3);margin-top:6px;line-height:1.4;">💡 Backups older than ${settings.retentionDays} days will be automatically removed</div>
            </div>
          </div>
        </div>
        
        <!-- MIDDLE COLUMN: Backup History Table & Execution Log -->
        <div style="display:flex;flex-direction:column;gap:14px;min-height:400px;">
          <!-- Backup History -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;">
            <div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
              📋 Backup History
              <span id="backupHistoryBadge" style="background:var(--accent);color:var(--bg);font-size:10px;padding:2px 8px;border-radius:10px;font-weight:700;">${state.backupHistory?.length || 0}</span>
            </div>
            <div id="backupHistoryContainer"></div>
          </div>
          
          <!-- Backup Execution Log -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;">
            <div style="font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
              📄 Execution Log
              <span id="backupLogBadge" style="background:var(--accent4);color:var(--bg);font-size:10px;padding:2px 8px;border-radius:10px;font-weight:700;">${state.backupLog?.length || 0}</span>
            </div>
            <div id="backupLogContainer"></div>
          </div>
        </div>
        
        <!-- RIGHT COLUMN: Actions & Info -->
        <div style="display:flex;flex-direction:column;gap:14px;">
          <!-- Features Info -->
          <div style="background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(99,102,241,0.08));border:1px solid rgba(124,58,237,0.25);border-radius:var(--radius-sm);padding:12px;">
            <div style="font-size:10px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">✨ Features</div>
            <div style="font-size:9px;color:var(--text2);line-height:1.6;word-wrap:break-word;">
              ✅ Automated scheduled backups<br>
              ✅ Manual backup creation<br>
              ✅ Retention policy management<br>
              ✅ Disaster recovery points<br>
              ✅ Download & external storage<br>
              ✅ Quick restore from history
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;">
            <div style="font-size:10px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;">⚡ Quick Actions</div>
            
            <button class="btn btn-primary btn-sm" onclick="createBackup();renderBackupHistoryTable();toast('Manual backup created','success');" style="width:100%;margin-bottom:7px;font-size:11px;padding:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              💾 Create Backup Now
            </button>
            
            <button class="btn btn-secondary btn-sm" onclick="downloadAllBackups();" style="width:100%;margin-bottom:7px;font-size:11px;padding:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              📦 Download All Backups
            </button>
            
            <button class="btn btn-purple btn-sm" onclick="restoreFromFile();" style="width:100%;font-size:11px;padding:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="Restore backup from file">
              ↩️ Restore from File
            </button>
          </div>
          
          <!-- Storage Stats -->
          <div style="background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.25);border-radius:var(--radius-sm);padding:12px;">
            <div style="font-size:10px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">💾 Storage Info</div>
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
              <span style="font-size:9px;color:var(--text3);">Total Backups:</span>
              <span id="storageBackupCount" style="font-size:10px;color:var(--accent);font-weight:700;">${state.backupHistory?.length || 0}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
              <span style="font-size:9px;color:var(--text3);">Total Records:</span>
              <span id="storageRecordCount" style="font-size:10px;color:var(--accent);font-weight:700;">${state.records?.length || 0}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
              <span style="font-size:9px;color:var(--text3);">Total Notes:</span>
              <span id="storageNoteCount" style="font-size:10px;color:var(--accent);font-weight:700;">${state.notes?.length || 0}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:9px;color:var(--text3);">Max Retention:</span>
              <span style="font-size:10px;color:var(--accent);font-weight:700;">50 backups</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Update storage stats with fresh data from server
  updateStorageStats();
  
  renderBackupHistoryTable();
  renderBackupLog();
  updateStorageInfo();
}

function updateStorageInfo() {
  // Update storage info with current values
  const backupCountEl = document.getElementById('storageBackupCount');
  const recordCountEl = document.getElementById('storageRecordCount');
  const noteCountEl = document.getElementById('storageNoteCount');
  const backupBadgeEl = document.getElementById('backupHistoryBadge');
  
  const backupCount = state.backupHistory?.length || 0;
  
  if (backupCountEl) backupCountEl.textContent = backupCount;
  if (backupBadgeEl) backupBadgeEl.textContent = backupCount;
  if (recordCountEl) recordCountEl.textContent = state.records?.length || 0;
  if (noteCountEl) noteCountEl.textContent = state.notes?.length || 0;
}

// Check for scheduled backups every 5 seconds for precise timing
setInterval(checkAndExecuteBackup, 5000);

// Auto-refresh Execution Log display every 5 seconds to update the count
setInterval(() => {
  if (document.getElementById('backupLogContainer')) {
    renderBackupLog();
  }
}, 5000);

// Update storage stats with fresh data from database
function updateStorageStats() {
  fetch('Database/data.api.php?t=' + Date.now())
    .then(response => response.json())
    .then(data => {
      // Update the storage info counts
      const recordCountEl = document.getElementById('storageRecordCount');
      const noteCountEl = document.getElementById('storageNoteCount');
      const backupCountEl = document.getElementById('storageBackupCount');
      const backupBadgeEl = document.getElementById('backupHistoryBadge');
      
      const backupCount = data.backupHistory ? data.backupHistory.length : 0;
      
      if (recordCountEl) {
        recordCountEl.textContent = data.records ? data.records.length : 0;
      }
      if (noteCountEl) {
        noteCountEl.textContent = data.notes ? data.notes.length : 0;
      }
      if (backupCountEl) {
        backupCountEl.textContent = backupCount;
      }
      if (backupBadgeEl) {
        backupBadgeEl.textContent = backupCount;
      }
    })
    .catch(error => {
    });
}

// Run initial check after 5 seconds on page load
setTimeout(checkAndExecuteBackup, 5000);
