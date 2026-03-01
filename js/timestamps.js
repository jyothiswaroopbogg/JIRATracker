/**
 * Timestamps Module
 * Handles creation and modification timestamps for records
 */

// Format timestamp to readable string
function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  const format = state.timestampFormat || 'datetime';
  
  switch(format) {
    case 'datetime':
      return `${year}-${month}-${day}T${hours}-${minutes}-${seconds}`;
    case 'date':
      return `${year}-${month}-${day}`;
    case 'datetime-underscore':
      return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    case 'compact':
      return `${year}${month}${day}-${hours}${minutes}${seconds}`;
    case 'none':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    default:
      return `${year}-${month}-${day}T${hours}-${minutes}-${seconds}`;
  }
}

// Format timestamp to date only
function formatTimestampDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Format timestamp to time only
function formatTimestampTime(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

// Get relative time string (e.g., "2 hours ago")
function getRelativeTime(timestamp) {
  if (!timestamp) return 'N/A';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Add timestamp badge to element
function renderTimestampBadge(timestamp, label = 'Created') {
  return `
    <span class="timestamp-badge" title="${formatTimestamp(timestamp)}">
      <span class="timestamp-icon">⏱️</span>
      <span>${label}: ${getRelativeTime(timestamp)}</span>
    </span>
  `;
}

// Render timestamp info block for edit modal
function renderTimestampInfo(record) {
  if (!record.createdAt && !record.modifiedAt) return '';
  
  return `
    <div class="timestamp-info">
      <div class="timestamp-row">
        ${record.createdAt ? `
          <span class="timestamp-icon-label">📅</span>
          <span class="timestamp-label">CREATED:</span>
          <span class="timestamp-value">${formatTimestamp(record.createdAt)}</span>
          <span class="timestamp-value">(${getRelativeTime(record.createdAt)})</span>
        ` : ''}
        ${record.modifiedAt ? `
          <span class="timestamp-icon-label" style="margin-left:20px">✏️</span>
          <span class="timestamp-label">MODIFIED:</span>
          <span class="timestamp-value">${formatTimestamp(record.modifiedAt)}</span>
          <span class="timestamp-value">(${getRelativeTime(record.modifiedAt)})</span>
        ` : ''}
      </div>
    </div>
  `;
}

// Render timestamp for table cell
function renderTableTimestamp(record) {
  if (!record.createdAt && !record.modifiedAt) return '<span>—</span>';
  
  return `
    <div class="table-timestamp">
      ${record.createdAt ? `
        <div class="table-timestamp-created" title="${formatTimestamp(record.createdAt)}">
          📅 ${formatTimestampDate(record.createdAt)} ${formatTimestampTime(record.createdAt)}
        </div>
      ` : ''}
      ${record.modifiedAt && record.modifiedAt !== record.createdAt ? `
        <div class="table-timestamp-modified" title="${formatTimestamp(record.modifiedAt)}">
          ✏️ ${getRelativeTime(record.modifiedAt)}
        </div>
      ` : ''}
    </div>
  `;
}

// Add timestamps to new record
function addCreatedTimestamp(record) {
  const now = Date.now();
  record.createdAt = now;
  record.modifiedAt = now;
  return record;
}

// Update modified timestamp
function updateModifiedTimestamp(record) {
  record.modifiedAt = Date.now();
  return record;
}

// Migrate existing records to have timestamps
function migrateRecordsTimestamps() {
  if (!state.records) return;
  
  let migrated = false;
  state.records.forEach(record => {
    if (!record.createdAt) {
      // Use record ID as creation timestamp if available (since IDs are timestamps)
      record.createdAt = record.id || Date.now();
      record.modifiedAt = record.id || Date.now();
      migrated = true;
    }
  });
  
  if (migrated) {
    saveState();
  }
}

// Sort records by timestamp
function sortRecordsByCreated(ascending = false) {
  if (!state.records) return;
  
  state.records.sort((a, b) => {
    const aTime = a.createdAt || 0;
    const bTime = b.createdAt || 0;
    return ascending ? aTime - bTime : bTime - aTime;
  });
}

function sortRecordsByModified(ascending = false) {
  if (!state.records) return;
  
  state.records.sort((a, b) => {
    const aTime = a.modifiedAt || 0;
    const bTime = b.modifiedAt || 0;
    return ascending ? aTime - bTime : bTime - aTime;
  });
}

// Get records created within a time range
function getRecordsCreatedInRange(startTime, endTime) {
  if (!state.records) return [];
  
  return state.records.filter(record => {
    if (!record.createdAt) return false;
    return record.createdAt >= startTime && record.createdAt <= endTime;
  });
}

// Get records modified within a time range
function getRecordsModifiedInRange(startTime, endTime) {
  if (!state.records) return [];
  
  return state.records.filter(record => {
    if (!record.modifiedAt) return false;
    return record.modifiedAt >= startTime && record.modifiedAt <= endTime;
  });
}

// Get records created today
function getRecordsCreatedToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.getTime();
  const endOfDay = startOfDay + 86400000; // 24 hours in ms
  
  return getRecordsCreatedInRange(startOfDay, endOfDay);
}

// Get records modified today
function getRecordsModifiedToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.getTime();
  const endOfDay = startOfDay + 86400000;
  
  return getRecordsModifiedInRange(startOfDay, endOfDay);
}
