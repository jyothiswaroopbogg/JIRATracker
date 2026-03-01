// Confirmation Modal System

let confirmModalCallback = null;

function showConfirmModal(title, message, onConfirm, confirmBtnText = 'Delete', confirmBtnClass = 'btn-danger') {
  confirmModalCallback = onConfirm;
  
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalMessage').textContent = message;
  
  const confirmBtn = document.getElementById('confirmModalBtn');
  confirmBtn.textContent = confirmBtnText;
  confirmBtn.className = 'btn ' + confirmBtnClass;
  
  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('show');
  confirmModalCallback = null;
}

function confirmModalAction() {
  if (confirmModalCallback && typeof confirmModalCallback === 'function') {
    confirmModalCallback();
  }
  closeConfirmModal();
}
