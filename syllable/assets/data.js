/* The syllables of every consonant, in the same numbering as model.mjs, the pictures in images/ and the recordings in sounds/.
   A "sound" is a consonant (the long goal); its "positions" are the syllable types CV, VC and VCV (the short goals). */
window.ArticulationData = (() => {
  const LETTERS = [...'ابتثجحخدذرزسشصضطظعغفقكلمنهوي'];
  const NAMES = { 2: 'الباء', 3: 'التاء', 4: 'الثاء', 5: 'الجيم', 6: 'الحاء', 7: 'الخاء', 8: 'الدال', 9: 'الذال', 10: 'الراء', 11: 'الزاي', 12: 'السين', 13: 'الشين', 14: 'الصاد', 15: 'الضاد', 16: 'الطاء', 17: 'الظاء', 18: 'العين', 19: 'الغين', 20: 'الفاء', 21: 'القاف', 22: 'الكاف', 23: 'اللام', 24: 'الميم', 25: 'النون', 26: 'الهاء' };
  /* The three vowels by letter id: ا with fatha, و with damma, ي with kasra. */
  const VOWELS = [{ id: 1, mark: 'َ', long: 'ا' }, { id: 27, mark: 'ُ', long: 'و' }, { id: 28, mark: 'ِ', long: 'ي' }];
  const positions = [
    { id: 'cv', name: 'صامت ثم حركة', example: 'بَا' },
    { id: 'vc', name: 'حركة ثم صامت', example: 'أَبْ' },
    { id: 'vcv', name: 'حركة وصامت وحركة', example: 'أَبَا' },
  ];
  const syllable = (letter, number, parts) => ({ id: `${letter}-${number}`, art: `${letter}-${number}`, letter, number, parts, audio: `sounds/${letter}/${number}.wav` });
  const sounds = Object.keys(NAMES).map(Number).map(letter => ({
    id: String(letter), letter: LETTERS[letter - 1], name: `صوت ${NAMES[letter]}`, picture: `images/${letter}.png`,
    words: {
      cv: VOWELS.map((v, i) => syllable(letter, i + 1, [letter, v.id])),
      vc: VOWELS.map((v, i) => syllable(letter, i + 4, [v.id, letter])),
      vcv: VOWELS.flatMap((a, i) => VOWELS.map((b, j) => syllable(letter, 7 + i * 3 + j, [a.id, letter, b.id]))),
    },
  }));
  /* Written form with tashkeel, for the goals, the report and the screen reader. */
  const ALEF = ['أَ', 'أُ', 'إِ'], vowelOf = id => VOWELS.findIndex(v => v.id === id);
  function label(item) {
    const c = LETTERS[item.letter - 1], [p, q, r] = item.parts;
    if (item.number <= 3) return c + VOWELS[vowelOf(q)].mark + VOWELS[vowelOf(q)].long;
    if (item.number <= 6) return ALEF[vowelOf(p)] + c + 'ْ';
    return ALEF[vowelOf(p)] + c + VOWELS[vowelOf(r)].mark + VOWELS[vowelOf(r)].long;
  }
  sounds.forEach(sound => Object.values(sound.words).flat().forEach(item => { item.word = label(item); }));
  /* Each station's train has three cars. CV and VC are one station each; VCV is three, one for each first vowel. */
  const stationsOf = (sound, types) => types.flatMap(type => type === 'vcv' ? [0, 1, 2].map(k => ({ type, items: sound.words.vcv.slice(k * 3, k * 3 + 3) })) : [{ type, items: sound.words[type] }]);
  return { positions, sounds, stationsOf, soundById: id => sounds.find(entry => entry.id === String(id)), positionName: id => positions.find(entry => entry.id === id).name };
})();
