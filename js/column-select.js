// Column Selection for Export

function openRecordColumnSelectModal() {
  const allCols = [
    ...state.columns.filter(c => c.visible),
    ...state.customColumns.filter(c => c.visible !== false).map(c => ({key: 'cc_' + c.key, label: c.label, isCustom: true}))
  ];
  
  // Initialize selected columns if not set
  if (!state.selectedExportColumns.record || state.selectedExportColumns.record.length === 0) {
    state.selectedExportColumns.record = allCols.map(c => c.key);
  }
  
  const list = document.getElementById('recordColumnList');
  if (!list) return;
  
  list.innerHTML = allCols.map(col => {
    const isSelected = state.selectedExportColumns.record.includes(col.key);
    const colId = 'record-col-' + col.key;
    return `<label style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface3);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:all 0.2s;" for="${colId}">
      <input type="checkbox" id="${colId}" name="${colId}" value="${esc(col.key)}" ${isSelected ? 'checked' : ''} onchange="updateRecordColumnSelection(this.value, this.checked)" style="accent-color:var(--accent);cursor:pointer;width:18px;height:18px;">
      <span style="font-size:12px;flex:1;color:var(--text);">${esc(col.label)}</span>
    </label>`;
  }).join('');
  
  const modal = document.getElementById('recordColumnSelectModal');
  if (modal) modal.classList.add('show');
}

function updateRecordColumnSelection(colKey, checked) {
  if (!state.selectedExportColumns.record) state.selectedExportColumns.record = [];
  
  if (checked) {
    if (!state.selectedExportColumns.record.includes(colKey)) {
      state.selectedExportColumns.record.push(colKey);
    }
  } else {
    state.selectedExportColumns.record = state.selectedExportColumns.record.filter(k => k !== colKey);
  }
}

function selectAllRecordColumns() {
  const allCols = [
    ...state.columns.filter(c => c.visible),
    ...state.customColumns.filter(c => c.visible !== false).map(c => ({key: 'cc_' + c.key}))
  ];
  state.selectedExportColumns.record = allCols.map(c => c.key);
  document.querySelectorAll('#recordColumnList input[type="checkbox"]').forEach(cb => {
    cb.checked = true;
  });
}

function deselectAllRecordColumns() {
  state.selectedExportColumns.record = [];
  document.querySelectorAll('#recordColumnList input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
}

function closeRecordColumnSelectModal() {
  const modal = document.getElementById('recordColumnSelectModal');
  if (modal) modal.classList.remove('show');
}

function exportRecordsWithColumns(format) {
  if (!state.selectedExportColumns.record || state.selectedExportColumns.record.length === 0) {
    toast('Select at least one column to export', 'error');
    return;
  }
  
  // Get all columns definitions
  const allColDefs = [
    ...state.columns.filter(c => c.visible),
    ...state.customColumns.filter(c => c.visible !== false).map(c => ({key: 'cc_' + c.key, label: c.label, isCustom: true}))
  ];
  
  // Filter to only selected columns
  const selectedCols = allColDefs.filter(c => state.selectedExportColumns.record.includes(c.key));
  
  if (format === 'csv') {
    exportRecordsAsCSVCustom(selectedCols);
  } else if (format === 'excel') {
    exportRecordsAsExcelCustom(selectedCols);
  } else if (format === 'pdf') {
    exportRecordsAsPDFCustom(selectedCols);
  }
  
  closeRecordColumnSelectModal();
  toast('Exported records with ' + selectedCols.length + ' selected columns', 'success');
}

function exportRecordsAsCSVCustom(columns) {
  // Check if both sprint_start and sprint_end are selected
  const hasSprintStart = columns.some(c => c.key === 'sprint_start');
  const hasSprintEnd = columns.some(c => c.key === 'sprint_end');
  
  // Build headers - combine Sprint Start and Sprint End into Sprint
  const headers = columns.map(c => {
    if (c.key === 'sprint_start') return 'Sprint';
    if (c.key === 'sprint_end' && hasSprintStart) return null; // Skip if sprint_start is also present
    return c.label;
  }).filter(h => h !== null).join(',');
  
  const rows = state.records.map(r => {
    return columns.map(col => {
      let val = '';
      
      if (col.key === 'sprint_start') {
        // Combine sprint_start and sprint_end
        const sprintStart = r.sprint_start || '';
        const sprintEnd = r.sprint_end || '';
        if (sprintStart && sprintEnd && sprintStart !== sprintEnd) {
          val = sprintStart + '->' + sprintEnd;
        } else if (sprintStart) {
          val = sprintStart;
        } else {
          val = '';
        }
      } else if (col.key === 'sprint_end' && hasSprintStart) {
        // Skip sprint_end if sprint_start is also present (already combined)
        return null;
      } else if (col.key === 'jira') {
        const jn = r.jira ? r.jira.split('-').pop().replace(/\D/g, '') : '';
        val = jn ? state.jiraDisplayFormat.replace('{number}', jn) : '';
      } else if (col.key === 'wi1') {
        const wn1 = r.wi1 ? parseInt(String(r.wi1).replace(/\D/g, '')) : NaN;
        val = !isNaN(wn1) ? state.wiDisplayFormat.replace('{number6}', String(wn1).padStart(6, '0')).replace('{number}', wn1) : '';
      } else if (col.key === 'wi2') {
        const wn2 = r.wi2 ? parseInt(String(r.wi2).replace(/\D/g, '')) : NaN;
        val = !isNaN(wn2) ? state.wiDisplayFormat.replace('{number6}', String(wn2).padStart(6, '0')).replace('{number}', wn2) : '';
      } else if (col.isCustom) {
        val = r[col.key] || '';
      } else {
        val = r[col.key] || '';
      }
      
      return '"' + String(val).replace(/"/g, '""') + '"';
    }).filter(v => v !== null).join(',');
  });
  
  const csv = headers + '\n' + rows.join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const baseFilename = state.downloadFilename || 'sprint-tracker';
    const timestamp = getFormattedTimestamp();
    const filename = timestamp ? `${baseFilename}_custom_${timestamp}.csv` : `${baseFilename}_custom.csv`;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportRecordsAsExcelCustom(columns) {
  // Check if both sprint_start and sprint_end are selected
  const hasSprintStart = columns.some(c => c.key === 'sprint_start');
  const hasSprintEnd = columns.some(c => c.key === 'sprint_end');
  
  // Build headers - combine Sprint Start and Sprint End into Sprint
  const headers = columns.map(c => {
    if (c.key === 'sprint_start') return 'Sprint';
    if (c.key === 'sprint_end' && hasSprintStart) return null; // Skip if sprint_start is also present
    return c.label;
  }).filter(h => h !== null).join('\t');
  
  const rows = state.records.map(r => {
    return columns.map(col => {
      let val = '';
      
      if (col.key === 'sprint_start') {
        // Combine sprint_start and sprint_end
        const sprintStart = r.sprint_start || '';
        const sprintEnd = r.sprint_end || '';
        if (sprintStart && sprintEnd && sprintStart !== sprintEnd) {
          val = sprintStart + '->' + sprintEnd;
        } else if (sprintStart) {
          val = sprintStart;
        } else {
          val = '';
        }
      } else if (col.key === 'sprint_end' && hasSprintStart) {
        // Skip sprint_end if sprint_start is also present (already combined)
        return null;
      } else if (col.key === 'jira') {
        const jn = r.jira ? r.jira.split('-').pop().replace(/\D/g, '') : '';
        val = jn ? state.jiraDisplayFormat.replace('{number}', jn) : '';
      } else if (col.key === 'wi1') {
        const wn1 = r.wi1 ? parseInt(String(r.wi1).replace(/\D/g, '')) : NaN;
        val = !isNaN(wn1) ? state.wiDisplayFormat.replace('{number6}', String(wn1).padStart(6, '0')).replace('{number}', wn1) : '';
      } else if (col.key === 'wi2') {
        const wn2 = r.wi2 ? parseInt(String(r.wi2).replace(/\D/g, '')) : NaN;
        val = !isNaN(wn2) ? state.wiDisplayFormat.replace('{number6}', String(wn2).padStart(6, '0')).replace('{number}', wn2) : '';
      } else if (col.isCustom) {
        val = r[col.key] || '';
      } else {
        val = r[col.key] || '';
      }
      
      return String(val);
    }).filter(v => v !== null).join('\t');
  });
  
  const excel = headers + '\n' + rows.join('\n');
  const blob = new Blob([excel], {type: 'application/vnd.ms-excel'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'records_custom_' + new Date().toISOString().split('T')[0] + '.xls';
  a.click();
  URL.revokeObjectURL(url);
}

function exportRecordsAsPDFCustom(columns) {
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text('Sprint Tracker - Records Export', 14, 15);
  
  doc.setFontSize(10);
  doc.text('Generated: ' + new Date().toLocaleString(), 14, 22);
  
  // Check if both sprint_start and sprint_end are selected
  const hasSprintStart = columns.some(c => c.key === 'sprint_start');
  const hasSprintEnd = columns.some(c => c.key === 'sprint_end');
  
  // Build headers - combine Sprint Start and Sprint End into Sprint
  const headers = [columns.map(c => {
    if (c.key === 'sprint_start') return 'Sprint';
    if (c.key === 'sprint_end' && hasSprintStart) return null; // Skip if sprint_start is also present
    return c.label;
  }).filter(h => h !== null)];
  
  const data = state.records.map(r => {
    return columns.map(col => {
      let val = '';
      
      if (col.key === 'sprint_start') {
        // Combine sprint_start and sprint_end
        const sprintStart = r.sprint_start || '';
        const sprintEnd = r.sprint_end || '';
        if (sprintStart && sprintEnd && sprintStart !== sprintEnd) {
          val = sprintStart + '->' + sprintEnd;
        } else if (sprintStart) {
          val = sprintStart;
        } else {
          val = '';
        }
      } else if (col.key === 'sprint_end' && hasSprintStart) {
        // Skip sprint_end if sprint_start is also present (already combined)
        return null;
      } else if (col.key === 'jira') {
        const jn = r.jira ? r.jira.split('-').pop().replace(/\D/g, '') : '';
        val = jn ? state.jiraDisplayFormat.replace('{number}', jn) : '';
      } else if (col.key === 'wi1') {
        const wn1 = r.wi1 ? parseInt(String(r.wi1).replace(/\D/g, '')) : NaN;
        val = !isNaN(wn1) ? state.wiDisplayFormat.replace('{number6}', String(wn1).padStart(6, '0')).replace('{number}', wn1) : '';
      } else if (col.key === 'wi2') {
        const wn2 = r.wi2 ? parseInt(String(r.wi2).replace(/\D/g, '')) : NaN;
        val = !isNaN(wn2) ? state.wiDisplayFormat.replace('{number6}', String(wn2).padStart(6, '0')).replace('{number}', wn2) : '';
      } else if (col.isCustom) {
        val = r[col.key] || '';
      } else {
        val = r[col.key] || '';
      }
      
      return String(val);
    }).filter(v => v !== null);
  });
  
  doc.autoTable({
    head: headers,
    body: data,
    startY: 28,
    styles: {fontSize: 8, cellPadding: 2},
    headStyles: {fillColor: [0, 212, 255], textColor: [10, 14, 26], fontStyle: 'bold'}
  });
  
  doc.save('records_custom_' + new Date().toISOString().split('T')[0] + '.pdf');
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
