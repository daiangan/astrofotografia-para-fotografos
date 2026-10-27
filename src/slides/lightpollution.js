import { asset } from '../lib/dom.js';

export default {
  id: 'lightpollution',
  title: 'Contaminación lumínica',
  tone: 'dark',
  steps: 2,
  bg: () => `<div class="lp__photo" style="background-image:url(${asset('img/earth-night.jpg')})"></div><div class="lp__shade"></div>`,
  html: () => `
    <div class="lp">
      <p class="eyebrow rise">Condiciones del cielo · contaminación lumínica</p>
      <h2 class="title title--lg rise">La Tierra <em>de noche</em></h2>
      <div class="lp__stats">
        <div class="lp__s" data-only="1"><b>80 %</b><span>de las personas vive bajo un cielo contaminado</span></div>
        <div class="lp__s" data-only="2"><b>1 de 3</b><span>ya no puede ver la Vía Láctea</span></div>
      </div>
    </div>`,
};
