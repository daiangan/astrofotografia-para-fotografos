import { bindRange, fitCanvas, cssVar } from '../lib/dom.js';

const BINS = 220;

function histogram(gain, offset) {
  // valores normalizados 0..1 (rango completo del convertidor)
  const bias = (offset / 100) * 0.14;
  const g = 1 + (gain / 100) * 5;
  const sky = 0.02 * g;
  const mean = bias + sky;
  const sigma = 0.012 + 0.006 * Math.sqrt(g) + 0.008 * (1 - gain / 100);
  const bins = new Float64Array(BINS);
  let clippedLo = 0;
  let clippedHi = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N; // cuantil
    // gaussiana del fondo de cielo por muestreo inverso aproximado
    const z = Math.sqrt(2) * erfinv(2 * t - 1);
    let v = mean + z * sigma;
    if (v < 0) {
      clippedLo++;
      v = 0;
    }
    if (v >= 1) {
      clippedHi++;
      v = 0.999;
    }
    bins[Math.min(BINS - 1, Math.floor(v * BINS))] += 1;
  }
  // cola de estrellas y nebulosidad (exponencial), amplificada por el gain
  const tail = 2600;
  for (let i = 0; i < tail; i++) {
    const t = (i + 0.5) / tail;
    const v = mean + 0.02 * g + -Math.log(1 - t * 0.999) * 0.05 * g;
    if (v >= 1) {
      clippedHi++;
      bins[BINS - 1] += 1;
    } else bins[Math.min(BINS - 1, Math.floor(v * BINS))] += 0.35;
  }
  return { bins, clippedLo: clippedLo / N, clippedHi: clippedHi / tail };
}

function erfinv(x) {
  const a = 0.147;
  const ln = Math.log(1 - x * x);
  const t = 2 / (Math.PI * a) + ln / 2;
  return Math.sign(x) * Math.sqrt(Math.sqrt(t * t - ln / a) - t);
}

export default {
  id: 'gain',
  title: 'Gain y offset',
  steps: 0,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Cámaras · gain y offset</p>
      <h2 class="title rise">Tu ISO, <em>con letra chica</em></h2>
    </div>
    <div class="gn grow">
      <div class="canvas-box gn__plot rise"><canvas id="gn-c"></canvas>
        <div class="gn__flags"><span class="chip chip--warm" id="gn-lo" hidden>Negros recortados</span><span class="chip chip--warm" id="gn-hi" hidden>Blancos saturados</span></div>
      </div>
      <div class="gn__side rise" data-interactive>
        <div class="gn__def"><b>Gain</b><span>Amplifica la señal. Como subir el ISO.</span></div>
        <div class="control"><label>Gain <output id="gn-go">50</output></label>
          <input id="gn-g" type="range" min="0" max="100" step="1" value="45" /></div>
        <div class="gn__def"><b>Offset</b><span>Levanta el piso del negro para que nada se corte en cero.</span></div>
        <div class="control"><label>Offset <output id="gn-oo">30</output></label>
          <input id="gn-o" type="range" min="0" max="100" step="1" value="30" /></div>
      </div>
    </div>`,
  mount(el) {
    const view = fitCanvas(el.querySelector('#gn-c'));
    const rg = el.querySelector('#gn-g');
    const ro = el.querySelector('#gn-o');
    let gain = 45;
    let offset = 30;

    function draw() {
      const { ctx: c, w, h } = view;
      if (!w) return;
      const { bins, clippedLo, clippedHi } = histogram(gain, offset);
      c.clearRect(0, 0, w, h);
      const pad = { l: 16, r: 16, t: 30, b: 44 };
      const bw = (w - pad.l - pad.r) / BINS;
      let max = 0;
      for (let i = 1; i < BINS - 1; i++) max = Math.max(max, bins[i]);
      const accent = cssVar('--accent');
      // degradado tonal en el eje x: del negro al blanco
      const grad = c.createLinearGradient(pad.l, 0, w - pad.r, 0);
      grad.addColorStop(0, '#000');
      grad.addColorStop(1, '#fff');
      c.fillStyle = grad;
      c.fillRect(pad.l, h - pad.b + 12, w - pad.l - pad.r, 12);
      for (let i = 0; i < BINS; i++) {
        const v = Math.min(bins[i] / max, 1.0);
        const bh = v * (h - pad.t - pad.b);
        const clipped = (i === 0 && clippedLo > 0.01) || (i === BINS - 1 && clippedHi > 0.01);
        c.fillStyle = clipped ? '#ff5566' : accent;
        c.globalAlpha = clipped ? 1 : 0.9;
        c.fillRect(pad.l + i * bw, h - pad.b - bh, Math.max(1, bw - 0.6), bh);
      }
      c.globalAlpha = 1;
      const lo = el.querySelector('#gn-lo');
      const hi = el.querySelector('#gn-hi');
      lo.hidden = clippedLo < 0.01;
      hi.hidden = clippedHi < 0.015;
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.font = `${Math.max(11, w * 0.024)}px "JetBrains Mono Variable", monospace`;
      c.textAlign = 'left';
      c.fillText('NEGRO', pad.l, h - 6);
      c.textAlign = 'right';
      c.fillText('BLANCO', w - pad.r, h - 6);
    }

    bindRange(rg, (v) => {
      gain = v;
      el.querySelector('#gn-go').textContent = v;
      draw();
    });
    bindRange(ro, (v) => {
      offset = v;
      el.querySelector('#gn-oo').textContent = v;
      draw();
    });
    new ResizeObserver(draw).observe(el.querySelector('#gn-c'));
    window.addEventListener('themechange', draw);
  },
};
