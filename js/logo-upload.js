// Logo Upload Functionality

let selectedLogoFile = null;

// Handle logo file upload
function handleLogoUpload(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/x-icon'];
  if (!allowedTypes.includes(file.type)) {
    toast('Invalid file type. Please upload PNG, JPEG, JPG, or ICO files only.', 'error');
    event.target.value = '';
    return;
  }
  
  // Validate file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB in bytes
  if (file.size > maxSize) {
    toast('File size exceeds 2MB. Please choose a smaller image.', 'error');
    event.target.value = '';
    return;
  }
  
  // Store file for upload
  selectedLogoFile = file;
  
  // Show preview
  const reader = new FileReader();
  reader.onload = function(e) {
    const previewSection = document.getElementById('logoPreviewSection');
    const previewImage = document.getElementById('logoPreviewImage');
    previewImage.src = e.target.result;
    previewSection.style.display = 'flex';
    
    // Enable save button
    document.getElementById('saveLogoBtn').disabled = false;
  };
  
  reader.onerror = function() {
    toast('Error reading file. Please try again.', 'error');
    event.target.value = '';
  };
  
  reader.readAsDataURL(file);
}

// Save logo to database
async function saveLogoUpload() {
  if (!selectedLogoFile) {
    toast('Please select a logo image first', 'error');
    return;
  }
  
  try {
    // Convert file to base64
    const reader = new FileReader();
    reader.onload = function(e) {
      // Save base64 data to state
      state.websiteLogo = e.target.result;
      saveState();
      
      // Update header logo
      updateHeaderLogo();
      
      // Show remove button
      document.getElementById('removeLogoBtn').style.display = 'inline-block';
      
      // Disable save button
      document.getElementById('saveLogoBtn').disabled = true;
      
      // Clear selected file
      selectedLogoFile = null;
      
      toast('Logo saved successfully', 'success');
    };
    
    reader.onerror = function() {
      toast('Failed to save logo. Please try again.', 'error');
    };
    
    reader.readAsDataURL(selectedLogoFile);
  } catch (error) {
    toast('Failed to save logo. Please try again.', 'error');
  }
}

// Remove logo
async function removeLogo() {
  if (!confirm('Are you sure you want to remove the website logo?')) {
    return;
  }
  
  try {
    // Clear from state
    state.websiteLogo = null;
    saveState();
    
    // Reset preview
    const previewSection = document.getElementById('logoPreviewSection');
    const previewImage = document.getElementById('logoPreviewImage');
    previewSection.style.display = 'none';
    previewImage.src = '';
    const fileInput = document.getElementById('logoUpload');
    if (fileInput) fileInput.value = '';
    selectedLogoFile = null;
    
    // Hide remove button
    document.getElementById('removeLogoBtn').style.display = 'none';
    
    // Disable save button
    document.getElementById('saveLogoBtn').disabled = true;
    
    // Reset header to default
    updateHeaderLogo();
    
    toast('Logo removed successfully', 'success');
  } catch (error) {
    toast('Failed to remove logo. Please try again.', 'error');
  }
}

// Update header logo display
function updateHeaderLogo() {
  const logoIcon = document.querySelector('.logo-icon');
  const favicon = document.getElementById('dynamicFavicon');
  
  if (!logoIcon) {
    return; // Logo icon element not found
  }
  
  if (state.websiteLogo) {
    // Use base64 data from database
    const logoUrl = state.websiteLogo;
    
    // Replace text with image in header
    logoIcon.innerHTML = `<img src="${logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain;">`;
    
    // Update favicon
    if (favicon) {
      favicon.href = logoUrl;
    }
  } else {
    // Show default text in header
    const fontSettings = state.fontSettings || {};
    const defaultIcon = fontSettings.logoIcon || 'ST';
    logoIcon.textContent = defaultIcon;
    
    // Remove favicon
    if (favicon) {
      favicon.href = '';
    }
  }
}

// Initialize logo on page load
function initializeLogo() {
  // Ensure websiteLogo property exists in state
  if (state.websiteLogo === undefined) {
    state.websiteLogo = null;
  }
  
  // Set up event listeners (inline handlers in HTML already set up)
  const fileInput = document.getElementById('logoUpload');
  const uploadArea = document.getElementById('uploadArea');
  const removeBtn = document.getElementById('removeLogoBtn');
  
  // Drag and drop support
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      
      const file = e.dataTransfer.files[0];
      if (file && fileInput) {
        // Create a fake event to reuse existing validation logic
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
  
  // Load existing logo if available
  if (state.websiteLogo) {
    const previewSection = document.getElementById('logoPreviewSection');
    const previewImage = document.getElementById('logoPreviewImage');
    if (previewSection && previewImage) {
      previewImage.src = state.websiteLogo;
      previewSection.style.display = 'flex';
    }
    
    // Show remove button
    if (removeBtn) {
      removeBtn.style.display = 'inline-block';
    }
    
    // Update header (with delay to ensure DOM is ready)
    setTimeout(() => {
      updateHeaderLogo();
    }, 100);
  }
}
