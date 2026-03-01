// Chart Rendering Functions

// Chart Constants
const COLORS = ['#60a5fa', '#a78bfa', '#fbbf24', '#34d399', '#f87171', '#22d3ee', '#fb923c', '#c4b5fd', '#86efac', '#fde68a', '#fca5a5', '#a5f3fc'];
const DARK_GRID = {color: 'rgba(255,255,255,0.04)'};
const TICK_CLR = {color: '#64748b'};

// Destroy Chart Helper
function dc(id) {
  if (state.charts[id]) {
    state.charts[id].destroy();
    delete state.charts[id];
  }
}

// Create Chart Helper
function mkChart(id, type, data, opts) {
  dc(id);
  const c = document.getElementById(id);
  if (!c) return;
  state.charts[id] = new Chart(c, {
    type,
    data,
    options: {
      responsive: true,
      ...opts
    }
  });
}

// Render All Charts
function renderCharts() {
  const r = state.records;

  // Jira Status Doughnut
  const jsCounts = {};
  state.jiraStatuses.forEach(s => {
    jsCounts[s] = 0;
  });
  r.forEach(x => {
    if (x.jstatus) jsCounts[x.jstatus] = (jsCounts[x.jstatus] || 0) + 1;
  });
  const jsL = Object.keys(jsCounts).filter(k => jsCounts[k] > 0);
  mkChart('jiraStatusChart', 'doughnut', {
    labels: jsL,
    datasets: [{
      data: jsL.map(k => jsCounts[k]),
      backgroundColor: COLORS,
      borderColor: '#1a2236',
      borderWidth: 3
    }]
  }, {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: {size: 10},
          boxWidth: 10
        }
      }
    }
  });

  // Sprint Velocity Bar
  const spC = {};
  r.forEach(x => {
    if (x.sprint_start) spC[x.sprint_start] = (spC[x.sprint_start] || 0) + 1;
  });
  const spL = Object.keys(spC).sort();
  mkChart('sprintVelocityChart', 'bar', {
    labels: spL.length ? spL : ['No Data'],
    datasets: [{
      label: 'Stories',
      data: spL.map(k => spC[k]),
      backgroundColor: 'rgba(0,212,255,0.3)',
      borderColor: '#00d4ff',
      borderWidth: 2,
      borderRadius: 6
    }]
  }, {
    plugins: {legend: {display: false}},
    scales: {
      x: {ticks: TICK_CLR, grid: DARK_GRID},
      y: {ticks: {...TICK_CLR, stepSize: 1}, grid: DARK_GRID}
    }
  });

  // DevOps Pie
  const dvC = {};
  state.devopsStatuses.forEach(s => {
    dvC[s] = 0;
  });
  r.forEach(x => {
    if (x.dstatus) dvC[x.dstatus] = (dvC[x.dstatus] || 0) + 1;
  });
  const dvL = Object.keys(dvC).filter(k => dvC[k] > 0);
  mkChart('devopsChart', 'pie', {
    labels: dvL,
    datasets: [{
      data: dvL.map(k => dvC[k]),
      backgroundColor: ['#64748b', '#34d399', '#a78bfa'],
      borderColor: '#1a2236',
      borderWidth: 3
    }]
  }, {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: {size: 10},
          boxWidth: 10
        }
      }
    }
  });

  // PI Horizontal Bar
  const piC = {};
  r.forEach(x => {
    if (x.pi) piC[x.pi] = (piC[x.pi] || 0) + 1;
  });
  const piL = Object.keys(piC).sort();
  mkChart('piChart', 'bar', {
    labels: piL.length ? piL : ['No Data'],
    datasets: [{
      label: 'Stories',
      data: piL.map(k => piC[k]),
      backgroundColor: 'rgba(124,58,237,0.35)',
      borderColor: '#7c3aed',
      borderWidth: 2,
      borderRadius: 6
    }]
  }, {
    indexAxis: 'y',
    plugins: {legend: {display: false}},
    scales: {
      x: {ticks: TICK_CLR, grid: DARK_GRID},
      y: {ticks: TICK_CLR, grid: DARK_GRID}
    }
  });

  // Deployment ORG Stacked Bar
  const orgC = {INT: 0, UAT: 0, PROD: 0};
  r.forEach(x => {
    if (x.dorg && orgC[x.dorg] !== undefined) orgC[x.dorg]++;
  });
  state.devopsOrgs.filter(o => !orgC[o]).forEach(o => {
    orgC[o] = r.filter(x => x.dorg === o).length;
  });
  const orgKeys = state.devopsOrgs;
  mkChart('deploymentChart', 'bar', {
    labels: ['ORG Distribution'],
    datasets: orgKeys.map((o, i) => ({
      label: o,
      data: [orgC[o] || 0],
      backgroundColor: COLORS[i] + '88',
      borderColor: COLORS[i],
      borderWidth: 2,
      borderRadius: 4
    }))
  }, {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: {size: 10},
          boxWidth: 10
        }
      }
    },
    scales: {
      x: {stacked: true, ticks: TICK_CLR, grid: DARK_GRID},
      y: {stacked: true, ticks: {...TICK_CLR, stepSize: 1}, grid: DARK_GRID}
    }
  });

  // Work Items per Sprint Line
  const wiSp = {};
  r.forEach(x => {
    if (x.sprint_start) {
      let wiCount = 0;
      // Count all work item fields (wi1, wi2, wi3, etc.)
      Object.keys(x).forEach(key => {
        if (key.startsWith('wi') && x[key] && x[key].toString().trim() !== '') {
          wiCount++;
        }
      });
      if (wiCount > 0) {
        wiSp[x.sprint_start] = (wiSp[x.sprint_start] || 0) + wiCount;
      }
    }
  });
  const wiL = Object.keys(wiSp).sort();
  mkChart('workItemChart', 'line', {
    labels: wiL.length ? wiL : ['No Data'],
    datasets: [{
      label: 'Work Items',
      data: wiL.map(k => wiSp[k]),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16,185,129,0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#10b981',
      pointRadius: 4
    }]
  }, {
    plugins: {legend: {display: false}},
    scales: {
      x: {ticks: TICK_CLR, grid: DARK_GRID},
      y: {ticks: {...TICK_CLR, stepSize: 1}, grid: DARK_GRID}
    }
  });
}
