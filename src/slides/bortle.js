import { bindRange, clamp, fitCanvas, loadImage, rng, setRange, tween, TAU } from '../lib/dom.js';
import { loadSky, toGalactic, bvColor } from '../lib/sky.js';

const CLASSES = [
  { name: 'Excelente cielo oscuro', see: 'La Vía Láctea proyecta sombras', nelm: 7.8, mw: 1, glow: 0 },
  { name: 'Típicamente oscuro', see: 'Vía Láctea llena de detalle', nelm: 7.3, mw: 0.95, glow: 0.03 },
  { name: 'Cielo rural', see: 'Vía Láctea con estructura', nelm: 6.8, mw: 0.85, glow: 0.08 },
  { name: 'Rural a suburbano', see: 'Vía Láctea, sin detalles finos', nelm: 6.3, mw: 0.6, glow: 0.16 },
  { name: 'Cielo suburbano', see: 'Vía Láctea apenas visible', nelm: 5.8, mw: 0.35, glow: 0.28 },
  { name: 'Suburbano brillante', see: 'Solo un rastro cerca del cénit', nelm: 5.3, mw: 0.15, glow: 0.42 },
  { name: 'Suburbano a urbano', see: 'Ni rastro de la Vía Láctea', nelm: 4.8, mw: 0.04, glow: 0.58 },
  { name: 'Cielo urbano', see: 'Solo las estrellas brillantes', nelm: 4.3, mw: 0, glow: 0.76 },
  { name: 'Centro de ciudad', see: 'Unas pocas estrellas', nelm: 3.8, mw: 0, glow: 0.94 },
];

const L_RANGE = 130; // grados de longitud galáctica visibles
const B_MIN = -12;
const B_MAX = 38;

export default {
  id: 'bortle',
  title: 'Escala de Bortle',
  tone: 'dark',
  steps: 1,
  bg: () => '<canvas id="bt-c" class="bt__sky"></canvas>',
  html: () => `
    <div class="bt">
      <div class="bt__info">
        <p class="eyebrow rise">Condiciones del cielo</p>
        <div class="bt__num rise"><span id="bt-n">1</span><small>Escala de Bortle</small></div>
        <h2 class="bt__name" id="bt-name">Excelente cielo oscuro</h2>
        <p class="bt__see" id="bt-see">La Vía Láctea proyecta sombras</p>
        <p class="bt__mag mono" id="bt-mag">Magnitud límite 7.6 – 8.0</p>
      </div>
      <div class="bt__ctrl rise" data-interactive>
        <div class="bt__bar"><i></i></div>
        <input id="bt-r" type="range" min="1" max="9" step="0.01" value="1" />
        <div class="bt__ticks">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<span>${n}</span>`).join('')}</div>
      </div>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#bt-c'), () => draw());
    const range = el.querySelector('#bt-r');
    let sky = null;
    let mw = null;
    let tiny = null;
    let faint = [];
    let level = 1;
    let mwLayer = null;

    Promise.all([loadSky(), loadImage('hero')]).then(([s, img]) => {
      sky = s;
      mw = img;
      // estrellas débiles sintéticas (mag 6-8.2), más densas cerca del plano galáctico
      const r = rng(31);
      for (let i = 0; i < 5200; i++) {
        const l = (r() - 0.5) * L_RANGE;
        const b = clamp((r() - 0.5) * 2 * 26 + 6, B_MIN, B_MAX);
        const keep = Math.exp(-((b - 0) ** 2) / (2 * 14 * 14)) * 0.75 + 0.25;
        if (r() > keep) continue;
        faint.push({ l, b, m: 6 + Math.pow(r(), 0.55) * 2.3, c: [r() * 0.6, 0.4 + r() * 0.5] });
      }
      draw();
    });

    function makeMwLayer(w, h) {
      // recorte de la Vía Láctea, reducido para difuminarlo
      const sw = (L_RANGE / 360) * mw.width;
      const sh = ((B_MAX - B_MIN) / 180) * mw.height;
      const sx = (0.5 - (L_RANGE / 2) / 360) * mw.width;
      const sy = (0.5 - B_MAX / 180) * mw.height;
      const c = document.createElement('canvas');
      c.width = Math.round(w / 8);
      c.height = Math.round(h / 8);
      const g = c.getContext('2d');
      g.drawImage(mw, sx, sy, sw, sh, 0, 0, c.width, c.height);
      return c;
    }

    function draw() {
      const { ctx: g, w, h } = view;
      if (!w || !sky || !mw) return;
      if (!mwLayer || mwLayer.w !== w) mwLayer = { c: makeMwLayer(w, h), w };
      const i0 = Math.floor(level) - 1;
      const i1 = Math.min(8, i0 + 1);
      const f = level - Math.floor(level);
      const mix = (k) => CLASSES[i0][k] * (1 - f) + CLASSES[i1][k] * f;
      const glow = mix('glow');
      const nelm = mix('nelm');
      const mwA = mix('mw');

      g.clearRect(0, 0, w, h);
      // cielo base
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, `rgb(${6 + glow * 40},${8 + glow * 28},${20 + glow * 20})`);
      bg.addColorStop(1, `rgb(${10 + glow * 150},${14 + glow * 88},${30 + glow * 42})`);
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);

      // Vía Láctea
      if (mwA > 0.01) {
        g.save();
        g.globalCompositeOperation = 'screen';
        g.globalAlpha = clamp(mwA * 1.0, 0, 1);
        g.imageSmoothingEnabled = true;
        g.imageSmoothingQuality = 'high';
        g.filter = 'contrast(1.25) brightness(1.5) saturate(1.1)';
        g.drawImage(mwLayer.c, 0, 0, w, h);
        g.restore();
      }

      // estrellas del catálogo + débiles
      const X = (l) => w * (0.5 - (((l + 180) % 360) - 180) / L_RANGE);
      const Y = (b) => h * (1 - (b - B_MIN) / (B_MAX - B_MIN));
      const drawStar = (l, b, m, col) => {
        const lc = ((l + 180) % 360) - 180;
        if (Math.abs(lc) > L_RANGE / 2 + 2) return;
        if (m > nelm) return;
        const x = X(l);
        const y = Y(b);
        if (y < 0 || y > h) return;
        const a = clamp((nelm - m) * 0.5 + 0.25, 0.2, 1) * (1 - glow * 0.35);
        const size = Math.max(0.45, (7.4 - m) * (w / 3400)) * (m < 2.5 ? 1.5 : 1);
        g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
        g.beginPath();
        g.arc(x, y, size, 0, TAU);
        g.fill();
      };
      for (const s of sky.stars) {
        const gal = toGalactic(s[0], s[1]);
        drawStar(gal.l, gal.b, s[2], bvColor(s[3]));
      }
      for (const s of faint) {
        const g2 = Math.round(s.c[1] * 60 + 195);
        drawStar(-s.l, s.b, s.m, [g2 - 10, g2, 255]);
      }

      // domo de luz en el horizonte
      const dome = g.createRadialGradient(w * 0.32, h * 1.05, 0, w * 0.32, h * 1.05, h * (0.6 + glow * 1.1));
      dome.addColorStop(0, `rgba(255,170,90,${0.9 * glow})`);
      dome.addColorStop(0.45, `rgba(255,140,80,${0.34 * glow})`);
      dome.addColorStop(1, 'rgba(255,120,60,0)');
      g.fillStyle = dome;
      g.fillRect(0, 0, w, h);

      // paisaje
      g.fillStyle = '#020308';
      g.beginPath();
      g.moveTo(0, h);
      for (let x = 0; x <= w; x += 6) {
        const t = x / w;
        const y = h * 0.93 - Math.sin(t * 9 + 1) * h * 0.02 - Math.sin(t * 23) * h * 0.012 - Math.max(0, Math.sin(t * 3.1 + 0.4)) * h * 0.05;
        g.lineTo(x, y);
      }
      g.lineTo(w, h);
      g.closePath();
      g.fill();
    }

    let stop = null;
    bindRange(range, (v) => {
      level = v;
      const c = CLASSES[Math.round(v) - 1];
      const n = Math.round(v);
      el.querySelector('#bt-n').textContent = n;
      el.querySelector('#bt-name').textContent = c.name;
      el.querySelector('#bt-see').textContent = c.see;
      const lo = (c.nelm - 0.2).toFixed(1);
      const hi = (c.nelm + 0.2).toFixed(1);
      el.querySelector('#bt-mag').textContent = n === 9 ? 'Magnitud límite < 4.0' : `Magnitud límite ${lo} – ${hi}`;
      draw();
    });
    range.addEventListener('pointerdown', () => stop && stop());
    return {
      step(n, info) {
        if (stop) stop();
        if (n === 0) setRange(range, 1);
        else stop = tween(1, 9, info.initial ? 1 : 9000, (v) => setRange(range, v), (t) => t);
      },
    };
  },
};
