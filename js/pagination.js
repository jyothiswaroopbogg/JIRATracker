// Pagination Functions

// Render Pagination Controls
function renderPagination(totalPages) {
  const c = document.getElementById('pageBtns');
  let h = '';
  h += '<button class="page-btn" onclick="goPage(' + (state.currentPage - 1) + ')" ' + (state.currentPage <= 1 ? 'disabled' : '') + '>&lsaquo;</button>';
  let s = Math.max(1, state.currentPage - 2), e = Math.min(totalPages, s + 4);
  s = Math.max(1, e - 4);
  if (s > 1) {
    h += '<button class="page-btn" onclick="goPage(1)">1</button>';
    if (s > 2) h += '<button class="page-btn" disabled>&hellip;</button>';
  }
  for (let i = s; i <= e; i++) h += '<button class="page-btn ' + (i === state.currentPage ? 'active' : '') + '" onclick="goPage(' + i + ')">' + i + '</button>';
  if (e < totalPages) {
    if (e < totalPages - 1) h += '<button class="page-btn" disabled>&hellip;</button>';
    h += '<button class="page-btn" onclick="goPage(' + totalPages + ')">' + totalPages + '</button>';
  }
  h += '<button class="page-btn" onclick="goPage(' + (state.currentPage + 1) + ')" ' + (state.currentPage >= totalPages ? 'disabled' : '') + '>&rsaquo;</button>';
  c.innerHTML = h;
}

// Go to Page
function goPage(p) {
  const max = Math.ceil(getFiltered().length / state.perPage) || 1;
  state.currentPage = Math.max(1, Math.min(p, max));
  renderTable();
}
