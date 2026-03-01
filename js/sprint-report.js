// Sprint Report Generator Functionality

// Format Sprint Display for PDF (uses -> instead of → for better PDF compatibility)
function formatSprintDisplayForPDF(sprintStart, sprintEnd) {
  if (!sprintStart && !sprintEnd) return '-';
  if (!sprintStart) return sprintEnd || '-';
  if (!sprintEnd || sprintEnd === '' || sprintEnd === sprintStart) return sprintStart;
  return sprintStart + '->' + sprintEnd;
}

// Format Jira number for PDF report
function formatJiraForPDF(num) {
  if (!num) return '-';
  const n = String(num).split('-').pop().replace(/\D/g, '');
  if (!n) return '-';
  return state.jiraDisplayFormat.replace('{number}', n);
}

// Get Jira URL for PDF hyperlink
function getJiraUrlForPDF(num) {
  if (!num) return null;
  const n = String(num).split('-').pop().replace(/\D/g, '');
  if (!n) return null;
  const display = state.jiraDisplayFormat.replace('{number}', n);
  return state.jiraUrlTemplate.replace('{formatted}', display).replace('{number}', n);
}

// Format Work Item number for PDF report
function formatWIForPDF(numStr) {
  if (!numStr) return '-';
  
  // Handle multiple work items (comma-separated)
  const numbers = typeof parseWorkItems === 'function' ? parseWorkItems(numStr) : [parseInt(String(numStr).replace(/\D/g, ''))];
  
  if (numbers.length === 0) return '-';
  
  return numbers.map(n => {
    if (isNaN(n)) return '-';
    const p = String(n).padStart(6, '0');
    return state.wiDisplayFormat.replace('{number6}', p).replace('{number}', n);
  }).join(', ');
}

// Get Work Item URL for PDF hyperlink (returns first work item only for clickable link)
function getWIUrlForPDF(numStr) {
  if (!numStr) return null;
  
  // Get first work item for the hyperlink
  const numbers = typeof parseWorkItems === 'function' ? parseWorkItems(numStr) : [parseInt(String(numStr).replace(/\D/g, ''))];
  
  if (numbers.length === 0) return null;
  
  const n = numbers[0];
  if (isNaN(n)) return null;
  const p = String(n).padStart(6, '0');
  return state.wiUrlTemplate.replace('{formatted}', p).replace('{number}', n);
}

// Generate sprint report PDF
function generateSprintReport(sprintKey) {
  if (!window.jspdf) {
    toast('PDF library not available', 'error');
    return;
  }
  
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  // Get sprint data
  const sprints = extractSprintsFromRecords();
  const sprint = sprints.find(s => s.key === sprintKey);
  
  if (!sprint) {
    toast('Sprint not found', 'error');
    return;
  }
  
  // Get sprint records
  const sprintRecords = state.records.filter(r => {
    const pi = r.pi || 'No PI';
    const recordKey = `${pi}|${r.sprint_start}`;
    return recordKey === sprintKey;
  });
  
  // Get sprint notes
  const sprintNotes = [];
  
  if (state.notes && state.notesRecordLinks) {
    state.notes.forEach(note => {
      const noteLinks = state.notesRecordLinks[note.id];
      const linkedRecordIds = noteLinks?.recordIds || [];
      
      if (linkedRecordIds && linkedRecordIds.length > 0) {
        const hasSprintRecord = linkedRecordIds.some(recordId => {
          // Handle both string and number IDs
          const record = state.records.find(r => r.id == recordId || String(r.id) === String(recordId));
          if (record) {
            const pi = record.pi || 'No PI';
            const recordKey = `${pi}|${record.sprint_start}`;
            return recordKey === sprintKey;
          }
          return false;
        });
        if (hasSprintRecord) {
          sprintNotes.push(note);
        }
      }
    });
  }
  
  // Calculate sprint progress
  const progress = calculateSprintProgress(sprint);
  
  // Page setup
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  // Header - Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 212, 255);
  doc.text('Sprint Report', margin, yPos);
  
  yPos += 8;
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  const sprintName = sprint.key.includes('|') ? sprint.key.split('|')[1] : sprint.name;
  doc.text('Pi ' + sprint.pi + ' - Sprint ' + sprintName, margin, yPos);
  
  yPos += 10;
  
  // Sprint Info Box
  doc.setFillColor(245, 247, 250);
  doc.rect(margin, yPos, contentWidth, 30, 'F');
  
  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  
  // Sprint dates
  if (sprint.startDate && sprint.endDate) {
    doc.text('Sprint Duration:', margin + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(sprint.startDate) + ' - ' + formatDate(sprint.endDate), margin + 40, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Status:', margin + 5, yPos);
    doc.setFont('helvetica', 'normal');
    
    const statusText = progress.status === 'upcoming' ? 'Upcoming' : 
                       progress.status === 'active' ? 'Active' : 
                       progress.status === 'completed' ? 'Completed' : 'Unknown';
    doc.text(statusText, margin + 40, yPos);
    
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Progress:', margin + 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(progress.percentage + '% (' + progress.elapsedDays + '/' + progress.totalDays + ' days)', margin + 40, yPos);
  } else {
    doc.text('No dates set for this sprint', margin + 5, yPos);
  }
  
  yPos += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Generated:', margin + 5, yPos);
  doc.setFont('helvetica', 'normal');
  const genDate = new Date();
  const genDateStr = genDate.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  doc.text(genDateStr, margin + 40, yPos);
  
  yPos += 15;
  
  // Statistics Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Sprint Statistics', margin, yPos);
  
  yPos += 8;
  
  // Stats boxes
  const statBoxWidth = (contentWidth - 10) / 3;
  const statBoxHeight = 20;
  
  // Total Stories
  doc.setFillColor(59, 130, 246, 30);
  doc.rect(margin, yPos, statBoxWidth, statBoxHeight, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Total Stories', margin + 3, yPos + 6);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(59, 130, 246);
  doc.text(sprint.storyCount.toString(), margin + 3, yPos + 15);
  
  // Completed Stories
  const completedCount = sprintRecords.filter(r => 
    r.jiraStatus && (r.jiraStatus.toLowerCase().includes('done') || 
                     r.jiraStatus.toLowerCase().includes('closed') || 
                     r.jiraStatus.toLowerCase().includes('completed'))
  ).length;
  
  doc.setFillColor(34, 197, 94, 30);
  doc.rect(margin + statBoxWidth + 5, yPos, statBoxWidth, statBoxHeight, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Completed', margin + statBoxWidth + 8, yPos + 6);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 197, 94);
  doc.text(completedCount.toString(), margin + statBoxWidth + 8, yPos + 15);
  
  // Notes
  doc.setFillColor(168, 85, 247, 30);
  doc.rect(margin + (statBoxWidth * 2) + 10, yPos, statBoxWidth, statBoxHeight, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Notes', margin + (statBoxWidth * 2) + 13, yPos + 6);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(168, 85, 247);
  doc.text(sprintNotes.length.toString(), margin + (statBoxWidth * 2) + 13, yPos + 15);
  
  yPos += statBoxHeight + 12;
  
  // Status Distribution
  const statusDistribution = {};
  sprintRecords.forEach(r => {
    const status = r.jstatus || 'Unknown';
    statusDistribution[status] = (statusDistribution[status] || 0) + 1;
  });
  
  if (Object.keys(statusDistribution).length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Status Distribution', margin, yPos);
    
    yPos += 6;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    Object.entries(statusDistribution).forEach(([status, count]) => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }
      
      const percentage = Math.round((count / sprintRecords.length) * 100);
      doc.text('- ' + status + ': ' + count + ' (' + percentage + '%)', margin + 3, yPos);
      yPos += 5;
    });
    
    yPos += 5;
  }
  
  // Notes Section - After Status Distribution
  if (sprintNotes.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Sprint Notes (' + sprintNotes.length + ')', margin, yPos);
    
    yPos += 8;
    
    sprintNotes.forEach((note, index) => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      // Note header with index
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, yPos - 4, contentWidth, 8, 'F');
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 200);
      const noteTitle = (note.title || 'Untitled Note');
      doc.text((index + 1) + '. ' + noteTitle, margin + 2, yPos);
      yPos += 8;
      
      // Note metadata
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      // Created date
      if (note.createdOn) {
        const createdDate = new Date(note.createdOn);
        doc.text('Created: ' + createdDate.toLocaleString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }), margin + 2, yPos);
        yPos += 4;
      }
      
      // Linked stories
      const noteLinks = state.notesRecordLinks?.[note.id];
      const linkedRecordIds = noteLinks?.recordIds || [];
      if (linkedRecordIds && linkedRecordIds.length > 0) {
        const linkedStories = linkedRecordIds.map(recordId => {
          // Handle both string and number IDs
          const record = state.records.find(r => r.id == recordId || String(r.id) === String(recordId));
          if (record && record.jira) {
            return 'TBCRM3-' + record.jira;
          }
          return 'Unknown';
        }).join(', ');
        doc.text('Linked Stories: ' + linkedStories, margin + 2, yPos);
        yPos += 4;
      }
      
      // Note tags
      if (note.noteTags && note.noteTags.length > 0) {
        doc.text('Tags: ' + note.noteTags.join(', '), margin + 2, yPos);
        yPos += 4;
      }
      
      yPos += 2;
      
      // Note content
      if (note.content) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        
        // Clean and split content
        const noteContent = note.content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        const splitContent = doc.splitTextToSize(noteContent, contentWidth - 4);
        
        // Limit content display if too long
        const maxLines = 15;
        const contentToDisplay = splitContent.slice(0, maxLines);
        
        contentToDisplay.forEach(line => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(line, margin + 2, yPos);
          yPos += 4;
        });
        
        if (splitContent.length > maxLines) {
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(120, 120, 120);
          doc.text('...content truncated', margin + 2, yPos);
          yPos += 4;
        }
      }
      
      yPos += 6;
    });
  }
  
  // Stories Table - Always on new page with landscape orientation
  doc.addPage();
  
  // Force the current page to be landscape by directly setting the page size
  const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
  doc.internal.pageSize.width = 297;
  doc.internal.pageSize.height = 210;
  
  yPos = 20;
  
  const landscapePageWidth = 297;
  const landscapePageHeight = 210;
  const landscapeMargin = 10;
  const landscapeContentWidth = landscapePageWidth - (landscapeMargin * 2);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Sprint Stories', landscapeMargin, yPos);
  
  yPos += 8;
  
  if (sprintRecords.length > 0) {
    // Get all visible columns (system + custom) with isCustom flag
    // Exclude sprint_end from PDF - Sprint column shows combined value
    const systemColumns = (state.columns || [])
      .filter(col => col.visible && col.key !== 'sprint_end')
      .map(col => ({...col, isCustom: false}));
    
    const customColumns = (state.customColumns || [])
      .filter(col => col.visible)
      .map(col => ({...col, isCustom: true}));
    
    const allColumns = [...systemColumns, ...customColumns]
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    
    // Build table headers - use "Sprint" for sprint_start column in PDF (consistent with exports)
    const headers = allColumns.map(col => col.key === 'sprint_start' ? 'Sprint' : col.label);
    
    // Build table data dynamically
    const tableData = sprintRecords.map(record => {
      const row = [];
      
      allColumns.forEach(col => {
        let value = '-';
        
        // Handle system columns
        if (!col.isCustom) {
          if (col.key === 'pi') value = record.pi || '-';
          else if (col.key === 'sprint_start') value = formatSprintDisplayForPDF(record.sprint_start, record.sprint_end);
          else if (col.key === 'sprint_end') value = record.sprint_end || '-';
          else if (col.key === 'jira') value = formatJiraForPDF(record.jira);
          else if (col.key === 'desc') value = (record.desc || '-').substring(0, 50);
          else if (col.key === 'jstatus') value = record.jstatus || '-';
          else if (col.key === 'wi1') value = formatWIForPDF(record.wi1);
          else if (col.key === 'wi2') value = formatWIForPDF(record.wi2);
          else if (col.key === 'dstatus') value = record.dstatus || '-';
          else if (col.key === 'dorg') value = record.dorg || '-';
          else if (col.key === 'comments') value = (record.comments || '-').substring(0, 30);
          else if (col.key === 'timestamps') {
            if (record.createdAt) {
              const date = new Date(record.createdAt);
              value = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
          }
          else if (col.key === 'tags') {
            const tags = state.recordTags && state.recordTags[record.id] 
              ? state.recordTags[record.id].join(', ') 
              : '-';
            value = tags;
          }
        } else {
          // Handle custom columns
          const fieldKey = `cc_${col.key}`;
          const rawValue = record[fieldKey];
          
          if (rawValue && rawValue !== '') {
            // Format based on column type
            if (col.type === 'date') {
              try {
                const parts = rawValue.split('-');
                if (parts.length === 3) {
                  const year = parseInt(parts[0]);
                  const month = parseInt(parts[1]) - 1;
                  const day = parseInt(parts[2]);
                  const date = new Date(year, month, day);
                  value = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                } else {
                  value = rawValue;
                }
              } catch (e) {
                value = rawValue;
              }
            } else if (typeof rawValue === 'string' && rawValue.length > 30) {
              value = rawValue.substring(0, 30) + '...';
            } else {
              value = rawValue;
            }
          }
        }
        
        row.push(value);
      });
      
      return row;
    });
    
    doc.autoTable({
      startY: yPos,
      head: [headers],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 212, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      margin: { left: landscapeMargin, right: landscapeMargin },
      styles: { cellPadding: 2, overflow: 'linebreak', fontSize: 7, halign: 'left' },
      pageBreak: 'auto',
      showHead: 'everyPage',
      didDrawCell: function(data) {
        // Add hyperlinks for Jira and Work Item columns
        if (data.section === 'body' && data.row.index < sprintRecords.length) {
          const record = sprintRecords[data.row.index];
          const colKey = allColumns[data.column.index]?.key;
          
          if (colKey === 'jira' && record.jira) {
            const url = getJiraUrlForPDF(record.jira);
            if (url) {
              doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: url });
            }
          } else if (colKey === 'wi1' && record.wi1) {
            const url = getWIUrlForPDF(record.wi1);
            if (url) {
              doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: url });
            }
          } else if (colKey === 'wi2' && record.wi2) {
            const url = getWIUrlForPDF(record.wi2);
            if (url) {
              doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: url });
            }
          }
        }
      },
      didAddPage: function (data) {
        // Ensure new pages added by autoTable are also landscape
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        if (currentPage > 2) { // Pages after the first landscape page
          doc.internal.pageSize.width = 297;
          doc.internal.pageSize.height = 210;
        }
      }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(120, 120, 120);
    doc.text('No stories found for this sprint', landscapeMargin, yPos);
    yPos += 10;
  }
  
  // Linked Stories Section
  const linkedStoriesData = [];
  const linkedStoriesRecords = []; // Store original records for hyperlinks
  sprintRecords.forEach(record => {
    const linkedIds = state.recordLinks?.[record.id] || [];
    if (linkedIds.length > 0) {
      linkedIds.forEach(linkedId => {
        const linkedRecord = state.records.find(r => r.id === linkedId);
        if (linkedRecord) {
          linkedStoriesData.push({
            sourceJira: formatJiraForPDF(record.jira),
            sourceDesc: (record.desc || '-').substring(0, 40),
            linkedJira: formatJiraForPDF(linkedRecord.jira),
            linkedDesc: (linkedRecord.desc || '-').substring(0, 40),
            linkedSprint: formatSprintDisplayForPDF(linkedRecord.sprint_start, linkedRecord.sprint_end),
            linkedPI: linkedRecord.pi || '-'
          });
          linkedStoriesRecords.push({
            sourceRecord: record,
            linkedRecord: linkedRecord
          });
        }
      });
    }
  });
  
  if (linkedStoriesData.length > 0) {
    // Check if we need a new page
    yPos = doc.lastAutoTable.finalY + 15;
    
    // If not enough space, add new page
    if (yPos > landscapePageHeight - 60) {
      doc.addPage();
      doc.internal.pageSize.width = 297;
      doc.internal.pageSize.height = 210;
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Linked Stories', landscapeMargin, yPos);
    
    yPos += 8;
    
    const linkedHeaders = ['Source Story', 'Source Description', 'Linked Story', 'Linked Description', 'Linked Sprint', 'Linked PI'];
    const linkedTableData = linkedStoriesData.map(item => [
      item.sourceJira,
      item.sourceDesc,
      item.linkedJira,
      item.linkedDesc,
      item.linkedSprint,
      item.linkedPI
    ]);
    
    doc.autoTable({
      startY: yPos,
      head: [linkedHeaders],
      body: linkedTableData,
      theme: 'striped',
      headStyles: { fillColor: [245, 158, 11], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: [60, 60, 60] },
      alternateRowStyles: { fillColor: [254, 243, 199] },
      margin: { left: landscapeMargin, right: landscapeMargin },
      styles: { cellPadding: 2, overflow: 'linebreak', fontSize: 7, halign: 'left' },
      pageBreak: 'auto',
      showHead: 'everyPage',
      didDrawCell: function(data) {
        // Add hyperlinks for Source Story (column 0) and Linked Story (column 2)
        if (data.section === 'body' && data.row.index < linkedStoriesRecords.length) {
          const records = linkedStoriesRecords[data.row.index];
          
          if (data.column.index === 0 && records.sourceRecord.jira) {
            // Source Story column
            const url = getJiraUrlForPDF(records.sourceRecord.jira);
            if (url) {
              doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: url });
            }
          } else if (data.column.index === 2 && records.linkedRecord.jira) {
            // Linked Story column
            const url = getJiraUrlForPDF(records.linkedRecord.jira);
            if (url) {
              doc.link(data.cell.x, data.cell.y, data.cell.width, data.cell.height, { url: url });
            }
          }
        }
      },
      didAddPage: function (data) {
        // Ensure new pages added by autoTable are also landscape
        const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        doc.internal.pageSize.width = 297;
        doc.internal.pageSize.height = 210;
      }
    });
  }
  
  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    
    // Adjust footer position based on page orientation
    const currentPageInfo = doc.internal.getPageInfo(i);
    const currentPageWidth = currentPageInfo.pageContext.mediaBox.topRightX;
    const currentPageHeight = currentPageInfo.pageContext.mediaBox.topRightY;
    
    doc.text(`Sprint Tracker Pro - Page ${i} of ${totalPages}`, currentPageWidth / 2, currentPageHeight - 10, { align: 'center' });
  }
  
  // Save PDF
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = 'Sprint_Report_' + sprint.pi.replace(/\s+/g, '_') + '_' + sprintName + '_' + dateStr + '.pdf';
  doc.save(filename);
  
  toast('Sprint report generated successfully', 'success');
}

// Open sprint report selector modal
function openSprintReportSelector() {
  const sprints = extractSprintsFromRecords();
  const sprintsWithDates = sprints.filter(s => s.startDate && s.endDate);
  
  if (sprintsWithDates.length === 0) {
    toast('No sprints with dates found. Add dates to sprints first.', 'info');
    return;
  }
  
  // Group by PI
  const piGroups = {};
  sprintsWithDates.forEach(sprint => {
    const pi = sprint.pi || 'No PI';
    if (!piGroups[pi]) {
      piGroups[pi] = [];
    }
    piGroups[pi].push(sprint);
  });
  
  let html = '<div style="max-height:400px;overflow-y:auto;">';
  
  Object.keys(piGroups).sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || 0);
    const numB = parseInt(b.match(/\d+/)?.[0] || 0);
    return numA - numB;
  }).forEach(pi => {
    html += `
      <div style="margin-bottom:16px;">
        <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px;padding:8px;background:var(--surface2);border-radius:var(--radius-sm);">
          ${pi}
        </div>
    `;
    
    piGroups[pi].forEach(sprint => {
      const progress = calculateSprintProgress(sprint);
      const statusBadge = progress.status === 'upcoming' ? '⏳' : 
                         progress.status === 'active' ? '🔄' : 
                         progress.status === 'completed' ? '✅' : '❓';
      
      html += `
        <div onclick="generateSprintReport('${escapeHtml(sprint.key)}')" style="padding:12px;background:var(--surface);border:1px solid var(--border);border-left:4px solid ${sprint.color};border-radius:var(--radius-sm);margin-bottom:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.background='var(--surface3)';this.style.transform='translateX(4px)';" onmouseout="this.style.background='var(--surface)';this.style.transform='translateX(0)';">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="flex:1;">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <div style="font-size:13px;font-weight:600;color:var(--text);">${sprint.name}</div>
                <span style="font-size:11px;color:var(--text3);">${statusBadge}</span>
              </div>
              <div style="font-size:11px;color:var(--text3);">
                ${sprint.startDate && sprint.endDate ? `${formatDate(sprint.startDate)} → ${formatDate(sprint.endDate)}` : 'No dates set'}
              </div>
              <div style="font-size:11px;color:var(--text3);margin-top:4px;">
                📦 ${sprint.storyCount} stories • 📝 ${sprint.noteCount} notes
              </div>
            </div>
            <button class="btn btn-primary btn-sm" style="font-size:11px;padding:6px 12px;">📄 Generate</button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
  });
  
  html += '</div>';
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.style.display = 'flex';
  overlay.id = 'sprintReportSelectorModal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-header">
        <div class="modal-title">📄 Generate Sprint Report</div>
        <button class="modal-close" onclick="closeSprintReportSelector()">×</button>
      </div>
      <div style="padding:20px;">
        <div style="font-size:12px;color:var(--text3);margin-bottom:16px;">
          Select a sprint to generate a comprehensive PDF report with statistics, stories, and notes.
        </div>
        ${html}
      </div>
      <div class="form-actions">
        <button class="btn btn-secondary" onclick="closeSprintReportSelector()">Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
}

// Close sprint report selector modal
function closeSprintReportSelector() {
  const modal = document.getElementById('sprintReportSelectorModal');
  if (modal) {
    modal.remove();
  }
}
