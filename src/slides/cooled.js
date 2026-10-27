import { bindRange, bindSegmented, fitCanvas, gauss, imagePixels, loadImage, rng, setRange } from '../lib/dom.js';

// La corriente oscura se duplica aproximadamente cada 6 °C
const dark = (t) => Math.pow(2, (t - 35) / 6);

export default {
  id: 'cooled',
  title: 'Cámaras dedicadas: enfriamiento',
  steps: 0,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Cámaras · enfriamiento</p>
      <h2 class="title rise">Frío <em>= silencio</em></h2>
    </div>
    <div class="cool grow">
      <div class="canvas-box cool__frame rise"><canvas id="cool-c"></canvas>
        <span class="cool__badge" id="cool-badge">+35 °C</span></div>
      <div class="cool__side rise" data-interactive>
        <div class="cool__big"><span id="cool-div">÷1</span><small>ruido térmico</small></div>
        <div class="control"><label>Temperatura del sensor <output id="cool-o">+35 °C</output></label>
          <input id="cool-r" type="range" min="-20" max="35" step="1" value="35" /></div>
        <div class="seg" data-seg>
          <button data-v="normal">Sin refrigeración</button>
          <button data-v="cooled">Refrigerada</button>
        </div>
        <p class="tie"><b>Regla</b> Cada ≈ 6 °C menos, el ruido térmico se reduce a la mitad.</p>
      </div>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#cool-c'));
    const range = el.querySelector('#cool-r');
    let base = null;
    let seed = 0;
    let out = null;
    let off = null;
    let cw = 0;
    let ch = 0;

    loadImage('orion').then((img) => {
      cw = 560;
      ch = 380;
      base = imagePixels(img, cw, ch, 0.5, 0.42, 1.6);
      out = new ImageData(cw, ch);
      off = document.createElement('canvas');
      off.width = cw;
      off.height = ch;
      draw(parseFloat(range.value));
    });

    function draw(t) {
      if (!base) return;
      const d = dark(t);
      const sigma = 6 + 78 * Math.min(1.6, d);
      const r = rng(11 + seed);
      const hot = 0.0009 + 0.006 * d;
      const src = base.data;
      const dst = out.data;
      for (let y = 0; y < ch; y++) {
        for (let x = 0; x < cw; x++) {
          const i = (y * cw + x) * 4;
          // la señal (nebulosa) se atenúa para parecerse a una toma corta y sin procesar
          const glow = d * 55 * Math.pow(1 - x / cw, 2.4) * Math.pow(y / ch, 1.3);
          const n = gauss(r) * sigma;
          const spike = r() < hot ? 140 + r() * 115 : 0;
          dst[i] = src[i] * 0.55 + glow * 1.1 + n + spike;
          dst[i + 1] = src[i + 1] * 0.55 + glow * 0.6 + n + spike * 0.6;
          dst[i + 2] = src[i + 2] * 0.55 + glow * 0.5 + n + spike * 0.5;
          dst[i + 3] = 255;
        }
      }
      off.getContext('2d').putImageData(out, 0, 0);
      const { ctx: g, w, h } = view;
      g.drawImage(off, 0, 0, w, h);
    }

    bindRange(range, (t) => {
      const shown = t > 0 ? `+${t}` : `${t}`;
      el.querySelector('#cool-o').textContent = `${shown} °C`;
      el.querySelector('#cool-badge').textContent = `${shown} °C`;
      const div = 1 / dark(t);
      el.querySelector('#cool-div').textContent = div < 1.05 ? '÷1' : `÷${div >= 10 ? Math.round(div) : div.toFixed(1)}`;
      seed++;
      draw(t);
    });
    const select = bindSegmented(el.querySelector('[data-seg]'), (v) => setRange(range, v === 'cooled' ? -10 : 35));
    select('normal', true);
    new ResizeObserver(() => draw(parseFloat(range.value))).observe(el.querySelector('#cool-c'));
    return {
      enter() {
        draw(parseFloat(range.value));
      },
    };
  },
};
