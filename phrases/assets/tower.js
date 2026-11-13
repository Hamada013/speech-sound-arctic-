/* The stacking game of the phrases and sentences parts, drawn in code in the warm flat style: thin brown lines, muted colours.
   Five scenes, a different one each play: a brick tower, a castle, an ice cream, a cake and a rocket. In each, a piece hangs
   from a crane; once its picture has been seen it swings slowly, and a tap drops it on the stack. An off-centre piece wobbles
   and sticks at the edge, so the stack never falls. A piece graded wrong tumbles off instead, and the phrase comes back.
   When the stack is done its last piece lands, and the child taps the scene's ending: the wrecking ball, fireworks, a big lick,
   blowing out the candles, or the launch. The view widens or narrows with the screen, so it works held either way. */
const NS = 'http://www.w3.org/2000/svg', INK = '#5a3d2b', BW = 250, BH = 96, TOP = 64;
const el = (name, attrs = {}, parent) => { const node = document.createElementNS(NS, name); for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v); parent?.append(node); return node; };
const line = (w = 4) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const CREAM = '#fffaf0';
/* The phrase's picture in a window on the piece, or a question mark until it has been seen. */
function win(picture, y = 10, h = BH - 20, w = 124, rx = 10) {
  return picture ? `<rect x="${-w / 2}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${CREAM}" ${line(3)}/><image href="${picture}" x="${-w / 2 + 4}" y="${y + 3}" width="${w - 8}" height="${h - 6}" preserveAspectRatio="xMidYMid meet"/>`
    : `<rect x="${-w / 2}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${CREAM}" ${line(3)} opacity=".9"/><path d="M-12 ${y + h / 2 - 12}a12 12 0 1 1 12 12v8M0 ${y + h / 2 + 16}h.01" fill="none" ${line(6)} opacity=".45"/>`;
}
/* Hills and ground reach far past the screen's edges, so they still fill it when the view zooms out at the end. */
const hills = (W, G, far) => `<path d="M${-3 * W} ${G - 40}H-200C${W * .2} ${G - 150} ${W * .4} ${G - 120} ${W * .55} ${G - 60}S${W * .85} ${G - 160} ${W + 200} ${G - 50}H${4 * W}V${G + 400}H${-3 * W}Z" fill="${far}"/>`;
const tree = (x, G, s) => `<g transform="translate(${x} ${G}) scale(${s})"><rect x="-9" y="-70" width="18" height="70" rx="4" fill="#a9784a" ${line(3)}/><circle cy="-104" r="48" fill="#9fc378" ${line(3)}/><circle cx="-30" cy="-80" r="30" fill="#9fc378" ${line(3)}/><circle cx="30" cy="-80" r="30" fill="#9fc378" ${line(3)}/></g>`;

/* ---------- The five scenes ---------- */
const SCENES = {
  /* Coloured building bricks; a roof with a flag; the wrecking ball knocks it all down. */
  tower: {
    name: 'برج المكعّبات', sky: '#d8ecf0', grass: '#cfdcae', girder: ['#e0b25c', '#c9984a'], baseH: 34, ending: 'wreck',
    scenery: (W, G) => hills(W, G, '#b9cfa0') + [.12, .88, .25, .7].map((k, i) => tree(W * k, G, i > 1 ? .7 : 1)).join(''),
    base: (cx, G) => `<rect x="${cx - BW / 2 - 40}" y="${G - 34}" width="${BW + 80}" height="34" rx="8" fill="#c9c0b0" ${line()}/><path d="M${cx - BW / 2 - 20} ${G - 24}h${BW + 40}" stroke="#fff" stroke-width="5" opacity=".4"/>`,
    block(i, picture) {
      const [body, dark] = [['#cf7a56', '#b5633f'], ['#e0b25c', '#c9984a'], ['#6ba39b', '#578a83'], ['#92abbf', '#7b95aa'], ['#a98aa8', '#8f7290'], ['#9fc378', '#86ad62']][i % 6];
      const studs = [0, 1, 2, 3].map(k => { const x = -BW / 2 + 22 + k * ((BW - 78) / 3); return `<rect x="${x}" y="-14" width="34" height="16" rx="6" fill="${body}" ${line(3.5)}/>`; }).join('');
      return `${studs}<rect x="${-BW / 2}" y="0" width="${BW}" height="${BH}" rx="10" fill="${body}" ${line()}/><rect x="${-BW / 2}" y="${BH - 16}" width="${BW}" height="16" rx="6" fill="${dark}" opacity=".7"/><path d="M${-BW / 2 + 12} 10h40" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".35"/>${win(picture)}`;
    },
    top: () => `<path d="M${-BW / 2 - 24} 0 0 -120 ${BW / 2 + 24} 0Z" fill="#cf7a56" ${line()}/><path d="M0 -120v-90" ${line(5)}/><path d="M0 -210l70 20-70 22Z" fill="#9fc378" ${line(3.5)}/><circle cx="0" cy="-60" r="18" fill="${CREAM}" ${line(3)}/>`,
  },
  /* Stone blocks; battlements, a turret and a flag; fireworks over the castle. */
  castle: {
    name: 'القلعة', sky: '#dcebf2', grass: '#c9d8a8', girder: ['#a9784a', '#8a5f38'], baseH: 34, ending: 'fireworks',
    scenery: (W, G) => hills(W, G, '#b4c79a') + [.14, .86].map(k => `<g transform="translate(${W * k} ${G - 40})"><path d="M-40 40V-30h80v70" fill="#d6cdbb" ${line(3)}/><path d="M-50 -30 0 -80 50 -30Z" fill="#cf7a56" ${line(3)}/><path d="M0 -80v-30" ${line(3)}/><path d="M0 -110l30 8-30 8Z" fill="#e0b25c" ${line(2.5)}/></g>`).join(''),
    base: (cx, G) => `<path d="M${cx - BW / 2 - 60} ${G}L${cx - BW / 2 - 30} ${G - 34}H${cx + BW / 2 + 30}L${cx + BW / 2 + 60} ${G}Z" fill="#b3a994" ${line()}/><path d="M${cx - 80} ${G - 20}h30M${cx + 40} ${G - 14}h40" ${line(3)} opacity=".4"/>`,
    block(i, picture) {
      const tone = ['#cfc6b4', '#c4baa6', '#d6cdbb'][i % 3];
      return `<rect x="${-BW / 2}" y="0" width="${BW}" height="${BH}" rx="6" fill="${tone}" ${line()}/><path d="M${-BW / 2} ${BH / 2}H${BW / 2}M-95 0V${BH / 2}M95 0V${BH / 2}M${-BW / 2 + 30} ${BH / 2}V${BH}M${BW / 2 - 30} ${BH / 2}V${BH}" stroke="#a39a88" stroke-width="3"/>${win(picture, 8, BH - 16, 128, 30)}`;
    },
    top: () => `${[-1, 0, 1].map(k => `<rect x="${k * 90 - 26}" y="-34" width="52" height="34" fill="#d6cdbb" ${line()}/>`).join('')}<path d="M-70 -34 0 -170 70 -34Z" fill="#6f8fb0" ${line()}/><path d="M0 -170v-60" ${line(5)}/><path d="M0 -230l66 18-66 20Z" fill="#cf7a56" ${line(3.5)}/>`,
  },
  /* Scoops on a cone; cream and a cherry; a big friendly face licks them away. */
  icecream: {
    name: 'البوظة', sky: '#f4e4ea', grass: '#d9ecd9', girder: ['#f2a7b8', '#e98aa0'], baseH: 200, ending: 'lick',
    scenery: (W, G) => hills(W, G, '#efcfd9') + [.12, .88, .26, .72].map((k, i) => `<g transform="translate(${W * k} ${G}) scale(${i > 1 ? .7 : 1})"><path d="M0 0V-110" ${line(6)}/><circle cy="-140" r="38" fill="${['#f2a7b8', '#9fc378', '#c9b0d8', '#f3c27a'][i]}" ${line(3)}/><path d="M-20 -140a20 20 0 1 0 20-20 12 12 0 1 0 12 12" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/></g>`).join(''),
    base: (cx, G) => `<path d="M${cx - 112} ${G - 200}L${cx} ${G - 4}L${cx + 112} ${G - 200}Z" fill="#e0b25c" ${line()}/><path d="M${cx - 80} ${G - 200}l100 170M${cx - 30} ${G - 200}l70 120M${cx + 30} ${G - 200}l-60 110M${cx + 80} ${G - 200}l-100 170" stroke="#c9984a" stroke-width="3"/><path d="M${cx - 116} ${G - 200}h232" ${line(5)}/>`,
    block(i, picture) {
      const tone = ['#f2a7b8', '#b7e0c2', '#f6e7c1', '#b98454', '#c9b0d8', '#f3c27a'][i % 6];
      return `<path d="M-125 70C-125 12-80-6 0-6S125 12 125 70Q110 92 95 78Q80 102 60 82Q40 98 20 84Q0 102-20 84Q-40 98-60 82Q-80 102-95 78Q-110 92-125 70Z" fill="${tone}" ${line()}/>${[[-90, 30, 20], [84, 26, -30], [-70, 60, 60], [76, 62, 10]].map(([x, y, r], k) => `<rect x="${x}" y="${y}" width="14" height="5" rx="2.5" fill="${['#fff', '#6ba39b', '#cf7a56', '#92abbf'][(i + k) % 4]}" transform="rotate(${r} ${x} ${y})"/>`).join('')}${win(picture, 10, 66, 116, 26)}`;
    },
    top: () => `<path d="M-74 0C-80-40-40-44-30-40-40-74 0-80 0-80S40-74 30-40C40-44 80-40 74 0Z" fill="${CREAM}" ${line()}/><path d="M0 -80c-4-20 10-30 20-36" ${line(4)}/><circle cx="0" cy="-96" r="22" fill="#d9655a" ${line(3.5)}/><circle cx="-7" cy="-103" r="5" fill="#fff" opacity=".7"/>`,
  },
  /* Cake layers on a stand; three lit candles; a cloud blows them out. */
  cake: {
    name: 'الكعكة', sky: '#f8eee0', grass: '#d9b48a', girder: ['#c9b0d8', '#a98aa8'], baseH: 40, ending: 'blow',
    scenery: (W, G) => `<rect x="${-3 * W}" y="${G - 260}" width="${7 * W}" height="260" fill="#f2e2cc"/>${Array.from({ length: Math.ceil(7 * W / 160) }, (_, k) => `<path d="M${k * 160 - 3 * W} ${G - 210}q16 40 32 0" fill="none" stroke="#e7c39a" stroke-width="6" opacity=".7"/>`).join('')}`,
    base: (cx, G) => `<path d="M${cx - 40} ${G}l14-28h52l14 28Z" fill="#e6eef3" ${line()}/><rect x="${cx - BW / 2 - 30}" y="${G - 40}" width="${BW + 60}" height="14" rx="7" fill="#e6eef3" ${line()}/>`,
    block(i, picture) {
      const tone = ['#f3d9a4', '#c98a5a', '#f2b8c6'][i % 3];
      return `<rect x="${-BW / 2}" y="0" width="${BW}" height="${BH}" rx="14" fill="${tone}" ${line()}/><path d="M${-BW / 2 + 2} 6Q-110 34-95 14Q-80 34-65 14Q-50 34-35 14Q-20 34-5 14Q10 34 25 14Q40 34 55 14Q70 34 85 14Q100 34 ${BW / 2 - 2} 6Z" fill="${CREAM}" ${line(3)}/><path d="M${-BW / 2} ${BH - 18}H${BW / 2}" stroke="${CREAM}" stroke-width="6" opacity=".6"/>${win(picture, 22, BH - 30, 112, 14)}`;
    },
    top: () => [-60, 0, 60].map((x, k) => `<rect x="${x - 9}" y="-70" width="18" height="70" rx="4" fill="${['#92abbf', '#f2a7b8', '#9fc378'][k]}" ${line(3)}/><path d="M${x - 9} -50l18-10M${x - 9} -30l18-10" stroke="#fff" stroke-width="4" opacity=".7"/><g class="flame"><path d="M${x} -110c-14 16-12 30 0 34 12-4 14-18 0-34Z" fill="#f3c27a" ${line(3)}/><path d="M${x} -96c-5 7-4 13 0 15 4-2 5-8 0-15Z" fill="#cf7a56"/></g>`).join(''),
  },
  /* Rocket sections over an engine with fins; a nose cone; the launch. */
  rocket: {
    name: 'الصاروخ', sky: '#cbd6ee', grass: '#b9c1cc', girder: ['#9aa6b2', '#7d8891'], baseH: 130, ending: 'launch',
    scenery: (W, G) => hills(W, G, '#a9b6d6') + Array.from({ length: 16 }, (_, k) => `<circle cx="${(k * 97) % W}" cy="${G - 300 - (k * 53) % 400}" r="${2 + k % 3}" fill="#fffaf0"/>`).join('') + `<circle cx="${W * .82}" cy="${G - 520}" r="40" fill="#f6e7b0" ${line(3)}/>`,
    base: (cx, G) => `<rect x="${cx - BW / 2 - 60}" y="${G - 40}" width="${BW + 120}" height="40" rx="6" fill="#9aa6b2" ${line()}/><path d="M${cx - BW / 2 - 40} ${G - 20}h40M${cx + BW / 2} ${G - 20}h40" stroke="#e0b25c" stroke-width="8"/><g fill="none" stroke="#7d8891" stroke-width="5"><path d="M${cx - BW / 2 - 110} ${G - 40}V${G - 560}M${cx - BW / 2 - 70} ${G - 40}V${G - 560}"/>${Array.from({ length: 9 }, (_, k) => `<path d="M${cx - BW / 2 - 110} ${G - 40 - k * 60}l40 -60"/>`).join('')}</g>`,
    /* The engine and fins go up with the rocket, so they are part of the stack. */
    under: () => `<path d="M-60 90l-16 26h152l-16-26Z" fill="#7d8891" ${line()}/><path d="M-105 0h210l-8 90h-194Z" fill="#f3f0e8" ${line()}/><path d="M-105 20l-50 70h50ZM105 20l50 70h-50Z" fill="#cf7a56" ${line()}/><path d="M-100 40h200" stroke="#92abbf" stroke-width="10"/>`,
    block(i, picture) {
      const band = ['#cf7a56', '#6f8fb0'][i % 2];
      return `<rect x="-105" y="0" width="210" height="${BH}" rx="6" fill="#f3f0e8" ${line()}/><path d="M-105 8h210M-105 ${BH - 8}h210" stroke="${band}" stroke-width="10"/>${[-88, 88].map(x => `<circle cx="${x}" cy="${BH / 2}" r="4" fill="#9aa6b2"/>`).join('')}${win(picture, 16, BH - 32, 120, 32)}`;
    },
    top: () => `<path d="M-105 0Q-92-110 0-180 92-110 105 0Z" fill="#cf7a56" ${line()}/><circle cx="0" cy="-70" r="20" fill="#cfeaf2" ${line(3)}/>`,
  },
};
export const SCENARIOS = Object.keys(SCENES);
export const sceneName = id => SCENES[id]?.name;

export class Tower {
  constructor(host, hooks, scenario = 'tower') {
    this.host = host; this.hooks = hooks; this.scene = SCENES[scenario] || SCENES.tower; this.scenario = scenario;
    this.calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.placed = []; this.state = 'idle'; this.cam = 0; this.camTo = 0; this.z = 1; this.zTo = 1; this.t0 = performance.now(); this.alive = true;
    this.svg = el('svg', { class: 'tower-scene', role: 'img', 'aria-label': this.scene.name });
    host.replaceChildren(this.svg);
    this.back = el('g', {}, this.svg); this.world = el('g', {}, this.svg); this.front = el('g', {}, this.svg);
    this.ground = el('g', {}, this.world); this.stack = el('g', {}, this.world); this.fx = el('g', {}, this.world);
    this.crane = el('g', {}, this.front); this.rope = el('path', { fill: 'none', stroke: INK, 'stroke-width': 4 }, this.front); this.hanging = el('g', { class: 'hanging' }, this.front); this.top = el('g', {}, this.front);
    this.layout();
    this.resize = () => this.layout(); addEventListener('resize', this.resize);
    this.frame = this.frame.bind(this); requestAnimationFrame(this.frame);
  }
  /* The view is 760 to 1200 units wide, so pieces stay big on wide screens; its height follows the screen's shape. */
  layout() {
    const box = this.host.getBoundingClientRect(), aspect = Math.max(.3, (box.width || 1600) / (box.height || 900)), S = this.scene;
    this.W = Math.max(760, Math.min(1200, 900 * aspect)); this.H = this.W / aspect; this.cx = this.W / 2; this.G = this.H - 110;
    this.svg.setAttribute('viewBox', `0 0 ${this.W} ${this.H}`);
    const W = this.W, H = this.H, G = this.G;
    const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-70 20c-30 0-30-40 0-40 6-30 52-36 66-10 20-20 60-8 58 20 26 2 26 30 0 30z" fill="${CREAM}" ${line(3)}/></g>`;
    this.back.innerHTML = `<rect x="-200" y="-4000" width="${W + 400}" height="${H + 8000}" fill="${S.sky}"/><g class="clouds">${[[.15, .18, 1], [.8, .12, .8], [.55, .3, 1.1], [.3, -.35, .9], [.75, -.6, 1], [.2, -1.1, .8], [.6, -1.5, 1]].map(([x, y, s]) => cloud(W * x, H * y, s)).join('')}</g>`;
    this.ground.innerHTML = `${S.scenery(W, G)}<rect x="${-3 * W}" y="${G}" width="${7 * W}" height="${3 * H}" fill="${S.grass}"/><path d="M${-3 * W} ${G}H${4 * W}" ${line(3)}/>${S.base(this.cx, G)}`;
    const [steel, steelD] = S.girder;
    this.crane.innerHTML = `<rect x="-20" y="${TOP - 26}" width="${W + 40}" height="28" fill="${steel}" ${line()}/>${Array.from({ length: Math.ceil(W / 60) + 1 }, (_, i) => `<path d="M${i * 60 - 20} ${TOP - 24}l30 24 30-24" fill="none" stroke="${steelD}" stroke-width="4"/>`).join('')}
      <rect x="${this.cx - 44}" y="${TOP - 6}" width="88" height="30" rx="8" fill="#cf7a56" ${line()}/><circle cx="${this.cx - 22}" cy="${TOP - 8}" r="8" fill="#55585e" ${line(3)}/><circle cx="${this.cx + 22}" cy="${TOP - 8}" r="8" fill="#55585e" ${line(3)}/>`;
    this.restack();
  }
  topY() { return this.G - this.scene.baseH - this.placed.length * BH; }
  topX() { return this.placed.at(-1)?.x ?? this.cx; }
  /* Short (landscape phone) screens keep the top lower, so the rope stays long enough to swing. */
  frac() { return this.H < 700 ? .76 : .66; }
  aim() { this.camTo = Math.max(0, this.H * this.frac() - this.topY()); }
  piece(i, brick) { const g = el('g', { transform: `translate(${brick.x} ${this.G - this.scene.baseH - (i + 1) * BH})` }); g.innerHTML = `<g class="piece">${this.scene.block(i, brick.picture)}</g>`; return g; }
  restack() {
    const under = [];
    if (this.scene.under) { const g = el('g', { transform: `translate(${this.cx} ${this.G - this.scene.baseH})` }); g.innerHTML = `<g class="piece">${this.scene.under()}</g>`; under.push(g); }
    this.stack.replaceChildren(...under, ...this.placed.map((brick, i) => this.piece(i, brick)));
    this.aim(); this.cam = this.camTo;
  }
  /* Pieces already on the stack, when a game is resumed. */
  setPlaced(list) { this.placed = list.map(entry => ({ x: this.cx + (entry.dx || 0), picture: entry.picture })); this.restack(); }
  hang(index) {
    this.index = index; this.picture = null; this.state = 'waiting'; this.swingStart = 0; this.bx = this.cx; this.angle = 0;
    this.hanging.innerHTML = `<g class="brick-body">${this.scene.block(index, null)}</g>`;
    if (!this.calm) this.hanging.querySelector('.brick-body').animate([{ transform: 'translateY(-260px)' }, { transform: 'translateY(0)' }], { duration: 600, easing: 'cubic-bezier(.2,1.3,.5,1)' });
  }
  showPicture(uri) { this.picture = uri; this.hanging.innerHTML = `<g class="brick-body">${this.scene.block(this.index, uri)}</g>`; }
  swing() { this.state = 'swinging'; this.swingStart = performance.now(); }
  ropeLength() { return Math.max(150, this.H * this.frac() - (this.H < 700 ? 140 : 200) - BH - TOP); }
  /* Where the hanging piece is on screen: its box, for the picture to zoom out of and back into. */
  brickRect() { return this.hanging.querySelector('.brick-body')?.getBoundingClientRect() || this.svg.getBoundingClientRect(); }

  /* Moves the hanging piece along a path; f(p) gives [x, y, rotation] at progress p from 0 to 1. */
  fly(length, f) {
    return new Promise(resolve => {
      const start = performance.now();
      const step = now => {
        if (!this.alive) return resolve();
        const p = Math.min(1, (now - start) / length), [x, y, r] = f(p);
        this.hanging.setAttribute('transform', `translate(${x} ${y}) rotate(${r})`); this.rope.setAttribute('d', '');
        if (p < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
  }
  /* Lets go: the piece falls straight down and lands on the stack, then the view rises. Resolves with the landing offset. */
  async drop() {
    if (this.state !== 'swinging') return null;
    this.state = 'falling';
    const fromY = this.hangY, toY = this.topY() - BH + this.cam, x = this.bx, angle = this.angle, edge = BW * .45;
    let landX = this.topX() + Math.max(-edge, Math.min(edge, x - this.topX())); landX = Math.max(this.cx - 170, Math.min(this.cx + 170, landX));
    await this.fly(this.calm ? 1 : Math.max(260, Math.sqrt(Math.max(0, toY - fromY)) * 26), p => [x + (landX - x) * p * p, fromY + (toY - fromY) * p * p, angle * (1 - p)]);
    this.hooks.sfx?.('drop');
    this.placed.push({ x: landX, picture: this.picture });
    this.hanging.innerHTML = ''; this.hanging.removeAttribute('transform');
    this.land(Math.abs(landX - (this.placed.length > 1 ? this.placed.at(-2).x : this.cx)) > BW * .3);
    this.state = 'idle';
    return { dx: landX - this.cx };
  }
  /* A piece graded wrong: it falls, catches the edge of the stack, and tumbles off the screen. */
  async fallOff() {
    this.state = 'falling';
    const fromY = this.hangY, edgeY = this.topY() - BH + this.cam, x = this.bx, side = x >= this.topX() ? 1 : -1, angle = this.angle, sideX = this.topX() + side * BW * .85;
    this.hooks.sfx?.('oops');
    await this.fly(this.calm ? 1 : 420, p => [x + (sideX - x) * p, fromY + (edgeY - fromY) * p * p, angle + side * 25 * p]);
    await this.fly(this.calm ? 1 : 900, p => [sideX + side * 260 * p, edgeY + (this.H + 300 - edgeY) * p * p, angle + side * (25 + 240 * p)]);
    this.hanging.innerHTML = ''; this.hanging.removeAttribute('transform');
    this.state = 'idle';
  }
  land(wobble) {
    const i = this.placed.length - 1, brick = this.placed[i], g = this.piece(i, brick); this.stack.append(g);
    if (!this.calm) {
      g.firstChild.animate(wobble ? [{ transform: 'rotate(0)' }, { transform: 'rotate(-5deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }] : [{ transform: 'scale(1.06,.86)' }, { transform: 'scale(.97,1.04)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' });
      for (const side of [-1, 1]) this.dust(brick.x + side * (BW / 2 - 10), this.G - this.scene.baseH - i * BH, side);
    }
    this.aim();
  }
  dust(x, y, side) {
    for (let n = 0; n < 3; n++) { const puff = el('circle', { cx: x, cy: y, r: 10 + n * 3, fill: CREAM, stroke: INK, 'stroke-width': 2.5 }, this.fx); puff.animate([{ transform: 'translate(0,0) scale(.6)', opacity: 1 }, { transform: `translate(${side * (30 + n * 22)}px,${-12 - n * 8}px) scale(1.2)`, opacity: 0 }], { duration: 600, easing: 'ease-out', fill: 'forwards' }).finished.then(() => puff.remove()); }
  }
  /* The last piece comes down on top. */
  finish() {
    return new Promise(resolve => {
      const cap = el('g', { class: 'cap' }, this.stack), y = this.topY(), x = this.topX();
      cap.innerHTML = `<g class="piece">${this.scene.top()}</g>`;
      this.capY = y; this.capX = x;
      const start = performance.now(), length = this.calm ? 1 : 700;
      const fall = now => { const p = Math.min(1, (now - start) / length); cap.setAttribute('transform', `translate(${x} ${y - 400 * (1 - p * p)})`); if (p < 1) requestAnimationFrame(fall); else { this.hooks.sfx?.('drop'); setTimeout(resolve, this.calm ? 0 : 500); } };
      requestAnimationFrame(fall);
      /* Then the view zooms out until the whole stack, ground to top, fits on the screen. */
      this.zTo = Math.min(1, (this.G - TOP - 70) / (this.G - (y - 250))); this.camTo = 0;
    });
  }
  /* Where a point of the stack ends up on screen once the view has settled. */
  screenX(x) { return x * this.zTo + this.cx * (1 - this.zTo); }
  screenY(y) { return y * this.zTo + this.G * (1 - this.zTo) + this.camTo; }

  /* ---------- The endings: a big pulsing thing to tap, then something happens ---------- */
  /* Shows the scene's ending to tap; resolves once the child has tapped it and the ending has played. */
  ending() {
    this.state = 'ending';
    const kind = this.scene.ending, trigger = el('g', { class: 'ending-trigger', role: 'button', tabindex: 0, 'aria-label': 'اضغط هنا' }, this.top);
    const midY = Math.min(this.H - 90, Math.max(TOP + 140, this.screenY((this.G - this.scene.baseH + this.capY) / 2)));
    if (kind === 'wreck') { this.px = this.cx - Math.min(this.W * .36, 400); this.by = midY; trigger.innerHTML = `<path d="M${this.px} ${TOP}V${this.by - 60}" stroke="${INK}" stroke-width="6" stroke-dasharray="14 6"/><circle cx="${this.px}" cy="${this.by}" r="64" fill="#55585e" ${line(5)}/><circle cx="${this.px - 22}" cy="${this.by - 24}" r="14" fill="#fff" opacity=".35"/>`; }
    if (kind === 'fireworks') trigger.innerHTML = this.badge(this.W * .14, this.H * .78, `<path d="M-14 30V-30l14-24 14 24V30Z" fill="#cf7a56" ${line(4)}/><path d="M-14 -10h28M-14 10h28" stroke="#e0b25c" stroke-width="6"/><path d="M0 30v22" ${line(4)}/><path d="M0 52l6 10" stroke="#f3c27a" stroke-width="5" stroke-linecap="round"/>`);
    if (kind === 'lick') trigger.innerHTML = this.badge(this.W * .86, this.H * .72, `<circle r="70" fill="#f6d2b4" ${line(4)}/><circle cx="-24" cy="-14" r="8" fill="${INK}"/><circle cx="24" cy="-14" r="8" fill="${INK}"/><path d="M-30 18q30 34 60 0Z" fill="#b5633f" ${line(3)}/><path d="M-12 30q12 18 24 0" fill="#ef9a8a"/>`, 92);
    if (kind === 'blow') trigger.innerHTML = this.badge(this.W * .14, Math.max(TOP + 140, this.screenY(this.capY - 60)), `<path d="M-60 20c-24 0-24-36 0-36 4-24 40-30 52-8 16-14 46-4 44 18 20 2 20 26 0 26Z" fill="${CREAM}" ${line(4)}/><circle cx="-14" cy="0" r="5" fill="${INK}"/><circle cx="10" cy="0" r="5" fill="${INK}"/><circle cx="34" cy="10" r="8" fill="#b5633f" ${line(2.5)}/>`, 86);
    if (kind === 'launch') trigger.innerHTML = this.badge(this.W * .86, this.H * .78, `<rect x="-56" y="-30" width="112" height="70" rx="12" fill="#9aa6b2" ${line(4)}/><circle cy="2" r="24" fill="#d9655a" ${line(4)}/><circle cx="-8" cy="-6" r="7" fill="#fff" opacity=".5"/>`);
    if (!this.calm) this.pulse = trigger.animate([{ opacity: 1 }, { opacity: .55 }, { opacity: 1 }], { duration: 1100, iterations: Infinity });
    this.trigger = trigger;
    return new Promise(resolve => {
      const go = async event => {
        event?.stopPropagation?.(); event?.preventDefault?.(); trigger.onpointerdown = trigger.onkeydown = null; this.pulse?.cancel(); this.hooks.ending?.();
        await this[kind](trigger);
        this.state = 'done'; resolve();
      };
      trigger.onpointerdown = go; trigger.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') go(event); };
    });
  }
  badge(x, y, body, r = 70) { return `<g transform="translate(${x} ${y})"><circle r="${r + 14}" fill="#fffaf0" opacity=".85" ${line(3)}/>${body}</g>`; }
  triggerRect() { return this.trigger?.getBoundingClientRect(); }
  pieces() { return [...this.stack.querySelectorAll('.piece')]; }
  wait(ms) { return new Promise(resolve => setTimeout(resolve, this.calm ? 0 : ms)); }

  /* The wrecking ball swings in from the side and the pieces fly off. */
  async wreck(ball) {
    const pivot = `${this.px} ${TOP}`;
    await new Promise(resolve => {
      const start = performance.now(), length = this.calm ? 1 : 900; let hit = false;
      const step = now => {
        const p = Math.min(1, (now - start) / length), a = p < .3 ? 18 * (p / .3) : 18 - 58 * Math.min(1, (p - .3) / .25) ** 2;
        ball.setAttribute('transform', `rotate(${a} ${pivot})`);
        if (!hit && p >= .55) { hit = true; this.hooks.sfx?.('boom'); this.scatter(1); }
        if (p < 1) requestAnimationFrame(step); else resolve();
      };
      requestAnimationFrame(step);
    });
    await this.wait(1300);
  }
  /* Every piece flies off, the top first. */
  scatter(side) {
    this.pieces().reverse().forEach((piece, i) => { const dx = side * (300 + Math.random() * 500), dy = 200 + Math.random() * 300; piece.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) rotate(${side * (90 + Math.random() * 260)}deg)`, opacity: 0 }], { duration: this.calm ? 1 : 1200, delay: this.calm ? 0 : i * 40, easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'forwards' }); });
  }
  /* Fireworks burst over the castle. */
  async fireworks() {
    const colors = ['#cf7a56', '#e0b25c', '#6ba39b', '#c9b0d8', '#f2a7b8', '#92abbf'];
    for (let n = 0; n < 7; n++) {
      const x = this.W * (.2 + Math.random() * .6), y = this.H * (.14 + Math.random() * .28), color = colors[n % colors.length], burst = el('g', {}, this.top);
      burst.innerHTML = `<g transform="translate(${x} ${y})"><g class="burst">${Array.from({ length: 12 }, (_, k) => { const a = k / 12 * Math.PI * 2; return `<path d="M${Math.cos(a) * 14} ${Math.sin(a) * 14}L${Math.cos(a) * 70} ${Math.sin(a) * 70}" stroke="${color}" stroke-width="7" stroke-linecap="round"/><circle cx="${Math.cos(a) * 82}" cy="${Math.sin(a) * 82}" r="6" fill="${color}"/>`; }).join('')}</g></g>`;
      this.hooks.sfx?.('pop');
      burst.querySelector('.burst').animate([{ transform: 'scale(.1)', opacity: 1 }, { transform: 'scale(1.2)', opacity: 1, offset: .6 }, { transform: 'translateY(30px) scale(1.3)', opacity: 0 }], { duration: this.calm ? 1 : 1100, fill: 'forwards' }).finished.then(() => burst.remove());
      await this.wait(320);
    }
    await this.wait(900);
  }
  /* A big tongue licks the scoops away, from the top down, with hearts. */
  async lick() {
    const tongue = el('path', { fill: 'none', stroke: '#ef9a8a', 'stroke-width': 26, 'stroke-linecap': 'round' }, this.top), fx = this.W * .86, fy = this.H * .72 + 30;
    const targets = [this.stack.querySelector('.cap .piece'), ...this.pieces().filter(p => !p.closest('.cap')).reverse()].filter(Boolean), svgBox = this.svg.getBoundingClientRect(), k = this.W / svgBox.width;
    for (const target of targets) {
      const box = target.getBoundingClientRect(), tx = (box.left + box.width / 2 - svgBox.left) * k, ty = (box.top + box.height / 2 - svgBox.top) * k;
      tongue.setAttribute('d', `M${fx - 30} ${fy}Q${(fx + tx) / 2} ${ty - 60} ${tx + 40} ${ty}`);
      this.hooks.sfx?.('pop');
      target.animate([{ opacity: 1 }, { opacity: 0 }], { duration: this.calm ? 1 : 300, fill: 'forwards' });
      this.heart(tx, ty);
      await this.wait(260);
    }
    tongue.remove();
    await this.wait(700);
  }
  heart(x, y) {
    if (this.calm) return;
    const h = el('path', { d: `M${x} ${y + 14}c-22-14-18-34 0-24 18-10 22 10 0 24Z`, fill: '#ef9a8a', stroke: INK, 'stroke-width': 2.5 }, this.top);
    h.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-90px)', opacity: 0 }], { duration: 900, fill: 'forwards' }).finished.then(() => h.remove());
  }
  /* A cloud blows: puffs fly to the candles, the flames go out, and confetti falls. */
  async blow() {
    const x0 = this.W * .14 + 60, y0 = Math.max(TOP + 140, this.screenY(this.capY - 60)), tx = this.screenX(this.capX), ty = this.screenY(this.capY - 90);
    this.hooks.sfx?.('whoosh');
    for (let n = 0; n < 6; n++) {
      const puff = el('circle', { cx: x0, cy: y0, r: 14, fill: CREAM, stroke: INK, 'stroke-width': 2.5 }, this.top);
      puff.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${tx - x0}px,${ty - y0 + (n - 3) * 10}px) scale(1.4)`, opacity: 0 }], { duration: this.calm ? 1 : 700, delay: this.calm ? 0 : n * 90, fill: 'forwards' }).finished.then(() => puff.remove());
    }
    await this.wait(700);
    this.stack.querySelectorAll('.flame').forEach(flame => flame.animate([{ opacity: 1 }, { opacity: 0 }], { duration: this.calm ? 1 : 300, fill: 'forwards' }));
    this.stack.querySelector('.cap .piece')?.insertAdjacentHTML('beforeend', [-60, 0, 60].map(x => `<path d="M${x} -80c-8-14 8-20 0-34s8-20 0-30" fill="none" stroke="#9aa6b2" stroke-width="4" stroke-linecap="round" opacity=".7"/>`).join(''));
    this.hooks.sfx?.('fanfare');
    this.confetti();
    await this.wait(1500);
  }
  confetti() {
    if (this.calm) return;
    for (let n = 0; n < 40; n++) {
      const x = Math.random() * this.W, bit = el('rect', { x, y: -20, width: 12, height: 8, rx: 2, fill: ['#cf7a56', '#e0b25c', '#6ba39b', '#c9b0d8', '#f2a7b8'][n % 5] }, this.top);
      bit.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${(Math.random() - .5) * 120}px,${this.H + 40}px) rotate(${360 + Math.random() * 360}deg)` }], { duration: 1600 + Math.random() * 900, delay: Math.random() * 400, fill: 'forwards' }).finished.then(() => bit.remove());
    }
  }
  /* The rocket lifts off: flames under the engine, then the whole stack rises out of the sky. */
  async launch() {
    const flames = el('g', {}, this.stack);
    flames.innerHTML = `<g transform="translate(${this.cx} ${this.G - this.scene.baseH + 116})"><g class="burn"><path d="M-50 0q50 140 100 0Z" fill="#f3c27a" ${line(3)}/><path d="M-26 0q26 80 52 0Z" fill="#cf7a56"/></g></g>`;
    if (!this.calm) flames.querySelector('.burn').animate([{ transform: 'scaleY(.8)' }, { transform: 'scaleY(1.2)' }], { duration: 120, iterations: Infinity, direction: 'alternate' });
    this.hooks.sfx?.('whoosh');
    for (let n = 0; n < 8; n++) this.dust(this.cx + (n % 2 ? 1 : -1) * (60 + n * 10), this.G - 40, n % 2 ? 1 : -1);
    await this.wait(500);
    this.stack.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${-(this.H * 2 + this.placed.length * BH)}px)` }], { duration: this.calm ? 1 : 2200, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
    this.hooks.sfx?.('fanfare');
    await this.wait(2200);
  }
  destroy() { this.alive = false; removeEventListener('resize', this.resize); }

  frame(now) {
    if (!this.alive) return;
    this.cam += (this.camTo - this.cam) * .08; this.z += (this.zTo - this.z) * .08;
    this.world.setAttribute('transform', `translate(${this.cx * (1 - this.z)} ${this.G * (1 - this.z) + this.cam}) scale(${this.z})`);
    this.back.querySelector('.clouds')?.setAttribute('transform', `translate(${-(now * .004) % 400} ${this.cam * .3})`);
    if (this.state === 'waiting' || this.state === 'swinging') {
      /* A real pendulum: a rope of fixed length from the trolley, the piece moving along its arc and always lined up with
         the rope (its top facing the trolley, turning a little less than the rope, as on a swivel hook), slowing at each end.
         About four seconds there and back; it starts gently and swings no wider than about 30 degrees. */
      const pivot = TOP + 16, length = this.ropeLength() - 16, reach = Math.min(this.W * .3, 300), wide = Math.min(.52, Math.asin(Math.min(1, reach / length)));
      let phi = 0;
      if (this.state === 'swinging' && !this.calm) { const t = (now - this.swingStart) / 1000; phi = wide * Math.sin(t * 1.5) * Math.min(1, t * .7); }
      else if (this.state === 'waiting' && !this.calm) phi = Math.sin((now - this.t0) / 700) * .025;
      this.bx = this.cx + length * Math.sin(phi); this.hangY = pivot + length * Math.cos(phi); this.angle = -phi * .75 * 180 / Math.PI;
      this.hanging.setAttribute('transform', `translate(${this.bx} ${this.hangY}) rotate(${this.angle})`);
      /* The rope ends at the top of the piece's studs, along the same line. */
      const tie = length - 14;
      this.rope.setAttribute('d', `M${this.cx} ${pivot}L${this.cx + tie * Math.sin(phi)} ${pivot + tie * Math.cos(phi)}`);
    }
    requestAnimationFrame(this.frame);
  }
}
