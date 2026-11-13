// Makes the front and side mouth videos for one syllable from the therapist's drawings and recording.
// Usage: node scripts/animate.cjs <letter id> <sound number>   e.g. 2 1 for بَا (see the mapping in model.mjs and data.js)
//   sounds 1-3 are CV (بَا بُو بِي), 4-6 VC (أَبْ أُبْ إِبْ), 7-15 VCV (أَبَا … إِبِي: first vowel a, u, i, each with second vowel a, u, i).
//   node scripts/animate.cjs library   only rewrites animations/library.js from the videos in the folder.
// Needs ffmpeg and Playwright (set SOUNDS_PLAYWRIGHT to a Playwright install if none is found).
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), [letter, sound] = process.argv.slice(2).map(Number), out = path.join(root, 'animations');
/* The library lists every syllable whose two videos are in the folder. */
function writeLibrary() {
  const ready = [...new Set(fs.readdirSync(out).map(name => /^(\d+-\d+)-front\.mp4$/.exec(name)?.[1]).filter(found => found && fs.existsSync(path.join(out, `${found}-side.mp4`))))];
  ready.sort((a, b) => { const [la, sa] = a.split('-').map(Number), [lb, sb] = b.split('-').map(Number); return la - lb || sa - sb; });
  fs.writeFileSync(path.join(out, 'library.js'), `// Written by scripts/animate.cjs: syllables that have front and side videos in this folder.\nexport const READY = ${JSON.stringify(ready)};\n`);
  return ready.length;
}
if (process.argv[2] === 'library') { console.log(`library.js: ${writeLibrary()} syllables`); process.exit(0); }
const { chromium } = require(process.env.SOUNDS_PLAYWRIGHT || 'playwright');
const LETTERS = [...'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'];
/* The consonants drawn so far, by letter id: how the mouth holds each one before the vowel. */
const CONSONANTS = { 2: 'b', 3: 't', 4: 'th', 5: 'j', 6: 'hh7', 7: 'kh', 8: 'd', 9: 'dh', 10: 'r', 11: 'z', 12: 's', 13: 'sh', 14: 'S', 15: 'D', 16: 'T', 17: 'Z', 18: 'ain', 19: 'gh', 20: 'f', 21: 'q', 22: 'k', 23: 'l', 24: 'm', 25: 'n', 26: 'hh' };
/* Voiced sounds that are loud before the vowel: their vowel starts only where the recording gets much louder. */
const SONORANT = new Set(['m', 'n', 'l', 'r', 'ain']);
const V = ['a', 'u', 'i'];
/* What each sound number is: its kind and its vowels, in the same numbering as data.js. */
const kind = sound <= 3 ? 'cv' : sound <= 6 ? 'vc' : 'vcv', first = kind === 'cv' ? V[sound - 1] : kind === 'vc' ? V[sound - 4] : V[Math.floor((sound - 7) / 3)], second = kind === 'vcv' ? V[(sound - 7) % 3] : first;
const consonant = LETTERS[letter - 1];
if (!(sound >= 1 && sound <= 15) || !consonant || [1, 27, 28].includes(letter)) throw Error('Usage: node scripts/animate.cjs <consonant letter id> <1-15>');
if (!CONSONANTS[letter]) throw Error(`${consonant} is not drawn yet: add its mouth hold to CONS in scripts/animation.html and to CONSONANTS here.`);
const id = `${letter}-${sound}`, wav = path.join(root, 'sounds', String(letter), `${sound}.wav`), FPS = 30;
if (!fs.existsSync(wav)) throw Error(`No recording at ${wav}`);

/* Read the recording in 10 ms steps: loudness, and how hissy it is (many zero crossings means friction noise, not a vowel). */
const raw = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', wav, '-ac', '1', '-ar', '16000', '-f', 's16le', '-']);
const env = [], hiss = [];
for (let i = 0; i + 160 <= raw.length / 2; i += 160) { let sum = 0, cross = 0, last = 0; for (let j = 0; j < 160; j++) { const v = raw.readInt16LE((i + j) * 2) / 32768; sum += v * v; if (j && Math.sign(v) !== Math.sign(last) && Math.abs(v - last) > .002) cross++; last = v; } env.push(Math.sqrt(sum / 160)); hiss.push(cross / 160); }
const peak = Math.max(...env), level = env.map(v => +(v / peak).toFixed(3)), loudAt = SONORANT.has(CONSONANTS[letter]) ? .65 : .5;
/* The vowel starts at the first loud, smooth moment; the consonant's own sound starts at the first audible moment. */
/* Measured against the vowel's own loudness, because a hissing sound can be louder than its vowel. */
const smooth = level.map((v, i) => hiss[i] < .2 ? v : 0), vowelPeak = Math.max(...smooth);
let vowelAt = smooth.findIndex((v, i) => v > loudAt * vowelPeak && (smooth[i + 2] || 0) > loudAt * vowelPeak);
if (vowelAt < 0) vowelAt = level.findIndex(v => v > .35);
const release = vowelAt / 100, onset = Math.max(0, level.findIndex(v => v > .06)) / 100, end = (level.length - 1 - [...level].reverse().findIndex(v => v > .06)) / 100;
let params, A, C, note;
if (kind === 'cv') {
  const R = 1.3; A = R - release; C = A + end + .02;
  params = { r: R, f: A + onset }; note = `sound ${onset}s, vowel ${release}s, end ${end}s`;
} else {
  /* VC and VCV start with the vowel (after a light أ), so it begins at the first clearly voiced moment, even when it is
     quieter than a stressed second vowel. Loudness is averaged over 50 ms and hissy moments count as quiet. */
  const n = smooth.length, last = Math.round(end * 100), sonorant = SONORANT.has(CONSONANTS[letter]);
  const s = smooth.map((_, i) => { let sum = 0, k = 0; for (let j = i - 2; j <= i + 2; j++) if (j >= 0 && j < n) { sum += smooth[j]; k++; } return sum / k; });
  const run = (from, test, len) => { for (let i = Math.max(0, from); i + len <= n; i++) if (Array.from({ length: len }, (_, k) => test(i + k)).every(Boolean)) return i; return -1; };
  let o = run(0, i => smooth[i] > .15 * vowelPeak, 2); if (o < 0) o = Math.round(onset * 100);
  const span = last - o, max = (a, b) => Math.max(...s.slice(a, b + 1));
  /* The dip that the voice climbs out of on both sides (the fade at the very end never counts). The consonant runs from where
     the voice falls halfway into it, measured against the last quarter second before it, to where it climbs halfway back out. */
  function dip() {
    let m = -1, best = 0;
    for (let i = o + 6; i <= last - 6; i++) { const d = Math.min(max(o, i), max(i, last)) - s[i]; if (d > best) { best = d; m = i; } }
    if (m < 0) return { c: -1, r: -1, depth: 0 };
    const before = max(o, m), after = max(m, last), left = s[m] + (max(Math.max(o, m - 25), m) - s[m]) / 2, right = s[m] + (Math.min(before, after) - s[m]) / 2;
    let c = m, r = m; while (c > o && s[c - 1] < left) c--; while (r < last && s[r + 1] < right) r++;
    return { c, r: r + 1, depth: best / Math.max(before, after) };
  }
  let c = -1, r = -1, depth = 0;
  if (kind === 'vcv' || sonorant) ({ c, r, depth } = dip());
  else {
    /* VC with a stop or a hissing sound: the consonant starts where the vowel's loudness falls to half its peak. */
    const top = o + Math.max(...s.slice(o, o + Math.round(span * .6) + 1).map((v, i) => [v, i]).sort((x, y) => y[0] - x[0])[0].slice(1, 2)), peak = s[top];
    c = run(top + 2, i => s[i] < .5 * peak, 2); depth = 1;
  }
  /* When the recording does not split cleanly, fall back to fixed shares of the voice. */
  const bad = kind === 'vc' ? !(depth > .15 && c - o >= 6 && last - c >= 4) : !(depth > .15 && c - o >= 5 && r - c >= 3 && (r - c <= 40 || depth > .4) && last - r >= 8);
  if (bad && process.env.DRY) console.log(`  raw ${id}: o ${o} c ${c} r ${r} last ${last} depth ${depth.toFixed(2)}`);
  if (bad) { c = o + Math.round(span * (kind === 'vc' ? .55 : .38)); r = o + Math.round(span * .58); }
  if (process.env.DUMP) { console.log(JSON.stringify({ id, kind, s: s.map(v => +v.toFixed(3)), level, o, c, r, last, bad })); process.exit(0); }
  A = Math.max(.15, .55 - o / 100); C = A + end + .02;
  params = { o: A + o / 100, n: A + c / 100, ...(kind === 'vcv' ? { r: A + r / 100 } : {}) };
  note = `vowel ${o / 100}s, consonant ${c / 100}s${kind === 'vcv' ? `, vowel ${r / 100}s` : ''}, end ${end}s${bad ? ' (fixed shares)' : ''}`;
}
if (process.env.DRY) { console.log(`${id} ${kind}: ${note}`); process.exit(0); }
const seconds = Math.ceil((C + 1.25) * 10) / 10;

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] }), page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  const frames = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'syllable-'));
  for (const view of ['front', 'side']) {
    const query = new URLSearchParams({ mode: view, kind, cons: CONSONANTS[letter], v: first, v2: second, a: A, c: C, ...params, env: JSON.stringify(level) });
    await page.goto('file://' + path.join(__dirname, 'animation.html') + '?' + query);
    await page.evaluate(() => window.ready);
    for (let i = 0; i < seconds * FPS; i++) { await page.evaluate(t => frame(t), i / FPS); await page.locator('svg').first().screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.png`) }); }
    const file = path.join(out, `${id}-${view}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%04d.png'), '-i', wav, '-filter_complex', `[0:v]scale=720:720[v];[1:a]aresample=44100,adelay=${Math.round(A * 1000)}:all=1,apad,atrim=0:${seconds}[a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', file]);
    console.log(`${path.relative(root, file)}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
  }
  await browser.close();
  fs.rmSync(frames, { recursive: true, force: true });
  writeLibrary();
  console.log(`${id} ${kind}: ${note}, video ${seconds}s`);
})().catch(error => { console.error(error); process.exit(1); });
