// The animation library: pick a letter, then any of its syllables, and watch the mouth from the front and from the side.
import { LETTERS, VOWELS, makeItem } from './model.mjs';
import { READY } from './animations/library.js';
import { pictureURI } from './assets/pictures.js';
const $ = id => document.getElementById(id), player = $('player'), video = $('player-video');
/* The written syllable with its vowel marks, as in the game: بَا, أَبْ, أَبُو. */
const MARK = ['َ', 'ُ', 'ِ'], LONG = ['ا', 'و', 'ي'], ALEF = ['أَ', 'أُ', 'إِ'];
function written(item) {
  const c = LETTERS[item.letter - 1].char.replace('هـ', 'ه'), v = id => VOWELS.indexOf(id), [p, q, r] = item.parts;
  if (item.mode === 'cv') return c + MARK[v(q)] + LONG[v(q)];
  if (item.mode === 'vc') return ALEF[v(p)] + c + 'ْ';
  return ALEF[v(p)] + c + MARK[v(r)] + LONG[v(r)];
}
const TYPES = [['cv', 'صامت ثم حركة'], ['vc', 'حركة ثم صامت'], ['vcv', 'حركة وصامت وحركة']];
let current = null, view = 'front', letter = null;

function pictures(item) {
  const box = document.createElement('span'); box.className = 'syllable-parts'; box.dir = 'rtl';
  for (const id of item.parts) { const part = document.createElement('span'), img = document.createElement('img'); part.className = 'syllable-part'; img.src = pictureURI(id); img.alt = ''; img.decoding = 'async'; part.append(img); box.append(part); }
  return box;
}
/* Sound numbers follow the recordings: 1-3 CV, 4-6 VC, 7-15 VCV, each vowel in the order ا و ي. */
function itemOf(id) {
  const [l, sound] = id.split('-').map(Number);
  if (sound <= 3) return makeItem('cv', l, VOWELS[sound - 1]);
  if (sound <= 6) return makeItem('vc', l, VOWELS[sound - 4]);
  return makeItem('vcv', l, VOWELS[Math.floor((sound - 7) / 3)], VOWELS[(sound - 7) % 3]);
}
const byLetter = new Map();
for (const id of READY) { const l = Number(id.split('-')[0]); if (!byLetter.has(l)) byLetter.set(l, []); byLetter.get(l).push(id); }

/* The letters as rounded chips; the chosen one is soft green with a check. */
function drawLetters() {
  $('library-letters').replaceChildren(...[...byLetter.keys()].map(l => {
    const chip = document.createElement('button'); chip.type = 'button'; chip.className = 'letter-chip'; chip.textContent = LETTERS[l - 1].char;
    chip.setAttribute('aria-pressed', String(l === letter)); chip.setAttribute('aria-label', `الحرف ${LETTERS[l - 1].char}`);
    chip.onclick = () => { letter = l; drawLetters(); drawSyllables(); };
    return chip;
  }));
}
function drawSyllables() {
  const ids = byLetter.get(letter) || [];
  $('library-list').replaceChildren(...TYPES.map(([type, name]) => {
    const items = ids.map(itemOf).filter(item => item.mode === type);
    if (!items.length) return '';
    const section = document.createElement('section'), title = document.createElement('h2'), row = document.createElement('div');
    section.className = 'library-group'; title.textContent = name; row.className = 'library-row';
    for (const item of items) {
      const card = document.createElement('button'), label = document.createElement('strong');
      card.type = 'button'; card.className = 'library-card'; card.setAttribute('aria-label', `شاهد ${written(item)}`);
      label.textContent = written(item); card.append(pictures(item), label);
      card.onclick = () => open(item.id);
      row.append(card);
    }
    section.append(title, row);
    return section;
  }));
}

function play() {
  $('player-status').textContent = '';
  video.src = `animations/${current}-${view}.mp4`;
  video.play().catch(() => { $('player-status').textContent = 'اضغط على الرسم لمشاهدة الحركة.'; });
  player.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
}
function open(id) { current = id; view = 'front'; $('player-title').textContent = written(itemOf(id)); player.showModal(); play(); }
function close() { video.pause(); video.removeAttribute('src'); video.load(); player.close(); }

player.querySelectorAll('[data-view]').forEach(button => { button.onclick = () => { view = button.dataset.view; play(); }; });
video.onclick = () => { if (video.paused) void video.play().catch(() => {}); };
$('player-close').onclick = close;
video.onerror = () => { $('player-status').textContent = 'تعذر تشغيل الفيديو.'; };
player.addEventListener('cancel', event => { event.preventDefault(); close(); });
/* Tapping outside the window closes it. */
player.addEventListener('click', event => { if (event.target !== player) return; const box = player.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); });
letter = byLetter.keys().next().value ?? null;
drawLetters(); drawSyllables();
