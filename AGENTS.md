# Speech sound articulation apps

This repository holds the articulation apps by Ahmad Ghanem. It must never link to or depend on the main speech website; the tools site links here, and links only go one way.

- The home page `index.html` is one app; its buttons are its parts. [docs/roadmap.md](docs/roadmap.md) holds the decisions and the plan (side bar, combined reports, intervention plan, sounds from a test report, phrases, sentences, stories). Read it before working on the app as a whole and keep it up to date.
- `assets/`: what every part shares: the one account list (`children.js`), the accounts window and kid faces (`accounts.js`), and the parent check.
- The intervention plan: `assets/therapy.js` (plan from the test, levels, daily sessions, locks), `assets/today.js` and `today.css` (today's activity inside a part), and the plan page `plan/`. See item 5 of the roadmap. Every part loads them and calls `ArticulationToday.offer` and `.done`; a new part must too.
- The reports page `reports/` combines every part's results through `assets/results.js`, which reads each part's store; a new part needs its store key and ids in `assets/therapy.js` (`PARTS`) and its levels in `results.js`.
- `words/` (نطقي): the word game. [docs/articulation-sounds.md](docs/articulation-sounds.md) explains what it does. Read it before changing the app, and follow it when adding a sound or scenario.
- `test/` (اختبار النطق): the articulation screening test, moved here from the speech website with its history. See `test/README.md`; run its tests from `test/`.
- `approaches/` (المناهج): minimal pairs, oppositions and cycles for error patterns. See `approaches/README.md`.
- `sentences/` (الجمل): the same tower with longer sentences; it loads the phrases part's code. See `sentences/README.md`.
- `phrases/` (العبارات): the tower of phrase bricks. See `phrases/README.md`; its pictures are composed from the words part's drawings.
- `syllable/`: the syllable train, the earlier practice and test screens (`classic.html`, `matching.html`) and the mouth animation library. See `syllable/README.md`.

After a change, check only what changed; run the full play-through only when asked. Commit or push only when asked.

**Graphs are essential everywhere** (syllables, words, every later part, every report): show results as charts (rings or pies, bars, grids, progress lines) with few words, not as text or tables. Tables only as a collapsed detail.

Keep each app's look: white home pages, and the warm flat game style (muted colours, thin brown outlines) inside the games. Dropdowns and option menus use rounded white triggers, a clear chevron and a soft green selected row with a check.
