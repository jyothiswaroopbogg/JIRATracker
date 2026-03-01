// Detailed Summary Functions

const PF_CLASSES = ['pf-blue', 'pf-purple', 'pf-cyan', 'pf-green', 'pf-orange', 'pf-red'];

function renderDetailedSummary() {
  const r = state.records;
  const comp = r.filter(x => x.jstatus === 'Completed').length;
  const canc = r.filter(x => x.jstatus === 'Cancelled').length;
  const inp = r.filter(x => x.jstatus === 'In Progress').length;
  const depl = r.filter(x => x.dstatus === 'Deployed').length;
  const prod = r.filter(x => x.dorg === 'PROD').length;
  const pis = new Set(r.map(x => x.pi).filter(Boolean));

  document.getElementById('summaryStats').innerHTML = [
    {v: r.length, l: 'Total Stories'},
    {v: comp, l: 'Completed'},
    {v: inp, l: 'In Progress'},
    {v: depl, l: 'Deployed'},
    {v: canc, l: 'Cancelled'},
    {v: prod, l: 'In PROD'}
  ].map(s => '<div class="summary-stat"><div class="summary-stat-val">' + s.v + '</div><div class="summary-stat-lbl">' + s.l + '</div></div>').join('');

  // Environment Distribution
  const intCount = r.filter(x => x.dorg === 'INT').length;
  const uatCount = r.filter(x => x.dorg === 'UAT').length;
  const prodCount = r.filter(x => x.dorg === 'PROD').length;
  const total = r.length || 1;
  document.getElementById('envDistribution').innerHTML = [
    {env: 'INT', count: intCount, pct: Math.round(intCount / total * 100), badge: 'b-amber'},
    {env: 'UAT', count: uatCount, pct: Math.round(uatCount / total * 100), badge: 'b-blue'},
    {env: 'PROD', count: prodCount, pct: Math.round(prodCount / total * 100), badge: 'b-prod'}
  ].map(e => '<div class="env-card"><div class="env-name">' + e.env + '</div><div class="env-count">' + e.count + '</div><div class="env-pct">' + e.pct + '% of total</div><span class="badge ' + e.badge + '">' + e.env + '</span></div>').join('');

  // Jira progress
  const jiraCounts = {};
  state.jiraStatuses.forEach(s => {
    jiraCounts[s] = r.filter(x => x.jstatus === s).length;
  });
  document.getElementById('jiraProgressBars').innerHTML = state.jiraStatuses.map((s, i) => {
    const cnt = jiraCounts[s] || 0, pct = r.length ? Math.round(cnt / r.length * 100) : 0;
    return '<div class="progress-bar-wrap"><div class="progress-label"><span>' + s + '</span><span>' + cnt + ' (' + pct + '%)</span></div><div class="progress-bar"><div class="progress-fill ' + PF_CLASSES[i % 6] + '" style="width:' + pct + '%"></div></div></div>';
  }).join('');

  // DevOps progress
  const dvC = {};
  state.devopsStatuses.forEach(s => {
    dvC[s] = r.filter(x => x.dstatus === s).length;
  });
  document.getElementById('devopsProgressBars').innerHTML = state.devopsStatuses.map((s, i) => {
    const cnt = dvC[s] || 0, pct = r.length ? Math.round(cnt / r.length * 100) : 0;
    return '<div class="progress-bar-wrap"><div class="progress-label"><span>' + s + '</span><span>' + cnt + ' (' + pct + '%)</span></div><div class="progress-bar"><div class="progress-fill ' + PF_CLASSES[i % 6] + '" style="width:' + pct + '%"></div></div></div>';
  }).join('');

  // Calculate data for charts and tables
  const spC = {};
  r.forEach(x => {
    if (x.sprint_start) spC[x.sprint_start] = (spC[x.sprint_start] || 0) + 1;
  });
  const spL = Object.keys(spC).sort();

  const piC = {};
  r.forEach(x => {
    if (x.pi) piC[x.pi] = (piC[x.pi] || 0) + 1;
  });
  const piL = Object.keys(piC).sort();

  // Render summary charts normally
  dc('sumSprintChart');
  const sc = document.getElementById('sumSprintChart');
  if (sc) state.charts['sumSprintChart'] = new Chart(sc, {
    type: 'bar',
    data: {
      labels: spL.length ? spL : ['No Data'],
      datasets: [{
        label: 'Stories',
        data: spL.map(k => spC[k]),
        backgroundColor: spL.map((_, i) => COLORS[i % COLORS.length] + '99'),
        borderWidth: 0,
        borderRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {legend: {display: false}},
      scales: {
        x: {ticks: TICK_CLR, grid: DARK_GRID},
        y: {ticks: {...TICK_CLR, stepSize: 1}, grid: DARK_GRID}
      }
    }
  });

  dc('sumPIChart');
  const pc = document.getElementById('sumPIChart');
  if (pc) state.charts['sumPIChart'] = new Chart(pc, {
    type: 'radar',
    data: {
      labels: piL.length ? piL : ['No Data'],
      datasets: [{
        label: 'Stories',
        data: piL.map(k => piC[k]),
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0,212,255,.1)',
        pointBackgroundColor: '#00d4ff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {legend: {display: false}},
      scales: {
        r: {
          ticks: {color: '#64748b', backdropColor: 'transparent'},
          grid: {color: 'rgba(255,255,255,.05)'},
          pointLabels: {color: '#94a3b8'}
        }
      }
    }
  });

  // PI breakdown table
  document.getElementById('piBreakdownBody').innerHTML = piL.length ? piL.map(pi => {
    const rows = r.filter(x => x.pi === pi);
    const c = rows.filter(x => x.jstatus === 'Completed').length;
    const p = rows.length ? Math.round(c / rows.length * 100) : 0;
    return '<tr><td style="color:var(--accent3);font-weight:600">' + pi + '</td><td>' + rows.length + '</td><td style="color:var(--accent4)">' + c + '</td><td style="color:#a78bfa">' + rows.filter(x => x.jstatus === 'In Progress').length + '</td><td style="color:var(--text3)">' + (rows.length - c) + '</td><td><div style="display:flex;align-items:center;gap:8px"><div class="progress-bar" style="width:80px"><div class="progress-fill pf-green" style="width:' + p + '%"></div></div><span style="font-size:11px">' + p + '%</span></div></td></tr>';
  }).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px">No data yet</td></tr>';

  // Sprint breakdown table
  document.getElementById('sprintBreakdownBody').innerHTML = spL.length ? spL.map(sp => {
    const rows = r.filter(x => x.sprint_start === sp);
    return '<tr><td style="color:var(--accent);font-weight:600">' + sp + '</td><td>' + rows.length + '</td><td style="color:var(--accent4)">' + rows.filter(x => x.jstatus === 'Completed').length + '</td><td style="color:var(--accent4)">' + rows.filter(x => x.dstatus === 'Deployed').length + '</td><td style="color:var(--accent5)">' + rows.filter(x => x.jstatus === 'Cancelled').length + '</td></tr>';
  }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text3);padding:20px">No data yet</td></tr>';
}
