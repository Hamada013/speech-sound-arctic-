/* The data behind the approaches part (المناهج): phonological and contrast approaches. Draft for the therapist's approval.
   - CONSONANTS: the features of each sound (place, manner, voicing, emphasis), to measure how different two sounds are.
   - PATTERNS: the Arabic error patterns, each with its contrasts [target, what the child says instead].
   - FAMILIES: real fusha words that are the same except for one consonant, with the same vowels (خَدّ، جَدّ، سَدّ…).
     Any two words in a family are a minimal pair; one family with several targets is a multiple-opposition set; two words whose
     sounds differ in many features are a maximal-opposition pair. Each word: [word with tashkeel, meaning, picturable].
     picturable 1 = an everyday thing a 3-6 year old can name from a picture; 0 = abstract, rare or a verb: check before use.
   - Cycles take their listening list and practice words from the words part (../words/assets/data.js), by the target letter.
   - Where a contrast has fewer than 5 clear real pairs, made-up words fill it (the therapist's decision): a real picturable word
     with the child's sound in place of the target (كَلْب → تَلْب), or, for the deletion patterns, the word without its last or
     first sound (بَاب → بَا, آب). They are marked nonword; the game shows a funny 'silly' picture for them.
   See docs/roadmap.md (item 7) and approaches/review.txt (written by scripts/review.cjs). */
window.ApproachData = (() => {
  /* place: lab labiodental dent alv post pal vel uvu phar glot; manner: stop fric aff nas lat trill appr; voiced; emphatic. */
  const CONSONANTS = {
    'ء': ['glot', 'stop', 0, 0], 'ب': ['lab', 'stop', 1, 0], 'ت': ['alv', 'stop', 0, 0], 'ث': ['dent', 'fric', 0, 0], 'ج': ['post', 'aff', 1, 0], 'ح': ['phar', 'fric', 0, 0],
    'خ': ['uvu', 'fric', 0, 0], 'د': ['alv', 'stop', 1, 0], 'ذ': ['dent', 'fric', 1, 0], 'ر': ['alv', 'trill', 1, 0], 'ز': ['alv', 'fric', 1, 0], 'س': ['alv', 'fric', 0, 0],
    'ش': ['post', 'fric', 0, 0], 'ص': ['alv', 'fric', 0, 1], 'ض': ['alv', 'stop', 1, 1], 'ط': ['alv', 'stop', 0, 1], 'ظ': ['dent', 'fric', 1, 1], 'ع': ['phar', 'fric', 1, 0],
    'غ': ['uvu', 'fric', 1, 0], 'ف': ['labdent', 'fric', 0, 0], 'ق': ['uvu', 'stop', 0, 0], 'ك': ['vel', 'stop', 0, 0], 'ل': ['alv', 'lat', 1, 0], 'م': ['lab', 'nas', 1, 0],
    'ن': ['alv', 'nas', 1, 0], 'ه': ['glot', 'fric', 0, 0], 'و': ['lab', 'appr', 1, 0], 'ي': ['pal', 'appr', 1, 0],
  };
  /* How many of the four features differ (0-4); maximal oppositions use pairs at 3 or more. */
  const distance = (a, b) => CONSONANTS[a].reduce((n, value, i) => n + (value !== CONSONANTS[b][i]), 0);

  const PATTERNS = [
    { id: 'fronting', name: 'التقديم', en: 'Fronting', contrasts: [['ك', 'ت'], ['ق', 'ك']] },
    { id: 'backing', name: 'التأخير', en: 'Backing', contrasts: [['ت', 'ك']] },
    { id: 'stopping', name: 'الوقف (الإغلاق)', en: 'Stopping', contrasts: [['س', 'ت'], ['ش', 'ت'], ['ز', 'د'], ['ف', 'ب']] },
    { id: 'deemphasis', name: 'ترقيق المفخّم', en: 'De-emphasis', contrasts: [['ص', 'س'], ['ض', 'د'], ['ط', 'ت'], ['ظ', 'ذ']] },
    { id: 'gliding', name: 'إبدال الراء', en: 'ر gliding', contrasts: [['ر', 'ي'], ['ر', 'ل']] },
    { id: 'interdental', name: 'إبدال الأسنانية', en: 'Interdentals', contrasts: [['ث', 'س'], ['ذ', 'ز']] },
    { id: 'pharyngeal', name: 'إبدال الحلقية', en: 'Pharyngeals', contrasts: [['ع', 'ء'], ['ح', 'ه']] },
    { id: 'palatal', name: 'الشين سينًا', en: 'ش → س', contrasts: [['ش', 'س']] },
    { id: 'affricate', name: 'إبدال الجيم', en: 'ج → د, ج → ز', contrasts: [['ج', 'د'], ['ج', 'ز']] },
    { id: 'voicing', name: 'الهمس (فقد الجهر)', en: 'Devoicing', contrasts: [['ز', 'س'], ['د', 'ت']] },
    /* Arabic has almost no real word pairs for these two, so they use made-up words: the word without the sound. */
    { id: 'final', name: 'حذف الصامت الأخير', en: 'Final consonant deletion', contrasts: [], deletion: 'last' },
    { id: 'initial', name: 'حذف الصامت الأول', en: 'Initial consonant deletion', contrasts: [], deletion: 'first' },
  ];

  /* Each family: the frame (C marks the changing consonant) and its words. */
  const FAMILIES = [
    ['Cَدّ', [['خَدّ', 'cheek', 1], ['جَدّ', 'grandfather', 1], ['سَدّ', 'dam', 1], ['شَدّ', 'pulled', 0], ['عَدّ', 'counted', 0], ['حَدّ', 'edge', 0], ['هَدّ', 'knocked down', 0], ['صَدّ', 'blocked', 0]]],
    ['Cَار', [['نَار', 'fire', 1], ['دَار', 'house', 1], ['جَار', 'neighbour', 1], ['غَار', 'cave', 1], ['طَار', 'flew', 1], ['حَار', 'hot', 1], ['زَار', 'visited', 0], ['سَار', 'walked', 0], ['ثَار', 'rose up angry', 0]]],
    ['Cِين', [['تِين', 'figs', 1], ['طِين', 'mud', 1], ['سِين', 'the letter س', 0], ['شِين', 'the letter ش', 0], ['دِين', 'religion', 0], ['صِين', 'China', 0]]],
    ['Cَيْف', [['سَيْف', 'sword', 1], ['صَيْف', 'summer', 1], ['ضَيْف', 'guest', 1]]],
    ['Cُوت', [['حُوت', 'whale', 1], ['تُوت', 'berries', 1]]],
    ['Cُوق', [['سُوق', 'market', 1], ['بُوق', 'trumpet', 1], ['طُوق', 'collar', 1]]],
    ['Cَأْس', [['كَأْس', 'cup', 1], ['فَأْس', 'axe', 1], ['رَأْس', 'head', 1]]],
    ['Cُوم', [['ثُوم', 'garlic', 1], ['بُوم', 'owls', 1]]],
    ['Cَرَس', [['جَرَس', 'bell', 1], ['فَرَس', 'mare', 1], ['حَرَس', 'guards', 1], ['دَرَس', 'studied', 0]]],
    ['Cَمّ', [['عَمّ', 'uncle', 1], ['شَمّ', 'smelled', 1], ['ضَمّ', 'hugged', 1], ['سَمّ', 'poison', 1], ['صَمّ', 'went deaf', 0], ['هَمّ', 'worry', 0]]],
    ['Cُبّ', [['دُبّ', 'bear', 1], ['حُبّ', 'love', 1], ['جُبّ', 'well', 1]]],
    ['Cَلّ', [['تَلّ', 'hill', 1], ['كَلّ', 'got tired', 1], ['بَلّ', 'wetted', 1], ['طَلّ', 'dew', 0], ['حَلّ', 'solution', 0], ['دَلّ', 'showed the way', 0]]],
    ['Cِيس', [['كِيس', 'bag', 1], ['تِيس', 'billy goat', 1]]],
    ['Cَلْب', [['كَلْب', 'dog', 1], ['قَلْب', 'heart', 1], ['حَلْب', 'milking', 1]]],
    ['Cِرْش', [['قِرْش', 'shark', 1], ['كِرْش', 'belly', 1]]],
    ['Cُبَّة', [['قُبَّة', 'dome', 1], ['كُبَّة', 'kibbeh', 1], ['جُبَّة', 'robe', 1], ['دُبَّة', 'she-bear', 1]]],
    ['Cُرَة', [['كُرَة', 'ball', 1], ['ذُرَة', 'corn', 1]]],
    ['Cَمْر', [['تَمْر', 'dates', 1], ['جَمْر', 'embers', 1]]],
    ['Cَاب', [['بَاب', 'door', 1], ['نَاب', 'fang', 1], ['شَاب', 'young man', 1], ['ذَاب', 'melted', 1]]],
    ['Cَيْت', [['بَيْت', 'house', 1], ['زَيْت', 'oil', 1]]],
    ['Cُور', [['نُور', 'light', 1], ['سُور', 'wall', 1], ['دُور', 'houses', 0]]],
    ['Cَلَم', [['قَلَم', 'pencil', 1], ['عَلَم', 'flag', 1], ['أَلَم', 'pain', 1]]],
    ['Cَمَل', [['جَمَل', 'camel', 1], ['حَمَل', 'lamb', 1], ['عَمَل', 'work', 0], ['أَمَل', 'hope', 0]]],
    ['سَCَل', [['سَعَل', 'coughed', 1], ['سَأَل', 'asked', 1]]],
    ['Cَيْن', [['عَيْن', 'eye', 1], ['أَيْن', 'where?', 0]]],
    ['Cَرَم', [['هَرَم', 'pyramid', 1], ['حَرَم', 'holy mosque', 0], ['كَرَم', 'generosity', 0]]],
    ['Cَزّ', [['هَزّ', 'shook', 1], ['حَزّ', 'cut a notch', 0]]],
    ['سَCَر', [['سَهَر', 'staying up', 1], ['سَحَر', 'dawn', 0]]],
    ['Cَبَّة', [['حَبَّة', 'grain, pill', 1], ['هَبَّة', 'gust', 0]]],
    ['Cَبْل', [['طَبْل', 'drum', 1], ['حَبْل', 'rope', 1], ['تَبْل', 'spice', 0], ['نَبْل', 'arrows', 0]]],
    ['قَCّ', [['قَصّ', 'cut', 1], ['قَسّ', 'priest', 0]]],
    ['Cَبّ', [['ضَبّ', 'lizard', 1], ['دَبّ', 'crawled', 1], ['كَبّ', 'poured', 1], ['حَبّ', 'grains', 1]]],
    ['كَCّ', [['كَفّ', 'palm of the hand', 1], ['كَبّ', 'poured', 1], ['كَلّ', 'got tired', 1]]],
    ['دَCّ', [['دَفّ', 'frame drum', 1], ['دَبّ', 'crawled', 1], ['دَقّ', 'knocked', 1], ['دَلّ', 'showed the way', 0]]],
    ['نَاC', [['نَار', 'fire', 1], ['نَاي', 'flute', 1], ['نَاب', 'fang', 1]]],
    ['جَCَس', [['جَرَس', 'bell', 1], ['جَلَس', 'sat down', 1]]],
    ['بَCَد', [['بَرَد', 'hail', 1], ['بَلَد', 'town', 1]]],
    ['حَCّ', [['حَرّ', 'heat', 1], ['حَكّ', 'scratched', 1], ['حَبّ', 'grains', 1], ['حَجّ', 'pilgrimage', 1], ['حَلّ', 'solution', 0]]],
    ['Cَمَن', [['سَمَن', 'ghee', 1], ['ثَمَن', 'price', 0]]],
    ['Cِرّ', [['زِرّ', 'button', 1], ['سِرّ', 'secret', 1]]],
    ['كَنْC', [['كَنْز', 'treasure', 1], ['كَنْس', 'sweeping', 1]]],
    ['سِCَّة', [['سِكَّة', 'railway', 1], ['سِتَّة', 'six', 1]]],
    ['شَبَC', [['شَبَك', 'net', 1], ['شَبَت', 'dill', 0]]],
    ['Cَلَّة', [['سَلَّة', 'basket', 1], ['تَلَّة', 'little hill', 1]]],
    ['Cَرّ', [['جَرّ', 'pulled', 1], ['زَرّ', 'buttoned', 0], ['مَرّ', 'passed by', 0]]],
  ];

  /* The consonant that differs between two words of a family (the one at the C of the frame). */
  const at = frame => [...frame].indexOf('C');
  const letterOf = (word, frame) => [...word].filter(ch => !/[ً-ْ]/.test(ch))[[...frame].filter(ch => !/[ً-ْ]/.test(ch)).indexOf('C')].replace(/[أإآ]/, 'ء');
  const families = FAMILIES.map(([frame, words]) => ({ frame, words: words.map(([word, meaning, picturable]) => ({ word, meaning, picturable: !!picturable, letter: letterOf(word, frame) })) }));

  /* Minimal pairs for one contrast: every family with a word on each side. */
  function pairsFor(target, error) {
    const pairs = [];
    for (const family of families) {
      const a = family.words.find(w => w.letter === target), b = family.words.find(w => w.letter === error);
      if (a && b) pairs.push({ frame: family.frame, target: a, error: b, strong: a.picturable && b.picturable });
    }
    return pairs.sort((x, y) => y.strong - x.strong);
  }
  /* Multiple oppositions: families where the child's one error sound stands against several of the targets it replaces. */
  function multipleFor(error, targets) {
    return families.map(family => ({ frame: family.frame, error: family.words.find(w => w.letter === error), targets: family.words.filter(w => targets.includes(w.letter)) }))
      .filter(set => set.error && set.targets.length >= 2);
  }
  /* Maximal oppositions: the target against a sound that differs in 3 or 4 features. */
  function maximalFor(target) {
    const sets = [];
    for (const family of families) {
      const a = family.words.find(w => w.letter === target);
      if (a) for (const b of family.words) if (b !== a && distance(a.letter, b.letter) >= 3) sets.push({ frame: family.frame, target: a, other: b, distance: distance(a.letter, b.letter), strong: a.picturable && b.picturable });
    }
    return sets.sort((x, y) => y.strong - x.strong || y.distance - x.distance);
  }
  /* ---------- Made-up words ---------- */
  const MARK = /[\u064B-\u0652\u0670]/, norm = ch => ch.replace(/[أإآؤئ]/, 'ء'), plain = word => [...word].filter(ch => !MARK.test(ch));
  /* The hamza takes its seat from its vowel: أ, إ or ؤ/ئ in the middle. */
  const hamza = (vowel, first) => vowel === '\u0650' ? (first ? 'إ' : 'ئ') : vowel === '\u064F' && !first ? 'ؤ' : 'أ';
  function swap(word, target, error) {
    const chars = [...word], i = chars.findIndex(ch => norm(ch) === target);
    chars[i] = error === 'ء' ? hamza(chars[i + 1], i === 0) : error;
    return chars.join('');
  }
  /* A made-up word must not be a real word: not in the families, not one of the words part's words, and not one of these
     real words that a swap happens to make (found in review). Compared without vowel marks. */
  const REAL = new Set(['يأس', 'بستان', 'ذرف', 'ذل', 'سهرة', 'دبيب', 'زبل', 'تلو', 'درس', 'سرور', 'تين', 'أمر', 'كرد', 'كل', 'قل', 'مر', 'من', 'لم', 'لن', 'هل']);
  const bare = word => plain(word).join('');
  const known = words => new Set([...REAL, ...families.flatMap(f => f.words.map(w => bare(w.word))), ...words.map(w => bare(w.word))]);
  /* Words from the words part (first position first) that hold the target sound exactly once and are not already in a real pair. */
  const candidates = (words, target, used) => words.filter(w => !used.has(bare(w.word)) && plain(w.word).filter(ch => norm(ch) === target).length === 1);
  function nonwordsFor(target, error, words, count, everyWord = words) {
    const used = new Set(pairsFor(target, error).map(p => bare(p.target.word))), real = known(everyWord), out = [];
    for (const w of candidates(words, target, used)) {
      if (out.length >= count) break;
      const made = swap(w.word, target, error);
      if (real.has(bare(made))) continue;
      out.push({ frame: 'made-up', target: { word: w.word, meaning: w.art, picturable: true, letter: target }, error: { word: made, meaning: 'made-up word', picturable: false, nonword: true, letter: error }, strong: true, nonword: true });
    }
    return out;
  }
  /* Deletion patterns: the word, and the same word without its last (or first) sound. */
  function deletionPairs(zone, words, count, everyWord = words) {
    /* Words of three or more letters, so what is left is still a word-like sound, and never a real word. */
    const real = known(everyWord);
    return words.filter(w => plain(w.word).length >= 3).map(w => {
      const chars = [...w.word.replace(/[\u064B-\u064D]+$/, '')];
      let made;
      if (zone === 'last') { while (chars.length && MARK.test(chars.at(-1))) chars.pop(); chars.pop(); made = chars.join('').replace(/\u0652$/, ''); }
      else { const vowel = chars[1]; made = (hamza(vowel, true) + chars.slice(1).join('')).replace(/^أ\u064Eا/, 'آ'); }
      return { frame: 'made-up', target: { word: w.word, meaning: w.art, picturable: true }, error: { word: made, meaning: 'made-up word', picturable: false, nonword: true }, strong: true, nonword: true };
    }).filter(pair => !real.has(bare(pair.error.word))).slice(0, count);
  }
  /* All the pairs for a contrast: the real ones, then made-up ones until there are enough clear pairs. */
  function allPairs(target, error, words, needed = 5, everyWord = words) {
    const real = pairsFor(target, error), clear = real.filter(p => p.strong).length;
    return [...real, ...nonwordsFor(target, error, words, Math.max(0, needed - clear), everyWord)];
  }
  return { CONSONANTS, PATTERNS, families, distance, pairsFor, multipleFor, maximalFor, nonwordsFor, deletionPairs, allPairs, NEEDED: 5 };
})();
