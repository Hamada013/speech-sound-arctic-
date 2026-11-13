// Writes sounds/README.txt: every phrase (or sentence) with the file name its recording should have. Run after changing assets/data.js.
// Usage: node scripts/recordings.cjs [part folder]   e.g. node phrases/scripts/recordings.cjs sentences (or stories; default: phrases)
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..'), sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/data.js'), 'utf8'), sandbox);
const { sounds, title = 'العبارات' } = sandbox.window.ArticulationData, lines = [`تسجيلات ${title}`, 'سجّل كل واحدة وضعها في هذا المجلد بالاسم المكتوب هنا (m4a).', 'بعد إضافة التسجيلات تُسمع في اللعبة ويظهر زر الإعادة.'];
let have = 0;
for (const sound of sounds) {
  lines.push('', `=== ${sound.name} (${sound.letter})${sound.story ? `: ${sound.story}` : ''} ===`);
  for (const phrase of sound.phrases) { const done = fs.existsSync(path.join(root, 'sounds', `${phrase.n}.m4a`)); if (done) have++; lines.push(`${phrase.n}.m4a = ${phrase.text}${done ? '  ✓' : ''}`); }
}
fs.writeFileSync(path.join(root, 'sounds/README.txt'), lines.join('\n') + '\n');
console.log(`sounds/README.txt: ${have} of ${sounds.reduce((n, s) => n + s.phrases.length, 0)} phrases recorded.`);
