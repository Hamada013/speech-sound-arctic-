/* Goal bank for the therapist's intervention plan in «تدريب النطق» (the shared plan window, assets/intervention.js).
   One plan for the whole app: the goals are the plan engine's own targets (assets/therapy.js).
   - One long-term goal per sound: the child says it right in speech. Its short-term goals are the levels the engine
     climbs: syllables, words, phrases, sentences, stories (no syllables for ء, و, ي).
   - One long-term goal per error pattern (the approaches part): the child stops the pattern, with its approach.
   - Percentages come by themselves from the games' graded sessions (the engine's zoneState): the mean of the latest
     score of each short goal's zones. A short goal is achieved when every zone reached 80% in two whole sessions in a
     row, the app's own rule. 80% is the user's criterion, not a published norm.
   - Ready plans follow the child's test plan when there is one (its sounds' current, next and last levels), else the
     usual order of acquisition (early, middle, late sounds) at the words level.
   - Saving the window's goals updates the engine (ArticulationTherapy.fromGoals); a new test plan writes its goals here. */
((root) => {
  'use strict';
  const T = () => root.ArticulationTherapy;
  const APP = { id: 'articulation', name: 'تدريب النطق', therapistKey: 'articulation-therapist', unlocksLevels: true, progress: () => root.ArticulationProgress };
  const SOURCES = {
    'asha-ssd': {
      label: 'ASHA Practice Portal: Speech Sound Disorders: Articulation and Phonology',
      url: 'https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/',
      note: 'Treatment moves a target sound from isolation and syllables to words, phrases, sentences and conversation; contrast approaches treat error patterns.'
    },
    'van-riper': {
      label: 'Van Riper, C., & Erickson, R. L. (1996). Speech Correction: An Introduction to Speech Pathology and Audiology (9th ed.). Allyn & Bacon.',
      url: '',
      note: 'The traditional articulation approach: the sound is practised from the simplest context up to running speech.'
    },
    'amayreh-dyson': {
      label: 'Amayreh, M. M., & Dyson, A. T. (1998). The acquisition of Arabic consonants. Journal of Speech, Language, and Hearing Research, 41(3), 642–653.',
      url: '',
      note: 'The order in which Arabic-speaking children master consonants guides which sounds come first.'
    },
    'weiner': {
      label: 'Weiner, F. (1981). Treatment of phonological disability using the method of meaningful minimal contrast: Two case studies. Journal of Speech and Hearing Disorders, 46(1), 97–103.',
      url: '',
      note: 'Minimal pairs: words that differ in one sound show the child that the error changes the meaning.'
    },
    'williams': {
      label: 'Williams, A. L. (2000). Multiple oppositions: Theoretical foundations for an alternative contrastive intervention approach. American Journal of Speech-Language Pathology, 9(4), 282–288.',
      url: '',
      note: 'Multiple oppositions: one error sound against several targets the child collapses into it.'
    },
    'hodson': {
      label: 'Hodson, B. W., & Paden, E. P. (1991). Targeting Intelligible Speech: A Phonological Approach to Remediation (2nd ed.). Pro-Ed.',
      url: '',
      note: 'Cycles: each error pattern gets a short turn, and the cycle repeats.'
    }
  };
  const LEVELS_OF = { syllables: 'المقاطع', words: 'الكلمات', phrases: 'العبارات', sentences: 'الجمل', stories: 'القصص' };
  const SHORT_TEXT = {
    syllables: l => `يقول «${l}» صحيحاً في المقاطع (صامت وحركة).`,
    words: l => `يقول «${l}» صحيحاً في الكلمات.`,
    phrases: l => `يقول «${l}» صحيحاً في العبارات.`,
    sentences: l => `يقول «${l}» صحيحاً في الجمل.`,
    stories: l => `يقول «${l}» صحيحاً وهو يحكي قصة.`
  };
  const APPROACH_TEXT = { pairs: 'بالأزواج الدنيا', oppositions: 'بالمتقابلات', cycles: 'بالدورات' };
  const LETTERS = 'بمنتدكءهويفلحعخجشسزرغقطصضثذظ'; // the engine's ORDER: early sounds first
  const SYLLABLE = new Set('بتثجحخدذرزسشصضطظعغفقكلمنه');

  // The bank is built once, from the engine's sound order and patterns.
  let bank = null;
  function build() {
    if (bank) return bank;
    const patterns = T()?.PATTERNS || [];
    const sounds = [...LETTERS].map(letter => ({
      id: `L-${letter}`, title: `صوت «${letter}»`, text: `يقول الطفل صوت «${letter}» صحيحاً في الكلام.`, sources: ['asha-ssd', 'van-riper', 'amayreh-dyson'], letter,
      short: Object.keys(LEVELS_OF).filter(level => level !== 'syllables' || SYLLABLE.has(letter)).map(level => ({ id: `S-${letter}-${level}`, text: SHORT_TEXT[level](letter), where: LEVELS_OF[level], letter, level }))
    }));
    const kinds = patterns.map(pattern => ({
      id: `L-P-${pattern.id}`, title: `نمط «${pattern.name}»`, text: `يترك الطفل نمط «${pattern.name}» ويقول الأصوات الصحيحة.`, sources: ['asha-ssd', 'weiner', 'williams', 'hodson'], pattern: pattern.id,
      short: [{ id: `S-P-${pattern.id}`, text: `يقول الكلمات المتقابلة صحيحة في «${pattern.name}» (المناهج).`, where: 'المناهج', pattern: pattern.id }]
    }));
    return bank = { GOALS: [...sounds, ...kinds], byId: new Map([...sounds, ...kinds].flatMap(goal => goal.short.map(item => [item.id, { ...item, long: goal }]))) };
  }

  const GROUPS = { P1: [...'بمنتدكءهوي'], P2: [...'فلحعخجشسز'], P3: [...'رغقطصضثذظ'] };
  // Ready plans: from the child's test plan when there is one, else by the usual order of acquisition.
  function plans() {
    const engine = T(), child = APP.progress()?.active(), view = child && engine?.planOf(child.id) ? engine.status(engine.planOf(child.id)) : null;
    if (view?.sounds.length) {
      const pick = which => view.sounds.flatMap(sound => {
        const steps = sound.steps.filter(step => !['skip', 'soon'].includes(step.state)), now = steps.findIndex(step => step.state === 'now');
        const chosen = which === 'P1' ? steps.slice(Math.max(0, now), Math.max(0, now) + 1) : which === 'P2' ? steps.slice(Math.max(0, now) + 1, Math.max(0, now) + 3) : steps.slice(-1);
        return chosen.map(step => `S-${sound.letter}-${step.part}`);
      }).concat(which === 'P3' ? view.patterns.map(pattern => `S-P-${pattern.id}`) : []);
      return [
        { id: 'P1', title: 'بداية', text: 'مستوى كل صوت الآن في الخطة', goals: pick('P1') },
        { id: 'P2', title: 'متوسط', text: 'المستويان التاليان لكل صوت', goals: pick('P2') },
        { id: 'P3', title: 'متقدم', text: 'القصص والأنماط', goals: pick('P3') }
      ].map(entry => ({ ...entry, goals: [...new Set(entry.goals)].filter(id => short(id)) }));
    }
    return Object.entries(GROUPS).map(([id, letters], i) => ({ id, title: ['بداية', 'متوسط', 'متقدم'][i], text: ['الأصوات المبكرة في الكلمات', 'الأصوات المتوسطة في الكلمات', 'الأصوات المتأخرة في الكلمات'][i], goals: letters.map(letter => `S-${letter}-words`) }));
  }
  const LEVELS = [20, 40, 60, 80];
  const ACHIEVED = 80;
  const short = id => build().byId.get(id) || null;

  /** The app's own percentages: for each short goal, the mean of its zones' latest scores, from the graded sessions
   *  of that part; achieved when every zone reached 80% twice in a row (the engine's rule). */
  function estimate(child) {
    const engine = T(); if (!child?.id || !engine) return {};
    const out = {}, plan = engine.planOf(child.id);
    for (const [id, item] of build().byId) {
      const part = item.level || 'approaches', key = item.pattern || engine.PARTS[part]?.id(item.letter);
      if (!key) continue;
      const record = engine.recordIn(part, child.id); if (!record?.progress?.attempts?.length) continue;
      const sound = plan?.sounds.find(entry => entry.letter === item.letter);
      const zones = item.pattern ? [plan?.patterns.find(entry => entry.id === item.pattern)?.approach || 'pairs'] : part === 'words' && sound?.words?.length ? sound.words : engine.PARTS[part].zones;
      const states = zones.map(zone => engine.zoneState(record, part, key, zone)).filter(state => state.sessions);
      if (!states.length) continue;
      const attempts = record.progress.attempts.filter(entry => String(entry.sound) === String(key) && zones.includes(entry.zone)), last = attempts.map(entry => entry.date).filter(Boolean).sort().at(-1) || null;
      const reached = states.length === zones.length && states.every(state => state.reached);
      out[id] = { percent: Math.round(states.reduce((n, state) => n + (state.last || 0), 0) / states.length), sessions: attempts.length, streak: reached ? 2 : 0, achieved: reached ? last : null, last, history: [] };
    }
    return out;
  }
  /** Suggested next goals: after an achieved level, the next level of the same sound not in the plan yet. */
  function suggest(planIds, achievedIds, limit = 4) {
    const inPlan = new Set(planIds), done = new Set(achievedIds), out = [];
    for (const goal of build().GOALS) { const ids = goal.short.map(item => item.id); if (!ids.some(id => done.has(id))) continue; const next = ids.find(id => !inPlan.has(id) && !done.has(id)); if (next) out.push(next); }
    return out.slice(0, limit);
  }
  const api = { estimate, suggest, APP, SOURCES, LEVELS, ACHIEVED, short, LEVELS_OF,
    get GOALS() { return build().GOALS; }, get PLANS() { return plans(); }, MEASURES: {} };
  if (typeof module !== 'undefined') module.exports = api;
  root.InterventionGoals = api;
})(globalThis);
