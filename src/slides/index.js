import cover from './cover.js';
import spectrum from './spectrum.js';
import scopes from './scopes.js';
import lensvs from './lensvs.js';
import quality from './quality.js';
import astromod from './astromod.js';
import cooled from './cooled.js';
import pixels from './pixels.js';
import gain from './gain.js';
import filtersLp from './filters-lp.js';
import filtersMono from './filters-mono.js';
import skymotion from './skymotion.js';
import mounts from './mounts.js';
import tracker from './tracker.js';
import guiding from './guiding.js';
import focusOag from './focus-oag.js';
import acquisition from './acquisition.js';
import types from './types.js';
import stacking from './stacking.js';
import stretch from './stretch.js';
import platesolve from './platesolve.js';
import finishing from './finishing.js';
import software from './software.js';
import sky from './sky.js';
import seasons from './seasons.js';
import weather from './weather.js';
import bortle from './bortle.js';
import airmass from './airmass.js';
import lightpollution from './lightpollution.js';
import lamps from './lamps.js';
import { smartProblem, smartHow, smartPros } from './smart.js';
import start from './start.js';
import recap from './recap.js';
import contact from './contact.js';

const sections = [];
function group(name, list) {
  const index = name ? sections.push(name) : 0;
  return list.map((s) => ({ ...s, section: name, sectionIndex: index }));
}

export const slides = [
  ...group(null, [cover]),
  ...group('La luz', [spectrum]),
  ...group('Óptica', [scopes, lensvs, quality]),
  ...group('La cámara', [astromod, cooled, pixels, gain]),
  ...group('Filtros', [filtersLp, filtersMono]),
  ...group('Montura y guiado', [skymotion, mounts, tracker, guiding]),
  ...group('Accesorios', [focusOag, acquisition]),
  ...group('Qué fotografiar', [types]),
  ...group('Procesado', [stacking, stretch, platesolve, finishing, software]),
  ...group('Planificar', [sky, seasons, weather]),
  ...group('El cielo', [bortle, airmass, lightpollution, lamps]),
  ...group('Telescopios inteligentes', [smartProblem, smartHow, smartPros]),
  ...group('Empezar', [start]),
  ...group('Cierre', [recap, contact]),
];
