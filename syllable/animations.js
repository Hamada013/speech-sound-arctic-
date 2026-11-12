// The animation library: every syllable with mouth videos, each shown from the front and from the side.
import { LETTERS, makeItem } from './model.mjs';
import { READY } from './animations/library.js';
const $ = id => document.getElementById(id), player = $('player'), video = $('player-video');
let current = null, view = 'front';

function pictures(item) {
  const box = document.createElement('span'); box.className = 'syllable-parts'; box.dir = 'rtl';
  for (const id of item.parts) { const part = document.createElement('span'), img = document.createElement('img'); part.className = 'syllable-part'; img.src = `images/${id}.png`; img.alt = ''; img.decoding = 'async'; part.append(img); box.append(part); }
  return box;
}
/* Sound numbers follow the recordings: 1 with ا, 2 with و, 3 with ي. */
const itemOf = id => { const [letter, sound] = id.split('-').map(Number); return makeItem('cv', letter, [1, 27, 28][sound - 1]); };

function draw() {
  const groups = new Map();
  for (const id of READY) { const letter = Number(id.split('-')[0]); if (!groups.has(letter)) groups.set(letter, []); groups.get(letter).push(id); }
  $('library-list').replaceChildren(...[...groups].map(([letter, ids]) => {
    const section = document.createElement('section'), title = document.createElement('h2'), row = document.createElement('div');
    section.className = 'library-group'; title.textContent = LETTERS[letter - 1].char; row.className = 'library-row';
    for (const id of ids) {
      const item = itemOf(id), card = document.createElement('button'), name = document.createElement('strong');
      card.type = 'button'; card.className = 'library-card'; card.setAttribute('aria-label', `شاهد ${item.label}`);
      name.textContent = item.label; card.append(pictures(item), name);
      card.onclick = () => open(id);
      row.append(card);
    }
    section.append(title, row);
    return section;
  }));
}

function play() {
  $('player-status').textContent = '';
  video.src = `animations/${current}-${view}.mp4`;
  video.play().catch(() => { $('player-status').textContent = 'اضغط زر إعادة التشغيل لمشاهدة الحركة.'; });
  player.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
}
function open(id) { current = id; view = 'front'; $('player-title').textContent = itemOf(id).label; player.showModal(); play(); }
function close() { video.pause(); video.removeAttribute('src'); video.load(); player.close(); }

player.querySelectorAll('[data-view]').forEach(button => { button.onclick = () => { view = button.dataset.view; play(); }; });
$('player-replay').onclick = () => { video.currentTime = 0; video.play().catch(() => {}); };
$('player-close').onclick = close;
video.onerror = () => { $('player-status').textContent = 'تعذر تشغيل الفيديو.'; };
player.addEventListener('cancel', event => { event.preventDefault(); close(); });
/* Tapping outside the window closes it. */
player.addEventListener('click', event => { if (event.target !== player) return; const box = player.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); });
draw();
