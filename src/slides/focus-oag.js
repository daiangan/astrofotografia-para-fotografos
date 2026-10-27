import { fitCanvas, rng, gauss, TAU, cssVar } from '../lib/dom.js';

const POS = Array.from({ length: 11 }, (_, i) => -1 + i * 0.2);
const P0 = 0.12; // posición óptima
const hfr = (p, n = 0) => Math.sqrt(1.5 ** 2 + (5.2 * (p - P0)) ** 2) + n;

const oag = `
<svg viewBox="0 0 400 260" aria-hidden="true">
  <path class="tube" d="M20 70 H210 M20 190 H210" />
  <path class="ray" d="M0 96 H60 L292 130" />
  <path class="ray" d="M0 130 H60 L292 130" />
  <path class="ray" d="M0 164 H60 L292 130" />
  <path class="glass" d="M60 62 Q80 130 60 198 Q40 130 60 62 Z" />
  <path class="hw" d="M250 122 h18 l18 8 l-18 8 h-18z" style="fill:var(--accent);opacity:.9" />
  <path class="ray" style="stroke:var(--green)" d="M262 111 V70" />
  <rect class="hw" x="242" y="30" width="40" height="40" rx="6" />
  <rect class="hw" x="292" y="104" width="76" height="52" rx="8" />
  <circle class="dot" cx="292" cy="130" r="4" />
  <text x="222" y="22" class="lab">Cámara guía</text>
  <text x="368" y="176" class="lab" text-anchor="end">Cámara principal</text>
  <text x="200" y="150" class="lab" style="fill:var(--accent)">Prisma</text>
</svg>`;

export default {
  id: 'focus-oag',
  title: 'Enfocador y OAG',
  steps: 0,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Accesorios</p>
      <h2 class="title rise">Enfocar <em>y guiar</em></h2>
    </div>
    <div class="fo grow">
      <article class="fo__card rise">
        <h3>Foco automático</h3>
        <div class="canvas-box fo__plot"><canvas id="fo-c"></canvas></div>
        <p>Un motor mueve el foco y mide el tamaño de la estrella. Busca el punto más pequeño.</p>
      </article>
      <article class="fo__card rise">
        <h3>OAG</h3>
        <div class="fo__svg">${oag}</div>
        <p>Guía con la misma óptica del telescopio: toma un poquito de luz del borde.</p>
      </article>
    </div>`,
  mount(el, ctx) {
    const view = fitCanvas(el.querySelector('#fo-c'));
    const r = rng(3);
    const noise = POS.map(() => gauss(r) * 0.12);
    let t = 0;

    ctx.loop((dt) => {
      t += dt;
      const { ctx: g, w, h } = view;
      if (!w) return;
      const cycle = 11;
      const c = t % cycle;
      const sweep = Math.min(1, c / 6.5); // 0..1 durante el barrido
      const shown = Math.floor(sweep * POS.length);
      const done = c > 6.8;
      g.clearRect(0, 0, w, h);
      const pad = { l: 20, r: 20, t: h * 0.42, b: 30 };
      const X = (p) => pad.l + ((p + 1) / 2) * (w - pad.l - pad.r);
      const Y = (v) => h - pad.b - (v / 6.4) * (h - pad.t - pad.b);
      g.strokeStyle = 'rgba(255,255,255,0.18)';
      g.beginPath();
      g.moveTo(pad.l, h - pad.b);
      g.lineTo(w - pad.r, h - pad.b);
      g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.font = `${Math.max(10, w * 0.034)}px "JetBrains Mono Variable", monospace`;
      g.textAlign = 'left';
      g.fillText('POSICIÓN DEL FOCO', pad.l, h - 8);
      g.textAlign = 'right';
      g.fillText('HFR', w - pad.r, pad.t - 6);
      const accent = cssVar('--accent');
      // curva ajustada
      if (done) {
        g.strokeStyle = 'rgba(98,227,176,0.9)';
        g.lineWidth = 3;
        g.beginPath();
        for (let p = -1; p <= 1.001; p += 0.02) (p === -1 ? g.moveTo(X(p), Y(hfr(p))) : g.lineTo(X(p), Y(hfr(p))));
        g.stroke();
      }
      for (let i = 0; i < Math.min(shown, POS.length); i++) {
        g.fillStyle = accent;
        g.beginPath();
        g.arc(X(POS[i]), Y(hfr(POS[i], noise[i])), Math.max(4, w * 0.014), 0, TAU);
        g.fill();
      }
      // posición actual del motor
      const cur = done ? P0 : -1 + 2 * sweep;
      const ch = hfr(cur);
      g.strokeStyle = done ? '#62e3b0' : 'rgba(255,255,255,0.5)';
      g.lineWidth = 2;
      g.setLineDash([4, 5]);
      g.beginPath();
      g.moveTo(X(cur), pad.t - 6);
      g.lineTo(X(cur), h - pad.b);
      g.stroke();
      g.setLineDash([]);
      // la estrella se ve más pequeña al enfocar
      const sx = w * 0.14;
      const sy = h * 0.2;
      const rad = 3 + ch * (w * 0.011);
      const grd = g.createRadialGradient(sx, sy, 0, sx, sy, rad * 1.8);
      grd.addColorStop(0, '#fff');
      grd.addColorStop(0.35, 'rgba(190,215,255,0.6)');
      grd.addColorStop(1, 'rgba(120,160,255,0)');
      g.fillStyle = grd;
      g.beginPath();
      g.arc(sx, sy, rad * 1.8, 0, TAU);
      g.fill();
      if (done) {
        g.fillStyle = '#62e3b0';
        g.textAlign = 'left';
        g.font = `600 ${Math.max(12, w * 0.045)}px "Inter Variable", sans-serif`;
        g.fillText('Enfocado', w * 0.3, h * 0.24);
      }
    });
  },
};
