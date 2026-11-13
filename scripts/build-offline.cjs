// Writes offline-release.js: every file the whole app needs offline, for the app's service worker (sw.js).
// Small files (pages, code, styles, pictures) are the shell, cached when the worker installs; recordings and videos are
// the media, cached when «حفظ دون إنترنت» is pressed on the home page (or the first time each one plays).
// Run after adding or changing files: node scripts/build-offline.cjs   (--check fails when the list is out of date)
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), out = path.join(root, 'offline-release.js');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'docs', 'scripts', 'tests', '.claude']);
const SKIP_EXT = new Set(['.md', '.cjs', '.txt', '.map', '.DS_Store']);
const MEDIA_EXT = new Set(['.m4a', '.mp4', '.mp3', '.wav', '.webm']);
const SHELL_EXT = new Set(['.html', '.js', '.mjs', '.css', '.svg', '.png', '.webp', '.jpg', '.jpeg', '.json', '.webmanifest', '.ico', '.woff2']);
function walk(dir, list = []) {
  for (const name of fs.readdirSync(dir).sort()) {
    const full = path.join(dir, name), rel = path.relative(root, full).split(path.sep).join('/'), stat = fs.statSync(full);
    if (name.startsWith('.')) continue;
    if (stat.isDirectory()) { if (!SKIP_DIRS.has(name)) walk(full, list); continue; }
    const ext = path.extname(name).toLowerCase();
    if (SKIP_EXT.has(ext) || rel === 'offline-release.js' || rel === 'sw.js') continue;
    if (MEDIA_EXT.has(ext) || SHELL_EXT.has(ext)) list.push({ rel, ext, size: stat.size, full });
  }
  return list;
}
const files = walk(root), hash = crypto.createHash('sha256');
const shell = [], media = [];
let bytes = 0;
for (const file of files) {
  bytes += file.size;
  if (MEDIA_EXT.has(file.ext)) { media.push([file.rel, file.size]); hash.update(`${file.rel}:${file.size}\n`); }
  else { shell.push(file.rel); hash.update(file.rel); hash.update(fs.readFileSync(file.full)); }
}
const version = hash.digest('hex').slice(0, 16);
const text = `// Written by scripts/build-offline.cjs: the whole app's files for sw.js. Do not edit by hand.\nself.OFFLINE_RELEASE = ${JSON.stringify({ version, bytes, shell, media })};\n`;
if (process.argv.includes('--check')) {
  const now = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  if (now !== text) { console.error('offline-release.js is out of date. Run node scripts/build-offline.cjs.'); process.exit(1); }
  console.log(`PASS offline list matches: ${shell.length} files, ${media.length} recordings and videos.`);
} else {
  fs.writeFileSync(out, text);
  const shellBytes = files.filter(f => !MEDIA_EXT.has(f.ext)).reduce((a, f) => a + f.size, 0);
  console.log(`offline ${version}: ${shell.length} files (${(shellBytes / 1048576).toFixed(1)} MB), ${media.length} recordings and videos, ${(bytes / 1048576).toFixed(1)} MB in all.`);
}
