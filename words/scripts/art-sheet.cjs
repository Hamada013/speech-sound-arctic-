// Draws every picture of one sound on one sheet to check by eye: node scripts/art-sheet.cjs ba /tmp/ba.png
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { chromium } = require(process.env.SOUNDS_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '..'), [soundId, out] = process.argv.slice(2);
if (!soundId || !out) throw Error('Usage: node scripts/art-sheet.cjs <sound id> <output.png>');
const context = { window: {} };
for (const [, file] of fs.readFileSync(path.join(root, 'index.html'), 'utf8').matchAll(/src="(assets\/(?:data|art[^"]*)\.js)"/g)) vm.runInNewContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
const { ArticulationData: Data, ArticulationArt: Art } = context.window, sound = Data.soundById(soundId);
if (!sound) throw Error(`No sound called ${soundId}. Sounds: ${Data.sounds.map(entry => entry.id).join(', ')}`);
const cell = word => `<div><img src="${Art.objectURI(word.art)}"><img class="shape" src="${Art.shapeURI(word.art)}"><p>${word.word}</p></div>`;
const html = `<body dir="rtl" style="margin:0;padding:12px;background:#d6f0dc;font:700 18px system-ui"><style>section{display:grid;grid-template-columns:repeat(10,150px);gap:6px;margin-bottom:12px}div{position:relative;background:#fffc;border-radius:12px;text-align:center}p{margin:0}img{width:140px;height:140px;display:block;margin:auto}.shape{position:absolute;top:2px;left:2px;width:40px;height:40px;filter:brightness(0) opacity(.3)}</style>${Data.positions.map(position => `<section>${sound.words[position.id].map(cell).join('')}</section>`).join('')}`;
(async () => {
  const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1600, height: 700 } });
  await page.setContent(html);
  await page.waitForFunction(() => [...document.images].every(image => image.complete));
  const broken = await page.evaluate(() => [...document.images].filter(image => !image.naturalWidth).length);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log(broken ? `${broken} drawings failed to load` : `Saved ${out}`);
})();
