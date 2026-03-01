// Lazy Loading Manager for Charts
// Uses IntersectionObserver API for performance-optimized chart rendering

const LazyChartLoader = {
  // Track loaded charts
  loadedCharts: new Set(),
  
  // IntersectionObserver instance
  observer: null,
  
  // Chart configurations cache
  chartConfigs: {},
  
  // Initialize lazy loading
  init() {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      this.loadAllChartsImmediate();
      return;
    }
    
    // Create observer with optimized settings
    const options = {
      root: null, // viewport
      rootMargin: '50px', // Start loading 50px before element is visible
      threshold: 0.1 // Trigger when 10% of element is visible
    };
    
    this.observer = new IntersectionObserver(
      this.handleIntersection.bind(this),
      options
    );
    
    // Observe all chart containers
    this.observeCharts();
  },
  
  // Handle intersection events
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const chartCard = entry.target;
        const chartId = chartCard.dataset.chartId;
        
        if (chartId && !this.loadedCharts.has(chartId)) {
          // Load chart after a small delay for smoother animation
          setTimeout(() => {
            this.loadChart(chartId, chartCard);
          }, 100);
          
          // Stop observing this chart
          this.observer.unobserve(chartCard);
        }
      }
    });
  },
  
  // Observe all chart containers
  observeCharts() {
    const chartCards = document.querySelectorAll('.chart-card[data-chart-id]');
    chartCards.forEach(card => {
      const chartId = card.dataset.chartId;
      
      // Check if chart is already rendered (from initial load)
      if (state.charts && state.charts[chartId]) {
        // Chart already exists, just show it
        const canvas = card.querySelector(`#${chartId}`);
        if (canvas) {
          canvas.classList.add('loaded');
        }
        this.loadedCharts.add(chartId);
      } else {
        // Add loading state for charts not yet rendered
        this.addLoadingState(card);
        
        // Start observing
        this.observer.observe(card);
      }
    });
  },
  
  // Add loading indicator to chart card
  addLoadingState(chartCard) {
    const chartId = chartCard.dataset.chartId;
    const canvas = chartCard.querySelector(`#${chartId}`);
    
    if (!canvas) return;
    
    // Check if already has loading state
    const existingLoading = chartCard.querySelector('.chart-loading');
    if (existingLoading) return;
    
    // Create loading overlay
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chart-loading';
    loadingDiv.innerHTML = `
      <div class="chart-loading-spinner"></div>
      <div class="chart-loading-text">Loading chart...</div>
    `;
    
    // Insert before canvas
    canvas.parentNode.insertBefore(loadingDiv, canvas);
    
    // Mark canvas as not loaded
    canvas.classList.remove('loaded');
  },
  
  // Load a specific chart
  loadChart(chartId, chartCard) {
    if (this.loadedCharts.has(chartId)) return;
    
    // Check if chart already exists (rendered by normal flow)
    if (state.charts && state.charts[chartId]) {
      // Chart already rendered, just show it
      const canvas = document.getElementById(chartId);
      const loadingDiv = chartCard.querySelector('.chart-loading');
      
      if (canvas) {
        canvas.classList.add('loaded');
      }
      if (loadingDiv) {
        loadingDiv.classList.add('hidden');
        setTimeout(() => loadingDiv.remove(), 300);
      }
      this.loadedCharts.add(chartId);
      return;
    }
    
    const canvas = document.getElementById(chartId);
    const loadingDiv = chartCard.querySelector('.chart-loading');
    
    if (!canvas) {
      return;
    }
    
    // Render the chart based on its ID
    try {
      this.renderChartById(chartId);
      
      // Mark as loaded
      this.loadedCharts.add(chartId);
      
      // Animate canvas in
      setTimeout(() => {
        canvas.classList.add('loaded');
        
        // Remove loading state
        if (loadingDiv) {
          loadingDiv.classList.add('hidden');
          setTimeout(() => loadingDiv.remove(), 300);
        }
      }, 50);
      
    } catch (error) {
      
      // Remove loading state on error
      if (loadingDiv) {
        loadingDiv.innerHTML = `
          <div style="color:var(--text3);font-size:12px;">
            ⚠️ Failed to load chart
          </div>
        `;
      }
    }
  },
  
  // Render specific chart by ID
  renderChartById(chartId) {
    const r = state.records;
    
    switch(chartId) {
      case 'jiraStatusChart':
        this.renderJiraStatusChart(r);
        break;
      case 'sprintVelocityChart':
        this.renderSprintVelocityChart(r);
        break;
      case 'devopsChart':
        this.renderDevopsChart(r);
        break;
      case 'piChart':
        this.renderPIChart(r);
        break;
      case 'deploymentChart':
        this.renderDeploymentChart(r);
        break;
      case 'workItemChart':
        this.renderWorkItemChart(r);
        break;
      case 'sumSprintChart':
        this.renderSummarySprintChart(r);
        break;
      case 'sumPIChart':
        this.renderSummaryPIChart(r);
        break;
    }
  },
  
  // Individual chart rendering methods
  renderJiraStatusChart(r) {
    const jsCounts = {};
    state.jiraStatuses.forEach(s => { jsCounts[s] = 0; });
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
  },
  
  renderSprintVelocityChart(r) {
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
  },
  
  renderDevopsChart(r) {
    const dvC = {};
    state.devopsStatuses.forEach(s => { dvC[s] = 0; });
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
  },
  
  renderPIChart(r) {
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
  },
  
  renderDeploymentChart(r) {
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
  },
  
  renderWorkItemChart(r) {
    const wiSp = {};
    r.forEach(x => {
      if (x.sprint_start) {
        let wiCount = 0;
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
  },
  
  renderSummarySprintChart(r) {
    const spC = {};
    r.forEach(x => {
      if (x.sprint_start) spC[x.sprint_start] = (spC[x.sprint_start] || 0) + 1;
    });
    const spL = Object.keys(spC).sort();
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
  },
  
  renderSummaryPIChart(r) {
    const piC = {};
    r.forEach(x => {
      if (x.pi) piC[x.pi] = (piC[x.pi] || 0) + 1;
    });
    const piL = Object.keys(piC).sort();
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
  },
  
  // Force load all charts immediately (fallback)
  loadAllChartsImmediate() {
    const chartIds = [
      'jiraStatusChart',
      'sprintVelocityChart', 
      'devopsChart',
      'piChart',
      'deploymentChart',
      'workItemChart',
      'sumSprintChart',
      'sumPIChart'
    ];
    
    chartIds.forEach(chartId => {
      const canvas = document.getElementById(chartId);
      if (canvas) {
        this.renderChartById(chartId);
        this.loadedCharts.add(chartId);
        canvas.classList.add('loaded');
      }
    });
  },
  
  // Reset and reinitialize (for tab switches)
  reset() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.loadedCharts.clear();
    this.init();
  },
  
  // Force load charts in current tab
  loadVisibleCharts() {
    const visibleCharts = document.querySelectorAll('.tab-panel.active .chart-card[data-chart-id]');
    visibleCharts.forEach(chartCard => {
      const chartId = chartCard.dataset.chartId;
      if (chartId && !this.loadedCharts.has(chartId)) {
        this.loadChart(chartId, chartCard);
      }
    });
  }
};

// Initialize lazy loading when charts need to be rendered
function initializeLazyCharts() {
  // Small delay to let normal rendering complete first
  setTimeout(() => {
    const activePanel = document.querySelector('.tab-panel.active');
    if (!activePanel) return;
    
    const hasCharts = activePanel.querySelectorAll('.chart-card[data-chart-id]').length > 0;
    if (hasCharts) {
      LazyChartLoader.reset();
    }
  }, 300);
}

// Also expose a function to show all charts immediately (no lazy loading)
function showAllChartsImmediately() {
  const chartCards = document.querySelectorAll('.chart-card[data-chart-id]');
  chartCards.forEach(card => {
    const chartId = card.dataset.chartId;
    const canvas = card.querySelector(`#${chartId}`);
    const loadingDiv = card.querySelector('.chart-loading');
    
    if (canvas) {
      canvas.classList.add('loaded');
    }
    if (loadingDiv) {
      loadingDiv.remove();
    }
  });
}
