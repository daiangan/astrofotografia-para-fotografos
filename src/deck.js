import { clamp } from './lib/dom.js';

const ICONS = {
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.7 6.7 0 0 0 10.5 10.5z"/></svg>',
  full: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  exit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.24 2.75.12 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z"/></svg>',
};

const INTERACTIVE = 'a, button, input, select, textarea, label, [data-interactive], .hud, .index';

export function createDeck({ root, slides, cfg }) {
  const N = slides.length;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { i: -1, step: 0 };
  const entries = [];

  root.innerHTML = `
    <div class="deck" id="deck"></div>
    <div class="hud hud--top">
      <span></span>
      <div class="hud__buttons">
        ${cfg.repository ? `<a class="hud__btn" href="${cfg.repository}" target="_blank" rel="noopener" aria-label="Repositorio en GitHub" title="Repositorio">${ICONS.github}</a>` : ''}
        <button class="hud__btn" id="btn-index" aria-label="Índice" title="Índice (O)">${ICONS.grid}</button>
        <button class="hud__btn" id="btn-theme" aria-label="Cambiar tema" title="Tema claro/oscuro (T)"></button>
        <button class="hud__btn" id="btn-full" aria-label="Pantalla completa" title="Pantalla completa (F)"></button>
      </div>
    </div>
    <div class="hud hud--bottom">
      <div class="hud__section" id="hud-section"></div>
      <div class="hud__nav">
        <button class="hud__btn" id="btn-prev" aria-label="Anterior">${ICONS.prev}</button>
        <div class="hud__count"><b id="hud-num">01</b><span> / ${String(N).padStart(2, '0')}</span></div>
        <button class="hud__btn" id="btn-next" aria-label="Siguiente">${ICONS.next}</button>
      </div>
    </div>
    <div class="progress"><div class="progress__bar" id="progress"></div></div>
    <div class="index" id="index" aria-hidden="true"></div>
  `;

  const deckEl = root.querySelector('#deck');
  const sectionEl = root.querySelector('#hud-section');
  const numEl = root.querySelector('#hud-num');
  const progressEl = root.querySelector('#progress');
  const indexEl = root.querySelector('#index');
  const themeBtn = root.querySelector('#btn-theme');
  const fullBtn = root.querySelector('#btn-full');

  /* ---------- slides ---------- */
  slides.forEach((def, i) => {
    const el = document.createElement('section');
    el.className = 'slide';
    el.dataset.id = def.id;
    el.dataset.pos = 'after';
    if (def.tone) el.dataset.tone = def.tone;
    el.setAttribute('aria-label', def.title || def.id);
    deckEl.appendChild(el);
    entries.push({ def, el, hooks: null, mounted: false, index: i });
  });

  const ctxFor = (entry) => ({
    cfg,
    reduced,
    deck: api,
    el: entry.el,
    loop(fn) {
      const item = { fn, entry };
      entry.loops = entry.loops || [];
      entry.loops.push(item);
      return item;
    },
    on(target, type, fn, opts) {
      target.addEventListener(type, fn, opts);
    },
    get active() {
      return state.i === entry.index;
    },
    get step() {
      return state.step;
    },
    next: () => api.next(),
  });

  function mount(entry) {
    if (entry.mounted) return;
    entry.mounted = true;
    const { def, el } = entry;
    el.innerHTML = `${def.bg ? `<div class="slide__bg">${def.bg(cfg)}</div>` : ''}<div class="slide__inner">${def.html(cfg)}</div>`;
    el.querySelectorAll('.rise').forEach((n, k) => {
      if (!n.style.getPropertyValue('--i')) n.style.setProperty('--i', k);
    });
    entry.ctx = ctxFor(entry);
    entry.hooks = (def.mount && def.mount(el, entry.ctx)) || {};
  }

  function applySteps(entry, step) {
    const { el } = entry;
    el.dataset.step = step;
    el.querySelectorAll('[data-from]').forEach((n) => n.classList.toggle('on', step >= +n.dataset.from));
    el.querySelectorAll('[data-only]').forEach((n) => n.classList.toggle('on', step === +n.dataset.only));
    el.querySelectorAll('[data-upto]').forEach((n) => n.classList.toggle('on', step <= +n.dataset.upto));
  }

  /* ---------- navegación ---------- */
  function go(i, step = 0) {
    i = clamp(i, 0, N - 1);
    const prev = entries[state.i];
    const next = entries[i];
    if (prev === next && state.step === step) return;
    const changed = prev !== next;
    if (changed) {
      if (prev && prev.hooks && prev.hooks.leave) prev.hooks.leave();
      mount(next);
    }
    state.i = i;
    state.step = clamp(step, 0, next.def.steps || 0);
    if (changed) {
      entries.forEach((e, k) => {
        e.el.dataset.pos = k < i ? 'before' : k > i ? 'after' : 'active';
      });
      if (next.hooks.enter) next.hooks.enter();
    }
    applySteps(next, state.step);
    if (next.hooks.step) next.hooks.step(state.step, { initial: changed });
    updateHud();
    if (changed) {
      window.dispatchEvent(new CustomEvent('deck:change', { detail: { index: i } }));
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 250));
      idle(() => {
        if (entries[i + 1]) mount(entries[i + 1]);
        if (entries[i - 1]) mount(entries[i - 1]);
      });
    }
    const hash = `#/${i + 1}${state.step ? '.' + state.step : ''}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  function next() {
    const e = entries[state.i];
    if (state.step < (e.def.steps || 0)) go(state.i, state.step + 1);
    else if (state.i < N - 1) go(state.i + 1, 0);
  }
  function prev() {
    if (state.step > 0) go(state.i, state.step - 1);
    else if (state.i > 0) go(state.i - 1, entries[state.i - 1].def.steps || 0);
  }

  function updateHud() {
    const e = entries[state.i];
    sectionEl.innerHTML = e.def.section
      ? `<span class="hud__num">${String(e.def.sectionIndex ?? '').padStart(2, '0')}</span>${e.def.section}`
      : '';
    root.dataset.tone = e.def.tone || '';
    numEl.textContent = String(state.i + 1).padStart(2, '0');
    progressEl.style.transform = `scaleX(${(state.i + 1) / N})`;
    root.querySelector('#btn-prev').disabled = state.i === 0 && state.step === 0;
    root.querySelector('#btn-next').disabled = state.i === N - 1 && state.step >= (e.def.steps || 0);
    document.title = `${e.def.title ? e.def.title + ' · ' : ''}${cfg.title}`;
  }

  /* ---------- loop de animación (solo la slide activa) ---------- */
  let last = performance.now();
  const t0 = last;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const e = entries[state.i];
    if (e && e.loops && !document.hidden) {
      for (const l of e.loops) l.fn(dt, (now - t0) / 1000);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- tema ---------- */
  function setTheme(t, persist = true) {
    document.documentElement.dataset.theme = t;
    themeBtn.innerHTML = t === 'dark' ? ICONS.sun : ICONS.moon;
    themeBtn.title = t === 'dark' ? 'Modo claro (T)' : 'Modo oscuro (T)';
    if (persist) {
      try {
        localStorage.setItem('theme', t);
      } catch (e) {
        /* sin almacenamiento */
      }
    }
    window.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }
  const toggleTheme = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  themeBtn.addEventListener('click', toggleTheme);
  setTheme(document.documentElement.dataset.theme || 'dark', false);

  /* ---------- fullscreen ---------- */
  const fsEl = document.documentElement;
  const fsSupported = !!(fsEl.requestFullscreen || fsEl.webkitRequestFullscreen);
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  function toggleFull() {
    if (!fsSupported) return;
    if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (fsEl.requestFullscreen || fsEl.webkitRequestFullscreen).call(fsEl);
  }
  const syncFull = () => {
    fullBtn.innerHTML = isFull() ? ICONS.exit : ICONS.full;
  };
  document.addEventListener('fullscreenchange', syncFull);
  document.addEventListener('webkitfullscreenchange', syncFull);
  fullBtn.addEventListener('click', toggleFull);
  if (!fsSupported) fullBtn.hidden = true;
  syncFull();

  /* ---------- índice ---------- */
  function buildIndex() {
    const groups = [];
    slides.forEach((s, i) => {
      const last = groups[groups.length - 1];
      if (!last || last.name !== s.section) groups.push({ name: s.section, items: [] });
      groups[groups.length - 1].items.push({ i, title: s.title || s.id });
    });
    indexEl.innerHTML = `<div class="index__panel">${groups
      .map(
        (g) => `<div class="index__group"><h3>${g.name || 'Inicio'}</h3>${g.items
          .map((it) => `<button data-go="${it.i}"><span>${String(it.i + 1).padStart(2, '0')}</span>${it.title}</button>`)
          .join('')}</div>`,
      )
      .join('')}</div>`;
  }
  buildIndex();
  const toggleIndex = (force) => {
    const open = force ?? !indexEl.classList.contains('open');
    indexEl.classList.toggle('open', open);
    indexEl.setAttribute('aria-hidden', String(!open));
  };
  indexEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) {
      go(+b.dataset.go, 0);
      toggleIndex(false);
    } else if (!e.target.closest('.index__panel')) toggleIndex(false);
  });
  root.querySelector('#btn-index').addEventListener('click', () => toggleIndex());
  root.querySelector('#btn-prev').addEventListener('click', prev);
  root.querySelector('#btn-next').addEventListener('click', next);

  /* ---------- teclado ---------- */
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape') {
      if (indexEl.classList.contains('open')) toggleIndex(false);
      return;
    }
    if (indexEl.classList.contains('open')) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(k)) {
      e.preventDefault();
      if (document.activeElement && document.activeElement.blur && document.activeElement !== document.body) {
        if (document.activeElement.tagName !== 'A') document.activeElement.blur();
      }
      next();
    } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(k)) {
      e.preventDefault();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      prev();
    } else if (k === 'Home') go(0, 0);
    else if (k === 'End') go(N - 1, 0);
    else if (k === 'f' || k === 'F') toggleFull();
    else if (k === 't' || k === 'T') toggleTheme();
    else if (k === 'o' || k === 'O') toggleIndex();
  });

  /* ---------- puntero: clic y gestos ---------- */
  let down = null;
  let swiped = false;
  root.addEventListener('pointerdown', (e) => {
    if (e.target.closest(INTERACTIVE)) {
      down = null;
      return;
    }
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    swiped = false;
  });
  root.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x;
    const dy = e.clientY - down.y;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swiped = true;
      dx < 0 ? next() : prev();
    }
    down = null;
  });
  root.addEventListener('click', (e) => {
    if (swiped) {
      swiped = false;
      return;
    }
    if (e.target.closest(INTERACTIVE)) return;
    if (window.getSelection && String(window.getSelection())) return;
    e.clientX < window.innerWidth * 0.18 ? prev() : next();
  });

  /* ---------- HUD que se oculta ---------- */
  let idleTimer;
  const wake = () => {
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.add('idle'), 2800);
  };
  window.addEventListener('pointermove', wake, { passive: true });
  window.addEventListener('pointerdown', wake, { passive: true });
  wake();

  /* ---------- arranque ---------- */
  const api = { go, next, prev, state, entries, reduced };
  const m = location.hash.match(/#\/(\d+)(?:\.(\d+))?/);
  const start = m ? clamp(+m[1] - 1, 0, N - 1) : 0;
  go(start, m && m[2] ? +m[2] : 0);
  window.addEventListener('hashchange', () => {
    const h = location.hash.match(/#\/(\d+)(?:\.(\d+))?/);
    if (h) go(+h[1] - 1, h[2] ? +h[2] : 0);
  });
  return api;
}
