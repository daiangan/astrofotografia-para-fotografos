import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import './styles/base.css';
import './styles/slides.css';
import { createDeck } from './deck.js';
import { startBackground } from './lib/bgstars.js';
import { asset } from './lib/dom.js';
import { slides } from './slides/index.js';

const DEFAULTS = {
  title: 'Astrofotografía para fotógrafos',
  author: { name: '', instagram: '', website: '', tagline: '' },
  repository: '',
  sky: { latitude: 20, label: '20° N' },
};

async function loadConfig() {
  try {
    const res = await fetch(asset('config.json'), { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.statusText);
    const user = await res.json();
    return { ...DEFAULTS, ...user, author: { ...DEFAULTS.author, ...user.author }, sky: { ...DEFAULTS.sky, ...user.sky } };
  } catch (e) {
    return DEFAULTS;
  }
}

loadConfig().then((cfg) => {
  startBackground(document.getElementById('bg-stars'));
  createDeck({ root: document.getElementById('app'), slides, cfg });
});
