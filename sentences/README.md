# الجمل (sentences)

The fourth part of the app. It works exactly like العبارات (see `../phrases/README.md`): the same five stacking scenes with their endings, goals (the sound; the child always hears the sentence and says it after it), therapist grading with wrong pieces tumbling off and coming back, report and PDF. Only the content is longer: 280 sentences of four or five words, ten per sound, at least one per sound with the sound at the end of a word.

**Shared code.** This folder holds only what differs: `index.html` (names the part with `window.PartConfig = { id: 'sentences', name: 'الجمل' }`, which gives it its own saved records `articulation-sentences-children-v1`), `assets/data.js` (the sentences and how to draw each) and `sounds/`. The game, pictures, sound, plan, report and styles are loaded from `../phrases/assets/`; change them there and both parts follow.

**Pictures.** Composed by `../phrases/assets/pictures.js` from the words part's drawings. Sentences mostly use `act` (someone eats, holds, sees, plays with or rides something, maybe somewhere), `at` (someone in a place: sea, river, sky and night become the background, other places a faded backdrop) and `two` (two together). "I…" sentences show the child's own boy or girl.

**Recordings.** `sounds/README.txt` lists every sentence with its file name (`<number>.m4a`). After adding recordings or changing sentences, run `node ../phrases/scripts/recordings.cjs sentences` from the repository root (it marks the recorded ones).
