(() => {
  const canvas = document.getElementById('canvas');
  const wrap = document.getElementById('canvasWrap');
  const ctx = canvas.getContext('2d');
  const sizeInput = document.getElementById('brushSize');
  const sizeValue = document.getElementById('sizeValue');
  const hint = document.getElementById('canvasHint');
  const toast = document.getElementById('toast');

  let tool = 'brush', color = '#ff76ad', brushSize = 8, background = '#ffffff';
  let drawing = false, lastPoint = null, undoStack = [], hasArtwork = false, toastTimer;
  let dpr = Math.max(1, window.devicePixelRatio || 1);

  function paintBackground() {
    const w = canvas.width, h = canvas.height;
    if (background === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#fff0f7'); g.addColorStop(.5, '#e9e4ff'); g.addColorStop(1, '#e3fbf4');
      ctx.fillStyle = g;
    } else ctx.fillStyle = background;
    ctx.fillRect(0, 0, w, h);
  }

  function resizeCanvas(preserve = true) {
    let old;
    if (preserve && canvas.width && canvas.height) old = document.createElement('canvas');
    if (old) { old.width = canvas.width; old.height = canvas.height; old.getContext('2d').drawImage(canvas, 0, 0); }
    const rect = wrap.getBoundingClientRect();
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    paintBackground();
    if (old) ctx.drawImage(old, 0, 0, old.width, old.height, 0, 0, canvas.width, canvas.height);
    else saveState();
  }

  function saveState() {
    try {
      undoStack.push(canvas.toDataURL('image/png'));
      if (undoStack.length > 30) undoStack.shift();
    } catch(e) {}
  }

  function restoreState(data) {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      hasArtwork = undoStack.length > 1;
      hint.style.display = hasArtwork ? 'none' : 'block';
    };
    img.src = data;
  }

  function pointFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr };
  }

  function startDraw(e) {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    drawing = true;
    canvas.setPointerCapture?.(e.pointerId);
    lastPoint = pointFromEvent(e);
    if (tool === 'sticker') {
      addSticker(selectedSticker, lastPoint);
      drawing = false;
      saveState();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? backgroundColorForBrush() : color;
    ctx.lineWidth = brushSize * dpr * (tool === 'marker' ? 2.2 : 1);
    if (tool === 'marker') ctx.globalAlpha = .42;
    else ctx.globalAlpha = 1;
    ctx.lineTo(lastPoint.x + .1, lastPoint.y + .1);
    ctx.stroke();
    ctx.globalAlpha = 1;
    hasArtwork = true; hint.style.display = 'none';
  }

  function backgroundColorForBrush() {
    if (background !== 'gradient') return background;
    return '#ffffff';
  }

  function moveDraw(e) {
    if (!drawing || tool === 'sticker') return;
    e.preventDefault();
    const p = pointFromEvent(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(p.x, p.y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? backgroundColorForBrush() : color;
    ctx.lineWidth = brushSize * dpr * (tool === 'marker' ? 2.2 : 1);
    ctx.globalAlpha = tool === 'marker' ? .42 : 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
    lastPoint = p;
  }

  function endDraw() {
    if (!drawing) return;
    drawing = false; lastPoint = null;
    saveState();
  }

  let selectedSticker = '⭐';
  function addSticker(sticker, p) {
    const fontSize = Math.max(25, brushSize * 4.2) * dpr;
    ctx.save();
    ctx.font = `${fontSize}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(sticker, p.x, p.y);
    ctx.restore();
    hasArtwork = true; hint.style.display = 'none';
    showToast('¡Pegatina añadida! ✨');
  }

  function showToast(message) {
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1900);
  }

  function clearCanvas(ask = true) {
    if (ask && hasArtwork && !confirm('¿Quieres empezar de nuevo? Tu dibujo actual se borrará.')) return;
    ctx.setTransform(1,0,0,1,0,0);
    paintBackground(); undoStack = []; saveState();
    hasArtwork = false; hint.style.display = 'block';
    showToast('Lienzo listo para una nueva idea 💗');
  }

  function undo() {
    if (undoStack.length <= 1) {
      if (undoStack.length === 1) restoreState(undoStack[0]);
      showToast('¡Ya estás al comienzo!');
      return;
    }
    undoStack.pop();
    restoreState(undoStack[undoStack.length - 1]);
    showToast('Último paso deshecho ↶');
  }

  function saveImage() {
    const link = document.createElement('a');
    link.download = 'mi-obra-dream-studio.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('¡Tu obra está guardada! 🌟');
  }

  document.querySelectorAll('.tool').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); tool = btn.dataset.tool;
    canvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
    showToast(({brush:'Pincel suave seleccionado 🖌️',pencil:'Lápiz seleccionado ✏️',marker:'Marcador seleccionado 🖍️',eraser:'Borrador seleccionado 🧽'})[tool]);
  }));

  document.querySelectorAll('.swatch').forEach(btn => btn.addEventListener('click', () => setColor(btn.dataset.color, btn)));
  function setColor(next, selectedButton) {
    color = next;
    document.querySelectorAll('.swatch').forEach(b => b.classList.remove('active'));
    if (selectedButton) selectedButton.classList.add('active');
    document.getElementById('customColor').value = next;
  }
  document.getElementById('customColor').addEventListener('input', e => setColor(e.target.value, null));

  sizeInput.addEventListener('input', () => {
    brushSize = Number(sizeInput.value);
    sizeValue.textContent = `${brushSize} px`;
  });

  document.querySelectorAll('.bg-choice').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.bg-choice').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    background = btn.dataset.bg;
    const previous = document.createElement('canvas');
    previous.width = canvas.width; previous.height = canvas.height;
    previous.getContext('2d').drawImage(canvas, 0, 0);
    paintBackground();
    ctx.drawImage(previous, 0, 0);
    saveState();
    showToast('¡Fondo actualizado! 🌈');
  }));

  document.querySelectorAll('.sticker').forEach(btn => btn.addEventListener('click', () => {
    selectedSticker = btn.dataset.sticker;
    tool = 'sticker';
    document.querySelectorAll('.tool').forEach(b => b.classList.remove('active'));
    hint.textContent = `Haz clic en el lienzo para colocar ${selectedSticker}`;
    hint.style.display = 'block';
    showToast(`Ahora coloca tu pegatina ${selectedSticker}`);
  }));

  canvas.addEventListener('pointerdown', startDraw);
  canvas.addEventListener('pointermove', moveDraw);
  canvas.addEventListener('pointerup', endDraw);
  canvas.addEventListener('pointercancel', endDraw);
  canvas.addEventListener('pointerleave', endDraw);
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('clearBtn').addEventListener('click', () => clearCanvas(true));
  document.getElementById('newBtn').addEventListener('click', () => clearCanvas(true));
  document.getElementById('saveBtn').addEventListener('click', saveImage);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  });

  if ('ResizeObserver' in window) new ResizeObserver(() => resizeCanvas(true)).observe(wrap);
  else window.addEventListener('resize', () => resizeCanvas(true));
  requestAnimationFrame(() => resizeCanvas(false));
})();
