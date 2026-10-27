import { bindSegmented } from '../lib/dom.js';

const LAMP = (kind, warm) => {
  const col = warm ? '#ffbd6e' : '#cfe3ff';
  const shielded = kind === 'shield';
  const up = shielded ? '' : `
    <g class="up">
      <path d="M220 96 L120 8 M220 96 L160 -6 M220 96 L220 -14 M220 96 L280 -6 M220 96 L320 8" class="ray" style="stroke:${col}" />
      <ellipse cx="220" cy="0" rx="200" ry="90" fill="url(#glow-${kind}-${warm ? 'w' : 'c'})" />
    </g>`;
  return `
  <svg viewBox="0 0 440 300" class="lamps__svg" aria-hidden="true">
    <defs>
      <radialGradient id="glow-${kind}-${warm ? 'w' : 'c'}"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>
      <linearGradient id="cone-${kind}-${warm ? 'w' : 'c'}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset="1" stop-color="${col}" stop-opacity=".08"/></linearGradient>
    </defs>
    ${shielded ? '' : `<g fill="#fff" opacity=".0"></g>`}
    ${shielded ? Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 97) % 430 + 6}" cy="${(i * 53) % 90 + 8}" r="${0.8 + (i % 3) * 0.5}" fill="#fff" opacity="${0.4 + (i % 4) * 0.15}"/>`).join('') : ''}
    ${up}
    <polygon points="${shielded ? '204,110 236,110 300,262 140,262' : '212,104 228,104 340,262 100,262'}" fill="url(#cone-${kind}-${warm ? 'w' : 'c'})" />
    <path d="M0 262 H440" stroke="var(--line)" stroke-width="2" />
    <rect x="0" y="262" width="440" height="38" fill="var(--panel)" />
    <path d="M220 262 V112" stroke="var(--dim)" stroke-width="5" />
    <path d="M220 118 H250" stroke="var(--dim)" stroke-width="5" />
    ${
      shielded
        ? `<path d="M198 108 Q220 84 242 108 Z" fill="var(--dim)" /><rect x="206" y="106" width="28" height="6" rx="3" fill="${col}" />`
        : `<circle cx="220" cy="98" r="16" fill="${col}" opacity=".95" /><circle cx="220" cy="98" r="24" fill="${col}" opacity=".22" />`
    }
    <rect x="330" y="200" width="90" height="62" fill="var(--panel-2)" stroke="var(--line)" />
    <rect x="348" y="216" width="22" height="24" fill="${shielded ? 'var(--panel)' : col}" opacity="${shielded ? 1 : 0.7}" />
  </svg>`;
};

export default {
  id: 'lamps',
  title: 'Luminarias',
  tone: 'dark',
  steps: 2,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Condiciones del cielo · luminarias</p>
      <h2 class="title rise">Ilumina el suelo, <em>no el cielo</em></h2>
    </div>
    <div class="lm grow">
      <div class="lm__stage rise">
        <div class="lm__scene" data-scene="bad">${LAMP('globe', false)}</div>
        <div class="lm__scene" data-scene="shield">${LAMP('shield', false)}</div>
        <div class="lm__scene" data-scene="warm">${LAMP('shield', true)}</div>
      </div>
      <div class="lm__side rise">
        <div class="lm__mode on" data-i="0"><b>Globo abierto</b><span>Media luz se va al cielo… y a tus ventanas.</span></div>
        <div class="lm__mode" data-i="1"><b>Con pantalla</b><span>La luz cae solo donde hace falta.</span></div>
        <div class="lm__mode" data-i="2"><b>Y cálida</b><span>Menos azul: menos brillo en el cielo.</span></div>
        <div class="lm__meter"><div class="lm__bar"><i id="lm-bar"></i></div><span>Luz al cielo</span><b id="lm-v">100 %</b></div>
      </div>
    </div>`,
  mount(el) {
    const scenes = Array.from(el.querySelectorAll('.lm__scene'));
    const modes = Array.from(el.querySelectorAll('.lm__mode'));
    const bar = el.querySelector('#lm-bar');
    const val = el.querySelector('#lm-v');
    const level = [100, 4, 2];
    return {
      step(n) {
        scenes.forEach((s, i) => s.classList.toggle('on', i === n));
        modes.forEach((m, i) => m.classList.toggle('on', i === n));
        bar.style.height = `${level[n]}%`;
        val.textContent = `${level[n]} %`;
      },
    };
  },
};
