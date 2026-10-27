import { fitCanvas, imagePixels, loadImage, tween, clamp } from '../lib/dom.js';

const W = 720;
const H = 480;

function boxBlur(src, w, h, radius, passes = 2) {
  const out = new Uint8ClampedArray(src);
  const tmp = new Float32Array(w * h * 3);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < h; y++) {
      for (let c = 0; c < 3; c++) {
        let acc = 0;
        for (let x = -radius; x <= radius; x++) acc += out[(y * w + clamp(x, 0, w - 1)) * 4 + c];
        for (let x = 0; x < w; x++) {
          tmp[(y * w + x) * 3 + c] = acc / (radius * 2 + 1);
          acc += out[(y * w + clamp(x + radius + 1, 0, w - 1)) * 4 + c] - out[(y * w + clamp(x - radius, 0, w - 1)) * 4 + c];
        }
      }
    }
    for (let x = 0; x < w; x++) {
      for (let c = 0; c < 3; c++) {
        let acc = 0;
        for (let y = -radius; y <= radius; y++) acc += tmp[(clamp(y, 0, h - 1) * w + x) * 3 + c];
        for (let y = 0; y < h; y++) {
          out[(y * w + x) * 4 + c] = acc / (radius * 2 + 1);
          acc += tmp[(clamp(y + radius + 1, 0, h - 1) * w + x) * 3 + c] - tmp[(clamp(y - radius, 0, h - 1) * w + x) * 3 + c];
        }
      }
    }
  }
  return out;
}

function make(base, fn) {
  const out = new ImageData(W, H);
  fn(base.data, out.data);
  return out;
}

const MODES = [
  { name: 'Color', line: 'Calibrar el balance de blancos usando las propias estrellas.' },
  { name: 'Aberración cromática', line: 'Alinear los canales para quitar halos rojos y azules.' },
  { name: 'Reducción de ruido', line: 'Suavizar el grano sin borrar el detalle.' },
  { name: 'Nitidez', line: 'Recuperar el detalle fino que la atmósfera difuminó.' },
];

export default {
  id: 'finishing',
  title: 'Retoques finales',
  steps: 3,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Procesado · retoques</p>
      <h2 class="title rise">Los últimos <em>detalles</em></h2>
    </div>
    <div class="fn grow">
      <div class="canvas-box fn__cmp rise" data-interactive><canvas id="fn-c"></canvas>
        <span class="fn__l">Antes</span><span class="fn__r">Después</span>
        <div class="fn__handle" id="fn-h"><i></i></div></div>
      <div class="fn__side rise">
        ${MODES.map((m, i) => `<div class="fn__mode" data-i="${i}"><b>${m.name}</b><span>${m.line}</span></div>`).join('')}
      </div>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#fn-c'), () => paint());
    const handle = el.querySelector('#fn-h');
    const modes = Array.from(el.querySelectorAll('.fn__mode'));
    let base = null;
    const pairs = [];
    let mode = 0;
    let split = 0.5;
    let stop = null;
    let dragging = false;

    loadImage('m13').then((img) => {
      base = imagePixels(img, W, H, 0.5, 0.45, 1.1);
      const d = base.data;
      // 0: color (dominante verdosa vs. corregido)
      pairs.push([
        make(base, (s, o) => {
          for (let i = 0; i < s.length; i += 4) {
            o[i] = s[i] * 0.72;
            o[i + 1] = Math.min(255, s[i + 1] * 1.08);
            o[i + 2] = s[i + 2] * 0.82;
            o[i + 3] = 255;
          }
        }),
        make(base, (s, o) => o.set(s)),
      ]);
      // 1: aberración cromática (canales desplazados)
      pairs.push([
        make(base, (s, o) => {
          const sh = 2;
          for (let y = 0; y < H; y++)
            for (let x = 0; x < W; x++) {
              const i = (y * W + x) * 4;
              o[i] = s[(y * W + clamp(x + sh, 0, W - 1)) * 4];
              o[i + 1] = s[i + 1];
              o[i + 2] = s[(y * W + clamp(x - sh, 0, W - 1)) * 4 + 2];
              o[i + 3] = 255;
            }
        }),
        make(base, (s, o) => o.set(s)),
      ]);
      // 2: ruido
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
      const noisy = make(base, (s, o) => {
        for (let i = 0; i < s.length; i += 4) {
          const n = (rnd() + rnd() + rnd()) * 30;
          o[i] = s[i] + n;
          o[i + 1] = s[i + 1] + n;
          o[i + 2] = s[i + 2] + n;
          o[i + 3] = 255;
        }
      });
      const smooth = new ImageData(boxBlur(noisy.data, W, H, 1, 2), W, H);
      pairs.push([noisy, smooth]);
      // 3: nitidez
      const blurred = new ImageData(boxBlur(base.data, W, H, 3, 2), W, H);
      pairs.push([blurred, make(base, (s, o) => o.set(s))]);
      paint();
    });

    const off = [document.createElement('canvas'), document.createElement('canvas')];
    off.forEach((c) => {
      c.width = W;
      c.height = H;
    });

    function paint() {
      if (!pairs.length || !view.w) return;
      const [a, b] = pairs[mode];
      off[0].getContext('2d').putImageData(a, 0, 0);
      off[1].getContext('2d').putImageData(b, 0, 0);
      const { ctx: g, w, h } = view;
      g.drawImage(off[1], 0, 0, w, h);
      g.save();
      g.beginPath();
      g.rect(0, 0, w * split, h);
      g.clip();
      g.drawImage(off[0], 0, 0, w, h);
      g.restore();
      handle.style.left = `${split * 100}%`;
    }

    const move = (e) => {
      const rect = view.canvas.getBoundingClientRect();
      split = clamp((e.clientX - rect.left) / rect.width, 0.02, 0.98);
      paint();
    };
    const box = el.querySelector('.fn__cmp');
    box.addEventListener('pointerdown', (e) => {
      dragging = true;
      if (stop) stop();
      box.setPointerCapture(e.pointerId);
      move(e);
    });
    box.addEventListener('pointermove', (e) => dragging && move(e));
    box.addEventListener('pointerup', () => (dragging = false));

    return {
      step(n, info) {
        mode = n;
        modes.forEach((m) => m.classList.toggle('on', +m.dataset.i === n));
        if (stop) stop();
        split = 0.12;
        paint();
        stop = tween(0.12, 0.88, ctx.reduced ? 1 : 2600, (v) => {
          split = v;
          paint();
        });
      },
    };
  },
};
