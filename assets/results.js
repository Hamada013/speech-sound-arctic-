/* Every part's results for one child, read from each part's own store, in one shape, for the reports page (reports/).
   Each part gives its levels and, per sound (or pattern), each level's latest score, whether it reached the goal (80% in
   the last two whole sessions, the parts' own rule) and the dated scores of all its sessions. The articulation test gives
   each assessment's right and wrong items by sound and word position. Sounds are keyed by the Arabic letter.
   Needs assets/therapy.js (store keys, ids, sizes) and assets/children.js. */
window.ArticulationResults = (() => {
  const T = window.ArticulationTherapy, Children = window.ArticulationChildren;
  const COLORS = { test: '#0f9fb5', syllables: '#6250d6', words: '#2a78d6', phrases: '#eb6834', sentences: '#1baf7a', stories: '#b8860b', approaches: '#b5487a' };
  const LEVELS = {
    test: [['first', 'أول الكلمة'], ['middle', 'وسط الكلمة'], ['last', 'آخر الكلمة']],
    syllables: [['cv', 'صامت ثم حركة'], ['vc', 'حركة ثم صامت'], ['vcv', 'حركة وصامت وحركة']],
    words: [['first', 'أول الكلمة'], ['middle', 'وسط الكلمة'], ['last', 'آخر الكلمة']],
    phrases: [['say', 'العبارات']], sentences: [['say', 'الجمل']], stories: [['pages', 'الصفحات'], ['retell', 'إعادة الحكي']],
    approaches: [['pairs', 'الأزواج الدنيا'], ['oppositions', 'المتقابلات'], ['cycles', 'الدورات']],
  };
  const NAMES = { test: 'اختبار النطق', syllables: 'المقاطع', words: 'الكلمات', phrases: 'العبارات', sentences: 'الجمل', stories: 'القصص', approaches: 'المناهج' };
  const ORDER = Object.keys(T.WORD_IDS);
  const invert = map => Object.fromEntries(Object.entries(map).map(([letter, id]) => [String(id), letter]));
  const BY_ID = { syllables: invert(T.SYLLABLE_IDS), words: invert(T.WORD_IDS), phrases: invert(T.WORD_IDS), sentences: invert(T.WORD_IDS), stories: invert(T.WORD_IDS) };
  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const day = iso => T.today(new Date(iso));
  const mean = list => list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;

  /* A game part: each sound's levels with the latest score, the goal, and every session. */
  function game(part, childId) {
    const attempts = T.recordIn(part, childId)?.progress?.attempts || [], record = { progress: { attempts } };
    const keys = [...new Set(attempts.map(a => String(a.sound)))];
    const sounds = keys.map(id => {
      const pattern = part === 'approaches' ? T.PATTERNS.find(p => p.id === id) : null, letter = pattern ? null : BY_ID[part][id];
      if (!pattern && !letter) return null;
      const levels = Object.fromEntries(LEVELS[part].map(([zone]) => {
        const list = attempts.filter(a => String(a.sound) === id && a.zone === zone);
        if (!list.length) return [zone, null];
        const state = T.zoneState(record, part, id, zone);
        return [zone, { percent: state.last, reached: state.reached, sessions: list.length }];
      }));
      return { key: letter || id, letter, name: pattern?.name || letter, levels, sessions: attempts.filter(a => String(a.sound) === id).map(a => ({ date: a.date, zone: a.zone, percent: T.percentOf(a) })) };
    }).filter(Boolean).sort((a, b) => part === 'approaches' ? T.PATTERNS.findIndex(p => p.id === a.key) - T.PATTERNS.findIndex(p => p.id === b.key) : ORDER.indexOf(a.letter) - ORDER.indexOf(b.letter));
    return wrap(part, sounds, attempts.map(a => ({ date: a.date, percent: T.percentOf(a) })));
  }

  /* The articulation test: the child's assessments (linked by the shared id, else by name), oldest first. Probe ids are
     s1-0 … s28-2: the sound in the order of the 28 letters, then the word position. Right and dialect count as right;
     substitution, omission, distortion and addition as wrong; anything else was not scored. */
  function testOf(childId) {
    let key = 'articulation-cases-v2';
    try { const owner = localStorage.getItem('articulation-cloud-owner'); if (owner) key = `articulation-cases-google-${owner}`; } catch {}
    const cases = read(key), person = Children?.list?.().find(c => c.id === childId);
    if (cases?.version !== 2 || !Array.isArray(cases.children)) return null;
    const child = cases.children.find(c => c.sharedId === childId) || (person && cases.children.find(c => Children.sameName(c.name) === Children.sameName(person.name)));
    if (!child?.assessments?.length) return null;
    const RIGHT = ['correct', 'dialect'], WRONG = ['substitution', 'omission', 'distortion', 'addition'], ZONES = ['first', 'middle', 'last'];
    const assessments = child.assessments.map(item => {
      const m = item.state?.meta?.assessment || {}, date = [m.year, m.month?.padStart?.(2, '0'), m.day?.padStart?.(2, '0')].every(Boolean) ? `${m.year}-${m.month.padStart(2, '0')}-${m.day.padStart(2, '0')}` : day(item.createdAt);
      const items = {};
      for (const [id, trial] of Object.entries(item.state?.trials || {})) {
        const match = /^s(\d+)-(\d)$/.exec(id), score = RIGHT.includes(trial?.status) ? 1 : WRONG.includes(trial?.status) ? 0 : null;
        if (!match || score === null) continue;
        const letter = ORDER[Number(match[1]) - 1], zone = ZONES[Number(match[2])];
        if (letter && zone) (items[letter] ||= {})[zone] = score;
      }
      return { id: item.id, date, items };
    }).filter(a => Object.keys(a.items).length).sort((a, b) => a.date.localeCompare(b.date));
    if (!assessments.length) return null;
    const latest = assessments.at(-1);
    const sounds = ORDER.filter(letter => latest.items[letter]).map(letter => ({
      key: letter, letter, name: letter,
      levels: Object.fromEntries(ZONES.map(zone => [zone, latest.items[letter][zone] === undefined ? null : { percent: latest.items[letter][zone] * 100, reached: latest.items[letter][zone] === 1, sessions: 1 }])),
      sessions: assessments.filter(a => a.items[letter]).map(a => ({ date: a.date, percent: Math.round(mean(Object.values(a.items[letter])) * 100) })),
    }));
    const result = wrap('test', sounds, assessments.map(a => ({ date: a.date, percent: Math.round(mean(Object.values(a.items).flatMap(Object.values)) * 100) })));
    result.assessments = assessments;
    return result;
  }

  function wrap(part, sounds, sessions) {
    const latest = sounds.flatMap(s => Object.values(s.levels).filter(Boolean).map(l => l.percent));
    return { part, name: NAMES[part], color: COLORS[part], levels: LEVELS[part].map(([id, name]) => ({ id, name })), sounds, sessions, percent: latest.length ? Math.round(mean(latest)) : null, count: sessions.length };
  }
  /* All parts for a child, in the app's order; parts without results are left out. */
  function all(childId) {
    const parts = [testOf(childId), ...['syllables', 'words', 'phrases', 'sentences', 'stories', 'approaches'].map(part => game(part, childId))];
    return parts.filter(p => p && p.sounds.length);
  }
  return { COLORS, NAMES, LEVELS, ORDER, all, game, testOf, mean, day };
})();
