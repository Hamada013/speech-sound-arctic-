/* The intervention plan of one child, made from the articulation test and followed by the whole app.

   The plan holds the sounds in error and the error patterns that two or more errors share.
   - Each sound climbs the ladder of parts: syllables, words, phrases, sentences, then stories.
     It starts in words when the test found it right in some position (the child can already say it), else in syllables.
     It moves up a part once each short goal there has reached 80% in two whole sessions in a row, read from that part's
     own records (the same rule as each part's plan.js). Three sounds are worked on at a time, early sounds first.
   - Each shared pattern adds an approach: minimal pairs, or multiple oppositions when one sound replaces several, or
     Hodson cycles for all of them when there are three patterns or more.
   - Each day has one or two sessions of two or three five-minute activities chosen from what the plan works on now,
     the least recently practised first. A part opened from the session reports back through ArticulationToday.
   Plans are stored in articulation-plans-v1 by the shared child id (assets/children.js).

   Results come in the hand-over format (docs/roadmap.md, item 5), made by the test (test/assets/plan-link.js):
   { v: 1, date, assessment, child: { name }, sounds: [{ letter, initial, medial, final }] }, each position 'ok',
   'omitted', 'distorted', 'added', the letter said instead, or null when it was not tested. */
(root => {
  const KEY = 'articulation-plans-v1', TODAY_KEY = 'articulation-today-v1', OPEN_KEY = 'articulation-home-therapist-v1';
  const TARGET = 80, STREAK = 2, AT_ONCE = 3, MINUTES = 5;

  /* Each part's id for a letter: الكلمات, العبارات and الجمل use names, المقاطع numbers 2-26 (no ء, و, ي). */
  const WORD_IDS = { ء: 'alef', ب: 'ba', ت: 'ta', ث: 'tha', ج: 'jeem', ح: 'ha', خ: 'kha', د: 'dal', ذ: 'dhal', ر: 'ra', ز: 'zay', س: 'seen', ش: 'sheen', ص: 'sad', ض: 'dad', ط: 'tta', ظ: 'zha', ع: 'ain', غ: 'ghain', ف: 'fa', ق: 'qaf', ك: 'kaf', ل: 'lam', م: 'mim', ن: 'nun', ه: 'heh', و: 'waw', ي: 'ya' };
  const SYLLABLE_IDS = Object.fromEntries([...'بتثجحخدذرزسشصضطظعغفقكلمنه'].map((letter, i) => [letter, String(i + 2)]));
  const PARTS = {
    syllables: { name: 'المقاطع', href: 'syllable/syllable.html', store: 'articulation-syllables-children-v1', zones: ['cv', 'vc', 'vcv'], size: { cv: 3, vc: 3, vcv: 9 }, id: letter => SYLLABLE_IDS[letter] },
    words: { name: 'الكلمات', href: 'words/index.html', store: 'articulation-words-children-v1', zones: ['first', 'middle', 'last'], size: 10, id: letter => WORD_IDS[letter] },
    phrases: { name: 'العبارات', href: 'phrases/index.html', store: 'articulation-phrases-children-v1', zones: ['say'], size: 10, id: letter => WORD_IDS[letter] },
    sentences: { name: 'الجمل', href: 'sentences/index.html', store: 'articulation-sentences-children-v1', zones: ['say'], size: 10, id: letter => WORD_IDS[letter] },
    stories: { name: 'القصص', href: 'stories/index.html', store: 'articulation-stories-children-v1', zones: ['pages', 'retell'], size: { pages: 5, retell: 1 }, id: letter => WORD_IDS[letter] },
    approaches: { name: 'المناهج', href: 'approaches/index.html', store: 'articulation-approaches-children-v1', zones: ['pairs', 'oppositions', 'cycles'], size: { pairs: 10, oppositions: 10, cycles: 5 }, id: pattern => pattern },
  };
  const LADDER = ['syllables', 'words', 'phrases', 'sentences', 'stories'];
  const ZONE_NAMES = { cv: 'صامت ثم حركة', vc: 'حركة ثم صامت', vcv: 'حركة وصامت وحركة', first: 'أول الكلمة', middle: 'وسط الكلمة', last: 'آخر الكلمة', say: 'يسمع ثم يقول', pages: 'الصفحات', retell: 'إعادة الحكي', pairs: 'الأزواج الدنيا', oppositions: 'المتقابلات', cycles: 'الدورات' };

  /* Place, manner, voicing and emphasis of the 28 consonants, to name the pattern of a substitution. */
  const FEATURES = Object.fromEntries(Object.entries({
    ء: 'glottal stop 0', ب: 'labial stop 1', ت: 'alveolar stop 0', ث: 'dental fricative 0', ج: 'postalveolar affricate 1', ح: 'pharyngeal fricative 0', خ: 'velar fricative 0',
    د: 'alveolar stop 1', ذ: 'dental fricative 1', ر: 'alveolar liquid 1', ز: 'alveolar fricative 1', س: 'alveolar fricative 0', ش: 'postalveolar fricative 0', ص: 'alveolar fricative 0 e',
    ض: 'alveolar stop 1 e', ط: 'alveolar stop 0 e', ظ: 'dental fricative 1 e', ع: 'pharyngeal fricative 1', غ: 'velar fricative 1', ف: 'labial fricative 0', ق: 'uvular stop 0',
    ك: 'velar stop 0', ل: 'alveolar liquid 1', م: 'labial nasal 1', ن: 'alveolar nasal 1', ه: 'glottal fricative 0', و: 'labial glide 1', ي: 'palatal glide 1',
  }).map(([letter, text]) => { const [place, manner, voiced, emphatic] = text.split(' '); return [letter, { place, manner, voiced: voiced === '1', emphatic: emphatic === 'e' }]; }));
  /* The approaches part's twelve patterns (approaches/assets/data.js has the same ids, names and contrasts). A substitution
     listed in a pattern's contrasts belongs to that pattern; any other belongs to each pattern whose rule it fits. */
  const PATTERNS = [
    { id: 'fronting', name: 'التقديم', contrasts: [['ك', 'ت'], ['ق', 'ك']], rule: (t, a) => ['velar', 'uvular'].includes(t.place) && (['alveolar', 'dental'].includes(a.place) || (t.place === 'uvular' && a.place === 'velar')) },
    { id: 'backing', name: 'التأخير', contrasts: [['ت', 'ك']], rule: (t, a) => ['alveolar', 'dental'].includes(t.place) && ['velar', 'uvular'].includes(a.place) },
    { id: 'stopping', name: 'الوقف (الإغلاق)', contrasts: [['س', 'ت'], ['ش', 'ت'], ['ز', 'د'], ['ف', 'ب']], rule: (t, a) => ['fricative', 'affricate'].includes(t.manner) && a.manner === 'stop' },
    { id: 'deemphasis', name: 'ترقيق المفخّم', contrasts: [['ص', 'س'], ['ض', 'د'], ['ط', 'ت'], ['ظ', 'ذ']], rule: (t, a) => t.emphatic && !a.emphatic },
    { id: 'gliding', name: 'إبدال الراء', contrasts: [['ر', 'ي'], ['ر', 'ل']], rule: (t, a, target, said) => target === 'ر' && (a.manner === 'glide' || said === 'ل') },
    { id: 'interdental', name: 'إبدال الأسنانية', contrasts: [['ث', 'س'], ['ذ', 'ز']], rule: t => t.place === 'dental' && !t.emphatic },
    { id: 'pharyngeal', name: 'إبدال الحلقية', contrasts: [['ع', 'ء'], ['ح', 'ه']], rule: t => t.place === 'pharyngeal' },
    { id: 'palatal', name: 'الشين سينًا', contrasts: [['ش', 'س']], rule: (t, a, target) => target === 'ش' && a.place === 'alveolar' && a.manner === 'fricative' },
    { id: 'affricate', name: 'إبدال الجيم', contrasts: [['ج', 'د'], ['ج', 'ز']], rule: (t, a, target) => target === 'ج' },
    { id: 'voicing', name: 'الهمس (فقد الجهر)', contrasts: [['ز', 'س'], ['د', 'ت']], rule: (t, a) => t.voiced && !a.voiced && t.place === a.place && t.manner === a.manner },
    { id: 'final', name: 'حذف الصامت الأخير', deletion: 'final' },
    { id: 'initial', name: 'حذف الصامت الأول', deletion: 'initial' },
  ];
  /* Early sounds first (roughly the order Arabic-speaking children master them); the therapist can change it. */
  const ORDER = 'بمنتدكءهويفلحعخجشسزرغقطصضثذظ';
  const POSITIONS = { initial: 'first', medial: 'middle', final: 'last' };

  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const norm = letter => ['أ', 'إ', 'آ', 'ا'].includes(letter) ? 'ء' : letter;
  const isError = value => value != null && value !== 'ok';
  /* This file's folder is assets/, so the app's root is one up: links work from any page. */
  const BASE = (() => { try { return new URL('..', root.document.currentScript.src).href; } catch { return ''; } })();
  const url = path => BASE + path;

  function store() { const data = read(KEY, null); return data?.schema === 1 && data.plans && typeof data.plans === 'object' ? data : { schema: 1, plans: {} }; }
  const planOf = childId => (childId && store().plans[childId]) || null;
  function savePlan(plan) { const data = store(); plan.updated = new Date().toISOString(); data.plans[plan.child] = plan; return write(KEY, data); }
  function remove(childId) { const data = store(); if (!data.plans[childId]) return; delete data.plans[childId]; write(KEY, data); applyGoals({ child: childId, sounds: [], patterns: [] }, true); }

  /* ---------- Making the plan ---------- */
  function soundsOf(results) {
    return results.filter(sound => FEATURES[sound.letter] && Object.keys(POSITIONS).some(position => isError(sound[position]))).map(sound => {
      const errors = Object.entries(POSITIONS).filter(([position]) => isError(sound[position])).map(([, zone]) => zone);
      const canSay = Object.keys(POSITIONS).some(position => sound[position] === 'ok');
      return { letter: sound.letter, said: Object.fromEntries(Object.entries(POSITIONS).map(([position, zone]) => [zone, sound[position] ?? null])), words: errors, from: canSay || !SYLLABLE_IDS[sound.letter] ? 'words' : 'syllables', held: false };
    }).sort((a, b) => ORDER.indexOf(a.letter) - ORDER.indexOf(b.letter));
  }
  function patternsOf(results) {
    const found = {};
    const add = (id, target, said) => { const entry = (found[id] ||= { count: 0, examples: [] }); entry.count++; entry.examples.push({ target, said }); };
    for (const sound of results) for (const position of Object.keys(POSITIONS)) {
      const said = sound[position];
      if (!isError(said)) continue;
      if (said === 'omitted') { if (position !== 'medial') add(position, sound.letter, '∅'); continue; }
      const t = FEATURES[sound.letter], a = FEATURES[norm(said)];
      if (!t || !a || norm(said) === sound.letter) continue;
      const exact = PATTERNS.find(p => p.contrasts?.some(([x, y]) => x === sound.letter && y === norm(said)));
      (exact ? [exact] : PATTERNS.filter(p => p.rule?.(t, a, sound.letter, norm(said)))).forEach(p => add(p.id, sound.letter, norm(said)));
    }
    const shared = PATTERNS.filter(p => found[p.id]?.count >= 2), cycles = shared.length >= 3;
    return shared.map(p => {
      const { count, examples } = found[p.id], byError = {};
      examples.forEach(e => (byError[e.said] ||= new Set()).add(e.target));
      const collapse = !p.deletion && Object.values(byError).some(targets => targets.size > 1);
      return { id: p.id, name: p.name, count, examples: [...new Set(examples.map(e => `${e.target}←${e.said}`))], approach: cycles ? 'cycles' : collapse ? 'oppositions' : 'pairs', held: false };
    });
  }
  /* A new plan replaces the child's old one but keeps the days already practised and the session settings. */
  function create(childId, results) {
    if (!childId || results?.v !== 1 || !Array.isArray(results.sounds)) throw Error('Not a v1 result');
    const clean = results.sounds.map(sound => ({ ...sound, letter: norm(sound.letter) }));
    const old = planOf(childId), days = { ...(old?.days || {}) };
    if (days[today()] && !days[today()].some(s => s.activities.some(a => a.done))) delete days[today()];
    const plan = { schema: 1, id: Date.now().toString(36), child: childId, created: new Date().toISOString(), source: { kind: results.source || 'test', date: results.date || today(), assessment: results.assessment || null }, sounds: soundsOf(clean), patterns: patternsOf(clean), settings: old?.settings || { activities: 3, perDay: 2 }, days, last: old?.last || {} };
    savePlan(plan); applyGoals(plan); writeGoals(plan);
    return plan;
  }

  /* ---------- One plan: the therapist's goal window (assets/intervention.js) and this engine ---------- */
  /* Goal ids (assets/intervention-goals.js): S-<letter>-<level> for a sound at a level, S-P-<pattern> for a pattern. */
  const goalIdsOf = plan => [
    ...plan.sounds.flatMap(sound => LADDER.slice(Math.max(0, LADDER.indexOf(sound.from))).filter(level => level !== 'syllables' || SYLLABLE_IDS[sound.letter]).map(level => `S-${sound.letter}-${level}`)),
    ...plan.patterns.map(pattern => `S-P-${pattern.id}`),
  ];
  /* A new plan from the test writes its goals into the child's plan window: goals that stay keep their ratings,
     the old plan's sound and pattern goals that are no longer needed go, other goals stay. */
  function writeGoals(plan) {
    const Children = root.ArticulationChildren, child = Children?.list?.().find(entry => entry.id === plan.child);
    if (!child || !Children.update) return;
    const wanted = new Set(goalIdsOf(plan)), saved = child.intervention || {}, kept = (saved.goals || []).filter(goal => wanted.has(goal.id) || !/^S-/.test(goal.id));
    const have = new Set(kept.map(goal => goal.id)), added = [...wanted].filter(id => !have.has(id)).map(id => ({ id, rating: null, history: [], added: today() }));
    Children.update(plan.child, { intervention: { childName: saved.childName || child.name, therapist: saved.therapist || '', start: saved.start || today(), ...saved, goals: [...kept, ...added], updated: new Date().toISOString() } });
  }
  /* The therapist changed the goals in the window: the engine follows. A sound with any goal is in the plan, starting
     at its lowest chosen level; a sound without goals leaves it; the same for patterns. Days practised stay. */
  function fromGoals(childId, ids) {
    if (!childId) return null;
    const levels = {}, patternIds = new Set();
    for (const id of ids || []) {
      const pattern = /^S-P-(.+)$/.exec(id), sound = !pattern && /^S-(.+)-(syllables|words|phrases|sentences|stories)$/.exec(id);
      if (pattern) patternIds.add(pattern[1]);
      else if (sound) (levels[sound[1]] ||= []).push(sound[2]);
    }
    const old = planOf(childId);
    const plan = old || { schema: 1, id: Date.now().toString(36), child: childId, created: new Date().toISOString(), source: { kind: 'goals', date: today(), assessment: null }, sounds: [], patterns: [], settings: { activities: 3, perDay: 2 }, days: {}, last: {} };
    const sounds = Object.entries(levels).map(([letter, list]) => {
      const from = LADDER.find(level => list.includes(level)), had = plan.sounds.find(sound => sound.letter === letter);
      return had ? { ...had, from } : { letter, said: { first: null, middle: null, last: null }, words: [], from, held: false };
    }).sort((a, b) => ORDER.indexOf(a.letter) - ORDER.indexOf(b.letter));
    const approach = patternIds.size >= 3 ? 'cycles' : null;
    const patterns = [...patternIds].filter(id => PATTERNS.some(p => p.id === id)).map(id => {
      const had = plan.patterns.find(p => p.id === id), base = PATTERNS.find(p => p.id === id);
      return { ...(had || { id, name: base.name, count: 0, examples: [], held: false }), approach: approach || had?.approach || 'pairs' };
    });
    const before = JSON.stringify([plan.sounds, plan.patterns]);
    plan.sounds = sounds; plan.patterns = patterns;
    if (old && JSON.stringify([plan.sounds, plan.patterns]) === before) return plan;
    // The goals of sounds and patterns that left the plan are cleared from the parts too.
    if (old) { const gone = { sounds: old.sounds.filter(s => !sounds.some(n => n.letter === s.letter)), patterns: [] }; if (gone.sounds.length) applyGoals({ child: childId, ...gone }, true); }
    savePlan(plan); applyGoals(plan);
    return plan;
  }

  /* ---------- Where the plan stands, from the parts' own records ---------- */
  const recordIn = (part, childId) => read(PARTS[part].store, null)?.children?.find?.(child => child.id === childId) || null;
  const sizeOf = (part, zone) => typeof PARTS[part].size === 'object' ? PARTS[part].size[zone] : PARTS[part].size;
  const percentOf = attempt => { const values = Object.values(attempt.scores || {}); return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 100) : 0; };
  function zoneState(record, part, id, zone) {
    const attempts = (record?.progress?.attempts || []).filter(entry => String(entry.sound) === String(id) && entry.zone === zone);
    const whole = attempts.filter(entry => Object.keys(entry.scores || {}).length >= sizeOf(part, zone)).slice(-STREAK);
    return { zone, reached: whole.length === STREAK && whole.every(entry => percentOf(entry) >= TARGET), last: attempts.length ? percentOf(attempts.at(-1)) : null, sessions: attempts.length };
  }
  const zonesFor = (sound, level) => level === 'words' && sound.words?.length ? sound.words : PARTS[level].zones;
  function ladderOf(sound, records) {
    const start = Math.max(0, LADDER.indexOf(sound.from));
    let level = null;
    const steps = LADDER.map((part, i) => {
      if (i < start || (part === 'syllables' && !SYLLABLE_IDS[sound.letter])) return { part, state: 'skip', zones: [] };
      if (PARTS[part].soon) return { part, state: level ? 'later' : 'soon', zones: [] };
      const zones = zonesFor(sound, part).map(zone => zoneState(records[part], part, PARTS[part].id(sound.letter), zone));
      if (!level && zones.every(z => z.reached)) return { part, state: 'done', zones };
      if (!level) { level = part; return { part, state: 'now', zones }; }
      return { part, state: 'later', zones };
    });
    return { steps, level };
  }
  function status(plan) {
    const records = Object.fromEntries(Object.keys(PARTS).filter(part => PARTS[part].store).map(part => [part, recordIn(part, plan.child)]));
    let busy = 0;
    const sounds = plan.sounds.map(sound => {
      const ladder = ladderOf(sound, records);
      const state = !ladder.level ? 'done' : sound.held ? 'held' : busy < AT_ONCE ? (busy++, 'now') : 'next';
      return { ...sound, ...ladder, state };
    });
    const patterns = plan.patterns.map(pattern => {
      const zone = zoneState(records.approaches, 'approaches', pattern.id, pattern.approach);
      return { ...pattern, ...zone, state: pattern.held ? 'held' : pattern.approach !== 'cycles' && zone.reached ? 'done' : 'now' };
    });
    const steps = sounds.flatMap(s => s.steps.filter(step => !['skip', 'soon'].includes(step.state) && !PARTS[step.part].soon));
    return { plan, sounds, patterns, total: steps.length, reached: steps.filter(step => step.state === 'done').length };
  }
  /* The parts the plan works in now: their buttons stay open on the home page, the others look locked. */
  function partsOf(view) {
    const parts = new Set(view.sounds.filter(s => ['now', 'next'].includes(s.state)).map(s => s.level));
    if (view.patterns.some(p => p.state === 'now')) parts.add('approaches');
    return parts;
  }

  /* The plan writes its targets as the goals of each part, so a part opened directly plays them too.
     It only changes the goals of the plan's own sounds and patterns; other goals the therapist set stay. */
  function applyGoals(plan, clearing = false) {
    const view = clearing ? { sounds: [], patterns: [] } : status(plan);
    const own = { ...Object.fromEntries(LADDER.filter(part => PARTS[part].store).map(part => [part, plan.sounds.map(s => PARTS[part].id(s.letter)).filter(Boolean)])), approaches: PATTERNS.map(p => p.id) };
    const wanted = Object.fromEntries(Object.keys(own).map(part => [part, {}]));
    for (const sound of view.sounds.filter(s => s.state === 'now')) {
      const step = sound.steps.find(s => s.state === 'now'), id = PARTS[step.part].id(sound.letter);
      const open = step.zones.filter(z => !z.reached).map(z => z.zone);
      wanted[step.part][id] = open.length ? open : zonesFor(sound, step.part);
    }
    for (const pattern of view.patterns.filter(p => p.state === 'now')) wanted.approaches[pattern.id] = [pattern.approach];
    for (const [part, ids] of Object.entries(own)) {
      const data = read(PARTS[part].store, null) || { schema: 1, active: null, children: [] };
      if (data.schema !== 1 || !Array.isArray(data.children)) continue;
      let record = data.children.find(child => child.id === plan.child);
      if (!record) { if (!Object.keys(wanted[part]).length) continue; record = { id: plan.child, progress: { attempts: [], goals: {}, played: {}, run: null } }; data.children.push(record); }
      record.progress ||= { attempts: [], goals: {}, played: {}, run: null };
      const before = JSON.stringify(record.progress.goals || {}), goals = { ...(record.progress.goals || {}) };
      ids.forEach(id => { delete goals[id]; });
      Object.assign(goals, wanted[part]);
      if (JSON.stringify(goals) === before) continue;
      record.progress.goals = goals;
      write(PARTS[part].store, data);
    }
  }

  /* ---------- Each day's sessions ---------- */
  function candidates(view) {
    const sounds = [], approaches = [];
    for (const sound of view.sounds.filter(s => s.state === 'now')) {
      const step = sound.steps.find(s => s.state === 'now');
      step.zones.filter(z => !z.reached).forEach((z, rank) => sounds.push({ key: `${step.part}:${sound.letter}:${z.zone}`, part: step.part, letter: sound.letter, zone: z.zone, rank }));
    }
    const cycles = view.patterns.filter(p => p.state === 'now' && p.approach === 'cycles');
    if (cycles.length) approaches.push({ key: 'approaches:cycles', part: 'approaches', patterns: cycles.map(p => p.id), zone: 'cycles', rank: 0 });
    view.patterns.filter(p => p.state === 'now' && p.approach !== 'cycles').forEach(p => approaches.push({ key: `approaches:${p.id}:${p.approach}`, part: 'approaches', pattern: p.id, zone: p.approach, rank: 0 }));
    return { sounds, approaches };
  }
  /* Two or three activities: each sound's first open short goal, the least recently practised first, and one approach. */
  function newSession(view) {
    const { sounds, approaches } = candidates(view), size = view.plan.settings?.activities || 3, last = view.plan.last || {};
    const order = (a, b) => (a.rank - b.rank) || ((last[a.key] || 0) - (last[b.key] || 0));
    const chosen = [...approaches.sort(order).slice(0, 1), ...sounds.sort(order)].slice(0, size);
    if (!chosen.length) return null;
    const rankOf = a => a.part === 'approaches' ? 9 : LADDER.indexOf(a.part);
    return { id: Date.now().toString(36), started: new Date().toISOString(), activities: chosen.sort((a, b) => rankOf(a) - rankOf(b)).map(({ rank, ...a }) => ({ ...a, minutes: MINUTES, done: null })) };
  }
  const finished = session => session.activities.every(a => a.done);
  /* Today for a child: the plan's state, today's sessions, the open one (made on first look), and whether another may start. */
  function day(childId) {
    const plan = planOf(childId);
    if (!plan) return null;
    applyGoals(plan);
    const view = status(plan), date = today();
    plan.days ||= {};
    let sessions = plan.days[date] || [];
    if (!sessions.length) { const first = newSession(view); if (first) { sessions = plan.days[date] = [first]; savePlan(plan); } }
    const open = sessions.find(s => !finished(s)) || null;
    return { plan, view, sessions, open, more: !open && sessions.length > 0 && sessions.length < (plan.settings?.perDay || 2) && !!newSession(view) };
  }
  function another(childId) {
    const plan = planOf(childId);
    if (!plan) return null;
    const date = today(), sessions = plan.days?.[date] || [];
    if (sessions.some(s => !finished(s)) || sessions.length >= (plan.settings?.perDay || 2)) return null;
    const next = newSession(status(plan));
    if (!next) return null;
    (plan.days ||= {})[date] = [...sessions, next]; savePlan(plan);
    return next;
  }
  /* The days of the last weeks, oldest first: how many sessions were finished and whether one was started. */
  function calendar(plan, count = 28) {
    const days = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
      const key = today(d), sessions = plan?.days?.[key] || [];
      days.push({ date: key, day: d.getDate(), weekday: d.getDay(), done: sessions.filter(finished).length, started: sessions.some(s => s.activities.some(a => a.done)), today: i === 0 });
    }
    return days;
  }

  /* ---------- From the home page to a part and back ---------- */
  /* Opens an activity: remembers it for the part, and gives the address to go to. */
  function begin(childId, key) {
    const info = day(childId), activity = info?.open?.activities.find(a => a.key === key);
    if (!activity) return null;
    write(TODAY_KEY, { child: childId, date: today(), session: info.open.id, key, at: Date.now() });
    return `${url(PARTS[activity.part].href)}#today`;
  }
  /* The activity a part was opened for, while it is still today's and the same child is active. */
  function current() {
    const asked = read(TODAY_KEY, null), child = root.ArticulationChildren?.active();
    if (!asked || !child || asked.child !== child.id || asked.date !== today()) return null;
    const session = (planOf(child.id)?.days?.[asked.date] || []).find(s => s.id === asked.session), activity = session?.activities.find(a => a.key === asked.key);
    return activity ? { ...activity, session: session.id, at: asked.at } : null;
  }
  /* A part finished a round of this sound (or pattern) and these short goals: the matching activity of today's open
     session is done (the same short goal first, else the same sound). Returns the session afterwards. */
  function done(part, id, zones = []) {
    const child = root.ArticulationChildren?.active(), plan = planOf(child?.id);
    if (!plan || !PARTS[part]) return null;
    const date = today(), session = (plan.days?.[date] || []).find(s => !finished(s));
    if (!session) return null;
    const same = a => a.part === part && (part === 'approaches' ? (a.patterns ? a.patterns.includes(id) : a.pattern === id) : String(PARTS[part].id(a.letter)) === String(id));
    const open = session.activities.filter(a => !a.done && same(a)), activity = open.find(a => zones.includes(a.zone)) || open[0];
    if (!activity) return null;
    activity.done = new Date().toISOString();
    (plan.last ||= {})[activity.key] = Date.now();
    savePlan(plan); applyGoals(plan);
    const asked = read(TODAY_KEY, null);
    if (asked?.key === activity.key) write(TODAY_KEY, { ...asked, key: null });
    const next = session.activities.find(a => !a.done) || null;
    const sticker = next ? null : award(child, session);
    return { session, activity, next, sticker };
  }
  /* The sticker album (stickers/): finishing today's session gives one sticker, a picture of a word with the session's
     first sound (the album draws it). Kept with the child as { date, session, letter }; once per session. */
  function award(child, session) {
    const Children = root.ArticulationChildren; if (!child || !Children?.update) return null;
    const have = child.stickers || [];
    if (have.some(s => s.session === session.id)) return null;
    const sound = session.activities.find(a => a.letter), sticker = { date: today(), session: session.id, letter: sound?.letter || null };
    return Children.update(child.id, { stickers: [...have, sticker] }) ? sticker : null;
  }

  /* ---------- What the plan page and the home page show ---------- */
  const PARENT_NAMES = Object.fromEntries(Object.entries(PARTS).map(([id, part]) => [id, part.name]));
  function label(activity) {
    if (activity.part === 'approaches') {
      const names = (activity.patterns || [activity.pattern]).map(id => PATTERNS.find(p => p.id === id)?.name).filter(Boolean);
      return { title: PARTS.approaches.name, target: ZONE_NAMES[activity.zone], detail: names.length > 1 ? `${names.length} أنماط` : names[0] || '' };
    }
    return { title: PARTS[activity.part].name, target: activity.letter, detail: ZONE_NAMES[activity.zone] };
  }
  /* Line icons (24×24, stroked) for the parts, shared by the home page, the plan page and the parts. */
  const ICONS = {
    syllables: '<rect x="2" y="9" width="6" height="7" rx="1.5"/><rect x="9" y="9" width="6" height="7" rx="1.5"/><path d="M16 16V7h3l3 4v5Z"/><circle cx="5" cy="18" r="1.5"/><circle cx="12" cy="18" r="1.5"/><circle cx="19" cy="18" r="1.5"/>',
    words: '<path d="M4 5h16v11H8l-4 4Z"/><path d="M8 9h8M8 12h5"/>',
    phrases: '<path d="M3 5h9v7H6l-3 3Z"/><path d="M12 9h9v7h-1v3l-3-3h-5Z"/>',
    sentences: '<path d="M4 6h16M4 10h16M4 14h16M4 18h9"/>',
    stories: '<path d="M12 6c-2-1.5-5-2-9-2v14c4 0 7 .5 9 2 2-1.5 5-2 9-2V4c-4 0-7 .5-9 2Zm0 0v14"/>',
    approaches: '<rect x="2" y="5" width="8" height="14" rx="2"/><rect x="14" y="5" width="8" height="14" rx="2"/><path d="M11 12h2"/>',
    plan: '<path d="M3 20h4v-4h4v-4h4V8h4"/><path d="M19 8V3l3 1.5L19 6"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    open: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    play: '<path d="M8 5v14l11-7Z"/>',
    home: '<path d="m3 10 9-7 9 7v10H5V10M9 21v-8h6v8"/>',
  };
  /* One therapist switch for the whole app (2026-11): the lock in each page's header, password 013, kept by the shared
     assets/intervention.js as 'on' under articulation-therapist. The home page's old switch (OPEN_KEY) counts once. */
  const THERAPIST_KEY = 'articulation-therapist';
  try { if (localStorage.getItem(OPEN_KEY) === '"on"' && !localStorage.getItem(THERAPIST_KEY)) localStorage.setItem(THERAPIST_KEY, 'on'); localStorage.removeItem(OPEN_KEY); } catch {}
  const therapistOpen = () => { try { return localStorage.getItem(THERAPIST_KEY) === 'on'; } catch { return false; } };
  const setTherapist = on => {
    try { on ? localStorage.setItem(THERAPIST_KEY, 'on') : localStorage.removeItem(THERAPIST_KEY); } catch { return false; }
    root.dispatchEvent?.(new CustomEvent('voc-therapist-change', { detail: { active: !!on } }));
    return true;
  };

  const api = { KEY, TODAY_KEY, TARGET, STREAK, AT_ONCE, MINUTES, PARTS, LADDER, PATTERNS, FEATURES, ZONE_NAMES, WORD_IDS, SYLLABLE_IDS, PARENT_NAMES, ICONS,
    today, url, planOf, savePlan, remove, create, status, partsOf, recordIn, zoneState, percentOf, sizeOf, applyGoals, day, another, calendar, begin, current, done, label, therapistOpen, setTherapist, soundsOf, patternsOf,
    THERAPIST_KEY, goalIdsOf, writeGoals, fromGoals };
  root.ArticulationTherapy = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
