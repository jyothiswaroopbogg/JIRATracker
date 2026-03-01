// Notes Management - Improved version with color picker and tag checkboxes

let currentNoteColor = 'yellow';
let currentNoteTagsFilter = '';

function openNoteModal(){
  currentNoteColor = 'yellow';
  state.editingNoteId = null;
  document.getElementById('noteTitle').value = '';
  document.getElementById('noteContent').value = '';
  document.getElementById('noteSaveBtn').textContent = '💾 Save Note';
  document.querySelector('.note-editor-title').textContent = 'Create Note';
  applyNoteEditorColor('yellow');
  populateNoteRecordLinks();
  populateNoteTagsCheckboxes();
  document.getElementById('noteModal').classList.add('show');
  document.getElementById('noteTitle').focus();
}

function editNote(noteId){
  const note = state.notes.find(n => n.id === noteId);
  if(!note) return;
  
  state.editingNoteId = noteId;
  currentNoteColor = note.color || 'yellow';
  document.getElementById('noteTitle').value = note.title || '';
  document.getElementById('noteContent').value = note.content || '';
  document.getElementById('noteSaveBtn').textContent = '💾 Update Note';
  document.querySelector('.note-editor-title').textContent = 'Edit Note';
  applyNoteEditorColor(currentNoteColor);
  updateColorPickerStates();
  populateNoteTagsCheckboxes(noteId);
  populateNoteRecordLinks(noteId);
  
  document.getElementById('noteModal').classList.add('show');
  document.getElementById('noteTitle').focus();
}

function populateNoteRecordLinks(noteId = null){
  const container = document.getElementById('noteRecordsContainer');
  if(!container) return;
  
  const selectedRecords = [];
  if(noteId){
    const links = state.notesRecordLinks[String(noteId)] || state.notesRecordLinks[noteId] || {recordIds: []};
    selectedRecords.push(...(links.recordIds || []));
  }
  
  if(!state.records || state.records.length === 0){
    container.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px;">No records available</div>';
    return;
  }
  
  container.innerHTML = state.records.map((record, idx) => {
    const label = (record.jira ? 'TBCRM3-' + record.jira + ': ' : '') + (record.desc || 'Unnamed');
    const isChecked = selectedRecords.includes(String(record.id));
    const recordCheckId = 'note-record-' + idx;
    return `<label class="tag-select-item" for="${recordCheckId}" style="padding:8px;border:2px solid ${isChecked ? 'var(--accent)' : 'var(--border)'};background:${isChecked ? 'rgba(0,212,255,0.1)' : 'transparent'};border-radius:6px;cursor:pointer;"><input type="checkbox" id="${recordCheckId}" name="${recordCheckId}" value="${record.id}" ${isChecked ? 'checked' : ''} style="accent-color:var(--accent);"><span style="color:var(--text);font-weight:${isChecked ? '600' : '400'};font-size:12px;">${esc(label)}</span></label>`;
  }).join('');
}

function getNoteSelectedRecords(){
  const checkboxes = document.querySelectorAll('#noteRecordsContainer input[type="checkbox"]');
  return [...checkboxes].filter(c => c.checked).map(c => c.value);
}

function populateNoteTagsCheckboxes(noteId = null){
  const container = document.getElementById('noteTagsContainer');
  if(!container) return;
  
  const selectedTags = [];
  if(noteId && state.notes.find(n => n.id === noteId)){
    const note = state.notes.find(n => n.id === noteId);
    selectedTags.push(...(note.noteTags || []));
  }
  
  if(!state.tags || state.tags.length === 0){
    container.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px;">No tags available</div>';
    return;
  }
  
  container.innerHTML = state.tags.map((tag, idx) => {
    const tagName = typeof tag === 'string' ? tag : tag.name;
    const color = tag.color || '#94a3b8';
    const isChecked = selectedTags.includes(tagName);
    const tagId = 'note-tag-' + idx;
    return `<label class="tag-select-item" for="${tagId}" style="padding:8px;border:2px solid ${isChecked ? color : 'var(--border)'};background:${isChecked ? color + '20' : 'transparent'};border-radius:6px;cursor:pointer;"><input type="checkbox" id="${tagId}" name="${tagId}" value="${esc(tagName)}" ${isChecked ? 'checked' : ''} style="accent-color:${color};"><span style="color:${color};font-weight:${isChecked ? '600' : '400'}">${esc(tagName)}</span></label>`;
  }).join('');
}

function getNoteSelectedTags(){
  const checkboxes = document.querySelectorAll('#noteTagsContainer input[type="checkbox"]');
  return [...checkboxes].filter(c => c.checked).map(c => c.value);
}

function changeNoteColor(color){
  currentNoteColor = color;
  applyNoteEditorColor(color);
  updateColorPickerStates();
}

function applyNoteEditorColor(color){
  const editor = document.getElementById('noteEditorBox');
  editor.className = 'note-editor';
  if(color !== 'yellow') editor.classList.add('color-' + color);
}

function updateColorPickerStates(){
  const colorMap = {'yellow': '#fef3c7','pink': '#fce7f3','blue': '#dbeafe','green': '#dcfce7','purple': '#ede9fe','red': '#fee2e2'};
  document.querySelectorAll('.note-color-picker .color-dot').forEach(dot => {
    dot.classList.remove('active');
    const bgColor = dot.style.background;
    Object.entries(colorMap).forEach(([color, hexColor]) => {
      if(bgColor === hexColor && color === currentNoteColor) dot.classList.add('active');
    });
  });
}

function closeNoteModal(){
  document.getElementById('noteModal').classList.remove('show');
  state.editingNoteId = null;
}

function saveNote(){
  const title = document.getElementById('noteTitle').value;
  const content = document.getElementById('noteContent').value;
  const linkedRecordIds = getNoteSelectedRecords();
  const noteTags = getNoteSelectedTags();
  
  if(!title){ toast('Please enter a note title','error'); return; }
  if(!content){ toast('Please enter note content','error'); return; }
  
  if(state.editingNoteId){
    const note = state.notes.find(n => n.id === state.editingNoteId);
    if(note){
      note.title = title;
      note.content = content;
      note.color = currentNoteColor;
      note.lastModified = new Date().toISOString();
      note.noteTags = noteTags;
      if(!state.notesTimestamps[String(note.id)]){
        state.notesTimestamps[String(note.id)] = {createdOn: note.createdOn, lastModified: note.lastModified};
      } else {
        state.notesTimestamps[String(note.id)].lastModified = note.lastModified;
      }
      state.notesRecordLinks[String(note.id)] = {recordIds: linkedRecordIds};
      toast('Note updated successfully','success');
    }
  } else {
    const newNote = {
      id: Date.now(),
      title: title,
      content: content,
      color: currentNoteColor,
      createdOn: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      noteTags: noteTags
    };
    state.notes.unshift(newNote);
    state.notesTimestamps[String(newNote.id)] = {createdOn: newNote.createdOn,lastModified: newNote.lastModified};
    state.notesRecordLinks[String(newNote.id)] = {recordIds: linkedRecordIds};
    toast('Note created successfully','success');
  }
  
  saveState();
  closeNoteModal();
  state.notesCurrentPage = 1;
  currentNoteTagsFilter = '';
  renderNotes();
}

function deleteNote(noteId){
  if (!confirm('Delete this note?')) return;
  state.notes = state.notes.filter(n => n.id !== noteId);
  delete state.notesRecordLinks[String(noteId)];
  delete state.notesTimestamps[String(noteId)];
  saveState();
  renderNotes();
  toast('Note deleted','success');
}

function searchNotes(query){
  state.notesSearch = query.toLowerCase();
  state.notesCurrentPage = 1;
  renderNotes();
}

function filterNotesByTag(tag){
  currentNoteTagsFilter = tag;
  state.notesCurrentPage = 1;
  renderNotes();
}

function getFilteredNotes(){
  let filtered = state.notes;
  if(state.notesSearch){
    filtered = filtered.filter(note => note.title.toLowerCase().includes(state.notesSearch) || note.content.toLowerCase().includes(state.notesSearch));
  }
  if(currentNoteTagsFilter){
    filtered = filtered.filter(note => note.noteTags && note.noteTags.includes(currentNoteTagsFilter));
  }
  return filtered;
}

function renderNotes(){
  const filtered = getFilteredNotes();
  const total = filtered.length;
  const totalPages = Math.ceil(total / state.notesPerPage) || 1;
  if(state.notesCurrentPage > totalPages) state.notesCurrentPage = 1;
  const start = (state.notesCurrentPage - 1) * state.notesPerPage;
  const end = Math.min(start + state.notesPerPage, total);
  const page = filtered.slice(start, end);
  const grid = document.getElementById('notesGrid');
  
  if(page.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text3);"><div style="font-size:48px;margin-bottom:12px;opacity:0.3;">📝</div><div style="font-size:16px;font-weight:600;margin-bottom:6px;">No notes found</div><div style="font-size:13px;opacity:0.7;">Click "+ New Note" to create your first sticky note</div></div>';
  } else {
    grid.innerHTML = page.map(note => {
      const dateStr = new Date(note.createdOn).toLocaleString();
      const colorClass = note.color ? 'color-' + note.color : '';
      const preview = note.content.substring(0, 120) + (note.content.length > 120 ? '...' : '');
      const links = state.notesRecordLinks[String(note.id)] || state.notesRecordLinks[note.id] || {};
      const linkedRecords = links.recordIds && links.recordIds.length > 0 ? links.recordIds.map(rid => state.records.find(r => r.id == rid)).filter(r => r) : [];
      let linkedInfo = '';
      if(linkedRecords.length > 0){
        linkedInfo = '<div style="font-size:10px;margin-top:8px;padding:6px;background:rgba(0,212,255,0.1);border-radius:4px;color:#00d4ff;">🔗 Records (' + linkedRecords.length + '): ' + linkedRecords.map(r => esc((r.jira ? 'TBCRM3-' + r.jira : r.desc || 'Record').substring(0, 20))).join(', ') + '</div>';
      }
      let tagsHtml = '';
      if(note.noteTags && note.noteTags.length > 0){
        tagsHtml = '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;">';
        note.noteTags.forEach(tagName => {
          const tagObj = state.tags.find(t => (typeof t === 'string' ? t : t.name) === tagName);
          const color = tagObj && tagObj.color ? tagObj.color : '#00d4ff';
          tagsHtml += '<span style="font-size:9px;padding:2px 6px;border-radius:3px;background:' + color + '33;color:' + color + ';border:1px solid ' + color + '80;">' + esc(tagName) + '</span>';
        });
        tagsHtml += '</div>';
      }
      return '<div class="sticky-note ' + colorClass + '" onclick="editNote(' + note.id + ')"><div class="sticky-note-header"><div class="sticky-note-title">' + esc(note.title) + '</div><div class="sticky-note-date">' + esc(dateStr) + '</div></div><div class="sticky-note-content">' + esc(preview) + '</div>' + tagsHtml + linkedInfo + '<div class="sticky-note-footer"><div style="font-size:10px;color:#9ca3af;opacity:0.8;">' + note.content.split('\n').length + ' line' + (note.content.split('\n').length > 1 ? 's' : '') + '</div><div class="sticky-note-actions"><button class="sticky-note-btn" onclick="event.stopPropagation(); editNote(' + note.id + ')" title="Edit note">✏️</button><button class="sticky-note-btn delete" onclick="event.stopPropagation(); deleteNote(' + note.id + ')" title="Delete note">🗑</button></div></div></div>';
    }).join('');
  }
  renderNoteTagFilters();
  const pageInfo = document.getElementById('notePageInfo');
  if (pageInfo) pageInfo.textContent = page.length ? 'Showing ' + (start + 1) + '–' + end + ' of ' + total : '';
  renderNotePagination(totalPages);
}

function renderNoteTagFilters(){
  const tagFilterContainer = document.getElementById('noteTagFilters');
  if(!tagFilterContainer) return;
  let filterHtml = '<button class="tag-filter-btn' + (currentNoteTagsFilter === '' ? ' active' : '') + '" onclick="filterNotesByTag(\'\')">All Tags</button>';
  if(state.tags && state.tags.length > 0){
    state.tags.forEach(tag => {
      const tagName = typeof tag === 'string' ? tag : tag.name;
      const color = tag.color || '#94a3b8';
      const isActive = currentNoteTagsFilter === tagName;
      const activeStyles = isActive ? `background:${color};border-color:${color};color:var(--surface1);` : `background:transparent;border-color:${color};color:${color};`;
      filterHtml += '<button class="tag-filter-btn' + (isActive ? ' active' : '') + '" onclick="filterNotesByTag(\'' + esc(tagName) + '\')" style="' + activeStyles + '">' + esc(tagName) + '</button>';
    });
  }
  tagFilterContainer.innerHTML = filterHtml;
}

function renderNotePagination(totalPages){
  const btns = document.getElementById('notePageBtns');
  if (!btns) return;
  let html = '<button class="page-btn" onclick="changeNotePage(' + (state.notesCurrentPage - 1) + ')" ' + (state.notesCurrentPage === 1 ? 'disabled' : '') + '>‹</button>';
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= state.notesCurrentPage - 1 && i <= state.notesCurrentPage + 1)) {
      html += '<button class="page-btn ' + (i === state.notesCurrentPage ? 'active' : '') + '" onclick="changeNotePage(' + i + ')">' + i + '</button>';
    } else if (i === state.notesCurrentPage - 2 || i === state.notesCurrentPage + 2) {
      html += '<span class="page-ellipsis">...</span>';
    }
  }
  html += '<button class="page-btn" onclick="changeNotePage(' + (state.notesCurrentPage + 1) + ')" ' + (state.notesCurrentPage === totalPages ? 'disabled' : '') + '>›</button>';
  btns.innerHTML = html;
}

function changeNotePage(page){
  const filtered = getFilteredNotes();
  const totalPages = Math.ceil(filtered.length / state.notesPerPage) || 1;
  if (page < 1 || page > totalPages) return;
  state.notesCurrentPage = page;
  renderNotes();
}

function changeNotePerPage(val){
  state.notesPerPage = parseInt(val) || 10;
  state.notesCurrentPage = 1;
  renderNotes();
}

function exportNotesTXT(){
  const filtered = getFilteredNotes();
  if (filtered.length === 0) { toast('No notes to export', 'error'); return; }
  let txt = 'SPRINT TRACKER NOTES\n' + '='.repeat(60) + '\n\n';
  filtered.forEach((note, i) => {
    txt += 'Note ' + (i + 1) + ': ' + note.title + '\n';
    txt += 'Date: ' + new Date(note.createdOn).toLocaleString() + '\n';
    if (note.noteTags && note.noteTags.length > 0) txt += 'Tags: ' + note.noteTags.join(', ') + '\n';
    txt += '-'.repeat(60) + '\n' + note.content + '\n\n' + '='.repeat(60) + '\n\n';
  });
  const blob = new Blob([txt], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notes_' + new Date().toISOString().split('T')[0] + '.txt';
  a.click();
  URL.revokeObjectURL(url);
  toast('Notes exported as TXT', 'success');
}

function exportNotesPDF(){
  const filtered = getFilteredNotes();
  if (filtered.length === 0) { toast('No notes to export', 'error'); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Sprint Tracker Notes', 14, 20);
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString(), 14, 28);
  let y = 40;
  filtered.forEach((note, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text((i + 1) + '. ' + note.title, 14, y);
    y += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Date: ' + new Date(note.createdOn).toLocaleString(), 14, y);
    y += 5;
    if (note.noteTags && note.noteTags.length > 0) { doc.text('Tags: ' + note.noteTags.join(', '), 14, y); y += 5; }
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(note.content, 180);
    lines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 14, y);
      y += 5;
    });
    y += 10;
  });
  doc.save('notes_' + new Date().toISOString().split('T')[0] + '.pdf');
  toast('Notes exported as PDF', 'success');
}

function exportNotesAll(){
  exportNotesTXT();
  setTimeout(() => exportNotesPDF(), 500);
}

// Column Select Modal Functions
function openColumnSelectModal(){
  const notesFields = [
    {key:'title', label:'📌 Title'},
    {key:'content', label:'📝 Content'},
    {key:'createdOn', label:'📅 Created Date'},
    {key:'lastModified', label:'🕐 Last Modified'},
    {key:'noteTags', label:'🏷️ Tags'},
    {key:'linkedRecords', label:'🔗 Linked Records'},
    {key:'color', label:'🎨 Color'}
  ];
  
  // Initialize selected columns if not set
  if(!state.selectedExportColumns || !state.selectedExportColumns.notes || state.selectedExportColumns.notes.length === 0){
    if(!state.selectedExportColumns) state.selectedExportColumns = {};
    state.selectedExportColumns.notes = ['title', 'content', 'createdOn', 'noteTags'];
  }
  
  const list = document.getElementById('notesColumnList');
  if(!list) return;
  
  list.innerHTML = notesFields.map(field => {
    const isSelected = state.selectedExportColumns.notes.includes(field.key);
    const fieldId = 'notes-col-' + field.key;
    return `<label style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--surface3);border:1px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;transition:all 0.2s;" for="${fieldId}">
      <input type="checkbox" id="${fieldId}" name="${fieldId}" value="${esc(field.key)}" ${isSelected ? 'checked' : ''} onchange="updateNotesColumnSelection(this.value, this.checked)" style="accent-color:var(--accent);cursor:pointer;width:18px;height:18px;">
      <span style="font-size:12px;flex:1;color:var(--text);">${esc(field.label)}</span>
    </label>`;
  }).join('');
  
  const modal = document.getElementById('notesColumnSelectModal');
  if(modal) modal.classList.add('show');
}

function updateNotesColumnSelection(fieldKey, checked){
  if(!state.selectedExportColumns) state.selectedExportColumns = {};
  if(!state.selectedExportColumns.notes) state.selectedExportColumns.notes = [];
  
  if(checked){
    if(!state.selectedExportColumns.notes.includes(fieldKey)){
      state.selectedExportColumns.notes.push(fieldKey);
    }
  } else {
    state.selectedExportColumns.notes = state.selectedExportColumns.notes.filter(k => k !== fieldKey);
  }
}

function closeColumnSelectModal(){
  const modal = document.getElementById('notesColumnSelectModal');
  if(modal) modal.classList.remove('show');
}

// Import Modal Functions
function openImportModal(){
  const modal = document.getElementById('importNotesModal');
  if(modal) modal.classList.add('show');
}

function closeImportModal(){
  const modal = document.getElementById('importNotesModal');
  if(modal) modal.classList.remove('show');
}

function handleNotesFileSelect(event){
  const file = event.target.files[0];
  if(!file) return;
  
  // Check if it's a CSV file
  if (file.name.endsWith('.csv') || file.type === 'text/csv') {
    closeImportModal();
    processNotesCSVImportFile(file);
  } else {
    // Fallback to text import for backward compatibility
    const reader = new FileReader();
    reader.onload = function(e){
      try {
        const content = e.target.result;
        importNotesFromText(content);
      } catch(err){
        toast('Error reading file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    closeImportModal();
  }
  
  // Reset input
  event.target.value = '';
}

// Handle drag over for notes import
function handleNotesImportDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.add('drag-over');
}

// Handle drag leave for notes import
function handleNotesImportDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.remove('drag-over');
}

// Handle drop for notes import
function handleNotesImportDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  event.currentTarget.classList.remove('drag-over');
  
  const files = event.dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      closeImportModal();
      processNotesCSVImportFile(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      closeImportModal();
      const reader = new FileReader();
      reader.onload = function(e){
        try {
          const content = e.target.result;
          importNotesFromText(content);
        } catch(err){
          toast('Error reading file: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    } else {
      toast('Please select a CSV or TXT file', 'error');
    }
  }
}

// Process notes CSV import file
function processNotesCSVImportFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const lines = e.target.result.split('\n').map(l => l.trim()).filter(l => l);
      if (!lines.length) {
        toast('Empty file', 'error');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
      
      // Build key mapping for notes fields
      const keyMap = {
        '#': '_rownum',
        'title': 'title',
        'content': 'content',
        'color': 'color',
        'tags': 'tags'
      };
      
      const imported = [];
      const baseTimestamp = Date.now();
      
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
        
        const note = {id: baseTimestamp + (i * 100), _selected: false};
        let tagValue = '';
        
        headers.forEach((h, j) => {
          const k = keyMap[h];
          const val = vals[j] ? vals[j].replace(/^"|"$/g, '').replace(/""/g, '"') : '';
          
          if (k === 'tags') {
            tagValue = val;
          } else if (k && k !== '_rownum') {
            note[k] = val;
          }
        });
        
        // Process tags
        if (tagValue) {
          const tagNames = tagValue.split(',').map(t => t.trim()).filter(t => t);
          note.noteTags = tagNames;
        } else {
          note.noteTags = [];
        }
        
        // Set random color if not provided or invalid
        if (!note.color || !['yellow', 'pink', 'blue', 'green', 'purple', 'red'].includes(note.color)) {
          note.color = getRandomNoteColor();
        }
        
        // Add timestamps
        note.createdOn = new Date().toISOString();
        note.lastModified = new Date().toISOString();
        
        imported.push(note);
      }
      
      // Show import preview modal
      openNotesImportPreviewModal(imported);
    } catch (err) {
      toast('Import error: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

// Open notes import preview modal
function openNotesImportPreviewModal(notes) {
  // Store imported data temporarily
  window.importNotesPreviewData = notes;
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'importNotesPreviewModal';
  
  // Create preview table
  let tableHTML = `
    <div style="max-height:400px;overflow:auto;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:16px;">
      <table style="width:100%;border-collapse:collapse;">
        <thead style="position:sticky;top:0;background:var(--surface);z-index:10;">
          <tr style="background:var(--surface2);">
            <th style="padding:8px;border:1px solid var(--border);text-align:center;min-width:50px;">
              <input type="checkbox" id="selectAllNotesImport" onchange="toggleAllNotesImportSelection(this.checked)" style="cursor:pointer;">
            </th>
            <th style="padding:8px;border:1px solid var(--border);text-align:left;font-size:11px;color:var(--text);white-space:nowrap;min-width:200px;">Title</th>
            <th style="padding:8px;border:1px solid var(--border);text-align:left;font-size:11px;color:var(--text);white-space:nowrap;min-width:300px;">Content</th>
            <th style="padding:8px;border:1px solid var(--border);text-align:left;font-size:11px;color:var(--text);white-space:nowrap;min-width:100px;">Color</th>
            <th style="padding:8px;border:1px solid var(--border);text-align:left;font-size:11px;color:var(--text);white-space:nowrap;min-width:150px;">Tags</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  // Add data rows
  notes.forEach((note, idx) => {
    const rowBg = idx % 2 === 0 ? 'var(--surface)' : 'var(--surface2)';
    const tagsDisplay = (note.noteTags || []).join(', ');
    
    tableHTML += `
      <tr style="background:${rowBg};">
        <td style="padding:8px;border:1px solid var(--border);text-align:center;">
          <input type="checkbox" class="import-note-checkbox" data-index="${idx}" onchange="updateNotesImportSelection()" style="cursor:pointer;">
        </td>
        <td style="padding:8px;border:1px solid var(--border);font-size:12px;color:var(--text2);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(note.title || '')}">${esc(note.title || '')}</td>
        <td style="padding:8px;border:1px solid var(--border);font-size:12px;color:var(--text2);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(note.content || '')}">${esc(note.content || '')}</td>
        <td style="padding:8px;border:1px solid var(--border);font-size:12px;color:var(--text2);">${esc(note.color || 'yellow')}</td>
        <td style="padding:8px;border:1px solid var(--border);font-size:12px;color:var(--text2);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${esc(tagsDisplay)}">${esc(tagsDisplay)}</td>
      </tr>
    `;
  });
  
  tableHTML += '</tbody></table></div>';
  
  overlay.innerHTML = `
    <div class="modal" style="max-width:900px;">
      <div class="modal-header">
        <div class="modal-title">📥 Import Notes Preview</div>
        <button class="modal-close" onclick="closeNotesImportPreviewModal()">×</button>
      </div>
      <div style="padding:20px;">
        <div style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.3);border-radius:var(--radius-sm);padding:12px;margin-bottom:16px;">
          <div style="font-size:12px;color:var(--text2);">
            <strong style="color:var(--accent);">📊 Found ${notes.length} notes</strong> in the file. Select the notes you want to import and click Import Selected.
          </div>
        </div>
        ${tableHTML}
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--surface2);border-radius:var(--radius-sm);">
          <div style="font-size:13px;color:var(--text2);">
            <strong id="importNotesSelectedCount" style="color:var(--accent);">0</strong> notes selected
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-secondary btn-sm" onclick="selectAllNotesImport()">✓ Select All</button>
            <button class="btn btn-secondary btn-sm" onclick="deselectAllNotesImport()">✕ Deselect All</button>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeNotesImportPreviewModal()">Cancel</button>
        <button class="btn btn-primary" id="importNotesSelectedBtn" onclick="importSelectedNotes()" disabled style="opacity:0.5;">📥 Import Selected</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  updateNotesImportSelection();
}

// Toggle all notes import selection
function toggleAllNotesImportSelection(checked) {
  const checkboxes = document.querySelectorAll('.import-note-checkbox');
  checkboxes.forEach(cb => cb.checked = checked);
  updateNotesImportSelection();
}

// Select all notes
function selectAllNotesImport() {
  document.getElementById('selectAllNotesImport').checked = true;
  toggleAllNotesImportSelection(true);
}

// Deselect all notes
function deselectAllNotesImport() {
  document.getElementById('selectAllNotesImport').checked = false;
  toggleAllNotesImportSelection(false);
}

// Update notes import selection count
function updateNotesImportSelection() {
  const checkboxes = document.querySelectorAll('.import-note-checkbox');
  const selectedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
  
  const countEl = document.getElementById('importNotesSelectedCount');
  const importBtn = document.getElementById('importNotesSelectedBtn');
  
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
  const selectAllCb = document.getElementById('selectAllNotesImport');
  if (selectAllCb) {
    selectAllCb.checked = selectedCount === checkboxes.length && checkboxes.length > 0;
  }
}

// Import selected notes
function importSelectedNotes() {
  if (!window.importNotesPreviewData) {
    toast('Import data not found', 'error');
    return;
  }
  
  const checkboxes = document.querySelectorAll('.import-note-checkbox');
  const selectedIndices = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => parseInt(cb.getAttribute('data-index')));
  
  if (selectedIndices.length === 0) {
    toast('No notes selected', 'error');
    return;
  }
  
  const notes = window.importNotesPreviewData;
  const selectedNotes = selectedIndices.map(idx => notes[idx]);
  
  // Get valid tag names from state
  const validTagNames = (state.tags || []).map(tag => typeof tag === 'string' ? tag : tag.name);
  
  // Add selected notes to state
  const baseTimestamp = Date.now();
  selectedNotes.forEach((note, index) => {
    // Generate unique ID with sufficient spacing to avoid collisions
    const newId = baseTimestamp + (index * 100);
    
    // Filter tags to only include those that exist in configuration
    const filteredTags = (note.noteTags || []).filter(tagName => validTagNames.includes(tagName));
    
    const newNote = {
      id: newId,
      title: note.title || 'Untitled',
      content: note.content || '',
      color: note.color || getRandomNoteColor(),
      createdOn: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      noteTags: filteredTags
    };
    
    state.notes.unshift(newNote);
    state.notesTimestamps[String(newId)] = {
      createdOn: newNote.createdOn,
      lastModified: newNote.lastModified
    };
    state.notesRecordLinks[String(newId)] = {recordIds: []};
  });
  
  saveState();
  renderNotes();
  
  closeNotesImportPreviewModal();
  toast(`Imported ${selectedNotes.length} notes successfully`, 'success');
  
  // Clean up
  delete window.importNotesPreviewData;
}

// Close notes import preview modal
function closeNotesImportPreviewModal() {
  const modal = document.getElementById('importNotesPreviewModal');
  if (modal) {
    modal.remove();
  }
  // Clean up
  if (window.importNotesPreviewData) {
    delete window.importNotesPreviewData;
  }
}

// Download Notes CSV Template
function downloadNotesCSVTemplate() {
  // Define headers for notes
  const headers = ['#', 'Title', 'Content', 'Color', 'Tags'];
  
  // Create sample data rows
  const sampleRow1 = [
    '1',
    'Sample Note 1',
    'This is a sample note content. You can write your notes here.',
    'yellow',
    'Important, Work'
  ];
  
  // Create CSV content
  const csvRows = [];
  
  // Add headers
  csvRows.push(headers.map(h => `"${h}"`).join(','));
  
  // Add sample rows
  csvRows.push(sampleRow1.map(v => `"${v}"`).join(','));
  
  // Add an empty row for user to fill
  csvRows.push(headers.map(() => '""').join(','));
  
  const csvContent = csvRows.join('\n');
  
  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'Notes_Template.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast('Notes Template.csv downloaded successfully!', 'success');
}

// Download Notes TXT Template
function downloadNotesTXTTemplate() {
  // Get available tags for the template
  const availableTags = state.tags && state.tags.length > 0 
    ? state.tags.map(t => typeof t === 'string' ? t : t.name).slice(0, 3).join(', ')
    : 'Bug, Enhancement, Task';
  
  // Create TXT template content
  const txtContent = `SPRINT TRACKER NOTES\n==========================
${'='.repeat(60)}

INSTRUCTIONS:
- Each note starts with: NOTE: Your Title Here
- Add tags with: TAGS: tag1, tag2, tag3
- Add linked records with: LINKED_RECORDS: recordId1, recordId2
- Write your note content on the following lines
- Available tags in your system: ${availableTags}
- Leave blank lines between notes for clarity

${'='.repeat(60)}

NOTE: Sample Note 1
TAGS: Important, Work
LINKED_RECORDS: 
This is a sample note content. You can write your notes here.
Add multiple lines of content as needed.
Each line will be preserved in the imported note.

${'='.repeat(60)}

NOTE: Your Note Title Here
TAGS: 
LINKED_RECORDS: 
Write your note content here...

${'='.repeat(60)}
`;
  
  // Create blob and download
  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'Notes_Template.txt');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast('Notes Template.txt downloaded successfully!', 'success');
}

function importNotesFromText(content){
  // Parse notes from text format
  const lines = content.split('\n');
  let noteCount = 0;
  let currentNote = null;
  
  for(const line of lines){
    const trimmed = line.trim();
    if(!trimmed) continue;
    
    if(trimmed.startsWith('NOTE:')){
      if(currentNote) {
        saveImportedNote(currentNote);
        noteCount++;
      }
      currentNote = {title: trimmed.replace('NOTE:', '').trim(), content: '', tags: [], recordIds: []};
    } else if(trimmed.startsWith('TAGS:')){
      if(currentNote){
        const tagsStr = trimmed.replace('TAGS:', '').trim();
        currentNote.tags = tagsStr.split(',').map(t => t.trim()).filter(t => state.tags.some(st => (typeof st === 'string' ? st : st.name) === t));
      }
    } else if(trimmed.startsWith('LINKED_RECORDS:')){
      if(currentNote){
        const idsStr = trimmed.replace('LINKED_RECORDS:', '').trim();
        currentNote.recordIds = idsStr.split(',').map(id => parseInt(id.trim())).filter(id => state.records.some(r => r.id === id));
      }
    } else {
      if(currentNote && currentNote.content.length < 5000){
        currentNote.content += (currentNote.content ? '\n' : '') + line;
      }
    }
  }
  
  if(currentNote) {
    saveImportedNote(currentNote);
    noteCount++;
  }
  
  saveState();
  renderNotes();
  toast(`Imported ${noteCount} notes successfully`, 'success');
}

function saveImportedNote(noteData){
  if(!noteData.title || !noteData.content) return;
  
  // Generate unique ID using timestamp
  const newId = Date.now() + state.notes.length;
  
  const newNote = {
    id: newId,
    title: noteData.title.substring(0, 100),
    content: noteData.content,
    color: getRandomNoteColor(),
    createdOn: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    noteTags: noteData.tags || []
  };
  
  state.notes.push(newNote);
  state.notesRecordLinks[String(newNote.id)] = {recordIds: noteData.recordIds || []};
  state.notesTimestamps[String(newNote.id)] = {createdOn: newNote.createdOn, lastModified: newNote.lastModified};
}

function esc(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Get random note color for imports
function getRandomNoteColor() {
  const colors = ['yellow', 'pink', 'blue', 'green', 'purple', 'red'];
  return colors[Math.floor(Math.random() * colors.length)];
}
