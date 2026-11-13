/* The stories part: home, accounts, therapist switch, goals, report and the letter board (as in العبارات), and a picture
   book for each sound: the child hears each of the five pages and says it, puts the five pictures in order, then tells the
   story alone. The therapist grades each page (1, 0.5, 0) and counts the target sounds right and wrong in the retelling. */
(() => {
const Data = window.ArticulationData, Plan = window.ArticulationPlan, Report = window.ArticulationReport, Sound = window.PhraseAudio, Pictures = window.PhrasePictures, Children = window.ArticulationChildren;
const { positions, sounds, soundById, positionName } = Data;
const PART = window.PartConfig || { id: 'stories', name: 'القصص' };
const KEY = `articulation-${PART.id}-children-v1`, TEST_KEY = `articulation-${PART.id}-test-v1`, PASSWORD = '013', PAGES = 5;
const $ = id => document.getElementById(id);
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const blank = () => ({ attempts: [], goals: {}, played: {}, run: null });
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const recording = phrase => `sounds/${phrase.n}.m4a`;

function toast(text) { const box = $('toast'); box.textContent = text; box.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { box.hidden = true; }, 3800); }

/* Who the children are comes from the one list shared with the home page and the other parts.
   What a child earns here lives in this part's own record under the same id; deleting a child removes it. */
let store = { schema: 1, active: null, children: [] };
try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.schema === 1 && Array.isArray(saved.children)) store = saved; } catch {}
/* Records from before there was a single level (imitation, independent) count as that level. */
store.children.forEach(child => { child.progress = { ...blank(), ...child.progress }; child.progress.attempts.forEach(attempt => { if (!positions.some(position => position.id === attempt.zone)) attempt.zone = positions[0].id; }); if (child.progress.run && !positions.some(position => position.id === child.progress.run.goal)) child.progress.run.goal = positions[0].id; });
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); return true; } catch { toast('تعذّر حفظ التقدم على هذا الجهاز.'); return false; } }
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
/* Tapping outside a window closes it. */
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

/* Goals: each goal is a sound; its short goals are the pages (heard and said) and the retelling. */
function setGoal(sound, chosen) {
  const progress = active().progress;
  if (chosen.length) progress.goals[sound.id] = positions.map(entry => entry.id).filter(id => chosen.includes(id)); else delete progress.goals[sound.id];
  if (progress.run && !progress.run.finished) progress.run = null;
  save(); drawGoals();
}
function drawGoals() {
  const child = active(), body = $('goals-body');
  if (!child) { body.textContent = 'اختر حسابًا أولًا.'; return; }
  const note = document.createElement('p'); note.className = 'muted goal-note'; note.textContent = `دون أهداف محددة، يختار التقرير ما لم يبلغ ${Plan.TARGET}% في جلستين متتاليتين.`;
  body.replaceChildren(note, ...sounds.map(sound => {
    const chosen = child.progress.goals[sound.id] || [], box = document.createElement('section'); box.className = 'goal';
    const head = document.createElement('div'); head.className = 'goal-head';
    const art = document.createElement('img'); art.src = Pictures.soundURI(sound.art); art.alt = '';
    const letter = document.createElement('b'); letter.textContent = sound.letter;
    const name = document.createElement('span'); name.className = 'goal-name'; name.textContent = sound.name;
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'switch-mini'; toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', String(chosen.length > 0)); toggle.setAttribute('aria-label', `الهدف البعيد: ${sound.name}`);
    const track = document.createElement('span'); track.className = 'switch-track'; track.append(document.createElement('span')); toggle.append(track);
    toggle.onclick = () => setGoal(sound, chosen.length ? [] : positions.map(entry => entry.id));
    if (positions.length === 1) {
      const last = Plan.attemptsOf(child, sound.id).at(-1), info = document.createElement('small'); info.className = 'goal-score'; info.dir = 'ltr';
      info.textContent = Plan.reached(child, sound.id, positions[0].id) ? `${Plan.percent(last)}% ✓` : last ? `${Plan.percent(last)}%` : '';
      head.append(art, letter, name, info, toggle); box.append(head); return box;
    }
    head.append(art, letter, name, toggle);
    const chips = document.createElement('div'); chips.className = 'goal-chips'; chips.setAttribute('role', 'group'); chips.setAttribute('aria-label', `الأهداف القريبة: ${sound.name}`);
    positions.forEach(position => {
      const chip = document.createElement('button'), last = Plan.attemptsOf(child, sound.id, position.id).at(-1), on = chosen.includes(position.id), label = document.createElement('span'), info = document.createElement('small');
      chip.type = 'button'; chip.className = 'goal-chip goal-chip-text'; chip.setAttribute('aria-pressed', String(on)); chip.title = position.example;
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

/* Letter board: shown when no goal or report decides for the child. */
function showLetters(list) {
  $('letter-tiles').replaceChildren(...list.map(sound => {
    const tile = document.createElement('button'), art = document.createElement('img'), letter = document.createElement('b');
    tile.type = 'button'; tile.className = 'letter-tile'; tile.setAttribute('aria-label', sound.name);
    art.src = Pictures.soundURI(sound.art); art.alt = ''; letter.textContent = sound.letter;
    tile.append(letter, art);
    tile.onclick = () => { $('letters').hidden = true; startRun(Plan.planForSound(active(), sound)); };
    return tile;
  }));
  $('home').hidden = true; $('letters').hidden = false;
}
$('letters-back').onclick = () => { $('letters').hidden = true; $('home').hidden = false; };

/* ---------- The book ---------- */
let playing = false, busy = false;
const run = () => currentRun();
const story = () => soundById(run().sound);
const pictureOf = page => Pictures.uri(page.picture, active().character);
const shuffle = list => { const out = [...list]; for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; };
const DIGITS = ['١', '٢', '٣', '٤', '٥'];

/* A play is one story: the five pages heard and said, then the pictures put in order, then the story told alone. */
function startRun(plan) {
  const progress = active().progress, indexes = plan.sound.phrases.map((_, i) => i);
  let order = shuffle(indexes); while (order.every((v, i) => v === i)) order = shuffle(indexes);
  progress.run = { id: Date.now().toString(36), sound: plan.sound.id, stage: 'book', page: 0, scores: {}, order, placed: Array(PAGES).fill(null), locked: [], counts: { right: 0, wrong: 0 }, log: [], finished: false };
  progress.played[plan.sound.id] = (progress.played[plan.sound.id] || 0) + 1;
  save();
  enterGame();
}
function play() {
  Sound.unlock();
  const child = active();
  if (!child) { afterPick = play; drawAccounts(); $('accounts').showModal(); return; }
  if (child.progress.run && !child.progress.run.finished) { enterGame(); return; }
  const plan = Plan.planFor(child);
  if (plan.choose) showLetters(plan.choose); else startRun(plan);
}
$('play').onclick = play;

function enterGame() {
  Sound.unlock(); Sound.warm(story().phrases.map(recording));
  closeLayers();
  $('home').hidden = true; $('letters').hidden = true; $('stage').hidden = false;
  if (!playing) history.pushState({ book: true }, '');
  playing = true;
  $('goal-tag').textContent = `${story().letter} · ${story().name}`;
  $('book-title').textContent = story().story;
  const r = run();
  if (r.stage === 'book') showPage(false); else if (r.stage === 'order') showOrder(); else showTell();
}
function drawDots() {
  const r = run(), box = $('page-dots'), at = r.stage === 'book' ? r.page : PAGES;
  box.replaceChildren(...Array.from({ length: PAGES }, (_, i) => { const dot = document.createElement('i'); dot.className = i < at ? 'done' : i === at ? 'now' : ''; return dot; }));
  box.setAttribute('aria-label', r.stage === 'book' ? `الصفحة ${r.page + 1} من ${PAGES}` : 'رتّب القصة واحكِها');
}

/* A page: its picture and sentence; the sentence plays when it has a recording; the child says it after it. */
let shownPage = -1;
async function showPage(turning) {
  const r = run(), page = story().phrases[r.page], leaf = $('leaf');
  $('book').hidden = false; $('order').hidden = true; $('tell').hidden = true;
  drawDots();
  if (turning && !calm()) { leaf.classList.add('turn-out'); await wait(300); leaf.classList.remove('turn-out'); }
  shownPage = r.page;
  $('page-picture').src = pictureOf(page); $('page-picture').alt = page.text; $('page-text').textContent = page.text;
  if (turning && !calm()) { leaf.classList.add('turn-in'); setTimeout(() => leaf.classList.remove('turn-in'), 400); Sound.sfx('whoosh'); }
  $('page-grades').hidden = !testMode; $('page-next').hidden = testMode;
  $('page-grades').querySelectorAll('.grade').forEach(button => button.setAttribute('aria-pressed', String(r.scores[page.id] === Number(button.dataset.score))));
  $('page-say').hidden = true; busy = false;
  const has = await Sound.has(recording(page));
  if (shownPage !== r.page || $('book').hidden) return;
  $('page-say').hidden = !has;
  if (has) void Sound.play(recording(page)).catch(() => {});
  (testMode ? $('page-grades').querySelector('.grade') : $('page-next')).focus({ preventScroll: true });
}
async function nextPage() {
  if (busy) return; busy = true;
  const r = run(); Sound.stop();
  if (r.page < PAGES - 1) { r.page++; save(); await showPage(true); return; }
  r.stage = 'order'; save(); busy = false; showOrder();
}
$('page-next').onclick = () => void nextPage();
$('page-say').onclick = () => { const page = story().phrases[run().page]; Sound.stop(); void Sound.play(recording(page)).catch(() => {}); };
/* The characters bounce when the picture is tapped. */
$('page-picture-box').onclick = () => { const box = $('page-picture-box'); box.classList.remove('bounce'); void box.offsetWidth; box.classList.add('bounce'); Sound.sfx('pop'); };
/* With the switch on, the therapist grades each page (1, 0.5, 0) and the page turns. */
$('page-grades').querySelectorAll('.grade').forEach(button => {
  button.onclick = () => {
    if (busy) return;
    const page = story().phrases[run().page];
    run().scores[page.id] = Number(button.dataset.score); save();
    button.setAttribute('aria-pressed', 'true');
    setTimeout(() => void nextPage(), calm() ? 0 : 220);
  };
});

/* ---------- Putting the pictures in order ---------- */
function slotItem(n) { const li = document.createElement('li'); li.dataset.n = DIGITS[n]; return li; }
function pictureButton(index, label) {
  const button = document.createElement('button'), img = document.createElement('img');
  button.type = 'button'; img.src = pictureOf(story().phrases[index]); img.alt = ''; button.setAttribute('aria-label', label);
  button.append(img); return button;
}
function showOrder() {
  const r = run();
  $('book').hidden = true; $('tell').hidden = true; $('order').hidden = false;
  drawDots();
  $('slots').replaceChildren(...r.placed.map((index, n) => {
    const li = slotItem(n);
    if (index !== null) {
      const button = pictureButton(index, `المكان ${n + 1}: ${story().phrases[index].text}`);
      if (r.locked.includes(n)) { li.classList.add('ok'); button.disabled = true; }
      else button.onclick = () => { r.placed[n] = null; save(); showOrder(); };
      li.append(button);
    }
    return li;
  }));
  $('pool').replaceChildren(...r.order.filter(index => !r.placed.includes(index)).map(index => {
    const button = pictureButton(index, story().phrases[index].text);
    button.onclick = () => place(index);
    return button;
  }));
}
/* A picture goes to the first empty place. With all five placed, the right ones stay and the others come back. */
async function place(index) {
  const r = run(), n = r.placed.indexOf(null);
  if (n < 0 || busy) return;
  r.placed[n] = index; save(); Sound.sfx('snap'); showOrder();
  if (r.placed.includes(null)) return;
  busy = true;
  const wrong = r.placed.map((value, i) => value === i ? -1 : i).filter(i => i >= 0);
  r.locked = r.placed.map((value, i) => value === i ? i : -1).filter(i => i >= 0);
  showOrder();
  if (!wrong.length) { Sound.sfx('fanfare'); await wait(calm() ? 0 : 900); r.stage = 'tell'; save(); busy = false; showTell(); return; }
  Sound.sfx('oops');
  wrong.forEach(i => $('slots').children[i].classList.add('no'));
  await wait(calm() ? 0 : 600);
  wrong.forEach(i => { r.placed[i] = null; });
  save(); busy = false; showOrder();
}

/* ---------- Telling the story alone ---------- */
function showTell() {
  const r = run();
  $('book').hidden = true; $('order').hidden = true; $('tell').hidden = false;
  drawDots();
  $('strip').replaceChildren(...story().phrases.map((page, n) => { const li = slotItem(n), img = document.createElement('img'); img.src = pictureOf(page); img.alt = page.text; li.append(img); return li; }));
  $('counter').hidden = !testMode;
  drawCounts();
  $('tell-done').focus({ preventScroll: true });
}
function drawCounts() {
  const { right, wrong } = run().counts;
  $('n-right').textContent = String(right); $('n-wrong').textContent = String(wrong);
  $('count-right').setAttribute('aria-label', `صوت صحيح: ${right}`); $('count-wrong').setAttribute('aria-label', `صوت خطأ: ${wrong}`);
  $('count-undo').disabled = !run().log.length;
}
/* The therapist counts every target sound the child says, right or wrong, with an undo. */
function count(kind) { const r = run(); r.counts[kind]++; r.log.push(kind); save(); drawCounts(); Sound.sfx(kind === 'right' ? 'pop' : 'drop'); }
$('count-right').onclick = () => count('right');
$('count-wrong').onclick = () => count('wrong');
$('count-undo').onclick = () => { const r = run(), kind = r.log.pop(); if (kind) { r.counts[kind]--; save(); drawCounts(); } };
$('tell-done').onclick = () => finish();

/* The pages' grades and the retelling's count go to the report. */
function finish() {
  const child = active(), r = run();
  if (r.finished) return;
  const date = new Date().toISOString();
  if (Object.keys(r.scores).length) child.progress.attempts.push({ date, run: r.id, sound: r.sound, zone: 'pages', scores: { ...r.scores } });
  const { right, wrong } = r.counts;
  if (right + wrong) child.progress.attempts.push({ date, run: r.id, sound: r.sound, zone: 'retell', scores: Object.fromEntries([...Array.from({ length: right }, (_, i) => [`right-${i + 1}`, 1]), ...Array.from({ length: wrong }, (_, i) => [`wrong-${i + 1}`, 0])]) });
  r.finished = true; save();
  Sound.sfx('fanfare');
  const result = $('done-result'); result.replaceChildren();
  const attempts = child.progress.attempts.filter(entry => entry.run === r.id);
  if (testMode && attempts.length) {
    const list = document.createElement('dl'); list.className = 'zone-scores';
    attempts.forEach(entry => { const term = document.createElement('dt'), value = document.createElement('dd'); term.textContent = positionName(entry.zone); value.dir = 'ltr'; value.textContent = `${Plan.percent(entry)}%`; list.append(term, value); });
    result.append(list);
  }
  window.ArticulationToday?.done(PART.id, r.sound, ['pages', 'retell']);
  $('done').hidden = false;
  $('done-home').focus({ preventScroll: true });
}

function closeLayers() { Sound.stop(); shownPage = -1; $('done').hidden = true; }
function leave(fromHistory = false) {
  if (!playing) return;
  playing = false; closeLayers();
  $('stage').hidden = true; $('home').hidden = false; drawHome();
  if (!fromHistory && history.state?.book) history.back();
}
window.addEventListener('popstate', () => leave(true));
$('leave').onclick = () => leave();
$('done-home').onclick = () => leave();
$('done-again').onclick = () => startRun({ sound: story(), positions: positions.map(p => p.id) });

drawHome();
if (!Children.list().length) { drawAccounts(); $('accounts').showModal(); }
/* Opened from today's session (assets/today.js): the plan's story starts with one tap. */
window.ArticulationToday?.offer(PART.id, activity => {
  const sound = soundById(window.ArticulationTherapy.PARTS[PART.id].id(activity.letter));
  if (sound && active()) { Sound.unlock(); startRun({ sound, positions: positions.map(p => p.id) }); }
});
window.StoryBook = { run, story };
})();
