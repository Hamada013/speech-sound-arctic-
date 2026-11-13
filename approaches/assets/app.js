/* The approaches part (المناهج): minimal pairs, maximal and multiple oppositions, and cycles, for a child's error patterns.
   Home, accounts, therapist switch, goals (a pattern; its short goals are the three approaches) and report work as in the
   other parts. Pairs and oppositions: listening turns (the app says one word, the child taps its picture), then saying
   turns (the child says the lifted picture; the listener taps the picture they heard; the other one means a funny
   misunderstanding and one more try). Cycles: one pattern and sound a week, a listening slideshow, five words to say,
   and a short listening slideshow again. Grades are kept only while the therapist switch is on. */
(() => {
  const Data = window.ArticulationData, A = window.ApproachData, W = window.WordsData, Plan = window.ArticulationPlan, Report = window.ArticulationReport;
  const Sound = window.PhraseAudio, Pictures = window.ApproachPictures, Children = window.ArticulationChildren;
  const { positions, sounds, soundById, positionName } = Data;
  const KEY = 'articulation-approaches-children-v1', TEST_KEY = 'articulation-approaches-test-v1', PASSWORD = '013', TURNS = 5, WEEK = 7 * 864e5;
  const $ = id => document.getElementById(id);
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(resolve => setTimeout(resolve, calm() ? 0 : ms));
  const shuffle = list => { const out = [...list]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; };
  const blank = () => ({ attempts: [], goals: {}, played: {}, run: null, cycles: null });
  const bare = word => word.normalize('NFKC').replace(/[ً-ْٰ]/g, '');
  function toast(text) { const box = $('toast'); box.textContent = text; box.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { box.hidden = true; }, 3800); }

  /* The words part's words, by letter, and their recordings (only real words have one). */
  const wordsOfLetter = letter => { const sound = W.sounds.find(s => s.letter === letter || (letter === 'ء' && s.id === 'alef')); return sound ? [...sound.words.first, ...sound.words.middle, ...sound.words.last] : []; };
  const everyWord = W.sounds.flatMap(s => [...s.words.first, ...s.words.middle, ...s.words.last]);
  const recordings = new Map(everyWord.map(w => [bare(w.word), w.n]));
  /* This part's own recordings (sounds/, numbered in sounds/README.txt), else the words part's for its words. */
  const OWN = window.ApproachRecordings || {};
  const recordingOf = w => { const own = OWN[bare(w.word) + (w.nonword ? '*' : '')]; if (own) return `sounds/${own}.m4a`; return !w.nonword && recordings.has(bare(w.word)) ? `../words/sounds/${recordings.get(bare(w.word))}.m4a` : null; };
  /* Whether the word's recording is really there yet; until then the adult says the word. */
  const hasRecording = async w => { const url = recordingOf(w); return url ? Sound.has(url) : false; };

  /* Who the children are comes from the one list shared with the home page and the other parts. */
  let store = { schema: 1, active: null, children: [] };
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.schema === 1 && Array.isArray(saved.children)) store = saved; } catch {}
  store.children.forEach(child => { child.progress = { ...blank(), ...child.progress }; });
  function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); return true; } catch { toast('تعذّر حفظ التقدم على هذا الجهاز.'); return false; } }
  function recordOf(person) {
    let child = store.children.find(entry => entry.id === person.id);
    if (!child) { child = { id: person.id, progress: blank() }; store.children.push(child); }
    return Object.assign(child, { name: person.name, created: person.created, character: person.character === 'girl' ? 'girl' : 'boy' });
  }
  const active = () => { const person = Children.active(); return person ? recordOf(person) : null; };
  window.ArticulationActive = active;

  let testMode = false;
  try { testMode = localStorage.getItem(TEST_KEY) === 'on'; } catch {}
  function setTestMode(on) { testMode = on; try { localStorage.setItem(TEST_KEY, on ? 'on' : 'off'); } catch { toast('تعذّر حفظ الإعداد على هذا الجهاز.'); } drawHome(); }
  function drawHome() {
    const child = active();
    $('account-name').textContent = child ? child.name : 'الحسابات';
    $('account').setAttribute('aria-label', child ? `الحساب: ${child.name}` : 'الحسابات');
    $('account-face').hidden = !child;
    if (child) $('account-face').replaceChildren(window.SuiteAccounts.avatar(child, 'small'));
    $('test-switch').setAttribute('aria-checked', String(testMode));
    $('report-open').hidden = !testMode;
    $('home').classList.toggle('therapist', testMode);
  }
  document.querySelectorAll('dialog [data-close]').forEach(button => { button.onclick = () => { afterPick = null; button.closest('dialog').close(); }; });
  document.querySelectorAll('dialog.sheet').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom) return;
    afterPick = null; dialog.close();
  }));

  /* Accounts */
  let afterPick = null;
  function choose(id) { Children.choose(id); drawHome(); $('accounts').close(); const next = afterPick; afterPick = null; next?.(); }
  function drawAccounts() {
    $('child-name').value = ''; $('account-error').hidden = true;
    window.SuiteAccounts.render($('account-list'), Children.list(), child => { const select = document.createElement('button'); select.type = 'button'; select.onclick = () => choose(child.id); return window.SuiteAccounts.row(child, select); });
  }
  async function openAccounts() { if (active() && !await window.ChildAccountGate.request()) return; drawAccounts(); $('accounts').showModal(); }
  $('account').onclick = () => { afterPick = null; void openAccounts(); };
  $('account-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = $('child-name').value.trim();
    if (!name) { $('account-error').textContent = 'اكتب اسم الطفل أولًا.'; $('account-error').hidden = false; $('child-name').focus(); return; }
    choose(Children.add(name, new FormData(event.target).get('character')).id);
  });

  /* Therapist switch */
  let pin = '';
  const dots = () => document.querySelectorAll('#pin-dots i').forEach((dot, i) => dot.classList.toggle('on', i < pin.length));
  function press(digit) {
    if (pin.length >= 3) return;
    pin += digit; dots();
    if (pin.length < 3) return;
    if (pin === PASSWORD) { setTestMode(!testMode); $('password').close(); return; }
    $('pin-error').textContent = 'كلمة السر غير صحيحة.';
    $('pin-dots').classList.add('shake');
    setTimeout(() => { pin = ''; dots(); $('pin-dots').classList.remove('shake'); }, 420);
  }
  for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) { const button = document.createElement('button'); button.type = 'button'; button.textContent = key; button.onclick = () => press(key); $('pin-pad').append(button); }
  $('password').addEventListener('keydown', event => { if (/^\d$/.test(event.key)) press(event.key); });
  $('test-switch').onclick = () => { pin = ''; dots(); $('pin-error').textContent = ''; $('password').showModal(); };

  /* Report */
  function drawReport() { const child = active(); $('report-pdf').disabled = !child || !Report.hasData(child); $('report-status').hidden = true; if (child) Report.draw($('report-body'), child); else $('report-body').textContent = 'اختر حسابًا أولًا.'; }
  $('report-open').onclick = () => { $('report').showModal(); drawReport(); };
  $('report-pdf').onclick = async () => {
    const status = $('report-status'), button = $('report-pdf');
    button.disabled = true; status.textContent = 'جارٍ إعداد التقرير…'; status.hidden = false;
    try { await Report.download(active()); status.hidden = true; } catch { status.textContent = 'تعذّر إنشاء التقرير. أعد المحاولة.'; } finally { button.disabled = false; }
  };

  /* Goals: a long goal is an error pattern; its short goals are the approaches used for it. */
  function setGoal(pattern, chosen) {
    const progress = active().progress;
    if (chosen.length) progress.goals[pattern.id] = positions.map(p => p.id).filter(id => chosen.includes(id)); else delete progress.goals[pattern.id];
    save(); drawGoals();
  }
  function drawGoals() {
    const child = active(), body = $('goals-body');
    if (!child) { body.textContent = 'اختر حسابًا أولًا.'; return; }
    const note = document.createElement('p'); note.className = 'muted goal-note'; note.textContent = `الهدف البعيد نمط خطأ، والقريب طريقة العمل عليه. يُعدّ محققًا عند ${Plan.TARGET}% في جلستين متتاليتين.`;
    body.replaceChildren(note, ...sounds.map(sound => {
      const chosen = child.progress.goals[sound.id] || [], box = document.createElement('section'); box.className = 'goal';
      const head = document.createElement('div'); head.className = 'goal-head';
      const tag = document.createElement('b'); tag.className = 'pattern-tag'; tag.textContent = sound.letter; tag.dir = 'rtl';
      const name = document.createElement('span'); name.className = 'goal-name'; name.textContent = sound.name;
      const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'switch-mini'; toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', String(chosen.length > 0)); toggle.setAttribute('aria-label', `الهدف البعيد: ${sound.name}`);
      const track = document.createElement('span'); track.className = 'switch-track'; track.append(document.createElement('span')); toggle.append(track);
      toggle.onclick = () => setGoal(sound, chosen.length ? [] : ['pairs']);
      head.append(tag, name, toggle);
      const chips = document.createElement('div'); chips.className = 'goal-chips'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', `الأهداف القريبة: ${sound.name}`);
      positions.forEach(position => {
        const chip = document.createElement('button'), last = Plan.attemptsOf(child, sound.id, position.id).at(-1), on = chosen.includes(position.id), label = document.createElement('span'), info = document.createElement('small');
        chip.type = 'button'; chip.className = 'goal-chip goal-chip-text'; chip.setAttribute('aria-pressed', String(on));
        label.textContent = position.name; info.dir = 'ltr';
        info.textContent = Plan.reached(child, sound.id, position.id) ? `${Plan.percent(last)}% ✓` : last ? `${Plan.percent(last)}%` : '—';
        chip.append(label, info);
        chip.onclick = () => setGoal(sound, on ? chosen.filter(id => id !== position.id) : [...chosen, position.id]);
        chips.append(chip);
      });
      box.append(head, chips);
      return box;
    }));
  }
  $('goals-open').onclick = () => { drawGoals(); $('goals').showModal(); };

  /* ---------- Choosing what to play ---------- */
  /* An approach opens straight on the one goal pattern that uses it; with several, or none, the pattern board asks. */
  function startApproach(activity) {
    Sound.unlock();
    const child = active();
    if (!child) { afterPick = () => startApproach(activity); drawAccounts(); $('accounts').showModal(); return; }
    const goal = sounds.filter(sound => child.progress.goals[sound.id]?.includes(activity));
    if (activity === 'cycles' && goal.length) { startCycles(goal.map(sound => sound.pattern)); return; }
    if (goal.length === 1) { begin(activity, goal[0].pattern); return; }
    showPatterns(activity, goal.length ? goal : sounds);
  }
  document.querySelectorAll('[data-approach]').forEach(button => { button.onclick = () => startApproach(button.dataset.approach); });
  function showPatterns(activity, list) {
    $('pattern-title').textContent = positionName(activity);
    $('pattern-tiles').replaceChildren(...list.map(sound => {
      const tile = document.createElement('button'), tag = document.createElement('b'), name = document.createElement('span');
      tile.type = 'button'; tile.className = 'pattern-tile'; tag.textContent = sound.letter; tag.dir = 'rtl'; name.textContent = sound.name;
      tile.append(tag, name);
      tile.onclick = () => { $('patterns').hidden = true; if (activity === 'cycles') startCycles([sound.pattern]); else begin(activity, sound.pattern); };
      return tile;
    }));
    $('home').hidden = true; $('patterns').hidden = false;
  }
  $('patterns-back').onclick = () => { $('patterns').hidden = true; $('home').hidden = false; };

  /* ---------- Pairs and oppositions ---------- */
  /* The sets of cards for a session: five pairs (pairs), or five opposition sets (several cards: multiple, or two far-apart sounds: maximal). */
  function setsFor(activity, pattern) {
    if (pattern.deletion) {
      const words = ['ب', 'ت', 'د', 'ك', 'م', 'ن', 'ل', 'ر', 'س'].flatMap(l => (W.sounds.find(s => s.letter === l)?.words[pattern.deletion] || []).slice(0, 4));
      return shuffle(A.deletionPairs(pattern.deletion, words, 12, everyWord)).slice(0, TURNS).map(p => ({ cards: [p.target, p.error], targets: [p.target] }));
    }
    if (activity === 'pairs') {
      const pairs = pattern.contrasts.flatMap(([target, error]) => A.allPairs(target, error, wordsOfLetter(target), 5, everyWord).filter(p => p.strong));
      return shuffle(pairs).slice(0, TURNS).map(p => ({ cards: [p.target, p.error], targets: [p.target] }));
    }
    const byError = {}; pattern.contrasts.forEach(([t, e]) => (byError[e] ||= []).push(t));
    let sets = Object.entries(byError).filter(([, targets]) => targets.length > 1).flatMap(([error, targets]) => A.multipleFor(error, targets).map(set => ({ cards: [set.error, ...set.targets], targets: set.targets })));
    if (sets.length < TURNS) sets = [...sets, ...[...new Set(pattern.contrasts.map(c => c[0]))].flatMap(t => A.maximalFor(t).filter(m => m.strong).map(m => ({ cards: [m.target, m.other], targets: [m.target] })))];
    if (!sets.length) return setsFor('pairs', pattern);
    while (sets.length < TURNS) sets = [...sets, ...sets];
    return shuffle(sets).slice(0, TURNS);
  }
  /* Five listening turns (the app says one card, the child taps it), then five saying turns (the child says a target card). */
  function begin(activity, pattern) {
    const sets = setsFor(activity, pattern);
    if (!sets.length) { toast('لا توجد كلمات لهذا النمط بعد.'); return; }
    const listen = sets.map((set, k) => ({ kind: 'listen', key: `listen-${k}`, cards: shuffle(set.cards), word: set.cards[Math.floor(Math.random() * set.cards.length)] }));
    const say = sets.map((set, k) => ({ kind: 'say', key: `say-${k}`, cards: shuffle(set.cards), word: set.targets[k % set.targets.length] }));
    session = { activity, pattern, turns: [...listen, ...say], index: 0, scores: {}, id: Date.now().toString(36) };
    const progress = active().progress; progress.played[pattern.id] = (progress.played[pattern.id] || 0) + 1; save();
    enterStage();
    void showTurn();
  }
  let session = null, busy = false, tries = 0;
  function drawDots() {
    $('ap-dots').replaceChildren(...session.turns.map((turn, i) => { const dot = document.createElement('i'); dot.className = (i < session.index ? 'done' : i === session.index ? 'now' : '') + (turn.kind === 'say' ? ' say' : ''); return dot; }));
  }
  async function speak(word) { const url = recordingOf(word); if (!url) return false; try { await Sound.play(url); return true; } catch { return false; } }
  /* Shows one turn: the cards, and in listening turns the word to hear (the recording, or a note for the adult to say it). */
  async function showTurn() {
    const turn = session.turns[session.index]; tries = 0; busy = false;
    drawDots();
    $('ap-phase').dataset.kind = turn.kind; $('ap-phase').setAttribute('aria-label', turn.kind === 'listen' ? 'استمع واختر' : 'قل الكلمة');
    $('ap-cards').style.setProperty('--n', turn.cards.length);
    $('ap-cards').replaceChildren(...turn.cards.map(word => {
      const card = document.createElement('button'), img = document.createElement('img'), text = document.createElement('span');
      card.type = 'button'; card.className = 'ap-card'; card.setAttribute('aria-label', word.nonword ? `${word.word}، كلمة بلا معنى` : word.word);
      img.src = Pictures.uri(word); img.alt = ''; text.textContent = word.word; text.className = 'ap-word';
      card.append(img, text); card.onclick = () => void pick(card, word);
      if (!calm()) card.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 320, easing: 'cubic-bezier(.2,1.3,.5,1)' });
      return card;
    }));
    const target = [...$('ap-cards').children][turn.cards.indexOf(turn.word)];
    $('ap-say').textContent = `قُلْ: ${turn.word.word}`; $('ap-say').hidden = true; $('ap-speaker').hidden = true;
    const recorded = await hasRecording(turn.word);
    if (session?.turns?.[session.index] !== turn) return;
    $('ap-say').hidden = recorded || turn.kind === 'say';
    $('ap-speaker').hidden = turn.kind !== 'listen' || !recorded;
    if (turn.kind === 'say') { target.classList.add('lift'); $('ap-hint').textContent = 'قُلْ اسم الصورة المرتفعة'; }
    else $('ap-hint').textContent = 'استمع، ثم اضغط الصورة';
    if (turn.kind === 'listen') { await wait(450); if (session && session.turns[session.index] === turn) void speak(turn.word); }
  }
  $('ap-speaker').onclick = () => { const turn = session?.turns?.[session.index]; if (turn) void speak(turn.word); };
  /* A tap on a card: the child's choice when listening; what the listener heard when the child says the word. */
  async function pick(card, word) {
    if (busy || !session) return;
    const turn = session.turns[session.index], right = word === turn.word, cards = [...$('ap-cards').children], targetCard = cards[turn.cards.indexOf(turn.word)];
    busy = true; Sound.stop();
    if (turn.kind === 'listen') {
      record(turn, right ? 1 : 0);
      if (right) { card.classList.add('right'); Sound.sfx('snap'); }
      else { card.classList.add('wrong'); targetCard.classList.add('right'); Sound.sfx('oops'); }
      await wait(right ? 800 : 1300);
      return next();
    }
    if (right) { record(turn, tries ? .5 : 1); card.classList.remove('lift'); card.classList.add('right'); Sound.sfx('snap'); await wait(900); return next(); }
    /* The listener heard the other word: that picture jumps up, puzzled, and the child tries once more. */
    card.classList.add('oops'); Sound.sfx('oops');
    await wait(1500);
    card.classList.remove('oops');
    if (++tries >= 2) { record(turn, 0); targetCard.classList.add('right'); await wait(900); return next(); }
    busy = false;
  }
  function record(turn, value) { if (testMode) session.scores[turn.key] = value; }
  async function next() {
    session.index++;
    if (session.index >= session.turns.length) return finish();
    await showTurn();
  }
  function finish() {
    const child = active(), keys = Object.keys(session.scores);
    if (keys.length) child.progress.attempts.push({ date: new Date().toISOString(), run: session.id, sound: session.pattern.id, zone: session.activity, scores: { ...session.scores } });
    save();
    showDone(keys.length ? Plan.percent({ scores: session.scores }) : null, `${session.pattern.name} · ${positionName(session.activity)}`);
  }

  /* ---------- Cycles (Hodson) ---------- */
  /* One pattern and one target sound a week, in turn through the chosen patterns; the cycle then starts again.
     The therapist can move on now or hold the current week. */
  function cycleNow(patterns) {
    const progress = active().progress, ids = patterns.map(p => p.id);
    let state = progress.cycles;
    if (!state || state.ids.join() !== ids.join()) state = progress.cycles = { ids, index: 0, since: Date.now(), held: false };
    if (!state.held && Date.now() - state.since >= WEEK) { state.index++; state.since = Date.now(); }
    save();
    const pattern = A.PATTERNS.find(p => p.id === state.ids[state.index % state.ids.length]);
    const targets = [...new Set(pattern.contrasts.map(c => c[0]))], round = Math.floor(state.index / state.ids.length);
    return { state, pattern, target: targets.length ? targets[round % targets.length] : null };
  }
  let cycle = null;
  function startCycles(patterns) {
    if (!active()) return;
    cycle = { patterns, ...cycleNow(patterns) };
    const { pattern, target, state } = cycle;
    $('cy-pattern').textContent = pattern.name;
    $('cy-target').textContent = target || (pattern.deletion === 'last' ? 'الصوت الأخير' : 'الصوت الأول');
    $('cy-week').textContent = `الأسبوع ${state.index + 1}${state.held ? ' · ثابت' : ''}`;
    $('cy-tools').hidden = !testMode; $('cy-hold').setAttribute('aria-pressed', String(state.held));
    $('home').hidden = true; $('patterns').hidden = true; $('cycle').hidden = false;
  }
  $('cy-back').onclick = () => { $('cycle').hidden = true; $('home').hidden = false; };
  $('cy-next').onclick = () => { cycle.state.index++; cycle.state.since = Date.now(); save(); startCycles(cycle.patterns); };
  $('cy-hold').onclick = () => { cycle.state.held = !cycle.state.held; save(); startCycles(cycle.patterns); };
  /* The cycle's words: from the words part, by the target sound (or, for deletion, words ending or starting with a consonant). */
  function cycleWords() {
    const { pattern, target } = cycle;
    if (!target) { const zone = pattern.deletion; return ['ب', 'ت', 'د', 'ك', 'م', 'ن'].flatMap(l => W.sounds.find(s => s.letter === l).words[zone].slice(0, 3)); }
    const sound = W.sounds.find(s => s.letter === target);
    return [...sound.words.first.slice(0, 5), ...sound.words.middle.slice(0, 5), ...sound.words.last.slice(0, 5)];
  }
  $('cy-start').onclick = async () => {
    Sound.unlock();
    const words = cycleWords(), say = cycle.target ? W.sounds.find(s => s.letter === cycle.target).words.first.slice(0, 5) : words.filter((_, i) => i % 3 === 0).slice(0, 5);
    session = { activity: 'cycles', pattern: cycle.pattern, scores: {}, id: Date.now().toString(36), cycle: true };
    $('cycle').hidden = true; enterStage(true);
    /* The listening list at the start, the five words to say, then a short listening list again. */
    if (!await slideshow(words)) return;
    for (let k = 0; k < say.length; k++) { if (!await sayWord(say[k], `say-${k}`, k, say.length)) return; }
    if (!await slideshow(shuffle(words).slice(0, 8))) return;
    finish();
  };
  let stopShow = null;
  async function slideshow(words) {
    $('ap-show').hidden = false; $('ap-cards').hidden = true; $('ap-grades').hidden = true; $('ap-next').hidden = true;
    $('ap-phase').dataset.kind = 'listen'; $('ap-hint').textContent = 'استمع فقط'; $('ap-speaker').hidden = true; $('ap-say').hidden = true; $('ap-dots').replaceChildren();
    let stopped = false; stopShow = () => { stopped = true; Sound.stop(); };
    for (let i = 0; i < words.length && !stopped; i++) {
      const word = words[i];
      $('ap-show-img').src = Pictures.uri({ word: word.word, meaning: word.art }); $('ap-show-word').textContent = word.word;
      $('ap-show-count').textContent = `${i + 1} / ${words.length}`;
      if (!calm()) $('ap-show-card').animate([{ transform: 'translateX(-40px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300 });
      const played = await speak({ word: word.word });
      if (!played) await wait(1800); else await wait(500);
    }
    $('ap-show').hidden = true; $('ap-cards').hidden = false;
    /* Skipping ends the slideshow only; the session goes on unless the child left. */
    return !!session && playing;
  }
  $('ap-show-skip').onclick = () => { stopShow?.(); };
  /* One cycle word to say: its picture, the speaker, and the grades (therapist) or a next button (child). */
  function sayWord(word, key, k, total) {
    return new Promise(resolve => {
      $('ap-phase').dataset.kind = 'say'; $('ap-hint').textContent = 'قُلْ اسم الصورة';
      $('ap-dots').replaceChildren(...Array.from({ length: total }, (_, i) => { const dot = document.createElement('i'); dot.className = i < k ? 'done' : i === k ? 'now' : ''; return dot; }));
      const card = document.createElement('div'), img = document.createElement('img'), text = document.createElement('span');
      card.className = 'ap-card lift'; img.src = Pictures.uri({ word: word.word, meaning: word.art }); img.alt = ''; text.className = 'ap-word'; text.textContent = word.word; card.append(img, text);
      $('ap-cards').style.setProperty('--n', 1); $('ap-cards').replaceChildren(card);
      $('ap-speaker').hidden = true; $('ap-say').hidden = true; void hasRecording({ word: word.word }).then(ok => { if (session?.sayWord === word) $('ap-speaker').hidden = !ok; });
      $('ap-grades').hidden = !testMode; $('ap-next').hidden = testMode;
      const done = value => { if (value !== undefined && testMode) session.scores[key] = value; $('ap-grades').hidden = true; $('ap-next').hidden = true; resolve(!!session); };
      $('ap-grades').querySelectorAll('.grade').forEach(button => { button.onclick = () => { Sound.sfx('snap'); done(Number(button.dataset.score)); }; });
      $('ap-next').onclick = () => done();
      session.sayWord = word;
    });
  }
  $('ap-speaker').addEventListener('click', () => { if (session?.sayWord && $('ap-cards').children.length === 1) void speak({ word: session.sayWord.word }); });

  /* ---------- Entering and leaving ---------- */
  let playing = false;
  function enterStage(isCycle = false) {
    closeLayers();
    $('home').hidden = true; $('patterns').hidden = true; $('cycle').hidden = true; $('stage').hidden = false;
    $('ap-title').textContent = `${session.pattern.name} · ${positionName(session.activity)}`;
    if (!playing) history.pushState({ approach: true }, '');
    playing = true;
  }
  function closeLayers() { Sound.stop(); stopShow?.(); ['done', 'ap-show', 'ap-grades', 'ap-next'].forEach(id => { $(id).hidden = true; }); $('ap-cards').hidden = false; }
  function showDone(percent, what) {
    const result = $('done-result'); result.replaceChildren();
    if (testMode && percent !== null) { const total = document.createElement('strong'); total.className = 'big'; total.dir = 'ltr'; total.textContent = `${percent}%`; const p = document.createElement('p'); p.textContent = what; result.append(total, p); }
    Sound.sfx('fanfare'); $('done').hidden = false;
  }
  function leave(fromHistory = false) {
    if (!playing) return;
    playing = false; closeLayers(); session = null;
    $('stage').hidden = true; $('home').hidden = false; drawHome();
    if (!fromHistory && history.state?.approach) history.back();
  }
  window.addEventListener('popstate', () => leave(true));
  $('leave').onclick = () => leave();
  $('done-home').onclick = () => leave();
  $('done-again').onclick = () => { const { activity, pattern } = session || {}; leave(); if (activity === 'cycles') startCycles(cycle.patterns); else if (pattern) begin(activity, pattern); };

  drawHome();
  if (!Children.list().length) { drawAccounts(); $('accounts').showModal(); }
  window.ApproachGame = { session: () => session, cycle: () => cycle };
})();
