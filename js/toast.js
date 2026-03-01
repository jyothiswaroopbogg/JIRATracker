// Toast Notification System
function toast(msg, type) {
  const icons = {success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️'};
  const tc = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast ' + (type || 'info');
  t.innerHTML = '<span>' + (icons[type] || icons['info']) + '</span><span>' + msg + '</span>';
  tc.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(110%)';
    setTimeout(() => t.remove(), 350);
  }, 3000);
}
