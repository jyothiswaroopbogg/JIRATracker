// Sprint Colors Configuration Management

// Initialize default sprint colors
function initializeDefaultSprintColors() {
  if (!state.sprintCalendar) {
    state.sprintCalendar = {};
  }
  
  if (!state.sprintCalendar.sprintColors) {
    state.sprintCalendar.sprintColors = {};
  }
  
  // Default sprint colors from database (these will be loaded from sprint_colors table)
  const defaultSprintColors = {
    '1': '#8b5cf6',  // Purple
    '2': '#10b981',  // Green
    '3': '#f59e0b',  // Orange
    '4': '#3b82f6',  // Blue
    '5': '#ec4899',  // Pink
    '6': '#ef4444'   // Red
  };
  
  // Only add defaults if no colors exist at all
  if (Object.keys(state.sprintCalendar.sprintColors).length === 0) {
    state.sprintCalendar.sprintColors = defaultSprintColors;
  }
}

// Render Sprint Colors Management UI
function renderSprintColorsManagement() {
  const container = document.getElementById('sprintColorsManagementContainer');
  if (!container) return;
  
  initializeDefaultSprintColors();
  
  // Count usage of each sprint across records
  const sprintUsage = {};
  if (state.records && Array.isArray(state.records)) {
    state.records.forEach(record => {
      if (record.sprint_start) {
        const sprintName = record.sprint_start.trim();
        sprintUsage[sprintName] = (sprintUsage[sprintName] || 0) + 1;
      }
    });
  }
  
  // Check if sprints have dates defined
  const sprintDates = state.sprintCalendar?.sprintDates || {};
  
  let html = '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;line-height:1.4;">🎨 Click color square to change, hover count to see usage</div>';
  
  const sprintColors = state.sprintCalendar.sprintColors || {};
  const sprintNames = Object.keys(sprintColors).sort((a, b) => {
    // Sort numerically if both are numbers, otherwise alphabetically
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  });
  
  if (sprintNames.length > 0) {
    html += '<div class="tags-management">';
    sprintNames.forEach((sprintName) => {
      const sprintColor = sprintColors[sprintName];
      const usageCount = sprintUsage[sprintName] || 0;
      
      // Check if this sprint has dates defined
      const hasDates = Object.keys(sprintDates).some(key => {
        const [pi, sprint] = key.includes('|') ? key.split('|') : ['', key];
        return sprint === sprintName;
      });
      
      html += `
        <div class="tag-pill">
          <div class="tag-pill-color" 
               style="background:${sprintColor};" 
               onclick="openSprintColorPicker('${escapeHtml(sprintName)}')"
               title="Click to change color"></div>
          <span class="tag-pill-name">${escapeHtml(sprintName)}</span>
          <span class="tag-pill-count" title="Used in ${usageCount} record(s)${hasDates ? ' • Has dates defined' : ''}">${usageCount}${hasDates ? ' 📅' : ''}</span>
          <button class="tag-pill-remove" onclick="removeSprintColor('${escapeHtml(sprintName)}')" title="Remove sprint color">✕</button>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<div style="color:var(--text3);font-size:12px;padding:20px;text-align:center;background:var(--surface);border:1px dashed var(--border);border-radius:var(--radius-sm);">No sprint colors defined yet. Add your first sprint below!</div>';
  }
  
  container.innerHTML = html;
}

// Add New Sprint Color
function addNewSprintColor() {
  const nameInput = document.getElementById('newSprintName');
  const colorInput = document.getElementById('newSprintColor');
  
  if (!nameInput || !colorInput) return;
  
  const sprintName = nameInput.value.trim();
  const sprintColor = colorInput.value;
  
  if (!sprintName) {
    toast('Please enter a sprint name', 'error');
    return;
  }
  
  // Initialize if needed
  if (!state.sprintCalendar) {
    state.sprintCalendar = {};
  }
  if (!state.sprintCalendar.sprintColors) {
    state.sprintCalendar.sprintColors = {};
  }
  
  // Check if sprint already exists
  if (state.sprintCalendar.sprintColors[sprintName]) {
    toast(`Sprint "${sprintName}" already exists. Use the color picker to change its color.`, 'error');
    return;
  }
  
  // Add new sprint color
  state.sprintCalendar.sprintColors[sprintName] = sprintColor;
  
  // Clear inputs
  nameInput.value = '';
  colorInput.value = '#8b5cf6';
  
  saveState();
  renderSprintColorsManagement();
  
  // Update all tabs that might display sprint colors
  if (typeof renderSprintCalendarCard === 'function') {
    renderSprintCalendarCard();
  }
  if (typeof renderSprintProgressSection === 'function') {
    renderSprintProgressSection();
  }
  if (typeof renderTable === 'function') {
    renderTable();
  }
  
  toast(`Sprint color added: ${sprintName}`, 'success');
}

// Remove Sprint Color
function removeSprintColor(sprintName) {
  if (!state.sprintCalendar || !state.sprintCalendar.sprintColors) return;
  
  if (!confirm(`Remove color definition for Sprint "${sprintName}"?\n\nThis will remove the custom color, but will not delete sprint dates or records. The sprint will use a default color if used in records.`)) {
    return;
  }
  
  // Remove sprint color
  delete state.sprintCalendar.sprintColors[sprintName];
  
  saveState();
  renderSprintColorsManagement();
  
  // Update all tabs that might display sprint colors
  if (typeof renderSprintCalendarCard === 'function') {
    renderSprintCalendarCard();
  }
  if (typeof renderSprintProgressSection === 'function') {
    renderSprintProgressSection();
  }
  if (typeof renderTable === 'function') {
    renderTable();
  }
  
  toast(`Color removed for Sprint: ${sprintName}`, 'info');
}

// Open Sprint Color Picker (using HTML5 color input)
function openSprintColorPicker(sprintName) {
  if (!state.sprintCalendar || !state.sprintCalendar.sprintColors) return;
  
  const currentColor = state.sprintCalendar.sprintColors[sprintName];
  
  // Create a temporary color input to open the color picker
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = currentColor;
  colorInput.style.position = 'absolute';
  colorInput.style.opacity = '0';
  colorInput.style.pointerEvents = 'none';
  
  document.body.appendChild(colorInput);
  
  colorInput.addEventListener('change', function() {
    const newColor = colorInput.value;
    
    // Update the color
    state.sprintCalendar.sprintColors[sprintName] = newColor;
    
    saveState();
    renderSprintColorsManagement();
    
    // Update all tabs that might display sprint colors
    if (typeof renderSprintCalendarCard === 'function') {
      renderSprintCalendarCard();
    }
    if (typeof renderSprintProgressSection === 'function') {
      renderSprintProgressSection();
    }
    if (typeof renderTable === 'function') {
      renderTable();
    }
    
    toast(`Color updated for Sprint ${sprintName}`, 'success');
    
    // Cleanup
    document.body.removeChild(colorInput);
  });
  
  colorInput.addEventListener('blur', function() {
    // Cleanup if user closes without selecting
    setTimeout(() => {
      if (document.body.contains(colorInput)) {
        document.body.removeChild(colorInput);
      }
    }, 100);
  });
  
  // Trigger the color picker
  colorInput.click();
}

// Load Sprint Colors on Configuration Tab Load
function loadSprintColorsManagement() {
  initializeDefaultSprintColors();
  renderSprintColorsManagement();
}
