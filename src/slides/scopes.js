// Diagramas de trayectoria de la luz: la luz entra por la izquierda y se enfoca a la derecha.
const W = 440;
const AX = 100; // eje óptico

const ray = (pts) => `<path class="ray" d="M${pts.map((p) => p.join(' ')).join(' L')}" />`;

function refractor() {
  const ys = [70, 100, 130];
  const F = [352, AX];
  return `
    <path class="tube" d="M64 60 H334 M64 140 H334" />
    <path class="tube" d="M46 56 V144 M46 56 H64 M46 144 H64" opacity=".5" />
    <rect class="hw" x="334" y="88" width="36" height="24" rx="3" />
    <rect class="hw" x="370" y="80" width="44" height="40" rx="6" />
    ${ys.map((y) => ray([[6, y], [80, y], F])).join('')}
    <path class="glass" d="M80 58 Q98 100 80 142 Q62 100 80 58 Z" />
    <circle class="dot" cx="${F[0]}" cy="${F[1]}" r="4" />`;
}

function newton() {
  const prim = 330;
  const V = [95, AX];
  const D = [150, AX];
  // Rayos que rebotan en el primario, golpean el diagonal (recta x - y = 50) y salen al enfocador
  const F = [D[0], AX - (D[0] - V[0])];
  const ys = [68, 82, 118, 132];
  const paths = ys
    .map((y0) => {
      const s = (50 - prim + y0) / (V[0] - prim - (V[1] - y0));
      const q = [prim + (V[0] - prim) * s, y0 + (V[1] - y0) * s];
      return ray([[6, y0], [prim, y0], q, F]);
    })
    .join('');
  return `
    <path class="tube" d="M40 56 H332 M40 144 H332 M332 56 V144" />
    <rect class="hw" x="140" y="20" width="20" height="36" rx="2" />
    <rect class="hw" x="132" y="6" width="36" height="16" rx="4" />
    ${paths}
    <path class="mirror" d="M322 58 Q340 100 322 142" />
    <path class="mirror" d="M138 88 L162 112" />
    <circle class="dot" cx="${F[0]}" cy="${F[1]}" r="4" />`;
}

function catadioptric(kind) {
  const prim = 330;
  const sec = kind === 'sct' ? 68 : 64;
  const F = [388, AX];
  const ys = [60, 78, 122, 140];
  const paths = ys
    .map((y0) => {
      const ys2 = AX + (y0 - AX) * 0.3;
      return ray([[6, y0], [prim, y0], [sec, ys2], F]);
    })
    .join('');
  const corrector =
    kind === 'sct'
      ? `<path class="glass-line" d="M50 54 Q58 100 50 146" /><path class="glass-line" d="M54 54 Q62 100 54 146" />`
      : `<path class="glass" d="M52 52 Q34 100 52 148 L64 148 Q46 100 64 52 Z" />`;
  const secondary =
    kind === 'sct'
      ? `<path class="mirror" d="M60 88 Q74 100 60 112" />`
      : `<path class="mirror" d="M62 88 V112" />`;
  return `
    <path class="tube" d="M56 54 H332 M56 146 H332" />
    <rect class="hw" x="332" y="88" width="28" height="24" rx="3" />
    <rect class="hw" x="360" y="80" width="46" height="40" rx="6" />
    ${paths}
    ${corrector}
    ${secondary}
    <path class="mirror" d="M324 54 Q338 72 338 88" />
    <path class="mirror" d="M338 112 Q338 128 324 146" />
    <circle class="dot" cx="${F[0]}" cy="${F[1]}" r="4" />`;
}

const SCOPES = [
  { key: 'refractor', name: 'Refractor', svg: refractor() },
  { key: 'newton', name: 'Reflector · Newton', svg: newton() },
  { key: 'sct', name: 'Schmidt‑Cassegrain', svg: catadioptric('sct') },
  { key: 'mak', name: 'Maksutov‑Cassegrain', svg: catadioptric('mak') },
];

const TEXT = [
  { t: 'Lentes', p: 'Como tu teleobjetivo, pero con tubo.', c: 'Nítido · sin obstrucción' },
  { t: 'Espejo', p: 'Un espejo en lugar de lentes. Más apertura por cada peso.', c: 'Sin aberración cromática' },
  { t: 'Espejos + lámina', p: 'Focal larguísima en un tubo cortito.', c: 'Compacto · versátil' },
  { t: 'Menisco + espejo', p: 'Contraste altísimo: Luna y planetas.', c: 'También: Ritchey‑Chrétien · Petzval' },
];

export default {
  id: 'scopes',
  title: 'Tipos de telescopios',
  steps: 4,
  html: () => `
    <div class="scopes grow">
      <div class="scopes__text">
        <p class="eyebrow rise">Tipos de telescopios</p>
        <h2 class="title rise">Doblar <em>la luz</em></h2>
        <div class="scopes__desc">
          <p class="lede" data-upto="0">Con lentes, con espejos… o con ambos.</p>
          ${TEXT.map(
            (t, i) => `<div class="scopes__d" data-only="${i + 1}">
              <h3>${t.t}</h3><p>${t.p}</p><span class="chip chip--accent">${t.c}</span></div>`,
          ).join('')}
        </div>
      </div>
      <div class="scopes__grid">
        ${SCOPES.map(
          (s, i) => `<figure class="scope rise" data-k="${i + 1}">
            <svg viewBox="0 0 ${W} 200" aria-hidden="true">${s.svg}</svg>
            <figcaption>${s.name}</figcaption></figure>`,
        ).join('')}
      </div>
    </div>`,
  mount(el) {
    const cards = Array.from(el.querySelectorAll('.scope'));
    return {
      step(n) {
        cards.forEach((c) => c.classList.toggle('dim', n > 0 && +c.dataset.k !== n));
      },
    };
  },
};
