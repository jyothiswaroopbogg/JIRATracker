// Formatting and Display Functions

// Format Sprint Display - Shows "2→3" for multi-sprint, or just "2" for single sprint
function formatSprintDisplay(sprintStart, sprintEnd) {
  if (!sprintStart) return '—';
  const start = String(sprintStart).trim();
  const end = String(sprintEnd || '').trim();
  
  // If no end sprint or end equals start, show only start
  if (!end || end === start) return start;
  
  // Show range with arrow
  return `${start}→${end}`;
}

// Preview Functions
function previewJira(val) {
  const el = document.getElementById('jira-preview');
  const n = val.split('-').pop().replace(/\D/g, '');
  el.textContent = n ? '→ ' + state.jiraDisplayFormat.replace('{number}', n) : '';
}

function previewWI1(val) {
  const el = document.getElementById('wi1-preview');
  const n = parseInt(val.replace(/\D/g, ''));
  if (isNaN(n)) {
    el.textContent = '';
    return;
  }
  const p = String(n).padStart(6, '0');
  el.textContent = '→ ' + state.wiDisplayFormat.replace('{number6}', p).replace('{number}', n);
}

function previewWI2(val) {
  const el = document.getElementById('wi2-preview');
  const n = parseInt(val.replace(/\D/g, ''));
  if (isNaN(n)) {
    el.textContent = '';
    return;
  }
  const p = String(n).padStart(6, '0');
  el.textContent = '→ ' + state.wiDisplayFormat.replace('{number6}', p).replace('{number}', n);
}

function previewCustomEmail(key, val) {
  const el = document.getElementById('cc-' + key + '-preview');
  if (!el) return;
  if (!val || val.trim() === '') {
    el.textContent = '';
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(val)) {
    el.textContent = '→ Valid email ✓';
    el.style.color = 'var(--accent4)';
  } else {
    el.textContent = '→ Invalid email format';
    el.style.color = 'var(--danger)';
  }
}

function previewCustomUrl(key, val) {
  const el = document.getElementById('cc-' + key + '-preview');
  if (!el) return;
  if (!val || val.trim() === '') {
    el.textContent = '';
    return;
  }
  try {
    const url = new URL(val);
    el.textContent = '→ ' + url.hostname;
    el.style.color = 'var(--accent4)';
  } catch (e) {
    el.textContent = '→ Invalid URL format';
    el.style.color = 'var(--danger)';
  }
}

function previewCustomDate(key, val) {
  const el = document.getElementById('cc-' + key + '-preview');
  if (!el) return;
  if (!val || val.trim() === '') {
    el.textContent = '';
    return;
  }
  try {
    // Parse the date value as YYYY-MM-DD and create date in local time
    const parts = val.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      const date = new Date(year, month, day);
      
      if (isNaN(date.getTime())) {
        el.textContent = '';
        return;
      }
      
      const formatted = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      el.textContent = '→ ' + formatted;
      el.style.color = 'var(--accent4)';
    } else {
      el.textContent = '';
    }
  } catch (e) {
    el.textContent = '';
  }
}

function previewEditWI1(val) {
  const el = document.getElementById('e-wi1-preview');
  if (!el) return;
  const n = parseInt(val.replace(/\D/g, ''));
  if (isNaN(n)) {
    el.textContent = '';
    return;
  }
  const p = String(n).padStart(6, '0');
  el.textContent = '→ ' + state.wiDisplayFormat.replace('{number6}', p).replace('{number}', n);
}

function previewEditWI2(val) {
  const el = document.getElementById('e-wi2-preview');
  if (!el) return;
  const n = parseInt(val.replace(/\D/g, ''));
  if (isNaN(n)) {
    el.textContent = '';
    return;
  }
  const p = String(n).padStart(6, '0');
  el.textContent = '→ ' + state.wiDisplayFormat.replace('{number6}', p).replace('{number}', n);
}

function previewEditJira(val) {
  const el = document.getElementById('e-jira-preview');
  if (!el) return;
  const n = String(val).split('-').pop().replace(/\D/g, '');
  if (!n) {
    el.textContent = '';
    return;
  }
  const display = state.jiraDisplayFormat.replace('{number}', n);
  el.textContent = '→ ' + display;
}

function previewEditCustomEmail(key, val) {
  const el = document.getElementById('e-cc-' + key + '-preview');
  if (!el) return;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!val || !emailRegex.test(val)) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = '→ <a href="mailto:' + esc(val) + '" style="color:var(--accent4);text-decoration:underline;">' + esc(val) + '</a>';
}

function previewEditCustomUrl(key, val) {
  const el = document.getElementById('e-cc-' + key + '-preview');
  if (!el) return;
  try {
    if (!val) {
      el.innerHTML = '';
      return;
    }
    const url = new URL(val);
    el.innerHTML = '→ <a href="' + esc(val) + '" target="_blank" style="color:var(--accent4);text-decoration:underline;">' + esc(val) + '</a>';
  } catch (e) {
    el.innerHTML = '<span style="color:var(--danger);font-size:11px;">⚠ Invalid URL format</span>';
  }
}

function previewEditCustomDate(key, val) {
  const el = document.getElementById('e-cc-' + key + '-preview');
  if (!el) return;
  if (!val) {
    el.textContent = '';
    return;
  }
  try {
    // Parse the date value as YYYY-MM-DD and create date in local time
    const parts = val.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Month is 0-indexed
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      
      if (isNaN(d.getTime())) {
        el.textContent = '';
        return;
      }
      
      const formatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      el.textContent = '→ ' + formatted;
      el.style.color = 'var(--accent4)';
    } else {
      el.textContent = '';
    }
  } catch (e) {
    el.textContent = '';
  }
}

// Format Jira Link
function formatJira(num) {
  if (!num) return '';
  const n = String(num).split('-').pop().replace(/\D/g, '');
  if (!n) return '';
  const display = state.jiraDisplayFormat.replace('{number}', n);
  // Replace {formatted} with the formatted display, or fall back to {number} for backward compatibility
  const url = state.jiraUrlTemplate.replace('{formatted}', display).replace('{number}', n);
  return '<a class="jira-link" href="' + url + '" target="_blank">' + display + '</a>';
}

// Format Work Item Link
function formatWI(num) {
  if (!num) return '';
  const n = parseInt(String(num).replace(/\D/g, ''));
  if (isNaN(n)) return '';
  const p = String(n).padStart(6, '0');
  const display = state.wiDisplayFormat.replace('{number6}', p).replace('{number}', n);
  const url = state.wiUrlTemplate.replace('{formatted}', p).replace('{number}', n);
  return '<a class="wi-link" href="' + url + '" target="_blank">' + display + '</a>';
}

// Badge Functions
function getJiraBadge(s) {
  const map = {
    'Open': 'b-open',
    'Ready': 'b-ready',
    'Refining': 'b-refining',
    'In Progress': 'b-inprogress',
    'Ready for QA Move': 'b-qa',
    'QA Test Ready': 'b-qa',
    'Ready for UAT Move': 'b-uat',
    'UAT Testing': 'b-uat',
    'PO Review': 'b-review',
    'Ready for Release': 'b-release',
    'Cancelled': 'b-cancelled',
    'Completed': 'b-completed'
  };
  return '<span class="badge ' + (map[s] || 'b-open') + '">' + (s || '—') + '</span>';
}

function getDevopsBadge(s) {
  const map = {
    'Created': 'b-created',
    'Deployed': 'b-deployed',
    'Pull Request': 'b-pr'
  };
  return '<span class="badge ' + (map[s] || 'b-created') + '">' + (s || '—') + '</span>';
}

function getOrgBadge(s) {
  const map = {
    'INT': 'b-int',
    'UAT': 'b-uat-org',
    'PROD': 'b-prod'
  };
  return '<span class="badge ' + (map[s] || 'b-int') + '">' + (s || '—') + '</span>';
}

// Escape HTML
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
