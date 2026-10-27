const ICONS = {
  nina: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  asiair: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  stella: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1"/></svg>',
  sharp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M3 16c4 3 12 0 18-8"/></svg>',
};

const TOOLS = [
  { k: 'nina', name: 'NINA', tags: ['Windows', 'Gratis'], line: 'Secuencias automáticas para toda la noche.' },
  { k: 'asiair', name: 'ASIAIR', tags: ['ZWO', 'App móvil'], line: 'Una cajita y tu teléfono. Conectar y capturar.' },
  { k: 'stella', name: 'StellaVita', tags: ['ToupTek', 'Inalámbrico'], line: 'Controlador que se lleva bien con varias marcas.' },
  { k: 'sharp', name: 'SharpCap', tags: ['Windows', 'Planetaria'], line: 'Captura, alineación polar y apilado en vivo.' },
];

export default {
  id: 'acquisition',
  title: 'Software de adquisición',
  steps: 0,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Accesorios · computadora y software</p>
      <h2 class="title rise">El cerebro <em>del equipo</em></h2>
      <p class="lede rise">Maneja cámara, montura, foco y guiado.</p>
    </div>
    <div class="aq grow">
      ${TOOLS.map(
        (t) => `<article class="aq__card rise">
          <div class="aq__icon">${ICONS[t.k]}</div>
          <h3>${t.name}</h3>
          <div class="aq__tags">${t.tags.map((x) => `<span class="chip">${x}</span>`).join('')}</div>
          <p>${t.line}</p>
        </article>`,
      ).join('')}
    </div>`,
};
