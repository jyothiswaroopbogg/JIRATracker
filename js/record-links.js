// Record Linking System

let linkingRecordId = null;
let selectedRecordsToLink = [];

// Open Link Modal
function openLinkModal(absIdx) {
  const filt = getFiltered();
  const rec = filt[absIdx];
  if (!rec) return;
  
  linkingRecordId = rec.id;
  selectedRecordsToLink = [];
  
  // Display source record info
  const sourceEl = document.getElementById('linkSourceRecord');
  sourceEl.innerHTML = `
    <span style="color:var(--accent3);font-weight:600;">${formatJira(rec.jira) || 'No Jira'}</span>
    <span style="color:var(--text3);margin:0 6px;">•</span>
    <span style="color:var(--text);">${esc(rec.desc || 'No description')}</span>
  `;
  
  // Clear search
  document.getElementById('linkSearchInput').value = '';
  
  // Render all available records
  renderLinkRecordsList();
  updateLinkSelectedButton();
  
  document.getElementById('linkModal').classList.add('show');
}

// Close Link Modal
function closeLinkModal() {
  document.getElementById('linkModal').classList.remove('show');
  linkingRecordId = null;
  selectedRecordsToLink = [];
}

// Toggle Record Selection for Linking
function toggleLinkRecordSelection(recordId) {
  const idx = selectedRecordsToLink.indexOf(recordId);
  if (idx > -1) {
    selectedRecordsToLink.splice(idx, 1);
  } else {
    selectedRecordsToLink.push(recordId);
  }
  updateLinkSelectedButton();
}

// Update Link Selected Button
function updateLinkSelectedButton() {
  const btn = document.getElementById('linkSelectedBtn');
  if (!btn) return;
  
  const count = selectedRecordsToLink.length;
  if (count > 0) {
    btn.textContent = `🔗 Link Selected (${count})`;
    btn.disabled = false;
    btn.removeAttribute('disabled');
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.style.pointerEvents = 'auto';
  } else {
    btn.textContent = '🔗 Link Selected';
    btn.disabled = true;
    btn.setAttribute('disabled', 'disabled');
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
    btn.style.pointerEvents = 'none';
  }
}

// Link Multiple Selected Records
function linkSelectedRecords() {
  if (selectedRecordsToLink.length === 0) {
    toast('No records selected', 'error');
    return;
  }
  
  if (!linkingRecordId) {
    toast('Source record not found', 'error');
    return;
  }
  
  let linkedCount = 0;
  selectedRecordsToLink.forEach(targetId => {
    // Initialize recordLinks if needed
    if (!state.recordLinks) {
      state.recordLinks = {};
    }
    
    // Initialize arrays for both records if needed
    if (!state.recordLinks[linkingRecordId]) {
      state.recordLinks[linkingRecordId] = [];
    }
    if (!state.recordLinks[targetId]) {
      state.recordLinks[targetId] = [];
    }
    
    // Add bidirectional link if not already linked
    if (!state.recordLinks[linkingRecordId].includes(targetId)) {
      state.recordLinks[linkingRecordId].push(targetId);
      linkedCount++;
    }
    if (!state.recordLinks[targetId].includes(linkingRecordId)) {
      state.recordLinks[targetId].push(linkingRecordId);
    }
  });
  
  if (linkedCount > 0) {
    saveState();
    selectedRecordsToLink = [];
    renderLinkRecordsList(document.getElementById('linkSearchInput').value);
    renderTable();
    updateLinkSelectedButton();
    toast(`${linkedCount} record(s) linked successfully`, 'success');
  } else {
    toast('All selected records are already linked', 'info');
  }
}

// Render Link Records List
function renderLinkRecordsList(searchQuery = '') {
  const listEl = document.getElementById('linkRecordsList');
  if (!listEl) return;
  
  // Get all records except the source record
  let records = state.records.filter(r => r.id !== linkingRecordId);
  
  // Apply search filter
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    records = records.filter(r => 
      (r.jira && r.jira.toLowerCase().includes(q)) ||
      (r.desc && r.desc.toLowerCase().includes(q)) ||
      (r.pi && r.pi.toLowerCase().includes(q)) ||
      (r.sprint_start && r.sprint_start.toLowerCase().includes(q)) ||
      (r.sprint_end && r.sprint_end.toLowerCase().includes(q))
    );
  }
  
  // Update count
  const countEl = document.getElementById('linkRecordsCount');
  if (countEl) {
    countEl.textContent = `${records.length} record${records.length !== 1 ? 's' : ''} available`;
  }
  
  if (records.length === 0) {
    listEl.innerHTML = '<div style="padding:40px 20px;text-align:center;"><div style="font-size:48px;margin-bottom:12px;opacity:0.3;">📭</div><div style="color:var(--text3);font-size:13px;">No records found</div></div>';
    return;
  }
  
  // Get currently linked record IDs
  const linkedIds = state.recordLinks[linkingRecordId] || [];
  
  listEl.innerHTML = records.map((r, idx) => {
    const isLinked = linkedIds.includes(r.id);
    const isSelected = selectedRecordsToLink.includes(r.id);
    const checkboxChecked = isSelected ? 'checked' : '';
    
    return `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border);transition:all 0.2s ease;${isLinked ? 'opacity:0.7;' : ''}" ${!isLinked ? `onmouseenter="this.style.backgroundColor='var(--surface3)'" onmouseleave="this.style.backgroundColor='transparent'"` : ''}>
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="padding-top:2px;">
            ${isLinked ? 
              '<div style="width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg, var(--accent4) 0%, #059669 100%);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;box-shadow:0 2px 8px rgba(16,185,129,0.3);">✓</div>' :
              `<input type="checkbox" class="link-record-checkbox" id="link-checkbox-${r.id}" data-record-id="${r.id}" ${checkboxChecked} style="width:22px;height:22px;cursor:pointer;accent-color:var(--accent);" />`
            }
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="color:var(--accent);font-weight:700;font-size:14px;">${formatJira(r.jira) || 'No Jira'}</span>
                ${isLinked ? '<span style="display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg, var(--accent4) 0%, #059669 100%);color:white;font-size:9px;padding:3px 8px;border-radius:12px;font-weight:700;letter-spacing:0.5px;box-shadow:0 2px 6px rgba(16,185,129,0.25);"><span style="font-size:10px;">✓</span>LINKED</span>' : ''}
                <div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--text3);">
                  <span style="background:var(--surface3);padding:3px 8px;border-radius:6px;font-weight:600;">PI ${esc(r.pi || '—')}</span>
                  <span style="background:var(--surface3);padding:3px 8px;border-radius:6px;font-weight:600;">Sprint ${esc(formatSprintDisplay(r.sprint_start, r.sprint_end))}</span>
                </div>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
                ${r.jstatus ? getJiraBadge(r.jstatus) : ''}
                ${r.dstatus ? getDevopsBadge(r.dstatus) : ''}
                ${r.dorg ? getOrgBadge(r.dorg) : ''}
              </div>
            </div>
            <div style="color:var(--text);font-size:13px;line-height:1.5;">${esc(r.desc || 'No description')}</div>
          </div>
          ${isLinked ? 
            `<button class="btn btn-danger btn-sm" style="white-space:nowrap;font-size:11px;padding:8px 14px;border-radius:8px;font-weight:600;" onclick="event.stopPropagation();unlinkRecord(${linkingRecordId}, ${r.id})">✕ Remove</button>` :
            ''
          }
        </div>
      </div>
    `;
  }).join('');
  
  // After rendering, attach event listeners to all checkboxes
  setTimeout(() => {
    const checkboxes = listEl.querySelectorAll('.link-record-checkbox');
    checkboxes.forEach(checkbox => {
      const recordId = parseInt(checkbox.getAttribute('data-record-id'));
      checkbox.addEventListener('change', function(e) {
        toggleLinkRecordSelection(recordId);
      });
    });
    updateLinkSelectedButton();
  }, 0);
  
  // After rendering, update the button state
  updateLinkSelectedButton();
}

// Filter Link Records
function filterLinkRecords(searchQuery) {
  renderLinkRecordsList(searchQuery);
}

// Link Two Records
function linkRecords(sourceId, targetId) {
  // Initialize recordLinks if needed
  if (!state.recordLinks) {
    state.recordLinks = {};
  }
  
  // Initialize arrays for both records if needed
  if (!state.recordLinks[sourceId]) {
    state.recordLinks[sourceId] = [];
  }
  if (!state.recordLinks[targetId]) {
    state.recordLinks[targetId] = [];
  }
  
  // Add bidirectional link
  if (!state.recordLinks[sourceId].includes(targetId)) {
    state.recordLinks[sourceId].push(targetId);
  }
  if (!state.recordLinks[targetId].includes(sourceId)) {
    state.recordLinks[targetId].push(sourceId);
  }
  
  saveState();
  renderLinkRecordsList(document.getElementById('linkSearchInput').value);
  renderTable();
  
  toast('Records linked successfully', 'success');
}

// Unlink Two Records
function unlinkRecord(sourceId, targetId) {
  if (!state.recordLinks) return;
  
  // Remove bidirectional link
  if (state.recordLinks[sourceId]) {
    state.recordLinks[sourceId] = state.recordLinks[sourceId].filter(id => id !== targetId);
    if (state.recordLinks[sourceId].length === 0) {
      delete state.recordLinks[sourceId];
    }
  }
  
  if (state.recordLinks[targetId]) {
    state.recordLinks[targetId] = state.recordLinks[targetId].filter(id => id !== sourceId);
    if (state.recordLinks[targetId].length === 0) {
      delete state.recordLinks[targetId];
    }
  }
  
  saveState();
  
  // If link modal is open, refresh it
  if (document.getElementById('linkModal').classList.contains('show')) {
    renderLinkRecordsList(document.getElementById('linkSearchInput').value);
  }
  
  // If edit modal is open, refresh it
  if (document.getElementById('editModal').classList.contains('show') && state.editIndex >= 0) {
    const r = state.records[state.editIndex];
    if (r && (r.id === sourceId || r.id === targetId)) {
      // Find the filtered index
      const filt = getFiltered();
      const absIdx = filt.findIndex(rec => rec.id === r.id);
      if (absIdx >= 0) {
        editRecord(absIdx);
      }
    }
  }
  
  renderTable();
  toast('Records unlinked successfully', 'success');
}
