// Work Items Management - Multi-Work-Item Support

/**
 * Parse work items string to array
 * @param {string} str - Comma-separated work item numbers (e.g., "1,2,3")
 * @returns {Array<number>} Array of work item numbers
 */
function parseWorkItems(str) {
  if (!str || str.trim() === '') return [];
  return str.split(',')
    .map(s => s.trim())
    .filter(s => s !== '')
    .map(s => parseInt(s.replace(/\D/g, '')))
    .filter(n => !isNaN(n) && n > 0);
}

/**
 * Format work items array to string
 * @param {Array<number>} arr - Array of work item numbers
 * @returns {string} Comma-separated string
 */
function formatWorkItemsToString(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return '';
  return arr.filter(n => !isNaN(n) && n > 0).join(',');
}

/**
 * Render work items cell for table
 * @param {number} recordId - Record ID
 * @param {string} workItemsStr - Work items as comma-separated string
 * @param {string} columnKey - Column key (wi1 or wi2)
 * @returns {string} HTML for table cell
 */
function renderWorkItemsCell(recordId, workItemsStr, columnKey) {
  const workItems = parseWorkItems(workItemsStr);
  
  if (workItems.length === 0) {
    return `
      <td>
        <div class="work-items-container" id="wi-${columnKey}-${recordId}">
          <button class="btn-add-work-item" onclick="showAddWorkItemInput(${recordId}, '${columnKey}')" title="Add Work Item">➕</button>
        </div>
      </td>
    `;
  }
  
  const itemsHTML = workItems.map((num, index) => {
    const display = formatWISingle(num);
    const isLast = index === workItems.length - 1;
    const addButton = isLast ? '<button class="btn-add-work-item" onclick="showAddWorkItemInput(' + recordId + ', \'' + columnKey + '\')" title="Add Work Item">➕</button>' : '';
    return `
      <div class="work-item-entry">
        ${display}
        <button class="btn-remove-work-item" onclick="removeWorkItem(${recordId}, '${columnKey}', ${index})" title="Remove">➖</button>
        ${addButton}
      </div>
    `;
  }).join('');
  
  return `
    <td>
      <div class="work-items-container" id="wi-${columnKey}-${recordId}">
        ${itemsHTML}
      </div>
    </td>
  `;
}

/**
 * Format single work item number to link
 * @param {number} num - Work item number
 * @returns {string} HTML link
 */
function formatWISingle(num) {
  if (!num || isNaN(num)) return '';
  const n = parseInt(num);
  const p = String(n).padStart(6, '0');
  const display = state.wiDisplayFormat.replace('{number6}', p).replace('{number}', n);
  const url = state.wiUrlTemplate.replace('{formatted}', p).replace('{number}', n);
  return '<a class="wi-link" href="' + url + '" target="_blank">' + display + '</a>';
}

/**
 * Show input field to add new work item
 * @param {number} recordId - Record ID
 * @param {string} columnKey - Column key (wi1 or wi2)
 */
function showAddWorkItemInput(recordId, columnKey) {
  const container = document.getElementById(`wi-${columnKey}-${recordId}`);
  if (!container) return;
  
  // Check if input already exists
  if (container.querySelector('.work-item-input-container')) return;
  
  // Find the add button and hide it
  const addBtn = container.querySelector('.btn-add-work-item');
  if (addBtn) {
    addBtn.style.display = 'none';
  }
  
  // Create input container
  const inputHTML = `
    <div class="work-item-input-container" id="wi-input-${columnKey}-${recordId}">
      <input type="text" 
             class="work-item-input" 
             id="wi-input-field-${columnKey}-${recordId}"
             placeholder="Enter number" 
             oninput="onWorkItemInputChange(${recordId}, '${columnKey}')"
             onkeypress="onWorkItemInputKeyPress(event, ${recordId}, '${columnKey}')">
      <button class="btn-save-work-item" 
              id="wi-save-${columnKey}-${recordId}"
              onclick="saveWorkItem(${recordId}, '${columnKey}')" 
              disabled 
              title="Save">✔️</button>
      <button class="btn-cancel-work-item" 
              onclick="cancelAddWorkItem(${recordId}, '${columnKey}')" 
              title="Cancel">❌</button>
    </div>
  `;
  
  // Append to container
  container.insertAdjacentHTML('beforeend', inputHTML);
  
  // Focus the input
  setTimeout(() => {
    const inputField = document.getElementById(`wi-input-field-${columnKey}-${recordId}`);
    if (inputField) inputField.focus();
  }, 50);
}

/**
 * Handle input change to enable/disable save button
 * @param {number} recordId - Record ID
 * @param {string} columnKey - Column key
 */
function onWorkItemInputChange(recordId, columnKey) {
  const inputField = document.getElementById(`wi-input-field-${columnKey}-${recordId}`);
  const saveBtn = document.getElementById(`wi-save-${columnKey}-${recordId}`);
  
  if (!inputField || !saveBtn) return;
  
  const value = inputField.value.trim();
  const num = parseInt(value.replace(/\D/g, ''));
  
  // Enable save button only if valid number
  saveBtn.disabled = isNaN(num) || num <= 0;
}

/**
 * Handle Enter key press in input field
 * @param {KeyboardEvent} event - Keyboard event
 * @param {number} recordId - Record ID
 * @param {string} columnKey - Column key
 */
function onWorkItemInputKeyPress(event, recordId, columnKey) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const saveBtn = document.getElementById(`wi-save-${columnKey}-${recordId}`);
    if (saveBtn && !saveBtn.disabled) {
      saveWorkItem(recordId, columnKey);
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelAddWorkItem(recordId, columnKey);
  }
}

/**
 * Save new work item to record
 * @param {number} recordId - Record ID
 * @param {string} columnKey - Column key (wi1 or wi2)
 */
async function saveWorkItem(recordId, columnKey) {
  const inputField = document.getElementById(`wi-input-field-${columnKey}-${recordId}`);
  if (!inputField) return;
  
  const value = inputField.value.trim();
  const num = parseInt(value.replace(/\D/g, ''));
  
  if (isNaN(num) || num <= 0) {
    toast('Please enter a valid work item number', 'error');
    return;
  }
  
  // Find the record in state
  const record = state.records.find(r => r.id === recordId);
  if (!record) {
    toast('Record not found', 'error');
    return;
  }
  
  // Get existing work items
  const existingWorkItems = parseWorkItems(record[columnKey]);
  
  // Check for duplicates
  if (existingWorkItems.includes(num)) {
    toast('This work item already exists', 'warning');
    return;
  }
  
  // Add new work item
  existingWorkItems.push(num);
  
  // Update record
  record[columnKey] = formatWorkItemsToString(existingWorkItems);
  
  // Update modified timestamp
  if (typeof updateModifiedTimestamp === 'function') {
    updateModifiedTimestamp(record);
  }
  
  // Save to database
  try {
    await saveState();
    toast('Work item added', 'success');
    
    // Re-render the table to show the new work item
    renderTable();
  } catch (error) {
    console.error('Error saving work item:', error);
    toast('Failed to save work item', 'error');
  }
}

/**
 * Remove work item from record
 * @param {number} recordId - Record ID
 * @param {string} columnKey - Column key (wi1 or wi2)
 * @param {number} index - Index of work item to remove
 */
async function removeWorkItem(recordId, columnKey, index) {
  // Find the record in state
  const record = state.records.find(r => r.id === recordId);
  if (!record) {
    toast('Record not found', 'error');
    return;
  }
  
  // Get existing work items
  const existingWorkItems = parseWorkItems(record[columnKey]);
  
  if (index < 0 || index >= existingWorkItems.length) {
    toast('Invalid work item index', 'error');
    return;
  }
  
  // Remove work item
  existingWorkItems.splice(index, 1);
  
  // Update record
  record[columnKey] = formatWorkItemsToString(existingWorkItems);
  
  // Update modified timestamp
  if (typeof updateModifiedTimestamp === 'function') {
    updateModifiedTimestamp(record);
  }
  
  // Save to database
  try {
    await saveState();
    toast('Work item removed', 'info');
    
    // Re-render the table to show the updated list
    renderTable();
  } catch (error) {
    console.error('Error removing work item:', error);
    toast('Failed to remove work item', 'error');
  }
}

/**
 * Cancel adding work item
 * @param {number} recordId - Record ID
 * @param {string} columnKey - Column key
 */
function cancelAddWorkItem(recordId, columnKey) {
  const inputContainer = document.getElementById(`wi-input-${columnKey}-${recordId}`);
  const container = document.getElementById(`wi-${columnKey}-${recordId}`);
  const addBtn = container?.querySelector('.btn-add-work-item');
  
  if (inputContainer) {
    inputContainer.remove();
  }
  
  if (addBtn) {
    addBtn.style.display = '';
  }
}

/**
 * Render work items for edit modal
 * @param {string} workItemsStr - Work items as comma-separated string
 * @param {string} columnKey - Column key (wi1 or wi2)
 * @param {string} label - Label for the field
 * @returns {string} HTML for edit modal work items section
 */
function renderEditModalWorkItems(workItemsStr, columnKey, label) {
  const workItems = parseWorkItems(workItemsStr);
  
  const itemsHTML = workItems.map((num, index) => {
    const display = formatWISingle(num);
    return `
      <div class="edit-work-item-entry">
        ${display}
        <button class="btn-remove-edit-work-item" onclick="removeEditWorkItem('${columnKey}', ${index})" type="button" title="Remove">➖</button>
      </div>
    `;
  }).join('');
  
  return `
    <div class="form-group span2">
      <label>${label}</label>
      <div class="edit-work-items-container" id="edit-wi-${columnKey}">
        ${itemsHTML}
        <div class="edit-work-item-add-section">
          <input type="text" 
                 class="edit-work-item-input" 
                 id="edit-wi-input-${columnKey}"
                 placeholder="Enter number to add" 
                 oninput="onEditWorkItemInputChange('${columnKey}')">
          <button class="btn-add-edit-work-item" 
                  id="edit-wi-add-${columnKey}"
                  onclick="addEditWorkItem('${columnKey}')" 
                  type="button"
                  disabled 
                  title="Add Work Item">➕ Add</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle work item input change in edit modal
 * @param {string} columnKey - Column key
 */
function onEditWorkItemInputChange(columnKey) {
  const inputField = document.getElementById(`edit-wi-input-${columnKey}`);
  const addBtn = document.getElementById(`edit-wi-add-${columnKey}`);
  
  if (!inputField || !addBtn) return;
  
  const value = inputField.value.trim();
  const num = parseInt(value.replace(/\D/g, ''));
  
  // Enable add button only if valid number
  addBtn.disabled = isNaN(num) || num <= 0;
}

/**
 * Add work item in edit modal
 * @param {string} columnKey - Column key (wi1 or wi2)
 */
function addEditWorkItem(columnKey) {
  const inputField = document.getElementById(`edit-wi-input-${columnKey}`);
  if (!inputField) return;
  
  const value = inputField.value.trim();
  const num = parseInt(value.replace(/\D/g, ''));
  
  if (isNaN(num) || num <= 0) {
    toast('Please enter a valid work item number', 'error');
    return;
  }
  
  // Get container
  const container = document.getElementById(`edit-wi-${columnKey}`);
  if (!container) return;
  
  // Check for duplicates
  const existingItems = container.querySelectorAll('.edit-work-item-entry');
  for (let item of existingItems) {
    if (item.textContent.includes(String(num).padStart(6, '0'))) {
      toast('This work item already exists', 'warning');
      return;
    }
  }
  
  // Create new work item entry
  const display = formatWISingle(num);
  const newEntryHTML = `
    <div class="edit-work-item-entry">
      ${display}
      <button class="btn-remove-edit-work-item" onclick="removeEditWorkItem('${columnKey}', -1)" type="button" title="Remove">➖</button>
    </div>
  `;
  
  // Insert before the add section
  const addSection = container.querySelector('.edit-work-item-add-section');
  if (addSection) {
    addSection.insertAdjacentHTML('beforebegin', newEntryHTML);
  }
  
  // Clear input
  inputField.value = '';
  const addBtn = document.getElementById(`edit-wi-add-${columnKey}`);
  if (addBtn) addBtn.disabled = true;
  
  toast('Work item added', 'success');
}

/**
 * Remove work item from edit modal
 * @param {string} columnKey - Column key
 * @param {number} index - Index (not used, we remove by clicking the button)
 */
function removeEditWorkItem(columnKey, index) {
  // Find the button that was clicked and remove its parent entry
  event.target.closest('.edit-work-item-entry').remove();
  toast('Work item removed', 'info');
}

/**
 * Collect work items from edit modal
 * @param {string} columnKey - Column key (wi1 or wi2)
 * @returns {string} Comma-separated work item numbers
 */
function collectEditWorkItems(columnKey) {
  const container = document.getElementById(`edit-wi-${columnKey}`);
  if (!container) return '';
  
  const entries = container.querySelectorAll('.edit-work-item-entry');
  const numbers = [];
  
  entries.forEach(entry => {
    const link = entry.querySelector('.wi-link');
    if (link) {
      const text = link.textContent; // e.g., "WI-001234"
      const match = text.match(/\d+/);
      if (match) {
        numbers.push(parseInt(match[0]));
      }
    }
  });
  
  return formatWorkItemsToString(numbers);
}
