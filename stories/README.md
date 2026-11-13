# القصص (stories)

A picture book for each of the 28 sounds, five pages each, in the same order and with the same sound ids as the other parts.

- **Book:** each page shows a picture composed from the words drawings (`../phrases/assets/pictures.js`) and one short fusha sentence. The sentence plays when its recording exists (`sounds/<n>.m4a`); the speaker repeats it. Tapping the picture makes it bounce. The child says each page after hearing it, then turns the page.
- **Order:** the five pictures come back shuffled; each tap puts one in the next numbered place (first on the right). With all five placed, the right ones stay and the others go back to the pile.
- **Tell:** the five pictures in order; the child tells the story alone.
- **Therapist switch (013):** each page is graded right, partial or wrong (1, 0.5, 0); while the child retells, two big buttons count each target sound said right or wrong, with an undo. Pages are stored as zone `pages`, the retelling as zone `retell` (one score per counted sound). The report (shared with phrases) shows both, and the plan moves a sound past stories at 80% in two sessions in a row for both.
- **Text and recordings:** the stories are in `assets/data.js` (change any sentence there). Record each page as `sounds/<n>.m4a` using the list in `sounds/README.txt`; after changing the text run `node phrases/scripts/recordings.cjs stories`.
