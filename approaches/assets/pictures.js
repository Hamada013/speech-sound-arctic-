/* A picture for every word of the approaches part, in the approved look (warm flat colours, thin brown lines):
   - a drawing from the words part's kit (given the approved look by skin()), chosen by the word or its meaning;
   - a few new drawings for family words the kit has no picture for (hill, door, berries…);
   - a letter card for the names of letters (سِين، شِين);
   - a silly creature for made-up words, a different colour for each word, so a child who says «تَلْب» sees something funny;
   - otherwise a card with the word written large. */
window.ApproachPictures = (() => {
  const K = window.ArticulationKit, Cozy = window.ArticulationCozy, L = '#5a3d2b';
  const line = (w = 6) => `stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const bare = word => word.normalize('NFKC').replace(/[ً-ْٰ]/g, '');
  /* Family words drawn with a kit picture that shows them. */
  const KIT = {
    'خد': 'faceword', 'جد': 'oldman', 'شد': 'rope', 'عد': 'six', 'صد': 'barrier', 'نار': 'fire', 'دار': 'house', 'جار': 'man', 'غار': 'cave', 'طار': 'dove', 'حار': 'sun', 'زار': 'guest', 'سار': 'running', 'ثار': 'angry',
    'تين': 'figs', 'دين': 'mosque', 'سيف': 'sword', 'صيف': 'summer', 'ضيف': 'guest', 'حوت': 'whale', 'سوق': 'market', 'طوق': 'ring', 'كأس': 'goblet', 'فأس': 'axe', 'رأس': 'head', 'ثوم': 'garlic', 'بوم': 'owl',
    'جرس': 'bell', 'فرس': 'horse', 'حرس': 'officer', 'درس': 'pupil', 'عم': 'man', 'شم': 'nose', 'ضم': 'hug', 'صم': 'ear', 'دب': 'bear', 'حب': 'heart', 'جب': 'well', 'بل': 'water', 'طل': 'drizzle',
    'كيس': 'sack', 'تيس': 'goat', 'كلب': 'dog', 'قلب': 'heart', 'حلب': 'cow', 'قرش': 'shark', 'كرش': 'belly', 'قبة': 'mosque', 'جبة': 'robe', 'دبة': 'bear', 'كرة': 'ball', 'ذرة': 'corn', 'تمر': 'dates', 'جمر': 'coal',
    'ناب': 'teeth', 'شاب': 'man', 'ذاب': 'melting', 'بيت': 'house', 'زيت': 'oil', 'نور': 'bulb', 'سور': 'wall', 'دور': 'building', 'قلم': 'pencil', 'علم': 'flag', 'ألم': 'sick', 'جمل': 'camel', 'حمل': 'lamb',
    'سعل': 'sick', 'سأل': 'talk', 'عين': 'eyeword', 'هرم': 'pyramid', 'حرم': 'mosque', 'سهر': 'night', 'حبة': 'tablet', 'هبة': 'wind', 'طبل': 'drum', 'حبل': 'rope', 'نبل': 'bowarrow', 'قص': 'scissors',
    'كب': 'pail', 'كف': 'hand', 'دف': 'drum', 'دق': 'hammer', 'جلس': 'seat', 'برد': 'snowfall', 'بلد': 'streetword', 'حر': 'sun', 'حج': 'mosque', 'حك': 'hand', 'ثمن': 'money', 'سمن': 'oil', 'زر': 'button', 'سر': 'whisper',
    'كنز': 'treasure', 'كنس': 'broom', 'سكة': 'train', 'ستة': 'six', 'شبك': 'net', 'شبت': 'plant', 'سلة': 'basket', 'جر': 'pail', 'دبب': 'crawling',
  };
  /* "دَبّ" (crawled) shares its letters with "دُبّ" (bear): told apart by the vowel. */
  const byVowel = { 'دَبّ': 'crawling', 'دُبّ': 'bear', 'كَلّ': 'tired', 'تَلّ': 'hill', 'حَبّ': 'wheat' };
  /* New drawings, 200 by 200, for family words the kit has no picture for. */
  const NEW = {
    hill: `<path d="M8 168Q100 20 192 168Z" fill="#9fc378" ${line()}/><path d="M48 150Q100 76 152 150" fill="none" stroke="#86ad62" stroke-width="7" stroke-linecap="round"/><circle cx="74" cy="118" r="7" fill="#ef9a8a"/><circle cx="128" cy="104" r="6" fill="#f3d27a"/>`,
    door: `<rect x="56" y="22" width="88" height="160" rx="10" fill="#d0a06e" ${line()}/><rect x="72" y="40" width="56" height="52" rx="6" fill="#b98454" ${line(4)}/><rect x="72" y="108" width="56" height="56" rx="6" fill="#b98454" ${line(4)}/><circle cx="130" cy="104" r="7" fill="#e0b25c" ${line(3)}/>`,
    berries: `<path d="M100 30c18-14 40-8 46 6-18 6-34 4-46-6Z" fill="#9fc378" ${line(4)}/><path d="M100 34v14" ${line(4)}/>${[[100, 62], [84, 80], [116, 80], [100, 96], [84, 112], [116, 112], [100, 128], [92, 146], [108, 146]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="#8f5e8a" ${line(4)}/><circle cx="${x - 5}" cy="${y - 5}" r="4" fill="#fff" opacity=".45"/>`).join('')}`,
    dam: `<path d="M10 120h70v60H10Z" fill="#92c5e8"/><path d="M10 120q12-8 24 0t24 0 22 0" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/><path d="M80 60h46l18 120H80Z" fill="#c9c0b0" ${line()}/><path d="M144 160h46v20h-46Z" fill="#92c5e8"/><path d="M80 90h50M80 120h54M80 150h58" stroke="#a39a88" stroke-width="4"/><path d="M8 180h184" ${line()}/>`,
    trumpet: `<path d="M30 92h90l40-36v88l-40-36H30Z" fill="#e0b25c" ${line()}/><rect x="56" y="70" width="12" height="22" rx="4" fill="#c9984a" ${line(4)}/><rect x="80" y="70" width="12" height="22" rx="4" fill="#c9984a" ${line(4)}/><rect x="18" y="86" width="16" height="28" rx="5" fill="#c9984a" ${line(4)}/>`,
    poison: `<path d="M76 30h48v34c26 12 34 32 34 60 0 34-26 52-58 52s-58-18-58-52c0-28 8-48 34-60Z" fill="#9fc378" ${line()}/><rect x="70" y="18" width="60" height="20" rx="6" fill="#b5633f" ${line(4)}/><rect x="62" y="104" width="76" height="46" rx="10" fill="#fffaf0" ${line(4)}/><path d="M84 116l32 22M116 116l-32 22" stroke="#d9655a" stroke-width="7" stroke-linecap="round"/>`,
    flute: `<path d="M34 168 166 36" stroke="${L}" stroke-width="30" stroke-linecap="round"/><path d="M34 168 166 36" stroke="#d0a06e" stroke-width="20" stroke-linecap="round"/>${[0, 1, 2, 3, 4].map(k => `<circle cx="${70 + k * 18}" cy="${132 - k * 18}" r="5" fill="${L}"/>`).join('')}`,
    lizard: `<path d="M100 40c16 0 22 14 18 28l6 52c4 26-4 44-24 58-4 4-10 4-12-2 14-12 18-28 14-54l-6-54c-4-14 0-28 4-28Z" fill="#9fc378" ${line()}/>${[[86, 82, -1], [114, 82, 1], [88, 132, -1], [118, 128, 1]].map(([x, y, s]) => `<path d="M${x} ${y}l${s * 26} ${-10}l${s * 6} 8" fill="none" ${line(6)}/>`).join('')}<circle cx="94" cy="50" r="4" fill="${L}"/><circle cx="108" cy="50" r="4" fill="${L}"/>`,
    mud: `<path d="M20 140c0-30 40-44 80-40s80 10 80 40-40 40-80 40-80-10-80-40Z" fill="#a9784a" ${line()}/><circle cx="70" cy="132" r="9" fill="#c98a5a" ${line(3)}/><circle cx="128" cy="140" r="6" fill="#c98a5a" ${line(3)}/><path d="M86 70c10-16 30-16 34 0" fill="none" ${line(5)}/><ellipse cx="104" cy="88" rx="24" ry="10" fill="#8a5f38" ${line(4)}/>`,
    tired: `<circle cx="100" cy="100" r="70" fill="#f6d2b4" ${line()}/><path d="M64 92q12 8 24 0M112 92q12 8 24 0" fill="none" ${line(5)}/><path d="M82 138q18-10 36 0" fill="none" ${line(5)}/><path d="M150 54c10 12 10 22 0 26-10-4-10-14 0-26Z" fill="#92c5e8" ${line(3)}/>`,
    kibbeh: `${[[68, 120], [132, 120], [100, 92]].map(([x, y]) => `<path d="M${x - 34} ${y}c0-20 16-30 34-30s34 10 34 30-16 30-34 30-34-10-34-30Z" fill="#b98454" ${line()}/><path d="M${x - 16} ${y - 8}q16-8 32 0" fill="none" stroke="#8a5f38" stroke-width="4"/>`).join('')}<path d="M20 160h160" ${line()}/>`,
  };
  const BY_WORD = { 'تل': 'hill', 'تلة': 'hill', 'باب': 'door', 'توت': 'berries', 'سد': 'dam', 'بوق': 'trumpet', 'سم': 'poison', 'ناي': 'flute', 'ضب': 'lizard', 'طين': 'mud', 'كل': 'tired', 'كبة': 'kibbeh' };
  const LETTERS = { 'سين': 'س', 'شين': 'ش' };

  const uris = new Map();
  const svg = (body, viewBox = '0 0 200 200') => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="240" height="240">${body}</svg>`);
  const kit = key => svg(Cozy.skin(K.words[key]));
  const letterCard = letter => svg(`<rect x="20" y="20" width="160" height="160" rx="30" fill="#fffaf0" ${line()}/><text x="100" y="138" text-anchor="middle" font-family="system-ui, sans-serif" font-size="110" font-weight="800" fill="${L}">${letter}</text>`);
  const textCard = word => svg(`<rect x="10" y="40" width="180" height="120" rx="26" fill="#fffaf0" ${line()}/><text x="100" y="116" text-anchor="middle" direction="rtl" font-family="system-ui, sans-serif" font-size="44" font-weight="800" fill="${L}">${word}</text>`);
  /* The silly creature for a made-up word: a wobbly blob with googly eyes and its tongue out, coloured by the word. */
  function silly(word) {
    let seed = 0; for (const ch of word) seed = (seed * 31 + ch.codePointAt(0)) >>> 0;
    const colors = ['#c9b0d8', '#9fc378', '#f2a7b8', '#92c5e8', '#f3c27a', '#6ba39b'], color = colors[seed % colors.length], tilt = (seed >> 3) % 2 ? 1 : -1;
    return svg(`<path d="M40 170c-24-40-10-118 60-120 70 2 84 80 60 120-12 18-108 18-120 0Z" fill="${color}" ${line()}/><path d="M64 48l-12-26M136 48l12-26" ${line(5)}/><circle cx="52" cy="20" r="9" fill="${color}" ${line(4)}/><circle cx="148" cy="20" r="9" fill="${color}" ${line(4)}/>
      <circle cx="78" cy="96" r="22" fill="#fff" ${line(4)}/><circle cx="126" cy="${96 + tilt * 4}" r="16" fill="#fff" ${line(4)}/><circle cx="${84 + tilt * 4}" cy="102" r="9" fill="${L}"/><circle cx="${122 - tilt * 3}" cy="${92 + tilt * 6}" r="7" fill="${L}"/>
      <path d="M76 138q24 18 48 0" fill="#b5633f" ${line(4)}/><path d="M96 146q10 24 20 4" fill="#ef9a8a" ${line(3)}/><text x="168" y="70" font-family="system-ui, sans-serif" font-size="40" font-weight="800" fill="${L}">?</text>`);
  }
  /* The picture of a word object ({ word, meaning, nonword }): kit drawing, new drawing, letter card, silly creature or text. */
  function uri(w) {
    const key = w.word + (w.nonword ? '*' : '');
    if (uris.has(key)) return uris.get(key);
    const plain = bare(w.word), vowel = byVowel[w.word];
    let out;
    if (w.nonword) out = silly(w.word);
    else if (LETTERS[plain]) out = letterCard(LETTERS[plain]);
    else if (vowel && NEW[vowel]) out = svg(NEW[vowel]);
    else if (vowel && K.words[vowel]) out = kit(vowel);
    else if (BY_WORD[plain] && NEW[BY_WORD[plain]]) out = svg(NEW[BY_WORD[plain]]);
    else if (K.words[w.meaning]) out = kit(w.meaning);
    else if (KIT[plain] && K.words[KIT[plain]]) out = kit(KIT[plain]);
    else out = textCard(w.word);
    uris.set(key, out);
    return out;
  }
  return { uri };
})();
