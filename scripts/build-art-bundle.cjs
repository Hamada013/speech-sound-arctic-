// Writes words/assets/art-bundle.js: the drawing kit and every sound's word drawings in one file, in the order the
// pages used to load them one by one (art-kit, art-common, art-words-<sound> in the words data order). One file is one
// request instead of thirty, which matters on slow phones. Edit the separate files, never the bundle; this script runs
// with scripts/build-offline.cjs, and --check fails when the bundle is stale.
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..'), dir = path.join(root, 'words/assets'), out = path.join(dir, 'art-bundle.js');
const SOUNDS = ['alef', 'ba', 'ta', 'tha', 'jeem', 'ha', 'kha', 'dal', 'dhal', 'ra', 'zay', 'seen', 'sheen', 'sad', 'dad', 'tta', 'zha', 'ain', 'ghain', 'fa', 'qaf', 'kaf', 'lam', 'mim', 'nun', 'heh', 'waw', 'ya'];
const files = ['art-kit.js', 'art-common.js', ...SOUNDS.map(s => `art-words-${s}.js`)];
const text = '// Written by scripts/build-art-bundle.cjs from ' + files.join(', ') + '. Do not edit.\n' + files.map(f => `\n/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(dir, f), 'utf8').trimEnd() + '\n').join('');
function build(check = false) {
  if (check) { if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== text) throw Error('words/assets/art-bundle.js is out of date. Run node scripts/build-art-bundle.cjs.'); return 'PASS art bundle is current.'; }
  fs.writeFileSync(out, text); return `art-bundle.js: ${files.length} files, ${Math.round(text.length / 1024)} KB.`;
}
module.exports = { build, files };
if (require.main === module) { try { console.log(build(process.argv.includes('--check'))); } catch (error) { console.error(error.message); process.exit(1); } }
