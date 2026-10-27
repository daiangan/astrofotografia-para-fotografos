import { asset } from '../lib/dom.js';

const TYPES = [
  { name: 'Nocturna', img: 'milkyway-land', line: 'Vía Láctea, star trails, paisaje nocturno', gear: 'Cámara + lente gran angular', pos: '50% 40%' },
  { name: 'Cielo profundo', img: 'orion', line: 'Nebulosas, galaxias y cúmulos', gear: 'Telescopio + montura + cámara', pos: '50% 50%' },
  { name: 'Planetaria', img: 'jupiter', line: 'Júpiter, Saturno, Marte', gear: 'Focal larga + video a alta velocidad', pos: '50% 50%' },
  { name: 'Lunar', img: 'moon', line: 'Cráteres, mares y montañas', gear: 'Telescopio o teleobjetivo', pos: '50% 45%' },
  { name: 'Solar', img: 'sun', line: 'Manchas y prominencias', gear: 'Filtro solar seguro. Siempre.', pos: '50% 50%', warn: true },
];

export default {
  id: 'types',
  title: 'Tipos de astrofotografía',
  tone: 'dark',
  steps: 5,
  html: () => `
    <div class="ty">
      <div class="ty__head">
        <p class="eyebrow rise">Tipos de astrofotografía</p>
        <h2 class="title rise">Cinco <em>maneras de mirar</em></h2>
      </div>
      <div class="ty__row rise">
        ${TYPES.map(
          (t, i) => `<article class="ty__p" data-k="${i + 1}" style="--img:url(${asset(`img/${t.img}.jpg`)});--pos:${t.pos}">
            <span class="ty__num">0${i + 1}</span>
            <span class="ty__vname">${t.name}</span>
            <div class="ty__full">
              <h3>${t.name}</h3>
              <p>${t.line}</p>
              <span class="chip ${t.warn ? 'chip--warm' : 'chip--accent'}">${t.gear}</span>
            </div>
          </article>`,
        ).join('')}
      </div>
    </div>`,
  mount(el) {
    const panels = Array.from(el.querySelectorAll('.ty__p'));
    return {
      step(n) {
        panels.forEach((p) => p.classList.toggle('focus', +p.dataset.k === n));
        el.querySelector('.ty__row').classList.toggle('has-focus', n > 0);
      },
    };
  },
};
