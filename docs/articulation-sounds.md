# نطقي: what the app does and how to extend it

Start here when coming back to this app. The code lives in `words/`.

## What this app is

نطقي is an offline Arabic articulation game for speech therapy, for children aged 3 to 6, on phones and iPads. It practises one consonant at a time at word level, in fusha, with the target sound in the first, middle or last position of the word. Later levels (syllables, sentences, stories) are planned but are not part of this app yet.

Each sound has 30 words, ten per position. All 28 sounds are finished, from أ to ي.

**A session.** The child walks a character around a world and collects the ten words of each stage. Hearing the word, saying it aloud and putting it in the backpack is the core loop. After ten words a board shows them to tap and hear, an icon starts the journey, and the child walks to the transport for the next stage. Each stage is one word position.

**Three worlds:** differently shaped islands (boat, balloon), a house with rooms (doors), and a street (bus, taxi). Each stage is one full cutaway picture; a short fade joins the trip from one stage to the next. A sound uses its own world the first time, then a random one, never the same twice in a row.

**Who controls what:**

- **Child:** plays. If nothing has been decided for them, Play shows a letter board with a picture for each sound.
- **Parent:** the goals icon is always on the home screen, so they can choose sounds and positions before Play.
- **Therapist:** the switch on the home screen (password 013) turns on grading and shows the report icon. Grades are only recorded while it is on.

**Accounts and data.** Each child has a local account with a boy or girl character. Everything stays on that device, with no server. The therapist's report leaves the device only when someone downloads its PDF.

**Recordings.** The therapist records every word. `sounds/README.txt` is the numbered list. Words with no recording stay silent.

## Where things are

| What | File |
|---|---|
| Sounds and words | `assets/data.js` |
| Word drawings, one file per sound | `assets/art-words-<id>.js` |
| Drawing kit | `assets/art-kit.js` |
| The look, stages, child, vehicles, spacing | `assets/art-cozy.js` |
| Furniture and street props | `assets/art-common.js`, `art-house.js`, `art-street.js` |
| What each stage holds | `assets/scenes.js` |
| The game itself | `assets/game.js` |
| What Play chooses, reached rule | `assets/plan.js` |
| Home, goals, board, grading | `assets/app.js` |
| Report and PDF | `assets/report.js` |

## Adding a sound

All 28 sounds were built the same way. If a sound is ever added or rebuilt, follow these steps so the style and behaviour stay the same.

1. **Choose 30 words and get the therapist's approval before drawing anything.** Ten each for first, middle and last position, in fusha. The word must contain the target sound in that position, ideally only there. Every word must be something a 3 to 6 year old can recognise from a picture.
2. **Add the sound to [`assets/data.js`](../words/assets/data.js).** Each word is `[recording number, word with tashkeel, drawing key]`. Recording numbers run in order through every word, 1 to 840: each sound in turn, then first, middle and last position. Every word has its own recording, even when the same word appears in another sound; only the drawing is shared.
3. **Give it a scenario in rotation.** See the table below. This is the sound's first-play scenario; later plays are random.
4. **Draw the words** in a new `assets/art-words-<id>.js`, copying the shape of `art-words-ba.js`, and add its `<script>` to `index.html` next to the other word files. Follow the art rules below.
5. **Check the drawings by eye:** `node scripts/art-sheet.cjs <id> /tmp/sheet.png`, then look at the sheet at full size. Fix anything clipped, muddy, or hard to name.
6. **Build:** `node scripts/build-pwa.cjs` inside `words/`. This also rewrites `sounds/README.txt`, the numbered list for recording.
7. **Check only what changed.** For a new sound, confirm it starts in its scenario with all 30 words in place. In `tests/browser.cjs`, raise the counts that assume the current number of sounds (`rules.empty`, `rules.allDone`, the `.letter-tile` count).

The full play-through, `node tests/browser.cjs`, takes many minutes. Run it only when asked. `APP_ENGINE=webkit` tests Safari's engine, and `SOUNDS_PLAYWRIGHT` points at a Playwright install if none is found.

Recordings are added later by the therapist: `<number>.m4a` in `sounds/`, then the build again. Keep M4A: it is small and plays in every browser the app supports. Until a word has a recording the game stays silent for it and hides its speaker button. Never ship computer voices.

## Scenario rotation

| Order | Scenario | Sounds so far | Travel between stages |
|---|---|---|---|
| 1 | `islands` | أ، ث، خ، ر، ش، ط، غ، ك، ن، ي | boat, then balloon |
| 2 | `house` | ب، ج، د، ز، ص، ظ، ف، ل، ه | locked door between rooms |
| 3 | `street` | ت، ح، ذ، س، ض، ع، ق، م، و | bus, then taxi |

The next sound takes `islands`, the one after `house`, and so on. Each scenario has three stages, one per word position, always left to right. Words fill the ten slots of a stage in list order, so no scenario needs changing for a new sound.

## Art rules

Everything is drawn in code with the kit in `assets/art-kit.js`. No image files, no emoji, no art copied from elsewhere.

The approved look is warm and flat: muted colours, thin brown outlines, cutaway rooms. `skin()` in `assets/art-cozy.js` applies it to every drawing automatically, so draw with the kit as usual. Take only the feeling from reference games, never their characters, rooms or objects.

- Draw in a 200 by 200 box. Keep everything inside it with a little margin.
- Dark blue outline from the kit: `S` for shapes, `T` for inner lines, `tube` for ropes, tails and tentacles.
- Colour with `F('name')`, which runs light to dark from top to bottom. Add a colour to `PALETTE` only if none fits.
- Add a white highlight with `gloss`. Living things get big shiny eyes from `eye` and soft `cheeks`.
- Picture the word itself, plainly. If the object needs a setting, like sky or desert, use `vignette` and add a telling outline to `shapes`, so the backpack silhouette is not just a circle.
- Check that the silhouette still reads, because the backpack shows every word as a shape.

## How the game must behave

These were decided by the therapist. Keep them for every sound.

- The child taps to walk, double taps to jump for high items, and taps a cover three times to search under it. Each stage has two empty covers as a challenge.
- With the therapist switch off, the child hears the word and taps the bag. With it on (password 013), right, semi or wrong replaces the bag button and puts the word in the bag, scored 1, 0.5 and 0.
- Ten words collected shows the board of those words: tap one to hear it, tap the icon beside it to go on. There is no percentage stop between stages. Then the transport appears and the child walks to it.
- The backpack opens from the game and shows every word as a grey shape that fills in when collected.
- The whole stage always fits the screen, below the top bar. On a phone held upright, a picture suggests turning it sideways; one tap dismisses it.

## What Play shows

1. An unfinished game resumes.
2. If the therapist set goals, those decide. A long goal is a sound, its short goals are word positions, and only those stages appear. Several sounds in the goals means the child picks from the letter board.
3. With no goals the report decides: the most recently practised sound, leaving out any position that reached 80% in two full sessions in a row.
4. With no report, or everything reached, the letter board appears.

The goals icon is always in the home header, so parents can choose what to train before Play. The report icon appears only while the therapist switch is on.

## Report

Bars show each sound and each word position, using the ten words of the latest session added up and averaged, with the status beside them. A line graph shows each position across sessions. The download icon in the report saves it all as an A4 PDF. Sounds appear in the report automatically.

## Adding a scenario

Draw its stages in `assets/art-cozy.js` and add them to `stageSVG` and `buildLayouts`, and list its slots, covers and decor in `assets/scenes.js`. A stage needs ten slots: two `high`, three `hidden`, five on the ground. Add any new way of travelling to `summonRide`, `leaveStage` and `arriveAt` in `assets/game.js`, keeping travel left to right.
