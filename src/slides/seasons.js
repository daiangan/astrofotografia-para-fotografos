import { asset } from '../lib/dom.js';
import { MONTHS, oppositionDay, dayOfYear as doy } from '../lib/sky.js';

const TARGETS = [
  { n: 'Andrómeda', s: 'M31', ra: 10.68, img: 'andromeda' },
  { n: 'Pléyades', s: 'M45', ra: 56.87, img: 'pleiades' },
  { n: 'Orión', s: 'M42', ra: 83.82, img: 'orion' },
  { n: 'Roseta', s: 'NGC 2237', ra: 97.98, img: 'rosette' },
  { n: 'Tríada de Leo', s: 'M65 · M66', ra: 169.7, img: 'leo' },
  { n: 'Remolino', s: 'M51', ra: 202.47, img: 'm51' },
  { n: 'Hércules', s: 'M13', ra: 250.42, img: 'm13' },
  { n: 'Vía Láctea', s: 'Núcleo', ra: 266.4, img: 'hero', pos: '50% 50%', size: '340%' },
  { n: 'Laguna', s: 'M8', ra: 270.92, img: 'lagoon' },
  { n: 'Norteamérica', s: 'NGC 7000', ra: 314.7, img: 'ngc7000' },
];

const SEASONS = [
  { name: 'Dic – Feb', months: [11, 0, 1] },
  { name: 'Mar – May', months: [2, 3, 4] },
  { name: 'Jun – Ago', months: [5, 6, 7] },
  { name: 'Sep – Nov', months: [8, 9, 10] },
];

const monthOfDay = (d) => new Date(Date.UTC(2026, 0, 1 + d)).getUTCMonth();
const angle = (d) => (d / 365) * 360 - 90;

function sector(r0, r1, a0, a1) {
  const p = (r, a) => [50 + r * Math.cos((a * Math.PI) / 180), 50 + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(r1, a0);
  const [x1, y1] = p(r1, a1);
  const [x2, y2] = p(r0, a1);
  const [x3, y3] = p(r0, a0);
  return `M${x0} ${y0} A${r1} ${r1} 0 0 1 ${x1} ${y1} L${x2} ${y2} A${r0} ${r0} 0 0 0 ${x3} ${y3}Z`;
}

export default {
  id: 'seasons',
  title: 'Temporadas de astrofotografía',
  steps: 4,
  html: () => {
    const items = TARGETS.map((t) => ({ ...t, day: oppositionDay(t.ra) })).sort((a, b) => a.day - b.day);
    const radii = [0.395, 0.3, 0.205];
    const thumbs = items
      .map((t, i) => {
        const a = (angle(t.day) * Math.PI) / 180;
        const r = radii[i % 3];
        const x = 50 + r * 100 * Math.cos(a);
        const y = 50 + r * 100 * Math.sin(a);
        const m = monthOfDay(t.day);
        return `<div class="wh__t" data-m="${m}" title="${t.n}" style="left:${x}%;top:${y}%;background-image:url(${asset(`img/${t.img}.jpg`)});background-position:${t.pos || '50% 50%'};background-size:${t.size || 'cover'}"></div>`;
      })
      .join('');
    const months = MONTHS.map((m, i) => {
      const a = ((i + 0.5) / 12) * 360 - 90;
      const x = 50 + 46 * Math.cos((a * Math.PI) / 180);
      const y = 50 + 46 * Math.sin((a * Math.PI) / 180);
      return `<span class="wh__m" data-m="${i}" style="left:${x}%;top:${y}%">${m}</span>`;
    }).join('');
    const lists = SEASONS.map((s, k) => {
      const names = items.filter((t) => s.months.includes(monthOfDay(t.day)));
      return `<div class="se__d" data-only="${k + 1}"><h3>${s.name}</h3><ul>${names
        .map((t) => `<li><b>${t.n}</b><span>${t.s}</span></li>`)
        .join('')}</ul></div>`;
    }).join('');
    const today = angle(doy(new Date()));
    return `
      <div class="se">
        <div class="se__left">
          <p class="eyebrow rise">Planificar · temporadas</p>
          <h2 class="title rise">Cada mes, <em>otro cielo</em></h2>
          <div class="se__desc">
            <p class="lede" data-upto="0">Cada objeto tiene su temporada: cuando culmina a medianoche.</p>
            ${lists}
          </div>
        </div>
        <div class="wh rise">
          <svg viewBox="0 0 100 100" aria-hidden="true" id="wh-svg"></svg>
          ${months}
          ${thumbs}
          <div class="wh__today" style="--a:${today}deg"><i></i><span>Hoy</span></div>
        </div>
      </div>`;
  },
  mount(el) {
    const svg = el.querySelector('#wh-svg');
    svg.innerHTML =
      Array.from({ length: 12 }, (_, i) => `<path class="wh__arc" data-m="${i}" d="${sector(41.5, 45.5, (i / 12) * 360 - 90 + 0.6, ((i + 1) / 12) * 360 - 90 - 0.6)}" />`).join('') +
      '<circle cx="50" cy="50" r="10" class="wh__core" />';
    const arcs = Array.from(el.querySelectorAll('.wh__arc, .wh__m, .wh__t'));
    return {
      step(n) {
        const active = n > 0 ? SEASONS[n - 1].months : null;
        arcs.forEach((a) => {
          const m = +a.dataset.m;
          const on = active ? active.includes(m) : true;
          a.classList.toggle('on', !!active && on);
          a.classList.toggle('off', !!active && !on);
        });
      },
    };
  },
};
