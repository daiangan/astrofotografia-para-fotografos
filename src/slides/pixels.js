import { bindRange, fitCanvas, clamp } from '../lib/dom.js';

const F_MM = 500; // focal fija para el ejemplo
const SEEING = 3; // FWHM en segundos de arco
const SENSOR = { w: 23.5, h: 15.7 }; // mm

export default {
  id: 'pixels',
  title: 'Tamaño de píxel y resolución',
  steps: 0,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Cámaras · tamaño de píxel</p>
      <h2 class="title rise">El píxel <em>importa</em></h2>
    </div>
    <div class="px grow">
      <div class="canvas-box px__grid rise"><canvas id="px-c"></canvas><span class="px__cap">Una misma estrella</span></div>
      <div class="px__side rise" data-interactive>
        <div class="control"><label>Tamaño de píxel <output id="px-o">3.76 µm</output></label>
          <input id="px-r" type="range" min="2.4" max="9" step="0.02" value="3.76" /></div>
        <div class="px__stats">
          <div><b id="px-scale">1.6″</b><span>por píxel</span></div>
          <div><b id="px-mp">26 MP</b><span>en el mismo sensor</span></div>
          <div><b id="px-light">×1.0</b><span>luz por píxel</span></div>
        </div>
        <div class="px__buckets" id="px-buckets"></div>
      </div>
    </div>
    <p class="tie rise"><b>Al revés que en foto</b> Megapíxeles altos no son mejores: cada píxel recoge menos luz.</p>`,
  mount(el) {
    const view = fitCanvas(el.querySelector('#px-c'));
    const range = el.querySelector('#px-r');
    const buckets = el.querySelector('#px-buckets');
    let p = 3.76;

    const sample = (x, y, s) => {
      // integral aproximada de una gaussiana sobre el píxel (muestreo 3×3)
      const sigma = SEEING / 2.355;
      let v = 0;
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 3; i++) {
          const dx = x + (i / 2 - 0.5) * s;
          const dy = y + (j / 2 - 0.5) * s;
          v += Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
        }
      return v / 9;
    };

    function draw() {
      const { ctx: g, w, h } = view;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      const scale = (206.265 * p) / F_MM; // ″/px
      const span = 14; // ″ visibles de lado a lado (alto)
      const cell = (h * 0.92) / (span / scale);
      const cx = w / 2;
      const cy = h / 2;
      const nx = Math.ceil(w / cell / 2) + 1;
      const ny = Math.ceil(h / cell / 2) + 1;
      // el centro de la estrella cae en el centro de un píxel para que el ejemplo sea legible
      for (let j = -ny; j <= ny; j++) {
        for (let i = -nx; i <= nx; i++) {
          const v = sample(i * scale, j * scale, scale);
          const x = cx + (i - 0.5) * cell;
          const y = cy + (j - 0.5) * cell;
          const a = clamp(v, 0, 1);
          const l = Math.round(10 + a * 245);
          g.fillStyle = `rgb(${l},${l},${Math.min(255, l + 10)})`;
          g.fillRect(x + 0.5, y + 0.5, cell - 1, cell - 1);
        }
      }
      // el tamaño real de la estrella: FWHM
      g.strokeStyle = 'rgba(255,187,116,0.85)';
      g.lineWidth = 2;
      g.setLineDash([6, 6]);
      g.beginPath();
      g.arc(cx, cy, (SEEING / 2 / scale) * cell, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
    }

    function update() {
      const scale = (206.265 * p) / F_MM;
      const mp = ((SENSOR.w * 1000) / p) * ((SENSOR.h * 1000) / p) / 1e6;
      const light = (p / 3.76) ** 2;
      el.querySelector('#px-o').textContent = `${p.toFixed(2)} µm`;
      el.querySelector('#px-scale').textContent = `${scale.toFixed(1)}″`;
      el.querySelector('#px-mp').textContent = `${Math.round(mp)} MP`;
      el.querySelector('#px-light').textContent = `×${light.toFixed(1)}`;
      const n = clamp(Math.round(light * 4), 1, 26);
      buckets.innerHTML = Array.from({ length: n }, () => '<i></i>').join('');
      draw();
    }

    bindRange(range, (v) => {
      p = v;
      update();
    });
    new ResizeObserver(draw).observe(el.querySelector('#px-c'));
  },
};
