import { bindRange, fitCanvas, gauss, imagePixels, loadImage, rng, setRange, tween } from '../lib/dom.js';

const NMAX = 400;
const toN = (v) => Math.round(Math.pow(NMAX, v / 100));
const toV = (n) => (Math.log(n) / Math.log(NMAX)) * 100;

export default {
  id: 'stacking',
  title: 'Apilado',
  steps: 1,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Procesado · apilado</p>
      <h2 class="title rise">Muchas fotos, <em>una buena</em></h2>
    </div>
    <div class="st grow">
      <div class="canvas-box st__img rise"><canvas id="st-c"></canvas></div>
      <div class="st__side rise" data-interactive>
        <div class="st__big"><b id="st-n">1</b><span>tomas</span></div>
        <div class="st__snr"><b id="st-snr">×1</b><span>señal / ruido</span></div>
        <div class="control"><label>Número de tomas <output id="st-o">1</output></label>
          <input id="st-r" type="range" min="0" max="100" step="0.2" value="0" /></div>
        <div class="st__chips"><span class="chip">Lights</span><span class="chip">Darks</span><span class="chip">Flats</span><span class="chip">Bias</span></div>
      </div>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#st-c'), () => draw());
    const range = el.querySelector('#st-r');
    let base = null;
    let noise = null;
    let out = null;
    let off = null;
    const W = 720;
    const H = 480;
    let n = 1;

    loadImage('andromeda').then((img) => {
      base = imagePixels(img, W, H, 0.5, 0.5, 1.0);
      const r = rng(21);
      noise = new Float32Array(W * H * 3);
      for (let i = 0; i < noise.length; i++) noise[i] = gauss(r);
      out = new ImageData(W, H);
      off = document.createElement('canvas');
      off.width = W;
      off.height = H;
      draw();
    });

    function draw() {
      if (!base || !view.w) return;
      const sigma = 78 / Math.sqrt(n);
      const s = base.data;
      const d = out.data;
      for (let i = 0, k = 0; i < s.length; i += 4, k += 3) {
        d[i] = s[i] * 0.78 + noise[k] * sigma + 8;
        d[i + 1] = s[i + 1] * 0.78 + noise[k + 1] * sigma + 8;
        d[i + 2] = s[i + 2] * 0.78 + noise[k + 2] * sigma + 8;
        d[i + 3] = 255;
      }
      off.getContext('2d').putImageData(out, 0, 0);
      view.ctx.drawImage(off, 0, 0, view.w, view.h);
    }

    let stop = null;
    bindRange(range, (v) => {
      n = toN(v);
      el.querySelector('#st-n').textContent = n;
      el.querySelector('#st-o').textContent = n;
      el.querySelector('#st-snr').textContent = `×${Math.sqrt(n).toFixed(n < 4 ? 1 : 0)}`;
      draw();
    });
    range.addEventListener('pointerdown', () => stop && stop());
    return {
      step(k, info) {
        if (stop) stop();
        if (k === 0) setRange(range, 0);
        else stop = tween(0, toV(100), info.initial ? 1 : 5200, (v) => setRange(range, v));
      },
    };
  },
};
