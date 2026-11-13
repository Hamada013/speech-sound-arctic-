// Writes sounds/README.txt (what to record, with each file name) and assets/recordings.js (word -> file number) for the
// approaches part: every family word and every made-up word that the words part has not recorded already.
// A word keeps its number for good: numbers already given are read back from assets/recordings.js, new words get the
// next numbers. Run after changing assets/data.js. Usage: node approaches/scripts/recordings.cjs
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), context = vm.createContext({}); context.window = context;
vm.runInContext(fs.readFileSync(path.join(root, 'assets/data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, '../words/assets/data.js'), 'utf8'), context);
const A = context.ApproachData, W = context.ArticulationData;
const bare = word => word.normalize('NFKC').replace(/[ً-ْٰ]/g, '');
const keyOf = w => bare(w.word) + (w.nonword ? '*' : '');
const listOf = sound => [...sound.words.first, ...sound.words.middle, ...sound.words.last];
const everyWord = W.sounds.flatMap(listOf), recorded = new Set(everyWord.map(w => bare(w.word)));
const wordsOfLetter = letter => listOf(W.sounds.find(s => s.letter === letter || (letter === 'ء' && s.id === 'alef')) || { words: { first: [], middle: [], last: [] } });

/* The numbers given so far. */
const mapFile = path.join(root, 'assets/recordings.js');
let numbers = {};
try { const sandbox = { window: {} }; vm.runInNewContext(fs.readFileSync(mapFile, 'utf8'), sandbox); numbers = sandbox.window.ApproachRecordings || {}; } catch {}
let next = Math.max(0, ...Object.values(numbers)) + 1;

/* Every word the part can say, in sections for the list: the family words, then each pattern's made-up words. */
const sections = [['كلمات العائلات (أزواج ومتقابلات)', A.families.flatMap(f => f.words)]];
for (const pattern of A.PATTERNS) {
  let made;
  if (pattern.deletion) made = A.deletionPairs(pattern.deletion, ['ب', 'ت', 'د', 'ك', 'م', 'ن', 'ل', 'ر', 'س'].flatMap(l => (W.sounds.find(s => s.letter === l)?.words[pattern.deletion] || []).slice(0, 4)), 12, everyWord).map(p => p.error);
  else made = pattern.contrasts.flatMap(([t, e]) => A.allPairs(t, e, wordsOfLetter(t), A.NEEDED, everyWord).filter(p => p.nonword).map(p => p.error));
  if (made.length) sections.push([`كلمات بلا معنى: ${pattern.name}`, made]);
}
const lines = ['تسجيلات المناهج', 'سجّل كل كلمة وضعها في هذا المجلد بالاسم المكتوب هنا (m4a). الكلمات بين «» بلا معنى: انطقها كما هي مكتوبة.', 'الكلمات المسجّلة في الكلمات لا تُعاد هنا، والتطبيق يستعمل تسجيلها. بعد إضافة تسجيلات شغّل: node approaches/scripts/recordings.cjs', ''];
let total = 0, done = 0;
const seen = new Set();
for (const [title, words] of sections) {
  const rows = [];
  for (const w of words) {
    const key = keyOf(w);
    if (seen.has(key) || (!w.nonword && recorded.has(bare(w.word)))) continue;
    seen.add(key);
    if (!numbers[key]) numbers[key] = next++;
    const n = numbers[key], have = fs.existsSync(path.join(root, 'sounds', `${n}.m4a`));
    total++; if (have) done++;
    rows.push(`${n}.m4a = ${w.nonword ? `«${w.word}»` : w.word}${have ? '  ✓' : ''}`);
  }
  if (rows.length) lines.push(`=== ${title} ===`, ...rows, '');
}
fs.mkdirSync(path.join(root, 'sounds'), { recursive: true });
fs.writeFileSync(path.join(root, 'sounds/README.txt'), lines.join('\n'));
fs.writeFileSync(mapFile, `// Written by scripts/recordings.cjs: each approaches word (without vowel marks; * marks a made-up word) and its recording number in sounds/.\nwindow.ApproachRecordings = ${JSON.stringify(numbers)};\n`);
console.log(`sounds/README.txt: ${done} of ${total} recorded.`);
