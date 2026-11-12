// Makes the front and side mouth videos for one syllable from the therapist's drawings and recording.
// Usage: node scripts/animate.cjs <letter id> <sound number>   e.g. 2 1 for بَا (see the mapping in model.mjs)
// Needs ffmpeg and Playwright (set SOUNDS_PLAYWRIGHT to a Playwright install if none is found).
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), [letter, sound] = process.argv.slice(2).map(Number);
const { chromium } = require(process.env.SOUNDS_PLAYWRIGHT || 'playwright');
const LETTERS = [...'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'];
/* Only CV for now: sound 1 is with ا, 2 with و, 3 with ي. */
/* The consonants drawn so far, by letter id: how the mouth holds each one before the vowel. */
const CONSONANTS = { 2: 'b', 3: 't', 4: 'th', 5: 'j', 6: 'hh7', 7: 'kh', 8: 'd', 9: 'dh', 10: 'r', 11: 'z', 12: 's', 13: 'sh', 14: 'S', 15: 'D', 16: 'T', 17: 'Z', 18: 'ain', 19: 'gh', 20: 'f', 21: 'q', 22: 'k', 23: 'l', 24: 'm', 25: 'n', 26: 'hh' };
/* Voiced sounds that are loud before the vowel: their vowel starts only where the recording gets much louder. */
const SONORANT = new Set(['m', 'n', 'l', 'r', 'ain']);
const VOWELS = { 1: { key: 'a', mark: 'َ', char: 'ا' }, 2: { key: 'u', mark: 'ُ', char: 'و' }, 3: { key: 'i', mark: 'ِ', char: 'ي' } };
const vowel = VOWELS[sound], consonant = LETTERS[letter - 1];
if (!vowel || !consonant || [1, 27, 28].includes(letter)) throw Error('Usage: node scripts/animate.cjs <consonant letter id> <1|2|3>');
if (!CONSONANTS[letter]) throw Error(`${consonant} is not drawn yet: add its mouth hold to CONS in scripts/animation.html and to CONSONANTS here.`);
const id = `${letter}-${sound}`, wav = path.join(root, 'sounds', String(letter), `${sound}.wav`), out = path.join(root, 'animations'), FPS = 30;
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
if (process.env.DRY) { console.log(`${id} ${LETTERS[letter - 1]}${vowel.char}: sound ${onset}s, vowel ${release}s, end ${end}s`); process.exit(0); }
const R = 1.3, A = R - release, C = A + end + .02, F = A + onset, seconds = Math.ceil((C + 1.25) * 10) / 10;

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] }), page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  const frames = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'syllable-'));
  for (const view of ['front', 'side']) {
    const query = new URLSearchParams({ mode: view, cons: CONSONANTS[letter], v: vowel.key, a: A, r: R, c: C, f: F, env: JSON.stringify(level) });
    await page.goto('file://' + path.join(__dirname, 'animation.html') + '?' + query);
    await page.evaluate(() => window.ready);
    for (let i = 0; i < seconds * FPS; i++) { await page.evaluate(t => frame(t), i / FPS); await page.locator('svg').first().screenshot({ path: path.join(frames, `${String(i).padStart(4, '0')}.png`) }); }
    const file = path.join(out, `${id}-${view}.mp4`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(frames, '%04d.png'), '-i', wav, '-filter_complex', `[0:v]scale=720:720[v];[1:a]aresample=44100,adelay=${Math.round(A * 1000)}:all=1,apad,atrim=0:${seconds}[a]`, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '22', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', file]);
    console.log(`${path.relative(root, file)}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
  }
  await browser.close();
  fs.rmSync(frames, { recursive: true, force: true });
  /* The library lists every syllable whose two videos are in the folder. */
  const ready = [...new Set(fs.readdirSync(out).map(name => /^(\d+-\d)-front\.mp4$/.exec(name)?.[1]).filter(found => found && fs.existsSync(path.join(out, `${found}-side.mp4`))))];
  ready.sort((a, b) => { const [la, sa] = a.split('-').map(Number), [lb, sb] = b.split('-').map(Number); return la - lb || sa - sb; });
  fs.writeFileSync(path.join(out, 'library.js'), `// Written by scripts/animate.cjs: syllables that have front and side videos in this folder.\nexport const READY = ${JSON.stringify(ready)};\n`);
  console.log(`${id}: sound starts ${onset}s, vowel starts ${release}s, voice ends ${end}s, video ${seconds}s`);
})().catch(error => { console.error(error); process.exit(1); });
