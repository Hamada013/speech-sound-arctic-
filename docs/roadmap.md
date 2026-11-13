# Roadmap: one articulation app

Read this first when picking up work on the app as a whole. It holds the decisions already made and what is planned, so they need not be rediscovered. Update it when something is built or decided.

## What the app is

One Arabic articulation app for children (fusha), for speech therapy at home and in the clinic. The home page (`index.html`) is the app; each button on it is a **part** of the same app, not a separate app:

| Order | Part | Folder | State |
|---|---|---|---|
| 1 | المقاطع (syllables, the syllable train) | `syllable/` | built |
| 2 | الكلمات (words) | `words/` | built (its folder and manifest still call it نطقي) |
| 3 | العبارات (phrases) | `phrases/` | built: tower of phrase bricks, 280 phrases, no recordings yet (`phrases/sounds/README.txt`) |
| 4 | الجمل (sentences) | `sentences/` | built: same game and code as phrases (loaded from `../phrases/assets/`), 280 sentences of 4-5 words, no recordings yet (`sentences/sounds/README.txt`) |
| 5 | القصص (stories) | `stories/` | 28 stories drafted (`stories/assets/data.js`, review list `stories/sounds/README.txt`), waiting for the therapist's approval; book screen not built; shown as "قريبًا" |
| 6 | المناهج (approaches: minimal pairs, maximal and multiple oppositions, cycles) | `approaches/` | data drafted (`approaches/assets/data.js`, review list `approaches/review.txt`), waiting for the therapist's approval; game not built; no home button yet |

Older drafts of sentence and story pages exist in the `tools` repository on branch `articulation-wip` (`tools/articulation/sents/sentence.html`, `story/story.html`, `info/info.html`, `artic.html`). They are reference only, in the old style.

The repository must never link to or depend on the main speech website. Links only go one way, from there to here.

## Rules for every part

- **Graphs first, few words.** Every report and result screen shows the data as charts: a ring or pie for right, partial and wrong; bars per source, sound or level; a colour grid for sounds by level; lines for progress. Text is short labels; tables only as a collapsed detail. Source and level colours stay fixed wherever they appear.
- **One report per part, combining everything the child did in it** (games and tests together), as the syllable report does; the reports button (planned) then combines parts.

## Already decided and built

- **One account for the whole app.** `assets/children.js` holds the only list of children (`articulation-children-v1`: id, name, created, character boy/girl, active child). The home page header has the account button. Inside each part the account button opens the same list, so switching there switches everywhere. Opening the accounts window with a child active asks the parent sum first (`assets/parent-gate.js`).
- **Progress stays per part**, in that part's own store under the same child id: `articulation-words-children-v1`, `articulation-syllables-children-v1`. Each record holds `progress: { attempts, goals, played, run }`. An attempt is `{ date, run, sound, zone, scores: { item: 1 | 0.5 | 0 } }`.
- **Merging old data.** On every load, `children.js` brings in children that a part knows but the list does not. The same name means the same child: the part's record takes the shared id. Deleted ids (`deletedChildren`) are never brought back.
- **No admin account.** Anyone past the parent sum may delete a child. Deleting removes the child from the list and from every part's store.
- **Avatars** are simple outline kid faces drawn in `assets/accounts.js` (four boys, four girls, six soft colours), stored per child in `articulation-account-avatars-v1`. No emoji, no detailed portraits. The in-game walking character in الكلمات still uses the child's boy/girl choice.
- The words part works offline (PWA scoped to `words/`). The shared files in `assets/` are listed in its build (`words/scripts/build-pwa.cjs`, `shared`). Run the build after changing them.
- Each part keeps its own goals, therapist switch (password 013) and report.
- **The syllable report** (`syllable/assets/report.js`) combines the train game's grades with the listening and production tests from `classic.html` (stored in `articulation-syllable-results-v1`; each test now records `child`, older tests without it are left out). It shows: a ring of right, partial and wrong with the overall score; a bar per source (game purple `#6250d6`, production orange `#d9762b`, listening teal `#0f9fb5`, checked for colour-blind separation); a sounds by CV/VC/VCV grid, each cell the latest result of every source together; progress lines per source; then the game details per sound. The same layout goes into the PDF. Words should get the same treatment.
- **Syllable pictures** are drawn in code (`syllable/assets/pictures.js`, 28 drawings in the train's style, same cues as `images/*.png`); the train, letter board, goals, grading, practice, tests and animation library use them. The PNGs remain only as the reference.
- **The syllable train:** cars read right to left (first syllable next to the engine, consonant picture on the right of each car); an animal drives in the cab and animals ride on the roofs, all changing every station; tapping a rider opens the mouth animation in a window (front, side, both, or front with the camera).
- **Mouth animations** exist for every CV, VC and VCV syllable of the 25 consonants (`syllable/scripts/animate.cjs <letter> <1-15>`; it times the mouth to the recording, see the script's comments). ء, و and ي as consonants are not in the syllable data yet, though recordings exist in `sounds/1`, `27`, `28`.

## Planned, in rough order

1. **Side navigation bar.** A list bar on the side (on the right, RTL) to move between the parts and the home page from anywhere, in addition to the home buttons. It shows the active child at the top. On phones it collapses into a menu button. It should appear in every part, as one shared file in `assets/` (like `accounts.js`), listed in the words PWA build.
2. **Reports button** (home page and side bar): see each part's report on its own, or tick several parts and combine them into one report and one PDF. Each part already has `report.js` with `draw(host, child)` and `download(child)`. The combined report reads each part's `summaryOf(child)`: `{ part, name, sounds: [{ letter, levels: [{ name, percent, reached }] }] }` (phrases has it; add it to syllables and words). Join parts by the Arabic letter.
3. **Progress report**: a dated report across sessions, per sound and per part (line charts already exist per part), for parents and files.
4. **Intervention plan**: long goals (sounds) and short goals (levels: syllable type, word position, phrase, sentence, story) across all parts, with the 80% two-sessions rule as the criterion. It is generated from the goals and progress, editable, and printable as PDF.
5. **From the speech website's articulation test to a plan and daily practice (decided 2026-11-13).**
   - **Hand-over by link, one way.** The speech website's articulation test report gets this app's logo as a button. It opens this app with the results carried inside the link itself (e.g. `index.html#import=<base64url JSON>`): no server, nothing stored online. Only the website links here; this app never links back to it or loads its code. The app shows a short summary of the results, asks which child account they belong to (or makes a new one), and the therapist confirms.
   - **Format to agree with the website (draft v1):** `{ v: 1, date, child: { name, age }, sounds: [{ letter, initial, medial, final }] }`, where each position is `ok`, `omitted`, `distorted` or the letter the child said instead (e.g. `{ letter: 'ك', initial: 'ت', medial: 'ok', final: 'omitted' }`). The app works out the patterns itself (see approaches). Needed first: a sample report from the website.
   - **The intervention plan.** Each sound in error starts at the lowest level it has not reached: syllables, then words, then phrases, then sentences, then stories. It moves up after 80% in two sessions in a row. When two or more errors share a pattern (e.g. fronting), the approaches part adds contrast pairs or cycles for that pattern. The plan is shown graphs first and prints as PDF (item 4).
   - **Daily practice.** Each day's session takes about 15 minutes and is made of 2-3 short activities from the plan (e.g. 5 min syllables, 5 min words, 5 min contrast pairs). It has a gentle timer and stars, can be done up to twice a day, and a calendar shows the days done.
   - **Locks.** With a plan active, the child sees only today's tasks and the plan's parts; the other parts look locked. The therapist switch (013) opens everything and lets the therapist edit the plan: skip, hold or add targets.
6. Build الجمل and القصص as parts with the same pattern as العبارات: the sound as the goal, therapist switch, grading 1, 0.5 and 0, a graphs-first report with `summaryOf()`, the shared account, pictures composed from the words drawings.
   - **الجمل works exactly like العبارات** (same game, goals, short goals, grading, report and pictures), only the sentences are longer (more than three words). Built: `sentences/` shares the phrases code; only its page, data and recordings differ.
   - Phrases and sentences have no short goals: the child always hears the phrase and says it after it, so the goal is just the sound. A wrong grade makes the piece tumble off and the phrase come straight back; the report keeps the last try. Five stacking scenes with their own endings (see `phrases/README.md`).
   - Phrase list to review with the therapist: `phrases/sounds/README.txt` (marked phrases get corrected in `phrases/assets/data.js`).
   - **القصص (stories), decided 2026-11-13, not built yet:**
     - **Content:** one story per sound, five pages each (28 stories, 140 pages). Each page is one short, simple fusha sentence full of the target sound, in the same sound order and ids as the other parts. The 140 page sentences go in `stories/sounds/README.txt` for recording and therapist review, like phrases.
     - **Look: a picture book.** A big book opens. Each page is a full scene composed from the words drawings (`../phrases/assets/pictures.js`, the `act`, `at`, `two`… kinds), with the sentence under it. Pages turn with a page flip, and the story's characters bounce when tapped. Warm flat style.
     - **The child's task, part 1, repeat:** the child hears each page (the speaker repeats it) and says it after it, then turns the page.
     - **The child's task, part 2, retell:** the five pictures come back shuffled. The child puts them in order (tap or drag into five numbered slots), then tells the whole story alone from the pictures.
     - **Grading, therapist switch on (013):** right, partial or wrong for each repeated page (1, 0.5, 0), as in sentences. During the retelling, two big counter buttons count every target sound the child says right or wrong, with an undo. The report shows the page scores and the retelling percentage (right ÷ right + wrong).
     - **Goals and report:** the goal is the sound. Store the per-page grades as an attempt with zone `pages`, and the retelling count as zone `retell` with `{ right, wrong }`. The report is graphs first: a ring, a bar per sound for pages and one for retelling, progress lines, the PDF, and `summaryOf()` for the combined report.
     - **Build:** a new `stories/` part reusing the shared account, goals, therapist switch, report frame, pictures and sound player from `phrases/`, with its own book screen (`stories/assets/book.js`). Write the 28 stories first and give them to the therapist for approval before drawing the pages.
7. **المناهج (approaches, decided 2026-11-13, not built).** A home page button, after القصص, opening `approaches/`. It covers the phonological and contrast approaches the other parts do not: minimal pairs, maximal oppositions, multiple oppositions and cycles.
   - **Patterns (full Arabic set):** fronting (ك→ت, ق→ك), backing (ت→ك), stopping (س→ت, ش→ت, ز→د, ف→ب), de-emphasis (ص→س, ض→د, ط→ت, ظ→ذ), ر gliding (ر→ي, ر→ل), interdentals (ث→س, ذ→ز), pharyngeals (ع→ء, ح→ه), ش→س, ج→د and ج→ز, voicing (ز→س, د→ت), final consonant deletion, initial consonant deletion. Each pattern has its contrasts (target letter vs error letter).
   - **Data per contrast:** 5 minimal pairs (real, pictureable fusha words for 3-6 year olds, e.g. ك/ت). Per pattern: about 5 maximal opposition sets (the target against a sound that differs in many features) and about 5 multiple opposition sets of 3-4 words (one target against the 2-4 sounds a child collapses into one). Per pattern for cycles: the target sounds, a listening list of about 15 words (auditory bombardment) and 5 picture words to say. Pictures composed from the words drawings (new drawings where a word has none); a recording list like the other parts. **Write the word sets first and get the therapist's approval**, as for the stories.
   - **Minimal pairs game:** first listening (the app says one word of the pair, the child taps its picture), then saying (the child says a word; the therapist taps the picture that matches what the child really said; if it is the other one, the child sees the misunderstanding, e.g. says تلب and sees the wrong picture, and tries again). Maximal and multiple oppositions work the same way with more pictures.
   - **Cycles (Hodson), automatic:** the app rotates the child's error patterns, one target sound per pattern per week, 2-6 weeks a cycle, then repeats the cycle. Each session: the listening list at the start and at the end, the 5 picture words to say in between. The therapist can skip or hold a pattern.
   - **Data, drafted 2026-11-13:** `approaches/assets/data.js` holds a feature table of the 28 consonants (place, manner, voicing, emphasis), the 12 patterns with their contrasts, and 45 word families (real fusha words that differ in one consonant, same vowels). Minimal pairs, multiple oppositions (one error sound against several targets in one family) and maximal oppositions (sounds 3-4 features apart) are worked out from the families. Cycles take their listening list (15) and practice words (5) from the words part by target letter. `node approaches/scripts/review.cjs` writes `approaches/review.txt` for the therapist.
   - **Made-up words (the therapist's decision):** where a contrast has fewer than 5 clear real pairs (22 contrasts), made-up words fill it: a real picturable word with the child's sound in place of the target (كَلْب → «تَلْب»). Final and initial consonant deletion use the word without its last or first sound (بَطَّة → «أَطَّة»). They never repeat a real pair's word and are checked against a list of real words, but the therapist must confirm each one is not a real word. In the game a made-up word gets a funny "silly" picture.
   - **Patterns from the test:** with the hand-over in item 5, the app finds the patterns in the substitutions (e.g. ك→ت and ق→ك in the results means fronting) and adds them to the plan.
8. Later, maybe: one PWA for the whole app at the root instead of only `words/`; one therapist switch for all parts; one copy of `plan.js` and `report.js` (the two parts' copies differ only in comments and labels).

## Things to know before building the above

- **Sound ids differ between parts.** الكلمات uses names (`alef, ba, ta, … ya`, 28 sounds). المقاطع uses numbers `2 … 26` (25 consonants: 2=ب 3=ت 4=ث 5=ج 6=ح 7=خ 8=د 9=ذ 10=ر 11=ز 12=س 13=ش 14=ص 15=ض 16=ط 17=ظ 18=ع 19=غ 20=ف 21=ق 22=ك 23=ل 24=م 25=ن 26=ه; no أ, و, ي). Combined reports, the intervention plan and the test import all need one map from letter to each part's id. Key everything shared by the Arabic letter.
- **Levels per part:** syllables `cv, vc, vcv`; words `first, middle, last`. Each part's `data.js` has `positions`.
- **Every part's top bar has a home icon** (`a.icon.home-link` to `../index.html`), after the account button. New parts get it too.
- Keep the look: white home pages and windows; warm flat game style inside the games; rounded white dropdowns with a chevron and a soft green selected row with a check.
- After a change, check only what changed. Commit or push only when asked.
