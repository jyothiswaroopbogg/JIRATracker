// Storage Information Modal
// Displays real-time statistics from database

function openStorageInfoModal() {
  const modal = document.getElementById('storageInfoModal');
  if (modal) {
    modal.classList.add('show');
    loadStorageInformation();
  }
}

function closeStorageInfoModal() {
  const modal = document.getElementById('storageInfoModal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function loadStorageInformation() {
  // Fetch fresh data from database
  fetch('Database/data.api.php?cache=' + new Date().getTime())
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      updateStorageDisplay(data);
    })
    .catch(error => {
      showStorageError(error.message);
    });
}

function updateStorageDisplay(data) {
  // Total Records
  const recordCount = data.records ? data.records.length : 0;
  updateElement('storage-total-records', recordCount);
  
  // Total Notes
  const notesCount = data.notes ? data.notes.length : 0;
  updateElement('storage-notes', notesCount);
  
  // Total Tags
  const tagsCount = data.tags ? data.tags.length : 0;
  updateElement('storage-tags', tagsCount);
  
  // Custom Columns
  const columnsCount = data.customColumns ? data.customColumns.length : 0;
  updateElement('storage-custom-cols', columnsCount);
  
  // Custom Tabs (if exists)
  const tabsCount = data.customTabs ? data.customTabs.length : 0;
  updateElement('storage-custom-tabs', tabsCount);
  
  // Calculate total data size
  const dataSize = calculateDataSize(data);
  updateElement('storage-data-size', dataSize);
  
  // Last saved timestamp
  const lastSaved = data.lastSaved || null;
  updateLastSaved(lastSaved);
  
  // Storage available
  updateStorageAvailable();
}

function calculateDataSize(data) {
  try {
    const jsonString = JSON.stringify(data);
    const bytes = new Blob([jsonString]).size;
    
    if (bytes < 1024) {
      return bytes + ' B';
    } else if (bytes < 1048576) {
      return (bytes / 1024).toFixed(2) + ' KB';
    } else {
      return (bytes / 1048576).toFixed(2) + ' MB';
    }
  } catch (e) {
    return 'N/A';
  }
}

function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function updateLastSaved(timestamp) {
  const element = document.getElementById('storage-last-saved');
  if (!element) return;
  
  if (timestamp) {
    const date = new Date(timestamp);
    const formatted = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    element.textContent = formatted;
  } else {
    element.textContent = 'Never';
  }
}

function updateStorageAvailable() {
  const element = document.getElementById('storage-available');
  if (!element) return;
  
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    navigator.storage.estimate().then(estimate => {
      const usedMB = (estimate.usage / 1048576).toFixed(2);
      const totalMB = (estimate.quota / 1048576).toFixed(0);
      element.textContent = `${usedMB} MB / ${totalMB} MB`;
    }).catch(() => {
      element.textContent = '~5-10 MB';
    });
  } else {
    element.textContent = '~5-10 MB';
  }
}

function showStorageError() {
  updateElement('storage-total-records', 'Error');
  updateElement('storage-data-size', 'Error');
  updateElement('storage-notes', 'Error');
  updateElement('storage-tags', 'Error');
  updateElement('storage-custom-cols', 'Error');
  updateElement('storage-custom-tabs', 'Error');
}
