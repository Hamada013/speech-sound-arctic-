// Writes approaches/review.txt: for each error pattern, its minimal pairs, multiple and maximal oppositions and cycle words,
// marking doubtful words and missing pairs, for the therapist to approve. Run after changing assets/data.js.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..'), context = vm.createContext({}); context.window = context;
vm.runInContext(fs.readFileSync(path.join(root, 'assets/data.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, '../words/assets/data.js'), 'utf8'), context);
const A = context.ApproachData, W = context.ArticulationData;
const wordsOf = letter => W.sounds.find(s => s.letter === letter || (letter === 'ء' && s.id === 'alef'));
const show = w => w.nonword ? `«${w.word}» (بلا معنى)` : `${w.word}${w.picturable ? '' : ' (؟)'}`;
const wordsList = sound => [...sound.words.first, ...sound.words.middle, ...sound.words.last];
const count = (n, one, few) => `${n} ${n === 1 ? one : few}`;
const lines = ['مراجعة بيانات المناهج: الأزواج الدنيا، المتقابلات المتعددة والقصوى، والدورات', 'المطلوب ٥ أزواج واضحة لكل تقابل. الكلمة المعلّمة (؟) مجردة أو نادرة أو فعل: تحقّقي منها.', 'الكلمات بين «» بلا معنى وأُضيفت حيث تقلّ الأزواج الحقيقية؛ تحقّقي أنها ليست كلمات حقيقية. في اللعبة تظهر لها صورة مضحكة.', ''];
let short = 0;
for (const pattern of A.PATTERNS) {
  lines.push(`=== ${pattern.name} (${pattern.en}) ===`);
  if (pattern.deletion) {
    const pairs = A.deletionPairs(pattern.deletion, ['ب', 'ت', 'د', 'ك', 'م', 'ن', 'ل'].flatMap(l => wordsOf(l).words[pattern.deletion].slice(0, 3)), 5, W.sounds.flatMap(wordsList));
    lines.push(`• الكلمة، والكلمة دون صوتها ${pattern.deletion === 'last' ? 'الأخير' : 'الأول'}: ${count(pairs.length, 'زوج', 'أزواج')}`);
    pairs.forEach(p => lines.push(`    ${show(p.target)} — ${show(p.error)}`));
  }
  for (const [target, error] of pattern.contrasts) {
    const pairs = A.allPairs(target, error, wordsList(wordsOf(target)), A.NEEDED, W.sounds.flatMap(wordsList)), real = pairs.filter(p => !p.nonword).length, made = pairs.length - real; if (made) short++;
    lines.push(`• الهدف ${target}، والطفل يقول ${error}: ${count(real, 'زوج حقيقي', 'أزواج حقيقية')}${made ? ` + ${count(made, 'زوج بكلمة بلا معنى', 'أزواج بكلمات بلا معنى')}` : ''}`);
    pairs.forEach(p => lines.push(`    ${show(p.target)} — ${show(p.error)}${p.nonword ? '' : `   (${p.target.meaning} / ${p.error.meaning})`}`));
  }
  /* Multiple oppositions: the error sound that stands in for several targets in this pattern. */
  const byError = {}; pattern.contrasts.forEach(([t, e]) => (byError[e] ||= []).push(t));
  for (const [error, targets] of Object.entries(byError)) if (targets.length > 1) {
    const sets = A.multipleFor(error, targets);
    lines.push(`• متقابلات متعددة (${error} مكان ${targets.join(' و')}): ${sets.length ? sets.map(s => [s.error, ...s.targets].map(show).join(' / ')).join('  |  ') : 'لا توجد بعد'}`);
  }
  for (const target of [...new Set(pattern.contrasts.map(c => c[0]))]) {
    const max = A.maximalFor(target).slice(0, 4);
    lines.push(`• متقابلات قصوى للـ${target}: ${max.length ? max.map(m => `${show(m.target)}/${show(m.other)}`).join('  ') : 'لا توجد بعد'}`);
    const sound = wordsOf(target);
    if (sound) {
      const all = Object.values(sound.words).flat().map(w => w.word), listen = [...all.slice(0, 5), ...all.slice(10, 15), ...all.slice(20, 25)];
      lines.push(`• دورة الـ${target}: قائمة الاستماع (١٥): ${listen.join('، ')}`);
      lines.push(`  كلمات النطق (٥): ${sound.words.first.slice(0, 5).map(w => w.word).join('، ')}`);
    }
  }
  if (pattern.deletion) {
    const zone = pattern.id === 'final' ? 'last' : 'first', picks = ['ب', 'ت', 'د', 'ك', 'م', 'ن'].flatMap(l => wordsOf(l).words[zone].slice(0, 3).map(w => w.word));
    lines.push(`• دورة: قائمة الاستماع: ${picks.slice(0, 15).join('، ')}`);
    lines.push(`  كلمات النطق (٥): ${picks.filter((_, i) => i % 3 === 0).slice(0, 5).join('، ')}`);
  }
  lines.push('');
}
fs.writeFileSync(path.join(root, 'review.txt'), lines.join('\n') + '\n');
console.log(`review.txt written: ${A.PATTERNS.length} patterns, ${A.families.length} word families, ${short} contrasts filled with made-up words.`);
