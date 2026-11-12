/* The approved look: flat muted colours, thin brown lines, cutaway rooms, islands and streets. All of it is drawn here in code.
   skin() turns any drawing from the kit into this look. layout() says where everything sits on a stage. */
window.ArticulationCozy = (() => {
  const K = window.ArticulationKit, L = '#5a3d2b';
  const C = { wood: '#d0a06e', woodD: '#b98454', woodL: '#e0b98a', sage: '#b4c49c', sageD: '#9fb288', cream: '#f6e8d0', mus: '#e0b25c', musD: '#c9984a', terra: '#cf7a56', terraD: '#b5633f', teal: '#6ba39b', tealD: '#578a83', blue: '#92abbf', blueD: '#7b95aa', plum: '#a98aa8', paper: '#f3e3bf', stone: '#c9c0b0', stoneD: '#aca394', road: '#8b8f95', roadD: '#777b82' };
  const mix = (h, t = .3) => { const v = parseInt(h.slice(1), 16), c = [v >> 16 & 255, v >> 8 & 255, v & 255], w = [243, 226, 200]; return '#' + c.map((x, i) => Math.round(x + (w[i] - x) * t).toString(16).padStart(2, '0')).join(''); };
  const skin = s => {
    let x = K.svg(s, 200, 200).replace(/<svg[^>]*>/, '').replace('</svg>', '').replace(/<path[^>]*stroke="#fff"[^>]*opacity="\.7"[^>]*\/>/g, '');
    const flat = {};
    for (const m of x.matchAll(/<linearGradient id="p-(\w+)"[^>]*><stop offset="0" stop-color="(#[0-9a-fA-F]{6})"\/><stop offset="1" stop-color="(#[0-9a-fA-F]{6})"\/><\/linearGradient>/g)) { const h = [m[2], m[3]].map(v => parseInt(v.slice(1), 16)); flat[m[1]] = '#' + [16, 8, 0].map(n => Math.round((h[0] >> n & 255) * .55 + (h[1] >> n & 255) * .45).toString(16).padStart(2, '0')).join(''); }
    x = x.replace(/<defs>(<linearGradient id="p-.*?)<\/defs>/s, '').replace(/url\(#p-(\w+)\)/g, (m, n) => flat[n] || '#999999').replace(/stroke-width="([0-9.]+)"/g, (m, v) => `stroke-width="${(+v >= 2.2 ? Math.max(2.2, +v * .56) : +v).toFixed(2)}"`);
    return x.replace(/#[0-9a-fA-F]{6}\b/g, c => c.toLowerCase() === '#2f4560' ? L : mix(c));
  };
  const WOB = (id, f, s, seed = 5) => `<filter id="${id}" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="2" seed="${seed}"/><feDisplacementMap in="SourceGraphic" scale="${s}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
  const rnd = i => { const v = Math.sin(i * 91.7 + 3.3) * 43758.5; return v - Math.floor(v); };

  /* ---------- isometric helpers ---------- */
  const O = [735, 262], U = 66, iso = (x, y, z = 0) => [O[0] + (x - y) * U * .866, O[1] + (x + y) * U * .5 - z * U];
  const pt = a => a.map(q => iso(...q).map(v => v.toFixed(1)).join(',')).join(' ');
  const poly = (a, f, w = 2.6, st = L) => `<polygon points="${pt(a)}" fill="${f}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const seg = (a, c = L, w = 2) => `<polyline points="${pt(a)}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const box = (x, y, z, dx, dy, dz, top, fa, fb, w = 2.6) => poly([[x, y + dy, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x, y + dy, z + dz]], fa, w) + poly([[x + dx, y, z], [x + dx, y + dy, z], [x + dx, y + dy, z + dz], [x + dx, y, z + dz]], fb, w) + poly([[x, y, z + dz], [x + dx, y, z + dz], [x + dx, y + dy, z + dz], [x, y + dy, z + dz]], top, w);
  const circleAt = (q, r, f) => `<circle cx="${q[0]}" cy="${q[1]}" r="${r}" fill="${f}" stroke="${L}" stroke-width="1.8"/>`;
  const W = 1600, H = 900, scene = (bg, inner, id) => `<svg xmlns="http://www.w3.org/2000/svg" width="2100" height="1200" viewBox="-250 -150 2100 1200"><defs>${WOB('r', '.02', 2.4, 9)}</defs><rect x="-250" y="-150" width="2100" height="1200" fill="${bg}"/><g filter="url(#r)">${inner}</g></svg>`;
  const planks = (X, Y, tones, seam) => { let r = '', id = X * 7; for (let j = 0; j < Y * 2; j++) { const y = j * .5; let x = (j % 2) * .9 - .9; while (x < X) { const len = 2 + rnd(id++) * 2.2, a = Math.max(0, x), e = Math.min(X, x + len); if (e > a) r += poly([[a, y, 0], [e, y, 0], [e, y + .5, 0], [a, y + .5, 0]], tones[Math.floor(rnd(id + 7) * tones.length)], 1.4, seam); x += len; } } return r; };

  /* ---------- rooms ---------- */
  const X = 10, Y = 8, RH = 3.2;
  const shell = (wallA, wallB, tones, seam) => poly([[0, 0, 0], [X, 0, 0], [X, 0, RH], [0, 0, RH]], wallA) + poly([[0, 0, 0], [0, Y, 0], [0, Y, RH], [0, 0, RH]], wallB) + poly([[0, 0, 0], [X, 0, 0], [X, Y, 0], [0, Y, 0]], tones[0]) + planks(X, Y, tones, seam) + seg([[0, 0, 0], [X, 0, 0], [X, Y, 0], [0, Y, 0], [0, 0, 0]], L, 3) + poly([[0, 0, 0], [X, 0, 0], [X, 0, .26], [0, 0, .26]], C.woodL) + poly([[0, 0, 0], [0, Y, 0], [0, Y, .26], [0, 0, .26]], C.woodL);
  const WOOD = ['#d6a875', '#cc9b68', '#dcb182', '#c79562'];
  const arch = (cx, w, z0, zs, ht) => { const a = [[cx - w, 0, z0], [cx + w, 0, z0], [cx + w, 0, zs]]; for (let i = 1; i < 14; i++) { const t = i / 14 * Math.PI; a.push([cx + Math.cos(t) * w, 0, zs + Math.sin(t) * ht]); } a.push([cx - w, 0, zs]); return a; };
  const archWindow = (cx, curtain) => { let r = poly(arch(cx, 1.1, 1.1, 2.0, .7), '#cfeaf2', 3); for (let x = cx - .8; x <= cx + .85; x += .4) r += seg([[x, 0, 1.1], [x, 0, 2.0 + Math.sqrt(Math.max(0, 1.21 - (x - cx) ** 2)) / 1.1 * .7]], C.woodD, 1.8); for (let z = 1.4; z < 2.6; z += .3) { const h = z <= 2 ? 1.1 : 1.1 * Math.sqrt(Math.max(0, 1 - ((z - 2) / .7) ** 2)); r += seg([[cx - h, 0, z], [cx + h, 0, z]], C.woodD, 1.8); } r += poly([[cx - 1.6, 0, .8], [cx - 1, 0, .8], [cx - .92, 0, 2.95], [cx - 1.6, 0, 2.95]], curtain) + poly([[cx + 1, 0, .8], [cx + 1.6, 0, .8], [cx + 1.6, 0, 2.95], [cx + .92, 0, 2.95]], curtain) + poly([[cx - 1.8, 0, 2.95], [cx + 1.8, 0, 2.95], [cx + 1.8, 0, 3.03], [cx - 1.8, 0, 3.03]], C.woodD); return r; };
  const starRug = (x0, y0, x1, y1, base, inner, star) => { let r = poly([[x0, y0, .02], [x1, y0, .02], [x1, y1, .02], [x0, y1, .02]], base) + poly([[x0 + .25, y0 + .25, .02], [x1 - .25, y0 + .25, .02], [x1 - .25, y1 - .25, .02], [x0 + .25, y1 - .25, .02]], inner, 1.6, C.paper); for (let x = x0 + .1; x < x1; x += .28) r += seg([[x, y1, .02], [x, y1 + .14, 0]], C.paper, 1.8) + seg([[x, y0, .02], [x, y0 - .14, 0]], C.paper, 1.8); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, s = []; for (let i = 0; i < 16; i++) { const a = i / 16 * 2 * Math.PI, q = i % 2 ? .78 : 1.28; s.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q, .02]); } return r + poly(s, star, 2, C.cream); };
  const bookcase = (y, top = 1) => { let r = box(0, y, 0, .75, 2.3, 2.5, C.woodL, C.woodD, C.wood); const cols = [C.terra, C.teal, C.mus, C.blue, C.plum, C.sage, C.cream]; let id = y * 13; for (const z of [.1, .9, 1.7]) { r += poly([[.75, y + .15, z], [.75, y + 2.15, z], [.75, y + 2.15, z + .72], [.75, y + .15, z + .72]], '#8d6541', 2); let p = y + .2; while (p < y + 2.05) { const w = .13 + rnd(id++) * .13, h = .42 + rnd(id++) * .24; r += poly([[.75, p, z], [.75, p + w, z], [.75, p + w, z + h], [.75, p, z + h]], cols[Math.floor(rnd(id++) * 7)], 1.6); p += w + .02; } } return r; };
  const dresser = (y, n, face, faceD) => { let r = box(0, y, 0, .95, n * .97 + .1, .98, C.woodL, C.woodD, face); for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) { const p = y + .12 + i * .97, z = .1 + k * .43; r += poly([[.95, p, z], [.95, p + .86, z], [.95, p + .86, z + .37], [.95, p, z + .37]], faceD, 1.8) + circleAt(iso(.95, p + .43, z + .19), 4.5, C.mus); } return r; };
  const shelfOnWall = (x0, x1, z) => poly([[x0, 0, z], [x1, 0, z], [x1, .42, z], [x0, .42, z]], C.wood) + poly([[x0, .42, z], [x1, .42, z], [x1, .42, z - .12], [x0, .42, z - .12]], C.woodD);
  const picture = (y0, y1, z0, z1, f) => poly([[0, y0, z0], [0, y1, z0], [0, y1, z1], [0, y0, z1]], C.woodD) + poly([[0, y0 + .16, z0 + .16], [0, y1 - .16, z0 + .16], [0, y1 - .16, z1 - .16], [0, y0 + .16, z1 - .16]], C.paper, 1.8) + poly([[0, y0 + .16, z0 + .16], [0, y1 - .16, z0 + .16], [0, y1 - .16, z0 + .55], [0, y0 + .16, z0 + .75]], f, 1.6);
  const plant = q => `<path d="M${q[0]} ${q[1]}c-16-16-22-34-14-50 12 8 16 24 14 50zM${q[0]} ${q[1]}c16-14 26-28 24-46-14 6-22 22-24 46zM${q[0]} ${q[1]}c-4-20 0-44 8-58 8 18 4 40-8 58z" fill="${C.sageD}" stroke="${L}" stroke-width="2"/>`;
  const rooms = {
    first() {
      let r = shell(C.cream, C.sage, WOOD, '#a97b4e') + archWindow(4.4, C.terra) + picture(4.5, 6.1, 1.5, 2.65, C.sageD) + bookcase(1) + dresser(3.75, 3, C.teal, C.tealD) + box(.3, 6, .98, .35, .35, .28, C.terraD, C.terra, C.terraD, 2) + plant(iso(.48, 6.18, 1.3));
      r += box(2.2, 0, 0, 4.4, 1.05, .42, C.mus, C.musD, C.terra); for (let i = 0; i < 4; i++) r += box(2.3 + i * 1.05, .02, .42, .98, .38, .66, i % 2 ? C.teal : C.blue, i % 2 ? C.tealD : C.blueD, i % 2 ? C.tealD : C.blueD);
      r += shelfOnWall(.7, 2, 2) + seg([[1.4, 0, RH], [1.4, 0, 2.7]], L, 2.2) + starRug(2.7, 2.4, 7.5, 6.5, C.blue, C.blueD, '#e5c79b'); return r;
    },
    middle() {
      const TILE = ['#e9dcc0', '#dfd0b0', '#e9dcc0', '#d9c9a8'];
      let r = shell('#dfe7cf', C.cream, TILE, '#b8a884') + box(0, 1, 0, .95, 1.4, 2.7, C.cream, '#d9cdb4', '#e8ddc6') + seg([[.95, 2.4, 1.05], [.95, 1, 1.05]], L, 2.2) + seg([[.95, 1.25, 1.2], [.95, 1.25, 1.7]], L, 4) + seg([[.95, 1.25, .35], [.95, 1.25, .85]], L, 4);
      r += box(2.6, 0, 0, 4.8, .95, .92, C.woodL, C.wood, C.tealD); for (let i = 0; i < 4; i++) { const x = 2.75 + i * 1.18; r += poly([[x, .95, .1], [x + 1.02, .95, .1], [x + 1.02, .95, .78], [x, .95, .78]], C.teal, 1.8) + circleAt(iso(x + .51, .95, .62), 4, C.mus); }
      r += poly([[3.1, .15, .925], [4.3, .15, .925], [4.3, .75, .925], [3.1, .75, .925]], C.stone, 2) + poly([[3.25, .25, .93], [4.15, .25, .93], [4.15, .65, .93], [3.25, .65, .93]], '#bfe0e8', 1.6) + seg([[3.7, .05, .93], [3.7, .05, 1.35], [3.7, .4, 1.35], [3.7, .4, 1.22]], C.blueD, 4);
      r += box(5.6, .1, .92, 1.5, .75, .08, '#5d5a58', '#4b4846', '#4b4846', 2); for (const [a, b] of [[5.95, .32], [6.75, .32], [5.95, .66], [6.75, .66]]) { const q = iso(a, b, 1.01); r += `<ellipse cx="${q[0]}" cy="${q[1]}" rx="15" ry="8" fill="none" stroke="#c88a5a" stroke-width="2.4"/>`; }
      r += box(2.8, 0, 2.05, 4.4, .55, .85, C.teal, C.tealD, C.tealD); for (let x = 4.27; x < 7; x += 1.47) r += seg([[x, .55, 2.05], [x, .55, 2.9]], L, 2);
      r += shelfOnWall(.7, 2.2, 2.1) + picture(3.4, 5.2, 1.4, 2.5, C.terra);
      r += starRug(3, 3.2, 7, 6, '#c7cfa8', '#b3bf92', '#eadcb5'); return r;
    },
    last() {
      let r = shell('#e6d3c5', '#c9d6dc', WOOD, '#a97b4e') + archWindow(5.6, C.teal) + box(0, 1, 0, .95, 1.8, 2.75, C.woodL, C.woodD, C.wood) + seg([[.95, 1.9, .15], [.95, 1.9, 2.65]], L, 2.4) + circleAt(iso(.95, 1.75, 1.3), 4.5, C.mus) + circleAt(iso(.95, 2.05, 1.3), 4.5, C.mus);
      r += box(0, 3.5, 0, 2.9, 2.3, .5, C.cream, '#dcccb0', '#e8dcc4') + box(0, 3.5, 0, .35, 2.3, 1.35, C.woodL, C.woodD, C.wood) + box(.4, 3.75, .5, .85, 1.8, .24, '#fbf4e6', '#e9dfcd', '#e9dfcd', 2.2) + poly([[1.35, 3.5, .52], [2.9, 3.5, .52], [2.9, 5.8, .52], [1.35, 5.8, .52]], C.plum) + poly([[2.9, 3.5, .52], [2.9, 5.8, .52], [2.9, 5.8, .1], [2.9, 3.5, .1]], '#957794') + poly([[1.35, 5.8, .52], [2.9, 5.8, .52], [2.9, 5.8, .1], [1.35, 5.8, .1]], '#957794');
      r += box(1.6, 0, 0, 2.2, .85, .9, C.woodL, C.woodD, C.wood) + shelfOnWall(1.4, 3.2, 2.15) + picture(5.6, 7.1, 1.5, 2.6, C.blue);
      for (let i = 0; i < 5; i++) { const a = 5 + i * .6; r += `<ellipse cx="${iso(a, 5.4)[0]}" cy="${iso(a, 5.4)[1]}" rx="0" ry="0"/>`; }
      const q = iso(6, 5); r += `<ellipse cx="${q[0]}" cy="${q[1]}" rx="190" ry="108" fill="${C.mus}" stroke="${L}" stroke-width="2.6"/><ellipse cx="${q[0]}" cy="${q[1]}" rx="150" ry="84" fill="none" stroke="${C.cream}" stroke-width="3"/><ellipse cx="${q[0]}" cy="${q[1]}" rx="100" ry="56" fill="${C.terra}" stroke="${C.cream}" stroke-width="2"/>`; return r;
    },
  };

  /* ---------- street: a whole town square seen straight on, like the islands, with the road in front ---------- */
  const PLAZA = { first: [.06, .7, .03, 1.9], middle: [.09, 2.2, .02, .4], last: [.05, 4.1, .05, 3.1] }, PX = 800, PY = 478, ROAD_TOP = 792, ROAD_BOTTOM = 892, ROAD_GROUND = 872;
  const plazaRing = id => { const [a, p, b, q] = PLAZA[id], out = []; for (let i = 0; i < 72; i++) { const t = i / 72 * 2 * Math.PI, c = Math.cos(t), n = Math.sin(t), k = (Math.abs(c) ** 3.2 + Math.abs(n) ** 3.2) ** (-1 / 3.2), w = 1 + a * Math.sin(2 * t + p) + b * Math.sin(3 * t + q); out.push([PX + c * k * w * 630, PY + n * k * w * 262]); } return out; };
  const STREET = { first: { lawn: '#c2d59f', patch: '#adc58a', tile: '#ecdfc4', seam: '#d8c8a8', rim: '#c9b48e' }, middle: { lawn: '#b9d29a', patch: '#a3bf83', tile: '#e4dcc6', seam: '#cfc5aa', rim: '#bfb092' }, last: { lawn: '#c9d9a0', patch: '#b4c88a', tile: '#efe0c0', seam: '#dbc9a2', rim: '#cdb68a' } };
  const groundBelow = (points, x) => points.filter(q => q[1] > PY).reduce((best, q) => Math.abs(q[0] - x) < Math.abs(best[0] - x) ? q : best, [0, PY])[1];
  const streetStage = id => {
    const look = STREET[id], ring = plazaRing(id); let s = '';
    for (let i = 0; i < 22; i++) { const x = rnd(i + 500) * 2100 - 250, y = rnd(i + 560) * 1200 - 150; if (y < ROAD_BOTTOM + 40 && y > ROAD_TOP - 60) continue; s += `<ellipse cx="${x}" cy="${y}" rx="${50 + rnd(i) * 70}" ry="${16 + rnd(i + 3) * 20}" fill="${look.patch}" opacity=".5"/>`; }
    for (let i = 0; i < 130; i++) { const x = rnd(i + 700) * 2100 - 250, y = rnd(i + 900) * 1200 - 150; if (y > ROAD_TOP - 14 && y < ROAD_BOTTOM + 12) continue; s += i % 4 ? `<path d="M${x - 5} ${y}l3-8 2 7 3-9 2 10" fill="none" stroke="${look.patch}" stroke-width="2" stroke-linecap="round"/>` : `<circle cx="${x}" cy="${y}" r="3.5" fill="${['#f7e6b0', '#ef9a8a', '#ffffff'][i % 3]}"/>`; }
    const band = (y, h, f) => `<rect x="-250" y="${y}" width="2100" height="${h}" fill="${f}"/>`, edge = y => `<path d="M-250 ${y}H1850" stroke="${L}" stroke-width="2.6"/>`;
    s += band(ROAD_TOP - 12, 12, C.stone) + band(ROAD_TOP, ROAD_BOTTOM - ROAD_TOP, C.road) + band(ROAD_BOTTOM, 12, C.stone) + edge(ROAD_TOP - 12) + edge(ROAD_TOP) + edge(ROAD_BOTTOM) + edge(ROAD_BOTTOM + 12);
    for (let x = -240; x < 1850; x += 130) s += `<rect x="${x}" y="${(ROAD_TOP + ROAD_BOTTOM) / 2 - 4}" width="74" height="8" rx="3" fill="#f2e6c8"/>`;
    for (let k = 0; k < 8; k++) s += `<rect x="${742 + k * 16}" y="${ROAD_TOP + 6}" width="9" height="${ROAD_BOTTOM - ROAD_TOP - 12}" fill="#f2e6c8"/>`;
    for (const x of [320, 1150]) { const y = groundBelow(ring, x) - 6; s += `<polygon points="${x - 56},${y} ${x + 56},${y} ${x + 66},${ROAD_TOP - 12} ${x - 66},${ROAD_TOP - 12}" fill="${look.tile}" stroke="${L}" stroke-width="2.4" stroke-linejoin="round"/>`; }
    s += path(ring.map(q => [q[0], q[1] + 16]), look.rim, L, 2.6) + `<clipPath id="pz"><polygon points="${ring.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}"/></clipPath>` + path(ring, look.tile, L, 2.6) + '<g clip-path="url(#pz)">';
    for (let y = 150; y < 790; y += 46) s += `<path d="M100 ${y}H1500" stroke="${look.seam}" stroke-width="1.6"/>`;
    for (let row = 0, y = 150; y < 790; y += 46, row++) for (let x = 100 + (row % 2) * 44; x < 1500; x += 88) s += `<path d="M${x} ${y}v46" stroke="${look.seam}" stroke-width="1.6"/>`;
    const q = [PX, PY + 40]; s += `<ellipse cx="${q[0]}" cy="${q[1]}" rx="210" ry="86" fill="none" stroke="${look.rim}" stroke-width="5"/><ellipse cx="${q[0]}" cy="${q[1]}" rx="170" ry="66" fill="${look.seam}" opacity=".35"/>`;
    return s + '</g>';
  };
  const streets = { first: () => streetStage('first'), middle: () => streetStage('middle'), last: () => streetStage('last') };
  /* Shops seen from the front. They stand on the square, so the child can walk in front of them. */
  const shop = (wall, cap, awning, sign, tall) => { const top = tall ? 12 : 58, n = 7, w = 168 / n; let m = `<rect x="16" y="${top}" width="168" height="${194 - top}" fill="${wall}" stroke="${L}" stroke-width="5"/><rect x="8" y="${top - 12}" width="184" height="18" rx="5" fill="${cap}" stroke="${L}" stroke-width="5"/>`;
    if (tall) for (const x of [36, 86, 136]) m += `<rect x="${x}" y="32" width="30" height="40" rx="3" fill="${x === 86 ? '#f7e6b0' : '#cfeaf2'}" stroke="${L}" stroke-width="4"/><path d="M${x + 15} 32v40" stroke="${L}" stroke-width="3"/>`;
    m += `<circle cx="100" cy="${tall ? 94 : 78}" r="16" fill="#fff8ea" stroke="${L}" stroke-width="4"/>${sign(100, tall ? 94 : 78)}`;
    for (let i = 0; i < n; i++) m += `<path d="M${16 + i * w} 112h${w}v20c-${w / 2} 12-${w} 12-${w} 0z" fill="${i % 2 ? '#fff8ea' : awning}" stroke="${L}" stroke-width="3.5" stroke-linejoin="round"/>`;
    return m + `<rect x="30" y="138" width="42" height="56" rx="3" fill="${C.woodD}" stroke="${L}" stroke-width="4"/><circle cx="62" cy="168" r="3.5" fill="${C.mus}"/><rect x="84" y="142" width="88" height="40" rx="3" fill="#cfeaf2" stroke="${L}" stroke-width="4"/><path d="M128 142v40" stroke="${L}" stroke-width="3"/>`; };
  const signs = { bread: (x, y) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="6" fill="${C.woodD}"/>`, flower: (x, y) => `<circle cx="${x}" cy="${y}" r="4" fill="${C.mus}"/>` + [0, 72, 144, 216, 288].map(a => `<circle cx="${x + Math.cos(a * .01745) * 7}" cy="${y + Math.sin(a * .01745) * 7}" r="4" fill="${C.terra}"/>`).join(''), book: (x, y) => `<rect x="${x - 8}" y="${y - 7}" width="16" height="14" fill="${C.blue}"/>`, star: (x, y) => `<path d="${K.starPath(x, y, 10, 4.5)}" fill="${C.mus}"/>` };
  Object.assign(K.props, { shop1: shop(C.teal, C.stone, C.terra, signs.bread, true), shop2: shop('#e7c39a', C.woodD, C.teal, signs.flower, false), shop3: shop(C.terra, C.stone, C.mus, signs.star, true), shop4: shop(C.cream, C.woodD, C.blue, signs.book, false), shop5: shop(C.sage, C.stone, C.terra, signs.bread, true), shop6: shop(C.blue, C.woodD, C.mus, signs.star, false), shop7: shop(C.plum, C.stone, C.mus, signs.flower, false), shop8: shop(C.mus, C.woodD, C.teal, signs.book, true) });
  const SHOPS = { first: ['shop1', 'shop2', 'shop3', 'shop4', 'shop5'], middle: ['shop7', 'shop4', 'shop8', 'shop2', 'shop6'], last: ['shop6', 'shop3', 'shop2', 'shop5', 'shop8'] };

  /* ---------- islands ---------- */
  const IX = 790, IY = 492, sx = x => IX + x * .84, sy = y => IY + y * .62;
  const blob = points => { const n = 72, r = new Array(n).fill(0); for (const [x, y] of points) { const a = Math.atan2(y - IY, x - IX), d = Math.hypot(x - IX, y - IY); for (let i = 0; i < n; i++) { let t = Math.abs(i / n * 2 * Math.PI - (a + 2 * Math.PI) % (2 * Math.PI)); t = Math.min(t, 2 * Math.PI - t); if (t < .42) r[i] = Math.max(r[i], d + 44 + Math.cos(t * 3.7) * 12); } } for (let i = 0; i < n; i++) r[i] = Math.max(r[i], 230); for (let p = 0; p < 4; p++) { const c = r.slice(); for (let i = 0; i < n; i++) r[i] = (c[(i + n - 1) % n] + c[i] * 2 + c[(i + 1) % n]) / 4; } return r; };
  const ring = (r, add, dy = 0) => r.map((v, i) => { const a = i / r.length * 2 * Math.PI; return [IX + Math.cos(a) * (v + add), IY + Math.sin(a) * (v + add) * .86 + dy]; });
  const path = (a, f, st, w) => `<polygon points="${a.map(q => q.map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${f}" stroke="${st}" stroke-width="${w}" stroke-linejoin="round"/>`;
  const island = (r, sea, grass, grassD, sand) => {
    let s = ''; for (let i = 0; i < 150; i++) { const x = rnd(i) * 2100 - 250, y = rnd(i + 200) * 1200 - 150; s += `<path d="M${x} ${y}q14-8 28 0t28 0" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`; }
    s += path(ring(r, 62), '#ffffff', 'none', 0).replace('<polygon', '<polygon opacity=".45"') + path(ring(r, 40, 16), '#c9a56f', L, 2.6) + path(ring(r, 40), sand, L, 2.6) + path(ring(r, 2), grass, L, 2.2);
    for (let i = 0; i < 26; i++) { const a = rnd(i + 40) * 6.28, d = rnd(i + 90) * .82, v = r[Math.floor(a / 6.28 * 72) % 72] * d; const x = IX + Math.cos(a) * v, y = IY + Math.sin(a) * v * .86; s += `<ellipse cx="${x}" cy="${y}" rx="${40 + rnd(i) * 60}" ry="${16 + rnd(i + 3) * 18}" fill="${grassD}" opacity=".5"/>`; }
    for (let i = 0; i < 80; i++) { const a = rnd(i + 300) * 6.28, d = rnd(i + 390) * .9, v = r[Math.floor(a / 6.28 * 72) % 72] * d; const x = IX + Math.cos(a) * v, y = IY + Math.sin(a) * v * .86; s += i % 4 ? `<path d="M${x - 5} ${y}l3-8 2 7 3-9 2 10" fill="none" stroke="${grassD}" stroke-width="2" stroke-linecap="round"/>` : `<circle cx="${x}" cy="${y}" r="3.5" fill="${['#f7e6b0', '#ef9a8a', '#ffffff'][i % 3]}"/>`; }
    return s;
  };

  /* ---------- characters ---------- */
  const skinTone = '#fbd7b5', cheek = '#f4a596';
  const outfits = { girl: { hair: '#8a5a3c', hairD: '#6e4630', top: '#e78fa6', topD: '#cf6f89', low: '#a98fc4', shoe: '#e7bb5a', pack: '#6ba39b', trim: '#fbf0e0' }, boy: { hair: '#6b4630', hairD: '#553524', top: '#7fb0d6', topD: '#5f93bb', low: '#5f7a9c', shoe: '#cf7a56', pack: '#e0a25c', trim: '#fbf0e0' } };
  const st = `stroke="${L}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;
  const hero = kind => {
    const c = outfits[kind], girl = kind === 'girl';
    const face = `<path d="M38 106c0-46 28-72 62-72s62 26 62 72c0 40-28 62-62 62s-62-22-62-62z" fill="${skinTone}" ${st}/><ellipse cx="60" cy="130" rx="12" ry="8" fill="${cheek}" opacity=".7"/><ellipse cx="140" cy="130" rx="12" ry="8" fill="${cheek}" opacity=".7"/><path d="M98 126q3 3 5 0" fill="none" ${st}/>`;
    const smile = `<path d="M88 142q12 10 24 0" fill="none" ${st}/>`;
    const fringeG = `<path d="M34 108c-4-52 30-84 66-84s70 32 66 84c-6-18-16-32-30-40-6 14-20 22-38 24 6-8 6-14 4-22-16 16-38 24-58 22-6 4-8 8-10 16z" fill="${c.hair}" ${st}/><path d="M60 46c10-8 24-12 36-10M128 44c8 4 14 10 18 18" fill="none" stroke="${c.hairD}" stroke-width="3" stroke-linecap="round"/><path d="M144 44c-16-18-34-10-30 6 2 10 16 10 30-6zM144 44c16-18 34-10 30 6-2 10-16 10-30-6z" fill="${C.mus}" ${st}/><circle cx="144" cy="44" r="8" fill="${C.terra}" ${st}/>`;
    const fringeB = `<path d="M34 104c-8-54 28-82 68-80 42 2 68 30 62 80-4-14-12-28-24-36-2 10-10 16-20 18 2-8 0-14-4-18-12 14-34 22-56 20 4-6 4-10 2-14-14 8-24 18-28 30z" fill="${c.hair}" ${st}/><path d="M104 24c-6-12 2-22 12-20 2 8 0 14-4 20" fill="${c.hair}" ${st}/><path d="M64 44c12-8 26-10 38-8" fill="none" stroke="${c.hairD}" stroke-width="3" stroke-linecap="round"/>`;
    const hairBack = girl ? `<path d="M36 96C10 118 8 170 30 192c14-2 26-14 30-34zM164 96c26 22 28 74 6 96-14-2-26-14-30-34z" fill="${c.hair}" ${st}/><path d="M28 150q10-6 20 0M172 150q-10-6-20 0" fill="none" stroke="${c.hairD}" stroke-width="3" stroke-linecap="round"/>` : `<rect x="0" y="0" width="1" height="1" fill="none"/>`;
    const backHead = girl ? `${hairBack}<path d="M34 108c-4-54 30-84 66-84s70 30 66 84c2 40-26 62-66 62s-68-22-66-62z" fill="${c.hair}" ${st}/><path d="M100 28v60M70 40c-6 24-6 44-2 66M130 40c6 24 6 44 2 66" fill="none" stroke="${c.hairD}" stroke-width="3" stroke-linecap="round"/><path d="M144 44c-16-18-34-10-30 6 2 10 16 10 30-6zM144 44c16-18 34-10 30 6-2 10-16 10-30-6z" fill="${C.mus}" ${st}/><circle cx="144" cy="44" r="8" fill="${C.terra}" ${st}/>` : `<circle cx="36" cy="112" r="11" fill="${skinTone}" ${st}/><circle cx="164" cy="112" r="11" fill="${skinTone}" ${st}/><path d="M36 110c-6-54 28-84 66-84 40 0 68 30 62 84 0 38-26 58-64 58s-64-20-64-58z" fill="${c.hair}" ${st}/><path d="M104 28c-6-12 2-22 12-20 2 8 0 14-4 20M72 46c-6 22-6 40-2 58M130 46c6 22 6 40 2 58" fill="${c.hair}" ${st}/>`;
    const torso = girl ? `<path d="M62 62c10-14 66-14 76 0l10 66c6 22 8 32 8 38-34 14-78 14-112 0 0-6 2-16 8-38z" fill="${c.top}" ${st}/><path d="M50 150c32 12 68 12 100 0" fill="none" stroke="${c.trim}" stroke-width="6" stroke-linecap="round"/>` : `<path d="M60 64c12-12 68-12 80 0l6 86c-30 10-62 10-92 0z" fill="${c.top}" ${st}/><path d="M54 146c30 10 62 10 92 0l2 22c-30 10-66 10-96 0z" fill="${c.low}" ${st}/>`;
    const front = `${torso}<path d="M78 58l22 18 22-18-8-8H86z" fill="${c.trim}" ${st}/><path d="M72 66c0 34 2 44 12 52M128 66c0 34-2 44-12 52" fill="none" stroke="${c.pack}" stroke-width="9" stroke-linecap="round"/><path d="M100 104c-16-10-18-20-14-24 4-4 10-2 14 3 4-5 10-7 14-3 4 4 2 14-14 24z" fill="${c.trim}" ${st}/>`;
    const back = `${torso}<rect x="62" y="64" width="76" height="86" rx="22" fill="${c.pack}" ${st}/><rect x="76" y="104" width="48" height="34" rx="10" fill="#80b8af" ${st}/><path d="M82 120h36" ${st} fill="none"/><path d="M86 66c0-14 28-14 28 0" fill="none" ${st}/>`;
    const arm = `<path d="M100 20c-16 0-20 12-20 26v62h40V46c0-14-4-26-20-26z" fill="${c.top}" ${st}/><path d="M80 104h40" stroke="${c.trim}" stroke-width="8"/><path d="M84 110h32v28c0 22-32 22-32 0z" fill="${skinTone}" ${st}/>`;
    const leg = `<path d="M76 10h48v92H76z" fill="${girl ? skinTone : c.low}" ${st}/><path d="M74 96h52v34H74z" fill="${c.trim}" ${st}/><path d="M64 128h72c16 0 24 12 24 26v12H64z" fill="${c.shoe}" ${st}/><rect x="60" y="158" width="104" height="14" rx="6" fill="#fff6e6" ${st}/>`;
    return { head_f: face + smile + (girl ? fringeG : fringeB), head_b: backHead, hair_f: hairBack, body_f: front, body_b: back, arm, leg };
  };
  const faceBits = { eyes: `<ellipse cx="78" cy="110" rx="9" ry="11" fill="#3f2a1e"/><circle cx="81" cy="105" r="3.6" fill="#fff"/><circle cx="75" cy="115" r="1.8" fill="#fff" opacity=".8"/><ellipse cx="122" cy="110" rx="9" ry="11" fill="#3f2a1e"/><circle cx="125" cy="105" r="3.6" fill="#fff"/><circle cx="119" cy="115" r="1.8" fill="#fff" opacity=".8"/>`, closed: `<path d="M68 112q10 8 20 0M112 112q10 8 20 0" fill="none" ${st.replace('width="3"', 'width="4"')}/>`, happy: `<path d="M68 116q10-14 20 0M112 116q10-14 20 0" fill="none" ${st.replace('width="3"', 'width="4.5"')}/>`, mouth: `<path d="M86 138h28c2 18-6 26-14 26s-16-8-14-26z" fill="#a13f4c" ${st}/><ellipse cx="100" cy="156" rx="8" ry="5" fill="#ef8d97"/>` };

  /* ---------- rides and doors ---------- */
  const door = open => { const pts = (a, f) => poly(a, f); const x0 = 8.2, x1 = 9.5; return pts([[x0 - .12, 0, 0], [x1 + .12, 0, 0], [x1 + .12, 0, 2.5], [x0 - .12, 0, 2.5]], C.woodD) + (open ? pts([[x0, 0, 0], [x1, 0, 0], [x1, 0, 2.38], [x0, 0, 2.38]], '#fbeab8') + pts([[x0, 0, 0], [x0, .95, 0], [x0, .95, 2.38], [x0, 0, 2.38]], C.wood) : pts([[x0, 0, 0], [x1, 0, 0], [x1, 0, 2.38], [x0, 0, 2.38]], C.wood) + pts([[x0 + .16, 0, 1.3], [x1 - .16, 0, 1.3], [x1 - .16, 0, 2.2], [x0 + .16, 0, 2.2]], C.woodL) + pts([[x0 + .16, 0, .18], [x1 - .16, 0, .18], [x1 - .16, 0, 1.08], [x0 + .16, 0, 1.08]], C.woodL) + circleAt(iso(x1 - .14, 0, 1.16), 5, C.mus)); };

  /* ---------- world layout data ---------- */
  const mapRoom = (x, y) => [1.5 + (x + 600) / 1200 * 7.6, Math.max(1.7, Math.min(7.5, 1.9 + (y + 150) / 380 * 5.4))];
  const onScreen = q => ({ x: +q[0].toFixed(1), y: +q[1].toFixed(1) });
  const HIGH_ROOMS = { first: [[.4, 2.15, 2.52, 1.5, 2.2], [1.35, .22, 2.02, 1.4, 1.6]], middle: [[.45, 1.7, 2.72, 1.5, 1.7], [1.45, .22, 2.12, 1.5, 1.7]], last: [[.45, 1.9, 2.77, 1.5, 2.1], [2.3, .22, 2.17, 2.3, 1.6]] };
  const buildLayouts = () => {
    const SC = window.ArticulationScenes;
    const worlds = {};
  for (const scene of ['islands', 'house', 'street']) {
    const def = SC[scene]; worlds[scene] = [];
    for (const id of ['first', 'middle', 'last']) {
      const st2 = def.stages[id], out = { id, bg: `${scene}_${id}`, ground: [], high: [], covers: [], decor: [], ride: st2.ride || null };
      if (scene === 'islands') {
        const P = ([x, y]) => [sx(x), sy(y)], all = [...st2.slots, ...st2.empties.map(e => [e[1], e[2]]), ...st2.decor.map(d => [d[1], d[2]])].map(P), r = blob(all); out.r = r; out.walk = ring(r, 16).map(q => q.map(v => +v.toFixed(1))); out.hero = onScreen([IX - 60, IY + 40]);
        for (const s of st2.slots) { const [x, y] = P(s); if (s[2] === 'high') out.high.push({ x, y, holder: s[3], stand: onScreen([x + 56, y + 16]) }); else if (s[2] === 'hidden') out.covers.push({ x, y, holder: s[3], full: true }); else out.ground.push({ x, y }); }
        for (const e of st2.empties) { const [x, y] = P([e[1], e[2]]); out.covers.push({ x, y, holder: e[0], full: false }); }
        for (const d of st2.decor) { const [x, y] = P([d[1], d[2]]); out.decor.push({ key: d[0], x, y, s: d[3] }); }
        const shore = out.walk[0]; if (out.ride) out.dock = { x: Math.min(1450, shore[0] + 120), y: shore[1] + 14, standx: shore[0] - 40, standy: shore[1] + 10 }; out.arrive = { x: Math.max(150, out.walk[36][0] - 120), y: out.walk[36][1] + 10, standx: out.walk[36][0] + 40, standy: out.walk[36][1] + 10 };
      } else if (scene === 'house') {
        const P = ([x, y]) => { const m = mapRoom(x, y); return iso(id === 'last' ? 3.6 + (m[0] - 1.5) * .74 : m[0], m[1]); }; out.walk = (id === 'last' ? [iso(1.2, 1.5), iso(9.5, 1.5), iso(9.5, 7.7), iso(3.2, 7.7), iso(3.2, 3.2), iso(1.2, 3.2)] : [iso(1.2, 1.5), iso(9.5, 1.5), iso(9.5, 7.7), iso(1.2, 7.7)]).map(q => q.map(v => +v.toFixed(1))); out.hero = onScreen(iso(5.2, 7)); let h = 0;
        for (const s of st2.slots) { const [x, y] = P(s); if (s[2] === 'high') { const a = HIGH_ROOMS[id][h++], q = iso(a[0], a[1], a[2]); out.high.push({ x: q[0], y: q[1], holder: null, stand: onScreen(iso(a[3], a[4])) }); } else if (s[2] === 'hidden') out.covers.push({ x, y, holder: s[3], full: true }); else out.ground.push({ x, y }); }
        for (const e of st2.empties) { const [x, y] = P([e[1], e[2]]); out.covers.push({ x, y, holder: e[0], full: false }); }
        if (id !== 'last') out.door = { stand: onScreen(iso(8.85, 1.65)), lock: onScreen(iso(9.05, 0, 1.3)) };
      } else {
        const ring = plazaRing(id), walkPoly = ring.map(([x, y]) => [+(PX + (x - PX) * .93).toFixed(1), +Math.max(330, PY + (y - PY) * .93).toFixed(1)]), P = ([x, y]) => [PX + x * .95, 512 + y * .9];
        out.walk = walkPoly; out.hero = onScreen([380, 520]);
        for (const s of st2.slots) { const [x, y] = P(s); if (s[2] === 'high') out.high.push({ x, y, holder: s[3], stand: onScreen([x + 56, y + 16]) }); else if (s[2] === 'hidden') out.covers.push({ x, y, holder: s[3], full: true }); else out.ground.push({ x, y }); }
        for (const e of st2.empties) { const [x, y] = P([e[1], e[2]]); out.covers.push({ x, y, holder: e[0], full: false }); }
        for (const d of st2.decor) out.decor.push({ key: d[0], x: PX + d[1] * .95, y: 352, s: d[3] * .9 });
        out.fixedDecor = SHOPS[id].map((key, i) => ({ key, x: PX + (i - 2) * 250, y: 322, s: 1.62 }));
        for (const [x, y] of [[66, 330], [1534, 330], [40, 640], [1560, 640]]) out.fixedDecor.push({ key: 'tree', x, y, s: .8 });
        const curb = x => groundBelow(walkPoly, x) - 10, ground = ROAD_GROUND;
        if (out.ride) { out.dock = { x: 1150, y: ground, standx: 1150, standy: curb(1150) }; out.decor.push({ key: out.ride === 'bus' ? 'busstop' : 'taxisign', x: 1262, y: curb(1262), s: .55 }); }
        out.arrive = { x: 320, y: ground, standx: 320, standy: curb(320) };
      }
      /* Push things apart so a child can always see and tap each one. */
      {
        const walkPoly = out.walk, inside = (x, y) => { let c = false; for (let i = 0, j = walkPoly.length - 1; i < walkPoly.length; j = i++) { const a = walkPoly[i], b = walkPoly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
        const mov = [...out.ground, ...out.covers], fixed = [{ x: out.hero.x, y: out.hero.y, m: 150 }, ...out.high.map(h => ({ x: h.stand.x, y: h.stand.y, m: 100 })), ...out.decor.filter(d => d.key !== 'flower').map(d => ({ x: d.x, y: d.y, m: 96 }))];
        const MIN = 138;
        for (let it = 0; it < 240; it++) {
          for (let i = 0; i < mov.length; i++) { for (let j = i + 1; j < mov.length; j++) { let dx = mov[j].x - mov[i].x, dy = (mov[j].y - mov[i].y) * 1.25, d = Math.hypot(dx, dy) || 1; if (d < MIN) { const k = (MIN - d) / d * .25; mov[i].x -= dx * k; mov[i].y -= dy * k; mov[j].x += dx * k; mov[j].y += dy * k; } } for (const f of fixed) { let dx = mov[i].x - f.x, dy = (mov[i].y - f.y) * 1.25, d = Math.hypot(dx, dy) || 1; if (d < f.m) { const k = (f.m - d) / d * .5; mov[i].x += dx * k; mov[i].y += dy * k; } } }
          for (const a of mov) { let guard = 0; while ((!inside(a.x, a.y) || !inside(a.x - 60, a.y) || !inside(a.x + 60, a.y) || !inside(a.x, a.y + 26)) && guard++ < 60) { a.x += (out.hero.x - a.x) * .03; a.y += (out.hero.y - a.y) * .03; } }
        }
        for (const a of mov) { a.x = +a.x.toFixed(1); a.y = +a.y.toFixed(1); }
      }
      if (out.fixedDecor) { out.decor.push(...out.fixedDecor); delete out.fixedDecor; }
      delete out.r; worlds[scene].push(out);
    }
  }
    return worlds;
  };

  /* ---------- what the rest of the game asks for ---------- */
  const SEA = { first: '#a9dbe6', middle: '#a1d3e6', last: '#b2dfe0' }, GRASS = { first: ['#b9d68f', '#9fc378', '#ecd9a8'], middle: ['#a8cc8e', '#8fb677', '#e6d3a4'], last: ['#c7d893', '#adc47c', '#f0dcae'] };
  const backgroundOf = (scenario, id) => scenario === 'islands' ? SEA[id] : scenario === 'house' ? '#e3eed2' : STREET[id].lawn;
  function stageSVG(scenario, id) {
    if (scenario === 'house') return scene(backgroundOf(scenario, id), rooms[id]());
    if (scenario === 'street') return scene(backgroundOf(scenario, id), streets[id]());
    const raw = window.ArticulationScenes.islands.stages[id], g = GRASS[id];
    const all = [...raw.slots, ...raw.empties.map(e => [e[1], e[2]]), ...raw.decor.map(d => [d[1], d[2]])].map(q => [sx(q[0]), sy(q[1])]);
    return scene(SEA[id], island(blob(all), SEA[id], g[0], g[1], g[2]));
  }
  let layouts = null;
  const layout = (scenario, id) => { layouts = layouts || buildLayouts(); return layouts[scenario].find(entry => entry.id === id); };
  /* The hand-drawn wobble. Used for art painted onto the game canvas; small pictures on screens go without it. */
  const drawn = (body, size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200"><defs>${WOB('w', '.03', 2)}</defs><g filter="url(#w)">${body}</g></svg>`;
  const plain = (body, size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200">${body}</svg>`;
  const characterParts = kind => { const parts = { ...hero(kind), face_eyes: faceBits.eyes, face_closed: faceBits.closed, face_happy: faceBits.happy, face_mouth: faceBits.mouth }; return Object.fromEntries(Object.entries(parts).map(([key, body]) => [key, drawn(body, 320)])); };
  const portrait = kind => { const p = hero(kind); return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="240" viewBox="0 -60 200 240">${p.body_f}<g transform="translate(14 -66) scale(.86)">${p.hair_f}${p.head_f}${faceBits.eyes}</g></svg>`; };
  const doorSVG = open => `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="520" viewBox="1130 350 180 260">${door(open)}</svg>`;
  return { skin, drawn, plain, stageSVG, layout, backgroundOf, characterParts, portrait, doorSVG, iso };
})();
