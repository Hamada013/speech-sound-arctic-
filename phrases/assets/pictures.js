/* One picture for each phrase, composed from the words part's drawings in the approved look (skin() in art-cozy.js):
   the objects placed and sized to show what the phrase says, with small marks for a mood. 320 by 240.
   The first thing named in the phrase sits on the right, because the phrase reads right to left.
   Sentences add 'act' (someone eats, holds, sees, plays with or rides something, maybe somewhere), 'at' (someone somewhere)
   and 'two' (two together); a place is drawn as sea, sky, night or a faded backdrop. */
window.PhrasePictures = (() => {
  const K = window.ArticulationKit, Cozy = window.ArticulationCozy, L = '#5a3d2b';
  const skinned = new Map(), uris = new Map();
  const art = key => { if (!skinned.has(key)) skinned.set(key, Cozy.skin(K.words[key])); return skinned.get(key); };
  /* A drawing from the kit (drawn in a 200 box) at x, y and this size. */
  const put = (key, x, y, size) => `<g transform="translate(${x} ${y}) scale(${(size / 200).toFixed(3)})">${art(key)}</g>`;
  const shadow = (cx, y, w) => `<ellipse cx="${cx}" cy="${y}" rx="${w / 2}" ry="${Math.max(4, w * .07)}" fill="${L}" opacity=".12"/>`;
  const line = (w = 3) => `fill="none" stroke="${L}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
  const GROUND = `<rect width="320" height="240" fill="#f6ecd8"/><path d="M0 186Q160 172 320 186V240H0Z" fill="#d9e4bf"/>`;
  const cloud = (x, y, s) => `<path d="M${x} ${y}c-10 0-10-12 0-12 2-9 16-11 20-3 6-5 17-1 16 7 8 1 8 8 0 8Z" transform="translate(${x} ${y}) scale(${s}) translate(${-x} ${-y})" fill="#fffaf0" stroke="${L}" stroke-width="2"/>`;
  const SKY = `<rect width="320" height="240" fill="#d8ecf0"/>${cloud(40, 50, 1.2)}${cloud(250, 200, 1)}${cloud(270, 40, .8)}`;
  const SEA = `<rect width="320" height="240" fill="#d8ecf0"/><path d="M0 150q20-10 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0V240H0Z" fill="#8fc0d6" stroke="${L}" stroke-width="2"/>`;
  const FLAT = new Set(['plate', 'dish', 'leafword', 'hand']), WATER = new Set(['sea', 'pond', 'lake']);
  const KIDS = { boy: 'boy', girl: 'kidgirl', kidgirl: 'kidgirl' };

  /* Small marks that show a mood: asleep, moving, hot, cold, shining, happy, making a sound. */
  const MOODS = {
    sleep: () => [[238, 42, 1], [258, 24, .8], [274, 10, .6]].map(([x, y, s]) => `<path d="M${x} ${y}h${14 * s}l${-14 * s} ${14 * s}h${14 * s}" ${line(3)}/>`).join(''),
    run: () => [[262, 92, 34], [270, 112, 44], [262, 132, 30]].map(([x, y, w]) => `<path d="M${x} ${y}h${w}" ${line(4)} opacity=".55"/>`).join(''),
    hot: () => [118, 160, 202].map(x => `<path d="M${x} 46c-8-10 8-14 0-26s8-14 0-22" ${line(3)} opacity=".55"/>`).join(''),
    cold: () => [[46, 50], [270, 40], [282, 120], [36, 130]].map(([x, y]) => `<path d="M${x - 8} ${y}h16M${x} ${y - 8}v16M${x - 6} ${y - 6}l12 12M${x + 6} ${y - 6}l-12 12" ${line(2.4)} stroke="#6fa9d0"/>`).join(''),
    shine: () => [[56, 46, 1], [266, 36, .8], [276, 140, .7], [44, 140, .6]].map(([x, y, s]) => `<path d="M${x} ${y - 14 * s}q${3 * s} ${11 * s} ${14 * s} ${14 * s}q${-11 * s} ${3 * s} ${-14 * s} ${14 * s}q${-3 * s} ${-11 * s} ${-14 * s} ${-14 * s}q${11 * s} ${-3 * s} ${14 * s} ${-14 * s}Z" fill="#f3d27a" stroke="${L}" stroke-width="2"/>`).join(''),
    happy: () => [[54, 50, 1], [268, 40, .8], [276, 128, .6]].map(([x, y, s]) => `<path d="M${x} ${y + 10 * s}c${-14 * s} ${-9 * s} ${-12 * s} ${-22 * s} 0 ${-16 * s}c${12 * s} ${-6 * s} ${14 * s} ${7 * s} 0 ${16 * s}Z" fill="#ef9a8a" stroke="${L}" stroke-width="2"/>`).join(''),
    sing: () => [[56, 50], [262, 36], [276, 112]].map(([x, y]) => `<path d="M${x} ${y}v-20l12-4v20" ${line(2.6)}/><ellipse cx="${x - 3}" cy="${y}" rx="5" ry="4" fill="${L}"/><ellipse cx="${x + 9}" cy="${y - 4}" rx="5" ry="4" fill="${L}"/>`).join(''),
  };

  /* Sentences also say where: water and sky become the background, anything else is a faded backdrop behind the scene. */
  const SKIES = new Set(['sky', 'night', 'winter', 'rainfall']);
  function backdrop(place) {
    if (!place) return GROUND;
    if (WATER.has(place) || place === 'river' || place === 'beach') return SEA;
    if (SKIES.has(place)) return place === 'night' ? `<rect width="320" height="240" fill="#3f4f6e"/><circle cx="270" cy="44" r="22" fill="#f6e7b0"/>${[[40, 40], [90, 70], [200, 30], [150, 90], [60, 120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.5" fill="#f6e7b0"/>`).join('')}<path d="M0 190Q160 176 320 190V240H0Z" fill="#6f8a6a"/>` : SKY;
    return GROUND + `<g opacity=".42">${put(place, 60, -8, 200)}</g>`;
  }
  /* Who is in the scene: the child playing ('me'), a boy, a girl, or any drawing (an animal, a man…). */
  const who = (key, character) => key === 'me' ? KIDS[character] || 'boy' : KIDS[key] || key;
  const MOTION = `<path d="M70 70q-14 10 0 22M58 62q-22 18 0 38" ${line(3)} opacity=".5"/>`;
  function compose([kind, a, b, c, d], character) {
    switch (kind) {
      /* Someone does something to something, maybe somewhere: eat, hold, see, play or ride. The doer stands on the right. */
      case 'act': {
        const doer = who(a, character), verb = b, thing = c, bg = backdrop(d);
        if (verb === 'ride') return bg + shadow(160, 196, 170) + put(thing, 50, 50, 190) + put(doer, 100, 0, 120);
        const body = shadow(236, 196, 110) + put(doer, 142, 26, 170);
        if (verb === 'eat') return bg + body + put(thing, 84, 34, 90);
        if (verb === 'see') return bg + body + shadow(70, 196, 90) + put(thing, 6, 70, 120) + `<path d="M150 80q-30-6-60 4" ${line(2.5)} stroke-dasharray="4 6" opacity=".55"/>`;
        if (verb === 'play') return bg + body + shadow(80, 196, 70) + put(thing, 40, 110, 84) + MOTION;
        return bg + body + put(thing, 70, 88, 100);
      }
      /* Someone or something in a place, with a mood mark. */
      case 'at': {
        const it = who(a, character), wet = WATER.has(b) || b === 'river' || b === 'beach';
        return backdrop(b) + (wet ? '' : shadow(160, 196, 140)) + put(it, 80, wet ? 40 : 26, 164) + (wet ? `<path d="M0 178q20-10 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0V240H0Z" fill="#8fc0d6" opacity=".85"/>` : '') + (MOODS[c]?.() || '');
      }
      /* Two together: the first on the right. */
      case 'two': return backdrop(c) + shadow(240, 194, 110) + shadow(80, 194, 110) + put(who(a, character), 166, 40, 150) + put(who(b, character), 4, 40, 150);
      case 'one': return GROUND + shadow(160, 194, 130) + put(a, 70, 18, 180) + (MOODS[b]?.() || '');
      case 'big': return GROUND + shadow(206, 194, 170) + shadow(58, 194, 60) + put(a, 106, 0, 200) + put('boy', 18, 118, 78);
      case 'small': return GROUND + shadow(250, 194, 64) + shadow(100, 194, 110) + put(a, 214, 120, 76) + put(KIDS[character] || 'boy', 14, 20, 172);
      case 'many': { const size = Math.min(120, 290 / b); return GROUND + Array.from({ length: b }, (_, i) => { const x = 160 + (i - (b - 1) / 2) * size * .92 - size / 2; return shadow(x + size / 2, 194, size * .7) + put(a, x, 190 - size, size); }).join(''); }
      case 'and': return GROUND + shadow(240, 194, 110) + shadow(80, 194, 110) + put(a, 166, 40, 150) + put(b, 4, 40, 150);
      /* Plates, dishes and leaves are drawn from above, so what is on them sits in the middle. */
      case 'on': return GROUND + shadow(160, 196, 150) + put(b, 66, 56, 188) + (FLAT.has(b) ? put(who(a, character), 112, 90, 96) : put(who(a, character), 112, 0, 96));
      /* In water: the animal or boat floats in the waves rather than inside a drawing of the water. */
      case 'in': return WATER.has(b) ? SEA + put(a, 80, 40, 160) + `<path d="M0 176q20-10 40 0t40 0 40 0 40 0 40 0 40 0 40 0 40 0V240H0Z" fill="#8fc0d6" opacity=".85"/>` : GROUND + shadow(160, 196, 160) + put(b, 60, 22, 200) + put(a, 116, 70, 92);
      case 'sky': return SKY + put(a, 80, 30, 160);
      case 'kid': {
        const kid = b === 'ride' ? null : KIDS[c === 'me' ? character : c] || 'boy';
        if (b === 'ride') return GROUND + shadow(160, 196, 170) + put(a, 50, 50, 190) + put(KIDS[c === 'me' ? character : c] || 'boy', 100, 0, 120);
        return GROUND + shadow(236, 196, 110) + put(kid, 142, 20, 176) + (b === 'eat' ? put(a, 84, 30, 92) : put(a, 70, 86, 104));
      }
      default: return GROUND;
    }
  }
  const svg = (picture, character = 'boy') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240" width="320" height="240">${compose(picture, character)}</svg>`;
  const uri = (picture, character = 'boy') => { const key = JSON.stringify(picture) + character; if (!uris.has(key)) uris.set(key, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(picture, character))); return uris.get(key); };
  /* A sound's own picture for the letter board and goals: its first word's drawing. */
  const soundURI = key => { const k = 'sound:' + key; if (!uris.has(k)) uris.set(k, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(Cozy.plain(art(key), 200))); return uris.get(k); };
  return { svg, uri, soundURI };
})();
