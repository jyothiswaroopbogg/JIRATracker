// Bulk Operations Management

// Initialize selected records array in state
if (!state.selectedRecords) {
  state.selectedRecords = [];
}

// Select/Deselect all visible records
function selectAllRecords(checked) {
  const filt = getFiltered();
  if (checked) {
    // Add all filtered record IDs to selection
    state.selectedRecords = [...new Set([...state.selectedRecords, ...filt.map(r => r.id)])];
  } else {
    // Clear selection
    state.selectedRecords = [];
  }
  renderTable();
  updateBulkOperationsBar();
}

// Toggle individual record selection
function toggleRecordSelection(recordId, checked) {
  if (checked) {
    if (!state.selectedRecords.includes(recordId)) {
      state.selectedRecords.push(recordId);
    }
  } else {
    state.selectedRecords = state.selectedRecords.filter(id => id !== recordId);
  }
  updateBulkOperationsBar();
  updateSelectAllCheckbox();
}

// Update the bulk operations bar visibility and count
function updateBulkOperationsBar() {
  const bar = document.getElementById('bulkOperationsBar');
  const countInfo = document.getElementById('bulkCountInfo');
  const count = state.selectedRecords.length;
  
  if (count > 0) {
    bar.style.display = 'flex';
    countInfo.textContent = count + ' record' + (count === 1 ? '' : 's') + ' selected';
  } else {
    bar.style.display = 'none';
  }
}

// Update select all checkbox state
function updateSelectAllCheckbox() {
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  if (!selectAllCheckbox) return;
  
  const filt = getFiltered();
  const allSelected = filt.length > 0 && filt.every(r => state.selectedRecords.includes(r.id));
  selectAllCheckbox.checked = allSelected;
}

// Clear all selections
function clearSelections() {
  state.selectedRecords = [];
  renderTable();
  updateBulkOperationsBar();
}

// Bulk Update Status
function bulkUpdateStatus() {
  if (!state.selectedRecords.length) {
    toast('No records selected', 'error');
    return;
  }
  
  const statusOptions = ['<option value="">— Select new status —</option>'];
  state.jiraStatuses.forEach(s => statusOptions.push('<option value="' + esc(s) + '">' + esc(s) + '</option>'));
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'bulkStatusModal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:450px;">
      <div class="modal-header">
        <div class="modal-title">📝 Bulk Update Status</div>
        <button class="modal-close" onclick="closeBulkModal('bulkStatusModal')">×</button>
      </div>
      <div class="bulk-modal-content">
        <div class="bulk-modal-info">
          Update Jira status for <strong>${state.selectedRecords.length}</strong> selected record(s)
        </div>
        <div class="form-group">
          <label for="bulkNewStatus">New Jira Status</label>
          <select id="bulkNewStatus" name="bulkNewStatus">${statusOptions.join('')}</select>
        </div>
      </div>
      <div class="form-actions" style="justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="closeBulkModal('bulkStatusModal')">Cancel</button>
        <button class="btn btn-primary" onclick="confirmBulkUpdateStatus()">Update</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmBulkUpdateStatus() {
  const newStatus = document.getElementById('bulkNewStatus').value;
  if (!newStatus) {
    toast('Select a status', 'error');
    return;
  }
  
  const count = state.selectedRecords.length;
  state.selectedRecords.forEach(id => {
    const rec = state.records.find(r => r.id === id);
    if (rec) {
      rec.jstatus = newStatus;
    }
  });
  
  state.selectedRecords = [];
  saveState();
  renderTable();
  updateKPIs();
  renderCharts();
  closeBulkModal('bulkStatusModal');
  toast('Updated ' + count + ' record(s)', 'success');
}

// Bulk Add Tags
function bulkAddTags() {
  if (!state.selectedRecords.length) {
    toast('No records selected', 'error');
    return;
  }
  
  if (!state.tags || state.tags.length === 0) {
    toast('No tags available. Add tags in Configuration first.', 'error');
    return;
  }
  
  const tagOptions = state.tags.map((tag, idx) => {
    const tagName = tag.name || tag;
    const color = tag.color || '#94a3b8';
    const tagId = 'bulk-add-tag-' + idx;
    return `<label class="tag-select-item" for="${tagId}" style="border-color:${color};">
      <input type="checkbox" id="${tagId}" name="${tagId}" value="${esc(tagName)}" style="accent-color:${color};">
      <span style="color:${color};">${esc(tagName)}</span>
    </label>`;
  }).join('');
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'bulkAddTagsModal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:500px;">
      <div class="modal-header">
        <div class="modal-title">🏷️ Add Tags to Selected Records</div>
        <button class="modal-close" onclick="closeBulkModal('bulkAddTagsModal')">×</button>
      </div>
      <div class="bulk-modal-content">
        <div class="bulk-modal-info">
          Add tags to <strong>${state.selectedRecords.length}</strong> selected record(s)
        </div>
        <div class="tag-select-list">
          ${tagOptions}
        </div>
      </div>
      <div class="form-actions" style="justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="closeBulkModal('bulkAddTagsModal')">Cancel</button>
        <button class="btn btn-primary" onclick="confirmBulkAddTags()">Add Tags</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmBulkAddTags() {
  const checkboxes = document.querySelectorAll('#bulkAddTagsModal .tag-select-item input[type="checkbox"]');
  const tagsToAdd = [...checkboxes].filter(c => c.checked).map(c => c.value);
  
  if (!tagsToAdd.length) {
    toast('Select at least one tag', 'error');
    return;
  }
  
  const count = state.selectedRecords.length;
  state.selectedRecords.forEach(id => {
    const currentTags = getRecordTags(id);
    const newTags = [...new Set([...currentTags, ...tagsToAdd])];
    setRecordTags(id, newTags);
  });
  
  state.selectedRecords = [];
  saveState();
  renderTable();
  closeBulkModal('bulkAddTagsModal');
  toast('Added tags to ' + count + ' record(s)', 'success');
}

// Bulk Remove Tags
function bulkRemoveTags() {
  if (!state.selectedRecords.length) {
    toast('No records selected', 'error');
    return;
  }
  
  if (!state.tags || state.tags.length === 0) {
    toast('No tags available', 'error');
    return;
  }
  
  const tagOptions = state.tags.map((tag, idx) => {
    const tagName = tag.name || tag;
    const color = tag.color || '#94a3b8';
    const tagId = 'bulk-remove-tag-' + idx;
    return `<label class="tag-select-item" for="${tagId}" style="border-color:${color};">
      <input type="checkbox" id="${tagId}" name="${tagId}" value="${esc(tagName)}" style="accent-color:${color};">
      <span style="color:${color};">${esc(tagName)}</span>
    </label>`;
  }).join('');
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'bulkRemoveTagsModal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:500px;">
      <div class="modal-header">
        <div class="modal-title">🏷️ Remove Tags from Selected Records</div>
        <button class="modal-close" onclick="closeBulkModal('bulkRemoveTagsModal')">×</button>
      </div>
      <div class="bulk-modal-content">
        <div class="bulk-modal-info">
          Remove tags from <strong>${state.selectedRecords.length}</strong> selected record(s)
        </div>
        <div class="tag-select-list">
          ${tagOptions}
        </div>
      </div>
      <div class="form-actions" style="justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="closeBulkModal('bulkRemoveTagsModal')">Cancel</button>
        <button class="btn btn-danger" onclick="confirmBulkRemoveTags()">Remove Tags</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
}

function confirmBulkRemoveTags() {
  const checkboxes = document.querySelectorAll('#bulkRemoveTagsModal .tag-select-item input[type="checkbox"]');
  const tagsToRemove = [...checkboxes].filter(c => c.checked).map(c => c.value);
  
  if (!tagsToRemove.length) {
    toast('Select at least one tag', 'error');
    return;
  }
  
  const count = state.selectedRecords.length;
  state.selectedRecords.forEach(id => {
    const currentTags = getRecordTags(id);
    const newTags = currentTags.filter(t => !tagsToRemove.includes(t));
    setRecordTags(id, newTags);
  });
  
  state.selectedRecords = [];
  saveState();
  renderTable();
  closeBulkModal('bulkRemoveTagsModal');
  toast('Removed tags from ' + count + ' record(s)', 'success');
}

// Bulk Delete Records
function bulkDeleteRecords() {
  if (!state.selectedRecords.length) {
    toast('No records selected', 'error');
    return;
  }
  
  const count = state.selectedRecords.length;
  
  showConfirmModal(
    '🗑️ Delete Multiple Records',
    `Are you sure you want to delete ${count} record(s)? This action cannot be undone and will permanently remove all selected records.`,
    () => {
      // Set deletion context before removing records
      if (typeof setDeletionContext === 'function') {
        setDeletionContext();
      }
      
      state.records = state.records.filter(r => !state.selectedRecords.includes(r.id));
      state.selectedRecords = [];
      saveState();
      renderTable();
      updateKPIs();
      renderCharts();
      updateRecordCount();
      
      // Refresh JIRA cached stories to update the +/✓ icons
      if (typeof loadCachedIssues === 'function') {
        loadCachedIssues(true).catch(err => {
          // Silent fail - JIRA refresh is not critical to deletion
        });
      }
      
      toast('Deleted ' + count + ' record(s)', 'info');
    },
    `🗑️ Delete ${count} Record(s)`,
    'btn-danger'
  );
}

// Bulk Export Selected Records
function bulkExportSelected() {
  if (!state.selectedRecords.length) {
    toast('No records selected', 'error');
    return;
  }
  
  const selected = state.records.filter(r => state.selectedRecords.includes(r.id));
  
  // Use the existing export functionality but filter to selected records only
  const originalRecords = state.records;
  state.records = selected;
  
  // Call the regular CSV export
  exportCSV();
  
  // Restore original records
  state.records = originalRecords;
  
  toast('Exported ' + selected.length + ' selected record(s)', 'success');
}

// Close bulk modal
function closeBulkModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.remove();
  }
}
