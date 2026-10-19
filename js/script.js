const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let plantillaActual = 'chibi';
let herramientaActiva = 'pincel';
let colorSeleccionado = '#ff758c';
let dibujando = false;
let ultimoX = 0;
let ultimoY = 0;
let historialPasos = [];

// Paleta de colores estilo anime / estético / pastel
const coloresPaleta = [
    '#000000', '#ffffff', '#ff758c', '#ff7eb3', '#7928ca', 
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', 
    '#fee140', '#30cfd0', '#330867', '#a8ede9', '#fed6e3'
];

// Inicializar Paleta de Colores en la Interfaz
const paletteContainer = document.getElementById('colorPalette');
coloresPaleta.forEach((hex, index) => {
    const swatch = document.createElement('div');
    swatch.className = `color-swatch ${index === 2 ? 'active' : ''}`;
    swatch.style.backgroundColor = hex;
    swatch.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        colorSeleccionado = hex;
        if (herramientaActiva === 'borrador') cambiarHerramienta('pincel');
    });
    paletteContainer.appendChild(swatch);
});

function ajustarDimensiones() {
    const wrapper = document.querySelector('.canvas-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    cargarPlantilla(plantillaActual);
}

window.addEventListener('resize', ajustarDimensiones);

// Cambio de Herramientas
function cambiarHerramienta(tool) {
    herramientaActiva = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
    });
}

document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => cambiarHerramienta(btn.dataset.tool));
});

// Selección de Plantillas Artísticas
document.querySelectorAll('.thumb-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        plantillaActual = btn.dataset.template;
        cargarPlantilla(plantillaActual);
    });
});

function cargarPlantilla(tipo) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 5;
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    if (tipo === 'chibi') {
        // Silueta Chibi Anime Estilizada
        // Cabeza
        ctx.beginPath();
        ctx.arc(cx, cy - 30, 80, 0, Math.PI * 2);
        ctx.stroke();
        // Ojos Anime Grandes
        ctx.beginPath();
        ctx.arc(cx - 30, cy - 40, 20, 0, Math.PI * 2);
        ctx.arc(cx + 30, cy - 40, 20, 0, Math.PI * 2);
        ctx.stroke();
        // Brillo Ojos
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        ctx.arc(cx - 25, cy - 45, 6, 0, Math.PI * 2);
        ctx.arc(cx + 35, cy - 45, 6, 0, Math.PI * 2);
        ctx.fill();
        // Pelo orejas de gato / nekocat
        ctx.beginPath();
        ctx.moveTo(cx - 70, cy - 80);
        ctx.lineTo(cx - 40, cy - 130);
        ctx.lineTo(cx - 10, cy - 90);
        ctx.moveTo(cx + 70, cy - 80);
        ctx.lineTo(cx + 40, cy - 130);
        ctx.lineTo(cx + 10, cy - 90);
        ctx.stroke();
        // Cuerpo y Lazo
        ctx.beginPath();
        ctx.moveTo(cx - 30, cy + 50);
        ctx.lineTo(cx - 50, cy + 130);
        ctx.lineTo(cx + 50, cy + 130);
        ctx.lineTo(cx + 30, cy + 50);
        ctx.stroke();

    } else if (tipo === 'paisaje') {
        // Paisaje Aesthetic / Montañas y Luna
        ctx.beginPath();
        ctx.arc(cx + 80, cy - 70, 45, 0, Math.PI * 2); // Luna
        ctx.stroke();
        // Montañas
        ctx.beginPath();
        ctx.moveTo(cx - 180, cy + 100);
        ctx.lineTo(cx - 60, cy - 40);
        ctx.lineTo(cx + 40, cy + 100);
        ctx.lineTo(cx + 150, cy - 20);
        ctx.lineTo(cx + 220, cy + 100);
        ctx.stroke();
        // Estrellas
        [[-100, -80], [80, -120], [-40, -140], [130, -40]].forEach(([px, py]) => {
            ctx.beginPath();
            ctx.arc(cx + px, cy + py, 4, 0, Math.PI * 2);
            ctx.fill();
        });

    } else if (tipo === 'cyberpunk') {
        // Cyber City / Edificios futuristas
        ctx.strokeRect(cx - 120, cy - 80, 70, 180);
        ctx.strokeRect(cx - 40, cy - 120, 80, 220);
        ctx.strokeRect(cx + 50, cy - 50, 70, 150);
        // Detalles de ventanas
        ctx.strokeRect(cx - 105, cy - 60, 40, 30);
        ctx.strokeRect(cx - 20, cy - 100, 40, 40);
    }

    guardarEstadoCanvas();
}

function guardarEstadoCanvas() {
    if (historialPasos.length > 20) historialPasos.shift();
    historialPasos.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

// Eventos de Dibujo Táctil y Mouse
canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (herramientaActiva === 'relleno') {
        ejecutarRelleno(Math.floor(x), Math.floor(y), colorSeleccionado);
        guardarEstadoCanvas();
    } else {
        dibujando = true;
        ultimoX = x;
        ultimoY = y;
    }
});

canvas.addEventListener('pointermove', (e) => {
    if (!dibujando || herramientaActiva === 'relleno') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(ultimoX, ultimoY);
    ctx.lineTo(x, y);

    const grosor = Number(document.getElementById('brushSize').value);

    if (herramientaActiva === 'borrador') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = grosor * 1.5;
        ctx.shadowBlur = 0;
    } else if (herramientaActiva === 'neon') {
        ctx.strokeStyle = colorSeleccionado;
        ctx.lineWidth = grosor * 0.75;
        ctx.shadowColor = colorSeleccionado;
        ctx.shadowBlur = 15;
    } else {
        ctx.strokeStyle = colorSeleccionado;
        ctx.lineWidth = grosor;
        ctx.shadowBlur = 0;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset sombra

    ultimoX = x;
    ultimoY = y;
});

window.addEventListener('pointerup', () => {
    if (dibujando) {
        dibujando = false;
        guardarEstadoCanvas();
    }
});

// Botón Deshacer (Undo)
document.getElementById('btnUndo').addEventListener('click', () => {
    if (historialPasos.length > 1) {
        historialPasos.pop(); // Quitar estado actual
        const anterior = historialPasos[historialPasos.length - 1];
        ctx.putImageData(anterior, 0, 0);
    }
});

// Botón Limpiar
document.getElementById('btnClear').addEventListener('click', () => {
    cargarPlantilla(plantillaActual);
});

// Botón Guardar / Descargar
document.getElementById('btnSave').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'mi-arte-anime.png';
    link.href = canvas.toDataURL();
    link.click();
});

// Algoritmo de Cubeta (Flood Fill)
function ejecutarRelleno(startX, startY, fillColor) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    const targetColor = [
        data[(startY * canvas.width + startX) * 4],
        data[(startY * canvas.width + startX) * 4 + 1],
        data[(startY * canvas.width + startX) * 4 + 2],
        data[(startY * canvas.width + startX) * 4 + 3]
    ];

    const rgbFill = hexToRgb(fillColor);
    if (coloresSimilares(targetColor, [rgbFill.r, rgbFill.g, rgbFill.b, 255])) return;

    const pila = [[startX, startY]];
    const w = canvas.width;
    const h = canvas.height;

    while (pila.length > 0) {
        const [x, y] = pila.pop();
        if (x < 0 || x >= w || y < 0 || y >= h) continue;

        const idx = (y * w + x) * 4;
        if (cumpleTolerancia(data, idx, targetColor)) {
            data[idx] = rgbFill.r;
            data[idx + 1] = rgbFill.g;
            data[idx + 2] = rgbFill.b;
            data[idx + 3] = 255;

            pila.push([x + 1, y]);
            pila.push([x - 1, y]);
            pila.push([x, y + 1]);
            pila.push([x, y - 1]);
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function cumpleTolerancia(data, idx, baseColor) {
    const tol = 35;
    return (
        Math.abs(data[idx] - baseColor[0]) < tol &&
        Math.abs(data[idx + 1] - baseColor[1]) < tol &&
        Math.abs(data[idx + 2] - baseColor[2]) < tol
    );
}

function coloresSimilares(c1, c2) {
    return Math.abs(c1[0] - c2[0]) < 5 && Math.abs(c1[1] - c2[1]) < 5 && Math.abs(c1[2] - c2[2]) < 5;
}

function hexToRgb(hex) {
    const num = parseInt(hex.slice(1), 16);
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

window.onload = ajustarDimensiones;
