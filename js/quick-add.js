/**
 * Quick Add Module
 * Floating action button for fast record entry
 */

// Initialize Quick Add functionality
function initQuickAdd() {
  createQuickAddButton();
  createQuickAddModal();
  attachQuickAddEventListeners();
}

// Create floating action button
function createQuickAddButton() {
  const fab = document.createElement('button');
  fab.id = 'quick-add-fab';
  fab.className = 'quick-add-fab';
  fab.innerHTML = '+';
  fab.title = 'Quick Add Record';
  
  document.body.appendChild(fab);
}

// Create quick add modal
function createQuickAddModal() {
  const modal = document.createElement('div');
  modal.id = 'quick-add-modal';
  modal.className = 'quick-add-modal';
  
  modal.innerHTML = `
    <div class="quick-add-content">
      <div class="quick-add-header">
        <h2 class="quick-add-title">
          <span class="quick-add-icon">⚡</span>
          Quick Add Record
        </h2>
        <button class="quick-add-close" id="quick-add-close">×</button>
      </div>
      
      <form class="quick-add-form" id="quick-add-form">
        <div id="quick-add-fields-container"></div>
        
        <div class="quick-add-actions">
          <button type="submit" class="quick-add-submit">
            ✓ Create Record
          </button>
          <button type="button" class="quick-add-cancel" id="quick-add-cancel">
            Cancel
          </button>
        </div>
      </form>
    </div>
    
    <div class="quick-add-success" id="quick-add-success">
      <span class="quick-add-success-icon">✓</span>
      <span>Record created successfully!</span>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Generate all form fields dynamically
function generateQuickAddFields() {
  const container = document.getElementById('quick-add-fields-container');
  if (!container) return;
  
  // Get all visible columns (system + custom) sorted by order
  const allCols = [
    ...state.columns.filter(c => c.visible && c.key !== 'tags' && c.key !== 'timestamps'),
    ...state.customColumns.filter(c => c.visible === true).map(c => ({
      key: 'cc_' + c.key,
      label: c.label,
      type: c.type,
      order: c.order,
      isCustom: true,
      original: c
    }))
  ];
  
  allCols.sort((a, b) => (a.order || 999) - (b.order || 999));
  
  let html = '';
  
  allCols.forEach(col => {
    if (col.key === 'pi') {
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-pi">PI</label>
          <input type="text" id="qa-pi" name="qa-pi" class="quick-add-input" placeholder="e.g., PI-24.1" />
        </div>`;
    } else if (col.key === 'sprint_start') {
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-sprint-start">Sprint Start</label>
          <input type="text" id="qa-sprint-start" name="qa-sprint-start" class="quick-add-input" placeholder="e.g., 2" />
        </div>`;
    } else if (col.key === 'jira') {
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-jira">Jira Story <span style="color:var(--text3);font-size:9px">(digits only)</span></label>
          <input type="text" id="qa-jira" name="qa-jira" class="quick-add-input" placeholder="e.g., 1234" oninput="previewQuickJira(this.value)" />
          <div class="preview-hint" id="qa-jira-preview" style="color:var(--accent4)"></div>
        </div>`;
    } else if (col.key === 'desc') {
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-desc">Description</label>
          <textarea id="qa-desc" name="qa-desc" class="quick-add-textarea" placeholder="Story description..."></textarea>
        </div>`;
    } else if (col.key === 'jstatus') {
      const options = state.jiraStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-jstatus">Jira Status</label>
          <select id="qa-jstatus" name="qa-jstatus" class="quick-add-select">
            <option value="">— Select —</option>
            ${options}
          </select>
        </div>`;
    } else if (col.key === 'wi1') {
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-wi1">Work Item 1 (SC) <span style="color:var(--text3);font-size:9px">(digits only)</span></label>
          <input type="text" id="qa-wi1" name="qa-wi1" class="quick-add-input" placeholder="e.g., 1" oninput="previewQuickWI1(this.value)" />
          <div class="preview-hint" id="qa-wi1-preview" style="color:var(--accent4)"></div>
        </div>`;
    } else if (col.key === 'wi2') {
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-wi2">Work Item 2 (VC) <span style="color:var(--text3);font-size:9px">(digits only)</span></label>
          <input type="text" id="qa-wi2" name="qa-wi2" class="quick-add-input" placeholder="e.g., 2" oninput="previewQuickWI2(this.value)" />
          <div class="preview-hint" id="qa-wi2-preview" style="color:var(--accent4)"></div>
        </div>`;
    } else if (col.key === 'dstatus') {
      const options = state.devopsStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-dstatus">DevOps Status</label>
          <select id="qa-dstatus" name="qa-dstatus" class="quick-add-select">
            <option value="">— Select —</option>
            ${options}
          </select>
        </div>`;
    } else if (col.key === 'dorg') {
      const options = state.devopsOrgs.map(s => `<option value="${s}">${s}</option>`).join('');
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-dorg">DevOps ORG</label>
          <select id="qa-dorg" name="qa-dorg" class="quick-add-select">
            <option value="">— Select —</option>
            ${options}
          </select>
        </div>`;
    } else if (col.key === 'comments') {
      html += `
        <div class="quick-add-field">
          <label class="quick-add-label" for="qa-comments">Comments</label>
          <textarea id="qa-comments" name="qa-comments" class="quick-add-textarea" placeholder="Additional notes..."></textarea>
        </div>`;
    } else if (col.isCustom) {
      const c = col.original;
      if (c.type === 'select') {
        const options = (c.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('');
        html += `
          <div class="quick-add-field">
            <label class="quick-add-label" for="qa-cc-${c.key}">${c.label}</label>
            <select id="qa-cc-${c.key}" name="qa-cc-${c.key}" class="quick-add-select">
              <option value="">— Select —</option>
              ${options}
            </select>
          </div>`;
      } else if (c.type === 'longtext') {
        html += `
          <div class="quick-add-field">
            <label class="quick-add-label" for="qa-cc-${c.key}">${c.label}</label>
            <textarea id="qa-cc-${c.key}" name="qa-cc-${c.key}" class="quick-add-textarea" placeholder="${c.label}..."></textarea>
          </div>`;
      } else if (c.type === 'date') {
        html += `
          <div class="quick-add-field">
            <label class="quick-add-label" for="qa-cc-${c.key}">${c.label}</label>
            <input type="date" id="qa-cc-${c.key}" name="qa-cc-${c.key}" class="quick-add-input" onchange="previewQuickCustomDate('${c.key}', this.value)" />
            <div class="preview-hint" id="qa-cc-${c.key}-preview" style="color:var(--accent4)"></div>
          </div>`;
      } else if (c.type === 'number') {
        html += `
          <div class="quick-add-field">
            <label class="quick-add-label" for="qa-cc-${c.key}">${c.label}</label>
            <input type="number" id="qa-cc-${c.key}" name="qa-cc-${c.key}" class="quick-add-input" placeholder="${c.label}..." />
          </div>`;
      } else if (c.type === 'url') {
        html += `
          <div class="quick-add-field">
            <label class="quick-add-label" for="qa-cc-${c.key}">${c.label}</label>
            <input type="url" id="qa-cc-${c.key}" name="qa-cc-${c.key}" class="quick-add-input" placeholder="https://example.com" oninput="previewQuickCustomUrl('${c.key}', this.value)" />
            <div class="preview-hint" id="qa-cc-${c.key}-preview" style="color:var(--accent4)"></div>
          </div>`;
      } else if (c.type === 'email') {
        html += `
          <div class="quick-add-field">
            <label class="quick-add-label" for="qa-cc-${c.key}">${c.label}</label>
            <input type="email" id="qa-cc-${c.key}" name="qa-cc-${c.key}" class="quick-add-input" placeholder="email@example.com" oninput="previewQuickCustomEmail('${c.key}', this.value)" />
            <div class="preview-hint" id="qa-cc-${c.key}-preview" style="color:var(--accent4)"></div>
          </div>`;
      } else {
        html += `
          <div class="quick-add-field">
            <label class="quick-add-label" for="qa-cc-${c.key}">${c.label}</label>
            <input type="text" id="qa-cc-${c.key}" name="qa-cc-${c.key}" class="quick-add-input" placeholder="${c.label}..." />
          </div>`;
      }
    }
  });
  
  container.innerHTML = html;
}

// Attach event listeners
function attachQuickAddEventListeners() {
  const fab = document.getElementById('quick-add-fab');
  const modal = document.getElementById('quick-add-modal');
  const closeBtn = document.getElementById('quick-add-close');
  const cancelBtn = document.getElementById('quick-add-cancel');
  const form = document.getElementById('quick-add-form');
  
  // Open modal
  fab?.addEventListener('click', openQuickAddModal);
  
  // Close modal
  closeBtn?.addEventListener('click', closeQuickAddModal);
  cancelBtn?.addEventListener('click', closeQuickAddModal);
  
  // Close on outside click
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeQuickAddModal();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal?.classList.contains('show')) {
      closeQuickAddModal();
    }
  });
  
  // Handle form submission
  form?.addEventListener('submit', handleQuickAddSubmit);
}

// Open quick add modal
function openQuickAddModal() {
  const modal = document.getElementById('quick-add-modal');
  // Generate fields dynamically each time modal opens to get latest columns
  generateQuickAddFields();
  modal?.classList.add('show');
  
  // Focus first input
  const firstInput = document.getElementById('qa-pi');
  setTimeout(() => firstInput?.focus(), 100);
}

// Close quick add modal
function closeQuickAddModal() {
  const modal = document.getElementById('quick-add-modal');
  modal?.classList.remove('show');
  
  // Reset form
  const form = document.getElementById('quick-add-form');
  form?.reset();
}

// Handle form submission
function handleQuickAddSubmit(e) {
  e.preventDefault();
  
  // Get all form values dynamically
  const record = {
    id: Date.now(),
    pi: document.getElementById('qa-pi')?.value.trim() || '',
    sprint_start: document.getElementById('qa-sprint-start')?.value.trim() || '',
    sprint_end: '',
    jira: document.getElementById('qa-jira')?.value.trim() || '',
    desc: document.getElementById('qa-desc')?.value.trim() || '',
    jstatus: document.getElementById('qa-jstatus')?.value || '',
    wi1: document.getElementById('qa-wi1')?.value.trim() || '',
    wi2: document.getElementById('qa-wi2')?.value.trim() || '',
    dstatus: document.getElementById('qa-dstatus')?.value || '',
    dorg: document.getElementById('qa-dorg')?.value || '',
    comments: document.getElementById('qa-comments')?.value.trim() || ''
  };
  
  // Add custom column values from form
  if (state.customColumns) {
    state.customColumns.forEach(col => {
      const el = document.getElementById('qa-cc-' + col.key);
      if (el) {
        record[`cc_${col.key}`] = el.value || '';
      }
    });
  }
  
  // Add timestamps
  if (typeof addCreatedTimestamp === 'function') {
    addCreatedTimestamp(record);
  }
  
  // Add to state at the beginning (new records show first)
  state.records.unshift(record);
  
  // Save state
  saveState();
  
  // Refresh UI
  renderTable();
  updateKPIs();
  
  // Close modal
  closeQuickAddModal();
  
  // Show success message
  showQuickAddSuccess();
  
  // Show toast
  if (typeof showToast === 'function') {
    showToast('Record created successfully!', 'success');
  }
}

// Show success toast
function showQuickAddSuccess() {
  const successToast = document.getElementById('quick-add-success');
  if (!successToast) return;
  
  successToast.classList.add('show');
  
  setTimeout(() => {
    successToast.classList.remove('show');
  }, 3000);
}

// Populate quick add form with preset values
function openQuickAddWithPreset(preset = {}) {
  openQuickAddModal();
  
  // Populate fields
  if (preset.pi) document.getElementById('qa-pi').value = preset.pi;
  if (preset.sprint_start) document.getElementById('qa-sprint-start').value = preset.sprint_start;
  if (preset.jira) document.getElementById('qa-jira').value = preset.jira;
  if (preset.desc) document.getElementById('qa-desc').value = preset.desc;
  if (preset.jstatus) document.getElementById('qa-jstatus').value = preset.jstatus;
  if (preset.wi1) document.getElementById('qa-wi1').value = preset.wi1;
}

// Get most recent PI and Sprint for auto-fill
function getRecentPISprint() {
  if (!state.records || state.records.length === 0) {
    return { pi: '', sprint_start: '' };
  }
  
  const lastRecord = state.records[state.records.length - 1];
  return {
    pi: lastRecord.pi || '',
    sprint_start: lastRecord.sprint_start || ''
  };
}

// Auto-fill PI and Sprint from last record
function autoFillQuickAdd() {
  const recent = getRecentPISprint();
  
  const piInput = document.getElementById('qa-pi');
  const sprintStartInput = document.getElementById('qa-sprint-start');
  
  if (piInput && !piInput.value) piInput.value = recent.pi;
  if (sprintStartInput && !sprintStartInput.value) sprintStartInput.value = recent.sprint_start;
}

// Enhance quick add modal with auto-fill
function enhanceQuickAddModal() {
  const modal = document.getElementById('quick-add-modal');
  
  modal?.addEventListener('transitionend', (e) => {
    if (modal.classList.contains('show')) {
      autoFillQuickAdd();
    }
  });
}

// Preview functions for Quick Add form
function previewQuickJira(val) {
  const preview = document.getElementById('qa-jira-preview');
  if (!preview) return;
  
  const n = val.split('-').pop().replace(/\D/g, '');
  preview.textContent = n ? '→ ' + state.jiraDisplayFormat.replace('{number}', n) : '';
}

function previewQuickWI1(val) {
  const preview = document.getElementById('qa-wi1-preview');
  if (!preview) return;
  
  const n = parseInt(val.replace(/\D/g, ''));
  if (isNaN(n)) {
    preview.textContent = '';
    return;
  }
  const p = String(n).padStart(6, '0');
  preview.textContent = '→ ' + state.wiDisplayFormat.replace('{number6}', p).replace('{number}', n);
}

function previewQuickWI2(val) {
  const preview = document.getElementById('qa-wi2-preview');
  if (!preview) return;
  
  const n = parseInt(val.replace(/\D/g, ''));
  if (isNaN(n)) {
    preview.textContent = '';
    return;
  }
  const p = String(n).padStart(6, '0');
  preview.textContent = '→ ' + state.wiDisplayFormat.replace('{number6}', p).replace('{number}', n);
}

function previewQuickCustomDate(key, val) {
  const preview = document.getElementById(`qa-cc-${key}-preview`);
  if (!preview) return;
  
  if (!val || val.trim() === '') {
    preview.textContent = '';
    return;
  }
  
  try {
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      preview.textContent = '';
      return;
    }
    const formatted = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    preview.textContent = '→ ' + formatted;
    preview.style.color = 'var(--accent4)';
  } catch (e) {
    preview.textContent = '';
  }
}

function previewQuickCustomUrl(key, val) {
  const preview = document.getElementById(`qa-cc-${key}-preview`);
  if (!preview) return;
  
  if (val && val.trim()) {
    preview.innerHTML = `→ <a href="${val}" target="_blank" style="color:var(--accent4)">${val}</a>`;
  } else {
    preview.innerHTML = '';
  }
}

function previewQuickCustomEmail(key, val) {
  const preview = document.getElementById(`qa-cc-${key}-preview`);
  if (!preview) return;
  
  if (val && val.trim()) {
    preview.innerHTML = `→ <a href="mailto:${val}" style="color:var(--accent4)">${val}</a>`;
  } else {
    preview.innerHTML = '';
  }
}
