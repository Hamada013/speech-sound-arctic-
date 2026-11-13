/* Home, accounts, the letter board, the word encounter, the item board, goals and saved results. */
(() => {
  const Data = window.ArticulationData, Art = window.ArticulationArt, Sound = window.ArticulationAudio, Game = window.ArticulationGame, Plan = window.ArticulationPlan, Report = window.ArticulationReport, Scenes = window.ArticulationScenes;
  const { positions, sounds, soundById, positionName } = Data;
  const KEY = 'articulation-words-children-v1', TEST_KEY = 'articulation-words-test-v1', PASSWORD = '013';
  const $ = id => document.getElementById(id);
  const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const blank = () => ({ attempts: [], goals: {}, played: {}, lastScenario: null, run: null });
  const Children = window.ArticulationChildren;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function toast(text) { const box = $('toast'); box.textContent = text; box.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { box.hidden = true; }, 3800); }

  /* Who the children are comes from the one list shared with the home page and the other apps.
     What a child earns here lives in this app's own record under the same id; deleting a child removes it. */
  let store = { schema: 1, active: null, children: [] };
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.schema === 1 && Array.isArray(saved.children)) store = saved; } catch {}
  store.children.forEach(child => {
    const old = child.progress || {};
    child.progress = 'collected' in old ? { ...blank(), attempts: (old.attempts || []).map(entry => ({ sound: 'alef', ...entry })) } : { ...blank(), ...old };
  });
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(store)); return true; }
    catch { toast('تعذّر حفظ التقدم على هذا الجهاز.'); return false; }
  }
  function recordOf(person) {
    let child = store.children.find(entry => entry.id === person.id);
    if (!child) { child = { id: person.id, progress: blank() }; store.children.push(child); }
    return Object.assign(child, { name: person.name, created: person.created, character: person.character === 'girl' ? 'girl' : 'boy' });
  }
  const active = () => { const person = Children.active(); return person ? recordOf(person) : null; };
  window.ArticulationActive = active;
  const currentRun = () => active()?.progress.run || null;

  let testMode = false;
  try { testMode = localStorage.getItem(TEST_KEY) === 'on'; } catch {}
  function setTestMode(on) {
    testMode = on;
    try { localStorage.setItem(TEST_KEY, on ? 'on' : 'off'); } catch { toast('تعذّر حفظ الإعداد على هذا الجهاز.'); }
    drawHome();
  }

  function drawHome() {
    const child = active();
    $('account-name').textContent = child ? child.name : 'الحسابات';
    $('account-face').hidden = !child;
    if (child) $('account-face').replaceChildren(window.SuiteAccounts.avatar(child, 'small'));
    $('account').setAttribute('aria-label', child ? `الحساب: ${child.name}` : 'الحسابات');
    $('test-switch').setAttribute('aria-checked', String(testMode));
    $('report-open').hidden = !testMode;
    $('home').classList.toggle('therapist', testMode);
  }
  $('bag-art').src = $('enc-bag').src = Art.decoURI('bag');
  document.querySelectorAll('dialog [data-close]').forEach(button => { button.onclick = () => { afterPick = null; button.closest('dialog').close(); }; });

  /* Tapping outside a window closes it. */
  document.querySelectorAll('dialog.sheet').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom) return;
    afterPick = null; dialog.close();
  }));

  /* Accounts */
  let afterPick = null;
  function choose(id) {
    Children.choose(id); drawHome();
    $('accounts').close();
    const next = afterPick; afterPick = null; next?.();
  }
  function drawAccounts() {
    $('child-name').value = ''; $('account-error').hidden = true;
    window.SuiteAccounts.render($('account-list'), Children.list(), child => {
      const select = document.createElement('button'); select.type = 'button'; select.onclick = () => choose(child.id);
      return window.SuiteAccounts.row(child, select);
    });
  }
  async function openAccounts() {
    if (active() && !await window.ChildAccountGate.request()) return;
    drawAccounts(); $('accounts').showModal();
  }
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
  for (const key of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
    const button = document.createElement('button'); button.type = 'button'; button.textContent = key; button.onclick = () => press(key); $('pin-pad').append(button);
  }
  $('password').addEventListener('keydown', event => { if (/^\d$/.test(event.key)) press(event.key); });
  $('test-switch').onclick = () => { pin = ''; dots(); $('pin-error').textContent = ''; $('password').showModal(); };

  /* Report */
  function drawReport() {
    const child = active();
    $('report-pdf').disabled = !child?.progress.attempts.length;
    $('report-status').hidden = true;
    if (child) Report.draw($('report-body'), child); else $('report-body').textContent = 'اختر حسابًا أولًا.';
  }
  $('report-open').onclick = () => { $('report').showModal(); drawReport(); };
  $('report-pdf').onclick = async () => {
    const status = $('report-status'), button = $('report-pdf');
    button.disabled = true; status.textContent = 'جارٍ إعداد التقرير…'; status.hidden = false;
    try { await Report.download(active()); status.hidden = true; }
    catch { status.textContent = 'تعذّر إنشاء التقرير. أعد المحاولة.'; }
    finally { button.disabled = false; }
  };
  window.addEventListener('resize', () => { if ($('report').open) drawReport(); });

  /* Goals: a long goal is a sound, its short goals are the word positions. They decide what Play shows. */
  function setGoal(sound, chosen) {
    const progress = active().progress;
    if (chosen.length) progress.goals[sound.id] = positions.map(entry => entry.id).filter(id => chosen.includes(id)); else delete progress.goals[sound.id];
    if (progress.run && !progress.run.finished) progress.run = null;
    save(); drawGoals();
  }
  function drawGoals() {
    const child = active(), body = $('goals-body');
    if (!child) { body.textContent = 'اختر حسابًا أولًا.'; return; }
    const note = document.createElement('p'); note.className = 'muted goal-note'; note.textContent = `دون أهداف محددة، يختار التقرير المواضع التي لم تبلغ ${Plan.TARGET}% في جلستين متتاليتين.`;
    body.replaceChildren(note, ...sounds.map(sound => {
      const chosen = child.progress.goals[sound.id] || [], box = document.createElement('section'); box.className = 'goal';
      const head = document.createElement('div'); head.className = 'goal-head';
      const art = document.createElement('img'); art.src = Art.objectURI(sound.art); art.alt = '';
      const letter = document.createElement('b'); letter.textContent = sound.letter;
      const name = document.createElement('span'); name.className = 'goal-name'; name.textContent = sound.name;
      const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'switch-mini'; toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', String(chosen.length > 0)); toggle.setAttribute('aria-label', `الهدف البعيد: ${sound.name}`);
      const track = document.createElement('span'); track.className = 'switch-track'; track.append(document.createElement('span')); toggle.append(track);
      toggle.onclick = () => setGoal(sound, chosen.length ? [] : positions.map(entry => entry.id));
      head.append(art, letter, name, toggle);
      const chips = document.createElement('div'); chips.className = 'goal-chips'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', `الأهداف القريبة: ${sound.name}`);
      positions.forEach(position => {
        const chip = document.createElement('button'), last = Plan.attemptsOf(child, sound.id, position.id).at(-1), on = chosen.includes(position.id), label = document.createElement('span'), info = document.createElement('small');
        chip.type = 'button'; chip.className = 'goal-chip'; chip.setAttribute('aria-pressed', String(on));
        label.textContent = position.name;
        info.textContent = Plan.reached(child, sound.id, position.id) ? `${Plan.percent(last)}% ✓` : last ? `${Plan.percent(last)}%` : '—';
        info.dir = 'ltr';
        chip.append(label, info);
        chip.onclick = () => setGoal(sound, on ? chosen.filter(id => id !== position.id) : [...chosen, position.id]);
        chips.append(chip);
      });
      box.append(head, chips);
      return box;
    }));
  }
  $('goals-open').onclick = () => { drawGoals(); $('goals').showModal(); };

  /* Letter board: shown when there is no report or goal to decide for the child. */
  function showLetters(list) {
    $('letter-tiles').replaceChildren(...list.map(sound => {
      const tile = document.createElement('button'), art = document.createElement('img'), letter = document.createElement('b');
      tile.type = 'button'; tile.className = 'letter-tile'; tile.setAttribute('aria-label', sound.name);
      art.src = Art.objectURI(sound.art); art.alt = ''; letter.textContent = sound.letter;
      tile.append(letter, art);
      tile.onclick = () => { $('letters').hidden = true; startRun(Plan.planForSound(active(), sound)); };
      return tile;
    }));
    $('home').hidden = true; $('letters').hidden = false;
  }
  $('letters-back').onclick = () => { $('letters').hidden = true; $('home').hidden = false; };

  function startRun(plan) {
    const child = active(), scenario = Plan.scenarioFor(child, plan.sound), progress = child.progress;
    progress.run = { id: Date.now().toString(36), sound: plan.sound.id, scenario, positions: plan.positions, collected: {}, unlocked: {}, scores: {}, finished: false };
    progress.played[plan.sound.id] = (progress.played[plan.sound.id] || 0) + 1;
    progress.lastScenario = scenario;
    save();
    void enterGame();
  }
  function play() {
    Sound.unlock();
    const child = active();
    if (!child) { afterPick = play; drawAccounts(); $('accounts').showModal(); return; }
    if (child.progress.run && !child.progress.run.finished) { void enterGame(); return; }
    const plan = Plan.planFor(child);
    if (plan.choose) showLetters(plan.choose); else startRun(plan);
  }
  $('play').onclick = play;

  /* Word encounter */
  let encounterDone = null, encounterWord = null, turn = 0;
  async function speak(word) {
    $('enc-error').hidden = true;
    try { await Sound.play(word.n); }
    catch { $('enc-error').textContent = 'تعذّر تشغيل الصوت.'; $('enc-error').hidden = false; }
  }
  async function runEncounter(word) {
    const mine = ++turn;
    await wait(calm() ? 0 : 420);
    if (mine !== turn) return;
    if (Sound.has(word.n)) await speak(word);
    if (mine !== turn) return;
    await wait(calm() ? 0 : 700);
    if (mine !== turn) return;
    (testMode ? $('enc-grades') : $('enc-collect')).hidden = false;
  }
  function encounter(word) {
    return new Promise(resolve => {
      encounterDone = resolve; encounterWord = word;
      $('enc-art').src = Art.objectURI(word.art); $('enc-art').alt = word.word; $('enc-word').textContent = word.word;
      $('enc-collect').hidden = true; $('enc-grades').hidden = true; $('enc-replay').hidden = !Sound.has(word.n); $('encounter').hidden = false; $('encounter').focus({ preventScroll: true });
      void runEncounter(word);
    });
  }
  $('enc-replay').onclick = () => { if (encounterWord) void speak(encounterWord); };
  async function flyToBag() {
    const art = $('enc-art'), from = art.getBoundingClientRect(), to = $('bag').getBoundingClientRect();
    if (calm()) return;
    const ghost = art.cloneNode(); ghost.className = 'ghost'; ghost.alt = ''; ghost.style.cssText = `left:${from.left}px;top:${from.top}px;width:${from.width}px;height:${from.height}px`;
    art.style.visibility = 'hidden'; document.body.append(ghost);
    const x = to.left + to.width / 2 - from.left - from.width / 2, y = to.top + to.height / 2 - from.top - from.height / 2;
    await ghost.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${x * .45}px,${y * .3 - 60}px) scale(.7) rotate(160deg)`, opacity: 1, offset: .55 }, { transform: `translate(${x}px,${y}px) scale(.12) rotate(360deg)`, opacity: .9 }], { duration: 560, easing: 'ease-in', fill: 'forwards' }).finished;
    ghost.remove(); art.style.visibility = '';
  }
  async function putInBag() {
    if (!encounterDone) return;
    const resolve = encounterDone, word = encounterWord; encounterDone = null; turn++;
    Sound.stop(); Sound.sfx('collect');
    currentRun().collected[word.art] = true; save();
    $('enc-collect').hidden = true; $('enc-grades').hidden = true;
    await flyToBag();
    $('bag').classList.remove('pop'); void $('bag').offsetWidth; $('bag').classList.add('pop');
    $('encounter').hidden = true; encounterWord = null;
    resolve();
  }
  $('enc-collect').onclick = putInBag;
  /* With the switch on, the therapist's grade is what puts the word in the bag. */
  document.querySelectorAll('.grade').forEach(button => {
    button.onclick = () => {
      if (!encounterDone) return;
      currentRun().scores[encounterWord.art] = Number(button.dataset.score);
      void putInBag();
    };
  });

  /* Ten collected: the grades go to the report, and the board shows what was found. */
  let boardDone = null;
  function zoneDone(position) {
    const child = active(), run = child.progress.run, list = soundById(run.sound).words[position], graded = list.filter(word => run.scores[word.art] !== undefined);
    if (graded.length) {
      child.progress.attempts.push({ date: new Date().toISOString(), run: run.id, sound: run.sound, zone: position, scores: Object.fromEntries(graded.map(word => [word.art, run.scores[word.art]])) });
      graded.forEach(word => { delete run.scores[word.art]; });
      save();
    }
    $('board-items').replaceChildren(...list.map(word => {
      const tile = document.createElement('button'), art = document.createElement('img');
      tile.type = 'button'; tile.className = 'board-tile'; tile.setAttribute('aria-label', word.word);
      art.src = Art.objectURI(word.art); art.alt = ''; tile.append(art);
      tile.onclick = () => { Sound.play(word.n).catch(() => toast('تعذّر تشغيل الصوت.')); tile.classList.remove('say-it'); void tile.offsetWidth; tile.classList.add('say-it'); };
      return tile;
    }));
    const last = position === run.positions.at(-1), ride = Scenes[run.scenario].stages[position].ride;
    $('board-go-art').src = last ? Art.decoURI('star') : Art.rideIcon(ride);
    $('board').hidden = false; $('board-go').focus({ preventScroll: true });
    return new Promise(resolve => { boardDone = resolve; });
  }
  $('board-go').onclick = () => { $('board').hidden = true; Sound.stop(); const resolve = boardDone; boardDone = null; resolve?.(); };

  /* The backpack shows every word's shape in this play; collecting fills the shape with colour. */
  const packSeen = new Set();
  function openPack() {
    const run = currentRun(), sound = soundById(run.sound);
    $('pack-pockets').replaceChildren(...run.positions.map(id => {
      const pocket = document.createElement('section'); pocket.className = 'pocket'; pocket.setAttribute('aria-label', positionName(id));
      sound.words[id].forEach(word => {
        const owned = !!run.collected[word.art], seenKey = `${run.id}:${word.art}`, slot = document.createElement('button'), art = document.createElement('img');
        slot.type = 'button'; slot.className = 'slot' + (owned ? ' owned' : ' missing') + (owned && !packSeen.has(seenKey) ? ' fresh' : '');
        art.src = owned ? Art.objectURI(word.art) : Art.shapeURI(word.art); art.alt = ''; slot.append(art);
        slot.setAttribute('aria-label', owned ? word.word : 'كلمة لم تُجمع بعد');
        if (owned) { packSeen.add(seenKey); slot.onclick = () => { Sound.play(word.n).catch(() => toast('تعذّر تشغيل الصوت.')); slot.classList.remove('say-it'); void slot.offsetWidth; slot.classList.add('say-it'); }; } else slot.disabled = true;
        pocket.append(slot);
      });
      return pocket;
    }));
    Game.hold(true);
    $('pack').hidden = false;
    $('pack-close').focus({ preventScroll: true });
  }
  function closePack() { Sound.stop(); $('pack').hidden = true; Game.hold(false); $('bag').focus({ preventScroll: true }); }
  $('bag').onclick = () => { Sound.unlock(); openPack(); };
  $('pack-close').onclick = closePack;
  $('pack').addEventListener('keydown', event => { if (event.key === 'Escape') closePack(); });

  /* The game */
  let playing = false;
  function tally(count, zone) {
    $('bag-count').textContent = String(count);
    const box = $('stars'); box.setAttribute('aria-label', `${count} من 10`);
    if (box.children.length !== 10) box.replaceChildren(...Array.from({ length: 10 }, () => document.createElement('i')));
    [...box.children].forEach((star, i) => star.classList.toggle('on', i < count));
    box.dataset.zone = zone;
  }
  function islandDone() {
    const result = $('done-result'), child = active(), run = child.progress.run;
    result.replaceChildren();
    const attempts = child.progress.attempts.filter(entry => entry.run === run.id);
    if (testMode && attempts.length) {
      const total = document.createElement('strong'); total.className = 'big'; total.dir = 'ltr';
      total.textContent = `${Math.round(attempts.reduce((sum, entry) => sum + Plan.sum(entry), 0) / attempts.reduce((sum, entry) => sum + Plan.size(entry), 0) * 100)}%`;
      const table = document.createElement('dl'); table.className = 'zone-scores';
      attempts.forEach(entry => { const term = document.createElement('dt'), value = document.createElement('dd'); term.textContent = positionName(entry.zone); value.dir = 'ltr'; value.textContent = `${Plan.percent(entry)}%`; table.append(term, value); });
      result.append(total, table);
    }
    $('done').hidden = false;
  }
  const hooks = { child: active, run: currentRun, unlock: Sound.unlock, sfx: Sound.sfx, save, tally, encounter, zoneDone, islandDone };
  async function enterGame() {
    const run = currentRun(), sound = soundById(run.sound);
    Sound.unlock();
    Sound.warm(run.positions.flatMap(id => sound.words[id].map(word => word.n)));
    closeLayers();
    $('home').hidden = true; $('letters').hidden = true; $('stage').hidden = false; $('loading').hidden = false; $('turn').hidden = false;
    if (!playing) history.pushState({ island: true }, '');
    playing = true;
    try { await Game.open($('world'), hooks); }
    catch (error) { toast(error?.message || 'تعذّر تشغيل اللعبة.'); leave(); return; }
    $('loading').hidden = true;
  }
  function closeLayers() {
    turn++; Sound.stop();
    encounterDone = null; encounterWord = null; boardDone = null;
    ['encounter', 'board', 'done', 'pack'].forEach(id => { $(id).hidden = true; });
  }
  function leave(fromHistory = false) {
    if (!playing) return;
    playing = false; closeLayers(); Game.close();
    $('stage').hidden = true; $('home').hidden = false; drawHome();
    if (!fromHistory && history.state?.island) history.back();
  }
  window.addEventListener('popstate', () => leave(true));
  $('leave').onclick = () => leave();
  $('turn').onclick = () => { $('turn').hidden = true; };
  $('done-home').onclick = () => leave();
  $('done-again').onclick = () => { const run = currentRun(); startRun({ sound: soundById(run.sound), positions: run.positions }); };
  $('done-stars').replaceChildren(...[0, 1, 2].map(() => { const star = document.createElement('img'); star.src = Art.decoURI('star'); star.alt = ''; return star; }));

  drawHome();
  if (!Children.list().length) { drawAccounts(); $('accounts').showModal(); }
})();
