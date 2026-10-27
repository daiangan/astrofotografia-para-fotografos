import { fitCanvas, TAU, rng, DEG } from '../lib/dom.js';

const altaz = `
<svg viewBox="0 0 300 250" aria-hidden="true">
  <path class="tube" d="M150 160 L106 236 M150 160 L194 236 M150 160 L150 236" />
  <rect class="hw" x="126" y="146" width="48" height="16" rx="4" />
  <path class="tube" d="M150 146 V104" style="stroke:var(--fg)" stroke-width="5" />
  <ellipse class="orbit" cx="150" cy="154" rx="46" ry="9" />
  <g class="swing" style="transform-origin:150px 98px">
    <rect class="hw" x="60" y="80" width="150" height="34" rx="7" transform="rotate(-32 150 98)" />
    <rect class="hw" x="186" y="62" width="34" height="22" rx="5" transform="rotate(-32 150 98)" />
  </g>
  <circle cx="150" cy="98" r="9" class="dot" />
  <path class="orbit" d="M110 70 A48 48 0 0 1 178 60" />
  <text x="86" y="60" class="lab">Altura</text>
  <text x="208" y="158" class="lab">Acimut</text>
</svg>`;

const equatorial = `
<svg viewBox="0 0 300 250" aria-hidden="true">
  <path class="tube" d="M130 168 L92 240 M130 168 L172 240 M130 168 L130 240" />
  <rect class="hw" x="108" y="154" width="44" height="16" rx="4" />
  <path class="pole" d="M130 154 L226 40" />
  <path class="pole-far" d="M226 40 L252 10" />
  <g class="star-icon" transform="translate(258 4)"><path d="M0 0l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="var(--warm)" transform="translate(0 4) scale(.9)" /></g>
  <ellipse class="orbit orbit--tilt" cx="180" cy="98" rx="42" ry="9" transform="rotate(-50 180 98)" />
  <g class="swing" style="transform-origin:198px 76px">
    <rect class="hw" x="120" y="60" width="150" height="30" rx="7" transform="rotate(-62 198 76)" />
    <rect class="hw" x="228" y="20" width="30" height="20" rx="5" transform="rotate(-62 198 76)" opacity="0"/>
  </g>
  <circle cx="198" cy="76" r="9" class="dot" />
  <text x="238" y="112" class="lab">Un solo eje</text>
  <text x="16" y="46" class="lab">Paralelo al eje</text>
  <text x="16" y="72" class="lab">de la Tierra</text>
</svg>`;

export default {
  id: 'mounts',
  title: 'Altazimutal vs. ecuatorial',
  steps: 1,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Monturas</p>
      <h2 class="title rise">Dos ejes, <em>dos filosofías</em></h2>
    </div>
    <div class="mt grow">
      <article class="mt__card rise">
        <h3>Altazimutal</h3>
        ${altaz}
        <div class="mt__field" data-from="1"><div class="canvas-box"><canvas data-kind="altaz"></canvas></div><span>El campo <b>gira</b></span></div>
        <p>Arriba‑abajo y izquierda‑derecha.</p>
      </article>
      <article class="mt__card rise">
        <h3>Ecuatorial</h3>
        ${equatorial}
        <div class="mt__field" data-from="1"><div class="canvas-box"><canvas data-kind="eq"></canvas></div><span>El campo <b>se queda</b></span></div>
        <p>Un eje alineado con el polo.</p>
      </article>
    </div>`,
  mount(el, ctx) {
    const r = rng(9);
    const stars = Array.from({ length: 34 }, () => ({ x: (r() - 0.5) * 2.4, y: (r() - 0.5) * 2.4, m: 0.6 + r() * 1.6 }));
    const views = Array.from(el.querySelectorAll('canvas')).map((c) => ({ kind: c.dataset.kind, v: fitCanvas(c) }));
    let t = 0;

    ctx.loop((dt) => {
      t += dt;
      const cycle = (t % 9) / 9; // “3 horas” condensadas en 9 s
      for (const { kind, v } of views) {
        const { ctx: g, w, h } = v;
        if (!w) continue;
        g.clearRect(0, 0, w, h);
        const ang = kind === 'altaz' ? cycle * 60 * DEG : 0;
        const S = Math.min(w, h) * 0.5;
        g.save();
        g.translate(w / 2, h / 2);
        g.rotate(ang);
        // galaxia de referencia
        const grd = g.createRadialGradient(0, 0, 0, 0, 0, S * 0.5);
        grd.addColorStop(0, 'rgba(255,220,180,0.95)');
        grd.addColorStop(0.35, 'rgba(160,190,255,0.45)');
        grd.addColorStop(1, 'rgba(120,150,255,0)');
        g.save();
        g.rotate(-0.5);
        g.scale(1, 0.32);
        g.fillStyle = grd;
        g.beginPath();
        g.arc(0, 0, S * 0.5, 0, TAU);
        g.fill();
        g.restore();
        g.fillStyle = '#dbe6ff';
        for (const s of stars) {
          g.globalAlpha = 0.5 + s.m * 0.25;
          g.beginPath();
          g.arc(s.x * S, s.y * S, s.m, 0, TAU);
          g.fill();
        }
        g.restore();
        // el encuadre de la cámara no se mueve
        g.strokeStyle = 'rgba(255,255,255,0.55)';
        g.lineWidth = 2;
        g.strokeRect(2, 2, w - 4, h - 4);
        g.globalAlpha = 1;
        g.fillStyle = 'rgba(255,255,255,0.7)';
        g.font = `${Math.max(10, w * 0.09)}px "JetBrains Mono Variable", monospace`;
        g.fillText(`+${(cycle * 3).toFixed(1)} h`, 8, h - 8);
      }
    });
  },
};
