import { bindRange, bindSegmented, fitCanvas, setRange, cssVar, clamp, TAU, DEG } from '../lib/dom.js';

const PRESETS = [
  { id: 'lens', label: 'Lente 200 mm f/2.8', D: 71, F: 200 },
  { id: 'refr', label: 'Refractor 80/480', D: 80, F: 480 },
  { id: 'newt', label: 'Newton 200/1000', D: 200, F: 1000 },
  { id: 'sct', label: 'SCT 8″', D: 203, F: 2032 },
];

const SENSOR = { w: 23.5, h: 15.6 }; // APS‑C, mm
const MOON_DEG = 0.52;

const fmtDeg = (d) => (d >= 10 ? d.toFixed(0) : d.toFixed(1));

export default {
  id: 'lensvs',
  title: 'Telescopio vs. lente',
  steps: 0,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Telescopio vs. lente</p>
      <h2 class="title rise">Tu lente, <em>pero gigante</em></h2>
    </div>
    <div class="lv grow">
      <div class="lv__left">
        <div class="lv__read rise">
          <div class="lv__f"><span class="lv__fx">f/</span><span id="lv-f">5.6</span></div>
          <div class="lv__facts">
            <div><b id="lv-fov">4.1° × 2.7°</b><span>Campo de visión</span></div>
            <div><b id="lv-light">×840</b><span>Luz vs. tu ojo</span></div>
          </div>
        </div>
        <div class="lv__controls rise" data-interactive>
          <div class="control"><label>Apertura <output id="o-d">100 mm</output></label>
            <input id="r-d" type="range" min="30" max="300" step="1" value="100" /></div>
          <div class="control"><label>Distancia focal <output id="o-f">560 mm</output></label>
            <input id="r-f" type="range" min="50" max="2500" step="10" value="560" /></div>
          <div class="seg lv__presets" data-seg>
            ${PRESETS.map((p) => `<button data-v="${p.id}">${p.label}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="lv__right">
        <div class="canvas-box lv__optics rise"><canvas id="lv-optics"></canvas><span class="lv__tag lv__tag--a">Apertura</span><span class="lv__tag lv__tag--f">Distancia focal</span></div>
        <div class="canvas-box lv__fov rise"><canvas id="lv-fov-c"></canvas><span class="lv__tag lv__tag--m">Luna llena</span></div>
      </div>
    </div>
    <p class="tie rise"><b>En fotografía</b> El número f es el mismo de tu lente. Aquí manda la apertura.</p>`,
  mount(el, ctx) {
    const optics = fitCanvas(el.querySelector('#lv-optics'));
    const fovC = fitCanvas(el.querySelector('#lv-fov-c'));
    const rd = el.querySelector('#r-d');
    const rf = el.querySelector('#r-f');
    const state = { D: 100, F: 560, tD: 100, tF: 560 };

    const readout = () => {
      const { D, F } = state;
      el.querySelector('#lv-f').textContent = (F / D).toFixed(1);
      el.querySelector('#o-d').textContent = `${Math.round(D)} mm`;
      el.querySelector('#o-f').textContent = `${Math.round(F)} mm`;
      const fw = 2 * Math.atan(SENSOR.w / (2 * F)) / DEG;
      const fh = 2 * Math.atan(SENSOR.h / (2 * F)) / DEG;
      el.querySelector('#lv-fov').textContent = `${fmtDeg(fw)}° × ${fmtDeg(fh)}°`;
      el.querySelector('#lv-light').textContent = `×${Math.round((D / 7) ** 2).toLocaleString('es')}`;
    };

    const drawOptics = () => {
      const { ctx: g, w, h } = optics;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      const { D, F } = state;
      const s = Math.min((w * 0.74) / F, (h * 0.64) / D);
      const x0 = w * 0.1;
      const cy = h / 2;
      const half = (D * s) / 2;
      const fx = x0 + F * s;
      const warm = cssVar('--warm') || '#ffbb74';
      const accent = cssVar('--accent') || '#8cb4ff';
      // haz entrante
      g.fillStyle = 'rgba(255,187,116,0.08)';
      g.beginPath();
      g.moveTo(0, cy - half);
      g.lineTo(x0, cy - half);
      g.lineTo(fx, cy);
      g.lineTo(x0, cy + half);
      g.lineTo(0, cy + half);
      g.closePath();
      g.fill();
      g.strokeStyle = warm;
      g.lineWidth = 1.6;
      for (let i = -3; i <= 3; i++) {
        const y = cy + (i / 3) * half * 0.94;
        g.globalAlpha = i === 0 ? 1 : 0.8;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(x0, y);
        g.lineTo(fx, cy);
        g.stroke();
      }
      g.globalAlpha = 1;
      // objetivo
      g.strokeStyle = accent;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(x0, cy - half);
      g.lineTo(x0, cy + half);
      g.stroke();
      g.fillStyle = accent;
      g.beginPath();
      g.ellipse(x0, cy, Math.max(3, half * 0.12), half, 0, 0, TAU);
      g.globalAlpha = 0.22;
      g.fill();
      g.globalAlpha = 1;
      // sensor
      g.fillStyle = cssVar('--fg') || '#fff';
      g.fillRect(fx - 2, cy - Math.max(6, (SENSOR.h * s) / 2), 4, Math.max(12, SENSOR.h * s));
      g.beginPath();
      g.arc(fx, cy, 4, 0, TAU);
      g.fillStyle = warm;
      g.fill();
      // cotas
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = 1;
      g.setLineDash([4, 5]);
      g.beginPath();
      g.moveTo(x0 - 14, cy - half);
      g.lineTo(x0 - 14, cy + half);
      g.moveTo(x0, cy + Math.max(half, 10) + 18);
      g.lineTo(fx, cy + Math.max(half, 10) + 18);
      g.stroke();
      g.setLineDash([]);
      const tagA = el.querySelector('.lv__tag--a');
      const tagF = el.querySelector('.lv__tag--f');
      tagA.style.left = `${Math.max(2, x0 - 14 - 2)}px`;
      tagA.style.top = `${clamp(cy - half - 26, 6, h - 60)}px`;
      tagF.style.left = `${(x0 + fx) / 2}px`;
      tagF.style.top = `${clamp(cy + Math.max(half, 10) + 26, 8, h - 34)}px`;
    };

    const drawFov = () => {
      const { ctx: g, w, h } = fovC;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      const fw = (2 * Math.atan(SENSOR.w / (2 * state.F))) / DEG;
      const fh = (2 * Math.atan(SENSOR.h / (2 * state.F))) / DEG;
      // el encuadre ocupa el lienzo; la Luna se dibuja a escala real dentro de él
      const pad = 10;
      const rw = w - pad * 2;
      const rh = h - pad * 2;
      const scale = Math.min(rw / fw, rh / fh);
      const mw = MOON_DEG * scale;
      const cx = w / 2;
      const cy = h / 2;
      // campo de estrellas de fondo (fijo)
      g.fillStyle = 'rgba(200,215,255,0.5)';
      for (let i = 0; i < 40; i++) {
        const px = (Math.sin(i * 91.7) * 0.5 + 0.5) * w;
        const py = (Math.sin(i * 47.3 + 2) * 0.5 + 0.5) * h;
        g.fillRect(px, py, 1.4, 1.4);
      }
      const grd = g.createRadialGradient(cx - mw * 0.12, cy - mw * 0.1, mw * 0.1, cx, cy, mw * 0.5);
      grd.addColorStop(0, '#f4f2ea');
      grd.addColorStop(1, '#a9a69b');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(cx, cy, Math.max(1.2, mw / 2), 0, TAU);
      g.fill();
      // manchas lunares
      if (mw > 40) {
        g.fillStyle = 'rgba(70,70,80,0.28)';
        [[-0.18, -0.12, 0.16], [0.14, 0.05, 0.2], [-0.05, 0.22, 0.12], [0.22, -0.24, 0.1]].forEach(([dx, dy, r]) => {
          g.beginPath();
          g.arc(cx + dx * mw, cy + dy * mw, r * mw * 0.5, 0, TAU);
          g.fill();
        });
      }
    };

    const redraw = () => {
      readout();
      drawOptics();
      drawFov();
    };

    bindRange(rd, (v) => {
      state.D = v;
      redraw();
    });
    bindRange(rf, (v) => {
      state.F = v;
      redraw();
    });
    const select = bindSegmented(el.querySelector('[data-seg]'), (id) => {
      const p = PRESETS.find((x) => x.id === id);
      setRange(rd, p.D);
      setRange(rf, p.F);
    });
    new ResizeObserver(redraw).observe(el.querySelector('#lv-optics'));
    window.addEventListener('themechange', redraw);
    select('newt', true);
    setRange(rd, 200);
    setRange(rf, 1000);
  },
};
