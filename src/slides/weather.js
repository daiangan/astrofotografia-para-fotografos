import { bindRange, fitCanvas, loadImage, rng, TAU, DEG, setRange } from '../lib/dom.js';

const PHASES = ['Luna nueva', 'Creciente', 'Cuarto creciente', 'Gibosa creciente', 'Luna llena', 'Gibosa menguante', 'Cuarto menguante', 'Menguante'];
const phaseName = (d) => PHASES[Math.round((d / 29.53) * 8) % 8];

const CONDS = [
  {
    n: 'Nubes',
    q: '¿Cielo despejado?',
    icon: '<svg viewBox="0 0 64 40"><path class="cloud" d="M16 32h34a9 9 0 0 0 0-18 12 12 0 0 0-23-3 10 10 0 0 0-11 21z"/></svg>',
  },
  {
    n: 'Viento',
    q: 'Hace vibrar el telescopio',
    icon: '<svg viewBox="0 0 64 40"><path class="wind" d="M4 12h34a6 6 0 1 0-6-6M4 22h48a6 6 0 1 1-6 6M4 32h26"/></svg>',
  },
  {
    n: 'Humedad',
    q: 'Rocío y bruma',
    icon: '<svg viewBox="0 0 64 40"><path class="drop" d="M20 6c6 8 10 12 10 17a10 10 0 0 1-20 0c0-5 4-9 10-17z"/><path class="drop d2" d="M44 14c4 6 7 9 7 12.5a7 7 0 0 1-14 0c0-3.500 3-6.500 7-12.500z"/></svg>',
  },
];

export default {
  id: 'weather',
  title: 'Clima y Luna',
  steps: 0,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Planificar · clima</p>
      <h2 class="title rise">Antes de salir, <em>mira arriba</em></h2>
    </div>
    <div class="wx grow">
      <div class="wx__conds">
        ${CONDS.map((c) => `<div class="wx__c rise"><div class="wx__i">${c.icon}</div><div><b>${c.n}</b><span>${c.q}</span></div></div>`).join('')}
        <div class="wx__apps rise"><span class="chip">Clear Outside</span><span class="chip">Astrospheric</span><span class="chip">Meteoblue</span><span class="chip">Windy</span></div>
      </div>
      <div class="wx__moon rise" data-interactive>
        <div class="wx__discs">
          <div class="canvas-box wx__disc"><canvas id="wx-moon"></canvas></div>
          <div class="canvas-box wx__patch"><canvas id="wx-sky"></canvas><span>Tu cielo esa noche</span></div>
        </div>
        <div class="control"><label><span id="wx-name">Luna llena</span> <output id="wx-o">14 d</output></label>
          <input id="wx-r" type="range" min="0" max="29.5" step="0.1" value="14.7" /></div>
      </div>
    </div>`,
  mount(el, ctx) {
    const moon = fitCanvas(el.querySelector('#wx-moon'), () => draw());
    const patch = fitCanvas(el.querySelector('#wx-sky'), () => draw());
    const range = el.querySelector('#wx-r');
    let img = null;
    let age = 14.7;
    const r = rng(4);
    const stars = Array.from({ length: 1400 }, () => ({ x: r(), y: r(), m: 1.5 + Math.pow(r(), 0.35) * 6.5 }));

    loadImage('moon').then((i) => {
      img = i;
      draw();
    });

    function draw() {
      const illum = (1 - Math.cos((age / 29.53) * TAU)) / 2;
      if (moon.w && img) {
        const { ctx: g, w, h } = moon;
        g.clearRect(0, 0, w, h);
        const rad = Math.min(w, h) * 0.47;
        const cx = w / 2;
        const cy = h / 2;
        g.save();
        g.beginPath();
        g.arc(cx, cy, rad, 0, TAU);
        g.clip();
        const s = Math.max((rad * 2) / img.width, (rad * 2) / img.height) * 1.02;
        const s2 = s * 1.13;
        g.drawImage(img, cx - (img.width * s2) / 2, cy - (img.height * s2) / 2, img.width * s2, img.height * s2);
        // sombra: círculo menos la parte iluminada
        const elong = (age / 29.53) * 360;
        const k = Math.cos(elong * DEG);
        const waxing = age < 14.77;
        g.translate(cx, cy);
        if (!waxing) g.scale(-1, 1);
        g.fillStyle = 'rgba(3,4,12,0.94)';
        g.beginPath();
        g.rect(-rad - 2, -rad - 2, rad * 2 + 4, rad * 2 + 4);
        // parte iluminada (lado derecho, con terminador elíptico) se recorta con evenodd
        g.moveTo(0, -rad);
        g.arc(0, 0, rad, -Math.PI / 2, Math.PI / 2, false);
        g.ellipse(0, 0, Math.max(0.01, Math.abs(k) * rad), rad, 0, Math.PI / 2, -Math.PI / 2, k > 0);
        g.closePath();
        g.fill('evenodd');
        g.restore();
      }
      if (patch.w) {
        const { ctx: g, w, h } = patch;
        g.clearRect(0, 0, w, h);
        const glow = g.createLinearGradient(0, 0, 0, h);
        glow.addColorStop(0, `rgba(90,110,170,${0.05 + illum * 0.35})`);
        glow.addColorStop(1, `rgba(160,170,210,${0.1 + illum * 0.5})`);
        g.fillStyle = glow;
        g.fillRect(0, 0, w, h);
        const limit = 7.6 - illum * 3.6; // magnitud límite
        g.fillStyle = '#fff';
        for (const st of stars) {
          if (st.m > limit) continue;
          g.globalAlpha = Math.min(1, 0.3 + (limit - st.m) * 0.25);
          g.beginPath();
          g.arc(st.x * w, st.y * h, Math.max(0.6, (7.6 - st.m) * 0.38), 0, TAU);
          g.fill();
        }
        g.globalAlpha = 1;
      }
    }

    bindRange(range, (v) => {
      age = v;
      el.querySelector('#wx-name').textContent = phaseName(v);
      el.querySelector('#wx-o').textContent = `día ${Math.round(v)}`;
      draw();
    });
    setRange(range, 14.7);
  },
};
