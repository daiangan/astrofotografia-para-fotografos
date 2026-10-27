import { bindSegmented, fitCanvas, rng, gauss, TAU, cssVar } from '../lib/dom.js';

const WINDOW = 16; // segundos visibles en la gráfica

export default {
  id: 'guiding',
  title: 'Guiado',
  steps: 2,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Guiado</p>
      <h2 class="title rise">Corregir <em>en vivo</em></h2>
    </div>
    <div class="gd grow">
      <div class="gd__panel rise"><div class="canvas-box"><canvas id="gd-cam"></canvas></div><span>Cámara guía</span></div>
      <div class="gd__panel gd__panel--wide rise"><div class="canvas-box"><canvas id="gd-plot"></canvas></div><span>Error de seguimiento</span></div>
      <div class="gd__panel rise"><div class="canvas-box"><canvas id="gd-img"></canvas></div><span>Tu estrella, tras la exposición</span></div>
    </div>
    <div class="gd__foot rise" data-interactive>
      <div class="seg" data-seg><button data-v="0" class="on">Sin guiado</button><button data-v="1">Con guiado</button></div>
      <p class="tie" data-upto="1"><b>Cuándo</b> Focal larga o exposiciones de más de ~1–2 min.</p>
      <div class="gd__tools" data-from="2">
        <span class="chip chip--accent">Guidescope + cámara guía</span>
        <span class="chip chip--accent">OAG</span>
        <span class="chip">PHD2 · ASIAIR · NINA</span>
      </div>
    </div>`,
  mount(el, ctx) {
    const cam = fitCanvas(el.querySelector('#gd-cam'));
    const plot = fitCanvas(el.querySelector('#gd-plot'));
    const img = fitCanvas(el.querySelector('#gd-img'));
    const r = rng(5);
    let guided = 0;
    let t = 0;
    const samples = []; // {t, x}
    let trace = [];
    let expT = 0;
    let corrT = 0;
    let cx = 0; // corrección acumulada del guiado (″)
    let cy = 0;
    let pulse = 0;
    let px = 0;
    let py = 0;

    const select = bindSegmented(el.querySelector('[data-seg]'), (v) => {
      guided = +v;
      trace = [];
      expT = 0;
      cx = 0;
      cy = 0;
    });

    ctx.loop((dt) => {
      t += dt;
      expT += dt;
      corrT += dt;
      // error de la montura: periódico + deriva lenta
      const mx = Math.sin((t / 9) * TAU) * 4 + Math.sin((t / 2.3) * TAU) * 0.5;
      const my = 0.14 * (t % 24) - 1.7;
      if (guided) {
        if (corrT > 0.5) {
          corrT = 0;
          pulse = 1;
          cx += 0.9 * px;
          cy += 0.9 * py;
        }
      } else {
        cx = 0;
        cy = 0;
      }
      px = mx - cx + gauss(r) * 0.22;
      py = my - cy + gauss(r) * 0.22;
      samples.push({ t, x: px });
      while (samples.length && samples[0].t < t - WINDOW) samples.shift();
      pulse *= 0.92;
      trace.push({ x: px, y: py });
      if (expT > 14) {
        expT = 0;
        trace = [];
      }
      if (trace.length > 1100) trace.shift();
      const sx = px;
      const sy = py;

      // cámara guía
      {
        const { ctx: g, w, h } = cam;
        if (!w) return;
        g.clearRect(0, 0, w, h);
        g.strokeStyle = 'rgba(140,180,255,0.4)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(w / 2, 0);
        g.lineTo(w / 2, h);
        g.moveTo(0, h / 2);
        g.lineTo(w, h / 2);
        g.stroke();
        g.beginPath();
        g.arc(w / 2, h / 2, w * 0.18, 0, TAU);
        g.stroke();
        const k = w / 34;
        const sx2 = w / 2 + Math.max(-16, Math.min(16, sx)) * k;
        const sy2 = h / 2 + Math.max(-16, Math.min(16, sy)) * k;
        const grd = g.createRadialGradient(sx2, sy2, 0, sx2, sy2, w * 0.09);
        grd.addColorStop(0, '#fff');
        grd.addColorStop(0.4, 'rgba(180,210,255,0.7)');
        grd.addColorStop(1, 'rgba(120,160,255,0)');
        g.fillStyle = grd;
        g.beginPath();
        g.arc(sx2, sy2, w * 0.09, 0, TAU);
        g.fill();
        if (guided && pulse > 0.1) {
          g.fillStyle = `rgba(98,227,176,${pulse})`;
          g.font = `${w * 0.09}px "JetBrains Mono Variable", monospace`;
          g.fillText('corrección', 8, h - 10);
        }
      }
      // gráfica
      {
        const { ctx: g, w, h } = plot;
        g.clearRect(0, 0, w, h);
        const mid = h / 2;
        const k = h / 24;
        g.fillStyle = 'rgba(98,227,176,0.10)';
        g.fillRect(0, mid - k, w, k * 2);
        g.strokeStyle = 'rgba(255,255,255,0.15)';
        g.beginPath();
        g.moveTo(0, mid);
        g.lineTo(w, mid);
        g.stroke();
        g.fillStyle = 'rgba(98,227,176,0.9)';
        g.font = `${Math.max(10, w * 0.035)}px "JetBrains Mono Variable", monospace`;
        g.fillText('±1″', 8, mid - k - 6);
        g.beginPath();
        samples.forEach((s, i) => {
          const x = ((s.t - (t - WINDOW)) / WINDOW) * w;
          const y = mid - Math.max(-11.5, Math.min(11.5, s.x)) * k;
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        });
        g.strokeStyle = guided ? '#62e3b0' : '#ff7a7a';
        g.lineWidth = 2.5;
        g.lineJoin = 'round';
        g.stroke();
      }
      // resultado
      {
        const { ctx: g, w, h } = img;
        g.clearRect(0, 0, w, h);
        g.globalCompositeOperation = 'lighter';
        const k = w / 34;
        for (let i = 0; i < trace.length; i += 2) {
          const p = trace[i];
          const x = w / 2 + p.x * k;
          const y = h / 2 + p.y * k;
          const grd = g.createRadialGradient(x, y, 0, x, y, w * 0.06);
          grd.addColorStop(0, 'rgba(255,255,255,0.1)');
          grd.addColorStop(1, 'rgba(120,160,255,0)');
          g.fillStyle = grd;
          g.beginPath();
          g.arc(x, y, w * 0.06, 0, TAU);
          g.fill();
        }
        g.globalCompositeOperation = 'source-over';
      }
    });

    return {
      step(n) {
        const v = n >= 1 ? 1 : 0;
        select(String(v), true);
        guided = v;
        trace = [];
        expT = 0;
        cx = 0;
        cy = 0;
      },
    };
  },
};
