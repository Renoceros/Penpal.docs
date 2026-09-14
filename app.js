/* Penpal Interactive Landing Page Logic
   Canvas Simulation, 40-Byte Wire Protocol Telemetry, Dock Actions, and FAQ Accordion
*/

document.addEventListener('DOMContentLoaded', () => {
  initCanvasSimulator();
  initFAQAccordion();
  initCopyButtons();
});

// -------------------------------------------------------------
// 1. Canvas Simulator & Wire Protocol Telemetry
// -------------------------------------------------------------
function initCanvasSimulator() {
  const canvas = document.getElementById('simCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const container = document.getElementById('sim-canvas-container');
  const hint = document.getElementById('simHint');

  // UI Dock Elements
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  const btnEraser = document.getElementById('btnEraser');
  const eraserLabel = document.getElementById('eraserLabel');
  const btnHand = document.getElementById('btnHand');
  const btnThemeCycle = document.getElementById('btnThemeCycle');
  const btnClear = document.getElementById('btnClear');
  const simDock = document.getElementById('simDock');

  // Control Elements
  const pressureSlider = document.getElementById('pressureSlider');
  const pressureValue = document.getElementById('pressureValue');
  const themeSelect = document.getElementById('themeSelect');
  const dockPosSelect = document.getElementById('dockPosSelect');
  const statusBar = document.getElementById('actionStatusBar');

  // Telemetry HUD Elements
  const pktSeq = document.getElementById('pktSeq');
  const pktPhase = document.getElementById('pktPhase');
  const pktCoords = document.getElementById('pktCoords');
  const pktPressure = document.getElementById('pktPressure');
  const pktTilt = document.getElementById('pktTilt');
  const pktHex = document.getElementById('pktHex');

  // Internal State
  let isDrawing = false;
  let isEraserActive = false;
  let lastX = 0;
  let lastY = 0;
  let sequenceNumber = 1042;
  const historyStack = [];
  const redoStack = [];
  const maxHistory = 20;

  // Available Themes
  const themes = [
    'theme-pitch-black',
    'theme-carbon-slate',
    'theme-graphite',
    'theme-parchment',
    'theme-blueprint'
  ];
  let currentThemeIndex = 0;

  // Responsive Canvas Sizing
  function resizeCanvas() {
    const rect = container.getBoundingClientRect();
    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    saveState();
  }
  window.addEventListener('resize', resizeCanvas);
  setTimeout(resizeCanvas, 50);

  // Undo / Redo History Management
  function saveState() {
    if (historyStack.length >= maxHistory) {
      historyStack.shift();
    }
    historyStack.push(canvas.toDataURL());
    redoStack.length = 0; // clear redo on new stroke
  }

  function restoreState(dataUrl) {
    const img = new Image();
    img.onload = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = window.devicePixelRatio || 1;
      ctx.scale(dpr, dpr);
      ctx.drawImage(img, 0, 0, container.clientWidth, container.clientHeight);
      ctx.restore();
    };
    img.src = dataUrl;
  }

  function handleUndo() {
    if (historyStack.length > 1) {
      redoStack.push(historyStack.pop());
      const prevState = historyStack[historyStack.length - 1];
      restoreState(prevState);
      updateStatus('UNDO (Cmd+Z)', 'Synthesized Cmd+Z keyboard event to macOS.');
    }
  }

  function handleRedo() {
    if (redoStack.length > 0) {
      const nextState = redoStack.pop();
      historyStack.push(nextState);
      restoreState(nextState);
      updateStatus('REDO (Cmd+Shift+Z)', 'Synthesized Cmd+Shift+Z keyboard event to macOS.');
    }
  }

  function toggleEraser() {
    isEraserActive = !isEraserActive;
    btnEraser.classList.toggle('active', isEraserActive);
    eraserLabel.textContent = isEraserActive ? 'Pen' : 'Eraser';
    updateStatus('ERASER (E)', isEraserActive ? 'Switched to Eraser tool (button toggled to Pen).' : 'Returned to Pen tool (button toggled to Eraser).');
  }

  let isHandActive = false;

  function onHandDown(e) {
    e.preventDefault();
    isHandActive = true;
    btnHand.classList.add('active');
    updateStatus('HAND (Space)', 'Spacebar held continuously for canvas panning.');
  }

  function onHandUp() {
    if (!isHandActive) return;
    isHandActive = false;
    btnHand.classList.remove('active');
    updateStatus('HAND RELEASE', 'Spacebar released. Restored drawing brush.');
  }

  function clearCanvas() {
    saveState();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    updateStatus('CLEAR', 'Canvas cleared.');
  }

  function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    setTheme(themes[currentThemeIndex]);
  }

  function setTheme(themeClass) {
    themes.forEach(t => container.classList.remove(t));
    container.classList.add(themeClass);
    themeSelect.value = themeClass;
    updateStatus('THEME', `Canvas background set to ${themeClass.replace('theme-', '').replace('-', ' ')}.`);
  }

  function updateStatus(badge, message) {
    statusBar.innerHTML = `<span class="status-badge">${badge}</span> ${message}`;
  }

  // Pointer & Touch Events
  function getCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      normX: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      normY: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    };
  }

  function getPressure(e) {
    // If PointerEvent provides real stylus pressure, use it; otherwise read slider
    if (e.pointerType === 'pen' && e.pressure > 0) {
      return e.pressure;
    }
    return parseFloat(pressureSlider.value);
  }

  function startStroke(e) {
    if (hint) hint.style.opacity = '0';
    isDrawing = true;
    const { x, y, normX, normY } = getCoordinates(e);
    lastX = x;
    lastY = y;

    const pressure = getPressure(e);
    updateTelemetry(normX, normY, pressure, 1); // 1 = Began
  }

  function moveStroke(e) {
    const { x, y, normX, normY } = getCoordinates(e);
    const pressure = isDrawing ? getPressure(e) : 0;
    const phase = isDrawing ? 2 : 0; // 2 = Moved, 0 = Hover

    updateTelemetry(normX, normY, pressure, phase);

    if (!isDrawing) return;

    // Draw segment with dynamic pressure width
    const baseWidth = isEraserActive ? 22 : 4;
    const strokeWidth = Math.max(1, baseWidth * (pressure * 2.2));

    ctx.save();
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEraserActive) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      // Studio styling: subtle cyan/neon stroke
      const currentTheme = container.classList.contains('theme-parchment') ? '#1e293b' : '#00e5ff';
      ctx.strokeStyle = currentTheme;
      ctx.shadowColor = container.classList.contains('theme-parchment') ? 'transparent' : 'rgba(0, 229, 255, 0.4)';
      ctx.shadowBlur = 4;
    }

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    lastX = x;
    lastY = y;
  }

  function endStroke(e) {
    if (!isDrawing) return;
    isDrawing = false;
    saveState();
    const { normX, normY } = getCoordinates(e);
    updateTelemetry(normX, normY, 0, 3); // 3 = Ended
  }

  // Generate 40-Byte Binary Packet Hex Stream Telemetry
  function updateTelemetry(normX, normY, pressure, phase) {
    sequenceNumber++;
    const rawPressure16 = Math.round(pressure * 65535);
    const phaseNames = ['Hover (0)', 'Began (1)', 'Moved (2)', 'Ended (3)'];

    // HUD labels
    pktSeq.textContent = `#${sequenceNumber.toString().padStart(6, '0')}`;
    pktPhase.textContent = phaseNames[phase] || `Unknown (${phase})`;
    pktCoords.textContent = `${normX.toFixed(3)}, ${normY.toFixed(3)}`;
    pktPressure.textContent = `${pressure.toFixed(3)} (${rawPressure16} / 65535)`;

    // Calculate simulated Cartesian tilt from normalized coordinates
    const tiltX = (normX - 0.5) * 45;
    const tiltY = (normY - 0.5) * 45;
    pktTilt.textContent = `X: ${tiltX.toFixed(1)}° Y: ${tiltY.toFixed(1)}°`;

    // 40-byte binary packet hex formatting
    // [0..1] Magic: 0x50 0x4E ('PN')
    // [2] Ver: 0x01
    // [3] Opcode: 0x01
    // [4..7] Sequence (big-endian)
    // [8..15] Mach Timestamp (Double, simulated hex)
    // [16..19] NormX (Float32 hex)
    // [20..23] NormY (Float32 hex)
    // [24..27] Pressure (Float32 hex)
    // [28..31] TiltX (Float32 hex)
    // [32..35] TiltY (Float32 hex)
    // [36] Phase (UInt8)
    // [37..39] Padding: 0x00 0x00 0x00
    const seqHex = sequenceNumber.toString(16).padStart(8, '0').match(/../g).join(' ');
    const phaseHex = phase.toString(16).padStart(2, '0');
    
    // Convert float to hex approximation
    const floatToHex = (val) => {
      const buf = new ArrayBuffer(4);
      new DataView(buf).setFloat32(0, val);
      return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
    };

    const xHex = floatToHex(normX);
    const yHex = floatToHex(normY);
    const pHex = floatToHex(pressure);
    const txHex = floatToHex(tiltX);
    const tyHex = floatToHex(tiltY);

    const hexDump = `50 4e 01 01 ${seqHex} 41 d8 f3 01 b2 44 91 22 ${xHex} ${yHex} ${pHex} ${txHex} ${tyHex} ${phaseHex} 00 00 00`;
    pktHex.textContent = hexDump;
  }

  // Attach Event Listeners
  canvas.addEventListener('pointerdown', startStroke);
  canvas.addEventListener('pointermove', moveStroke);
  window.addEventListener('pointerup', endStroke);

  // Button Listeners
  btnUndo.addEventListener('click', handleUndo);
  btnRedo.addEventListener('click', handleRedo);
  btnEraser.addEventListener('click', toggleEraser);
  if (btnHand) {
    btnHand.addEventListener('pointerdown', onHandDown);
    window.addEventListener('pointerup', onHandUp);
  }
  btnThemeCycle.addEventListener('click', cycleTheme);
  btnClear.addEventListener('click', clearCanvas);

  // Slider & Select Listeners
  pressureSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    pressureValue.textContent = `${Math.round(val * 100)}%`;
  });

  themeSelect.addEventListener('change', (e) => {
    setTheme(e.target.value);
  });

  dockPosSelect.addEventListener('change', (e) => {
    simDock.classList.remove('position-left', 'position-right');
    simDock.classList.add(e.target.value);
    updateStatus('DOCK', `Dock positioned on ${e.target.value === 'position-left' ? 'left' : 'right'}.`);
  });
}

// -------------------------------------------------------------
// 2. FAQ Accordion Logic
// -------------------------------------------------------------
function initFAQAccordion() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      // Close all open items
      items.forEach(i => i.classList.remove('active'));
      // Toggle current
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

// -------------------------------------------------------------
// 3. Copy-to-Clipboard Buttons
// -------------------------------------------------------------
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('.copy-btn');
  copyButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#00e676';
        btn.style.color = '#000';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
        }, 2000);
      } catch (err) {
        console.error('Clipboard copy failed:', err);
      }
    });
  });
}
