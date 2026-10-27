import { asset } from '../lib/dom.js';

export default {
  id: 'tracker',
  title: 'Star tracker',
  tone: 'dark',
  steps: 1,
  bg: () => `<div class="tracker__photo" style="background-image:url(${asset('img/milkyway-land.jpg')})"></div><div class="tracker__shade"></div>`,
  html: () => `
    <div class="head">
      <p class="eyebrow rise">Monturas · star tracker</p>
      <h2 class="title rise">La montura <em>más pequeña</em></h2>
    </div>
    <div class="tk grow">
      <svg class="tk__scene rise" viewBox="0 0 340 300" aria-hidden="true">
        <path class="tube" d="M170 200 L126 292 M170 200 L214 292 M170 200 L170 292" />
        <rect class="hw" x="146" y="178" width="48" height="26" rx="6" />
        <rect class="hw" x="156" y="152" width="28" height="30" rx="4" />
        <circle cx="170" cy="191" r="6" class="dot" />
        <g class="swing" style="transform-origin:170px 150px">
          <rect class="hw" x="140" y="104" width="60" height="46" rx="6" />
          <rect class="hw" x="150" y="62" width="40" height="44" rx="4" />
          <rect class="hw" x="146" y="34" width="48" height="30" rx="5" />
        </g>
        <path class="pole" d="M170 190 L262 66" />
        <g transform="translate(266 48)"><path d="M0 0l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="var(--warm)" transform="translate(0 -6) scale(.9)" /></g>
        <text x="200" y="40" class="lab">Polar</text>
        <path class="orbit" d="M210 200 A46 12 0 1 1 214 196" />
      </svg>
      <div class="tk__nums">
        <div class="tk__num rise"><span>20 s</span><small>cámara fija</small></div>
        <div class="tk__arrow rise">→</div>
        <div class="tk__num tk__num--big rise"><span>3 min</span><small>con star tracker</small></div>
      </div>
    </div>
    <div class="tk__chips rise">
      <span class="chip">Tu cámara</span><span class="chip">Tu lente</span><span class="chip">Un motor</span>
      <span class="chip chip--warm" data-from="1">Sin guiado, con lentes de hasta ~200 mm</span>
    </div>`,
};
