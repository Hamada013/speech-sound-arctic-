/* Home, accounts, therapist switch, goals, report, the letter board, and a play through the stations of the syllable train. */
import { Train } from './train.js';
import { READY } from '../animations/library.js';

const Data = window.ArticulationData, Plan = window.ArticulationPlan, Report = window.ArticulationReport, Sound = window.SyllableAudio;
const { positions, sounds, soundById, positionName } = Data;
const KEY = 'articulation-syllables-children-v1', TEST_KEY = 'articulation-syllables-test-v1', PASSWORD = '013';
const $ = id => document.getElementById(id);
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const blank = () => ({ attempts: [], goals: {}, played: {}, run: null });
const isAdmin = name => name.normalize('NFKC').trim().toLocaleLowerCase() === 'hamada';
const sameName = name => name.normalize('NFKC').replace(/[ً-ٰٟـ]/g, '').trim().toLocaleLowerCase();
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const hasVideo = id => READY.includes(id);

function toast(text) { const box = $('toast'); box.textContent = text; box.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { box.hidden = true; }, 3800); }

/* Each child's record holds everything they earn, so deleting a child removes it. */
let store = { schema: 1, active: null, children: [] };
try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved?.schema === 1 && Array.isArray(saved.children)) store = saved; } catch {}
store.children.forEach(child => { child.progress = { ...blank(), ...child.progress }; });
function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); return true; } catch { toast('تعذّر حفظ التقدم على هذا الجهاز.'); return false; } }
const active = () => store.children.find(child => child.id === store.active) || null;
window.ArticulationActive = active;
const currentRun = () => active()?.progress.run || null;

let testMode = false;
try { testMode = localStorage.getItem(TEST_KEY) === 'on'; } catch {}
function setTestMode(on) { testMode = on; try { localStorage.setItem(TEST_KEY, on ? 'on' : 'off'); } catch { toast('تعذّر حفظ الإعداد على هذا الجهاز.'); } drawHome(); }

function drawHome() {
  const child = active();
  $('account-name').textContent = child ? child.name : 'الحسابات';
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
function choose(id) { store.active = id; save(); drawHome(); $('accounts').close(); const next = afterPick; afterPick = null; next?.(); }
function drawAccounts() {
  $('child-name').value = ''; $('account-error').hidden = true;
  window.SuiteAccounts.render($('account-list'), store.children, child => { const select = document.createElement('button'); select.type = 'button'; select.onclick = () => choose(child.id); return window.SuiteAccounts.row(child, select); });
}
async function openAccounts() { if (active() && !await window.ChildAccountGate.request()) return; drawAccounts(); $('accounts').showModal(); }
$('account').onclick = () => { afterPick = null; void openAccounts(); };
$('account-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = $('child-name').value.trim();
  if (!name) { $('account-error').textContent = 'اكتب اسم الطفل أولًا.'; $('account-error').hidden = false; $('child-name').focus(); return; }
  let child = store.children.find(entry => sameName(entry.name) === sameName(name));
  if (!child) { child = { id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, name, created: new Date().toISOString(), progress: blank() }; if (isAdmin(name)) child.role = 'admin'; store.children.push(child); }
  choose(child.id);
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
function drawReport() { const child = active(); $('report-pdf').disabled = !child?.progress.attempts.length; $('report-status').hidden = true; if (child) Report.draw($('report-body'), child); else $('report-body').textContent = 'اختر حسابًا أولًا.'; }
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
    const art = document.createElement('img'); art.src = sound.picture; art.alt = '';
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
    art.src = sound.picture; art.alt = ''; letter.textContent = sound.letter;
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

/* Tap a car to hear it; hold it to see how the mouth makes it. Tap the engine to hear the whole train. */
function wire() {
  train.engine.onclick = () => { if (!busy) void playAll(); };
  train.engine.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); train.engine.onclick(); } };
  for (const car of train.cars) {
    let timer = null, held = false;
    const node = car.node;
    node.addEventListener('pointerdown', event => { if (busy) return; held = false; node.setPointerCapture?.(event.pointerId); timer = setTimeout(() => { held = true; openViewer(car.item); }, 520); });
    const release = () => { clearTimeout(timer); if (!held && !busy && timer !== null) void playItem(car); timer = null; };
    node.addEventListener('pointerup', release);
    node.addEventListener('pointercancel', () => { clearTimeout(timer); timer = null; });
    node.addEventListener('contextmenu', event => event.preventDefault());
    node.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void playItem(car); } if (event.key === 'v' || event.key === 'ر') openViewer(car.item); };
  }
}

async function arrive() {
  busy = true; updateControls();
  const entry = station(), sound = soundById(run().sound);
  train.build(entry); wire();
  Sound.warm(entry.items.map(item => item.audio));
  drawStations();
  await train.arrive(run().station, sound.picture);
  Sound.sfx('toot'); train.board();
  busy = false; updateControls();
}

/* Grades for one syllable type go to the report when the last station of that type is done. */
function closeType(type) {
  const child = active(), r = run(), list = soundById(r.sound).words[type], graded = list.filter(item => r.scores[item.id] !== undefined);
  if (!graded.length) return;
  child.progress.attempts.push({ date: new Date().toISOString(), run: r.id, sound: r.sound, zone: type, scores: Object.fromEntries(graded.map(item => [item.id, r.scores[item.id]])) });
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
  $('done').hidden = false;
}

/* Grading: one row per car, right, semi or wrong for each, scored 1, 0.5 and 0. */
const GRADES = [[1, 'right', 'صحيح', 'm5 13 4 4L19 7'], [.5, 'semi', 'جزئي', 'M5 12h14'], [0, 'wrong', 'خطأ', 'm6 6 12 12M18 6 6 18']];
function openGrading() {
  const r = run();
  $('grading-rows').replaceChildren(...train.cars.map(car => {
    const row = document.createElement('div'), pics = document.createElement('button'), buttons = document.createElement('div');
    row.className = 'grading-row'; pics.type = 'button'; pics.className = 'grading-car'; pics.setAttribute('aria-label', `اسمع ${car.item.word}`);
    car.item.parts.forEach(part => { const img = document.createElement('img'); img.src = `images/${part}.png`; img.alt = ''; pics.append(img); });
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

/* ---------- How the mouth makes it: the animation library, full screen ---------- */
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
  panes.replaceChildren(...nodes);
  const videos = nodes.filter(node => node.src);
  await Promise.all(videos.map(node => node.play().catch(() => {})));
}
function openViewer(item) {
  if (!hasVideo(item.id)) { toast('رسم الفم لهذا المقطع غير جاهز بعد.'); return; }
  token++; Sound.stop();
  viewerItem = item;
  $('viewer').hidden = false;
  void showView('front');
}
function closeViewer() { stopCamera(); $('viewer-panes').replaceChildren(); $('viewer').hidden = true; viewerItem = null; }
document.querySelectorAll('.viewer-modes [data-view]').forEach(button => { button.onclick = () => showView(button.dataset.view); });
$('viewer-replay').onclick = () => { document.querySelectorAll('#viewer-panes video[src]').forEach(node => { node.currentTime = 0; void node.play().catch(() => {}); }); };
$('viewer-close').onclick = closeViewer;
$('viewer').addEventListener('keydown', event => { if (event.key === 'Escape') closeViewer(); });

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
  train = new Train($('world'), { sfx: Sound.sfx });
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
if (!store.children.length) { drawAccounts(); $('accounts').showModal(); }
window.SyllableTrain = { train: () => train, run, stations: () => stations };
