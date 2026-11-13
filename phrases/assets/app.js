/* Home, accounts, therapist switch, goals, report, the letter board, and a tower of ten phrase (or sentence) bricks. */
import { Tower, SCENARIOS } from './tower.js';

const Data = window.ArticulationData, Plan = window.ArticulationPlan, Report = window.ArticulationReport, Sound = window.PhraseAudio, Pictures = window.PhrasePictures, Children = window.ArticulationChildren;
const { positions, sounds, soundById, positionName } = Data;
/* The same code runs العبارات and الجمل; the page names the part (window.PartConfig), which keeps its own records and recordings. */
const PART = window.PartConfig || { id: 'phrases', name: 'العبارات' };
const KEY = `articulation-${PART.id}-children-v1`, TEST_KEY = `articulation-${PART.id}-test-v1`, PASSWORD = '013', PER_RUN = 10;
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

/* Goals: each goal is a sound; the child always hears the phrase and says it after it. */
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

/* A play is one sound and one short goal: the first of the chosen ones not yet reached. Its ten phrases come in a new order. */
function startRun(plan) {
  const child = active(), progress = child.progress, goal = plan.positions.find(id => !Plan.reached(child, plan.sound.id, id)) || plan.positions[0];
  const order = plan.sound.phrases.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  /* A different scene each play, never the same as the last one. */
  const scenes = SCENARIOS.filter(id => id !== progress.lastScenario), scenario = scenes[Math.floor(Math.random() * scenes.length)];
  progress.lastScenario = scenario;
  progress.run = { id: Date.now().toString(36), sound: plan.sound.id, goal, scenario, order, placed: [], scores: {}, finished: false };
  progress.played[plan.sound.id] = (progress.played[plan.sound.id] || 0) + 1;
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

/* ---------- The tower ---------- */
let tower = null, playing = false, busy = false;
const run = () => currentRun();
const phraseAt = step => { const r = run(); return soundById(r.sound).phrases[r.order[step]]; };
const pictureOf = phrase => Pictures.uri(phrase.picture, active().character);
function drawBricks() {
  const r = run(), box = $('bricks');
  box.replaceChildren(...Array.from({ length: PER_RUN }, (_, i) => { const dot = document.createElement('i'); dot.className = i < r.placed.length ? 'done' : i === r.placed.length ? 'now' : ''; return dot; }));
  box.setAttribute('aria-label', `${r.placed.length} من ${PER_RUN}`);
}
function next() {
  const r = run(); drawBricks();
  if (r.placed.length >= PER_RUN) { void finish(); return; }
  tower.hang(r.placed.length);
  $('hint').dataset.hint = 'open'; $('hint').hidden = false;
  busy = false;
}

/* The picture zooms out of the brick, the phrase plays (straight away when imitating), then zooms back into it. */
let shown = null;
async function speak(phrase) {
  try { await Sound.play(recording(phrase)); } catch {}
}
async function openCard() {
  if (busy) return; busy = true;
  $('hint').hidden = true;
  const phrase = phraseAt(run().placed.length), card = $('card'), box = $('card-box');
  shown = phrase;
  $('card-picture').src = pictureOf(phrase); $('card-text').textContent = phrase.text;
  $('card-grades').hidden = !testMode; $('card-go').hidden = testMode;
  $('card-grades').querySelectorAll('.grade').forEach(button => button.setAttribute('aria-pressed', 'false'));
  $('card-say').hidden = true;
  card.hidden = false; card.classList.toggle('independent', run().goal === 'independent'); card.classList.toggle('therapist', testMode);
  await zoom(box, true);
  const has = await Sound.has(recording(phrase));
  if (shown !== phrase) return;
  $('card-say').hidden = !has;
  if (has && run().goal === 'imitation') void speak(phrase);
  (testMode ? $('card-grades').querySelector('.grade') : $('card-go')).focus({ preventScroll: true });
}
async function zoom(box, opening) {
  if (calm()) return;
  const from = tower.brickRect(), to = box.getBoundingClientRect(), k = Math.max(.08, from.width / to.width);
  const shrunk = `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px,${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${k})`;
  await box.animate(opening ? [{ transform: shrunk, opacity: .4 }, { transform: 'none', opacity: 1 }] : [{ transform: 'none', opacity: 1 }, { transform: shrunk, opacity: .3 }], { duration: opening ? 420 : 360, easing: 'cubic-bezier(.2,1,.4,1)', fill: opening ? 'none' : 'forwards' }).finished;
}
async function closeCard(wrong = false) {
  const phrase = shown; if (!phrase) return;
  shown = null; Sound.stop();
  await zoom($('card-box'), false);
  $('card').hidden = true; $('card-box').getAnimations().forEach(animation => animation.cancel());
  tower.showPicture(pictureOf(phrase)); Sound.sfx('snap');
  /* Graded wrong: the piece tumbles off and the same phrase comes straight back on a new piece. */
  if (wrong) { await tower.fallOff(); next(); return; }
  tower.swing();
  $('hint').dataset.hint = 'drop'; $('hint').hidden = false;
  busy = false;
}
$('card-say').onclick = () => { if (shown) void speak(shown); };
$('card-go').onclick = () => void closeCard();
/* With the switch on, the therapist's grade sends the brick back: 1, 0.5 or 0. A phrase tried again keeps its last grade. */
$('card-grades').querySelectorAll('.grade').forEach(button => {
  button.onclick = () => {
    if (!shown) return;
    const score = Number(button.dataset.score);
    run().scores[shown.id] = score; save();
    button.setAttribute('aria-pressed', 'true');
    setTimeout(() => void closeCard(score === 0), calm() ? 0 : 200);
  };
});

/* A tap opens the hanging brick's picture, or drops a swinging brick. */
async function tapStage() {
  if (!tower || busy || !$('card').hidden) return;
  if (tower.state === 'waiting') { void openCard(); return; }
  if (tower.state === 'ending' || tower.state === 'done') return;
  if (tower.state !== 'swinging') return;
  busy = true; $('hint').hidden = true;
  const landed = await tower.drop();
  if (!landed) { busy = false; return; }
  const r = run(); r.placed.push({ dx: Math.round(landed.dx), id: phraseAt(r.placed.length).id }); save();
  await wait(calm() ? 0 : 450);
  next();
}
$('world').addEventListener('pointerdown', event => { if (event.button === 0 || event.pointerType !== 'mouse') void tapStage(); });
$('world').addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void tapStage(); } });

/* Ten bricks: the roof goes on, the grades go to the report and the result shows. */
async function finish() {
  busy = true;
  const child = active(), r = run();
  await tower.finish(); Sound.sfx('fanfare');
  /* The scene's ending: the hand points at it until the child taps it. */
  const ending = tower.ending(), at = tower.triggerRect(), hint = $('hint');
  if (at) { hint.dataset.hint = 'end'; hint.style.left = `${at.left + at.width / 2}px`; hint.style.top = `${at.top + at.height / 2}px`; hint.hidden = false; }
  await ending;
  hint.hidden = true; hint.style.left = hint.style.top = ''; delete hint.dataset.hint;
  const graded = Object.keys(r.scores);
  if (graded.length && !r.finished) child.progress.attempts.push({ date: new Date().toISOString(), run: r.id, sound: r.sound, zone: r.goal, scores: { ...r.scores } });
  r.finished = true; save();
  const result = $('done-result'); result.replaceChildren();
  const attempt = child.progress.attempts.filter(entry => entry.run === r.id).at(-1);
  if (testMode && attempt) {
    const total = document.createElement('strong'); total.className = 'big'; total.dir = 'ltr'; total.textContent = `${Plan.percent(attempt)}%`;
    const what = document.createElement('p'); what.textContent = soundById(r.sound).name;
    result.append(total, what);
  }
  window.ArticulationToday?.done(PART.id, r.sound, [r.goal]);
  $('done').hidden = false;
}

async function enterGame() {
  const r = run(), sound = soundById(r.sound);
  Sound.unlock();
  Sound.warm(sound.phrases.map(recording));
  closeLayers();
  $('home').hidden = true; $('letters').hidden = true; $('stage').hidden = false; $('loading').hidden = true;
  if (!playing) history.pushState({ tower: true }, '');
  playing = true;
  tower?.destroy();
  tower = new Tower($('world'), { sfx: Sound.sfx, ending: () => { $('hint').hidden = true; } }, r.scenario);
  tower.setPlaced(r.placed.map(entry => ({ dx: entry.dx, picture: pictureOf(sound.phrases.find(phrase => phrase.id === entry.id)) })));
  $('goal-tag').textContent = `${sound.letter} · ${sound.name}`;
  next();
}
function closeLayers() { Sound.stop(); shown = null; ['card', 'done', 'hint'].forEach(id => { $(id).hidden = true; }); }
function leave(fromHistory = false) {
  if (!playing) return;
  playing = false; closeLayers();
  $('stage').hidden = true; $('home').hidden = false; tower?.destroy(); tower = null; $('world').replaceChildren(); drawHome();
  if (!fromHistory && history.state?.tower) history.back();
}
window.addEventListener('popstate', () => leave(true));
$('leave').onclick = () => leave();
$('done-home').onclick = () => leave();
$('done-again').onclick = () => { const r = run(); startRun({ sound: soundById(r.sound), positions: [r.goal] }); };

drawHome();
if (!Children.list().length) { drawAccounts(); $('accounts').showModal(); }
/* Opened from today's session (assets/today.js): the plan's sound and short goal start with one tap. */
window.ArticulationToday?.offer(PART.id, activity => {
  const sound = soundById(window.ArticulationTherapy.PARTS[PART.id].id(activity.letter));
  if (sound && active()) { Sound.unlock(); startRun({ sound, positions: [activity.zone] }); }
});
window.PhraseTower = { tower: () => tower, run };
