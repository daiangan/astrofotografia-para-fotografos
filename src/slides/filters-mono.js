import { fitCanvas, imagePixels, loadImage, tween } from '../lib/dom.js';

const CH = [
  { key: 'r', name: 'SII', nm: '672 nm', tint: [255, 70, 70] },
  { key: 'g', name: 'Hα', nm: '656 nm', tint: [70, 255, 100] },
  { key: 'b', name: 'OIII', nm: '501 nm', tint: [70, 130, 255] },
];

function percentile(values, p) {
  const sorted = Float32Array.from(values).sort();
  return sorted[Math.floor(sorted.length * p)];
}

export default {
  id: 'filters-mono',
  title: 'Filtros: monocromo',
  steps: 2,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Filtros · cámaras monocromáticas</p>
      <h2 class="title rise">Un sensor, <em>tres capas</em></h2>
    </div>
    <div class="mono grow">
      <div class="mono__layers">
        ${CH.map(
          (c, i) => `<figure class="mono__layer rise" data-i="${i}">
            <div class="canvas-box"><canvas></canvas></div>
            <figcaption><b>${c.name}</b><span>${c.nm}</span></figcaption></figure>`,
        ).join('')}
      </div>
      <div class="mono__plus" data-from="2">=</div>
      <div class="canvas-box mono__result" data-from="2"><canvas id="mono-res"></canvas><span class="mono__tag">Paleta Hubble</span></div>
    </div>
    <div class="mono__chips rise">
      <span class="chip">L · R · G · B</span><span class="chip">Hα · OIII · SII</span>
      <span class="chip chip--warm" data-from="2">IR Pass ≥ 685 nm · Luna y planetas incluso con ciudad</span>
    </div>`,
  mount(el) {
    const layers = Array.from(el.querySelectorAll('.mono__layer canvas')).map((c) => fitCanvas(c, () => paint()));
    const res = fitCanvas(el.querySelector('#mono-res'), () => paint());
    let data = null;
    let norm = null;
    let tint = 0; // 0 = grises, 1 = con color
    let stop = null;

    loadImage('pillars').then((img) => {
      // recorte del pilar izquierdo (evita la esquina sin datos del mosaico)
      const c = document.createElement('canvas');
      c.width = 620;
      c.height = 620;
      const g = c.getContext('2d', { willReadFrequently: true });
      const sw = img.width * 0.5;
      const sh = img.height * 0.5;
      g.drawImage(img, 0, img.height * 0.02, sw, sh, 0, 0, 620, 620);
      data = g.getImageData(0, 0, 620, 620);
      const n = data.width * data.height;
      norm = [0, 1, 2].map((ch) => {
        const vals = new Float32Array(n);
        for (let i = 0; i < n; i++) vals[i] = data.data[i * 4 + ch];
        return Math.max(1, percentile(vals, 0.985));
      });
      paint();
    });

    function paintTo(view, chan) {
      if (!data || !view.w) return;
      const off = document.createElement('canvas');
      off.width = data.width;
      off.height = data.height;
      const out = new ImageData(data.width, data.height);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = chan.map((ch) => Math.min(255, (d[i + ch] / norm[ch]) * 255));
        if (chan.length === 3) {
          out.data[i] = v[0];
          out.data[i + 1] = v[1];
          out.data[i + 2] = v[2];
        } else {
          const t = CH[chan[0]].tint;
          const gray = v[0];
          out.data[i] = gray * (1 - tint) + (gray * t[0]) / 255 * tint;
          out.data[i + 1] = gray * (1 - tint) + (gray * t[1]) / 255 * tint;
          out.data[i + 2] = gray * (1 - tint) + (gray * t[2]) / 255 * tint;
        }
        out.data[i + 3] = 255;
      }
      off.getContext('2d').putImageData(out, 0, 0);
      view.ctx.drawImage(off, 0, 0, view.w, view.h);
    }

    function paint() {
      layers.forEach((v, i) => paintTo(v, [i]));
      paintTo(res, [0, 1, 2]);
    }

    return {
      step(n, info) {
        if (stop) stop();
        const to = n >= 1 ? 1 : 0;
        if (info.initial) {
          tint = to;
          paint();
        } else stop = tween(tint, to, 800, (v) => {
          tint = v;
          paint();
        });
      },
    };
  },
};
