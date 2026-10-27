import { bindSegmented, fitCanvas, imagePixels, loadImage, tween, cssVar, TAU } from '../lib/dom.js';

const L0 = 380;
const L1 = 800;
const HA = 656.3;
const sig = (x) => 1 / (1 + Math.exp(-x));
const qe = (l) => 0.7 * Math.exp(-(((l - 560) / 160) ** 2)) + 0.08;
const stock = (l) => qe(l) * sig((l - 405) / 6) * sig((648 - l) / 9);
const modded = (l) => qe(l) * sig((l - 400) / 6) * sig((705 - l) / 9);

export default {
  id: 'astromod',
  title: 'Cámara normal vs. astromodificada',
  steps: 1,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Cámaras · normal vs. astromodificada</p>
      <h2 class="title rise">El filtro que <em>esconde el rojo</em></h2>
    </div>
    <div class="am grow">
      <div class="am__graph canvas-box rise"><canvas id="am-graph"></canvas>
        <div class="am__pct" id="am-pct">30 %</div>
        <span class="am__ha">Hα · 656 nm</span></div>
      <div class="am__photo canvas-box rise"><canvas id="am-photo"></canvas></div>
    </div>
    <div class="am__bar rise" data-interactive>
      <div class="seg" data-seg>
        <button data-v="0" class="on">Cámara normal</button>
        <button data-v="1">Astromodificada</button>
      </div>
      <p class="tie"><b>El motivo</b> Trae un filtro IR-cut que bloquea buena parte de la luz roja de las nebulosas.</p>
    </div>`,
  mount(el, ctx) {
    const pct = el.querySelector('#am-pct');
    let k = 0; // 0 = normal, 1 = modificada (animado)
    let data = null;
    let off = null;
    const graph = fitCanvas(el.querySelector('#am-graph'));
    const photo = fitCanvas(el.querySelector('#am-photo'), () => paintPhoto());

    loadImage('rosette').then((img) => {
      const w = 640;
      const h = 430;
      data = imagePixels(img, w, h, 0.5, 0.5, 1);
      off = document.createElement('canvas');
      off.width = w;
      off.height = h;
      paintPhoto();
    });

    function paintPhoto() {
      if (!data || !photo.w) return;
      const out = new ImageData(data.width, data.height);
      const rk = 0.28 + 0.72 * k;
      const gk = 0.92 + 0.08 * k;
      for (let i = 0; i < data.data.length; i += 4) {
        out.data[i] = Math.min(255, data.data[i] * rk * (1 + 0.5 * k));
        out.data[i + 1] = data.data[i + 1] * gk;
        out.data[i + 2] = data.data[i + 2] * (1.05 - 0.05 * k);
        out.data[i + 3] = 255;
      }
      off.getContext('2d').putImageData(out, 0, 0);
      const { ctx: g, w, h } = photo;
      g.drawImage(off, 0, 0, w, h);
    }

    function paintGraph() {
      const { ctx: g, w, h } = graph;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      const pad = { l: 0.06 * w, r: 0.04 * w, t: 0.1 * h, b: 0.16 * h };
      const X = (l) => pad.l + ((l - L0) / (L1 - L0)) * (w - pad.l - pad.r);
      const Y = (v) => h - pad.b - v * (h - pad.t - pad.b) * 1.35;
      const accent = cssVar('--accent');
      // arcoíris de fondo
      const bar = g.createLinearGradient(X(L0), 0, X(L1), 0);
      for (let l = L0; l <= L1; l += 20) {
        const c = l < 380 ? [120, 80, 255] : l > 700 ? [110, 20, 20] : null;
        bar.addColorStop((l - L0) / (L1 - L0), c ? `rgb(${c})` : `hsl(${Math.max(0, 270 - ((l - 400) / 300) * 270)},90%,55%)`);
      }
      g.globalAlpha = 0.18;
      g.fillStyle = bar;
      g.fillRect(X(L0), pad.t, X(L1) - X(L0), h - pad.t - pad.b);
      g.globalAlpha = 1;
      // eje
      g.strokeStyle = 'rgba(255,255,255,0.22)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(pad.l, h - pad.b);
      g.lineTo(w - pad.r, h - pad.b);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.font = `${Math.max(11, w * 0.028)}px "JetBrains Mono Variable", monospace`;
      g.textAlign = 'center';
      [400, 500, 600, 700, 800].forEach((l) => g.fillText(String(l), X(l), h - pad.b + w * 0.05));
      const curve = (fn, color, alpha) => {
        g.beginPath();
        g.moveTo(X(L0), Y(0));
        for (let l = L0; l <= L1; l += 2) g.lineTo(X(l), Y(fn(l)));
        g.lineTo(X(L1), Y(0));
        g.closePath();
        g.fillStyle = color;
        g.globalAlpha = alpha;
        g.fill();
        g.globalAlpha = 1;
        g.beginPath();
        for (let l = L0; l <= L1; l += 2) (l === L0 ? g.moveTo(X(l), Y(fn(l))) : g.lineTo(X(l), Y(fn(l))));
        g.strokeStyle = color;
        g.lineWidth = 2.5;
        g.stroke();
      };
      const blend = (l) => stock(l) * (1 - k) + modded(l) * k;
      curve(blend, accent, 0.28);
      // línea de Hα
      g.strokeStyle = '#ff5566';
      g.lineWidth = 2;
      g.setLineDash([5, 5]);
      g.beginPath();
      g.moveTo(X(HA), pad.t * 0.6);
      g.lineTo(X(HA), h - pad.b);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = '#ff5566';
      g.beginPath();
      g.arc(X(HA), Y(blend(HA)), 6, 0, TAU);
      g.fill();
      const ratio = blend(HA) / qe(HA);
      pct.textContent = `${Math.round(ratio * 100)} %`;
      pct.style.left = `${X(HA) + 12}px`;
      pct.style.top = `${Y(blend(HA)) - 34}px`;
      const ha = el.querySelector('.am__ha');
      ha.style.left = `${X(HA) - 8}px`;
      ha.style.top = `${pad.t * 0.2}px`;
    }

    const apply = (v, animate = true) => {
      const to = +v;
      if (!animate) {
        k = to;
        paintGraph();
        paintPhoto();
        return;
      }
      tween(k, to, 900, (val) => {
        k = val;
        paintGraph();
        paintPhoto();
      });
    };
    const select = bindSegmented(el.querySelector('[data-seg]'), (v) => apply(v));
    ctx.loop(() => {});
    paintGraph();
    new ResizeObserver(paintGraph).observe(el.querySelector('#am-graph'));
    return {
      step(n, info) {
        select(String(n), true);
        apply(n, !info.initial);
      },
    };
  },
};
