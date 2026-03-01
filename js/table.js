// Table Rendering and Management

// Get Filtered Records
function getFiltered() {
  // Check if applyFiltersToRecords exists (from filters.js)
  let filtered;
  if (typeof applyFiltersToRecords === 'function') {
    filtered = applyFiltersToRecords(state.records);
  } else {
    // Fallback to simple search
    const q = state.searchQuery.toLowerCase();
    filtered = !q ? [...state.records] : state.records.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
  }
  
  // Apply sorting if sortBy is set
  if (state.sortBy) {
    filtered.sort((a, b) => {
      const aVal = a[state.sortBy] || '';
      const bVal = b[state.sortBy] || '';
      
      // Handle numeric values
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return state.sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Handle string values
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (state.sortOrder === 'asc') {
        return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
      } else {
        return bStr < aStr ? -1 : bStr > aStr ? 1 : 0;
      }
    });
  }
  
  return filtered;
}

// Render Table Header
function renderTableHeader() {
  const tr = document.getElementById('tableHead');
  if (!tr) return;
  
  // Merge system and custom columns with their metadata
  const allColumns = [
    ...state.columns.map(c => ({...c, isCustom: false, sortKey: c.key})),
    ...state.customColumns.map(c => ({...c, isCustom: true, sortKey: 'cc_' + c.key}))
  ];
  
  // Sort all columns by order, then filter visible ones
  const sortedCols = allColumns.sort((a, b) => (a.order || 999) - (b.order || 999));
  const visCols = sortedCols.filter(c => c.visible);
  
  // Add checkbox column header
  const checkboxHeader = '<th class="bulk-checkbox-cell"><label for="selectAllCheckbox" style="display:none;">Select All Records</label><input type="checkbox" id="selectAllCheckbox" name="selectAllCheckbox" class="bulk-checkbox" onchange="selectAllRecords(this.checked)" aria-label="Select all records"></th>';
  
  // Generate sortable headers with arrows (3 states: asc, desc, none)
  const getSortArrow = (key) => {
    if (state.sortBy !== key) return '<span class="sort-arrow">⇅</span>';
    return state.sortOrder === 'asc' ? '<span class="sort-arrow active">▲</span>' : '<span class="sort-arrow active">▼</span>';
  };
  
  // Custom header display: sprint_start shows as "Sprint" in table but "Sprint Start" in Column Visibility
  const getHeaderLabel = (col) => {
    if (col.key === 'sprint_start') return 'Sprint';
    return col.label;
  };
  
  const headers = visCols.map(c => '<th class="sortable-header" onclick="sortTable(\'' + c.sortKey + '\')" ><span>' + getHeaderLabel(c) + '</span>' + getSortArrow(c.sortKey) + '</th>').join('');
  
  tr.innerHTML = checkboxHeader + '<th>#</th>' + headers + '<th class="sticky-actions-header">Actions</th>';
}

// Render Table Body
function renderTable() {
  renderTableHeader();
  const filt = getFiltered();
  const total = filt.length;
  const totalPages = Math.ceil(total / state.perPage) || 1;
  if (state.currentPage > totalPages) state.currentPage = 1;
  const start = (state.currentPage - 1) * state.perPage;
  const end = Math.min(start + state.perPage, total);
  const page = filt.slice(start, end);
  
  // Merge system and custom columns with their metadata
  const allColumns = [
    ...state.columns.map(c => ({...c, isCustom: false})),
    ...state.customColumns.map(c => ({...c, isCustom: true}))
  ];
  
  // Sort all columns by order, then filter visible ones
  const sortedCols = allColumns.sort((a, b) => (a.order || 999) - (b.order || 999));
  const visCols = sortedCols.filter(c => c.visible);

  const tbody = document.getElementById('tableBody');
  if (!page.length) {
    tbody.innerHTML = '<tr><td colspan="20"><div class="empty-state"><div class="empty-icon">📋</div><div>No records found. Add your first entry above!</div></div></td></tr>';
  } else {
    tbody.innerHTML = page.map((r, i) => {
      const isSelected = state.selectedRecords && state.selectedRecords.includes(r.id);
      const checkbox = '<td class="bulk-checkbox-cell"><label for="bulk-' + r.id + '" style="display:none;">Select record ' + r.id + '</label><input type="checkbox" id="bulk-' + r.id + '" name="bulk-' + r.id + '" class="bulk-checkbox" ' + (isSelected ? 'checked' : '') + ' onchange="toggleRecordSelection(' + r.id + ', this.checked)" aria-label="Select record"></td>';
      
      const cells = visCols.map(col => {
        // Handle custom columns
        if (col.isCustom) {
          const val = r['cc_' + col.key];
          if (!val || val === '') return '<td style="font-size:12px">—</td>';
          
          // Format based on column type
          if (col.type === 'url') {
            return '<td style="font-size:12px;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><a href="' + esc(val) + '" target="_blank" rel="noopener noreferrer" style="color:var(--accent);text-decoration:underline;" title="' + esc(val) + '">' + esc(val) + '</a></td>';
          } else if (col.type === 'email') {
            return '<td style="font-size:12px"><a href="mailto:' + esc(val) + '" style="color:var(--accent);text-decoration:underline;" title="' + esc(val) + '">' + esc(val) + '</a></td>';
          } else if (col.type === 'date') {
            // Format date for better display - parse as local date to avoid timezone issues
            try {
              // Parse YYYY-MM-DD as local date
              const parts = val.split('-');
              if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // Month is 0-indexed
                const day = parseInt(parts[2]);
                const date = new Date(year, month, day);
                const formatted = date.toLocaleDateString();
                return '<td style="font-size:12px" title="' + esc(val) + '">' + esc(formatted) + '</td>';
              }
              return '<td style="font-size:12px">' + esc(val) + '</td>';
            } catch (e) {
              return '<td style="font-size:12px">' + esc(val) + '</td>';
            }
          } else if (col.type === 'longtext') {
            return '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px" title="' + esc(val) + '">' + esc(val) + '</td>';
          } else {
            return '<td style="font-size:12px">' + esc(val) + '</td>';
          }
        }
        
        // Handle system columns
        if (col.key === 'jira') return '<td>' + (formatJira(r.jira) || '—') + '</td>';
        if (col.key === 'wi1') return renderWorkItemsCell(r.id, r.wi1, 'wi1');
        if (col.key === 'wi2') return renderWorkItemsCell(r.id, r.wi2, 'wi2');
        if (col.key === 'jstatus') return '<td>' + getJiraBadge(r.jstatus) + '</td>';
        if (col.key === 'dstatus') return '<td>' + getDevopsBadge(r.dstatus) + '</td>';
        if (col.key === 'dorg') return '<td>' + getOrgBadge(r.dorg) + '</td>';
        if (col.key === 'tags') return '<td>' + (typeof renderRecordTags === 'function' ? renderRecordTags(r.id) : '—') + '</td>';
        if (col.key === 'timestamps') return '<td>' + (typeof renderTableTimestamp === 'function' ? renderTableTimestamp(r) : '—') + '</td>';
        if (col.key === 'desc' || col.key === 'comments') return '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px" title="' + esc(r[col.key] || '') + '">' + esc(r[col.key] || '—') + '</td>';
        if (col.key === 'pi') return '<td><span style="font-size:12px;color:var(--accent3)">' + esc(r.pi || '—') + '</span></td>';
        if (col.key === 'sprint_start') return '<td><span style="font-size:12px;color:var(--text2)">' + esc(formatSprintDisplay(r.sprint_start, r.sprint_end)) + '</span></td>';
        if (col.key === 'sprint_end') return '<td><span style="font-size:12px;color:var(--text2)">' + esc(r.sprint_end || '—') + '</span></td>';
        return '<td><span style="font-size:12px">' + esc(r[col.key] || '—') + '</span></td>';
      }).join('');
      
      const absIdx = start + i;
      const linkedCount = (state.recordLinks[r.id] || []).length;
      const linkBadge = linkedCount > 0 ? '<span style="position:absolute;top:-4px;right:-4px;background:var(--accent3);color:var(--bg);font-size:9px;font-weight:bold;padding:2px 4px;border-radius:8px;">' + linkedCount + '</span>' : '';
      return '<tr>' + checkbox + '<td style="color:var(--text3);font-size:11px">' + (absIdx + 1) + '</td>' + cells + '<td class="sticky-actions-cell"><div class="td-actions"><button class="btn btn-secondary btn-sm" style="position:relative;" onclick="openLinkModal(' + absIdx + ')" title="Link Records">🔗' + linkBadge + '</button><button class="btn btn-secondary btn-sm" onclick="editRecord(' + absIdx + ')" title="Edit">✏️</button><button class="btn btn-danger btn-sm" onclick="deleteRecord(' + absIdx + ')" title="Delete">🗑</button></div></td></tr>';
    }).join('');
  }

  document.getElementById('tableInfo').textContent = 'Showing ' + (total ? start + 1 : 0) + '–' + end + ' of ' + total + ' records';
  document.getElementById('pageInfo').textContent = 'Page ' + state.currentPage + ' of ' + totalPages;
  renderPagination(totalPages);
  
  // Update select all checkbox and bulk operations bar
  if (typeof updateSelectAllCheckbox === 'function') updateSelectAllCheckbox();
  if (typeof updateBulkOperationsBar === 'function') updateBulkOperationsBar();
}

// Search Table
function searchTable(v) {
  state.searchQuery = v;
  state.currentPage = 1;
  renderTable();
}

// Sort Table (3 states: asc -> desc -> none)
function sortTable(columnKey) {
  if (state.sortBy === columnKey) {
    // Cycle through states: asc -> desc -> none
    if (state.sortOrder === 'asc') {
      state.sortOrder = 'desc';
    } else if (state.sortOrder === 'desc') {
      // Reset to original order
      state.sortBy = null;
      state.sortOrder = 'asc';
    }
  } else {
    // Set new sort column to ascending
    state.sortBy = columnKey;
    state.sortOrder = 'asc';
  }
  renderTable();
}

// Change Per Page
function changePerPage(v) {
  state.perPage = parseInt(v);
  state.currentPage = 1;
  renderTable();
}
