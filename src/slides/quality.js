import { fitCanvas, TAU, cssVar } from '../lib/dom.js';

// Cada diseño: cuánto se separa cada color (aberración cromática) y cuánto se deforma la estrella hacia la esquina.
const DESIGNS = [
  {
    key: 'doublet',
    name: 'Doblete',
    tag: 'Halo azul en estrellas brillantes',
    tie: 'Como un zoom económico',
    spread: 22,
    coma: 1.0,
    elements: 2,
  },
  {
    key: 'triplet',
    name: 'Triplete',
    tag: 'Colores alineados: apocromático',
    tie: 'Como un lente de cine',
    spread: 0,
    coma: 0.6,
    elements: 3,
  },
  {
    key: 'petzval',
    name: 'Petzval',
    tag: 'Campo plano hasta la esquina',
    tie: 'Como un objetivo de gran angular caro',
    spread: 0,
    coma: 0.05,
    elements: 4,
  },
];

const lens = (x, h, k) => `<path class="glass" d="M${x} ${100 - h} Q${x + k} 100 ${x} ${100 + h} Q${x - k} 100 ${x} ${100 - h} Z" />`;

function diagram(d) {
  const els = [];
  const x0 = 96;
  for (let i = 0; i < d.elements; i++) {
    const x = x0 + i * 26;
    els.push(lens(x, 56 - i * 3, i % 2 ? -12 : 14));
  }
  const fx = 280;
  // los rayos rojo, verde y azul se enfocan a distintas distancias si hay aberración cromática
  const cols = [
    ['#5aa0ff', fx - d.spread],
    ['#5fe08a', fx],
    ['#ff6b6b', fx + d.spread],
  ];
  const rays = cols
    .map(([c, x]) =>
      [-38, 38]
        .map((dy) => `<path class="ray" style="stroke:${c}" d="M6 ${100 + dy} H${x0} L${x} 100 L${x + 34} ${100 - dy * 0.45}" />`)
        .join(''),
    )
    .join('');
  return `<svg viewBox="0 0 340 200" aria-hidden="true">
    <path class="tube" d="M6 100 H334" opacity=".2" />
    ${rays}${els.join('')}
    <path class="sensor-line" d="M${fx + 34} 50 V150" />
  </svg>`;
}

function star(g, x, y, r, chroma, elong, angle) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.globalCompositeOperation = 'lighter';
  const draw = (dx, color) => {
    g.save();
    g.translate(dx, 0);
    g.scale(1 + elong, 1);
    const grd = g.createRadialGradient(0, 0, 0, 0, 0, r * 2.4);
    grd.addColorStop(0, `rgba(${color},1)`);
    grd.addColorStop(0.3, `rgba(${color},0.55)`);
    grd.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = grd;
    g.beginPath();
    g.arc(0, 0, r * 2.4, 0, TAU);
    g.fill();
    g.restore();
  };
  draw(-chroma, '60,110,255');
  draw(0, '80,255,120');
  draw(chroma, '255,70,70');
  g.restore();
}

export default {
  id: 'quality',
  title: 'Calidad óptica',
  steps: 3,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Telescopio vs. lente fotográfico</p>
      <h2 class="title rise">¿Cuántos <em>elementos</em>?</h2>
    </div>
    <div class="q grow">
      ${DESIGNS.map(
        (d, i) => `<article class="q__card rise" data-k="${i + 1}">
          <div class="q__diagram">${diagram(d)}</div>
          <div class="canvas-box q__star"><canvas data-i="${i}"></canvas></div>
          <h3>${d.name}</h3>
          <p>${d.tag}</p>
          <span class="tie"><b>≈</b>${d.tie}</span>
        </article>`,
      ).join('')}
    </div>`,
  mount(el, ctx) {
    const cards = Array.from(el.querySelectorAll('.q__card'));
    const views = cards.map((c, i) => fitCanvas(c.querySelector('canvas'), (v) => paint(v, i)));

    function paint(view, i) {
      const d = DESIGNS[i];
      const { ctx: g, w, h } = view;
      if (!w) return;
      g.clearRect(0, 0, w, h);
      // una estrella al centro, otra a media altura y otra en la esquina
      const spots = [
        { x: w * 0.2, y: h * 0.5, f: 0 },
        { x: w * 0.52, y: h * 0.5, f: 0.5 },
        { x: w * 0.84, y: h * 0.5, f: 1 },
      ];
      const scale = w / 300;
      for (const s of spots) {
        const angle = Math.PI * 0.75;
        star(g, s.x, s.y, 7 * scale, (d.spread / 22) * (2 + s.f * 4) * scale, d.coma * s.f * 1.1, angle);
        star(g, s.x, s.y, 2.4 * scale, 0, 0, 0);
      }
    }
    views.forEach((v, i) => paint(v, i));

    return {
      enter() {
        views.forEach((v, i) => paint(v, i));
      },
      step(n) {
        cards.forEach((c) => c.classList.toggle('dim', n > 0 && +c.dataset.k !== n));
      },
    };
  },
};
