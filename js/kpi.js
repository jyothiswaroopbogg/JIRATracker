// KPI (Key Performance Indicators) Updates
function updateKPIs() {
  const r = state.records;
  document.getElementById('kpi-total').textContent = r.length;
  document.getElementById('kpi-completed').textContent = r.filter(x => x.jstatus === 'Completed').length;
  document.getElementById('kpi-inprogress').textContent = r.filter(x => x.jstatus === 'In Progress').length;
  document.getElementById('kpi-prod').textContent = r.filter(x => x.dorg === 'PROD').length;
}
