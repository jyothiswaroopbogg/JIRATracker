// Advanced Filters Management

function toggleAdvancedFilters() {
  const panel = document.getElementById('advancedFiltersPanel');
  if (!panel) return;
  
  const isHidden = panel.classList.contains('hidden');
  
  if (isHidden) {
    panel.classList.remove('hidden');
  } else {
    panel.classList.add('hidden');
  }
  
  const btn = document.getElementById('filterToggleBtn');
  if (btn) btn.textContent = isHidden ? '🔼 Advanced Filters' : '🔽 Advanced Filters';
  
  // Populate selects when opening
  if (isHidden) {
    populateFilterSelects();
  }
}

function populateFilterSelects() {
  // Get unique values from records
  const pis = new Set(state.records.map(r => r.pi).filter(Boolean));
  const sprints = new Set();
  state.records.forEach(r => {
    if (r.sprint_start) sprints.add(r.sprint_start);
    if (r.sprint_end) sprints.add(r.sprint_end);
  });
  
  // PI
  const piSelect = document.getElementById('f-filter-pi');
  if (piSelect) {
    piSelect.innerHTML = '<option value="">All PIs</option>';
    [...pis].sort().forEach(pi => {
      const opt = document.createElement('option');
      opt.value = pi;
      const count = typeof getPIRecordCount === 'function' ? getPIRecordCount(pi) : 0;
      opt.textContent = count > 0 ? `${pi} (${count})` : pi;
      if (state.filterCriteria.pi === pi) opt.selected = true;
      piSelect.appendChild(opt);
    });
  }
  
  // Sprint
  const sprintSelect = document.getElementById('f-filter-sprint');
  if (sprintSelect) {
    sprintSelect.innerHTML = '<option value="">All Sprints</option>';
    [...sprints].sort().forEach(sp => {
      const opt = document.createElement('option');
      opt.value = sp;
      const count = typeof getSprintRecordCount === 'function' ? getSprintRecordCount(sp) : 0;
      opt.textContent = count > 0 ? `${sp} (${count})` : sp;
      if (state.filterCriteria.sprint_start === sp) opt.selected = true;
      sprintSelect.appendChild(opt);
    });
  }
  
  // Jira Status
  const jstatusSelect = document.getElementById('f-filter-jstatus');
  if (jstatusSelect) {
    jstatusSelect.innerHTML = '<option value="">All Status</option>';
    state.jiraStatuses.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (state.filterCriteria.jstatus === s) opt.selected = true;
      jstatusSelect.appendChild(opt);
    });
  }
  
  // DevOps Status
  const dstatusSelect = document.getElementById('f-filter-dstatus');
  if (dstatusSelect) {
    dstatusSelect.innerHTML = '<option value="">All DevOps</option>';
    state.devopsStatuses.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (state.filterCriteria.dstatus === s) opt.selected = true;
      dstatusSelect.appendChild(opt);
    });
  }
  
  // DevOps ORG
  const dorgSelect = document.getElementById('f-filter-dorg');
  if (dorgSelect) {
    dorgSelect.innerHTML = '<option value="">All ORGs</option>';
    state.devopsOrgs.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      if (state.filterCriteria.dorg === s) opt.selected = true;
      dorgSelect.appendChild(opt);
    });
  }
}

function applyAdvancedFilters() {
  state.filterCriteria.pi = document.getElementById('f-filter-pi')?.value || '';
  state.filterCriteria.sprint_start = document.getElementById('f-filter-sprint')?.value || '';
  state.filterCriteria.jstatus = document.getElementById('f-filter-jstatus')?.value || '';
  state.filterCriteria.dstatus = document.getElementById('f-filter-dstatus')?.value || '';
  state.filterCriteria.dorg = document.getElementById('f-filter-dorg')?.value || '';
  
  state.currentPage = 1;
  saveState();
  renderTable();
}

function clearAdvancedFilters() {
  state.filterCriteria = {pi: '', sprint_start: '', jstatus: '', dstatus: '', dorg: ''};
  
  document.getElementById('f-filter-pi').value = '';
  document.getElementById('f-filter-sprint').value = '';
  document.getElementById('f-filter-jstatus').value = '';
  document.getElementById('f-filter-dstatus').value = '';
  document.getElementById('f-filter-dorg').value = '';
  
  state.currentPage = 1;
  saveState();
  renderTable();
}

function applyFiltersToRecords(records) {
  let filtered = [...records];
  
  // Apply search query
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(r => {
      return Object.values(r).some(v => 
        String(v).toLowerCase().includes(q)
      );
    });
  }
  
  // Apply advanced filters
  if (state.filterCriteria.pi) {
    filtered = filtered.filter(r => r.pi === state.filterCriteria.pi);
  }
  if (state.filterCriteria.sprint_start) {
    // Filter records where sprint_start OR sprint_end matches
    filtered = filtered.filter(r => r.sprint_start === state.filterCriteria.sprint_start || r.sprint_end === state.filterCriteria.sprint_start);
  }
  if (state.filterCriteria.jstatus) {
    filtered = filtered.filter(r => r.jstatus === state.filterCriteria.jstatus);
  }
  if (state.filterCriteria.dstatus) {
    filtered = filtered.filter(r => r.dstatus === state.filterCriteria.dstatus);
  }
  if (state.filterCriteria.dorg) {
    filtered = filtered.filter(r => r.dorg === state.filterCriteria.dorg);
  }
  
  return filtered;
}
