import { bindRange, bindSegmented, fitCanvas, setRange, DEG, TAU, clamp } from '../lib/dom.js';
import { loadSky, bvColor } from '../lib/sky.js';

// Exposición en segundos, escala logarítmica: 1 s … 4 h
const TMIN = 1;
const TMAX = 4 * 3600;
const toT = (v) => TMIN * Math.pow(TMAX / TMIN, v / 100);
const fmtT = (t) => (t < 90 ? `${Math.round(t)} s` : t < 5400 ? `${Math.round(t / 60)} min` : `${(t / 3600).toFixed(1)} h`);

export default {
  id: 'skymotion',
  title: 'Movimiento del cielo',
  tone: 'dark',
  steps: 1,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Monturas · el cielo se mueve</p>
      <h2 class="title rise">La Tierra <em>no se detiene</em></h2>
    </div>
    <div class="sm__stage grow rise"><canvas id="sm-c"></canvas>
      <div class="sm__readout"><b id="sm-t">30 min</b><span id="sm-a">7.5° de arco</span></div>
      <div class="sm__pole"><i></i>Polo celeste</div>
      <div class="sm__deg">15° por hora</div>
    </div>
    <div class="sm__ctrl rise" data-interactive>
      <div class="control sm__range"><label>Exposición <output id="sm-o">30 min</output></label>
        <input id="sm-r" type="range" min="0" max="100" step="0.5" value="78" /></div>
      <div class="seg" data-seg>
        <button data-v="20">20 s</button><button data-v="180">3 min</button><button data-v="1800">30 min</button><button data-v="10800">3 h</button>
      </div>
      <div class="seg" data-track>
        <button data-v="0" class="on">Cámara fija</button><button data-v="1">Con montura</button>
      </div>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#sm-c'));
    const range = el.querySelector('#sm-r');
    let stars = [];
    let t = 1800;
    let track = 0; // animado 0 → 1
    let trackTarget = 0;

    loadSky().then((sky) => {
      stars = sky.stars
        .filter((s) => s[1] > 12 && s[2] < 5.4)
        .map((s) => ({ ra: s[0] * DEG, p: (90 - s[1]) * DEG, mag: s[2], c: bvColor(s[3]) }));
    });

    const draw = () => {
      const { ctx: g, w, h } = view;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#02030a';
      g.fillRect(0, 0, w, h);
      const cx = w * 0.5;
      const cy = h * 0.5;
      const R = Math.min(w, h) * 0.5;
      const scale = R / (40 * DEG);
      const arc = (t / 3600) * 15 * DEG * (1 - track);
      g.lineCap = 'round';
      for (const s of stars) {
        const r = s.p * scale;
        if (r > Math.hypot(w, h)) continue;
        const a0 = -s.ra - Math.PI / 2;
        const size = Math.max(0.7, (5.6 - s.mag) * 0.62) * (w / 1400);
        const [cr, cg, cb] = s.c;
        g.strokeStyle = `rgba(${cr},${cg},${cb},${clamp(0.85 - arc * 0.25, 0.35, 0.9)})`;
        g.lineWidth = size * 1.5;
        g.beginPath();
        g.arc(cx, cy, r, a0, a0 + Math.max(arc, 0.0008));
        g.stroke();
      }
      // la Polar
      g.fillStyle = '#fff';
      g.beginPath();
      g.arc(cx, cy, 2.5, 0, TAU);
      g.fill();
    };

    const upd = () => {
      el.querySelector('#sm-o').textContent = fmtT(t);
      el.querySelector('#sm-t').textContent = fmtT(t);
      const deg = (t / 3600) * 15;
      el.querySelector('#sm-a').textContent =
        track > 0.5 ? 'Puntos: la montura sigue al cielo' : deg < 1 ? `${(deg * 60).toFixed(0)}′ de arco` : `${deg.toFixed(1)}° de arco`;
      draw();
    };

    bindRange(range, (v) => {
      t = toT(v);
      upd();
    });
    const presets = bindSegmented(el.querySelector('[data-seg]'), (v) => {
      const target = Math.log(v / TMIN) / Math.log(TMAX / TMIN) * 100;
      setRange(range, target);
    });
    const trackSel = bindSegmented(el.querySelector('[data-track]'), (v) => {
      trackTarget = +v;
    });
    ctx.loop((dt) => {
      if (Math.abs(track - trackTarget) > 0.002) {
        track += (trackTarget - track) * Math.min(1, dt * 5);
        upd();
      }
    });
    new ResizeObserver(draw).observe(el.querySelector('#sm-c'));
    return {
      step(n) {
        trackTarget = n;
        trackSel(String(n), true);
      },
    };
  },
};
