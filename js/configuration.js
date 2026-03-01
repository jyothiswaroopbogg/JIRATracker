// Configuration and Settings Functions

// Apply Saved Colors on Page Load
function applySavedColors() {
  if (!state.colors || Object.keys(state.colors).length === 0) {
    return; // No saved colors, use CSS defaults
  }
  
  const hexIds = {
    '--bg': 'bg',
    '--surface': 'surface',
    '--surface2': 'surface2',
    '--surface3': 'surface3',
    '--accent': 'accent',
    '--accent2': 'accent2',
    '--accent3': 'amber',
    '--accent4': 'green',
    '--accent5': 'error',
    '--text': 'text',
    '--text2': 'text2',
    '--text3': 'text3',
    '--border': 'border'
  };
  
  // Apply each saved color
  Object.entries(state.colors).forEach(([cssVar, value]) => {
    document.documentElement.style.setProperty(cssVar, value);
    const id = hexIds[cssVar];
    if (id) {
      const i = document.getElementById('clr-' + id);
      if (i) i.value = value;
      const h = document.getElementById('hex-' + id);
      if (h) h.textContent = value;
    }
  });
  
  // Detect which theme is active (if it matches a predefined theme)
  detectActiveTheme();
}

// CSS Variable Management
function setCSSVar(name, val, inp) {
  document.documentElement.style.setProperty(name, val);
  const hexMap = {
    '--bg': 'bg',
    '--surface': 'surface',
    '--surface2': 'surface2',
    '--surface3': 'surface3',
    '--accent': 'accent',
    '--accent2': 'accent2',
    '--accent3': 'amber',
    '--accent4': 'green',
    '--accent5': 'error',
    '--text': 'text',
    '--text2': 'text2',
    '--text3': 'text3',
    '--border': 'border'
  };
  const id = hexMap[name];
  if (id) {
    const h = document.getElementById('hex-' + id);
    if (h) h.textContent = val;
  }
  // Save to state
  state.colors[name] = val;
  saveState();
}

function resetColors() {
  applyTheme('default');
}

function applyTheme(t) {
  // Theme definitions (matching database theme_colors table)
  const themes = {
    default: {
      bg: '#0a0e1a', surface: '#111827', surface2: '#1a2236', surface3: '#202d42',
      accent: '#00d4ff', accent2: '#7c3aed', accent3: '#f59e0b', accent4: '#10b981', accent5: '#ef4444',
      text: '#e2e8f0', text2: '#94a3b8', text3: '#64748b', border: '#2a3a55'
    },
    midnight: {
      bg: '#000000', surface: '#0d0d0d', surface2: '#1a1a1a', surface3: '#262626',
      accent: '#ffffff', accent2: '#555555', accent3: '#888888', accent4: '#aaaaaa', accent5: '#ff4444',
      text: '#dddddd', text2: '#999999', text3: '#666666', border: '#333333'
    },
    forest: {
      bg: '#0d1a0f', surface: '#122316', surface2: '#1a2e1f', surface3: '#223928',
      accent: '#22c55e', accent2: '#15803d', accent3: '#a3e635', accent4: '#86efac', accent5: '#ff5555',
      text: '#dcfce7', text2: '#bbf7d0', text3: '#86efac', border: '#1e4d2b'
    },
    ocean: {
      bg: '#0a1628', surface: '#0f2040', surface2: '#152a58', surface3: '#1b3470',
      accent: '#38bdf8', accent2: '#0284c7', accent3: '#f0abfc', accent4: '#7dd3fc', accent5: '#ff6b9d',
      text: '#e0f2fe', text2: '#bae6fd', text3: '#7dd3fc', border: '#1e3a8a'
    },
    crimson: {
      bg: '#1a0a0a', surface: '#271010', surface2: '#341616', surface3: '#411c1c',
      accent: '#ef4444', accent2: '#b91c1c', accent3: '#fbbf24', accent4: '#fca5a5', accent5: '#dc2626',
      text: '#fee2e2', text2: '#fecaca', text3: '#fca5a5', border: '#7f1d1d'
    },
    light: {
      bg: '#f8fafc', surface: '#ffffff', surface2: '#f1f5f9', surface3: '#e2e8f0',
      accent: '#3b82f6', accent2: '#7c3aed', accent3: '#d97706', accent4: '#059669', accent5: '#dc2626',
      text: '#1e293b', text2: '#475569', text3: '#94a3b8', border: '#cbd5e1'
    }
  };
  const th = themes[t];
  if (!th) return;
  
  const map = {
    bg: '--bg', surface: '--surface', surface2: '--surface2', surface3: '--surface3',
    accent: '--accent', accent2: '--accent2', accent3: '--accent3', accent4: '--accent4', accent5: '--accent5',
    text: '--text', text2: '--text2', text3: '--text3', border: '--border'
  };
  
  const hexIds = {
    bg: 'bg', surface: 'surface', surface2: 'surface2', surface3: 'surface3',
    accent: 'accent', accent2: 'accent2', accent3: 'amber', accent4: 'green', accent5: 'error',
    text: 'text', text2: 'text2', text3: 'text3', border: 'border'
  };
  
  // Apply theme colors to CSS and form inputs
  Object.entries(map).forEach(([tk, cssVar]) => {
    const v = th[tk];
    if (!v) return;
    document.documentElement.style.setProperty(cssVar, v);
    const id = hexIds[tk];
    if (id) {
      const i = document.getElementById('clr-' + id);
      if (i) i.value = v;
      const h = document.getElementById('hex-' + id);
      if (h) h.textContent = v;
    }
  });
  
  // Save all colors to state (will be saved to database as 'current' theme)
  Object.entries(map).forEach(([tk, cssVar]) => {
    const v = th[tk];
    if (v) state.colors[cssVar] = v;
  });
  
  // Update theme selector
  const selector = document.getElementById('themeSelector');
  if (selector) selector.value = t;
  
  saveState();
  toast(`Theme applied: ${t.charAt(0).toUpperCase() + t.slice(1)}`, 'success');
}

// Save current custom theme
function saveCurrentTheme() {
  // Colors are already in state.colors from setCSSVar calls
  saveState();
  toast('Custom theme saved to database', 'success');
}

// Detect which theme is currently active
function detectActiveTheme() {
  const themes = {
    default: {
      bg: '#0a0e1a', surface: '#111827', surface2: '#1a2236', surface3: '#202d42',
      accent: '#00d4ff', accent2: '#7c3aed', accent3: '#f59e0b', accent4: '#10b981', accent5: '#ef4444',
      text: '#e2e8f0', text2: '#94a3b8', text3: '#64748b', border: '#2a3a55'
    },
    midnight: {
      bg: '#000000', surface: '#0d0d0d', surface2: '#1a1a1a', surface3: '#262626',
      accent: '#ffffff', accent2: '#555555', accent3: '#888888', accent4: '#aaaaaa', accent5: '#ff4444',
      text: '#dddddd', text2: '#999999', text3: '#666666', border: '#333333'
    },
    forest: {
      bg: '#0d1a0f', surface: '#122316', surface2: '#1a2e1f', surface3: '#223928',
      accent: '#22c55e', accent2: '#15803d', accent3: '#a3e635', accent4: '#86efac', accent5: '#ff5555',
      text: '#dcfce7', text2: '#bbf7d0', text3: '#86efac', border: '#1e4d2b'
    },
    ocean: {
      bg: '#0a1628', surface: '#0f2040', surface2: '#152a58', surface3: '#1b3470',
      accent: '#38bdf8', accent2: '#0284c7', accent3: '#f0abfc', accent4: '#7dd3fc', accent5: '#ff6b9d',
      text: '#e0f2fe', text2: '#bae6fd', text3: '#7dd3fc', border: '#1e3a8a'
    },
    crimson: {
      bg: '#1a0a0a', surface: '#271010', surface2: '#341616', surface3: '#411c1c',
      accent: '#ef4444', accent2: '#b91c1c', accent3: '#fbbf24', accent4: '#fca5a5', accent5: '#dc2626',
      text: '#fee2e2', text2: '#fecaca', text3: '#fca5a5', border: '#7f1d1d'
    },
    light: {
      bg: '#f8fafc', surface: '#ffffff', surface2: '#f1f5f9', surface3: '#e2e8f0',
      accent: '#3b82f6', accent2: '#7c3aed', accent3: '#d97706', accent4: '#059669', accent5: '#dc2626',
      text: '#1e293b', text2: '#475569', text3: '#94a3b8', border: '#cbd5e1'
    }
  };
  
  const map = {
    bg: '--bg', surface: '--surface', surface2: '--surface2', surface3: '--surface3',
    accent: '--accent', accent2: '--accent2', accent3: '--accent3', accent4: '--accent4', accent5: '--accent5',
    text: '--text', text2: '--text2', text3: '--text3', border: '--border'
  };
  
  // Check if current colors match any predefined theme
  for (const [themeName, themeColors] of Object.entries(themes)) {
    let matches = true;
    for (const [key, cssVar] of Object.entries(map)) {
      const expectedColor = themeColors[key];
      const actualColor = state.colors[cssVar];
      if (expectedColor && actualColor && expectedColor.toLowerCase() !== actualColor.toLowerCase()) {
        matches = false;
        break;
      }
    }
    if (matches) {
      // Found matching theme
      const selector = document.getElementById('themeSelector');
      if (selector) selector.value = themeName;
      return;
    }
  }
  
  // No match found - custom theme
  const selector = document.getElementById('themeSelector');
  if (selector) selector.value = 'default'; // Default fallback
}

// Picklist Management
function renderPicklistTags() {
  renderTags('jiraStatuses', 'jiraStatusTags');
  renderTags('devopsStatuses', 'devopsStatusTags');
  renderTags('devopsOrgs', 'devopsOrgTags');
}

function renderTags(key, domId) {
  const el = document.getElementById(domId);
  if (!el) return;
  el.innerHTML = state[key].map((s, i) => '<div class="tag">' + s + '<span class="tag-remove" onclick="removePicklistItem(\'' + key + '\',\'' + domId + '\',' + i + ')">&#215;</span></div>').join('');
}

function addPicklistItem(key, domId, inputId) {
  const v = document.getElementById(inputId).value;
  if (!v) {
    toast('Enter a value', 'error');
    return;
  }
  if (state[key].includes(v)) {
    toast('Already exists', 'error');
    return;
  }
  state[key].push(v);
  document.getElementById(inputId).value = '';
  renderTags(key, domId);
  populateSelectsFromState();
  saveState();
  toast('Added: ' + v, 'success');
}

function removePicklistItem(key, domId, idx) {
  state[key].splice(idx, 1);
  renderTags(key, domId);
  populateSelectsFromState();
  saveState();
}

// Column Visibility
function renderColumnToggles() {
  const allC = [...state.columns, ...state.customColumns.map(c => ({key: 'cc_' + c.key, label: c.label, visible: c.visible !== false, order: c.order || 999, isCustom: true}))];  
  // Sort by order property
  allC.sort((a, b) => (a.order || 999) - (b.order || 999));
  
  const html = `
    <div style="font-size:11px;color:var(--text3);margin-bottom:10px;line-height:1.4;">
      📋 Drag to reorder, toggle visibility, or delete custom columns
    </div>
    <div class="columns-scroll-container">
      ${allC.map((c, idx) => {
        const isDeletable = c.isCustom;
        const isFirst = idx === 0;
        const isLast = idx === allC.length - 1;
        
        return `
          <div class="column-item-compact" draggable="true" ondragstart="dragStartCol(event,'${c.key}')" ondragover="dragOverCol(event)" ondrop="dragDropCol(event,'${c.key}')">
            <div class="column-move-btns">
              <button class="column-move-btn" onclick="moveColumnUp('${c.key}')" ${isFirst ? 'disabled' : ''}>▲</button>
              <button class="column-move-btn" onclick="moveColumnDown('${c.key}')" ${isLast ? 'disabled' : ''}>▼</button>
            </div>
            <span class="column-name">${c.label}</span>
            <div class="column-controls">
              <label class="column-visibility-toggle">
                <input type="checkbox" id="col-vis-${c.key}" name="col-vis-${c.key}" ${c.visible ? 'checked' : ''} onchange="toggleColumn('${c.key}',this.checked)">
                <span>Show</span>
              </label>
              ${isDeletable ? `<button class="column-delete-btn" onclick="deleteColumn('${c.key}')">✕</button>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  document.getElementById('columnToggles').innerHTML = html;
}

function moveColumnUp(key) {
  // Get all columns with their state references
  const allCols = [
    ...state.columns.map(c => ({key: c.key, label: c.label, order: c.order || 0, visible: c.visible, isCustom: false, ref: c})),
    ...state.customColumns.map(c => ({key: 'cc_' + c.key, label: c.label, order: c.order || 0, visible: c.visible, isCustom: true, ref: c}))
  ];
  
  // Sort by order
  allCols.sort((a, b) => a.order - b.order);
  
  // Find current column index in sorted array
  const currentIdx = allCols.findIndex(c => c.key === key);
  if (currentIdx <= 0) return; // Already at top or not found
  
  // Swap positions in array
  const temp = allCols[currentIdx];
  allCols[currentIdx] = allCols[currentIdx - 1];
  allCols[currentIdx - 1] = temp;
  
  // Reassign order values based on new positions
  allCols.forEach((col, idx) => {
    col.ref.order = idx + 1;
  });
  
  // Save and re-render
  saveState();
  renderColumnToggles();
  renderFormGrid();
  renderTable();
  toast('Column moved up', 'info');
}

function moveColumnDown(key) {
  // Get all columns with their state references
  const allCols = [
    ...state.columns.map(c => ({key: c.key, label: c.label, order: c.order || 0, visible: c.visible, isCustom: false, ref: c})),
    ...state.customColumns.map(c => ({key: 'cc_' + c.key, label: c.label, order: c.order || 0, visible: c.visible, isCustom: true, ref: c}))
  ];
  
  // Sort by order
  allCols.sort((a, b) => a.order - b.order);
  
  // Find current column index in sorted array
  const currentIdx = allCols.findIndex(c => c.key === key);
  if (currentIdx < 0 || currentIdx >= allCols.length - 1) return; // Already at bottom or not found
  
  // Swap positions in array
  const temp = allCols[currentIdx];
  allCols[currentIdx] = allCols[currentIdx + 1];
  allCols[currentIdx + 1] = temp;
  
  // Reassign order values based on new positions
  allCols.forEach((col, idx) => {
    col.ref.order = idx + 1;
  });
  
  // Save and re-render
  saveState();  
  renderColumnToggles();
  renderFormGrid();
  renderTable();
  toast('Column moved down', 'info');
}

// Drag and drop functions for column reordering
let draggedColumnKey = null;

function dragStartCol(event, key) {
  draggedColumnKey = key;
  event.dataTransfer.effectAllowed = 'move';
  event.target.style.opacity = '0.5';
}

function dragOverCol(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  return false;
}

function dragDropCol(event, targetKey) {
  event.preventDefault();
  event.stopPropagation();
  
  if (!draggedColumnKey || draggedColumnKey === targetKey) {
    draggedColumnKey = null;
    return false;
  }
  
  // Get all columns with their state references
  const allCols = [
    ...state.columns.map(c => ({key: c.key, label: c.label, order: c.order || 0, visible: c.visible, isCustom: false, ref: c})),
    ...state.customColumns.map(c => ({key: 'cc_' + c.key, label: c.label, order: c.order || 0, visible: c.visible, isCustom: true, ref: c}))
  ];
  
  // Sort by order
  allCols.sort((a, b) => a.order - b.order);
  
  // Find indices
  const draggedIdx = allCols.findIndex(c => c.key === draggedColumnKey);
  const targetIdx = allCols.findIndex(c => c.key === targetKey);
  
  if (draggedIdx < 0 || targetIdx < 0) {
    draggedColumnKey = null;
    return false;
  }
  
  // Remove dragged item and insert at target position
  const [draggedItem] = allCols.splice(draggedIdx, 1);
  allCols.splice(targetIdx, 0, draggedItem);
  
  // Reassign order values based on new positions
  allCols.forEach((col, idx) => {
    col.ref.order = idx + 1;
  });
  
  // Reset opacity
  const draggedEl = event.target;
  draggedEl.style.opacity = '1';
  
  // Save and re-render
  saveState();
  renderColumnToggles();
  renderFormGrid();
  renderTable();
  toast('Column reordered', 'info');
  
  draggedColumnKey = null;
  return false;
}

function toggleColumn(key, val) {
  const sc = state.columns.find(c => c.key === key);
  if (sc) sc.visible = val;
  const cc = state.customColumns.find(c => 'cc_' + c.key === key);
  if (cc) cc.visible = val;
  saveState();
  renderFormGrid();
  renderTable();
  toast(val ? 'Column shown' : 'Column hidden', 'info');
}

function deleteColumn(key) {
  const idx = state.customColumns.findIndex(c => 'cc_' + c.key === key);
  if (idx !== -1) {
    if (confirm('Delete column "' + state.customColumns[idx].label + '"?')) {
      state.customColumns.splice(idx, 1);
      renderCustomColList();
      renderColumnToggles();
      renderCustomFormFields();
      renderFormGrid();
      saveState();
      renderTable();
      toast('Column deleted', 'success');
    }
  }
}

// Custom Columns
function onColumnTypeChange(type) {
  const el = document.getElementById('customColumnSettings');
  if (!el) return;
  
  if (type === 'select') {
    el.innerHTML = `
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-top:12px;">
        <div style="font-size:12px;font-weight:600;color:var(--accent);margin-bottom:10px;">Dropdown Options</div>
        <div id="newColDropdownOptions" style="display:flex;flex-direction:column;gap:7px;"></div>
        <div style="display:flex;gap:7px;margin-top:10px;">
          <label for="newColDropdownValue" style="display:none;">New Dropdown Option</label>
          <input type="text" id="newColDropdownValue" name="newColDropdownValue" placeholder="Add option..." style="flex:1;">
          <button class="btn btn-secondary btn-sm" onclick="addDropdownOption()">+ Add</button>
        </div>
      </div>
    `;
  } else {
    el.innerHTML = '';
  }
}

function addDropdownOption() {
  const input = document.getElementById('newColDropdownValue');
  if (!input) return;
  const val = input.value.trim();
  if (!val) {
    toast('Enter option value', 'error');
    return;
  }
  
  const container = document.getElementById('newColDropdownOptions');
  if (!container) return;
  
  // Check for duplicates
  const existing = [...container.querySelectorAll('.col-item')].map(el => el.textContent.trim().slice(0, -1));
  if (existing.includes(val)) {
    toast('Option already exists', 'error');
    return;
  }
  
  const item = document.createElement('div');
  item.className = 'col-item';
  item.style.display = 'flex';
  item.style.alignItems = 'center';
  item.style.justifyContent = 'space-between';
  item.style.padding = '8px 10px';
  item.style.background = 'var(--surface2)';
  item.style.border = '1px solid var(--border)';
  item.style.borderRadius = 'var(--radius-sm)';
  
  const span = document.createElement('span');
  span.className = 'col-item-name';
  span.textContent = val;
  
  const removeBtn = document.createElement('span');
  removeBtn.className = 'tag-remove';
  removeBtn.textContent = '×';
  removeBtn.style.cursor = 'pointer';
  removeBtn.onclick = () => item.remove();
  
  item.appendChild(span);
  item.appendChild(removeBtn);
  container.appendChild(item);
  
  input.value = '';
}

function addCustomColumn() {
  const name = document.getElementById('newColName').value.trim();
  const type = document.getElementById('newColType').value;
  if (!name) {
    toast('Enter column name', 'error');
    return;
  }
  const key = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (state.customColumns.find(c => c.key === key)) {
    toast('Already exists', 'error');
    return;
  }
  
  let options = [];
  
  // Handle dropdown options
  if (type === 'select') {
    const optEls = document.querySelectorAll('#newColDropdownOptions .col-item');
    if (!optEls.length) {
      toast('Add at least one dropdown option', 'error');
      return;
    }
    options = [...optEls].map(el => el.querySelector('.col-item-name').textContent.trim()).filter(Boolean);
    if (!options.length) {
      toast('Invalid dropdown options', 'error');
      return;
    }
  }
  
  // Calculate next order number (max of all columns + 1)
  const maxOrder = Math.max(
    ...state.columns.map(c => c.order || 0),
    ...state.customColumns.map(c => c.order || 0),
    0
  );
  
  state.customColumns.push({key, label: name, type, options, visible: true, order: maxOrder + 1});
  document.getElementById('newColName').value = '';
  document.getElementById('newColType').value = 'text';
  document.getElementById('customColumnSettings').innerHTML = '';
  renderCustomColList();
  renderColumnToggles();
  renderCustomFormFields();
  renderFormGrid();
  saveState();
  toast('Column added: ' + name, 'success');
}

function removeCustomCol(idx) {
  state.customColumns.splice(idx, 1);
  renderCustomColList();
  renderColumnToggles();
  renderCustomFormFields();
  saveState();
  renderTable();
}

function renderCustomColList() {
  const el = document.getElementById('customColList');
  if (!el) return;
  
  const typeLabels = {
    'text': 'Text',
    'longtext': 'Long Text',
    'date': 'Date',
    'number': 'Number',
    'url': 'URL',
    'email': 'Email',
    'select': 'Dropdown'
  };
  
  if (state.customColumns.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text3);text-align:center;padding:20px;background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-sm);">No custom columns yet. Add one above!</div>';
    return;
  }
  
  const html = `
    <div style="font-size:11px;color:var(--text3);margin-bottom:8px;">
      ${state.customColumns.length} custom column(s) • Click ✕ to delete
    </div>
    <div class="columns-scroll-container" style="max-height:300px;">
      ${state.customColumns.map((c, i) => {
        const typeLabel = typeLabels[c.type] || c.type;
        return `
          <div class="column-item-compact">
            <span class="column-name">${c.label}</span>
            <span class="column-type">${typeLabel}</span>
            <button class="column-delete-btn" onclick="removeCustomCol(${i})" title="Delete column">✕</button>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  el.innerHTML = html;
}

function renderCustomFormFields() {
  const el = document.getElementById('customFormFields');
  if (!el) return;
  el.innerHTML = state.customColumns.map(c => '<div class="form-group"><label for="f-cc-' + c.key + '">' + c.label + '</label><input type="text" id="f-cc-' + c.key + '" name="f-cc-' + c.key + '" placeholder="' + c.label + '..."></div>').join('');
}

function renderTagsFormField() {
  const tagsField = document.getElementById('tagsFormField');
  if (!tagsField) return;
  
  let html = '<div style="grid-column:1/-1;margin:20px 0;padding:0;background:transparent;border:none;">';
  html += '<div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:14px;display:flex;align-items:center;gap:8px;">';
  html += '<span style="font-size:18px;">🏷️</span>';
  html += '<span>Select Tags</span>';
  html += '<span style="font-size:11px;font-weight:400;color    :var(--text3);margin-left:auto;">(Click to toggle)</span>';
  html += '</div>';
  html += '<div class="tags-selection-grid" style="width:100%;">';
  
  state.tags.forEach((tagObj, idx) => {
    const tagName = tagObj.name || tagObj;
    const color = tagObj.color || '#94a3b8';
    const tagId = 'tag-form-' + tagName.toLowerCase().replace(/\\s+/g, '-') + '-' + idx;
    const colorRgb = hexToRgb(color);
    const bgColor = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.15)`;
    const borderColor = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.4)`;
    const shadowColor = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.3)`;
    
    html += `<label class="tag-checkbox-item" for="${tagId}" data-color="${color}" `;
    html += `style="background:${bgColor};border-color:${borderColor};" `;
    html += `onmouseover="this.style.boxShadow='0 4px 12px ${shadowColor}'" `;
    html += `onmouseout="this.style.boxShadow=''">`;
    html += `<input type="checkbox" id="${tagId}" name="${tagId}" value="${esc(tagName)}" onchange="updateFormTags()">`;
    html += `<span class="tag-checkbox-label" style="color:${color};">${esc(tagName)}</span>`;
    html += `</label>`;
  });
  
  html += '</div></div>';
  tagsField.innerHTML = html;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {r: 148, g: 163, b: 184};
}

// Hyperlink Settings
function loadHyperlinkSettings() {
  sv('jiraUrlTemplate', state.jiraUrlTemplate);
  sv('jiraDisplayFormat', state.jiraDisplayFormat);
  sv('wiUrlTemplate', state.wiUrlTemplate);
  sv('wiDisplayFormat', state.wiDisplayFormat);
}

function saveHyperlinkSettings() {
  state.jiraUrlTemplate = gv('jiraUrlTemplate');
  state.jiraDisplayFormat = gv('jiraDisplayFormat');
  state.wiUrlTemplate = gv('wiUrlTemplate');
  state.wiDisplayFormat = gv('wiDisplayFormat');
  saveState();
  renderTable();
  toast('Hyperlink settings saved', 'success');
}
// Branding & Labels
function loadBrandingLabels() {
  if (!state.labels) state.labels = {};
  const l = state.labels;
  
  sv('lbl-pageTitle', l.pageTitle || 'Sprint Tracker Pro — TBCRM3');
  sv('lbl-logoText', l.logoText || 'Sprint');
  sv('lbl-logoTextHighlight', l.logoTextHighlight || 'Track');
  sv('lbl-logoTextEnd', l.logoTextEnd || 'Pro');
  sv('lbl-headerMeta', l.headerMeta || 'TBCRM3 · Salesforce Vlocity Project');
  sv('lbl-appName', l.appName || 'Sprint Track Pro');
}

// Tab Labels Management
function loadTabLabels() {
  if (!state.labels) state.labels = {};
  const l = state.labels;
  
  sv('lbl-tabDashboard', l.tabDashboard || '📊 Dashboard');
  sv('lbl-tabDataEntry', l.tabDataEntry || '📋 Data Entry');
  sv('lbl-tabSummary', l.tabSummary || '📈 Detailed Summary');
  sv('lbl-tabNotes', l.tabNotes || '📝 Notes');
  sv('lbl-tabSprintCalendar', l.tabSprintCalendar || '📅 Sprint Calendar');
  sv('lbl-tabJira', l.tabJira || '🔗 JIRA');
  sv('lbl-tabConfig', l.tabConfig || '⚙️ Configuration');
}

function saveTabLabels() {
  if (!state.labels) state.labels = {};
  
  // Save to state first - allow empty strings
  state.labels.tabDashboard = gv('lbl-tabDashboard');
  state.labels.tabDataEntry = gv('lbl-tabDataEntry');
  state.labels.tabSummary = gv('lbl-tabSummary');
  state.labels.tabNotes = gv('lbl-tabNotes');
  state.labels.tabSprintCalendar = gv('lbl-tabSprintCalendar');
  state.labels.tabJira = gv('lbl-tabJira');
  state.labels.tabConfig = gv('lbl-tabConfig');
  
  // Save to database and localStorage
  saveState();
  
  // Then update UI
  setTimeout(() => {
    applyTabLabels();
    loadTabLabels(); // Reload values into form fields
    toast('Tab labels saved', 'success');
  }, 100);
}

function applyTabLabels() {
  if (!state.labels) return;
  const l = state.labels;
  
  const defaultLabels = ['📊 Dashboard', '📋 Data Entry', '📈 Detailed Summary', '📝 Notes', '📅 Sprint Calendar', '🔗 JIRA', '⚙️ Configuration'];
  
  // Update tab elements
  const tab0 = document.getElementById('tab0');
  const tab1 = document.getElementById('tab1');
  const tab2 = document.getElementById('tab2');
  const tab3 = document.getElementById('tab3');
  const tab4 = document.getElementById('tab4');
  const tab5 = document.getElementById('tab5');
  const tab6 = document.getElementById('tab6');
  
  if (tab0) tab0.innerHTML = formatTabLabel(l.tabDashboard !== undefined ? l.tabDashboard : defaultLabels[0]);
  if (tab1) tab1.innerHTML = formatTabLabel(l.tabDataEntry !== undefined ? l.tabDataEntry : defaultLabels[1]);
  if (tab2) tab2.innerHTML = formatTabLabel(l.tabSummary !== undefined ? l.tabSummary : defaultLabels[2]);
  if (tab3) tab3.innerHTML = formatTabLabel(l.tabNotes !== undefined ? l.tabNotes : defaultLabels[3]);
  if (tab4) tab4.innerHTML = formatTabLabel(l.tabSprintCalendar !== undefined ? l.tabSprintCalendar : defaultLabels[4]);
  if (tab5) tab5.innerHTML = formatTabLabel(l.tabJira !== undefined ? l.tabJira : defaultLabels[5]);
  if (tab6) tab6.innerHTML = formatTabLabel(l.tabConfig !== undefined ? l.tabConfig : defaultLabels[6]);
}

function formatTabLabel(label) {
  // Handle empty string
  if (!label) return '';
  // Extract emoji and text from label like "📊 Dashboard"
  const match = label.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])\s*(.+)$/u);
  if (match) {
    return `<span>${match[1]}</span>${match[2]}`;
  }
  // If no emoji found, return as-is
  return label;
}

function updateTabLabel(index, value) {
  const tabIds = ['tab0', 'tab1', 'tab2', 'tab4', 'tab3']; // Note: tabs 3 and 4 are swapped in state order
  const defaultLabels = ['📊 Dashboard', '📋 Data Entry', '📈 Detailed Summary', '⚙️ Configuration', '📝 Notes'];
  
  const tab = document.getElementById(tabIds[index]);
  if (tab) {
    const label = value || defaultLabels[index];
    tab.innerHTML = formatTabLabel(label);
  }
}

function saveBrandingLabels() {
  if (!state.labels) state.labels = {};
  
  // Save values directly - allow empty strings
  state.labels.pageTitle = gv('lbl-pageTitle');
  state.labels.logoText = gv('lbl-logoText');
  state.labels.logoTextHighlight = gv('lbl-logoTextHighlight');
  state.labels.logoTextEnd = gv('lbl-logoTextEnd');
  state.labels.headerMeta = gv('lbl-headerMeta');
  state.labels.appName = gv('lbl-appName');
  
  // Save to database and localStorage
  saveState();
  
  // Then update UI
  setTimeout(() => {
    applyBrandingLabels();
    loadBrandingLabels(); // Reload values into form fields
    toast('Branding labels saved', 'success');
  }, 100);
}

function applyBrandingLabels() {
  if (!state.labels) return;
  const l = state.labels;
  
  // Update page title - use default only if undefined
  const pageTitle = l.pageTitle !== undefined ? l.pageTitle : 'Sprint Tracker Pro — TBCRM3';
  if (pageTitle) {
    document.title = pageTitle;
  }
  
  // Update logo text - handle the nested div structure, use defaults only if undefined
  const logoDiv = document.querySelector('.logo > div:nth-child(2)');
  if (logoDiv) {
    const logoText = (l.logoText !== undefined ? l.logoText : 'Sprint');
    const logoHighlight = (l.logoTextHighlight !== undefined ? l.logoTextHighlight : 'Track');
    const logoEnd = (l.logoTextEnd !== undefined ? l.logoTextEnd : 'Pro');
    const headerMeta = (l.headerMeta !== undefined ? l.headerMeta : 'TBCRM3 · Salesforce Vlocity Project');
    
    const logoHTML = logoText + (logoHighlight ? '<span>' + logoHighlight + '</span>' : '') + (logoEnd ? ' ' + logoEnd : '');
    
    logoDiv.innerHTML = 
      '<div class="logo-text">' + logoHTML + '</div>' +
      '<div class="header-meta">' + headerMeta + '</div>';
  }
}
// Font & Typography Management
function loadFontSettings() {
  if (!state.fontSettings) {
    state.fontSettings = {
      logoIcon: 'ST',
      fontFamily: 'DM Sans',
      baseFontSize: 13
    };
  }
  
  // Populate custom font dropdown from database
  const fontFamilyOptions = document.getElementById('fontFamilyOptions');
  const fontFamilyValue = document.getElementById('fontFamilyValue');
  const fontFamilyHidden = document.getElementById('fontFamily');
  
  if (fontFamilyOptions && state.fonts && Array.isArray(state.fonts)) {
    const currentValue = state.fontSettings.fontFamily || 'DM Sans';
    fontFamilyOptions.innerHTML = ''; // Clear existing options
    
    state.fonts.forEach(font => {
      const option = document.createElement('div');
      option.className = 'custom-dropdown-option';
      option.textContent = font.name;
      option.setAttribute('data-value', font.family);
      
      if (font.family === currentValue) {
        option.classList.add('selected');
        if (fontFamilyValue) fontFamilyValue.textContent = font.name;
        if (fontFamilyHidden) fontFamilyHidden.value = font.family;
      }
      
      option.onclick = function() {
        selectFontFamily(font.family, font.name);
      };
      
      fontFamilyOptions.appendChild(option);
    });
    
    // If current value not in database fonts, add it and select it
    if (!state.fonts.find(f => f.family === currentValue)) {
      const option = document.createElement('div');
      option.className = 'custom-dropdown-option selected';
      option.textContent = currentValue;
      option.setAttribute('data-value', currentValue);
      option.onclick = function() {
        selectFontFamily(currentValue, currentValue);
      };
      fontFamilyOptions.appendChild(option);
      
      if (fontFamilyValue) fontFamilyValue.textContent = currentValue;
      if (fontFamilyHidden) fontFamilyHidden.value = currentValue;
    }
  }
  
  sv('logoIcon', state.fontSettings.logoIcon || 'ST');
  sv('baseFontSize', state.fontSettings.baseFontSize || 13);
  
  applyFontSettings();
}

function toggleFontDropdown() {
  const dropdown = document.getElementById('fontFamilyDropdown');
  if (dropdown) {
    dropdown.classList.toggle('open');
  }
}

function selectFontFamily(family, name) {
  const fontFamilyValue = document.getElementById('fontFamilyValue');
  const fontFamilyHidden = document.getElementById('fontFamily');
  const fontFamilyOptions = document.getElementById('fontFamilyOptions');
  
  // Update display and hidden input
  if (fontFamilyValue) fontFamilyValue.textContent = name;
  if (fontFamilyHidden) fontFamilyHidden.value = family;
  
  // Update selected state
  if (fontFamilyOptions) {
    const options = fontFamilyOptions.querySelectorAll('.custom-dropdown-option');
    options.forEach(opt => {
      opt.classList.remove('selected');
      if (opt.getAttribute('data-value') === family) {
        opt.classList.add('selected');
      }
    });
  }
  
  // Close dropdown
  toggleFontDropdown();
}

function saveFontSettings() {
  if (!state.fontSettings) state.fontSettings = {};
  
  state.fontSettings.logoIcon = gv('logoIcon');
  state.fontSettings.fontFamily = gv('fontFamily');
  state.fontSettings.baseFontSize = parseInt(gv('baseFontSize')) || 13;
  
  saveState();
  
  setTimeout(() => {
    applyFontSettings();
    loadFontSettings();
    toast('Font settings saved', 'success');
  }, 100);
}

function applyFontSettings() {
  if (!state.fontSettings) return;
  const s = state.fontSettings;
  
  // Update logo icon
  const logoIconEl = document.querySelector('.logo-icon');
  if (logoIconEl && s.logoIcon) {
    logoIconEl.textContent = s.logoIcon;
  }
  
  // Update font family
  if (s.fontFamily) {
    document.body.style.fontFamily = `'${s.fontFamily}', sans-serif`;
  }
  
  // Update base font size
  if (s.baseFontSize) {
    document.body.style.fontSize = s.baseFontSize + 'px';
  }
}

function resetFontSettings() {
  if (!state.fontSettings) state.fontSettings = {};
  
  state.fontSettings.logoIcon = 'ST';
  state.fontSettings.fontFamily = 'DM Sans';
  state.fontSettings.baseFontSize = 13;
  
  saveState();
  
  setTimeout(() => {
    applyFontSettings();
    loadFontSettings();
    toast('Font settings reset to defaults', 'success');
  }, 100);
}

// Download Filename Management
function loadDownloadFilename() {
  if (!state.downloadFilename) {
    state.downloadFilename = 'sprint-tracker';
  }
  if (!state.timestampFormat) {
    state.timestampFormat = 'datetime';
  }
  sv('downloadFilename', state.downloadFilename);
  sv('timestampFormat', state.timestampFormat);
  updateTimestampPreview();
}

function saveDownloadFilename() {
  state.downloadFilename = gv('downloadFilename') || 'sprint-tracker';
  state.timestampFormat = gv('timestampFormat') || 'datetime';
  saveState();
  
  setTimeout(() => {
    loadDownloadFilename();
    toast('Download settings saved', 'success');
    // Refresh table to update timestamp display
    if (typeof renderTable === 'function') {
      renderTable();
    }
  }, 100);
}

function getFormattedTimestamp() {
  const now = new Date();
  const format = state.timestampFormat || 'datetime';
  
  // Get local time components
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  
  switch(format) {
    case 'datetime':
      // Format: 2026-02-21T14-30-45 (local time)
      return `${y}-${mo}-${d}T${h}-${min}-${s}`;
    case 'date':
      // Format: 2026-02-21 (local date)
      return `${y}-${mo}-${d}`;
    case 'datetime-underscore':
      // Format: 2026-02-21_14-30-45 (local time)
      return `${y}-${mo}-${d}_${h}-${min}-${s}`;
    case 'compact':
      // Format: 20260221-143045 (local time)
      return `${y}${mo}${d}-${h}${min}${s}`;
    case 'none':
      return '';
    default:
      return `${y}-${mo}-${d}T${h}-${min}-${s}`;
  }
}

function updateTimestampPreview() {
  const filename = gv('downloadFilename') || state.downloadFilename || 'sprint-tracker';
  const format = gv('timestampFormat') || state.timestampFormat || 'datetime';
  
  // Create a sample timestamp using LOCAL TIME
  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  
  let timestamp = '';
  
  switch(format) {
    case 'datetime':
      timestamp = `${y}-${mo}-${d}T${h}-${min}-${s}`;
      break;
    case 'date':
      timestamp = `${y}-${mo}-${d}`;
      break;
    case 'datetime-underscore':
      timestamp = `${y}-${mo}-${d}_${h}-${min}-${s}`;
      break;
    case 'compact':
      timestamp = `${y}${mo}${d}-${h}${min}${s}`;
      break;
    case 'none':
      timestamp = '';
      break;
  }
  
  const preview = timestamp ? `${filename}_${timestamp}.csv` : `${filename}.csv`;
  const previewEl = document.getElementById('timestampPreview');
  if (previewEl) {
    previewEl.innerHTML = `Preview: <strong style="color: var(--accent);">${preview}</strong>`;
  }
}

// ========================================
// IP Whitelist Management
// ========================================

// Load IP Whitelist settings and data
async function loadIPWhitelist() {
  try {
    // Get whitelist settings
    const settingsResponse = await fetch('Database/settings.api.php?action=getSetting&key=jira_ip_whitelist_enabled');
    const settingsData = await settingsResponse.json();
    const isEnabled = settingsData.success && settingsData.data && settingsData.data.setting_value === '1';
    
    // Update checkbox
    const checkbox = document.getElementById('ipWhitelistEnabled');
    if (checkbox) checkbox.checked = isEnabled;
    
    // Get current IP
    const ipResponse = await fetch('JIRA/config.api.php?action=getCurrentIP');
    const ipData = await ipResponse.json();
    const currentIP = ipData.success ? ipData.ip : 'Unknown';
    
    // Update status display
    const currentIPEl = document.getElementById('currentIPAddress');
    if (currentIPEl) {
      if (ipData.isLocalhost && ipData.publicIP) {
        currentIPEl.innerHTML = `${currentIP} <span style="font-size:11px;color:var(--text2);margin-left:8px;">(Public: ${ipData.publicIP})</span>`;
      } else {
        currentIPEl.textContent = currentIP;
      }
    }
    
    // Get whitelist
    const whitelistResponse = await fetch('Database/settings.api.php?action=getIPWhitelist');
    const whitelistData = await whitelistResponse.json();
    const whitelist = whitelistData.success ? whitelistData.data : [];
    
    // Update count
    const countEl = document.getElementById('whitelistCount');
    if (countEl) countEl.textContent = whitelist.length;
    
    // Check if current IP is whitelisted
    const isWhitelisted = whitelist.some(item => {
      if (item.ip_address.includes('*')) {
        const pattern = item.ip_address.replace(/\./g, '\\.').replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(currentIP);
      }
      return item.ip_address === currentIP;
    });
    
    // Update access status
    const statusEl = document.getElementById('accessStatus');
    if (statusEl) {
      if (!isEnabled || isWhitelisted || currentIP === '127.0.0.1' || currentIP === '::1') {
        statusEl.innerHTML = '<span style="color:var(--accent4);">✅ Allowed</span>';
      } else {
        statusEl.innerHTML = '<span style="color:var(--accent5);">⛔ Blocked</span>';
      }
    }
    
    // Render IP list
    renderIPWhitelist(whitelist, currentIP);
    
  } catch (error) {
    console.error('Error loading IP whitelist:', error);
    toast('Failed to load IP whitelist', 'error');
  }
}

// Render IP whitelist table
function renderIPWhitelist(whitelist, currentIP) {
  const container = document.getElementById('ipWhitelistContainer');
  if (!container) return;
  
  if (!whitelist || whitelist.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--text3);font-size:11px;">
        No IP addresses whitelisted yet. Add one below.
      </div>
    `;
    return;
  }
  
  container.innerHTML = whitelist.map(item => {
    const isCurrent = item.ip_address === currentIP;
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;background:${isCurrent ? 'rgba(0,212,255,0.1)' : 'var(--bg)'};border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:6px;">
        <div style="flex:1;">
          <div style="font-size:12px;color:var(--text);font-weight:600;font-family:monospace;">
            ${item.ip_address}
            ${isCurrent ? '<span style="font-size:10px;color:var(--accent);margin-left:8px;">← Your IP</span>' : ''}
          </div>
          <div style="font-size:9px;color:var(--text3);margin-top:2px;">
            ${item.description || 'No description'} • Added ${formatDate(item.created_at)}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <label style="display:flex;align-items:center;cursor:pointer;">
            <input type="checkbox" ${item.is_active ? 'checked' : ''} onchange="toggleIPActive(${item.id}, this.checked)" style="accent-color:var(--accent);cursor:pointer;">
          </label>
          <button class="btn btn-danger btn-sm" onclick="removeIPFromWhitelist(${item.id})" style="font-size:10px;padding:4px 8px;">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// Format date helper
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

// Toggle IP whitelist enabled/disabled
async function toggleIPWhitelist() {
  const checkbox = document.getElementById('ipWhitelistEnabled');
  const isEnabled = checkbox ? checkbox.checked : false;
  
  try {
    const response = await fetch('Database/settings.api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateSetting',
        key: 'jira_ip_whitelist_enabled',
        value: isEnabled ? '1' : '0'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      toast(`IP Whitelist ${isEnabled ? 'enabled' : 'disabled'}`, 'success');
      loadIPWhitelist(); // Refresh
    } else {
      throw new Error(result.error || 'Failed to update setting');
    }
  } catch (error) {
    console.error('Error toggling IP whitelist:', error);
    toast('Failed to update IP whitelist setting', 'error');
    if (checkbox) checkbox.checked = !isEnabled; // Revert
  }
}

// Add IP to whitelist
async function addIPToWhitelist() {
  const input = document.getElementById('newIPAddress');
  const ipAddress = input ? input.value.trim() : '';
  
  if (!ipAddress) {
    toast('Please enter an IP address', 'warning');
    return;
  }
  
  // Basic IP validation (supports wildcards)
  const ipPattern = /^(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)\.(\d{1,3}|\*)$/;
  if (!ipPattern.test(ipAddress)) {
    toast('Invalid IP address format. Use format like 192.168.1.100 or 192.168.1.*', 'error');
    return;
  }
  
  try {
    const response = await fetch('Database/settings.api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addIPToWhitelist',
        ip_address: ipAddress,
        description: 'Added from configuration'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      toast('IP address added to whitelist', 'success');
      if (input) input.value = '';
      loadIPWhitelist(); // Refresh
    } else {
      throw new Error(result.error || 'Failed to add IP');
    }
  } catch (error) {
    console.error('Error adding IP to whitelist:', error);
    toast(error.message || 'Failed to add IP to whitelist', 'error');
  }
}

// Remove IP from whitelist
async function removeIPFromWhitelist(id) {
  if (!confirm('Remove this IP address from the whitelist?')) {
    return;
  }
  
  try {
    const response = await fetch('Database/settings.api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'removeIPFromWhitelist',
        id: id
      })
    });
    
    const result = await response.json();
    if (result.success) {
      toast('IP address removed from whitelist', 'success');
      loadIPWhitelist(); // Refresh
    } else {
      throw new Error(result.error || 'Failed to remove IP');
    }
  } catch (error) {
    console.error('Error removing IP from whitelist:', error);
    toast('Failed to remove IP from whitelist', 'error');
  }
}

// Toggle IP active status
async function toggleIPActive(id, isActive) {
  try {
    const response = await fetch('Database/settings.api.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggleIPActive',
        id: id,
        is_active: isActive
      })
    });
    
    const result = await response.json();
    if (result.success) {
      toast(`IP ${isActive ? 'activated' : 'deactivated'}`, 'success');
      loadIPWhitelist(); // Refresh
    } else {
      throw new Error(result.error || 'Failed to toggle IP status');
    }
  } catch (error) {
    console.error('Error toggling IP status:', error);
    toast('Failed to update IP status', 'error');
    loadIPWhitelist(); // Refresh to revert checkbox
  }
}

