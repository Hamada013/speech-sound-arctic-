// Writes docs/recordings.pdf: every recording the app uses, part by part, with its file name and what to say, for
// recording everything again in one sitting. A cover page shows how many each part has recorded.
// Usage: node scripts/recordings-pdf.cjs   (needs Playwright: ARTICULATION_PLAYWRIGHT=<path to playwright>)
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const pw = require(process.env.ARTICULATION_PLAYWRIGHT || process.env.SOUNDS_PLAYWRIGHT || 'playwright');
const load = file => { const c = {}; c.window = c; vm.createContext(c); vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), c); return c.ArticulationData; };
const has = file => fs.existsSync(path.join(root, file));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Each part: { title, folder, format, note, cols, groups: [{ title, items: [{ file, text }] }] }. */
const parts = [];

/* المقاطع: 28 folders (by letter number), 15 syllables each: 1-3 CV, 4-6 VC, 7-15 VCV. */
{
  const LETTERS = [...'ءبتثجحخدذرزسشصضطظعغفقكلمنهوي'], NAMES = { 1: 'الهمزة', 27: 'الواو', 28: 'الياء' };
  const data = load('syllable/assets/data.js'), VOW = [['َ', 'ا'], ['ُ', 'و'], ['ِ', 'ي']], ALEF = ['أَ', 'أُ', 'إِ'];
  const label = (c, n) => n <= 3 ? c + VOW[n - 1][0] + VOW[n - 1][1] : n <= 6 ? ALEF[n - 4] + c + 'ْ' : ALEF[Math.floor((n - 7) / 3)] + c + VOW[(n - 7) % 3][0] + VOW[(n - 7) % 3][1];
  const groups = [];
  for (let f = 1; f <= 28; f++) {
    const sound = data.sounds.find(s => s.id === String(f)), items = [];
    for (let n = 1; n <= 15; n++) {
      const word = sound ? Object.values(sound.words).flat().find(i => i.number === n)?.word : label(LETTERS[f - 1], n);
      items.push({ file: `${n}.wav`, text: word, done: has(`syllable/sounds/${f}/${n}.wav`) });
    }
    groups.push({ title: `المجلد ${f}: ${sound ? sound.name : `صوت ${NAMES[f]} (مسجّل، غير مستعمل في القطار بعد)`}`, items });
  }
  parts.push({ title: 'المقاطع', folder: 'syllable/sounds/N', format: 'wav', note: 'N رقم المجلد (1 إلى 28). كل صوت في مجلد برقمه، وفيه 15 مقطعًا: 1-3 صامت ثم حركة، 4-6 حركة ثم صامت، 7-15 حركة وصامت وحركة.', cols: 5, groups });
}
/* الكلمات: one number for every word, by sound and word position. */
{
  const data = load('words/assets/data.js'), pos = { first: 'أول الكلمة', middle: 'وسط الكلمة', last: 'آخر الكلمة' };
  const groups = data.sounds.map(s => ({ title: `${s.name} (${s.letter})`, items: ['first', 'middle', 'last'].flatMap(z => s.words[z].map(w => ({ file: `${w.n}.m4a`, text: w.word, tag: pos[z], done: has(`words/sounds/${w.n}.m4a`) }))) }));
  parts.push({ title: 'الكلمات', folder: 'words/sounds', format: 'm4a', note: 'عشر كلمات لكل موضع من الصوت: أول الكلمة ثم وسطها ثم آخرها.', cols: 4, groups });
}
/* العبارات، الجمل، القصص: ten (or five) per sound, numbered in order. */
for (const [folder, title, cols, note] of [['phrases', 'العبارات', 2, 'عشر عبارات لكل صوت.'], ['sentences', 'الجمل', 1, 'عشر جمل لكل صوت.'], ['stories', 'القصص', 1, 'قصة لكل صوت، خمس صفحات، بترتيبها.']]) {
  const data = load(`${folder}/assets/data.js`);
  const groups = data.sounds.map(s => ({ title: `${s.name} (${s.letter})${s.story ? `: ${s.story}` : ''}`, items: s.phrases.map(p => ({ file: `${p.n}.m4a`, text: p.text, done: has(`${folder}/sounds/${p.n}.m4a`) })) }));
  parts.push({ title, folder: `${folder}/sounds`, format: 'm4a', note, cols, groups });
}
/* المناهج: the list its own script writes (words not recorded in الكلمات, and the made-up words). */
{
  const lines = fs.readFileSync(path.join(root, 'approaches/sounds/README.txt'), 'utf8').split('\n'), groups = [];
  for (const line of lines) {
    const head = /^=== (.+) ===$/.exec(line), row = /^(\d+\.m4a) = (.+?)(\s+✓)?$/.exec(line);
    if (head) groups.push({ title: head[1], items: [] });
    else if (row && groups.length) groups.at(-1).items.push({ file: row[1], text: row[2], done: has(`approaches/sounds/${row[1]}`) });
  }
  parts.push({ title: 'المناهج', folder: 'approaches/sounds', format: 'm4a', note: 'الكلمات بين «» بلا معنى: انطقها كما هي مكتوبة. كلمات الكلمات المسجّلة لا تُعاد. بعد التسجيل شغّل: node approaches/scripts/recordings.cjs', cols: 3, groups });
}

const count = p => p.groups.reduce((n, g) => n + g.items.length, 0), done = p => p.groups.reduce((n, g) => n + g.items.filter(i => i.done).length, 0);
const total = parts.reduce((n, p) => n + count(p), 0), today = new Date().toISOString().slice(0, 10);
const bar = p => { const c = count(p), d = done(p), w = c ? d / c * 100 : 0; return `<div class="row"><b>${p.title}</b><span class="track"><i style="width:${w}%"></i></span><span class="num">${d} / ${c}</span><span class="fmt">${p.format}</span></div>`; };
const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تسجيلات تدريب النطق</title><style>
@page{size:A4;margin:14mm 12mm 16mm}
*{box-sizing:border-box}body{margin:0;font-family:"Geeza Pro","Noto Naskh Arabic","Arial",sans-serif;color:#22445a;font-size:12.5px}
h1{font-size:30px;margin:0 0 4px}h2{font-size:24px;margin:0 0 4px;padding:8px 14px;border-radius:12px;background:#edf6f0;color:#2c7a53;break-after:avoid}
h3{font-size:14px;margin:12px 0 5px;padding-bottom:3px;border-bottom:1.5px solid #dceaf4;break-after:avoid}
.cover{height:250mm;display:flex;flex-direction:column;justify-content:center;gap:12px}.muted{color:#5c7285}
.row{display:grid;grid-template-columns:70px 1fr 90px 40px;align-items:center;gap:10px;margin:8px 0;font-size:15px}
.track{height:14px;border-radius:7px;background:#eef3f7;overflow:hidden}.track i{display:block;height:100%;background:#3f9a6c;border-radius:7px}
.num{direction:ltr;text-align:left;font-weight:700}.fmt{color:#5c7285;direction:ltr}
.how{margin-top:18px;padding:12px 16px;border:1px solid #dceaf4;border-radius:12px;line-height:1.8;font-size:13px}
section.part{break-before:page}.info{margin:6px 0 4px;line-height:1.7}.info code{direction:ltr;unicode-bidi:isolate;background:#f4f7fa;padding:1px 6px;border-radius:5px}
.group{break-inside:auto}.items{display:grid;gap:3px 10px;margin:0;padding:0;list-style:none}
.items li{display:flex;align-items:baseline;gap:8px;padding:3px 6px;border-radius:6px;break-inside:avoid}.items li:nth-child(odd){background:#f8fafc}
.box{width:11px;height:11px;flex:none;border:1.3px solid #9fb3c2;border-radius:3px;align-self:center}.box.done{background:#3f9a6c;border-color:#3f9a6c}
.file{flex:none;min-width:58px;direction:ltr;text-align:left;font-family:Menlo,monospace;font-size:11px;color:#5c7285}
.text{font-size:17px;font-weight:700;line-height:1.5}.tag{margin-inline-start:auto;font-size:10px;color:#8aa0b0;white-space:nowrap}
.c1 .text{font-size:18px}
</style></head><body>
<div class="cover"><h1>تسجيلات تدريب النطق</h1><p class="muted">كل ملف صوتي في التطبيق: اسم الملف وما يُقال فيه. ${total} تسجيلًا · ${today}</p>
${parts.map(bar).join('')}
<div class="how"><b>طريقة التسجيل</b><br>• سجّل كل سطر في ملف وحده، واسمه هو الرقم المكتوب بجانبه (مثل <span dir="ltr">12.m4a</span>)، وضعه في المجلد المكتوب أعلى قسمه.<br>• المقاطع بصيغة <span dir="ltr">wav</span>، وكل ما سواها <span dir="ltr">m4a</span>.<br>• المربّع الأخضر: الملف موجود الآن. الفارغ: لم يُسجَّل بعد.<br>• بعد استبدال الملفات شغّل <span dir="ltr">node scripts/build-offline.cjs</span> ليحفظها التطبيق دون إنترنت.</div></div>
${parts.map(p => `<section class="part"><h2>${p.title} <span class="muted" style="font-size:14px">· ${count(p)} تسجيلًا</span></h2>
<p class="info">المجلد: <code dir="ltr">${p.folder}</code> · الصيغة: <code dir="ltr">${p.format}</code><br>${esc(p.note)}</p>
${p.groups.map(g => `<div class="group"><h3>${esc(g.title)}</h3><ul class="items c${p.cols}" style="grid-template-columns:repeat(${p.cols},minmax(0,1fr))">${g.items.map(i => `<li><span class="box${i.done ? ' done' : ''}"></span><span class="file">${i.file}</span><span class="text">${esc(i.text)}</span>${i.tag ? `<span class="tag">${i.tag}</span>` : ''}</li>`).join('')}</ul></div>`).join('')}</section>`).join('')}
</body></html>`;

(async () => {
  const out = path.join(root, 'docs/recordings.pdf'), browser = await pw.chromium.launch(), page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await page.pdf({ path: out, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;font-size:9px;color:#8aa0b0;text-align:center"><span class="pageNumber"></span> / <span class="totalPages"></span></div>', margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' } });
  await browser.close();
  console.log(`docs/recordings.pdf: ${total} recordings in ${parts.length} parts (${parts.map(p => `${p.title} ${done(p)}/${count(p)}`).join('، ')}).`);
})().catch(error => { console.error(error.message); process.exit(1); });
