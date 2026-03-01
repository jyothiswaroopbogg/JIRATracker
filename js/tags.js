// Tags Management Functions

// Initialize default tags with colors
function initializeDefaultTags() {
  const defaultTags = [
    { name: 'Bug', color: '#f87171' },
    { name: 'Enhancement', color: '#60a5fa' },
    { name: 'Task', color: '#fbbf24' },
    { name: 'Story', color: '#34d399' }
  ];
  
  if (!state.tags || state.tags.length === 0) {
    state.tags = defaultTags;
  } else if (typeof state.tags[0] === 'string') {
    // Migrate old string tags to new object format
    state.tags = state.tags.map(tagName => ({
      name: tagName,
      color: getDefaultColorForTag(tagName)
    }));
  } else {
    // Merge default tags with existing tags from database
    // Ensure default tags always exist
    const existingTagNames = state.tags.map(t => t.name);
    let tagsAdded = false;
    defaultTags.forEach(defaultTag => {
      if (!existingTagNames.includes(defaultTag.name)) {
        state.tags.push(defaultTag);
        tagsAdded = true;
      }
    });
    
    // Save to database if we added default tags
    if (tagsAdded) {
      saveState();
    }
  }
  
  if (!state.recordTags) {
    state.recordTags = {};
  }
}

function getDefaultColorForTag(tagName) {
  const defaults = {
    'Bug': '#f87171',
    'Enhancement': '#60a5fa',
    'Task': '#fbbf24',
    'Story': '#34d399'
  };
  return defaults[tagName] || '#94a3b8';
}

// Render Tags Management Card
function renderTagsManagement() {
  const container = document.getElementById('tagsManagementContainer');
  if (!container) return;
  
  // Calculate usage count for each tag
  const tagUsage = {};
  if (state.recordTags) {
    Object.values(state.recordTags).forEach(tags => {
      if (Array.isArray(tags)) {
        tags.forEach(tagName => {
          tagUsage[tagName] = (tagUsage[tagName] || 0) + 1;
        });
      }
    });
  }
  
  let html = '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;line-height:1.4;">🏷️ Click color square to change, hover count to see usage</div>';
  
  if (state.tags && state.tags.length > 0) {
    html += '<div class="tags-management">';
    state.tags.forEach((tag, index) => {
      const tagName = tag.name || tag;
      const tagColor = tag.color || '#94a3b8';
      const usageCount = tagUsage[tagName] || 0;
      
      html += `
        <div class="tag-pill">
          <div class="tag-pill-color" 
               style="background:${tagColor};" 
               onclick="openTagColorPicker(${index})"
               title="Click to change color"></div>
          <span class="tag-pill-name">${esc(tagName)}</span>
          <span class="tag-pill-count" title="Used in ${usageCount} record(s)">${usageCount}</span>
          <button class="tag-pill-remove" onclick="removeTag(${index})" title="Remove tag">✕</button>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<div style="color:var(--text3);font-size:12px;padding:20px;text-align:center;background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-sm);">No tags yet. Add your first tag below!</div>';
  }
  
  container.innerHTML = html;
}

// Add New Tag
function addNewTag() {
  const nameInput = document.getElementById('newTagName');
  const colorInput = document.getElementById('newTagColor');
  
  if (!nameInput || !colorInput) return;
  
  const tagName = nameInput.value;
  const tagColor = colorInput.value;
  
  if (!tagName) {
    toast('Please enter a tag name', 'error');
    return;
  }
  
  // Check if tag already exists
  const exists = state.tags.some(tag => {
    const name = tag.name || tag;
    return name.toLowerCase() === tagName.toLowerCase();
  });
  
  if (exists) {
    toast('Tag already exists', 'error');
    return;
  }
  
  // Add new tag
  state.tags.push({ name: tagName, color: tagColor });
  
  // Clear inputs
  nameInput.value = '';
  colorInput.value = '#94a3b8';
  
  saveState();
  renderTagsManagement();
  renderTagsFormField();
  toast('Tag added: ' + tagName, 'success');
}

// Remove Tag
function removeTag(index) {
  if (index < 0 || index >= state.tags.length) return;
  
  const tag = state.tags[index];
  const tagName = tag.name || tag;
  
  if (!confirm(`Remove tag "${tagName}"? This will remove it from all records and notes.`)) {
    return;
  }
  
  // Remove tag from array
  state.tags.splice(index, 1);
  
  // Remove tag from all records
  Object.keys(state.recordTags).forEach(recordId => {
    state.recordTags[recordId] = state.recordTags[recordId].filter(t => t !== tagName);
  });
  
  // Remove tag from all notes
  state.notes.forEach(note => {
    if (note.noteTags) {
      note.noteTags = note.noteTags.filter(t => t !== tagName);
    }
  });
  
  saveState();
  renderTagsManagement();
  renderTagsFormField();
  renderTable();
  renderNotes();
  toast('Tag removed: ' + tagName, 'info');
}

// Open Tag Color Picker
function openTagColorPicker(index) {
  if (index < 0 || index >= state.tags.length) return;
  
  const tag = state.tags[index];
  const tagName = tag.name || tag;
  const currentColor = tag.color || '#94a3b8';
  
  const newColor = prompt(`Choose color for "${tagName}" (hex format):`, currentColor);
  
  if (newColor && /^#[0-9A-F]{6}$/i.test(newColor)) {
    if (typeof state.tags[index] === 'string') {
      state.tags[index] = { name: tagName, color: newColor };
    } else {
      state.tags[index].color = newColor;
    }
    
    saveState();
    renderTagsManagement();
    renderTagsFormField();
    renderTable();
    renderNotes();
    toast('Color updated', 'success');
  } else if (newColor) {
    toast('Invalid color format. Use hex format like #94a3b8', 'error');
  }
}

// Render Tags Field in Record Form - Compact Inline Style
function renderTagsFormField() {
  const tagsFieldContainer = document.getElementById('tagsFormField');
  if (!tagsFieldContainer) return;
  
  let html = '<div class="form-group span3" style="margin:0;">';
  html += '<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;display:flex;align-items:center;gap:6px;">';
  html += '<span style="font-size:14px;">🏷️</span>';
  html += '<span>Tags</span>';
  html += '</div>';
  html += '<div class="tags-selection-grid" style="justify-content:flex-start;">';
  
  if (state.tags && state.tags.length > 0) {
    state.tags.forEach((tag, idx) => {
      const tagName = tag.name || tag;
      const color = tag.color || '#94a3b8';
      const tagId = 'tag-form-' + tagName.toLowerCase().replace(/\s+/g, '-') + '-' + idx;
      
      html += `<label class="tag-checkbox-item" for="${tagId}" style="color:${color};border-color:${color};">`;
      html += `<input type="checkbox" id="${tagId}" name="${tagId}" value="${esc(tagName)}" style="accent-color:${color};">`;
      html += `<span class="tag-checkbox-label">${esc(tagName)}</span>`;
      html += `</label>`;
    });
  } else {
    html += '<div style="color:var(--text3);font-size:11px;padding:4px 0;">No tags available</div>';
  }
  
  html += '</div></div>';
  tagsFieldContainer.innerHTML = html;
}

// Render Tags Field in Edit Modal - Compact Inline Style
function renderTagsEditField(recordId) {
  const tagsFieldContainer = document.getElementById('tagsEditField');
  if (!tagsFieldContainer) return;
  
  const recordTags = state.recordTags[recordId] || [];
  
  let html = '<div class="form-group span3" style="margin:16px 0 0 0;">';
  html += '<div style="font-size:12px;font-weight:600;color:var(--text2);margin-bottom:8px;display:flex;align-items:center;gap:6px;">';
  html += '<span style="font-size:14px;">🏷️</span>';
  html += '<span>Tags</span>';
  html += '</div>';
  html += '<div class="tags-selection-grid" style="justify-content:flex-start;">';
  
  if (state.tags && state.tags.length > 0) {
    state.tags.forEach((tag, idx) => {
      const tagName = tag.name || tag;
      const color = tag.color || '#94a3b8';
      const isChecked = recordTags.includes(tagName);
      const tagId = 'tag-edit-' + tagName.toLowerCase().replace(/\s+/g, '-') + '-' + idx;
      
      html += `<label class="tag-checkbox-item" for="${tagId}" style="color:${color};border-color:${color};">`;
      html += `<input type="checkbox" id="${tagId}" name="${tagId}" value="${esc(tagName)}" ${isChecked ? 'checked' : ''} style="accent-color:${color};">`;
      html += `<span class="tag-checkbox-label">${esc(tagName)}</span>`;
      html += `</label>`;
    });
  }
  
  html += '</div></div>';
  tagsFieldContainer.innerHTML = html;
}

// Get Selected Tags from Form
function getSelectedTagsFromForm() {
  const tags = [];
  const checkboxes = document.querySelectorAll('[id^="tag-form-"]');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      tags.push(checkbox.value);
    }
  });
  return tags;
}

// Get Selected Tags from Edit Modal
function getSelectedTagsFromEdit() {
  const tags = [];
  const checkboxes = document.querySelectorAll('[id^="tag-edit-"]');
  checkboxes.forEach(checkbox => {
    if (checkbox.checked) {
      tags.push(checkbox.value);
    }
  });
  return tags;
}

// Save Record Tags
function saveRecordTags(recordId, tags) {
  if (!recordId) return;
  state.recordTags[recordId] = tags || [];
  saveState();
}

// Get Record Tags
function getRecordTags(recordId) {
  return state.recordTags[recordId] || [];
}

// Set Record Tags (for updates)
function setRecordTags(recordId, tags) {
  if (!recordId) return;
  state.recordTags[recordId] = tags || [];
}

// Render Tags in Table Cell
function renderRecordTags(recordId) {
  const tags = getRecordTags(recordId);
  
  if (!tags || tags.length === 0) {
    return '<span style="color:var(--text3);font-size:11px;">—</span>';
  }
  
  let html = '<div class="record-tags-container">';
  tags.forEach(tagName => {
    const tag = state.tags.find(t => (t.name || t) === tagName);
    const color = tag ? (tag.color || '#94a3b8') : '#94a3b8';
    
    const colorRgb = hexToRgb(color);
    const bgColor = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.2)`;
    const borderColor = color;
    
    html += `<span class="record-tag-badge" style="background:${bgColor};border-color:${borderColor};color:${color};">${esc(tagName)}</span>`;
  });
  html += '</div>';
  
  return html;
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {r: 148, g: 163, b: 184}; // Default gray
}

// Update notes tag rendering (already exists in notes.js, but ensure consistency)
function renderNoteTags(noteTags) {
  if (!noteTags || noteTags.length === 0) return '';
  
  let html = '<div class="note-tags-display">';
  noteTags.forEach(tagName => {
    const tag = state.tags.find(t => (t.name || t) === tagName);
    const color = tag ? (tag.color || '#94a3b8') : '#94a3b8';
    
    const colorRgb = hexToRgb(color);
    const bgColor = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.2)`;
    
    html += `<span class="note-tag-badge" style="background:${bgColor};border-color:${color};color:${color};">${esc(tagName)}</span>`;
  });
  html += '</div>';
  
  return html;
}
