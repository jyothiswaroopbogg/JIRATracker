// Export and Import Functions

// Open CSV import modal
function openCSVImportModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'importFileModal';
  
  overlay.innerHTML = `
    <div class="modal" style="max-width:500px;">
      <div class="modal-header" style="background:linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(139,92,246,0.15) 100%);border-bottom:2px solid rgba(0,212,255,0.3);">
        <div class="modal-title" style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:24px;">📤</span>
          <span>Import CSV File</span>
        </div>
        <button class="modal-close" onclick="closeCSVImportModal()">×</button>
      </div>
      <div style="padding:30px;">
        <!-- Info Box -->
        <div style="background:linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(59,130,246,0.08) 100%);border:1px solid rgba(0,212,255,0.2);border-radius:var(--radius-sm);padding:16px;margin-bottom:24px;">
          <div style="display:flex;align-items:start;gap:12px;">
            <span style="font-size:20px;">💡</span>
            <div style="flex:1;">
              <div style="font-size:12px;font-weight:600;color:var(--accent);margin-bottom:6px;">How it works</div>
              <div style="font-size:11px;color:var(--text2);line-height:1.6;">
                1. Download the template CSV file<br>
                2. Fill in your data using the template<br>
                3. Upload your completed CSV file<br>
                4. Preview and select records to import
              </div>
            </div>
          </div>
        </div>
        
        <!-- Template Download Button -->
        <div style="margin-bottom:20px;">
          <button class="btn btn-primary" onclick="downloadCSVTemplate()" style="width:100%;background:linear-gradient(135deg, #10b981 0%, #059669 100%);border:none;padding:12px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;">
            <span style="font-size:16px;">📥</span>
            <span>Download Template.csv</span>
          </button>
        </div>
        
        <!-- File Drop Zone -->
        <div id="importDropZone" 
             onclick="document.getElementById('importFileInput').click()"
             ondrop="handleImportDrop(event)" 
             ondragover="handleImportDragOver(event)"
             ondragleave="handleImportDragLeave(event)"
             style="
               border:2px dashed rgba(0,212,255,0.4);
               border-radius:var(--radius-sm);
               padding:40px 20px;
               text-align:center;
               cursor:pointer;
               background:linear-gradient(135deg, rgba(0,212,255,0.03) 0%, rgba(139,92,246,0.03) 100%);
               transition:all 0.3s ease;
               position:relative;
               overflow:hidden;
             "
             onmouseover="this.style.borderColor='var(--accent)';this.style.background='linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(139,92,246,0.08) 100%)'"
             onmouseout="this.style.borderColor='rgba(0,212,255,0.4)';this.style.background='linear-gradient(135deg, rgba(0,212,255,0.03) 0%, rgba(139,92,246,0.03) 100%)'">
          
          <!-- Animated Background -->
          <div style="position:absolute;top:0;left:0;right:0;bottom:0;opacity:0.1;pointer-events:none;">
            <div style="position:absolute;top:20%;left:10%;width:60px;height:60px;background:var(--accent);border-radius:50%;filter:blur(30px);"></div>
            <div style="position:absolute;bottom:20%;right:10%;width:80px;height:80px;background:#8b5cf6;border-radius:50%;filter:blur(40px);"></div>
          </div>
          
          <div style="position:relative;z-index:1;">
            <div style="font-size:48px;margin-bottom:12px;animation:bounce 2s infinite;">📁</div>
            <div style="font-size:14px;font-weight:600;color:var(--accent);margin-bottom:6px;">
              Drop your CSV file here
            </div>
            <div style="font-size:11px;color:var(--text3);margin-bottom:12px;">
              or click to browse
            </div>
            <div style="display:inline-block;background:rgba(0,212,255,0.15);border:1px solid rgba(0,212,255,0.3);border-radius:16px;padding:4px 12px;font-size:10px;color:var(--accent);font-weight:600;">
              .CSV FILES ONLY
            </div>
          </div>
        </div>
        
        <input type="file" 
               id="importFileInput" 
               accept=".csv" 
               style="display:none;" 
               onchange="handleImportFileSelect(event)">
        
        <!-- File Requirements -->
        <div style="margin-top:20px;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);border-left:3px solid var(--accent);">
          <div style="font-size:11px;font-weight:600;color:var(--text);margin-bottom:6px;">📋 File Requirements</div>
          <ul style="font-size:10px;color:var(--text3);margin:0;padding-left:20px;line-height:1.8;">
            <li>File must be in CSV format</li>
            <li>First row should contain column headers</li>
            <li>Supported columns: PI, Sprint, Jira Story, Description, etc.</li>
          </ul>
        </div>
      </div>
      <div class="form-actions" style="border-top:1px solid var(--border);background:var(--surface2);">
        <button class="btn btn-secondary" onclick="closeCSVImportModal()">Cancel</button>
      </div>
    </div>
    
    <style>
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      #importDropZone.drag-over {
        border-color: var(--accent) !important;
        background: linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(139,92,246,0.15) 100%) !important;
        transform: scale(1.02);
      }
    </style>
  `;
  
  document.body.appendChild(overlay);
}

// Close CSV import modal
function closeCSVImportModal() {
  const modal = document.getElementById('importFileModal');
  if (modal) {
    modal.remove();
  }
}

// Handle file select from import modal
function handleImportFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    closeCSVImportModal();
    processImportFile(file);
  }
  // Reset input
  event.target.value = '';
}

// Handle drag over
function handleImportDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.add('drag-over');
}

// Handle drag leave
function handleImportDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.remove('drag-over');
}

// Handle drop
function handleImportDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.remove('drag-over');
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      closeCSVImportModal();
      processImportFile(file);
    } else {
      toast('Please select a CSV file', 'error');
    }
  }
}

// Process import file
function processImportFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const lines = e.target.result.split('\n').map(l => l.trim()).filter(l => l);
      if (!lines.length) {
        toast('Empty file', 'error');
        return;
      }
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
      
      // Build key mapping for standard fields
      const keyMap = {
        '#': '_rownum',
        'pi': 'pi',
        'pi number': 'pi', // Backward compatibility
        'sprint': 'sprint', // Handle combined sprint column (will be split below)
        'sprint start': 'sprint_start',
        'sprint end': 'sprint_end',
        'jira story': 'jira',
        'description': 'desc',
        'jira status': 'jstatus',
        'work item 1 (sc)': 'wi1',
        'work item 1': 'wi1', // Backward compatibility
        'work item 2 (vc)': 'wi2',
        'work item 2': 'wi2', // Backward compatibility
        'devops status': 'dstatus',
        'devops org': 'dorg',
        'comments': 'comments',
        'tags': 'tags'
      };
      
      // Build mapping for custom columns (match by label)
      const customCols = state.customColumns || [];
      const customColMap = {};
      customCols.forEach(col => {
        const labelLower = col.label.toLowerCase();
        customColMap[labelLower] = 'cc_' + col.key;
      });
      
      const imported = [];
      const importedTags = {};
      
      for (let i = 1; i < lines.length; i++) {
        const vals = [];
        let cur = '', inQ = false;
        for (const ch of lines[i]) {
          if (ch === '"') {
            inQ = !inQ;
          } else if (ch === ',' && !inQ) {
            vals.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        vals.push(cur.trim());
        
        const rec = {id: Date.now() + i, _selected: false};
        let tagValue = '';
        
        headers.forEach((h, j) => {
          let k = keyMap[h]; // Check standard fields first
          
          // If not a standard field, check if it's a custom column
          if (!k && customColMap[h]) {
            k = customColMap[h];
          } else if (!k && h !== '#') {
            // Unknown column, skip it
            k = null;
          }
          
          const val = vals[j] ? vals[j].replace(/^"|"$/g, '').replace(/""/g, '"') : '';
          
          if (k === 'tags') {
            tagValue = val;
          } else if (k === 'sprint') {
            // Handle combined Sprint column - split "1->2" or "1→2" into sprint_start and sprint_end
            if (val) {
              const sprintParts = val.split(/->|→/).map(s => s.trim());
              if (sprintParts.length === 2) {
                rec.sprint_start = sprintParts[0];
                rec.sprint_end = sprintParts[1];
              } else if (sprintParts.length === 1) {
                rec.sprint_start = sprintParts[0];
              }
            }
          } else if (k && k !== '_rownum') {
            // Skip the row number column
            rec[k] = val;
          }
        });
        
        // Clean up Jira and Work Item formats
        if (rec.jira && rec.jira.includes('-')) rec.jira = rec.jira.split('-').pop();
        
        // Handle multiple work items (e.g., "WI-001234, WI-001235" -> "1234,1235")
        if (rec.wi1) {
          const wi1Items = rec.wi1.split(',').map(wi => {
            const trimmed = wi.trim();
            if (trimmed.startsWith('WI-')) {
              return String(parseInt(trimmed.slice(3)) || 0);
            }
            return trimmed.replace(/\D/g, ''); // Keep just digits
          }).filter(wi => wi && wi !== '0').join(',');
          rec.wi1 = wi1Items;
        }
        
        if (rec.wi2) {
          const wi2Items = rec.wi2.split(',').map(wi => {
            const trimmed = wi.trim();
            if (trimmed.startsWith('WI-')) {
              return String(parseInt(trimmed.slice(3)) || 0);
            }
            return trimmed.replace(/\D/g, ''); // Keep just digits
          }).filter(wi => wi && wi !== '0').join(',');
          rec.wi2 = wi2Items;
        }
        
        // Process tags
        if (tagValue) {
          const tagNames = tagValue.split(',').map(t => t.trim()).filter(t => t);
          if (tagNames.length > 0) {
            importedTags[rec.id] = tagNames;
          }
        }
        
        imported.push(rec);
      }
      
      // Show import preview modal
      openImportPreviewModal(imported, importedTags);
    } catch (err) {
      toast('Import error: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

// Legacy function for backward compatibility
function importFile(evt) {
  const file = evt.target.files[0];
  if (file) {
    processImportFile(file);
  }
  evt.target.value = '';
}

// Get Export Rows
function getExportRows() {
  // Sort columns by order
  const sortedCols = [...state.columns].sort((a, b) => (a.order || 999) - (b.order || 999)).filter(c => c.visible);
  const sortedCC = [...state.customColumns].sort((a, b) => (a.order || 999) - (b.order || 999)).filter(c => c.visible !== false);
  
  return state.records.map((r, i) => {
    const row = {'#': i + 1};
    
    // Track if sprint_start was already processed to skip sprint_end
    let sprintStartProcessed = false;
    
    // Add columns in sorted order
    sortedCols.forEach(col => {
      if (col.key === 'pi') {
        row['PI'] = r.pi || '';
      } else if (col.key === 'sprint_start') {
        sprintStartProcessed = true;
        // Combine Sprint Start and Sprint End into single Sprint column
        const sprintStart = r.sprint_start || '';
        const sprintEnd = r.sprint_end || '';
        if (sprintStart && sprintEnd && sprintStart !== sprintEnd) {
          row['Sprint'] = sprintStart + '->' + sprintEnd;
        } else if (sprintStart) {
          row['Sprint'] = sprintStart;
        } else {
          row['Sprint'] = '';
        }
      } else if (col.key === 'sprint_end') {
        // Skip sprint_end if sprint_start was already processed (combined into Sprint column)
        // Only add Sprint End if sprint_start is not visible
        if (!sprintStartProcessed) {
          row['Sprint End'] = r.sprint_end || '';
        }
      } else if (col.key === 'jira') {
        const jn = r.jira ? r.jira.split('-').pop().replace(/\D/g, '') : '';
        const jd = jn ? state.jiraDisplayFormat.replace('{number}', jn) : '';
        row['Jira Story'] = jd;
      } else if (col.key === 'desc') {
        row['Description'] = r.desc || '';
      } else if (col.key === 'jstatus') {
        row['Jira Status'] = r.jstatus || '';
      } else if (col.key === 'wi1') {
        // Handle multiple work items (comma-separated)
        const numbers = typeof parseWorkItems === 'function' ? parseWorkItems(r.wi1) : [];
        const formatted = numbers.map(wn1 => {
          return state.wiDisplayFormat.replace('{number6}', String(wn1).padStart(6, '0')).replace('{number}', wn1);
        }).join(', ');
        row['Work Item 1 (SC)'] = formatted || '';
      } else if (col.key === 'wi2') {
        // Handle multiple work items (comma-separated)
        const numbers = typeof parseWorkItems === 'function' ? parseWorkItems(r.wi2) : [];
        const formatted = numbers.map(wn2 => {
          return state.wiDisplayFormat.replace('{number6}', String(wn2).padStart(6, '0')).replace('{number}', wn2);
        }).join(', ');
        row['Work Item 2 (VC)'] = formatted || '';
      } else if (col.key === 'dstatus') {
        row['DevOps Status'] = r.dstatus || '';
      } else if (col.key === 'dorg') {
        row['DevOps ORG'] = r.dorg || '';
      } else if (col.key === 'comments') {
        row['Comments'] = r.comments || '';
      } else if (col.key === 'tags') {
        const recordTags = state.recordTags && state.recordTags[r.id] ? state.recordTags[r.id].map(tagName => {
          const tag = state.tags.find(t => (typeof t === 'string' ? t : t.name) === tagName);
          return typeof tag === 'string' ? tag : (tag ? tag.name : tagName);
        }).join(', ') : '';
        row['Tags'] = recordTags;
      }
    });
    
    // Add custom columns in sorted order
    sortedCC.forEach(c => {
      row[c.label] = r['cc_' + c.key] || '';
    });
    
    return row;
  });
}

// Download Blob Helper
function dlBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Export CSV
function exportCSV() {
  const data = getExportRows();
  if (!data.length) {
    toast('No data to export', 'error');
    return;
  }
  const h = Object.keys(data[0]);
  const rows = [h.join(','), ...data.map(r => h.map(k => '"' + String(r[k]).replace(/"/g, '""') + '"').join(','))];
  const timestamp = getFormattedTimestamp();
  const baseFilename = state.downloadFilename || 'sprint-tracker';
  const filename = timestamp ? `${baseFilename}_${timestamp}.csv` : `${baseFilename}.csv`;
  dlBlob(new Blob([rows.join('\n')], {type: 'text/csv'}), filename);
  toast('CSV exported', 'success');
}

// Export Excel
function exportExcel() {
  const data = getExportRows();
  if (!data.length) {
    toast('No data to export', 'error');
    return;
  }
  const h = Object.keys(data[0]);
  let html = '<table><tr>' + h.map(k => '<th style="background:#1a2236;color:#00d4ff;padding:8px;border:1px solid #2a3a55">' + k + '</th>').join('') + '</tr>';
  data.forEach(r => {
    html += '<tr>' + h.map(k => '<td style="padding:7px;border:1px solid #2a3a55">' + r[k] + '</td>').join('') + '</tr>';
  });
  html += '</table>';
  const timestamp = getFormattedTimestamp();
  const baseFilename = state.downloadFilename || 'sprint-tracker';
  const filename = timestamp ? `${baseFilename}_${timestamp}.xls` : `${baseFilename}.xls`;
  dlBlob(new Blob([html], {type: 'application/vnd.ms-excel;charset=utf-8'}), filename);
  toast('Excel exported', 'success');
}

// Export PDF
function exportPDF() {
  if (!window.jspdf) {
    toast('PDF library not available', 'error');
    return;
  }
  const {jsPDF} = window.jspdf;
  const doc = new jsPDF({orientation: 'landscape', unit: 'mm', format: 'a3'});
  doc.setFillColor(10, 14, 26);
  doc.rect(0, 0, 420, 300, 'F');
  doc.setTextColor(0, 212, 255);
  doc.setFontSize(18);
  const pdfTitle = state.labels && state.labels.pageTitle ? state.labels.pageTitle : 'Sprint Tracker Pro — TBCRM3';
  doc.text(pdfTitle, 14, 15);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.text('Exported: ' + new Date().toLocaleString() + ' | Records: ' + state.records.length, 14, 22);
  const data = getExportRows();
  if (!data.length) {
    toast('No data to export', 'error');
    return;
  }
  
  const h = Object.keys(data[0]);
  doc.autoTable({
    head: [h],
    body: data.map(r => h.map(k => r[k])),
    startY: 27,
    styles: {fontSize: 7, cellPadding: 2.5, fillColor: [17, 24, 39], textColor: [226, 232, 240], lineColor: [42, 58, 85], lineWidth: .3},
    headStyles: {fillColor: [26, 34, 54], textColor: [0, 212, 255], fontStyle: 'bold'},
    alternateRowStyles: {fillColor: [20, 30, 46]}
  });
  const timestamp = getFormattedTimestamp();
  const baseFilename = state.downloadFilename || 'sprint-tracker';
  const filename = timestamp ? `${baseFilename}_${timestamp}.pdf` : `${baseFilename}.pdf`;
  doc.save(filename);
  toast('PDF exported', 'success');
}

// Open import preview modal
function openImportPreviewModal(records, tags) {
  // Store imported data temporarily
  window.importPreviewData = {records, tags};
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'importPreviewModal';
  
  // Define standard column order - these will appear first in this exact order (only if they exist)
  const standardColumnOrder = ['pi', 'sprint_start', 'sprint_end', 'jira', 'desc', 'jstatus', 'wi1', 'wi2', 'dstatus', 'dorg', 'comments', 'tags'];
  
  // Get all unique columns from records
  const allColumns = new Set();
  records.forEach(rec => {
    Object.keys(rec).forEach(key => {
      if (key !== 'id' && key !== '_selected' && key !== '_rownum') {
        allColumns.add(key);
      }
    });
  });
  
  // Build final column list: standard columns first (in order, only if present), then additional columns (alphabetically)
  const sortedColumns = [];
  
  // Add standard columns in the defined order (only if they exist in the data)
  standardColumnOrder.forEach(col => {
    if (allColumns.has(col)) {
      sortedColumns.push(col);
      allColumns.delete(col); // Remove from set so we don't add it again
    }
  });
  
  // Remove sprint_end from the column list if sprint_start exists (we'll combine them)
  if (sortedColumns.includes('sprint_start') && allColumns.has('sprint_end')) {
    allColumns.delete('sprint_end');
  }
  
  // Add any remaining columns (custom/additional) alphabetically
  const additionalColumns = Array.from(allColumns).sort((a, b) => a.localeCompare(b));
  sortedColumns.push(...additionalColumns);
  
  // Column labels mapping
  const columnLabels = {
    'pi': 'PI',
    'sprint_start': 'Sprint',
    'sprint_end': 'Sprint End',
    'jira': 'Jira Story',
    'desc': 'Description',
    'jstatus': 'Jira Status',
    'wi1': 'Work Item 1 (SC)',
    'wi2': 'Work Item 2 (VC)',
    'dstatus': 'DevOps Status',
    'dorg': 'DevOps ORG',
    'comments': 'Comments',
    'tags': 'Tags'
  };
  
  // Create preview table with horizontal scroll
  let tableHTML = `
    <div style="max-height:400px;overflow:auto;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;min-width:max-content;">
        <thead style="position:sticky;top:0;background:var(--surface);z-index:10;">
          <tr style="background:var(--surface2);">
            <th style="padding:8px;border:1px solid var(--border);text-align:center;min-width:50px;position:sticky;left:0;background:var(--surface2);z-index:11;">
              <input type="checkbox" id="selectAllImport" onchange="toggleAllImportSelection(this.checked)" style="cursor:pointer;">
            </th>
  `;
  
  // Add column headers
  sortedColumns.forEach((col) => {
    const label = columnLabels[col] || col.replace('cc_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    tableHTML += `
      <th style="padding:8px;border:1px solid var(--border);text-align:left;font-size:11px;color:var(--text);white-space:nowrap;min-width:120px;">${label}</th>
    `;
  });
  
  tableHTML += '</tr></thead><tbody>';
  
  // Add data rows
  records.forEach((rec, idx) => {
    const rowBg = idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)';
    tableHTML += `<tr style="background:${rowBg};">`;
    
    // Checkbox column (sticky)
    tableHTML += `
      <td style="padding:8px;border:1px solid var(--border);text-align:center;position:sticky;left:0;background:${rowBg};z-index:5;">
        <input type="checkbox" class="import-record-checkbox" data-index="${idx}" onchange="updateImportSelection()" style="cursor:pointer;">
      </td>
    `;
    
    // Data columns
    sortedColumns.forEach((col) => {
      let value = rec[col] || '';
      
      // Format specific columns
      if (col === 'sprint_start') {
        // Combine sprint_start and sprint_end for display
        const sprintStart = rec.sprint_start || '';
        const sprintEnd = rec.sprint_end || '';
        if (sprintStart && sprintEnd && sprintStart !== sprintEnd) {
          value = sprintStart + '->' + sprintEnd;
        } else if (sprintStart) {
          value = sprintStart;
        } else {
          value = '';
        }
      } else if (col === 'jira' && value) {
        value = state.jiraDisplayFormat ? state.jiraDisplayFormat.replace('{number}', value) : value;
      } else if (col === 'wi1' && value) {
        value = state.wiDisplayFormat ? state.wiDisplayFormat.replace('{number6}', String(value).padStart(6, '0')).replace('{number}', value) : value;
      } else if (col === 'wi2' && value) {
        value = state.wiDisplayFormat ? state.wiDisplayFormat.replace('{number6}', String(value).padStart(6, '0')).replace('{number}', value) : value;
      }
      
      const maxWidth = col === 'desc' || col === 'comments' ? '300px' : '180px';
      tableHTML += `
        <td style="padding:8px;border:1px solid var(--border);font-size:12px;color:var(--text2);max-width:${maxWidth};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${value}">${value}</td>
      `;
    });
    
    tableHTML += '</tr>';
  });
  
  tableHTML += '</tbody></table></div>';
  
  overlay.innerHTML = `
    <div class="modal" style="max-width:900px;">
      <div class="modal-header">
        <div class="modal-title">📥 Import Preview</div>
        <button class="modal-close" onclick="closeImportPreviewModal()">×</button>
      </div>
      <div style="padding:20px;">
        <div style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:var(--radius-sm);padding:12px;margin-bottom:16px;">
          <div style="font-size:12px;color:var(--text2);">
            <strong style="color:var(--accent);">📊 Found ${records.length} records</strong> in the file. Select the records you want to import and click Import Selected.
          </div>
        </div>
        ${tableHTML}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);">
          <div style="font-size:13px;color:var(--text2);">
            <strong id="importSelectedCount" style="color:var(--accent);">0</strong> records selected
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="selectAllImportRecords()">✓ Select All</button>
            <button class="btn btn-secondary btn-sm" onclick="deselectAllImportRecords()">✕ Deselect All</button>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeImportPreviewModal()">Cancel</button>
        <button class="btn btn-primary" id="importSelectedBtn" onclick="importSelectedRecords()" disabled style="opacity:0.5;">📥 Import Selected</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  updateImportSelection();
}

// Toggle all import selection
function toggleAllImportSelection(checked) {
  const checkboxes = document.querySelectorAll('.import-record-checkbox');
  checkboxes.forEach(cb => cb.checked = checked);
  updateImportSelection();
}

// Select all import records
function selectAllImportRecords() {
  document.getElementById('selectAllImport').checked = true;
  toggleAllImportSelection(true);
}

// Deselect all import records
function deselectAllImportRecords() {
  document.getElementById('selectAllImport').checked = false;
  toggleAllImportSelection(false);
}

// Update import selection count
function updateImportSelection() {
  const checkboxes = document.querySelectorAll('.import-record-checkbox');
  const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  
  const countEl = document.getElementById('importSelectedCount');
  const importBtn = document.getElementById('importSelectedBtn');
  
  if (countEl) countEl.textContent = selectedCount;
  
  if (importBtn) {
    if (selectedCount > 0) {
      importBtn.disabled = false;
      importBtn.style.opacity = '1';
    } else {
      importBtn.disabled = true;
      importBtn.style.opacity = '0.5';
    }
  }
  
  // Update select all checkbox state
  const selectAllCb = document.getElementById('selectAllImport');
  if (selectAllCb) {
    selectAllCb.checked = selectedCount === checkboxes.length && checkboxes.length > 0;
  }
}

// Import selected records
function importSelectedRecords() {
  if (!window.importPreviewData) {
    toast('Import data not found', 'error');
    return;
  }
  
  const checkboxes = document.querySelectorAll('.import-record-checkbox');
  const selectedIndices = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => parseInt(cb.getAttribute('data-index')));
  
  if (selectedIndices.length === 0) {
    toast('No records selected', 'error');
    return;
  }
  
  const {records, tags} = window.importPreviewData;
  const selectedRecords = selectedIndices.map(idx => records[idx]);
  
  // Get valid configuration values from state
  const validTagNames = (state.tags || []).map(tag => typeof tag === 'string' ? tag : tag.name);
  const validJiraStatuses = state.jiraStatuses || [];
  const validDevOpsStatuses = state.devopsStatuses || [];
  const validDevOpsOrgs = state.devopsOrgs || [];
  
  // Add selected records to state with timestamps and validate configuration values
  selectedRecords.forEach(rec => {
    // Validate and filter Jira Status - only use if exists in configuration, otherwise set to empty
    if (rec.jstatus && !validJiraStatuses.includes(rec.jstatus)) {
      rec.jstatus = '';
    }
    
    // Validate and filter DevOps Status - only use if exists in configuration, otherwise set to empty
    if (rec.dstatus && !validDevOpsStatuses.includes(rec.dstatus)) {
      rec.dstatus = '';
    }
    
    // Validate and filter DevOps ORG - only use if exists in configuration, otherwise set to empty
    if (rec.dorg && !validDevOpsOrgs.includes(rec.dorg)) {
      rec.dorg = '';
    }
    
    // Add timestamps using the same format as manual record creation
    if (typeof addCreatedTimestamp === 'function') {
      addCreatedTimestamp(rec);
    } else {
      // Fallback if addCreatedTimestamp is not available
      const now = Date.now();
      rec.createdAt = now;
      rec.modifiedAt = now;
    }
  });
  
  state.records = [...state.records, ...selectedRecords];
  
  // Merge imported tags with existing tags - only include tags that exist in configuration
  selectedRecords.forEach(rec => {
    if (tags[rec.id]) {
      if (!state.recordTags) state.recordTags = {};
      // Filter tags to only include those that exist in configuration
      const filteredTags = tags[rec.id].filter(tagName => validTagNames.includes(tagName));
      if (filteredTags.length > 0) {
        state.recordTags[rec.id] = filteredTags;
      }
    }
  });
  
  saveState();
  
  renderTable();
  updateKPIs();
  renderCharts();
  updateRecordCount();
  
  closeImportPreviewModal();
  toast(`Imported ${selectedRecords.length} records`, 'success');
  
  // Clean up
  delete window.importPreviewData;
}

// Close import preview modal
function closeImportPreviewModal() {
  const modal = document.getElementById('importPreviewModal');
  if (modal) {
    modal.remove();
  }
  // Clean up
  if (window.importPreviewData) {
    delete window.importPreviewData;
  }
}

// Download CSV Template
function downloadCSVTemplate() {
  // Get custom columns to include in template
  const customCols = state.customColumns || [];
  
  // Define standard headers
  const standardHeaders = [
    '#',
    'PI',
    'Sprint',
    'Jira Story',
    'Description',
    'Jira Status',
    'Work Item 1 (SC)',
    'Work Item 2 (VC)',
    'DevOps Status',
    'DevOps ORG',
    'Comments',
    'Tags'
  ];
  
  // Add custom column headers
  const customHeaders = customCols.map(col => col.label);
  
  // Combine all headers
  const allHeaders = [...standardHeaders, ...customHeaders];
  
  // Create sample data row
  const sampleRow = [
    '1',
    '26',
    '1->2',
    '12345',
    'Sample description of the story',
    'Open',
    '1001',
    '1002',
    'Created',
    'PROD',
    'Sample comments',
    'Tag1, Tag2'
  ];
  
  // Add sample data for custom columns
  customCols.forEach(col => {
    if (col.type === 'select' && col.options && col.options.length > 0) {
      sampleRow.push(col.options[0]);
    } else if (col.type === 'date') {
      sampleRow.push('2026-02-25');
    } else if (col.type === 'number') {
      sampleRow.push('100');
    } else {
      sampleRow.push('Sample ' + col.label);
    }
  });
  
  // Create CSV content
  const csvRows = [];
  
  // Add headers
  csvRows.push(allHeaders.map(h => `"${h}"`).join(','));
  
  // Add sample row
  csvRows.push(sampleRow.map(v => `"${v}"`).join(','));
  
  // Add an empty row for user to fill
  csvRows.push(allHeaders.map(() => '""').join(','));
  
  const csvContent = csvRows.join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast('Template.csv downloaded successfully!', 'success');
}
