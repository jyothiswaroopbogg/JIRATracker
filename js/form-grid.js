// Dynamic Form Grid Rendering

function renderFormGrid() {
  // Get all columns (system + custom) sorted by order, filtered by visibility
  const allCols = [
    ...state.columns.filter(c => c.visible),
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
  
  const formGrid = document.getElementById('mainFormGrid');
  if (!formGrid) return;
  
  // Preserve current form values before re-rendering
  const currentValues = {};
  allCols.forEach(col => {
    const fieldId = col.isCustom ? 'f-cc-' + col.original.key : 'f-' + col.key;
    const el = document.getElementById(fieldId);
    if (el) {
      currentValues[fieldId] = el.value;
    }
  });
  
  let html = '';
  
  allCols.forEach(col => {
    if (col.key === 'pi') {
      html += '<div class="form-group"><label for="f-pi">PI</label><input type="text" id="f-pi" name="f-pi" placeholder="e.g. PI-24.1"></div>';
    } else if (col.key === 'sprint_start') {
      html += '<div class="form-group"><label for="f-sprint-start">Sprint Start</label><input type="text" id="f-sprint-start" name="f-sprint-start" placeholder="e.g. 2"></div>';
    } else if (col.key === 'jira') {
      html += '<div class="form-group"><label for="f-jira">Jira Story Number <span style="color:var(--text3);font-size:10px">(digits only)</span></label><input type="text" id="f-jira" name="f-jira" placeholder="e.g. 1263" oninput="previewJira(this.value)"><div class="preview-hint" id="jira-preview"></div></div>';
    } else if (col.key === 'desc') {
      html += '<div class="form-group span2"><label for="f-desc">Description</label><textarea id="f-desc" name="f-desc" placeholder="Story description..."></textarea></div>';
    } else if (col.key === 'jstatus') {
      html += '<div class="form-group"><label for="f-jstatus">Jira Status</label><select id="f-jstatus" name="f-jstatus"></select></div>';
    } else if (col.key === 'wi1') {
      html += '<div class="form-group"><label for="f-wi1">Work Item 1 (SC) <span style="color:var(--text3);font-size:10px">(digits only)</span></label><input type="text" id="f-wi1" name="f-wi1" placeholder="e.g. 1" oninput="previewWI1(this.value)"><div class="preview-hint" id="wi1-preview" style="color:var(--accent4)"></div></div>';
    } else if (col.key === 'wi2') {
      html += '<div class="form-group"><label for="f-wi2">Work Item 2 (VC) <span style="color:var(--text3);font-size:10px">(digits only)</span></label><input type="text" id="f-wi2" name="f-wi2" placeholder="e.g. 2" oninput="previewWI2(this.value)"><div class="preview-hint" id="wi2-preview" style="color:var(--accent4)"></div></div>';
    } else if (col.key === 'dstatus') {
      html += '<div class="form-group"><label for="f-dstatus">DevOps Status</label><select id="f-dstatus" name="f-dstatus"></select></div>';
    } else if (col.key === 'dorg') {
      html += '<div class="form-group"><label for="f-dorg">DevOps ORG</label><select id="f-dorg" name="f-dorg"></select></div>';
    } else if (col.key === 'comments') {
      html += '<div class="form-group"><label for="f-comments">Comments</label><textarea id="f-comments" name="f-comments" placeholder="Additional notes..."></textarea></div>';
    } else if (col.key === 'tags') {
      // Tags will be rendered separately below
    } else if (col.isCustom) {
      const c = col.original;
      if (c.type === 'select') {
        html += '<div class="form-group"><label for="f-cc-' + c.key + '">' + c.label + '</label><select id="f-cc-' + c.key + '" name="f-cc-' + c.key + '"><option value="">— Select —</option></select></div>';
      } else if (c.type === 'longtext') {
        html += '<div class="form-group span2"><label for="f-cc-' + c.key + '">' + c.label + '</label><textarea id="f-cc-' + c.key + '" placeholder="' + c.label + '..."></textarea></div>';
      } else if (c.type === 'date') {
        html += '<div class="form-group"><label for="f-cc-' + c.key + '">' + c.label + '</label><input type="date" id="f-cc-' + c.key + '" placeholder="' + c.label + '..." oninput="previewCustomDate(\'' + c.key + '\', this.value)"><div class="preview-hint" id="cc-' + c.key + '-preview" style="color:var(--accent4)"></div></div>';
      } else if (c.type === 'number') {
        html += '<div class="form-group"><label for="f-cc-' + c.key + '">' + c.label + '</label><input type="number" id="f-cc-' + c.key + '" placeholder="' + c.label + '..."></div>';
      } else if (c.type === 'url') {
        html += '<div class="form-group"><label for="f-cc-' + c.key + '">' + c.label + '</label><input type="url" id="f-cc-' + c.key + '" placeholder="https://example.com" oninput="previewCustomUrl(\'' + c.key + '\', this.value)"><div class="preview-hint" id="cc-' + c.key + '-preview" style="color:var(--accent4)"></div></div>';
      } else if (c.type === 'email') {
        html += '<div class="form-group"><label for="f-cc-' + c.key + '">' + c.label + '</label><input type="email" id="f-cc-' + c.key + '" placeholder="email@example.com" oninput="previewCustomEmail(\'' + c.key + '\', this.value)"><div class="preview-hint" id="cc-' + c.key + '-preview" style="color:var(--accent4)"></div></div>';
      } else {
        // Default to text
        html += '<div class="form-group"><label for="f-cc-' + c.key + '">' + c.label + '</label><input type="text" id="f-cc-' + c.key + '" placeholder="' + c.label + '..."></div>';
      }
    }
  });
  
  formGrid.innerHTML = html;
  
  // Re-populate selects after rendering
  populateSelectsFromState();
  
  // Restore form values
  Object.keys(currentValues).forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el && currentValues[fieldId]) {
      el.value = currentValues[fieldId];
    }
  });
  
  // Re-render previews if values exist
  const jiraVal = currentValues['f-jira'];
  if (jiraVal) previewJira(jiraVal);
  const wi1Val = currentValues['f-wi1'];
  if (wi1Val) previewWI1(wi1Val);
  const wi2Val = currentValues['f-wi2'];
  if (wi2Val) previewWI2(wi2Val);
  
  // Re-render previews for custom columns
  state.customColumns.forEach(c => {
    const fieldId = 'f-cc-' + c.key;
    const val = currentValues[fieldId];
    if (val) {
      if (c.type === 'email') {
        previewCustomEmail(c.key, val);
      } else if (c.type === 'url') {
        previewCustomUrl(c.key, val);
      } else if (c.type === 'date') {
        previewCustomDate(c.key, val);
      }
    }
  });
}
