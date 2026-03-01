// Sprint Record Count Functionality

// Count records per sprint (includes both start and end sprints)
function getSprintRecordCount(sprintValue) {
  if (!sprintValue) return 0;
  return state.records.filter(r => r.sprint_start === sprintValue || r.sprint_end === sprintValue).length;
}

// Count records per PI
function getPIRecordCount(piValue) {
  if (!piValue) return 0;
  return state.records.filter(r => r.pi === piValue).length;
}

// Get all unique sprint values (from both start and end)
function getAllSprints() {
  const sprints = new Set();
  state.records.forEach(r => {
    if (r.sprint_start) sprints.add(r.sprint_start);
    if (r.sprint_end) sprints.add(r.sprint_end);
  });
  return Array.from(sprints).sort();
}

// Get all unique PI values
function getAllPIs() {
  const pis = new Set();
  state.records.forEach(r => {
    if (r.pi) pis.add(r.pi);
  });
  return Array.from(pis).sort();
}

// Render sprint count badge
function renderSprintCountBadge(sprintValue) {
  const count = getSprintRecordCount(sprintValue);
  if (count === 0) return '';
  
  return `<span class="sprint-count-badge" title="${count} record(s) in Sprint ${sprintValue}">
    <span class="sprint-count-icon">📊</span>
    <span class="sprint-count-number">${count}</span>
    <span class="sprint-count-label">stories</span>
  </span>`;
}

// Render PI count badge
function renderPICountBadge(piValue) {
  const count = getPIRecordCount(piValue);
  if (count === 0) return '';
  
  return `<span class="sprint-count-badge" title="${count} record(s) in PI ${piValue}">
    <span class="sprint-count-icon">📈</span>
    <span class="sprint-count-number">${count}</span>
    <span class="sprint-count-label">stories</span>
  </span>`;
}

// Render sprint summary with counts
function renderSprintSummary() {
  const container = document.getElementById('sprintSummaryContainer');
  if (!container) return;
  
  const sprints = getAllSprints();
  
  if (sprints.length === 0) {
    container.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:12px;text-align:center;">No sprints found</div>';
    return;
  }
  
  let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
  
  sprints.forEach(sprint => {
    const count = getSprintRecordCount(sprint);
    html += `
      <div class="sprint-summary-count">
        <span class="sprint-summary-label">Sprint ${esc(sprint)}</span>
        <span class="sprint-summary-value">
          <span class="sprint-summary-value-icon">📊</span>
          ${count}
        </span>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
}

// Add count badges to filter dropdowns
function enhanceFilterDropdowns() {
  // Enhance sprint filter
  const sprintFilter = document.getElementById('f-filter-sprint');
  if (sprintFilter && sprintFilter.options.length > 1) {
    for (let i = 1; i < sprintFilter.options.length; i++) {
      const option = sprintFilter.options[i];
      const sprintValue = option.value;
      const count = getSprintRecordCount(sprintValue);
      option.text = `${sprintValue} (${count})`;
    }
  }
  
  // Enhance PI filter
  const piFilter = document.getElementById('f-filter-pi');
  if (piFilter && piFilter.options.length > 1) {
    for (let i = 1; i < piFilter.options.length; i++) {
      const option = piFilter.options[i];
      const piValue = option.value;
      const count = getPIRecordCount(piValue);
      option.text = `${piValue} (${count})`;
    }
  }
}
