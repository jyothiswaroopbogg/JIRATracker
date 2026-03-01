// Automated Status Updates Functionality

// Pagination and search state
let currentRulesPage = 1;
const rulesPerPage = 3;
let rulesSearchQuery = '';

// Initialize automated status rules in state if not present
function initializeAutomatedStatusState() {
  if (!state.automatedStatus) {
    state.automatedStatus = {
      enabled: false,
      rules: [],
      lastExecution: null,
      executionLog: []
    };
  }
}

// Render the Automated Status Updates card
function renderAutomatedStatusCard() {
  const container = document.getElementById('automatedStatusContainer');
  if (!container) return;
  
  initializeAutomatedStatusState();
  
  const settings = state.automatedStatus;
  const ruleCount = settings.rules.length;
  const activeRules = settings.rules.filter(r => r.enabled).length;
  const lastExecution = settings.lastExecution 
    ? new Date(settings.lastExecution).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Never';
  
  container.innerHTML = `
    <div class="setting-card" style="max-width:100%;width:100%;">
      <div class="setting-card-title" style="margin-bottom:20px;">🤖 Automated Status Updates</div>
      
      <!-- Global Enable Toggle -->
      <div class="status-global-toggle">
        <div class="status-global-toggle-content">
          <div class="status-global-toggle-label">
            <div class="status-global-toggle-label-title">Enable Automated Status Updates</div>
            <div class="status-global-toggle-label-desc">
              ${settings.enabled 
                ? '✅ Active: Rules will be automatically applied when records are saved or modified' 
                : '⚠️ Disabled: Status update rules are not being applied'}
            </div>
          </div>
          <label class="status-rule-toggle" for="automatedStatusEnabled">
            <input 
              type="checkbox" 
              id="automatedStatusEnabled" 
              name="automatedStatusEnabled" 
              ${settings.enabled ? 'checked' : ''} 
              onchange="toggleAutomatedStatus(this.checked)">
            <span class="status-rule-toggle-slider"></span>
          </label>
        </div>
      </div>
      
      <!-- Stats Box -->
      <div style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.2);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px;">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center;">
          <div>
            <div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;margin-bottom:4px;">Total Rules</div>
            <div style="font-size:18px;font-weight:700;color:var(--accent);">${ruleCount}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;margin-bottom:4px;">Active Rules</div>
            <div style="font-size:18px;font-weight:700;color:var(--accent4);">${activeRules}</div>
          </div>
          <div>
            <div style="font-size:10px;color:var(--text3);font-weight:600;text-transform:uppercase;margin-bottom:4px;">Last Run</div>
            <div style="font-size:11px;font-weight:600;color:var(--text2);margin-top:4px;">${lastExecution}</div>
          </div>
        </div>
      </div>
      
      <!-- Rules List -->
      <div>
        <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
          <span>📋 Status Update Rules</span>
          <button class="btn btn-secondary btn-sm" onclick="testAllAutomatedRules()" ${!settings.enabled || ruleCount === 0 ? 'disabled' : ''} style="font-size:11px;padding:4px 10px;">▶️ Test All Rules</button>
        </div>
        
        ${ruleCount === 0 
          ? '<div style="text-align:center;padding:30px;background:var(--surface2);border:1px dashed var(--border);border-radius:var(--radius-sm);color:var(--text3);font-size:12px;">No rules configured yet. Create your first rule below!</div>'
          : `
            <!-- Search Bar -->
            <div class="status-rules-search-bar">
              <label for="rulesSearchInput" style="display:none;">Search Rules</label>
              <input 
                type="text" 
                id="rulesSearchInput" 
                placeholder="🔍 Search rules by name or condition..." 
                value="${rulesSearchQuery}"
                oninput="handleRulesSearch(this.value)"
                aria-label="Search rules by name or condition"
              />
            </div>
            
            <!-- Rules Grid -->
            <div class="status-rules-grid">${renderPaginatedRules()}</div>
            
            <!-- Pagination Controls -->
            ${renderRulesPagination()}
          `
        }
      </div>
      
      <!-- Add New Rule Section -->
      <div class="status-add-rule-section">
        <div class="status-add-rule-title">➕ Add New Status Rule</div>
        
        <div class="form-group" style="margin-bottom:12px;">
          <label for="newRuleName" style="font-size:11px;">Rule Name</label>
          <input type="text" id="newRuleName" name="newRuleName" placeholder="e.g., Auto-complete deployed items" style="font-size:12px;width:100%;">
        </div>
        
        <!-- Conditions and Targets Grid -->
        <div class="status-rule-form-grid">
          <!-- Conditions Section -->
          <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:var(--radius-sm);padding:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
              <div style="font-size:11px;font-weight:600;color:var(--accent2);text-transform:uppercase;">🔍 Conditions</div>
              <button class="btn btn-secondary btn-sm" onclick="addConditionRow()" style="font-size:11px;padding:4px 10px;">➕ Add Condition</button>
            </div>
            <div id="conditionsContainer"></div>
          </div>
          
          <!-- Targets Section -->
          <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm);padding:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
              <div style="font-size:11px;font-weight:600;color:var(--accent4);text-transform:uppercase;">🎯 Target Updates</div>
              <button class="btn btn-secondary btn-sm" onclick="addTargetRow()" style="font-size:11px;padding:4px 10px;">➕ Add Target</button>
            </div>
            <div id="targetsContainer"></div>
          </div>
        </div>
        
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary btn-sm" onclick="addAutomatedStatusRule()">➕ Add Rule</button>
          <button class="btn btn-secondary btn-sm" onclick="clearRuleForm()">✕ Clear</button>
        </div>
      </div>
      
      <!-- Execution Log -->
      ${settings.executionLog && settings.executionLog.length > 0 ? `
        <div style="margin-top:16px;">
          <div style="font-size:12px;font-weight:600;color:var(--text);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;">
            <span>📜 Execution Log</span>
            <button class="btn btn-secondary btn-sm" onclick="clearExecutionLog()" style="font-size:11px;padding:4px 10px;">🗑 Clear Log</button>
          </div>
          <div class="status-execution-log">
            ${settings.executionLog.slice(-20).reverse().map(log => `
              <div class="status-log-entry ${log.type || 'info'}">
                <span style="color:var(--text3);">${new Date(log.timestamp).toLocaleTimeString()}</span> - ${log.message}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:var(--radius-sm);padding:12px;margin-top:16px;">
        <div style="font-size:11px;color:var(--text2);line-height:1.6;">
          <strong>💡 How it works:</strong><br>
          • Rules are applied automatically when records are saved or updated<br>
          • Each rule checks a condition field and updates the Jira Status if matched<br>
          • Example: When "DevOps ORG" = "PROD", set "Jira Status" to "Completed"<br>
          • Toggle individual rules on/off without deleting them
        </div>
      </div>
    </div>
  `;
  
  // Initialize form with default rows after rendering
  setTimeout(() => {
    const conditionsContainer = document.getElementById('conditionsContainer');
    const targetsContainer = document.getElementById('targetsContainer');
    
    if (conditionsContainer && conditionsContainer.children.length === 0) {
      addConditionRow();
    }
    
    if (targetsContainer && targetsContainer.children.length === 0) {
      addTargetRow();
    }
  }, 100);
}

// Render a single status rule item
function renderStatusRuleItem(rule, index) {
  const conditions = rule.conditions || [{field: rule.conditionField, value: rule.conditionValue}];
  const targets = rule.targets || [{field: 'jstatus', value: rule.targetValue}];
  const logicOperator = rule.logicOperator || 'AND';
  
  const conditionsHTML = conditions.map((c, idx) => {
    const operator = c.operator || (idx === 0 ? '(' : 'AND');
    const operatorHTML = `<span style="margin-right:4px;color:var(--accent2);font-weight:700;font-size:10px;background:rgba(124,58,237,0.15);padding:2px 6px;border-radius:4px;">${operator}</span>`;
    
    // If it's a standalone closing bracket, show only the operator
    const hasField = c.field && c.field.trim() !== '';
    const hasValue = c.value && c.value.trim() !== '';
    
    if (operator === ')' && !hasField && !hasValue) {
      return operatorHTML;
    }
    
    // Skip rendering if no field or value (incomplete condition)
    if (!hasField || !hasValue) {
      return '';
    }
    
    return `${operatorHTML}<span class="status-rule-badge condition">${getFieldLabel(c.field)} = "${c.value}"</span>`;
  }).filter(html => html !== '');
  
  const targetsHTML = targets.filter(t => t && t.field && t.value).map(t => 
    `<span class="status-rule-badge target">${getFieldLabel(t.field)} = "${t.value || 'undefined'}"</span>`
  ).join(' ');
  
  return `
    <div class="status-rule-card">
      <div class="status-rule-card-header">
        <div class="status-rule-card-title">
          <span class="status-rule-icon">⚡</span>
          ${rule.name || `Rule ${index + 1}`}
        </div>
        <div class="status-rule-card-actions">
          <label class="status-rule-toggle-mini" for="ruleEnabled${index}" title="${rule.enabled ? 'Enabled' : 'Disabled'}">
            <input 
              type="checkbox" 
              id="ruleEnabled${index}" 
              name="ruleEnabled${index}"
              ${rule.enabled ? 'checked' : ''} 
              onchange="toggleStatusRule(${index}, this.checked)">
            <span class="status-rule-toggle-slider-mini"></span>
          </label>
          <button class="status-rule-action-btn" onclick="editStatusRule(${index})" title="Edit rule">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="status-rule-action-btn danger" onclick="deleteStatusRule(${index})" title="Delete rule">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="status-rule-card-body">
        <div class="status-rule-section">
          <div class="status-rule-label">IF</div>
          <div class="status-rule-content">${conditionsHTML.join(' ')}</div>
        </div>
        <div class="status-rule-arrow">→</div>
        <div class="status-rule-section">
          <div class="status-rule-label">THEN</div>
          <div class="status-rule-content">${targetsHTML}</div>
        </div>
      </div>
    </div>
  `;
}

// Get filtered rules based on search query
function getFilteredRules() {
  initializeAutomatedStatusState();
  const allRules = state.automatedStatus.rules;
  
  if (!rulesSearchQuery.trim()) {
    return allRules;
  }
  
  const query = rulesSearchQuery.toLowerCase();
  return allRules.filter((rule, index) => {
    // Search in rule name
    if (rule.name && rule.name.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in conditions
    if (rule.conditions && rule.conditions.some(c => 
      (c.field && c.field.toLowerCase().includes(query)) ||
      (c.value && c.value.toLowerCase().includes(query)) ||
      (c.operator && c.operator.toLowerCase().includes(query))
    )) {
      return true;
    }
    
    // Search in targets
    if (rule.targets && rule.targets.some(t => 
      (t.field && t.field.toLowerCase().includes(query)) ||
      (t.value && t.value.toLowerCase().includes(query))
    )) {
      return true;
    }
    
    return false;
  });
}

// Render paginated rules
function renderPaginatedRules() {
  const filteredRules = getFilteredRules();
  const totalPages = Math.ceil(filteredRules.length / rulesPerPage);
  
  // Reset to page 1 if current page exceeds total pages
  if (currentRulesPage > totalPages && totalPages > 0) {
    currentRulesPage = totalPages;
  }
  
  const startIndex = (currentRulesPage - 1) * rulesPerPage;
  const endIndex = startIndex + rulesPerPage;
  const paginatedRules = filteredRules.slice(startIndex, endIndex);
  
  if (paginatedRules.length === 0) {
    return '<div style=\"text-align:center;padding:30px;background:var(--surface2);border:1px dashed var(--border);border-radius:var(--radius-sm);color:var(--text3);font-size:12px;\">No rules found matching your search.</div>';
  }
  
  // Map to original indices for edit/delete operations
  return paginatedRules.map(rule => {
    const originalIndex = state.automatedStatus.rules.indexOf(rule);
    return renderStatusRuleItem(rule, originalIndex);
  }).join('');
}

// Render pagination controls
function renderRulesPagination() {
  const filteredRules = getFilteredRules();
  const totalPages = Math.ceil(filteredRules.length / rulesPerPage);
  
  if (totalPages <= 1) {
    return '';
  }
  
  let paginationHTML = '<div class=\"status-rules-pagination\">';
  
  // Previous button
  paginationHTML += `
    <button 
      class=\"status-page-btn\" 
      onclick=\"changeRulesPage(${currentRulesPage - 1})\"
      ${currentRulesPage === 1 ? 'disabled' : ''}
    >
      ← Prev
    </button>
  `;
  
  // Page numbers
  paginationHTML += '<div class=\"status-page-numbers\">';
  
  for (let i = 1; i <= totalPages; i++) {
    // Show all pages if less than 7, otherwise show smart pagination
    if (totalPages <= 7 || i === 1 || i === totalPages || 
        (i >= currentRulesPage - 1 && i <= currentRulesPage + 1)) {
      paginationHTML += `
        <button 
          class=\"status-page-number ${i === currentRulesPage ? 'active' : ''}\" 
          onclick=\"changeRulesPage(${i})\"
        >
          ${i}
        </button>
      `;
    } else if (i === currentRulesPage - 2 || i === currentRulesPage + 2) {
      paginationHTML += '<span class=\"status-page-ellipsis\">...</span>';
    }
  }
  
  paginationHTML += '</div>';
  
  // Next button
  paginationHTML += `
    <button 
      class=\"status-page-btn\" 
      onclick=\"changeRulesPage(${currentRulesPage + 1})\"
      ${currentRulesPage === totalPages ? 'disabled' : ''}
    >
      Next →
    </button>
  `;
  
  // Page info
  const startIndex = (currentRulesPage - 1) * rulesPerPage + 1;
  const endIndex = Math.min(currentRulesPage * rulesPerPage, filteredRules.length);
  paginationHTML += `
    <div class=\"status-page-info\">
      Showing ${startIndex}-${endIndex} of ${filteredRules.length} rules
    </div>
  `;
  
  paginationHTML += '</div>';
  
  return paginationHTML;
}

// Handle search input
function handleRulesSearch(query) {
  rulesSearchQuery = query;
  currentRulesPage = 1; // Reset to first page on search
  renderAutomatedStatusCard();
}

// Change page
function changeRulesPage(page) {
  const filteredRules = getFilteredRules();
  const totalPages = Math.ceil(filteredRules.length / rulesPerPage);
  
  if (page < 1 || page > totalPages) {
    return;
  }
  
  currentRulesPage = page;
  renderAutomatedStatusCard();
  
  // Scroll to rules section
  const rulesSection = document.querySelector('.status-rules-grid');
  if (rulesSection) {
    rulesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Get field label for display
function getFieldLabel(fieldKey) {
  const labels = {
    'dorg': 'DevOps ORG',
    'dstatus': 'DevOps Status',
    'jstatus': 'Jira Status',
    'pi': 'PI',
    'sprint_start': 'Sprint',
    'desc': 'Description',
    'wi1': 'Work Item 1 (SC)',
    'wi2': 'Work Item 2 (VC)',
    'comments': 'Comments'
  };
  return labels[fieldKey] || fieldKey;
}

// Get all available fields for conditions and targets
function getAvailableFields() {
  return [
    {value: 'dorg', label: 'DevOps ORG'},
    {value: 'dstatus', label: 'DevOps Status'},
    {value: 'jstatus', label: 'Jira Status'},
    {value: 'pi', label: 'PI'},
    {value: 'sprint_start', label: 'Sprint'}
  ];
}

// Get field options (for dropdowns)
function getFieldOptions(fieldKey) {
  switch(fieldKey) {
    case 'jstatus':
      return state.jiraStatuses;
    case 'dstatus':
      return state.devopsStatuses;
    case 'dorg':
      return state.devopsOrgs;
    default:
      return [];
  }
}

// Add a condition row to the form
function addConditionRow() {
  const container = document.getElementById('conditionsContainer');
  if (!container) return;
  
  const index = container.children.length;
  const fields = getAvailableFields();
  
  // First condition shows only "(", subsequent show AND/OR/)
  let operatorHTML = '';
  if (index === 0) {
    operatorHTML = `
      <div class="form-group" style="margin-bottom:0;">
        <div style="font-size:10px;color:var(--text3);">&nbsp;</div>
        <select id="condition-operator-${index}" name="condition-operator-${index}" class="condition-operator" data-index="${index}" onchange="toggleConditionFieldsVisibility(${index})" style="font-size:11px;padding:6px;width:60px;" aria-label="Logic operator">
          <option value="(" selected>(</option>
        </select>
      </div>
    `;
  } else {
    operatorHTML = `
      <div class="form-group" style="margin-bottom:0;">
        <div style="font-size:10px;color:var(--text3);">&nbsp;</div>
        <select id="condition-operator-${index}" name="condition-operator-${index}" class="condition-operator" data-index="${index}" onchange="toggleConditionFieldsVisibility(${index})" style="font-size:11px;padding:6px;width:70px;" aria-label="Logic operator">
          <option value="AND" selected>AND</option>
          <option value="OR">OR</option>
          <option value=")">)</option>
        </select>
      </div>
    `;
  }
  
  const row = document.createElement('div');
  row.className = 'condition-row';
  row.innerHTML = `
    <div style="display:grid;grid-template-columns:auto 1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end;">
      ${operatorHTML}
      <div class="form-group condition-field-group" data-index="${index}" style="margin-bottom:0;">
        <label for="condition-field-${index}" style="font-size:10px;color:var(--text3);">Field</label>
        <select id="condition-field-${index}" name="condition-field-${index}" class="condition-field" data-index="${index}" onchange="updateConditionValueOptions(${index})" style="font-size:12px;">
          <option value="">Select field...</option>
          ${fields.map(f => `<option value="${f.value}">${f.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group condition-value-group" data-index="${index}" style="margin-bottom:0;">
        <label for="condition-value-${index}" style="font-size:10px;color:var(--text3);">Value</label>
        <input type="text" id="condition-value-${index}" name="condition-value-${index}" class="condition-value" data-index="${index}" placeholder="Enter value..." style="font-size:12px;">
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeConditionRow(this)" style="padding:6px 10px;font-size:11px;">✕</button>
    </div>
  `;
  
  container.appendChild(row);
}

// Remove a condition row
function removeConditionRow(btn) {
  const row = btn.closest('.condition-row');
  if (row) row.remove();
}

// Toggle visibility of field and value inputs based on operator selection
function toggleConditionFieldsVisibility(index) {
  const operatorSelect = document.querySelector(`.condition-operator[data-index="${index}"]`);
  const fieldGroup = document.querySelector(`.condition-field-group[data-index="${index}"]`);
  const valueGroup = document.querySelector(`.condition-value-group[data-index="${index}"]`);
  
  if (!operatorSelect) return;
  
  const operator = operatorSelect.value;
  
  if (operator === ')') {
    // Hide field and value for closing bracket
    if (fieldGroup) fieldGroup.style.display = 'none';
    if (valueGroup) valueGroup.style.display = 'none';
  } else {
    // Show field and value for other operators
    if (fieldGroup) fieldGroup.style.display = 'block';
    if (valueGroup) valueGroup.style.display = 'block';
  }
}

// Update condition value options based on selected field
function updateConditionValueOptions(index) {
  const fieldSelect = document.querySelector(`.condition-field[data-index="${index}"]`);
  const valueInput = document.querySelector(`.condition-value[data-index="${index}"]`);
  
  if (!fieldSelect || !valueInput) return;
  
  const fieldKey = fieldSelect.value;
  const options = getFieldOptions(fieldKey);
  
  if (options.length > 0) {
    // Convert to dropdown
    const select = document.createElement('select');
    select.id = `condition-value-${index}`;
    select.name = `condition-value-${index}`;
    select.className = 'condition-value';
    select.setAttribute('data-index', index);
    select.style.fontSize = '12px';
    select.innerHTML = `
      <option value="">Select value...</option>
      ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
    `;
    valueInput.parentNode.replaceChild(select, valueInput);
  } else if (valueInput.tagName === 'SELECT') {
    // Convert back to input
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `condition-value-${index}`;
    input.name = `condition-value-${index}`;
    input.className = 'condition-value';
    input.setAttribute('data-index', index);
    input.placeholder = 'Enter value...';
    input.style.fontSize = '12px';
    valueInput.parentNode.replaceChild(input, valueInput);
  }
}

// Add a target row to the form
function addTargetRow() {
  const container = document.getElementById('targetsContainer');
  if (!container) return;
  
  const index = container.children.length;
  const fields = getAvailableFields();
  
  const row = document.createElement('div');
  row.className = 'target-row';
  row.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end;">
      <div class="form-group" style="margin-bottom:0;">
        <label for="target-field-${index}" style="font-size:10px;color:var(--text3);">Field to Update</label>
        <select id="target-field-${index}" name="target-field-${index}" class="target-field" data-index="${index}" onchange="updateTargetValueOptions(${index})" style="font-size:12px;">
          <option value="">Select field...</option>
          ${fields.map(f => `<option value="${f.value}">${f.label}</option>`).join('')}
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0;">
        <label for="target-value-${index}" style="font-size:10px;color:var(--text3);">New Value</label>
        <input type="text" id="target-value-${index}" name="target-value-${index}" class="target-value" data-index="${index}" placeholder="Enter new value..." style="font-size:12px;">
      </div>
      <button class="btn btn-danger btn-sm" onclick="removeTargetRow(this)" style="padding:6px 10px;font-size:11px;">✕</button>
    </div>
  `;
  
  container.appendChild(row);
}

// Remove a target row
function removeTargetRow(btn) {
  const row = btn.closest('.target-row');
  if (row) row.remove();
}

// Update target value options based on selected field
function updateTargetValueOptions(index) {
  const fieldSelect = document.querySelector(`.target-field[data-index="${index}"]`);
  const valueInput = document.querySelector(`.target-value[data-index="${index}"]`);
  
  if (!fieldSelect || !valueInput) return;
  
  const fieldKey = fieldSelect.value;
  const options = getFieldOptions(fieldKey);
  
  if (options.length > 0) {
    // Convert to dropdown
    const select = document.createElement('select');
    select.id = `target-value-${index}`;
    select.name = `target-value-${index}`;
    select.className = 'target-value';
    select.setAttribute('data-index', index);
    select.style.fontSize = '12px';
    select.innerHTML = `
      <option value="">Select value...</option>
      ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
    `;
    valueInput.parentNode.replaceChild(select, valueInput);
  } else if (valueInput.tagName === 'SELECT') {
    // Convert back to input
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `target-value-${index}`;
    input.name = `target-value-${index}`;
    input.className = 'target-value';
    input.setAttribute('data-index', index);
    input.placeholder = 'Enter new value...';
    input.style.fontSize = '12px';
    valueInput.parentNode.replaceChild(input, valueInput);
  }
}

// Toggle automated status feature on/off
function toggleAutomatedStatus(enabled) {
  initializeAutomatedStatusState();
  state.automatedStatus.enabled = enabled;
  saveState();
  renderAutomatedStatusCard();
  addExecutionLog(enabled ? 'Automated status updates enabled' : 'Automated status updates disabled', 'info');
  toast(enabled ? 'Automated status enabled' : 'Automated status disabled', enabled ? 'success' : 'info');
}

// Toggle individual rule on/off
function toggleStatusRule(index, enabled) {
  initializeAutomatedStatusState();
  if (state.automatedStatus.rules[index]) {
    state.automatedStatus.rules[index].enabled = enabled;
    saveState();
    renderAutomatedStatusCard();
    toast(enabled ? 'Rule enabled' : 'Rule disabled', 'info');
  }
}

// Delete a status rule
function deleteStatusRule(index) {
  initializeAutomatedStatusState();
  const ruleName = state.automatedStatus.rules[index]?.name || `Rule ${index + 1}`;
  
  showConfirmModal(
    '🗑️ Delete Status Rule',
    `Are you sure you want to delete the rule "${ruleName}"? This action cannot be undone.`,
    () => {
      state.automatedStatus.rules.splice(index, 1);
      saveState();
      renderAutomatedStatusCard();
      addExecutionLog(`Deleted rule: ${ruleName}`, 'info');
      toast('Rule deleted', 'success');
    },
    'Delete',
    'btn-danger'
  );
}

// Edit a status rule
// Edit a status rule
function editStatusRule(index) {
  // Close any existing modal first
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }
  
  initializeAutomatedStatusState();
  const rule = state.automatedStatus.rules[index];
  
  if (!rule) {
    toast('Rule not found', 'error');
    return;
  }
  
  const conditions = rule.conditions || [{field: rule.conditionField, value: rule.conditionValue}];
  const targets = rule.targets || [{field: 'jstatus', value: rule.targetValue}];
  const logicOperator = rule.logicOperator || 'AND';
  
  // Generate unique ID prefix using timestamp
  const uniqueId = 'edit' + Date.now();
  window.editModalUniqueId = uniqueId;
  
  // Helper function to escape HTML
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  };
  
  // Build conditions rows HTML
  let conditionsHTML = '';
  conditions.forEach((condition, idx) => {
    const fields = getAvailableFields();
    const conditionOperator = condition.operator || (idx === 0 ? '(' : 'AND');
    
    // Check if this is a standalone closing bracket
    const isStandaloneBracket = conditionOperator === ')' && !condition.field && !condition.value;
    
    let valueHTML = '';
    let fieldsHtml = '';
    
    if (!isStandaloneBracket) {
      const options = getFieldOptions(condition.field);
      
      if (options.length > 0) {
        const optionsHtml = options.map(opt => {
          const selected = opt === condition.value ? 'selected' : '';
          return `<option value="${escapeHtml(opt)}" ${selected}>${escapeHtml(opt)}</option>`;
        }).join('');
        
        valueHTML = `
          <select id="${uniqueId}-cond-val-${idx}" class="edit-condition-value" data-index="${idx}" style="font-size:12px;width:100%;">
            <option value="">Select value...</option>
            ${optionsHtml}
          </select>
        `;
      } else {
        valueHTML = `<input type="text" id="${uniqueId}-cond-val-${idx}" class="edit-condition-value" data-index="${idx}" value="${escapeHtml(condition.value)}" placeholder="Enter value..." style="font-size:12px;width:100%;">`;
      }
      
      fieldsHtml = `<option value="">Select field...</option>` + fields.map(f => {
        const selected = f.value === condition.field ? 'selected' : '';
        return `<option value="${escapeHtml(f.value)}" ${selected}>${escapeHtml(f.label)}</option>`;
      }).join('');
    } else {
      // For standalone bracket, create empty selects/inputs with empty option selected
      fieldsHtml = `<option value="" selected>Select field...</option>` + fields.map(f => `<option value="${f.value}">${escapeHtml(f.label)}</option>`).join('');
      valueHTML = `<input type="text" id="${uniqueId}-cond-val-${idx}" class="edit-condition-value" data-index="${idx}" value="" placeholder="Leave empty for closing bracket" style="font-size:12px;width:100%;" readonly>`;
    }
    
    // Logic operator dropdown - first condition shows only "(", subsequent show "AND", "OR", ")"
    let operatorHTML = '';
    if (idx === 0) {
      operatorHTML = `
        <select id="${uniqueId}-cond-op-${idx}" class="edit-condition-operator" data-index="${idx}" onchange="toggleEditConditionFieldsVisibility(${idx})" style="font-size:11px;padding:4px 6px;width:50px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);">
          <option value="(" selected>(</option>
        </select>
      `;
    } else {
      operatorHTML = `
        <select id="${uniqueId}-cond-op-${idx}" class="edit-condition-operator" data-index="${idx}" onchange="toggleEditConditionFieldsVisibility(${idx})" style="font-size:11px;padding:4px 6px;width:70px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);">
          <option value="AND" ${conditionOperator === 'AND' ? 'selected' : ''}>AND</option>
          <option value="OR" ${conditionOperator === 'OR' ? 'selected' : ''}>OR</option>
          <option value=")" ${conditionOperator === ')' ? 'selected' : ''}>)</option>
        </select>
      `;
    }
    
    // Determine if field and value should be hidden
    const hideFieldValue = isStandaloneBracket ? 'style="display:none;"' : '';
    
    const removeBtn = conditions.length > 1 ? `<button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="padding:4px 8px;font-size:11px;">✕</button>` : '';
    
    conditionsHTML += `
      <div class="condition-row" style="display:grid;grid-template-columns:auto 1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end;">
        ${operatorHTML}
        <div class="edit-condition-field-wrapper-${idx}" style="display:flex;flex-direction:column;gap:2px;${isStandaloneBracket ? 'visibility:hidden;' : ''}">
          <label for="${uniqueId}-cond-field-${idx}" style="font-size:9px;color:var(--text3);font-weight:500;">Field</label>
          <select id="${uniqueId}-cond-field-${idx}" class="edit-condition-field" data-index="${idx}" onchange="updateEditConditionValueOptions(${idx})" style="font-size:12px;width:100%;">
            ${fieldsHtml}
          </select>
        </div>
        <div class="edit-condition-value-wrapper-${idx}" style="display:flex;flex-direction:column;gap:2px;${isStandaloneBracket ? 'visibility:hidden;' : ''}">
          <label for="${uniqueId}-cond-val-${idx}" style="font-size:9px;color:var(--text3);font-weight:500;">Value</label>
          ${valueHTML}
        </div>
        ${removeBtn}
      </div>
    `;
  });
  
  // Build targets rows HTML
  let targetsHTML = '';
  targets.forEach((target, idx) => {
    const fields = getAvailableFields();
    const options = getFieldOptions(target.field);
    const targetValue = target.value || '';
    
    let valueHTML = '';
    if (options.length > 0) {
      const optionsHtml = options.map(opt => {
        const selected = opt === targetValue ? 'selected' : '';
        return `<option value="${escapeHtml(opt)}" ${selected}>${escapeHtml(opt)}</option>`;
      }).join('');
      
      valueHTML = `
        <select id="${uniqueId}-targ-val-${idx}" class="edit-target-value" data-index="${idx}" style="font-size:12px;width:100%;">
          <option value="">Select value...</option>
          ${optionsHtml}
        </select>
      `;
    } else {
      valueHTML = `<input type="text" id="${uniqueId}-targ-val-${idx}" class="edit-target-value" data-index="${idx}" value="${escapeHtml(targetValue)}" placeholder="Enter value..." style="font-size:12px;width:100%;">`;
    }
    
    const fieldsHtml = fields.map(f => {
      const selected = f.value === target.field ? 'selected' : '';
      return `<option value="${escapeHtml(f.value)}" ${selected}>${escapeHtml(f.label)}</option>`;
    }).join('');
    
    const removeBtn = targets.length > 1 ? `<button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="padding:4px 8px;font-size:11px;">✕</button>` : '';
    
    targetsHTML += `
      <div class="target-row" style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-bottom:8px;align-items:end;">
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label for="${uniqueId}-targ-field-${idx}" style="font-size:9px;color:var(--text3);font-weight:500;">Field</label>
          <select id="${uniqueId}-targ-field-${idx}" class="edit-target-field" data-index="${idx}" onchange="updateEditTargetValueOptions(${idx})" style="font-size:12px;width:100%;">
            ${fieldsHtml}
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <label for="${uniqueId}-targ-val-${idx}" style="font-size:9px;color:var(--text3);font-weight:500;">Value</label>
          ${valueHTML}
        </div>
        ${removeBtn}
      </div>
    `;
  });
  
  // Create modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width:700px;max-height:80vh;overflow-y:auto;">
      <div class="modal-header">
        <h3>✏️ Edit Rule</h3>
        <button type="button" class="modal-close" id="closeModalBtn">&times;</button>
      </div>
      <div class="modal-body">
        <div class="form-group" style="margin-bottom:16px;">
          <label for="${uniqueId}-ruleName" style="font-size:11px;font-weight:600;">Rule Name</label>
          <input type="text" id="${uniqueId}-ruleName" value="${escapeHtml(rule.name || '')}" placeholder="e.g., Auto-complete deployed items" style="font-size:12px;width:100%;">
        </div>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div style="background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:var(--radius-sm);padding:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="font-size:11px;font-weight:600;color:var(--accent2);text-transform:uppercase;">🔍 Conditions</div>
              <button type="button" class="btn btn-secondary btn-sm" id="addCondBtn" style="font-size:11px;padding:4px 8px;">➕</button>
            </div>
            <div style="margin-bottom:10px;">
              <label for="${uniqueId}-logicOp" style="display:none;">Logic Operator</label>
              <select id="${uniqueId}-logicOp" name="${uniqueId}-logicOp" style="padding:4px 8px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);font-size:11px;width:100%;">
                <option value="AND" ${logicOperator === 'AND' ? 'selected' : ''}>AND (All must match)</option>
                <option value="OR" ${logicOperator === 'OR' ? 'selected' : ''}>OR (Any can match)</option>
              </select>
            </div>
            <div id="${uniqueId}-condContainer">${conditionsHTML}</div>
          </div>
          
          <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm);padding:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="font-size:11px;font-weight:600;color:var(--accent4);text-transform:uppercase;">🎯 Target Updates</div>
              <button type="button" class="btn btn-secondary btn-sm" id="addTargBtn" style="font-size:11px;padding:4px 8px;">➕</button>
            </div>
            <div id="${uniqueId}-targContainer">${targetsHTML}</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="cancelBtn">Cancel</button>
        <button type="button" class="btn btn-primary" id="saveBtn">💾 Save Changes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Prevent clicks on modal content from closing the modal
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
  
  // Close modal when clicking on overlay background
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeEditRuleModal();
    }
  });
  
  // Add event listeners
  const closeBtn = modal.querySelector('#closeModalBtn');
  const cancelBtn = modal.querySelector('#cancelBtn');
  const saveBtn = modal.querySelector('#saveBtn');
  const addCondBtn = modal.querySelector('#addCondBtn');
  const addTargBtn = modal.querySelector('#addTargBtn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeEditRuleModal();
    });
  }
  
  if (cancelBtn) {
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeEditRuleModal();
    });
  }
  
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      saveEditedRule(index);
    });
  }
  
  if (addCondBtn) addCondBtn.addEventListener('click', addEditConditionRow);
  if (addTargBtn) addTargBtn.addEventListener('click', addEditTargetRow);
  
  // Store modal reference for closing
  window.currentEditModal = modal;
  
  // Show modal with animation
  setTimeout(() => {
    modal.classList.add('show');
  }, 10);
  
  window.editRuleConditionsCount = conditions.length;
  window.editRuleTargetsCount = targets.length;
}

// Close edit rule modal
function closeEditRuleModal() {
  const modal = window.currentEditModal || document.querySelector('.modal-overlay');
  
  if (!modal) {
    window.editRuleConditionsCount = 0;
    window.editRuleTargetsCount = 0;
    window.editModalUniqueId = null;
    window.currentEditModal = null;
    return;
  }
  
  modal.classList.remove('show');
  
  setTimeout(() => {
    try {
      if (modal && modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    } catch (e) {
      // Error removing modal
    }
    window.currentEditModal = null;
  }, 300);
  
  window.editRuleConditionsCount = 0;
  window.editRuleTargetsCount = 0;
  window.editModalUniqueId = null;
}

// Add condition row in edit modal
function addEditConditionRow() {
  const uniqueId = window.editModalUniqueId;
  if (!uniqueId) return;
  
  const container = document.getElementById(`${uniqueId}-condContainer`);
  if (!container) return;
  
  const idx = window.editRuleConditionsCount || 0;
  window.editRuleConditionsCount = idx + 1;
  
  const fields = getAvailableFields();
  const fieldsHtml = fields.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
  
  // For new conditions (not the first one), show AND/OR/) options
  const operatorHTML = `
    <select id="${uniqueId}-cond-op-${idx}" class="edit-condition-operator" data-index="${idx}" onchange="toggleEditConditionFieldsVisibility(${idx})" style="font-size:11px;padding:4px 6px;width:70px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text);">
      <option value="AND" selected>AND</option>
      <option value="OR">OR</option>
      <option value=")">)</option>
    </select>
  `;
  
  const row = document.createElement('div');
  row.className = 'condition-row';
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
  row.innerHTML = `
    ${operatorHTML}
    <div class="edit-condition-field-wrapper-${idx}" style="flex:1;display:flex;flex-direction:column;gap:2px;">
      <label for="${uniqueId}-cond-field-${idx}" style="font-size:9px;color:var(--text3);font-weight:500;">Field</label>
      <select id="${uniqueId}-cond-field-${idx}" class="edit-condition-field" data-index="${idx}" onchange="updateEditConditionValueOptions(${idx})" style="font-size:12px;width:100%;">
        <option value="">Select field...</option>
        ${fieldsHtml}
      </select>
    </div>
    <div class="edit-condition-value-wrapper-${idx}" style="flex:1;display:flex;flex-direction:column;gap:2px;">
      <label for="${uniqueId}-cond-val-${idx}" style="font-size:9px;color:var(--text3);font-weight:500;">Value</label>
      <input type="text" id="${uniqueId}-cond-val-${idx}" class="edit-condition-value" data-index="${idx}" placeholder="Enter value..." style="font-size:12px;width:100%;">
    </div>
    <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="padding:4px 8px;font-size:11px;">✕</button>
  `;
  container.appendChild(row);
}

// Toggle visibility of field and value inputs in edit modal based on operator selection
function toggleEditConditionFieldsVisibility(index) {
  const uniqueId = window.editModalUniqueId;
  if (!uniqueId) return;
  
  const operatorSelect = document.getElementById(`${uniqueId}-cond-op-${index}`);
  const fieldWrapper = document.querySelector(`.edit-condition-field-wrapper-${index}`);
  const valueWrapper = document.querySelector(`.edit-condition-value-wrapper-${index}`);
  
  if (!operatorSelect) return;
  
  const operator = operatorSelect.value;
  
  if (operator === ')') {
    // Hide field and value for closing bracket
    if (fieldWrapper) fieldWrapper.style.visibility = 'hidden';
    if (valueWrapper) valueWrapper.style.visibility = 'hidden';
  } else {
    // Show field and value for other operators
    if (fieldWrapper) fieldWrapper.style.visibility = 'visible';
    if (valueWrapper) valueWrapper.style.visibility = 'visible';
  }
}

// Add target row in edit modal
function addEditTargetRow() {
  const uniqueId = window.editModalUniqueId;
  if (!uniqueId) return;
  
  const container = document.getElementById(`${uniqueId}-targContainer`);
  if (!container) return;
  
  const idx = window.editRuleTargetsCount || 0;
  window.editRuleTargetsCount = idx + 1;
  
  const fields = getAvailableFields();
  const fieldsHtml = fields.map(f => `<option value="${f.value}">${f.label}</option>`).join('');
  
  const row = document.createElement('div');
  row.className = 'target-row';
  row.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;';
  row.innerHTML = `
    <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
      <label for="${uniqueId}-targ-field-${idx}" style="font-size:9px;color:var(--text3);font-weight:500;">Field</label>
      <select id="${uniqueId}-targ-field-${idx}" class="edit-target-field" data-index="${idx}" onchange="updateEditTargetValueOptions(${idx})" style="font-size:12px;width:100%;">
        ${fieldsHtml}
      </select>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
      <label for="${uniqueId}-targ-val-${idx}" style="font-size:9px;color:var(--text3);font-weight:500;">Value</label>
      <input type="text" id="${uniqueId}-targ-val-${idx}" class="edit-target-value" data-index="${idx}" placeholder="Enter value..." style="font-size:12px;width:100%;">
    </div>
    <button type="button" class="btn btn-secondary btn-sm" onclick="this.parentElement.remove()" style="padding:4px 8px;font-size:11px;">✕</button>
  `;
  container.appendChild(row);
}

// Update condition value options in edit modal
function updateEditConditionValueOptions(idx) {
  const uniqueId = window.editModalUniqueId;
  if (!uniqueId) return;
  
  const fieldSelect = document.getElementById(`${uniqueId}-cond-field-${idx}`);
  const valueElement = document.getElementById(`${uniqueId}-cond-val-${idx}`);
  
  if (!fieldSelect || !valueElement) return;
  
  const fieldKey = fieldSelect.value;
  const options = getFieldOptions(fieldKey);
  const currentValue = valueElement.value;
  
  if (options.length > 0) {
    const select = document.createElement('select');
    select.id = `${uniqueId}-cond-val-${idx}`;
    select.className = 'edit-condition-value';
    select.setAttribute('data-index', idx);
    select.style.cssText = 'font-size:12px;flex:1;';
    select.innerHTML = `
      <option value="">Select value...</option>
      ${options.map(opt => `<option value="${opt}" ${opt === currentValue ? 'selected' : ''}>${opt}</option>`).join('')}
    `;
    valueElement.parentNode.replaceChild(select, valueElement);
  } else if (valueElement.tagName === 'SELECT') {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `${uniqueId}-cond-val-${idx}`;
    input.className = 'edit-condition-value';
    input.setAttribute('data-index', idx);
    input.value = currentValue;
    input.placeholder = 'Enter value...';
    input.style.cssText = 'font-size:12px;flex:1;';
    valueElement.parentNode.replaceChild(input, valueElement);
  }
}

// Update target value options in edit modal
function updateEditTargetValueOptions(idx) {
  const uniqueId = window.editModalUniqueId;
  if (!uniqueId) return;
  
  const fieldSelect = document.getElementById(`${uniqueId}-targ-field-${idx}`);
  const valueElement = document.getElementById(`${uniqueId}-targ-val-${idx}`);
  
  if (!fieldSelect || !valueElement) return;
  
  const fieldKey = fieldSelect.value;
  const options = getFieldOptions(fieldKey);
  const currentValue = valueElement.value;
  
  if (options.length > 0) {
    const select = document.createElement('select');
    select.id = `${uniqueId}-targ-val-${idx}`;
    select.className = 'edit-target-value';
    select.setAttribute('data-index', idx);
    select.style.cssText = 'font-size:12px;flex:1;';
    select.innerHTML = `
      <option value="">Select value...</option>
      ${options.map(opt => `<option value="${opt}" ${opt === currentValue ? 'selected' : ''}>${opt}</option>`).join('')}
    `;
    valueElement.parentNode.replaceChild(select, valueElement);
  } else if (valueElement.tagName === 'SELECT') {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = `${uniqueId}-targ-val-${idx}`;
    input.className = 'edit-target-value';
    input.setAttribute('data-index', idx);
    input.value = currentValue;
    input.placeholder = 'Enter value...';
    input.style.cssText = 'font-size:12px;flex:1;';
    valueElement.parentNode.replaceChild(input, valueElement);
  }
}

// Save edited rule
function saveEditedRule(index) {
  const uniqueId = window.editModalUniqueId;
  if (!uniqueId) return;
  
  const name = document.getElementById(`${uniqueId}-ruleName`)?.value.trim();
  const logicOperator = document.getElementById(`${uniqueId}-logicOp`)?.value || 'AND';
  
  if (!name) {
    toast('Enter rule name', 'error');
    return;
  }
  
  // Collect conditions
  const conditions = [];
  const conditionFields = document.querySelectorAll('.edit-condition-field');
  const conditionValues = document.querySelectorAll('.edit-condition-value');
  const conditionOperators = document.querySelectorAll('.edit-condition-operator');
  
  for (let i = 0; i < conditionFields.length; i++) {
    const field = (conditionFields[i].value || '').trim();
    const value = (conditionValues[i].value || '').trim();
    const operator = conditionOperators[i]?.value || (i === 0 ? '(' : 'AND');
    
    // Only include conditions with both field and value (skip empty bracket conditions)
    if (field !== '' && value !== '') {
      conditions.push({field, value, operator});
    }
  }
  
  if (conditions.length === 0) {
    toast('Add at least one condition', 'error');
    return;
  }
  
  // Collect targets
  const targets = [];
  const targetFields = document.querySelectorAll('.edit-target-field');
  const targetValues = document.querySelectorAll('.edit-target-value');
  
  for (let i = 0; i < targetFields.length; i++) {
    const field = targetFields[i].value;
    const value = targetValues[i].value;
    
    if (field && value) {
      targets.push({field, value});
    }
  }
  
  if (targets.length === 0) {
    toast('Add at least one target update', 'error');
    return;
  }
  
  initializeAutomatedStatusState();
  
  // Update the existing rule
  state.automatedStatus.rules[index] = {
    ...state.automatedStatus.rules[index],
    name: name,
    conditions: conditions,
    targets: targets,
    logicOperator: logicOperator,
    updatedAt: new Date().toISOString()
  };
  
  saveState();
  
  // Format conditions for log
  const conditionsLog = conditions.map(c => {
    if (c.operator === ')' && !c.field && !c.value) {
      return c.operator;
    }
    return `${c.operator} ${getFieldLabel(c.field)} = "${c.value}"`;
  }).join(' ');
  
  // Format targets for log
  const targetsLog = targets.map(t => `${getFieldLabel(t.field)} = "${t.value}"`).join(', ');
  
  addExecutionLog(`Updated rule: ${name} | IF: ${conditionsLog} | THEN: ${targetsLog}`, 'success');
  toast('Rule updated successfully', 'success');
  
  // Close modal and refresh
  closeEditRuleModal();
  
  // Refresh the display after modal closes
  setTimeout(() => {
    renderAutomatedStatusCard();
  }, 350);
}

// Add a new automated status rule
function addAutomatedStatusRule() {
  const name = document.getElementById('newRuleName')?.value.trim();
  const logicOperator = document.getElementById('logicOperator')?.value || 'AND';
  
  if (!name) {
    toast('Enter rule name', 'error');
    return;
  }
  
  // Collect all conditions
  const conditions = [];
  const conditionFields = document.querySelectorAll('.condition-field');
  const conditionValues = document.querySelectorAll('.condition-value');
  const conditionOperators = document.querySelectorAll('.condition-operator');
  
  for (let i = 0; i < conditionFields.length; i++) {
    const field = (conditionFields[i].value || '').trim();
    const value = (conditionValues[i].value || '').trim();
    const operator = conditionOperators[i]?.value || (i === 0 ? '(' : 'AND');
    
    // Only include conditions with both field and value (skip empty bracket conditions)
    if (field !== '' && value !== '') {
      conditions.push({field, value, operator});
    }
  }
  
  if (conditions.length === 0) {
    toast('Add at least one condition', 'error');
    return;
  }
  
  // Collect all targets
  const targets = [];
  const targetFields = document.querySelectorAll('.target-field');
  const targetValues = document.querySelectorAll('.target-value');
  
  for (let i = 0; i < targetFields.length; i++) {
    const field = targetFields[i].value;
    const value = targetValues[i].value;
    
    if (field && value) {
      targets.push({field, value});
    }
  }
  
  if (targets.length === 0) {
    toast('Add at least one target update', 'error');
    return;
  }
  
  initializeAutomatedStatusState();
  
  const newRule = {
    name: name,
    conditions: conditions,
    targets: targets,
    logicOperator: logicOperator,
    enabled: true,
    createdAt: new Date().toISOString()
  };
  
  state.automatedStatus.rules.push(newRule);
  saveState();
  
  // Format conditions for log
  const conditionsLog = conditions.map(c => {
    if (c.operator === ')' && !c.field && !c.value) {
      return c.operator;
    }
    return `${c.operator} ${getFieldLabel(c.field)} = "${c.value}"`;
  }).join(' ');
  
  // Format targets for log
  const targetsLog = targets.map(t => `${getFieldLabel(t.field)} = "${t.value}"`).join(', ');
  
  addExecutionLog(`Created rule: ${name} | IF: ${conditionsLog} | THEN: ${targetsLog}`, 'success');
  
  clearRuleForm();
  renderAutomatedStatusCard();
  toast('Rule added successfully', 'success');
}

// Clear the rule form
function clearRuleForm() {
  const nameField = document.getElementById('newRuleName');
  if (nameField) nameField.value = '';
  
  const conditionsContainer = document.getElementById('conditionsContainer');
  if (conditionsContainer) conditionsContainer.innerHTML = '';
  
  const targetsContainer = document.getElementById('targetsContainer');
  if (targetsContainer) targetsContainer.innerHTML = '';
  
  // Add default rows
  addConditionRow();
  addTargetRow();
}

// Apply automated status rules to a record
function applyAutomatedStatusRules(record) {
  initializeAutomatedStatusState();
  
  if (!state.automatedStatus.enabled) return record;
  
  const activeRules = state.automatedStatus.rules.filter(r => r.enabled);
  if (activeRules.length === 0) return record;
  
  let modified = false;
  let appliedRules = [];
  
  for (const rule of activeRules) {
    // Get conditions (support both old and new format)
    const conditions = rule.conditions || [{field: rule.conditionField, value: rule.conditionValue}];
    
    // Evaluate conditions - simpler approach without eval
    let conditionsMatch = true;
    let currentLogic = 'AND'; // default logic between conditions
    let groupResult = true;
    let inGroup = false;
    
    try {
      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i];
        const operator = condition.operator || (i === 0 ? '(' : 'AND');
        
        // Handle standalone closing bracket
        if (operator === ')' && (!condition.field || !condition.value)) {
          // Close the group
          if (inGroup) {
            inGroup = false;
            // Apply group result with previous logic
            if (currentLogic === 'AND') {
              conditionsMatch = conditionsMatch && groupResult;
            } else if (currentLogic === 'OR') {
              conditionsMatch = conditionsMatch || groupResult;
            }
          }
          continue;
        }
        
        // Check if this condition matches
        const fieldValue = record[condition.field];
        const conditionValue = condition.value ? condition.value.trim() : '';
        const recordValue = fieldValue ? fieldValue.toString().trim() : '';
        const matches = recordValue === conditionValue;
        
        // Handle opening bracket
        if (operator === '(') {
          inGroup = true;
          groupResult = matches;
          continue;
        }
        
        // Apply logic operator
        if (inGroup) {
          // We're inside a group
          if (operator === 'AND') {
            groupResult = groupResult && matches;
          } else if (operator === 'OR') {
            groupResult = groupResult || matches;
          }
        } else {
          // Not in a group, apply to main result
          if (operator === 'AND') {
            conditionsMatch = conditionsMatch && matches;
            currentLogic = 'AND';
          } else if (operator === 'OR') {
            conditionsMatch = conditionsMatch || matches;
            currentLogic = 'OR';
          }
        }
      }
      
      // If still in a group at the end, close it
      if (inGroup) {
        if (currentLogic === 'AND') {
          conditionsMatch = conditionsMatch && groupResult;
        } else if (currentLogic === 'OR') {
          conditionsMatch = conditionsMatch || groupResult;
        }
      }
    } catch (e) {
      conditionsMatch = false;
    }
    
    if (conditionsMatch) {
      // Get targets (support both old and new format)
      const targets = rule.targets || [{field: 'jstatus', value: rule.targetValue}];
      
      // Apply all target updates
      const changes = [];
      targets.forEach(target => {
        const oldValue = record[target.field];
        if (oldValue !== target.value) {
          record[target.field] = target.value;
          changes.push(`${getFieldLabel(target.field)}: "${oldValue}" → "${target.value}"`);
        }
      });
      
      if (changes.length > 0) {
        modified = true;
        appliedRules.push(rule.name);
        
        addExecutionLog(
          `Applied "${rule.name}": ${changes.join(', ')} for record ${getRecordIdentifier(record)}`,
          'success'
        );
      }
    }
  }
  
  if (modified) {
    state.automatedStatus.lastExecution = new Date().toISOString();
    // Save state after applying rules
    saveState();
  }
  
  return record;
}

// Helper function to get record identifier
function getRecordIdentifier(record) {
  if (record.jira) {
    return `JIRA-${record.jira}`;
  } else if (record.desc) {
    const shortDesc = record.desc.length > 30 ? record.desc.substring(0, 30) + '...' : record.desc;
    return `"${shortDesc}"`;
  } else {
    return `#${record.id || 'new'}`;
  }
}

// Test all automated rules (dry run)
function testAllAutomatedRules() {
  initializeAutomatedStatusState();
  
  if (!state.automatedStatus.enabled) {
    toast('Automated status is disabled', 'error');
    return;
  }
  
  const activeRules = state.automatedStatus.rules.filter(r => r.enabled);
  if (activeRules.length === 0) {
    toast('No active rules to test', 'error');
    return;
  }
  
  let matchCount = 0;
  const matchDetails = [];
  
  state.records.forEach(record => {
    activeRules.forEach(rule => {
      const conditions = rule.conditions || [{field: rule.conditionField, value: rule.conditionValue}];
      
      // Evaluate conditions - simpler approach without eval
      let conditionsMatch = true;
      let currentLogic = 'AND';
      let groupResult = true;
      let inGroup = false;
      
      try {
        for (let i = 0; i < conditions.length; i++) {
          const condition = conditions[i];
          const operator = condition.operator || (i === 0 ? '(' : 'AND');
          
          // Handle standalone closing bracket
          if (operator === ')' && (!condition.field || !condition.value)) {
            if (inGroup) {
              inGroup = false;
              if (currentLogic === 'AND') {
                conditionsMatch = conditionsMatch && groupResult;
              } else if (currentLogic === 'OR') {
                conditionsMatch = conditionsMatch || groupResult;
              }
            }
            continue;
          }
          
          // Check if this condition matches
          const fieldValue = record[condition.field];
          const conditionValue = condition.value ? condition.value.trim() : '';
          const recordValue = fieldValue ? fieldValue.toString().trim() : '';
          const matches = recordValue === conditionValue;
          
          // Handle opening bracket
          if (operator === '(') {
            inGroup = true;
            groupResult = matches;
            continue;
          }
          
          // Apply logic operator
          if (inGroup) {
            if (operator === 'AND') {
              groupResult = groupResult && matches;
            } else if (operator === 'OR') {
              groupResult = groupResult || matches;
            }
          } else {
            if (operator === 'AND') {
              conditionsMatch = conditionsMatch && matches;
              currentLogic = 'AND';
            } else if (operator === 'OR') {
              conditionsMatch = conditionsMatch || matches;
              currentLogic = 'OR';
            }
          }
        }
        
        // If still in a group at the end, close it
        if (inGroup) {
          if (currentLogic === 'AND') {
            conditionsMatch = conditionsMatch && groupResult;
          } else if (currentLogic === 'OR') {
            conditionsMatch = conditionsMatch || groupResult;
          }
        }
      } catch (e) {
        conditionsMatch = false;
      }
      
      if (conditionsMatch) {
        matchCount++;
        const recordDesc = getRecordIdentifier(record);
        matchDetails.push(`${recordDesc} matches "${rule.name}"`);
      }
    });
  });
  
  const logMessage = matchCount > 0 
    ? `Test completed: ${matchCount} record(s) would be updated. ${matchDetails.slice(0, 5).join(', ')}${matchCount > 5 ? '...' : ''}`
    : 'Test completed: No records match active rules';
  
  addExecutionLog(logMessage, 'info');
  renderAutomatedStatusCard();
  toast(`Test complete: ${matchCount} records match active rules`, matchCount > 0 ? 'success' : 'info');
}

// Add entry to execution log
function addExecutionLog(message, type = 'info') {
  initializeAutomatedStatusState();
  
  state.automatedStatus.executionLog.push({
    timestamp: new Date().toISOString(),
    message: message,
    type: type
  });
  
  // Keep only last 100 entries
  if (state.automatedStatus.executionLog.length > 100) {
    state.automatedStatus.executionLog = state.automatedStatus.executionLog.slice(-100);
  }
  
  saveState();
  
  // Update the execution log display immediately
  renderExecutionLog();
}

// Render execution log dynamically
function renderExecutionLog() {
  const container = document.querySelector('.status-execution-log');
  if (!container) return;
  
  initializeAutomatedStatusState();
  const logs = state.automatedStatus.executionLog;
  
  if (logs && logs.length > 0) {
    container.innerHTML = logs.slice(-20).reverse().map(log => `
      <div class="status-log-entry ${log.type || 'info'}">
        <span style="color:var(--text3);">${new Date(log.timestamp).toLocaleTimeString()}</span> - ${log.message}
      </div>
    `).join('');
  } else {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:11px;">No log entries yet.</div>';
  }
}

// Clear execution log
function clearExecutionLog() {
  initializeAutomatedStatusState();
  
  showConfirmModal(
    '🗑️ Clear Execution Log',
    'Are you sure you want to clear all execution log entries? This action cannot be undone.',
    () => {
      state.automatedStatus.executionLog = [];
      saveState();
      renderAutomatedStatusCard();
      toast('Execution log cleared', 'info');
    },
    'Clear',
    'btn-danger'
  );
}
