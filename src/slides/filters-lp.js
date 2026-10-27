import { fitCanvas, cssVar, tween } from '../lib/dom.js';
import { wavelengthRGB } from '../lib/color.js';

const L0 = 400;
const L1 = 700;
const g = (l, c, s, a) => a * Math.exp(-(((l - c) / s) ** 2) / 2);

// Emisión típica del alumbrado público (mercurio, sodio, LED)
const pollution = (l) =>
  g(l, 405, 1.5, 0.35) + g(l, 436, 1.5, 0.5) + g(l, 546, 1.5, 0.45) + g(l, 578, 1.5, 0.4) +
  g(l, 589, 1.6, 1.0) + g(l, 600, 22, 0.32) + g(l, 450, 12, 0.34) + g(l, 590, 65, 0.22);

// Líneas de emisión de las nebulosas
const LINES = [
  { l: 486.1, a: 0.42, name: 'Hβ' },
  { l: 495.9, a: 0.4, name: '' },
  { l: 500.7, a: 1.0, name: 'OIII' },
  { l: 656.3, a: 1.0, name: 'Hα' },
  { l: 671.6, a: 0.35, name: 'SII' },
];
const nebula = (l) => LINES.reduce((s, x) => s + g(l, x.l, 1.4, x.a), 0);

const smooth = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const T = [
  () => 1,
  // anti‑contaminación de banda ancha: corta la zona del sodio y el mercurio amarillo‑verde
  (l) => 1 - (smooth(l, 548, 556) * (1 - smooth(l, 612, 620))) * 0.96,
  // banda estrecha dual: solo alrededor de OIII/Hβ y Hα
  (l) => Math.max(g(l, 500, 12, 0.98), g(l, 656.3, 7, 0.98)),
];

function integrate(fn, tr) {
  let s = 0;
  for (let l = L0; l <= L1; l += 0.5) s += fn(l) * tr(l);
  return s;
}
const P0 = integrate(pollution, T[0]);
const N0 = integrate(nebula, T[0]);
const METER = T.map((t) => ({ p: integrate(pollution, t) / P0, n: integrate(nebula, t) / N0 }));

const CAPTIONS = [
  { t: 'Sin filtro', s: 'Todo entra: nebulosa y farolas' },
  { t: 'Anti‑contaminación', s: 'Corta el amarillo del alumbrado' },
  { t: 'Banda estrecha', s: 'Solo deja pasar Hα y OIII' },
];

export default {
  id: 'filters-lp',
  title: 'Filtros: contaminación y banda estrecha',
  steps: 2,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Filtros</p>
      <h2 class="title rise">Dejar pasar <em>solo lo bueno</em></h2>
    </div>
    <div class="flt grow">
      <div class="canvas-box flt__chart rise"><canvas id="flt-c"></canvas></div>
      <div class="flt__meters rise">
        <div class="meter"><div class="meter__bar"><i id="m-p"></i></div><b>Luz de la ciudad</b><span id="m-pv">100 %</span></div>
        <div class="meter meter--good"><div class="meter__bar"><i id="m-n"></i></div><b>Luz de la nebulosa</b><span id="m-nv">100 %</span></div>
      </div>
    </div>
    <div class="flt__caps rise">
      ${CAPTIONS.map((c, i) => `<div class="flt__cap" data-i="${i}"><b>${c.t}</b><span>${c.s}</span></div>`).join('')}
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#flt-c'));
    const mp = el.querySelector('#m-p');
    const mn = el.querySelector('#m-n');
    const caps = Array.from(el.querySelectorAll('.flt__cap'));
    let k = 0; // filtro interpolado (0, 1, 2)
    let stopTween = null;

    function tr(l) {
      const i = Math.min(1, Math.floor(k));
      const f = k - i;
      return T[i](l) * (1 - f) + T[Math.min(2, i + 1)](l) * f;
    }

    function draw() {
      const { ctx: c, w, h } = view;
      if (!w) return;
      c.clearRect(0, 0, w, h);
      const pad = { l: 0.03 * w, r: 0.03 * w, t: 0.08 * h, b: 0.2 * h };
      const X = (l) => pad.l + ((l - L0) / (L1 - L0)) * (w - pad.l - pad.r);
      const base = h - pad.b;
      const H = base - pad.t;
      // tira de color
      for (let l = L0; l < L1; l += 3) {
        const col = wavelengthRGB(l);
        c.fillStyle = `rgb(${col})`;
        c.globalAlpha = 0.9;
        c.fillRect(X(l), base + 8, X(l + 3) - X(l) + 1, h * 0.05);
      }
      c.globalAlpha = 1;
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.font = `${Math.max(11, w * 0.017)}px "JetBrains Mono Variable", monospace`;
      c.textAlign = 'center';
      [400, 450, 500, 550, 600, 650, 700].forEach((l) => c.fillText(String(l), X(l), h - 6));
      // transmisión del filtro
      c.beginPath();
      c.moveTo(X(L0), base);
      for (let l = L0; l <= L1; l += 1) c.lineTo(X(l), base - tr(l) * H * 0.98);
      c.lineTo(X(L1), base);
      c.closePath();
      c.fillStyle = 'rgba(140,180,255,0.16)';
      c.fill();
      c.strokeStyle = cssVar('--accent');
      c.lineWidth = 2.5;
      c.beginPath();
      for (let l = L0; l <= L1; l += 1) (l === L0 ? c.moveTo(X(l), base - tr(l) * H * 0.98) : c.lineTo(X(l), base - tr(l) * H * 0.98));
      c.stroke();
      // contaminación lumínica (naranja) y nebulosa (líneas de color)
      c.beginPath();
      c.moveTo(X(L0), base);
      for (let l = L0; l <= L1; l += 0.5) c.lineTo(X(l), base - pollution(l) * H * 0.6 * (0.18 + 0.82 * tr(l)));
      c.lineTo(X(L1), base);
      c.fillStyle = 'rgba(255,170,80,0.55)';
      c.fill();
      c.strokeStyle = '#ffb060';
      c.lineWidth = 1.5;
      c.stroke();
      const lc = { 486.1: '#4aa8ff', 495.9: '#3ad6c8', 500.7: '#3ad6c8', 656.3: '#ff4d5e', 671.6: '#ff8a55' };
      c.textAlign = 'center';
      c.font = `600 ${Math.max(12, w * 0.02)}px "Inter Variable", sans-serif`;
      for (const line of LINES) {
        const t = tr(line.l);
        const y = base - line.a * H * 0.9 * (0.3 + 0.7 * t);
        c.strokeStyle = lc[line.l];
        c.lineWidth = Math.max(2.5, w * 0.004);
        c.beginPath();
        c.moveTo(X(line.l), base);
        c.lineTo(X(line.l), y);
        c.stroke();
        c.fillStyle = lc[line.l];
        c.beginPath();
        c.arc(X(line.l), y, c.lineWidth * 1.1, 0, Math.PI * 2);
        c.fill();
        if (line.name) c.fillText(line.name, X(line.l), y - 12);
      }
      c.fillStyle = '#ffb060';
      c.textAlign = 'left';
      c.fillText('Sodio', X(589) + 12, base - pollution(589) * H * 0.6 * (0.18 + 0.82 * tr(589)) - 6);
      // meters
      const i = Math.min(1, Math.floor(k));
      const f = k - i;
      const mix = (key) => METER[i][key] * (1 - f) + METER[Math.min(2, i + 1)][key] * f;
      mp.style.height = `${mix('p') * 100}%`;
      mn.style.height = `${mix('n') * 100}%`;
      el.querySelector('#m-pv').textContent = `${Math.round(mix('p') * 100)} %`;
      el.querySelector('#m-nv').textContent = `${Math.round(mix('n') * 100)} %`;
    }

    window.addEventListener('themechange', draw);
    new ResizeObserver(draw).observe(el.querySelector('#flt-c'));
    return {
      step(n, info) {
        caps.forEach((c) => c.classList.toggle('on', +c.dataset.i === n));
        if (stopTween) stopTween();
        if (info.initial) {
          k = n;
          draw();
        } else stopTween = tween(k, n, 1000, (v) => {
          k = v;
          draw();
        });
      },
    };
  },
};
