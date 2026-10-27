import { bindRange, fitCanvas, imagePixels, loadImage, setRange, tween } from '../lib/dom.js';

const mtf = (m, x) => (x <= 0 ? 0 : x >= 1 ? 1 : ((m - 1) * x) / ((2 * m - 1) * x - m));
const STEPS = ['Calibrar', 'Apilar', 'Fondo', 'Color', 'Estirar', 'Ruido', 'Nitidez'];

export default {
  id: 'stretch',
  title: 'Estirar los datos',
  steps: 1,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Procesado</p>
      <h2 class="title rise">Los datos <em>ya estaban ahí</em></h2>
    </div>
    <div class="sr grow">
      <div class="canvas-box sr__img rise"><canvas id="sr-c"></canvas></div>
      <div class="sr__side rise" data-interactive>
        <canvas id="sr-h" class="sr__hist"></canvas>
        <div class="control"><label>Estiramiento <output id="sr-o">0 %</output></label>
          <input id="sr-r" type="range" min="0" max="100" step="1" value="0" /></div>
        <p class="tie"><b>Como en RAW</b> Es como subir exposición y curvas a una foto muy oscura.</p>
      </div>
    </div>
    <div class="sr__flow rise">
      ${STEPS.map((s) => `<span class="${s === 'Estirar' ? 'on' : ''}">${s}</span>`).join('<i>›</i>')}
    </div>`,
  mount(el) {
    const view = fitCanvas(el.querySelector('#sr-c'), () => draw());
    const hist = fitCanvas(el.querySelector('#sr-h'), () => draw());
    const range = el.querySelector('#sr-r');
    const W = 720;
    const H = 480;
    let base = null;
    let out = null;
    let off = null;
    let s = 0;

    loadImage('orion').then((img) => {
      base = imagePixels(img, W, H, 0.5, 0.42, 1.5);
      out = new ImageData(W, H);
      off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      draw();
    });

    function draw() {
      if (!base || !view.w) return;
      const b = 0.28 + 0.72 * s;
      const m = 0.5 - 0.27 * s;
      const lut = new Uint8ClampedArray(256);
      for (let v = 0; v < 256; v++) lut[v] = Math.round(mtf(m, Math.min(1, Math.pow(v / 255, 2.6) * b)) * 255);
      const d = base.data;
      const o = out.data;
      const bins = new Float32Array(64);
      for (let i = 0; i < d.length; i += 4) {
        const r = lut[d[i]];
        const g = lut[d[i + 1]];
        const bl = lut[d[i + 2]];
        o[i] = r;
        o[i + 1] = g;
        o[i + 2] = bl;
        o[i + 3] = 255;
        bins[(((r + g + bl) / 3) >> 2) & 63]++;
      }
      off.getContext('2d').putImageData(out, 0, 0);
      view.ctx.drawImage(off, 0, 0, view.w, view.h);
      // histograma
      const { ctx: g, w, h } = hist;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      let max = 0;
      for (let i = 1; i < 64; i++) max = Math.max(max, bins[i]);
      g.fillStyle = 'rgba(140,180,255,0.85)';
      const bw = w / 64;
      for (let i = 0; i < 64; i++) {
        const bh = Math.min(1, bins[i] / max) * h * 0.94;
        g.fillRect(i * bw, h - bh, bw - 1, bh);
      }
    }

    let stop = null;
    bindRange(range, (v) => {
      s = v / 100;
      el.querySelector('#sr-o').textContent = `${Math.round(v)} %`;
      draw();
    });
    range.addEventListener('pointerdown', () => stop && stop());
    return {
      step(k, info) {
        if (stop) stop();
        if (k === 0) setRange(range, 0);
        else stop = tween(parseFloat(range.value), 100, info.initial ? 1 : 3200, (v) => setRange(range, v));
      },
    };
  },
};
