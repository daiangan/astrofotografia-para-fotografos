import { clamp, fitCanvas, TAU } from '../lib/dom.js';
import { wavelengthRGB, rgb } from '../lib/color.js';

// Bandas del espectro electromagnético (longitud de onda en metros, escala logarítmica)
const BANDS = [
  { id: 'gamma', name: 'Gamma', ex: 'Supernovas', from: -13, to: -11, color: [176, 132, 255] },
  { id: 'xray', name: 'Rayos X', ex: 'Radiografía', from: -11, to: -8, color: [128, 150, 255] },
  { id: 'uv', name: 'UV', ex: 'Bronceado', from: -8, to: Math.log10(3.8e-7), color: [140, 110, 255] },
  { id: 'vis', name: 'Visible', ex: 'Lo que ves', from: Math.log10(3.8e-7), to: Math.log10(7e-7), color: [120, 220, 160] },
  { id: 'ir', name: 'Infrarrojo', ex: 'Calor', from: Math.log10(7e-7), to: -3, color: [255, 110, 100] },
  { id: 'micro', name: 'Microondas', ex: 'Wi‑Fi', from: -3, to: -1, color: [255, 160, 80] },
  { id: 'radio', name: 'Radio', ex: 'FM · TV', from: -1, to: 3, color: [255, 205, 100] },
];
const LO = -13;
const HI = 3;
const SPAN = HI - LO;
const pct = (log) => ((log - LO) / SPAN) * 100;
const VIS = BANDS[3];

const R0 = 300;
const R1 = 1000;
const rp = (nm) => ((nm - R0) / (R1 - R0)) * 100;

function fmt(m) {
  if (m < 1e-9) return `${(m * 1e12).toFixed(m < 1e-11 ? 2 : 1)} pm`;
  if (m < 1e-6) return `${Math.round(m * 1e9)} nm`;
  if (m < 1e-3) return `${(m * 1e6).toFixed(m < 1e-5 ? 1 : 0)} µm`;
  if (m < 1e-2) return `${(m * 1e3).toFixed(1)} mm`;
  if (m < 1) return `${Math.round(m * 100)} cm`;
  if (m < 1000) return `${m.toFixed(m < 10 ? 1 : 0)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function bandAt(log) {
  return BANDS.find((b) => log >= b.from && log < b.to) || BANDS[BANDS.length - 1];
}

function colorFor(log) {
  const b = bandAt(log);
  if (b.id === 'vis') return wavelengthRGB(Math.pow(10, log) * 1e9);
  return b.color;
}

export default {
  id: 'spectrum',
  title: 'Luz visible',
  steps: 2,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Luz visible</p>
      <h2 class="title rise">Una rendija <em>del universo</em></h2>
    </div>
    <div class="spec grow">
      <div class="spec__top">
        <canvas class="spec__wave"></canvas>
        <div class="spec__readout">
          <span class="spec__lambda mono">550 nm</span>
          <span class="spec__name">Visible</span>
        </div>
      </div>
      <div class="spec__bar" data-interactive>
        ${BANDS.map(
          (b) => `<div class="spec__seg spec__seg--${b.id}" style="left:${pct(b.from)}%;width:${pct(b.to) - pct(b.from)}%;--c:${rgb(b.color)}">
              <div class="spec__label"><b>${b.name}</b><span>${b.ex}</span></div>
            </div>`,
        ).join('')}
        <div class="spec__cursor"><i></i></div>
      </div>
      <svg class="spec__zoom" data-from="1" viewBox="0 0 100 10" preserveAspectRatio="none">
        <polygon points="${pct(VIS.from)},0 ${pct(VIS.to)},0 ${rp(700)},10 ${rp(380)},10" />
      </svg>
      <div class="spec__rainbow-wrap" data-from="1">
        <div class="spec__rainbow"></div>
        <div class="spec__ticks">
          ${[400, 500, 600, 700].map((n) => `<span style="left:${rp(n)}%">${n}<small> nm</small></span>`).join('')}
          <em class="spec__uv" style="left:0">UV cercano</em>
          <em class="spec__ir" style="left:${rp(850)}%">IR cercano</em>
        </div>
        <div class="spec__sensor" data-from="2" style="left:${rp(350)}%;width:${rp(1000) - rp(350)}%">
          <span>Tu sensor también ve por aquí</span>
        </div>
      </div>
    </div>`,
  mount(el, ctx) {
    const wave = fitCanvas(el.querySelector('.spec__wave'));
    const bar = el.querySelector('.spec__bar');
    const cursor = el.querySelector('.spec__cursor');
    const lambdaEl = el.querySelector('.spec__lambda');
    const nameEl = el.querySelector('.spec__name');
    const rainbow = el.querySelector('.spec__rainbow');

    const stops = [];
    for (let nm = R0; nm <= R1; nm += 10) {
      const inside = nm >= 380 && nm <= 700;
      const c = nm < 380 ? [140, 100, 255] : nm > 780 ? [190, 40, 40] : wavelengthRGB(nm);
      stops.push(`${rgb(c, inside ? 1 : 0.24)} ${rp(nm)}%`);
    }
    rainbow.style.background = `linear-gradient(90deg, ${stops.join(',')})`;

    let frac = 0.62;
    let user = false;
    let idleAt = 0;
    let phase = 0;

    const setFrac = (f) => {
      frac = clamp(f, 0.001, 0.999);
    };
    const pointer = (e) => {
      const r = bar.getBoundingClientRect();
      setFrac((e.clientX - r.left) / r.width);
      user = true;
      idleAt = performance.now() + 3500;
    };
    bar.addEventListener('pointerdown', pointer);
    bar.addEventListener('pointermove', pointer);

    ctx.loop((dt) => {
      const now = performance.now();
      if (user && now > idleAt) user = false;
      if (!user && !ctx.reduced) {
        // barrido automático: de las ondas de radio hacia los rayos gamma y de vuelta
        const t = now / 1000;
        setFrac(0.5 + 0.47 * Math.sin(t * 0.16 - 0.9));
      }
      const log = LO + frac * SPAN;
      const m = Math.pow(10, log);
      const c = colorFor(log);
      cursor.style.left = `${frac * 100}%`;
      cursor.style.setProperty('--c', rgb(c));
      lambdaEl.textContent = fmt(m);
      lambdaEl.style.color = rgb(c);
      nameEl.textContent = bandAt(log).name;

      const { ctx: g, w, h } = wave;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      const u = frac;
      const period = 7 + Math.pow(u, 1.7) * (w * 0.55);
      phase += dt * (2.4 + 0.5 / (0.3 + u));
      g.lineWidth = Math.max(2, h * 0.03);
      g.lineJoin = 'round';
      g.strokeStyle = rgb(c);
      g.shadowColor = rgb(c, 0.8);
      g.shadowBlur = h * 0.12;
      g.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const env = 0.25 + 0.75 * Math.sin((x / w) * Math.PI);
        const y = h / 2 + Math.sin((x / period) * TAU - phase * 3) * h * 0.36 * env;
        x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
      g.shadowBlur = 0;
    });
  },
};
