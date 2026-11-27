/* Home, accounts, therapist switch, goals, report, the letter board, and a play through the stations of the syllable train. */
import { Train } from './train.js';
import { READY } from '../animations/library.js';
import { pictureURI } from './pictures.js';

const Data = window.ArticulationData, Plan = window.ArticulationPlan, Report = window.ArticulationReport, Sound = window.SyllableAudio;
const { positions, sounds, soundById, positionName } = Data;
const KEY = 'articulation-syllables-children-v1', TEST_KEY = 'articulation-therapist', PASSWORD = '013';
const $ = id => document.getElementById(id);
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const blank = () => ({ attempts: [], goals: {}, played: {}, run: null });
const Children = window.ArticulationChildren;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const hasVideo = id => READY.includes(id);

function toast(text) { const box = $('toast'); box.textContent = text; box.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { box.hidden = true; }, 3800); }

/* Who the children are comes from the one list shared with the home page and the other apps.
   What a child earns here lives in this app's own record under the same id; deleting a child removes it. */
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
const currentRun = () => active()?.progress.run || null;

let testMode = false;
try { testMode = localStorage.getItem(TEST_KEY) === 'on' || !!window.ArticulationClinic?.parents(); } catch {}
/* One therapist switch for the whole app: the lock in the header (assets/clinic.js, assets/intervention.js). */
window.addEventListener('voc-therapist-change', event => { testMode = !!event.detail?.active || !!window.ArticulationClinic?.parents(); drawHome(); });
function setTestMode(on) { testMode = on; try { localStorage.setItem(TEST_KEY, on ? 'on' : 'off'); } catch { toast('تعذّر حفظ الإعداد على هذا الجهاز.'); } drawHome(); }

function drawHome() {
  const child = active();
  $('account-name').textContent = child ? child.name : 'الحسابات';
  $('account-face').hidden = !child;
  if (child) $('account-face').replaceChildren(window.SuiteAccounts.avatar(child, 'small'));
  $('account').setAttribute('aria-label', child ? `الحساب: ${child.name}` : 'الحسابات');
  $('test-switch').setAttribute('aria-checked', String(testMode));
  $('report-open').hidden = !testMode;
  $('therapist-tools').hidden = !testMode;
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

/* Goals: a long goal is a consonant, its short goals are the syllable types. They decide what Play shows. */
function setGoal(sound, chosen) {
  const progress = active().progress;
  if (chosen.length) progress.goals[sound.id] = positions.map(entry => entry.id).filter(id => chosen.includes(id)); else delete progress.goals[sound.id];
  if (progress.run && !progress.run.finished) progress.run = null;
  save(); drawGoals();
}
function drawGoals() {
  const child = active(), body = $('goals-body');
  if (!child) { body.textContent = 'اختر حسابًا أولًا.'; return; }
  const note = document.createElement('p'); note.className = 'muted goal-note'; note.textContent = `دون أهداف محددة، يختار التقرير الأنواع التي لم تبلغ ${Plan.TARGET}% في جلستين متتاليتين.`;
  body.replaceChildren(note, ...sounds.map(sound => {
    const chosen = child.progress.goals[sound.id] || [], box = document.createElement('section'); box.className = 'goal';
    const head = document.createElement('div'); head.className = 'goal-head';
    const art = document.createElement('img'); art.src = pictureURI(sound.id); art.alt = '';
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
      label.textContent = sound.words[position.id][0].word;
      chip.title = position.name; chip.setAttribute('aria-label', `${position.name}، مثل ${label.textContent}`);
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
    art.src = pictureURI(sound.id); art.alt = ''; letter.textContent = sound.letter;
    tile.append(letter, art);
    tile.onclick = () => { $('letters').hidden = true; startRun(Plan.planForSound(active(), sound)); };
    return tile;
  }));
  $('home').hidden = true; $('letters').hidden = false;
}
$('letters-back').onclick = () => { $('letters').hidden = true; $('home').hidden = false; };

function startRun(plan) {
  const progress = active().progress;
  progress.run = { id: Date.now().toString(36), sound: plan.sound.id, positions: plan.positions, station: 0, heard: {}, scores: {}, finished: false };
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

/* ---------- The train ---------- */
let train = null, stations = [], playing = false, busy = false, token = 0;
const run = () => currentRun();
const station = () => stations[run().station];

function drawStations() {
  const box = $('stations'), now = run().station;
  box.replaceChildren(...stations.map((entry, i) => { const dot = document.createElement('i'); dot.className = i < now ? 'done' : i === now ? 'now' : ''; return dot; }));
  box.setAttribute('aria-label', `المحطة ${now + 1} من ${stations.length}`);
}
const allHeard = () => station().items.every(item => run().heard[item.id]);
const allGraded = () => station().items.every(item => run().scores[item.id] !== undefined);
function updateControls() {
  const ready = allHeard() && (!testMode || allGraded());
  $('grade-open').hidden = !testMode;
  $('grade-open').classList.toggle('waiting', testMode && allHeard() && !allGraded());
  $('go').hidden = busy || !ready;
}

async function playItem(car) {
  const mine = ++token;
  train.light(car, true);
  try { await Sound.play(car.item.audio); } catch { toast('تعذّر تشغيل الصوت.'); }
  train.light(car, false);
  if (mine !== token) return false;
  run().heard[car.item.id] = true; save(); updateControls();
  return true;
}
async function playAll() {
  const mine = ++token;
  Sound.sfx('toot'); train.steam();
  await wait(calm() ? 0 : 900);
  for (const car of train.cars) {
    if (mine !== token) return;
    train.light(car, true);
    try { await Sound.play(car.item.audio); } catch { toast('تعذّر تشغيل الصوت.'); }
    train.light(car, false);
    if (mine !== token) return;
    run().heard[car.item.id] = true;
    await wait(calm() ? 0 : 260);
  }
  save(); updateControls();
}

/* Tap a car to hear it; tap the creature on its roof to see how the mouth makes it. Tap the engine to hear the whole train, right to left. */
function wire() {
  train.engine.onclick = () => { if (!busy) void playAll(); };
  train.engine.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); train.engine.onclick(); } };
  const press = (node, action) => {
    node.onclick = () => { if (!busy) action(); };
    node.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); node.onclick(); } };
    node.addEventListener('contextmenu', event => event.preventDefault());
  };
  for (const car of train.cars) {
    press(car.node, () => void playItem(car));
    /* A rider shows how the mouth makes its car's syllable; where there is no animation yet it hops and says it. */
    if (car.buddy) press(car.buddy, () => { if (hasVideo(car.item.id)) openViewer(car.item); else { train.hop(car); void playItem(car); } });
  }
}

async function arrive() {
  busy = true; updateControls();
  const entry = station(), sound = soundById(run().sound);
  train.build(entry, run().station); wire();
  Sound.warm(entry.items.map(item => item.audio));
  drawStations();
  await train.arrive(run().station, sound.id);
  Sound.sfx('toot'); train.board(); train.wave();
  busy = false; updateControls();
}

/* Grades for one syllable type go to the report when the last station of that type is done. */
function closeType(type) {
  const child = active(), r = run(), list = soundById(r.sound).words[type], graded = list.filter(item => r.scores[item.id] !== undefined);
  if (!graded.length) return;
  window.ArticulationClinic.keep(child.progress, { date: new Date().toISOString(), run: r.id, sound: r.sound, zone: type, scores: Object.fromEntries(graded.map(item => [item.id, r.scores[item.id]])) });
  graded.forEach(item => { delete r.scores[item.id]; });
}
$('go').onclick = async () => {
  if (busy) return;
  busy = true; token++; Sound.stop(); updateControls();
  const r = run(), type = station().type, next = stations[r.station + 1];
  if (!next || next.type !== type) closeType(type);
  Sound.sfx('toot'); train.steam();
  await train.leave();
  if (!next) { r.finished = true; save(); finish(); return; }
  r.station++; save();
  await arrive();
};

function finish() {
  Sound.sfx('fanfare');
  const result = $('done-result'), child = active(), r = run();
  result.replaceChildren();
  const attempts = child.progress.attempts.filter(entry => entry.run === r.id);
  if (testMode && attempts.length) {
    const total = document.createElement('strong'); total.className = 'big'; total.dir = 'ltr';
    total.textContent = `${Math.round(attempts.reduce((sum, entry) => sum + Plan.sum(entry), 0) / attempts.reduce((sum, entry) => sum + Plan.size(entry), 0) * 100)}%`;
    const table = document.createElement('dl'); table.className = 'zone-scores';
    attempts.forEach(entry => { const term = document.createElement('dt'), value = document.createElement('dd'); term.textContent = positionName(entry.zone); value.dir = 'ltr'; value.textContent = `${Plan.percent(entry)}%`; table.append(term, value); });
    result.append(total, table);
  }
  window.ArticulationToday?.done('syllables', r.sound, r.positions);
  $('done').hidden = false;
}

/* Grading: one row per car, right, semi or wrong for each, scored 1, 0.5 and 0. */
const GRADES = [[1, 'right', 'صحيح', 'm5 13 4 4L19 7'], [.5, 'semi', 'جزئي', 'M5 12h14'], [0, 'wrong', 'خطأ', 'm6 6 12 12M18 6 6 18']];
function openGrading() {
  const r = run();
  $('grading-rows').replaceChildren(...train.cars.map(car => {
    const row = document.createElement('div'), pics = document.createElement('button'), buttons = document.createElement('div');
    row.className = 'grading-row'; pics.type = 'button'; pics.className = 'grading-car'; pics.setAttribute('aria-label', `اسمع ${car.item.word}`);
    car.item.parts.forEach(part => { const img = document.createElement('img'); img.src = pictureURI(part); img.alt = ''; pics.append(img); });
    pics.onclick = () => { Sound.play(car.item.audio).catch(() => toast('تعذّر تشغيل الصوت.')); };
    buttons.className = 'grades';
    GRADES.forEach(([score, kind, label, path]) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = `grade ${kind}`; button.setAttribute('aria-pressed', String(r.scores[car.item.id] === score)); button.setAttribute('aria-label', `${car.item.word}: ${label}`);
      button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"/></svg><span>${label}</span>`;
      button.onclick = () => {
        r.scores[car.item.id] = score; r.heard[car.item.id] = true; save();
        buttons.querySelectorAll('.grade').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        updateControls();
        if (allGraded()) setTimeout(closeGrading, calm() ? 0 : 350);
      };
      buttons.append(button);
    });
    row.append(pics, buttons);
    return row;
  }));
  $('grading').hidden = false;
}
function closeGrading() { $('grading').hidden = true; Sound.stop(); updateControls(); }
$('grade-open').onclick = () => { if (!busy) openGrading(); };
$('grading-close').onclick = closeGrading;
$('grading').addEventListener('click', event => { if (event.target === $('grading')) closeGrading(); });

/* ---------- How the mouth makes it: the animation in a window over the train ---------- */
let viewerItem = null, view = 'front', camera = null;
function stopCamera() { camera?.getTracks().forEach(track => track.stop()); camera = null; }
function video(side, muted) {
  const node = document.createElement('video');
  node.src = `animations/${viewerItem.id}-${side}.mp4`; node.playsInline = true; node.muted = muted; node.loop = true; node.preload = 'auto'; node.className = 'viewer-video';
  return node;
}
async function showView(next) {
  view = next; stopCamera();
  const panes = $('viewer-panes'), status = $('viewer-status');
  status.textContent = '';
  document.querySelectorAll('.viewer-modes [data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  let nodes;
  if (view === 'front' || view === 'side') nodes = [video(view, false)];
  else if (view === 'both') nodes = [video('front', false), video('side', true)];
  else {
    const mirror = document.createElement('video'); mirror.className = 'viewer-video viewer-camera'; mirror.playsInline = true; mirror.muted = true; mirror.autoplay = true;
    nodes = [video('front', false), mirror];
    try {
      camera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      if (view !== 'camera') { stopCamera(); return; }
      mirror.srcObject = camera;
    } catch { status.textContent = 'لا يمكن فتح الكاميرا. اسمح باستخدامها من إعدادات المتصفح.'; }
  }
  panes.className = `viewer-panes ${nodes.length > 1 ? 'two' : 'one'}`;
  /* Each view sits in its own box; Safari sizes a video in a grid cell against the whole grid otherwise. */
  panes.replaceChildren(...nodes.map(node => { const pane = document.createElement('div'); pane.className = 'viewer-pane'; pane.append(node); return pane; }));
  const videos = nodes.filter(node => node.src);
  await Promise.all(videos.map(node => node.play().catch(() => {})));
  if (videos.length > 1) together(videos[0], videos[1]);
}
/* Front and side together: the side view follows the front one (it carries the sound), so both start from the
   beginning at once and the side is pulled back into step whenever it drifts, also after each loop. */
function together(lead, follow) {
  if (!lead.isConnected) return;
  const align = () => { if (Math.abs(follow.currentTime - lead.currentTime) > 0.06) follow.currentTime = lead.currentTime; };
  lead.addEventListener('timeupdate', align); lead.addEventListener('seeked', align);
  lead.addEventListener('play', () => { align(); follow.play().catch(() => {}); });
  lead.addEventListener('pause', () => follow.pause());
  lead.currentTime = 0; follow.currentTime = 0;
}
function openViewer(item) {
  if (!hasVideo(item.id)) { toast('رسم الفم لهذا المقطع غير جاهز بعد.'); return; }
  token++; Sound.stop();
  viewerItem = item;
  $('viewer-title').textContent = item.word;
  $('viewer').hidden = false;
  void showView('front');
}
function closeViewer() { stopCamera(); $('viewer-panes').replaceChildren(); $('viewer').hidden = true; viewerItem = null; }
document.querySelectorAll('.viewer-modes [data-view]').forEach(button => { button.onclick = () => showView(button.dataset.view); });
$('viewer-close').onclick = closeViewer;
$('viewer').addEventListener('keydown', event => { if (event.key === 'Escape') closeViewer(); });
$('viewer').addEventListener('click', event => { if (event.target === $('viewer')) closeViewer(); });

/* ---------- Entering and leaving ---------- */
async function enterGame() {
  const r = run(), sound = soundById(r.sound);
  stations = Data.stationsOf(sound, r.positions);
  if (r.station >= stations.length) r.station = stations.length - 1;
  closeLayers();
  $('home').hidden = true; $('letters').hidden = true; $('stage').hidden = false; $('loading').hidden = false; $('turn').hidden = false;
  if (!playing) history.pushState({ train: true }, '');
  playing = true;
  train?.destroy();
  train = new Train($('world'), { sfx: Sound.sfx, hasVideo });
  $('loading').hidden = true;
  await arrive();
}
function closeLayers() { token++; Sound.stop(); closeViewer(); ['grading', 'done'].forEach(id => { $(id).hidden = true; }); }
function leave(fromHistory = false) {
  if (!playing) return;
  playing = false; closeLayers();
  $('stage').hidden = true; $('home').hidden = false; $('world').replaceChildren(); train?.destroy(); train = null; drawHome();
  if (!fromHistory && history.state?.train) history.back();
}
window.addEventListener('popstate', () => leave(true));
$('leave').onclick = () => leave();
$('done-home').onclick = () => leave();
$('done-again').onclick = () => { const r = run(); startRun({ sound: soundById(r.sound), positions: r.positions }); };
$('turn').onclick = () => { $('turn').hidden = true; };

drawHome();
if (!Children.list().length) { drawAccounts(); $('accounts').showModal(); }
/* Opened from today's session (assets/today.js): the plan's sound and short goal start with one tap. */
window.ArticulationToday?.offer('syllables', activity => {
  const sound = soundById(window.ArticulationTherapy.PARTS.syllables.id(activity.letter));
  if (sound && active()) { Sound.unlock(); startRun({ sound, positions: [activity.zone] }); }
});
window.SyllableTrain = { train: () => train, run, stations: () => stations };
