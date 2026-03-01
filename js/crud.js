// CRUD Operations (Create, Read, Update, Delete)

// Create/Update Record
function saveRecord() {
  const r = {
    pi: gv('f-pi'),
    sprint_start: gv('f-sprint-start'),
    sprint_end: '',
    jira: gv('f-jira'),
    desc: gv('f-desc'),
    jstatus: gv('f-jstatus'),
    wi1: gv('f-wi1'),
    wi2: gv('f-wi2'),
    dstatus: gv('f-dstatus'),
    dorg: gv('f-dorg'),
    comments: gv('f-comments'),
    id: Date.now()
  };
  
  if (!r.pi && !r.jira && !r.desc) {
    toast('Fill in PI, Jira, or Description', 'error');
    return;
  }
  
  state.customColumns.forEach(c => {
    const el = document.getElementById('f-cc-' + c.key);
    if (el) r['cc_' + c.key] = el.value;
  });
  
  // Get selected tags
  const selectedTags = typeof getSelectedTagsFromForm === 'function' ? getSelectedTagsFromForm() : [];
  
  // Apply automated status rules before saving
  if (typeof applyAutomatedStatusRules === 'function') {
    applyAutomatedStatusRules(r);
  }
  
  if (state.editIndex >= 0) {
    const existingRecord = state.records[state.editIndex];
    Object.assign(existingRecord, r);
    // Update modified timestamp
    if (typeof updateModifiedTimestamp === 'function') {
      updateModifiedTimestamp(existingRecord);
    }
    saveRecordTags(existingRecord.id, selectedTags);
    state.editIndex = -1;
    document.getElementById('saveBtn').textContent = '+ Add Record';
    document.getElementById('formTitle').textContent = '+ Add New Record';
    toast('Record updated', 'success');
  } else {
    // Add created timestamp to new record
    if (typeof addCreatedTimestamp === 'function') {
      addCreatedTimestamp(r);
    }
    state.records.unshift(r);
    saveRecordTags(r.id, selectedTags);
    toast('Record added', 'success');
  }
  
  clearForm();
  saveState();
  renderTable();
  updateKPIs();
  renderCharts();
  updateRecordCount();
}

// Edit Record - Open Modal
function editRecord(absIdx) {
  const filt = getFiltered();
  const rec = filt[absIdx];
  if (!rec) return;
  const gi = state.records.findIndex(x => x.id === rec.id);
  if (gi < 0) return;
  const r = state.records[gi];
  const grid = document.getElementById('editFormGrid');
  
  const jSelOpts = state.jiraStatuses.map(s => '<option value="' + s + '" ' + (r.jstatus === s ? 'selected' : '') + '>' + s + '</option>').join('');
  const dSelOpts = state.devopsStatuses.map(s => '<option value="' + s + '" ' + (r.dstatus === s ? 'selected' : '') + '>' + s + '</option>').join('');
  const oSelOpts = state.devopsOrgs.map(s => '<option value="' + s + '" ' + (r.dorg === s ? 'selected' : '') + '>' + s + '</option>').join('');
  
  // Generate custom column fields for edit modal
  const customFieldsHTML = state.customColumns.map(c => {
    const fieldId = 'e-cc-' + c.key;
    const value = r['cc_' + c.key] || '';
    
    if (c.type === 'select') {
      const options = (c.options || []).map(opt => '<option value="' + esc(opt) + '" ' + (value === opt ? 'selected' : '') + '>' + esc(opt) + '</option>').join('');
      return '<div class="form-group"><label for="' + fieldId + '">' + c.label + '</label><select id="' + fieldId + '" name="' + fieldId + '"><option value="">— Select —</option>' + options + '</select></div>';
    } else if (c.type === 'longtext') {
      return '<div class="form-group span2"><label for="' + fieldId + '">' + c.label + '</label><textarea id="' + fieldId + '">' + esc(value) + '</textarea></div>';
    } else if (c.type === 'date') {
      return '<div class="form-group"><label for="' + fieldId + '">' + c.label + '</label><input type="date" id="' + fieldId + '" value="' + esc(value) + '" oninput="previewEditCustomDate(\'' + c.key + '\', this.value)"><div class="preview-hint" id="' + fieldId + '-preview" style="color:var(--accent4)"></div></div>';
    } else if (c.type === 'number') {
      return '<div class="form-group"><label for="' + fieldId + '">' + c.label + '</label><input type="number" id="' + fieldId + '" value="' + esc(value) + '"></div>';
    } else if (c.type === 'url') {
      return '<div class="form-group"><label for="' + fieldId + '">' + c.label + '</label><input type="url" id="' + fieldId + '" value="' + esc(value) + '" placeholder="https://example.com" oninput="previewEditCustomUrl(\'' + c.key + '\', this.value)"><div class="preview-hint" id="' + fieldId + '-preview" style="color:var(--accent4)"></div></div>';
    } else if (c.type === 'email') {
      return '<div class="form-group"><label for="' + fieldId + '">' + c.label + '</label><input type="email" id="' + fieldId + '" value="' + esc(value) + '" placeholder="email@example.com" oninput="previewEditCustomEmail(\'' + c.key + '\', this.value)"><div class="preview-hint" id="' + fieldId + '-preview" style="color:var(--accent4)"></div></div>';
    } else {
      return '<div class="form-group"><label for="' + fieldId + '">' + c.label + '</label><input type="text" id="' + fieldId + '" value="' + esc(value) + '"></div>';
    }
  }).join('');
  
  // Get linked records
  const linkedIds = state.recordLinks[r.id] || [];
  const linkedRecords = linkedIds.map(id => state.records.find(rec => rec.id === id)).filter(Boolean);
  const linkedHTML = linkedRecords.length > 0 ? `
    <div class="form-group span3" style="background:var(--surface2);padding:12px;border-radius:var(--radius-sm);border:1px solid var(--border);">
      <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px;">🔗 Linked Records (${linkedRecords.length})</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${linkedRecords.map(lr => `
          <div style="display:flex;align-items:center;justify-content:space-between;background:var(--surface3);padding:8px;border-radius:4px;font-size:12px;">
            <div style="flex:1;">
              <span style="color:var(--accent3);font-weight:500;">${formatJira(lr.jira) || 'No Jira'}</span>
              <span style="color:var(--text3);margin:0 6px;">•</span>
              <span style="color:var(--text2);">${esc(lr.desc || 'No description')}</span>
            </div>
            <button class="btn btn-danger btn-sm" style="padding:2px 8px;font-size:11px;" onclick="unlinkRecord(${r.id}, ${lr.id})">✕</button>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';
  
  // Get timestamp info
  const timestampHTML = typeof renderTimestampInfo === 'function' ? renderTimestampInfo(r) : '';
  
  // Generate work items HTML for edit modal
  const wi1HTML = typeof renderEditModalWorkItems === 'function' ? renderEditModalWorkItems(r.wi1, 'wi1', 'Work Items 1 (SC)') : '<div class="form-group"><label for="e-wi1">Work Item 1 (SC)</label><input id="e-wi1" name="e-wi1" value="' + esc(r.wi1) + '"></div>';
  const wi2HTML = typeof renderEditModalWorkItems === 'function' ? renderEditModalWorkItems(r.wi2, 'wi2', 'Work Items 2 (VC)') : '<div class="form-group"><label for="e-wi2">Work Item 2 (VC)</label><input id="e-wi2" name="e-wi2" value="' + esc(r.wi2) + '"></div>';
  
  grid.innerHTML = `
    <div class="form-group"><label for="e-pi">PI</label><input id="e-pi" name="e-pi" value="${esc(r.pi)}"></div>
    <div class="form-group"><label for="e-sprint-start">Sprint Start</label><input id="e-sprint-start" name="e-sprint-start" value="${esc(r.sprint_start)}"></div>
    <div class="form-group"><label for="e-sprint-end">Sprint End (Optional)</label><input id="e-sprint-end" name="e-sprint-end" value="${esc(r.sprint_end || '')}" placeholder="Leave empty if same as start"></div>
    <div class="form-group"><label for="e-jira">Jira Story (number)</label><input id="e-jira" name="e-jira" value="${esc(r.jira)}" oninput="previewEditJira(this.value)"><div class="preview-hint" id="e-jira-preview" style="color:var(--accent4)"></div></div>
    <div class="form-group span2"><label for="e-desc">Description</label><textarea id="e-desc" name="e-desc">${esc(r.desc)}</textarea></div>
    <div class="form-group"><label for="e-jstatus">Jira Status</label><select id="e-jstatus" name="e-jstatus"><option value="">— Select —</option>${jSelOpts}</select></div>
    ${wi1HTML}
    ${wi2HTML}
    <div class="form-group"><label for="e-dstatus">DevOps Status</label><select id="e-dstatus" name="e-dstatus"><option value="">— Select —</option>${dSelOpts}</select></div>
    <div class="form-group"><label for="e-dorg">DevOps ORG</label><select id="e-dorg" name="e-dorg"><option value="">— Select —</option>${oSelOpts}</select></div>
    <div class="form-group span3"><label for="e-comments">Comments</label><textarea id="e-comments" name="e-comments">${esc(r.comments)}</textarea></div>
    ${customFieldsHTML}
    ${timestampHTML ? '<div class="form-group span3">' + timestampHTML + '</div>' : ''}
    ${linkedHTML}
  `;
  
  // Remove existing tags container if it exists
  const existingTagsContainer = document.getElementById('tagsEditField');
  if (existingTagsContainer) {
    existingTagsContainer.remove();
  }
  
  // Create new tags container
  const tagsContainer = document.createElement('div');
  tagsContainer.id = 'tagsEditField';
  grid.parentNode.insertBefore(tagsContainer, grid.nextSibling);
  
  state.editIndex = gi;
  document.getElementById('editModal').classList.add('show');
  
  // Render tags field for edit modal
  if (typeof renderTagsEditField === 'function') {
    renderTagsEditField(r.id);
  }
  
  // Show previews for existing work items
  if (r.jira) previewEditJira(r.jira);
  
  // Show previews for existing custom field values
  state.customColumns.forEach(c => {
    const value = r['cc_' + c.key];
    if (value) {
      if (c.type === 'email') {
        previewEditCustomEmail(c.key, value);
      } else if (c.type === 'url') {
        previewEditCustomUrl(c.key, value);
      } else if (c.type === 'date') {
        previewEditCustomDate(c.key, value);
      }
    }
  });
}

// Update Record from Modal
function updateRecord() {
  if (state.editIndex < 0) return;
  const r = state.records[state.editIndex];
  r.pi = gv('e-pi');
  r.sprint_start = gv('e-sprint-start');
  r.sprint_end = gv('e-sprint-end');
  r.jira = gv('e-jira');
  r.desc = gv('e-desc');
  r.jstatus = gv('e-jstatus');
  
  // Collect work items from edit modal
  if (typeof collectEditWorkItems === 'function') {
    r.wi1 = collectEditWorkItems('wi1');
    r.wi2 = collectEditWorkItems('wi2');
  } else {
    // Fallback to single input fields
    r.wi1 = gv('e-wi1');
    r.wi2 = gv('e-wi2');
  }
  
  r.dstatus = gv('e-dstatus');
  r.dorg = gv('e-dorg');
  r.comments = gv('e-comments');
  
  // Save custom column values
  state.customColumns.forEach(c => {
    const el = document.getElementById('e-cc-' + c.key);
    if (el) r['cc_' + c.key] = el.value;
  });
  
  // Save tags from edit modal
  const selectedTags = typeof getSelectedTagsFromEdit === 'function' ? getSelectedTagsFromEdit() : [];
  setRecordTags(r.id, selectedTags);
  
  // Apply automated status rules before saving
  if (typeof applyAutomatedStatusRules === 'function') {
    applyAutomatedStatusRules(r);
  }
  
  // Update modified timestamp
  if (typeof updateModifiedTimestamp === 'function') {
    updateModifiedTimestamp(r);
  }
  
  state.editIndex = -1;
  closeModal();
  saveState();
  renderTable();
  updateKPIs();
  renderCharts();
  toast('Record updated', 'success');
}

// Delete Record
function deleteRecord(absIdx) {
  const filt = getFiltered();
  const rec = filt[absIdx];
  if (!rec) {
    toast('Record not found', 'error');
    return;
  }
  const gi = state.records.findIndex(x => x.id === rec.id);
  if (gi < 0) {
    toast('Record not found', 'error');
    return;
  }
  
  showConfirmModal(
    '🗑️ Delete Record',
    'Are you sure you want to delete this record? This action cannot be undone.',
    () => {
      // Set deletion context before removing record
      if (typeof setDeletionContext === 'function') {
        setDeletionContext();
      }
      
      state.records.splice(gi, 1);
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
      
      toast('Record deleted', 'info');
    },
    '🗑️ Delete',
    'btn-danger'
  );
}

// Close Modal
function closeModal() {
  document.getElementById('editModal').classList.remove('show');
  state.editIndex = -1;
}
