// Plays the real app with taps. APP_ENGINE=webkit tests Safari's engine; REDUCED=1 tests reduced motion; SHOTS=<dir> saves screenshots.
const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const pw = require(process.env.SOUNDS_PLAYWRIGHT || 'playwright');
const root = path.resolve(__dirname, '..'), shots = process.env.SHOTS, engine = process.env.APP_ENGINE || 'chromium';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.m4a': 'audio/mp4' };

const server = http.createServer((request, response) => {
  const name = decodeURIComponent(new URL(request.url, 'http://x').pathname).replace(/^\/words\//, '') || 'index.html', file = path.join(root, name === '' ? 'index.html' : name);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404); response.end(); return; }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); response.end(fs.readFileSync(file));
});
const shot = async (page, name) => { if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `${engine}-${name}.png`) }); } };

const uncollected = page => page.evaluate(() => { const s = ArticulationGame.scene(), id = s.currentZone(); return s.items.filter(item => item.word.zone === id).length; });
const screen = `(point, s) => { const c = s.cameras.main, r = ArticulationGame.ratio(); return { x: (point.x - c.worldView.x) * c.zoom / r, y: (point.y - c.worldView.y) * c.zoom / r, view: [c.width / r, c.height / r] }; }`;
const tapWorld = page => page.evaluate(`(() => { const s = ArticulationGame.scene(), to = ${screen}, item = s.items.find(e => e.word.zone === s.currentZone()); if (!item) return null; return { ...to(s.aimPoint(item), s), kind: item.kind, art: item.word.art }; })()`);
async function near(page) { await page.evaluate(() => { const s = ArticulationGame.scene(), item = s.items.find(e => e.word.zone === s.currentZone()); s.hero.setPosition(item.x + (item.x > s.zoneOf(item).cx ? -100 : 100), item.y + 40); }); await page.waitForTimeout(500); }
async function reachItem(page) {
  await near(page);
  let point = await tapWorld(page);
  assert.ok(point, 'an object remains');
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => !ArticulationGame.scene().path.length, null, { timeout: 8000 });
  await page.waitForTimeout(200);
  if (point.kind === 'high') {
    assert.ok(await page.evaluate(() => !!ArticulationGame.scene().hintMark), 'double-tap hint shows under the holder');
    const middle = { x: point.view[0] / 2, y: point.view[1] - 60 };
    await page.waitForTimeout(400);
    await page.mouse.click(middle.x, middle.y); await page.mouse.click(middle.x, middle.y);
  }
  if (point.kind === 'hidden') for (let i = 0; i < 2 && (await tapWorld(page))?.kind === 'hidden'; i++) { point = await tapWorld(page); await page.mouse.click(point.x, point.y); await page.waitForTimeout(350); }
  await page.waitForSelector('#encounter:not([hidden])', { timeout: 15000 });
}
const ready = page => page.waitForFunction(() => !ArticulationGame.scene().busy, null, { timeout: 25000 });
const closed = page => page.waitForSelector('#encounter', { state: 'hidden' });
async function bagIt(page) { await reachItem(page); await page.waitForSelector('#enc-collect:not([hidden])', { timeout: 8000 }); assert.equal(await page.isVisible('#enc-grades'), false, 'no grading while the switch is off'); await page.click('#enc-collect', { force: true }); await closed(page); }
async function gradeIt(page, grade) { await reachItem(page); await page.waitForSelector('#enc-grades:not([hidden])', { timeout: 8000 }); assert.equal(await page.isVisible('#enc-collect'), false, 'the grade puts the word in the bag'); await page.click(`#enc-grades .grade.${grade}`, { force: true }); await closed(page); }
/* Nine items, then the tenth brings up the board. */
async function clearStage(page, action) { for (let i = 0; i < 9; i++) { await action(page); await ready(page); } await action(page); await page.waitForSelector('#board:not([hidden])', { timeout: 8000 }); assert.equal(await page.locator('.board-tile').count(), 10, 'the board shows all ten collected words'); }
const go = async (page, id, waitOpen = true) => { await page.click('#board-go', { force: true }); if (waitOpen) await page.waitForFunction(which => ArticulationGame.scene().progress.unlocked[which] === true && !ArticulationGame.scene().busy, id, { timeout: 25000 }); };
async function travel(page, index, id, mid = true) {
  await page.evaluate(([i]) => { const s = ArticulationGame.scene(), ride = Object.values(s.rides).find(entry => entry.index === i); s.path = []; s.hero.setPosition(ride.stand.x, ride.stand.y); }, [index]);
  await page.waitForTimeout(700);
  const before = await page.evaluate(() => ArticulationGame.scene().hero.x);
  const spot = await page.evaluate(`(() => { const s = ArticulationGame.scene(), to = ${screen}; return to(s.arrow.visible ? s.arrow : s.rides.${id}, s); })()`);
  await page.mouse.click(spot.x, Math.max(90, spot.y));
  await page.waitForFunction(() => ArticulationGame.scene().busy, null, { timeout: 8000 });
  await page.waitForTimeout(mid ? 1900 : 500);
  const middle = await page.evaluate(() => ArticulationGame.scene().hero.x);
  await shot(page, `ride-${await page.evaluate(i => ArticulationGame.world().stages[i].ride, index)}`);
  await page.waitForFunction(i => { const s = ArticulationGame.scene(); return !s.busy && s.heroIndex() === i + 1; }, index, { timeout: 14000 });
  const after = await page.evaluate(() => ArticulationGame.scene().hero.x);
  assert.ok(before < after && middle >= before, `the ${id} crossing travels left to right`);
}
async function pin(page, code) { for (const digit of code) await page.click(`#pin-pad button:text-is("${digit}")`); }
const started = async page => { await page.waitForSelector('#loading', { state: 'hidden', timeout: 25000 }); await page.waitForFunction(() => ArticulationGame.scene()?.hero && ArticulationGame.scene().scene.isActive()); await page.waitForTimeout(600); };
const run = page => page.evaluate(() => { const r = ArticulationActive().progress.run; return { sound: r.sound, scenario: r.scenario, positions: r.positions }; });

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}/words/index.html`;
  const browser = await pw[engine].launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: false, reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference' });
  const page = await context.newPage(), errors = [], requested = []; global.testPage = page; global.testErrors = errors;
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !/favicon|Failed to load resource/.test(message.text())) errors.push(message.text()); });
  page.on('response', response => { if (/\.m4a/.test(response.url())) requested.push(response.url()); });
  await page.goto(url);

  // Every sound has ten drawn words in each position, with no drawing used twice in one sound.
  const content = await page.evaluate(() => ArticulationData.sounds.flatMap(sound => { const all = ArticulationData.positions.flatMap(p => sound.words[p.id]); return [...ArticulationData.positions.filter(p => sound.words[p.id].length !== 10).map(p => `${sound.id}:${p.id} count`), ...all.filter(w => !ArticulationKit.words[w.art]).map(w => `${w.art} undrawn`), ...(new Set(all.map(w => w.art)).size === 30 ? [] : [`${sound.id} repeats a drawing`])]; }));
  assert.deepEqual(content, []);

  // The plan rules, checked directly.
  const rules = await page.evaluate(() => {
    const score = (art, value) => ({ [art]: value }), full = (sound, zone, right) => ({ date: '2026-01-01', sound, zone, scores: Object.fromEntries(ArticulationData.soundById(sound).words[zone].map((w, i) => [w.art, i < right ? 1 : 0])) });
    const kid = (attempts, goals = {}) => ({ progress: { attempts, goals, played: {}, lastScenario: null, run: null } });
    const empty = ArticulationPlan.planFor(kid([]));
    const oneGood = ArticulationPlan.planFor(kid([full('alef', 'first', 9)]));
    const twoGood = ArticulationPlan.planFor(kid([full('alef', 'first', 9), full('alef', 'first', 8)]));
    const brokenStreak = ArticulationPlan.planFor(kid([full('alef', 'first', 9), full('alef', 'first', 5), full('alef', 'first', 9)]));
    const goal = ArticulationPlan.planFor(kid([full('alef', 'first', 9), full('alef', 'first', 9)], { ba: ['last'] }));
    const twoGoals = ArticulationPlan.planFor(kid([], { ba: ['last'], ta: ['first'] }));
    const allDone = ArticulationPlan.planFor(kid(['first', 'middle', 'last'].flatMap(z => [full('ta', z, 10), full('ta', z, 10)])));
    const newKid = kid([]);
    const first = ArticulationPlan.scenarioFor(newKid, ArticulationData.soundById('ba'));
    const seen = { progress: { played: { ba: 1 }, lastScenario: 'house' } };
    const later = Array.from({ length: 30 }, () => ArticulationPlan.scenarioFor(seen, ArticulationData.soundById('ba')));
    return { empty: empty.choose?.length, oneGood: oneGood.positions, twoGood: twoGood.positions, brokenStreak: brokenStreak.positions, goal: [goal.sound?.id, goal.positions], twoGoals: twoGoals.choose?.map(s => s.id), allDone: allDone.choose?.length, first, later: [...new Set(later)].sort() };
  });
  assert.equal(rules.empty, 28, 'no report: the letter board');
  assert.deepEqual(rules.oneGood, ['first', 'middle', 'last'], 'one good session is not enough');
  assert.deepEqual(rules.twoGood, ['middle', 'last'], 'two sessions in a row at 80% drop the position');
  assert.deepEqual(rules.brokenStreak, ['first', 'middle', 'last'], 'the two good sessions must be in a row');
  assert.deepEqual(rules.goal, ['ba', ['last']], 'goals outrank the report');
  assert.deepEqual(rules.twoGoals, ['ba', 'ta'], 'several goals: the child picks among them');
  assert.equal(rules.allDone, 28, 'everything reached: back to the letter board');
  assert.equal(rules.first, 'house', "a sound's first play uses its own scenario");
  assert.deepEqual(rules.later, ['islands', 'street'], 'later plays are random and never repeat the last scenario');

  // First launch asks for an account with no parent gate.
  await page.waitForSelector('#accounts[open]');
  await page.fill('#child-name', 'سلمى');
  await page.check('input[value=girl]', { force: true });
  await page.click('#account-form button[type=submit]');
  await shot(page, '01-home');

  // The password protects the switch, and the therapist's icons appear only with it on.
  assert.equal(await page.isVisible('#report-open'), false);
  assert.equal(await page.isVisible('#goals-open'), true, 'parents can set goals without the therapist switch');
  await page.click('#test-switch'); await pin(page, '999');
  await page.waitForFunction(() => document.getElementById('pin-error').textContent);
  await page.waitForTimeout(500);
  assert.equal(await page.getAttribute('#test-switch', 'aria-checked'), 'false');
  await page.click('#password [data-close]');

  // No report yet: Play shows the letters.
  await page.click('#play');
  await page.waitForSelector('#letters:not([hidden])');
  assert.equal(await page.locator('.letter-tile').count(), 28);
  await page.waitForTimeout(500);
  await shot(page, '02-letters');
  await page.click('.letter-tile >> nth=0');
  await started(page);
  assert.deepEqual(await run(page), { sound: 'alef', scenario: 'islands', positions: ['first', 'middle', 'last'] });
  await shot(page, '03-islands');

  await reachItem(page);
  await page.waitForSelector('#enc-collect:not([hidden])', { timeout: 8000 });
  assert.equal(await page.locator('#enc-say').count(), 0, 'no recording button');
  assert.equal(await page.isVisible('#enc-replay'), false, 'no speaker until a recording exists');
  await page.click('#enc-collect', { force: true }); await closed(page); await ready(page);
  assert.equal(await page.textContent('#bag-count'), '1');
  for (let i = 0; i < 8; i++) { await bagIt(page); await ready(page); }
  await bagIt(page);
  await page.waitForSelector('#board:not([hidden])', { timeout: 8000 });
  assert.equal(await page.locator('.board-tile').count(), 10);
  assert.equal(await page.locator('#score').count(), 0, 'no percentage stop between islands');
  await page.waitForTimeout(500);
  await shot(page, '04-board');
  await page.click('.board-tile >> nth=2');
  await go(page, 'first');
  await shot(page, '05-boat-arrived');

  await page.click('#bag');
  assert.equal(await page.locator('.slot.owned').count(), 10);
  assert.equal(await page.locator('.slot.missing').count(), 20);
  await page.click('#pack-close');
  await travel(page, 0, 'first');

  // Therapist on: the report and goals appear in the header, and the run continues after a reload.
  await page.click('#leave'); await page.waitForSelector('#home:not([hidden])');
  await page.click('#test-switch'); await pin(page, '013');
  await page.waitForFunction(() => document.getElementById('test-switch').getAttribute('aria-checked') === 'true');
  assert.equal(await page.isVisible('#report-open'), true); assert.equal(await page.isVisible('#goals-open'), true);
  await page.click('#report-open');
  assert.ok((await page.textContent('#report-body')).includes('لا توجد جلسات'), 'an empty report says so');
  await page.click('#report [data-close]');
  await shot(page, '06-home-therapist');
  await page.reload();
  await page.waitForSelector('#home:not([hidden])');
  await page.click('#play');
  await started(page);
  assert.equal(await uncollected(page), 10, 'second island is next after reload');

  await reachItem(page);
  await page.waitForSelector('#enc-grades:not([hidden])', { timeout: 8000 });
  await page.click('#enc-grades .grade.right', { force: true }); await closed(page); await ready(page);
  await gradeIt(page, 'semi'); await ready(page);
  await page.click('#leave'); await page.waitForSelector('#home:not([hidden])');
  await page.click('#play');
  await started(page);
  assert.equal(await uncollected(page), 8, 'two words stayed collected');
  for (let i = 0; i < 7; i++) { await gradeIt(page, 'right'); await ready(page); }
  await gradeIt(page, 'right');
  await page.waitForSelector('#board:not([hidden])', { timeout: 8000 });
  await go(page, 'middle');
  await travel(page, 1, 'middle');
  await page.waitForTimeout(400);
  await clearStage(page, p => gradeIt(p, 'wrong'));
  await page.click('#board-go', { force: true });
  await page.waitForSelector('#done:not([hidden])', { timeout: 15000 });
  assert.ok((await page.textContent('#done-result')).includes('48%'), 'graded stages count together: (9.5+0)/20');
  await shot(page, '07-done');
  await page.click('#done-home');

  // The report: tiles, chart with a readout, and a grade that can be fixed.
  await page.click('#report-open');
  await page.waitForSelector('.rp-plot svg');
  assert.ok((await page.textContent('.rp-doc')).includes('95%'));
  assert.equal(await page.locator('.score-tile').count(), 0, 'no word picture cards in the report');
  const box = await page.locator('.rp-plot svg').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 60);
  await page.waitForSelector('.rp-tip:not([hidden])');
  await page.waitForTimeout(150);
  await shot(page, '08-report');
  const [pdf] = await Promise.all([page.waitForEvent('download', { timeout: 45000 }), page.click('#report-pdf')]);
  const pdfFile = path.join(shots || require('node:os').tmpdir(), `${engine}-report.pdf`);
  await pdf.saveAs(pdfFile);
  assert.equal(fs.readFileSync(pdfFile).subarray(0, 5).toString(), '%PDF-', 'the icon downloads a real PDF');
  assert.ok(pdf.suggestedFilename().endsWith('.pdf'));
  await page.click('#report [data-close]');

  // A window closes when you tap outside it, but not when you tap inside.
  await page.click('#goals-open');
  await page.click('#goals-title');
  assert.equal(await page.evaluate(() => document.getElementById('goals').open), true);
  await page.mouse.click(3, 420);
  assert.equal(await page.evaluate(() => document.getElementById('goals').open), false, 'tapping outside closes the goals window');

  // Goals: ب with two word positions plays only those, in the house.
  await page.click('#goals-open');
  await page.locator('.goal').nth(1).locator('.switch-mini').click();
  await page.locator('.goal').nth(1).locator('.goal-chip').nth(2).click();
  await page.waitForTimeout(150);
  await shot(page, '09-goals');
  await page.click('#goals [data-close]');
  await page.click('#play');
  await started(page);
  assert.deepEqual(await run(page), { sound: 'ba', scenario: 'house', positions: ['first', 'middle'] }, 'goals decide what is played');
  await shot(page, '10-house');
  await clearStage(page, p => gradeIt(p, 'right'));
  await go(page, 'first');
  await shot(page, '11-door-open');
  await travel(page, 0, 'first', false);
  await page.waitForTimeout(400);
  await shot(page, '12-kitchen');
  await clearStage(page, p => gradeIt(p, 'semi'));
  await page.click('#board-go', { force: true });
  await page.waitForSelector('#done:not([hidden])', { timeout: 15000 });
  await page.click('#done-home');

  // Goals: ت with its first and last positions, on the street.
  await page.click('#goals-open');
  await page.locator('.goal').nth(1).locator('.switch-mini').click();
  await page.locator('.goal').nth(2).locator('.switch-mini').click();
  await page.locator('.goal').nth(2).locator('.goal-chip').nth(1).click();
  await page.click('#goals [data-close]');
  await page.click('#play');
  await started(page);
  assert.deepEqual(await run(page), { sound: 'ta', scenario: 'street', positions: ['first', 'last'] });
  await shot(page, '13-street');
  await clearStage(page, p => gradeIt(p, 'right'));
  await go(page, 'first');
  await shot(page, '14-bus-arrived');
  await travel(page, 0, 'first');
  await page.waitForTimeout(400);
  await shot(page, '15-school');
  await clearStage(page, p => gradeIt(p, 'right'));
  await page.click('#board-go', { force: true });
  await page.waitForSelector('#done:not([hidden])', { timeout: 15000 });

  await page.click('#done-home');

  // The later sounds start in their own scenarios with all thirty words in place.
  for (const [sound, scenario] of [['tha', 'islands'], ['jeem', 'house'], ['ha', 'street'], ['kha', 'islands'], ['dal', 'house'], ['dhal', 'street'], ['ra', 'islands'], ['zay', 'house'], ['seen', 'street'], ['sheen', 'islands'], ['sad', 'house'], ['dad', 'street'], ['tta', 'islands'], ['zha', 'house'], ['ain', 'street'], ['ghain', 'islands'], ['fa', 'house'], ['qaf', 'street'], ['kaf', 'islands'], ['lam', 'house'], ['mim', 'street'], ['nun', 'islands'], ['heh', 'house'], ['waw', 'street'], ['ya', 'islands']]) {
    await page.evaluate(id => { const p = ArticulationActive().progress; p.run = null; p.goals = { [id]: ['first', 'middle', 'last'] }; }, sound);
    await page.click('#play');
    await started(page);
    assert.deepEqual(await run(page), { sound, scenario, positions: ['first', 'middle', 'last'] });
    assert.equal(await page.evaluate(() => ArticulationGame.scene().items.length), 30);
    await shot(page, `16-${sound}`);
    await page.click('#leave'); await page.waitForSelector('#home:not([hidden])');
  }

  assert.deepEqual(requested, [], 'no recording is requested until one exists');
  assert.deepEqual(errors, []);
  await browser.close(); server.close();
  console.log(`PASS (${engine}): plan rules, six sounds, letter board, islands, house, street, goals, PDF report, therapist grades, item board, rides left to right.`);
})().catch(async error => {
  console.error(error);
  try { console.error(await global.testPage.evaluate(() => { const s = ArticulationGame.scene(), r = ArticulationActive().progress.run; return JSON.stringify({ run: r && { sound: r.sound, scenario: r.scenario, positions: r.positions, unlocked: r.unlocked }, busy: s?.busy, path: s?.path.length, zone: s?.currentZone(), items: s?.items.length, here: s?.heroIndex(), board: !document.getElementById('board').hidden, enc: !document.getElementById('encounter').hidden }); })); } catch {}
  console.error([...new Set(global.testErrors)].slice(0, 5));
  process.exit(1);
});
