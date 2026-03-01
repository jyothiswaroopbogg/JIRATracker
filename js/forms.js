// Form Management Functions

// Populate Select Dropdowns
function populateSelect(id, items, ph) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = el.value;
  el.innerHTML = '<option value="">' + (ph || '— Select —') + '</option>';
  items.forEach(i => {
    const o = document.createElement('option');
    o.value = i;
    o.textContent = i;
    el.appendChild(o);
  });
  el.value = v;
}

function populateSelectsFromState() {
  populateSelect('f-jstatus', state.jiraStatuses, 'Jira Status');
  populateSelect('f-dstatus', state.devopsStatuses, 'DevOps Status');
  populateSelect('f-dorg', state.devopsOrgs, 'DevOps ORG');
  
  // Populate custom dropdown columns
  state.customColumns.forEach(c => {
    if (c.type === 'select' && c.options && c.options.length > 0) {
      populateSelect('f-cc-' + c.key, c.options, '— Select —');
    }
  });
}

// Form Value Helpers
function gv(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function sv(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

// Clear Form
function clearForm() {
  ['f-pi', 'f-sprint-start', 'f-jira', 'f-desc', 'f-wi1', 'f-wi2', 'f-comments', 'f-jstatus', 'f-dstatus', 'f-dorg'].forEach(id => sv(id, ''));
  document.getElementById('jira-preview').textContent = '';
  document.getElementById('wi1-preview').textContent = '';
  document.getElementById('wi2-preview').textContent = '';
  state.customColumns.forEach(c => {
    const el = document.getElementById('f-cc-' + c.key);
    if (el) el.value = '';
    // Clear preview hints for custom columns
    const previewEl = document.getElementById('cc-' + c.key + '-preview');
    if (previewEl) previewEl.textContent = '';
  });
  state.editIndex = -1;
  document.getElementById('saveBtn').textContent = '+ Add Record';
  document.getElementById('formTitle').textContent = '+ Add New Record';
}
