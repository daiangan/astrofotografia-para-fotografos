const NODES = [
  { t: 'Captar luz', s: 'Apertura y sensor', x: 12, y: 56 },
  { t: 'Seguir el cielo', s: 'Montura y guiado', x: 32, y: 24 },
  { t: 'Buscar oscuridad', s: 'Bortle bajo', x: 54, y: 66 },
  { t: 'Apilar', s: 'Muchas tomas', x: 70, y: 26 },
  { t: 'Empezar simple', s: 'Tracker o inteligente', x: 86, y: 58 },
];

export default {
  id: 'recap',
  title: 'Resumen',
  tone: 'dark',
  steps: 5,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Para llevarte</p>
      <h2 class="title rise">Cinco ideas, <em>una constelación</em></h2>
    </div>
    <div class="rc grow">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="rc__lines" aria-hidden="true">
        ${NODES.slice(1)
          .map((n, i) => `<line data-from="${i + 2}" x1="${NODES[i].x}" y1="${NODES[i].y}" x2="${n.x}" y2="${n.y}" />`)
          .join('')}
      </svg>
      ${NODES.map(
        (n, i) => `<div class="rc__n" data-from="${i + 1}" style="left:${n.x}%;top:${n.y}%">
          <i></i><b>${n.t}</b><span>${n.s}</span></div>`,
      ).join('')}
    </div>`,
};
