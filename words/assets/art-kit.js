/* The drawing kit every sound and scene shares: palette, outlines, faces and helpers. See docs/articulation-sounds.md. */
window.ArticulationKit = (() => {
  const INK = '#2f4560';
  const S = `stroke="${INK}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
  const T = `stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round" fill="none"`;

  /* Each colour runs light to dark from top to bottom of whatever shape uses it. */
  const PALETTE = {
    fur: ['#ffffff', '#e9dfd6'], cream: ['#fffdf7', '#ecdfcf'], gold: ['#ffe692', '#f6b42e'], mane: ['#f7a64e', '#d46a1c'], orange: ['#ffb684', '#ee7a3f'], red: ['#ff9a92', '#e2464d'],
    berry: ['#fab3cb', '#e4628f'], pinkin: ['#ffd0da', '#f393aa'], skin: ['#ffe0c4', '#f5bd94'], skinD: ['#f4b68c', '#df9068'], sky: ['#9fe2ff', '#4cb0ea'], skyb: ['#7fd0f7', '#d4f1ff'], water: ['#b4edff', '#2f9be4'],
    teal: ['#aaeae2', '#46b5ac'], green: ['#aee991', '#4fb362'], leaf: ['#8fdb7f', '#37945a'], purple: ['#e1c4f6', '#a273d6'], grey: ['#e4e9ef', '#a9b6c5'], steel: ['#f3f7fb', '#98adc0'], wolf: ['#bcc7d5', '#7a8a9f'],
    wood: ['#dfa96f', '#a56a37'], brown: ['#8f5e3f', '#553420'], white: ['#ffffff', '#dde8f1'], blue: ['#8ec5f5', '#3f83d6'], navy: ['#6f8fc0', '#3d5a8c'], stone: ['#d5d9dc', '#9aa4ad'], amber: ['#f2ae62', '#c0651f'],
    dusk: ['#ffd98f', '#ffefc9'], dune1: ['#f9d28c', '#eab45f'], dune2: ['#f3bd6c', '#d9913f'], frost: ['#a9daf5', '#e5f5fd'], snow: ['#ffffff', '#d4e6f3'], sea: ['#58c1e6', '#2a92c9'], sandy: ['#ffe9b8', '#f2cd86'],
    bulb: ['#fff6bd', '#ffc93c'], cloth: ['#ffffff', '#f4dfe4'], moss: ['#a6dc82', '#5eab62'], shell: ['#ffdfe3', '#f4a8b5'], violet: ['#c9a4f0', '#7f55c4'], flame: ['#ffc25c', '#ee5a2b'],
    onion: ['#f6cf94', '#c98a44'], melon: ['#ff8f8f', '#e8444f'], rind: ['#8ed07a', '#3f9a55'], grape: ['#b79be8', '#6a45b8'], choco: ['#b07a54', '#6b4226'], date: ['#a56a3f', '#5c3317'], whale: ['#8fc3ee', '#3d79c9'], oil: ['#eee484', '#b2b13a'], butter: ['#fff0a8', '#f5cf4e'], slate: ['#4f7064', '#2f4a41'], fig: ['#9a78c9', '#5b3d8f'], figin: ['#ff9db0', '#e5566f'], taxi: ['#ffe27a', '#f4b52e'], asphalt: ['#7d8a96', '#5f6c78'],
  };
  const F = name => `fill="url(#p-${name})"`;
  const paletteDefs = body => {
    const names = [...new Set([...body.matchAll(/url\(#p-(\w+)\)/g)].map(match => match[1]))];
    return names.length ? `<defs>${names.map(name => `<linearGradient id="p-${name}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${PALETTE[name][0]}"/><stop offset="1" stop-color="${PALETTE[name][1]}"/></linearGradient>`).join('')}</defs>` : '';
  };

  const eye = (x, y, r = 9) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.18}" fill="${INK}"/><circle cx="${x + r * .32}" cy="${y - r * .44}" r="${r * .38}" fill="#fff"/><circle cx="${x - r * .32}" cy="${y + r * .46}" r="${r * .17}" fill="#fff" opacity=".85"/>`;
  const cheeks = (a, b, y) => `<ellipse cx="${a}" cy="${y}" rx="11" ry="7" fill="#ff9aa2" opacity=".55"/><ellipse cx="${b}" cy="${y}" rx="11" ry="7" fill="#ff9aa2" opacity=".55"/>`;
  const gloss = (d, width = 7) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${width}" stroke-linecap="round" opacity=".7"/>`;
  const tube = (d, color, width) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${width + 10}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const scallop = (cx, cy, r, n, bump) => {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const t = i / n * Math.PI * 2 - Math.PI / 2, x = (cx + Math.cos(t) * r).toFixed(1), y = (cy + Math.sin(t) * r).toFixed(1);
      d += i ? `A${bump} ${bump} 0 0 1 ${x} ${y}` : `M${x} ${y}`;
    }
    return d + 'Z';
  };
  const starPath = (cx, cy, R, r) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const t = i / 10 * Math.PI * 2 - Math.PI / 2, far = i % 2 ? r : R;
      d += `${i ? 'L' : 'M'}${(cx + Math.cos(t) * far).toFixed(1)} ${(cy + Math.sin(t) * far).toFixed(1)}`;
    }
    return d + 'Z';
  };
  const cloud = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><g fill="#fff"><circle cx="-26" cy="4" r="18"/><circle cx="0" cy="-8" r="26"/><circle cx="26" cy="4" r="18"/><rect x="-44" y="2" width="88" height="20" rx="10"/></g><path d="M-38 15h76c5 0 8 4 6 7h-88c-2-3 1-7 6-7z" fill="#cfe6f7"/></g>`;
  /* One outline around a whole cluster of circles, for tree tops and bushes. */
  const clump = (circles, fill) => `<g fill="${INK}">${circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 5}"/>`).join('')}</g><g fill="${fill}">${circles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;
  const dots = (list, fill, r = 5) => `<g fill="${fill}">${list.map(([x, y, size]) => `<circle cx="${x}" cy="${y}" r="${size || r}"/>`).join('')}</g>`;
  const vignette = body => `<circle cx="100" cy="100" r="93" fill="#fff" ${S}/><defs><clipPath id="c"><circle cx="100" cy="100" r="83"/></clipPath></defs><g clip-path="url(#c)">${body}</g><circle cx="100" cy="100" r="83" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".35"/>`;

  /* Shared stroke presets can be overridden per shape; XML allows each attribute once, so the last one wins. */
  const tidy = body => body.replace(/<([a-zA-Z]+)((?:\s+[\w:-]+="[^"]*")+)\s*(\/?)>/g, (tag, name, attrs, end) => {
    const seen = new Map();
    for (const [, key, value] of attrs.matchAll(/([\w:-]+)="([^"]*)"/g)) seen.set(key, value);
    return `<${name}${[...seen].map(([key, value]) => ` ${key}="${value}"`).join('')}${end}>`;
  });
  const svg = (body, w = 200, h = 200, vb = '0 0 200 200') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vb}">${paletteDefs(body)}${tidy(body)}</svg>`;
  const uri = text => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);

  const seeded = seed => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const words = {}, shapes = {}, props = {};
  /* Shared pieces for word drawings: a thin line, a gold star that marks a body part, a sparkle, and a child's head and face. */
  const line = (d, color, width = 3.5) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const spot = (x, y, r = 28) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff3b0" opacity=".85" stroke="#f0b63b" stroke-width="6"/><path d="${starPath(x, y, r * .55, r * .25)}" fill="#ffc93c" stroke="#e39a17" stroke-width="2.5" stroke-linejoin="round"/>`;
  const sparkle = (x, y, r = 12) => `<path d="${starPath(x, y, r, r * .3)}" fill="#ffc93c" stroke="#e39a17" stroke-width="2" stroke-linejoin="round"/>`;
  const head = (x, y, r, hair) => `<circle cx="${x}" cy="${y}" r="${r}" ${F('skin')} ${S}/><g transform="translate(${x} ${y}) scale(${r / 40})"><path d="M-44-4c-6-38 26-44 44-44 28 0 50 16 44 44-6-12-16-22-28-24-14 6-32 8-44 4-6 2-14 8-16 20z" ${F(hair)} ${S}/></g>`;
  const face = (x, y, r) => `${eye(x - r * .38, y + r * .14, r * .18)}${eye(x + r * .38, y + r * .14, r * .18)}<path d="M${x - r * .22} ${y + r * .52}q${r * .22} ${r * .22} ${r * .44} 0" ${T}/>`;
  return { line, spot, sparkle, head, face, INK, S, T, F, eye, cheeks, gloss, tube, scallop, starPath, cloud, clump, dots, vignette, svg, uri, seeded, words, shapes, props };
})();
