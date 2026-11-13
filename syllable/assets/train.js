/* The train scene, drawn in code in the same warm flat style as the words game: thin brown lines, muted colours.
   The world scrolls past a train that stays in the middle; stations come in from the right, so travel is always left to right. */
import { pictureAt } from './pictures.js';

const NS = 'http://www.w3.org/2000/svg', INK = '#5a3d2b';
const C = { sky: '#d8ecf0', cloud: '#fffaf0', far: '#b9cfa0', farD: '#a9c190', near: '#c7d9a5', grass: '#cfdcae', ballast: '#dcc8a4', rail: '#7d8288', sleeper: '#a9784a', wood: '#d0a06e', woodD: '#b98454', terra: '#cf7a56', terraD: '#b5633f', mus: '#e0b25c', musD: '#c9984a', teal: '#6ba39b', tealD: '#578a83', blue: '#92abbf', blueD: '#7b95aa', cream: '#fffaf0', stone: '#c9c0b0', roof: '#b5633f', leaf: '#9fc378', leafD: '#86ad62', trunk: '#a9784a' };
const RAIL = 742, VIEW = 1600, GAP = 22, ENGINE = 330, STATION_EVERY = 4200;
const CAR_COLORS = { cv: [C.mus, C.musD], vc: [C.teal, C.tealD], vcv: [C.blue, C.blueD] };
const el = (name, attrs = {}, parent) => { const node = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); parent?.append(node); return node; };
const line = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const ease = p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

/* Scenery repeats every 1600 units; three copies cover any screen width. */
function scenery() {
  const rnd = seeded(7), tree = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-9" y="-70" width="18" height="70" rx="4" fill="${C.trunk}" ${line}/><circle cx="0" cy="-104" r="52" fill="${C.leaf}" ${line}/><circle cx="-34" cy="-80" r="34" fill="${C.leaf}" ${line}/><circle cx="34" cy="-80" r="34" fill="${C.leaf}" ${line}/><path d="M-30-112q16-18 40-12" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".35"/></g>`;
  const bush = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-46 0c-10-30 14-44 30-34 6-22 38-22 44 0 18-8 34 10 22 34z" fill="${C.leafD}" ${line}/></g>`;
  const house = (x, y, s, wall, roofColor) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-60" y="-96" width="120" height="96" fill="${wall}" ${line}/><path d="M-74-92 0-152l74 60z" fill="${roofColor}" ${line}/><rect x="-16" y="-48" width="32" height="48" fill="${C.woodD}" ${line}/><rect x="-46" y="-78" width="24" height="22" fill="#cfeaf2" ${line}/><rect x="22" y="-78" width="24" height="22" fill="#cfeaf2" ${line}/></g>`;
  const flower = (x, y, color) => `<g transform="translate(${x} ${y})"><path d="M0 0v-16" stroke="${C.leafD}" stroke-width="3"/>${[0, 72, 144, 216, 288].map(a => `<circle cx="${Math.cos(a * .0175) * 6}" cy="${-18 + Math.sin(a * .0175) * 6}" r="5" fill="${color}"/>`).join('')}<circle cx="0" cy="-18" r="3.5" fill="${C.mus}"/></g>`;
  let far = '', near = '', clouds = '', ground = '';
  for (let copy = -1; copy <= 1; copy++) {
    const o = copy * VIEW;
    far += `<path d="M${o - 10} 640C${o + 120} 520 ${o + 300} 500 ${o + 440} 590S${o + 760} 470 ${o + 960} 560S${o + 1300} 500 ${o + 1610} 640V700H${o - 10}Z" fill="${C.far}"/><path d="M${o - 10} 660C${o + 200} 600 ${o + 380} 610 ${o + 560} 640S${o + 1100} 590 ${o + 1610} 650V700H${o - 10}Z" fill="${C.farD}"/>`;
    clouds += [[120, 150, 1], [620, 90, .8], [1080, 170, 1.15], [1420, 80, .7]].map(([x, y, s]) => `<g transform="translate(${o + x} ${y}) scale(${s})" opacity=".95"><path d="M-70 20c-30 0-30-40 0-40 6-30 52-36 66-10 20-20 60-8 58 20 26 2 26 30 0 30z" fill="${C.cloud}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/></g>`).join('');
    const r = seeded(3);
    near += [[90, 'tree', .9], [330, 'house', .9, C.cream, C.roof], [560, 'bush', 1], [760, 'tree', 1.1], [1000, 'house', .8, '#e7c39a', C.tealD], [1180, 'bush', .9], [1390, 'tree', .85]].map(([x, kind, s, a, b]) => kind === 'tree' ? tree(o + x, 668, s) : kind === 'bush' ? bush(o + x, 676, s) : house(o + x, 668, s, a, b)).join('');
    for (let i = 0; i < 14; i++) ground += flower(o + r() * 1600, 712 + r() * 14, ['#ef9a8a', '#fffaf0', '#c9b0d8'][i % 3]);
    for (let i = 0; i < 9; i++) ground += flower(o + r() * 1600, 820 + r() * 50, ['#ef9a8a', '#fffaf0', '#c9b0d8'][i % 3]);
  }
  let sleepers = '';
  for (let x = -VIEW; x < VIEW * 2; x += 46) sleepers += `<rect x="${x}" y="${RAIL + 6}" width="28" height="12" rx="3" fill="${C.sleeper}" stroke="${INK}" stroke-width="2.5"/>`;
  return { far, near, clouds, ground, sleepers, rnd };
}

function stationArt(picture) {
  return `<g><rect x="-330" y="${RAIL - 30}" width="660" height="34" rx="6" fill="${C.stone}" ${line}/><path d="M-330 ${RAIL - 30}h660" stroke="#fff" stroke-width="6" opacity=".6"/>
  ${[-290, 290].map(x => `<rect x="${x - 9}" y="${RAIL - 300}" width="18" height="270" fill="${C.woodD}" ${line}/>`).join('')}
  <path d="M-350 ${RAIL - 300}h700l-40-62h-620z" fill="${C.terra}" ${line}/>${Array.from({ length: 11 }, (_, i) => `<path d="M${-350 + i * 63.6} ${RAIL - 300}h63.6v18c-31.8 18-63.6 18-63.6 0z" fill="${i % 2 ? C.cream : C.terra}" stroke="${INK}" stroke-width="3"/>`).join('')}
  <g transform="translate(0 ${RAIL - 420})"><rect x="-70" y="-64" width="140" height="128" rx="22" fill="${C.cream}" ${line}/>${pictureAt(picture, -54, -54, 108)}<path d="M0 64v52" stroke="${INK}" stroke-width="5"/></g>
  <rect x="210" y="${RAIL - 112}" width="90" height="70" rx="8" fill="${C.wood}" ${line}/><path d="M220 ${RAIL - 42}v30M290 ${RAIL - 42}v30" stroke="${INK}" stroke-width="5"/></g>`;
}

function wheel(x, r) { return `<g class="wheel" transform="translate(${x} ${RAIL - r})"><circle r="${r}" fill="#55585e" ${line}/><circle r="${r * .62}" fill="${C.stone}" stroke="${INK}" stroke-width="3"/><g class="spokes">${[0, 60, 120].map(a => `<path d="M${-r * .6} 0H${r * .6}" stroke="${INK}" stroke-width="3" transform="rotate(${a})"/>`).join('')}</g><circle r="${r * .16}" fill="${INK}"/></g>`; }

function engineArt(driver) {
  /* Facing right: cab at the back (left), boiler and chimney at the front (right). */
  return `<g class="engine-body"><rect x="0" y="${RAIL - 210}" width="130" height="160" rx="12" fill="${C.teal}" ${line}/><path d="M-12 ${RAIL - 216}h154l-10-26h-134z" fill="${C.tealD}" ${line}/><clipPath id="cab-window"><rect x="22" y="${RAIL - 188}" width="86" height="64" rx="10"/></clipPath><rect x="22" y="${RAIL - 188}" width="86" height="64" rx="10" fill="#cfeaf2"/>
  <g clip-path="url(#cab-window)"><g transform="translate(65 ${RAIL - 140}) scale(.72)">${driver}</g></g><rect x="22" y="${RAIL - 188}" width="86" height="64" rx="10" fill="none" ${line}/><path d="M92 ${RAIL - 180}l8 8" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/>
  <rect x="120" y="${RAIL - 150}" width="190" height="100" rx="44" fill="${C.terra}" ${line}/><path d="M150 ${RAIL - 150}v100M200 ${RAIL - 150}v100M250 ${RAIL - 150}v100" stroke="${C.terraD}" stroke-width="5"/>
  <path d="M248 ${RAIL - 150}l-8-66h52l-8 66z" fill="${INK}"/><path d="M234 ${RAIL - 226}h64l-6 16h-52z" fill="${C.mus}" ${line}/><rect x="164" y="${RAIL - 182}" width="40" height="34" rx="14" fill="${C.mus}" ${line}/>
  <circle cx="306" cy="${RAIL - 104}" r="18" fill="#fff3b0" ${line}/><path d="M300 ${RAIL - 50}l42 30h-66z" fill="${C.mus}" ${line}/><rect x="-6" y="${RAIL - 54}" width="320" height="26" rx="8" fill="${INK}"/></g>
  ${wheel(46, 34)}${wheel(124, 34)}${wheel(214, 44)}${wheel(278, 30)}<rect x="40" y="${RAIL - 40}" width="190" height="9" rx="4" fill="${C.stone}" stroke="${INK}" stroke-width="2.5"/>`;
}

/* Animals in the game's style (thin brown outline, muted colours, big shiny eyes) built from shared parts.
   One drives the engine from the cab window and others ride on the cars' roofs; they change at every station.
   Each faces the viewer and has a mouth (or beak) with class buddy-mouth that opens while its car speaks. */
const ANIMALS = [
  { id: 'cat', color: '#e8b77a', belly: '#fbe3c0', ears: 'pointed', inner: '#ef9a8a', muzzle: '#fbe3c0', stripes: '#c9984a' },
  { id: 'rabbit', color: '#f3ece0', belly: '#fffaf0', ears: 'long', inner: '#ef9a8a', muzzle: '#fffaf0' },
  { id: 'bear', color: '#b98454', belly: '#e7c39a', ears: 'round', inner: '#e7c39a', muzzle: '#e7c39a' },
  { id: 'fox', color: '#e08a4f', belly: '#fffaf0', ears: 'pointed', inner: '#fffaf0', muzzle: '#fffaf0', earTips: '#5a3d2b' },
  { id: 'panda', color: '#fffaf0', belly: '#fffaf0', ears: 'round', earColor: '#3f4650', inner: '#3f4650', patches: '#3f4650', arms: '#3f4650' },
  { id: 'pig', color: '#f2b8b0', belly: '#f8d4ce', ears: 'flop', inner: '#e79a90', snout: true },
  { id: 'mouse', color: '#bfc3c8', belly: '#e6e8ea', ears: 'big', inner: '#ef9a8a', muzzle: '#e6e8ea' },
  { id: 'owl', color: '#a9784a', belly: '#e7c39a', ears: 'tufts', discs: '#e7c39a', beak: true },
  { id: 'chick', color: '#f0c24a', belly: '#f8dd8a', ears: 'tuft', beak: true },
  { id: 'frog', color: '#9fc378', belly: '#e6efc8', ears: 'bumps', wide: true },
  { id: 'monkey', color: '#a9784a', belly: '#e7c39a', ears: 'side', inner: '#e7c39a', mask: '#e7c39a' },
  { id: 'koala', color: '#a9b1b8', belly: '#e6e8ea', ears: 'fluffy', inner: '#e6e8ea', bigNose: true },
  { id: 'lion', color: '#e0b25c', belly: '#f8dd8a', ears: 'round', inner: '#f8dd8a', mane: '#c98a4a', muzzle: '#f8dd8a' },
  { id: 'penguin', color: '#3f4650', belly: '#fffaf0', ears: 'none', mask: '#fffaf0', beak: true },
];
function animalHead(a) {
  const c = a.color, ear = a.earColor || c;
  let back = '', front = '';
  if (a.mane) back += `<circle r="40" fill="${a.mane}" ${line}/>` + Array.from({ length: 12 }, (_, i) => `<circle cx="${Math.cos(i * .5236) * 38}" cy="${Math.sin(i * .5236) * 38}" r="9" fill="${a.mane}"/>`).join('');
  if (a.ears === 'pointed') back += [-1, 1].map(k => `<path d="M${k * 27}-12 ${k * 22}-44 ${k * 4}-27Z" fill="${ear}" ${line}/><path d="M${k * 22}-18 ${k * 20}-36 ${k * 10}-26Z" fill="${a.inner}"/>${a.earTips ? `<path d="M${k * 24}-36 ${k * 22}-44 ${k * 15}-38Z" fill="${a.earTips}"/>` : ''}`).join('');
  if (a.ears === 'long') back += [-1, 1].map(k => `<ellipse cx="${k * 12}" cy="-46" rx="8" ry="22" fill="${ear}" ${line} transform="rotate(${k * 8} ${k * 12} -46)"/><ellipse cx="${k * 12}" cy="-46" rx="3.5" ry="15" fill="${a.inner}" transform="rotate(${k * 8} ${k * 12} -46)"/>`).join('');
  if (a.ears === 'round') back += [-1, 1].map(k => `<circle cx="${k * 22}" cy="-22" r="11" fill="${ear}" ${line}/><circle cx="${k * 22}" cy="-22" r="5.5" fill="${a.inner}"/>`).join('');
  if (a.ears === 'big') back += [-1, 1].map(k => `<circle cx="${k * 27}" cy="-20" r="16" fill="${ear}" ${line}/><circle cx="${k * 27}" cy="-20" r="9" fill="${a.inner}"/>`).join('');
  if (a.ears === 'fluffy') back += [-1, 1].map(k => `<circle cx="${k * 29}" cy="-14" r="16" fill="${ear}" ${line}/><circle cx="${k * 29}" cy="-14" r="8.5" fill="${a.inner}"/>`).join('');
  if (a.ears === 'side') back += [-1, 1].map(k => `<circle cx="${k * 31}" cy="0" r="11" fill="${ear}" ${line}/><circle cx="${k * 31}" cy="0" r="5.5" fill="${a.inner}"/>`).join('');
  if (a.ears === 'flop') back += [-1, 1].map(k => `<path d="M${k * 14}-26 ${k * 32}-34 ${k * 28}-10Z" fill="${ear}" ${line}/>`).join('');
  if (a.ears === 'tufts') back += [-1, 1].map(k => `<path d="M${k * 26}-14 ${k * 26}-38 ${k * 10}-26Z" fill="${ear}" ${line}/>`).join('');
  if (a.ears === 'bumps') back += [-1, 1].map(k => `<circle cx="${k * 15}" cy="-22" r="12" fill="${ear}" ${line}/>`).join('');
  if (a.ears === 'tuft') front += `<path d="M-4-29q0-12 6-8q4-9 8 1" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
  const eyeY = a.ears === 'bumps' ? -20 : -4, gap = a.ears === 'bumps' ? 15 : 11;
  let face = `<circle r="30" fill="${c}" ${line}/>`;
  if (a.stripes) face += `<path d="M-8-29l2 8M0-30v9M8-29l-2 8" stroke="${a.stripes}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (a.mask) face += `<path d="M0-6c-4-12-24-10-23 6 1 14 11 24 23 24s22-10 23-24c1-16-19-18-23-6Z" fill="${a.mask}"/>`;
  if (a.discs) face += [-1, 1].map(k => `<circle cx="${k * 12}" cy="-4" r="12" fill="${a.discs}"/>`).join('');
  if (a.patches) face += [-1, 1].map(k => `<ellipse cx="${k * 11}" cy="-3" rx="8" ry="10" fill="${a.patches}" transform="rotate(${k * -25} ${k * 11} -3)"/>`).join('');
  if (a.muzzle) face += `<ellipse cx="0" cy="11" rx="14" ry="10" fill="${a.muzzle}"/>`;
  face += [-1, 1].map(k => `<circle cx="${k * gap}" cy="${eyeY}" r="8" fill="#fff" ${line}/><circle cx="${k * gap + 1.5}" cy="${eyeY + 1}" r="4.2" fill="${INK}"/><circle cx="${k * gap + 3}" cy="${eyeY - 1}" r="1.6" fill="#fff"/>`).join('');
  face += `<circle cx="-19" cy="${eyeY + 15}" r="5" fill="#e0786a" opacity=".45"/><circle cx="19" cy="${eyeY + 15}" r="5" fill="#e0786a" opacity=".45"/>`;
  if (a.beak) face += `<path class="buddy-mouth" d="M-7 7h14l-7 10Z" fill="${C.mus}" ${line}/>`;
  else if (a.snout) face += `<ellipse cx="0" cy="9" rx="10" ry="7" fill="${a.inner}" ${line}/><circle cx="-3.5" cy="9" r="1.8" fill="${INK}"/><circle cx="3.5" cy="9" r="1.8" fill="${INK}"/><ellipse class="buddy-mouth" cx="0" cy="20" rx="4.5" ry="3" fill="${C.terraD}" stroke="${INK}" stroke-width="2.5"/>`;
  else {
    face += a.bigNose ? `<ellipse cx="0" cy="6" rx="6" ry="8" fill="${INK}"/>` : `<ellipse cx="0" cy="6" rx="4" ry="3" fill="${INK}"/>`;
    face += a.wide ? `<ellipse class="buddy-mouth" cx="0" cy="8" rx="12" ry="3.5" fill="${C.terraD}" stroke="${INK}" stroke-width="2.5"/>` : `<ellipse class="buddy-mouth" cx="0" cy="16" rx="5" ry="4" fill="${C.terraD}" stroke="${INK}" stroke-width="2.5"/>`;
  }
  return back + face + front;
}
/* A rider sitting on a roof: body and paws, head on top. 0,0 is where it sits. */
function animalArt(a) {
  const arms = a.arms || a.color;
  return `<circle r="64" cy="-60" fill="transparent" stroke="none"/><g class="buddy-bob">
  <path d="M-34-4C-38-36-24-50 0-50S38-36 34-4Q0 6-34-4Z" fill="${a.color}" ${line}/><ellipse cx="0" cy="-22" rx="17" ry="14" fill="${a.belly}"/>
  <ellipse cx="-15" cy="-8" rx="10" ry="7" fill="${arms}" ${line}/><ellipse cx="15" cy="-8" rx="10" ry="7" fill="${arms}" ${line}/>
  <g transform="translate(0 -78)">${animalHead(a)}</g></g>`;
}
/* The driver: the same head in an engineer's cap, seen through the cab window. */
function driverArt(a) {
  return `<g class="driver"><path d="M-30 20C-34 6-20-2 0-2s34 8 30 22Z" fill="#6f8fb0" ${line}/><g transform="translate(0 -30)">${animalHead(a)}
  <path d="M-27-14c-2-20 10-30 27-30s29 10 27 30Z" fill="#6f8fb0" ${line}/><path d="M-18-38v24M-6-43v29M6-43v29M18-38v24" stroke="#fffaf0" stroke-width="3" opacity=".8"/>
  <path d="M-30-14h60c2 6-2 9-8 9h-44c-6 0-10-3-8-9Z" fill="#4f6f90" ${line}/></g></g>`;
}
const shuffled = list => { const out = [...list]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; };

function carArt(items, type) {
  const n = items[0].parts.length, width = n * 106 + (n + 1) * 14 + 8, [body, dark] = CAR_COLORS[type];
  let s = `<g class="car-body"><rect x="0" y="${RAIL - 214}" width="${width}" height="164" rx="16" fill="${body}" ${line}/><path d="M-10 ${RAIL - 218}h${width + 20}l-14-24h-${width - 8}z" fill="${dark}" ${line}/><rect x="0" y="${RAIL - 74}" width="${width}" height="24" fill="${dark}" opacity=".55"/>`;
  return { width, s, n };
}

export class Train {
  constructor(host, hooks) {
    this.hooks = hooks; this.zoo = shuffled(ANIMALS); this.alive = true; this.d = 0; this.speed = 0; this.cars = []; this.puffs = []; this.calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.svg = el('svg', { viewBox: '0 0 1600 900', preserveAspectRatio: 'xMidYMid meet', class: 'train-scene', role: 'img', 'aria-label': 'قطار المقاطع' });
    host.replaceChildren(this.svg);
    const art = scenery();
    el('rect', { x: -3000, y: -3000, width: 7600, height: 3700, fill: C.sky }, this.svg);
    this.clouds = el('g', {}, this.svg); this.clouds.innerHTML = art.clouds;
    this.far = el('g', {}, this.svg); this.far.innerHTML = art.far;
    el('rect', { x: -3000, y: 690, width: 7600, height: 3000, fill: C.grass }, this.svg);
    this.near = el('g', {}, this.svg); this.near.innerHTML = art.near;
    el('rect', { x: -3000, y: RAIL - 4, width: 7600, height: 40, fill: C.ballast }, this.svg);
    this.ground = el('g', {}, this.svg); this.ground.innerHTML = art.ground;
    this.station = el('g', {}, this.svg);
    this.track = el('g', {}, this.svg); this.track.innerHTML = art.sleepers;
    el('rect', { x: -3000, y: RAIL - 2, width: 7600, height: 8, fill: C.rail, stroke: INK, 'stroke-width': 2 }, this.svg);
    this.trainGroup = el('g', { class: 'train' }, this.svg);
    this.fx = el('g', {}, this.svg);
    this.last = performance.now();
    this.frame = this.frame.bind(this);
    requestAnimationFrame(this.frame);
  }

  /* Builds a train for one station: the engine at the front (right) and one car per syllable behind it, read from the engine back,
     right to left like Arabic. this.cars keeps that order, so the whole train plays right to left. */
  build(station, index = 0) {
    this.trainGroup.replaceChildren(); this.cars = [];
    /* A new driver and new riders at every station, never the same animals as the station before. */
    const zoo = this.zoo, pick = k => zoo[(index * 4 + k) % zoo.length];
    const parts = station.items.map(item => carArt(station.items, station.type)), widths = parts.map(p => p.width);
    const total = widths.reduce((a, b) => a + b, 0) + GAP * station.items.length + ENGINE;
    this.trainWidth = total;
    let x = total - ENGINE;
    const engine = el('g', { class: 'engine', transform: `translate(${x} 0)`, tabindex: 0, role: 'button', 'aria-label': 'شغّل كل المقاطع' }, this.trainGroup);
    engine.innerHTML = engineArt(driverArt(pick(0)));
    this.engine = engine; this.chimney = x + 266;
    station.items.forEach((item, i) => {
      const { width, s, n } = parts[i];
      x -= GAP + width;
      el('rect', { x: x + width, y: RAIL - 82, width: GAP, height: 12, fill: INK }, this.trainGroup);
      const car = el('g', { class: 'car', transform: `translate(${x} 0)`, tabindex: 0, role: 'button', 'aria-label': item.word, 'data-item': item.id }, this.trainGroup);
      const lift = el('g', { class: 'car-lift' }, car);
      lift.innerHTML = s + item.parts.map((part, i) => { const k = n - 1 - i; return `<rect x="${18 + k * 120}" y="${RAIL - 200}" width="106" height="106" rx="14" fill="${C.cream}" ${line}/><g class="passenger" style="transform-origin:${71 + k * 120}px ${RAIL - 147}px">${pictureAt(part, 24 + k * 120, RAIL - 194, 94)}</g>`; }).join('') + `</g>` + wheel(40, 26) + wheel(width - 40, 26);
      this.cars.push({ node: car, lift, item, x, width });
    });
    /* The riders sit on top of the cars, apart from them, so tapping one never plays the car's sound. */
    this.cars.forEach((car, i) => {
      const video = !!this.hooks.hasVideo?.(car.item.id);
      car.buddy = el('g', { class: 'buddy', transform: `translate(${car.x + car.width / 2} ${RAIL - 238}) scale(.85)`, tabindex: 0, role: 'button', 'aria-label': video ? `كيف أنطق ${car.item.word}` : car.item.word, 'data-video': String(video) }, this.trainGroup);
      car.buddy.innerHTML = animalArt(pick(i + 1));
      car.buddy.style.setProperty('--delay', `${i * -.8}s`);
    });
  }

  /* Places the station so the train stops centred at it, then scrolls the world there. */
  arrive(index, picture) {
    this.stationAt = index * STATION_EVERY;
    this.station.innerHTML = stationArt(picture);
    const to = this.stationAt, from = Math.abs(to - this.d) > STATION_EVERY * .6 || to === this.d ? to - STATION_EVERY * .55 : this.d;
    return this.ride(from, to, this.calm ? 1 : 3400, 'out');
  }

  leave() { return this.ride(this.d, this.d + STATION_EVERY * .45, this.calm ? 1 : 2200, 'in'); }

  ride(from, to, length, kind) {
    this.d = from;
    return new Promise(resolve => {
      const start = performance.now();
      this.motion = { from, to, length, start, kind, resolve };
      this.hooks.sfx('chug');
    });
  }

  destroy() { this.alive = false; }

  frame(now) {
    if (!this.alive) return;
    const dt = Math.min(.05, (now - this.last) / 1000); this.last = now;
    if (this.motion) {
      const { from, to, length, start, kind, resolve } = this.motion, p = Math.min(1, (now - start) / length);
      const e = kind === 'out' ? 1 - Math.pow(1 - p, 3) : kind === 'in' ? p * p * p : ease(p), before = this.d;
      this.d = from + (to - from) * e; this.speed = (this.d - before) / Math.max(dt, .001);
      if (p >= 1) { this.motion = null; this.speed = 0; resolve(); }
    }
    const d = this.d, wrap = k => -(((d * k) % VIEW) + VIEW) % VIEW;
    this.clouds.setAttribute('transform', `translate(${wrap(.08) - now * .004 % VIEW} 0)`);
    this.far.setAttribute('transform', `translate(${wrap(.25)} 0)`);
    this.near.setAttribute('transform', `translate(${wrap(.6)} 0)`);
    this.ground.setAttribute('transform', `translate(${wrap(1)} 0)`);
    this.track.setAttribute('transform', `translate(${-((d % 46) + 46) % 46} 0)`);
    this.station.setAttribute('transform', `translate(${800 + (this.stationAt ?? 1e6) - d} 0)`);
    const moving = Math.abs(this.speed) > 5, bob = moving && !this.calm ? Math.sin(now * .03) * 2 : 0;
    this.trainGroup.setAttribute('transform', `translate(${800 - (this.trainWidth || 0) / 2} ${bob})`);
    this.trainGroup.querySelectorAll('.wheel .spokes').forEach(node => node.setAttribute('transform', `rotate(${(d * 1.6) % 360})`));
    if (moving && !this.calm && Math.random() < dt * 9) this.puff();
    this.puffs = this.puffs.filter(puff => { puff.age += dt; const k = puff.age / 1.6; if (k >= 1) { puff.node.remove(); return false; } puff.node.setAttribute('transform', `translate(${puff.x - k * 120} ${puff.y - k * 150}) scale(${.5 + k})`); puff.node.setAttribute('opacity', String(.9 * (1 - k))); return true; });
    requestAnimationFrame(this.frame);
  }

  puff(big) {
    const x = 800 - (this.trainWidth || 0) / 2 + this.chimney, y = RAIL - 236;
    const node = el('circle', { r: big ? 30 : 22, fill: '#fffaf0', stroke: INK, 'stroke-width': 3 }, this.fx);
    this.puffs.push({ node, x, y, age: 0 });
  }

  steam() { for (let i = 0; i < 4; i++) setTimeout(() => this.puff(true), i * 160); }

  /* The driver waves hello as the train pulls in. */
  wave() { if (this.calm) return; this.engine?.querySelector('.driver')?.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-8deg)' }, { transform: 'rotate(8deg)' }, { transform: 'rotate(0)' }], { duration: 700, iterations: 2, easing: 'ease-in-out' }); }

  /* A rider hops when tapped. */
  hop(car) { if (this.calm || !car.buddy) return; car.buddy.querySelector('.buddy-bob').animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-26px)' }, { transform: 'translateY(0)' }], { duration: 420, easing: 'ease-out' }); }

  /* A car bounces and its passengers pop while its syllable plays. */
  light(car, on) {
    car.node.classList.toggle('playing', on); car.buddy?.classList.toggle('talking', on);
    if (on && !this.calm) car.lift.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'translateY(0)' }], { duration: 360, easing: 'ease-out' });
  }

  board() { if (this.calm) return; this.cars.forEach((car, i) => car.node.querySelectorAll('.passenger').forEach(img => img.animate([{ transform: 'scale(.1)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1, offset: .7 }, { transform: 'scale(1)', opacity: 1 }], { duration: 420, delay: i * 120, easing: 'ease-out', fill: 'backwards' }))); }
}
