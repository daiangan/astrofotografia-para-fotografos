const TOOLS = [
  { name: 'Siril', cost: 'Gratis', kind: 'Código abierto', line: 'Apila y procesa de principio a fin.', hue: 210 },
  { name: 'PixInsight', cost: 'De pago', kind: 'Estándar profesional', line: 'La navaja suiza del astrofotógrafo avanzado.', hue: 265 },
  { name: 'Seti Astro Suite', cost: 'Gratis', kind: 'Donationware', line: 'Herramientas de edición astro, en constante crecimiento.', hue: 170 },
  { name: 'AstroWizard', cost: 'Gratis', kind: 'Para principiantes', line: 'Procesado guiado, paso a paso y sin jerga.', hue: 25 },
];

export default {
  id: 'software',
  title: 'Software de procesado',
  steps: 0,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Procesado · software</p>
      <h2 class="title rise">Tu <em>cuarto oscuro</em></h2>
    </div>
    <div class="sw grow">
      ${TOOLS.map(
        (t) => `<article class="sw__card rise" style="--h:${t.hue}">
          <div class="sw__top"><span class="chip">${t.cost}</span><span class="chip">${t.kind}</span></div>
          <h3>${t.name}</h3>
          <p>${t.line}</p>
        </article>`,
      ).join('')}
    </div>
    <p class="tie rise"><b>Complementos</b> GraXpert quita gradientes · StarNet separa las estrellas.</p>`,
};
