const LEVELS = [
  {
    n: '1',
    t: 'Lo que ya tienes',
    d: 'Star tracker + tu cámara + tu lente',
    chip: 'Vía Láctea y paisajes nocturnos',
  },
  {
    n: '2',
    t: 'Todo en uno',
    d: 'Telescopio inteligente',
    chip: 'Seestar · Dwarf',
  },
  {
    n: '3',
    t: 'Tu propio equipo',
    d: 'Telescopio + montura + cámara + guiado',
    chip: 'ZWO · ToupTek · SVBONY · Askar',
  },
];

export default {
  id: 'start',
  title: 'Cómo comenzar',
  steps: 3,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Cómo comenzar</p>
      <h2 class="title rise">Empieza <em>simple</em></h2>
    </div>
    <div class="ld grow">
      ${LEVELS.map(
        (l, i) => `<div class="ld__step" data-from="${i + 1}" style="--k:${i}">
          <span class="ld__n">${l.n}</span>
          <h3>${l.t}</h3>
          <p>${l.d}</p>
          <span class="chip chip--accent">${l.chip}</span>
        </div>`,
      ).join('')}
    </div>
    <div class="ld__brands rise">
      ${[
        ['SVBONY', 'Accesible'],
        ['ZWO', 'Ecosistema'],
        ['ToupTek', 'Cámaras y control'],
        ['Askar', 'Refractores'],
      ]
        .map(([b, d]) => `<span><b>${b}</b>${d}</span>`)
        .join('')}
    </div>`,
};
