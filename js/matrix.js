// Matrix Background Animation

let matrixInterval = null;

function initializeMatrixCanvas() {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Set canvas to full viewport size accounting for device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  
  // Scale context for device pixels
  ctx.scale(dpr, dpr);
  
  const chars = state.matrixChars || 'ﾊﾐﾋｰｳﾆﾜﾄﾁﾙﾒﾓﾔﾔﾗﾘﾜﾇﾌﾆﾌﾞﾔﾂﾘﾌﾆﾄﾁﾙﾒﾓﾔ';
  const charArray = chars.split('');
  const fontSize = state.matrixFontSize || 12;
  const columns = Math.ceil(window.innerWidth / fontSize) + 2;
  const rows = Math.ceil(window.innerHeight / fontSize) + 2;
  const drops = Array(columns).fill(0).map(() => Math.floor(Math.random() * rows));
  
  // Clear initial canvas
  ctx.fillStyle = 'rgba(10, 14, 26, 1)';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  
  function drawMatrix() {
    // Apply dark fade to create trails
    ctx.fillStyle = 'rgba(10, 14, 26, 0.04)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    
    // Set text style
    ctx.fillStyle = 'rgba(0, 212, 255, 0.85)';
    ctx.font = 'bold ' + fontSize + 'px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw characters across entire width
    for (let i = 0; i < columns; i++) {
      const char = charArray[Math.floor(Math.random() * charArray.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      
      ctx.fillText(char, x, y);
      
      // Reset to top smoothly
      if (y > window.innerHeight) {
        drops[i] = 0;
      } else {
        drops[i]++;
      }
    }
  }
  
  // Clear and start animation
  if (matrixInterval) clearInterval(matrixInterval);
  matrixInterval = setInterval(drawMatrix, 40);
}

function applyBackground() {
  const bgLayer = document.getElementById('backgroundLayer');
  const matrixCanvas = document.getElementById('matrixCanvas');
  const body = document.body;
  
  if (!bgLayer || !matrixCanvas) return;
  
  bgLayer.classList.remove('show', 'matrix');
  matrixCanvas.classList.remove('show');
  body.classList.remove('bgBlack');
  
  // If image exists, show it
  if (state.backgroundImage) {
    bgLayer.style.backgroundImage = 'url(' + state.backgroundImage + ')';
    bgLayer.classList.add('show');
  }
  // Else if matrix is enabled, show matrix
  else if (state.useMatrixBackground) {
    matrixCanvas.classList.add('show');
    initializeMatrixCanvas();
  }
  // Else show black background from theme
  else {
    body.classList.add('bgBlack');
  }
}

function toggleMatrixBackground() {
  state.useMatrixBackground = !state.useMatrixBackground;
  saveState();
  applyBackground();
  if (typeof renderMatrixSettings === 'function') {
    renderMatrixSettings();
  }
  toast('Matrix background ' + (state.useMatrixBackground ? 'enabled' : 'disabled'), 'success');
}

function updateMatrixFontSize(size) {
  state.matrixFontSize = parseInt(size) || 12;
  saveState();
  applyBackground();
  if (typeof renderMatrixSettings === 'function') {
    renderMatrixSettings();
  }
  toast('Font size updated to ' + state.matrixFontSize + 'px', 'success');
}

function updateMatrixChars(chars) {
  if (!chars.trim()) {
    toast('Characters cannot be empty', 'error');
    return;
  }
  state.matrixChars = chars;
  saveState();
  applyBackground();
  if (typeof renderMatrixSettings === 'function') {
    renderMatrixSettings();
  }
  toast('Matrix characters updated', 'success');
}

function renderMatrixSettings() {
  const container = document.getElementById('matrixSettingsContainer');
  if (!container) return;
  
  const matrixEnabled = state.useMatrixBackground;
  
  container.innerHTML = `
    <div class="setting-card">
      <div class="setting-card-title">🎬 Matrix Customization</div>
      
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div>
            <div style="font-size:13px;font-weight:500;color:var(--text);">Enable Matrix Background</div>
            <div style="font-size:11px;color:var(--text3);margin-top:3px;">Animated digital rain effect</div>
          </div>
          <label style="display:flex;align-items:center;cursor:pointer;gap:10px;" for="matrixEnable">
            <input type="checkbox" id="matrixEnable" name="matrixEnable" ${matrixEnabled ? 'checked' : ''} onchange="toggleMatrixBackground()" style="accent-color:var(--accent);cursor:pointer;width:18px;height:18px;">
            <span style="font-size:12px;color:var(--text2);">${matrixEnabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
      </div>
      
      <div class="form-group mb-14">
        <label for="matrixFontSize" id="matrixFontSizeLabel">Font Size (${state.matrixFontSize || 12}px)</label>
        <input type="range" id="matrixFontSize" name="matrixFontSize" min="8" max="32" value="${state.matrixFontSize || 12}" oninput="document.getElementById('matrixFontSizeLabel').textContent='Font Size ('+this.value+'px)'" onchange="updateMatrixFontSize(this.value)" style="width:100%;cursor:pointer;">
        <div style="font-size:11px;color:var(--text3);margin-top:6px;">📌 Range: 8px - 32px (affects coverage)</div>
      </div>
      
      <div class="form-group mb-14">
        <label for="matrixChars">Matrix Characters</label>
        <textarea id="matrixChars" rows="2" placeholder="Enter characters..." onchange="updateMatrixChars(this.value)" style="width:100%;resize:vertical;font-family:monospace;">${state.matrixChars || 'ﾊﾐﾋｰｳﾆﾜﾄﾁﾙﾒﾓﾔﾔﾗﾘﾜﾇﾌﾆﾌﾞﾔﾂﾘﾌﾆﾄﾁﾙﾒﾓﾔ'}</textarea>
        <div style="font-size:11px;color:var(--text3);margin-top:6px;">📌 Characters used in matrix rain effect</div>
      </div>
    </div>
  `;
}

function handleBackgroundImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    toast('Image too large (max 10MB)', 'error');
    return;
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast('Please select an image file', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = e => {
    state.backgroundImage = e.target.result;
    saveState();
    applyBackground();
    renderBackgroundSettings();
    toast('Background image uploaded', 'success');
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function removeBackgroundImage() {
  state.backgroundImage = null;
  saveState();
  applyBackground();
  renderBackgroundSettings();
  toast('Background image removed', 'info');
}

function renderBackgroundSettings() {
  const container = document.getElementById('backgroundSettingsContainer');
  if (!container) return;
  
  const hasImage = !!state.backgroundImage;
  const matrixEnabled = state.useMatrixBackground;
  
  container.innerHTML = `
    <div class="setting-card">
      <div class="setting-card-title">🖼️ Background & Matrix Settings</div>
      
      <div class="form-group mb-14">
        <label for="bgImageInput">Upload Background Image</label>
        <div style="display:flex;gap:8px;align-items:flex-end;">
          <input type="file" id="bgImageInput" name="bgImageInput" accept="image/*" onchange="handleBackgroundImageUpload(event)" style="flex:1;padding:8px 11px;background:var(--surface2);border:1px dashed var(--border);border-radius:var(--radius-sm);cursor:pointer;color:var(--text2);">
          ${hasImage ? '<button class="btn btn-danger btn-sm" onclick="removeBackgroundImage()">🗑 Remove</button>' : ''}
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:6px;">📌 Max 10MB • Supports PNG, JPG, WebP, etc.</div>
      </div>
      
      <div style="background:rgba(0,212,255,0.1);border:1px solid rgba(0,212,255,0.2);border-radius:var(--radius-sm);padding:12px;">
        <div style="font-size:11px;color:var(--text2);line-height:1.6;">
          <strong>Background Priority:</strong><br>
          1️⃣ <strong>Custom Image</strong> (if uploaded)<br>
          2️⃣ <strong>Matrix Background</strong> (if enabled)<br>
          3️⃣ <strong>Theme Color</strong> (black from color theme)
        </div>
      </div>
      
      <div style="margin-top:14px;display:flex;gap:8px;">
        <button class="btn btn-secondary btn-sm" onclick="applyBackground()">👁️ Preview</button>
        <button class="btn btn-secondary btn-sm" onclick="location.reload()">🔄 Refresh</button>
      </div>
    </div>
  `;
}

// Handle window resize for matrix canvas
window.addEventListener('resize', () => {
  if (state.useMatrixBackground && document.getElementById('matrixCanvas').classList.contains('show')) {
    initializeMatrixCanvas();
  }
});
