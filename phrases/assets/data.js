/* The phrases: ten short phrases (two or three words, fusha) for each of the 28 sounds, in the same order and with the same
   sound ids as the words part. Each phrase: [phrase with tashkeel, picture]. The recording number is worked out from the
   order: sound 1 has 1-10, sound 2 has 11-20, and so on (sounds/README.txt lists them).
   A picture says how to draw the phrase from the words part's drawings (see assets/pictures.js):
     ['one', obj, mood?]      the object alone; mood adds sleep, run, hot, cold, shine, happy or sing marks
     ['big', obj] / ['small', obj]   the object big beside a small child, or small beside a big child
     ['many', obj, n]         n of the object
     ['and', a, b]            a (right) and b (left), read right to left like the phrase
     ['on', a, b] / ['in', a, b]     a on top of b, a inside b
     ['sky', obj]             the object up in the sky
     ['kid', obj, action, who]   a child with the object: eat, hold or ride; who is 'me' (the child's own boy or girl), 'boy' or 'kidgirl'
   The goal is the sound: the child always hears the phrase and says it after it. */
window.ArticulationData = (() => {
  /* One level: the child always hears it and says it after it. The goal is the sound. */
  const positions = [{ id: 'say', name: 'العبارات', example: 'يسمع ثم يقول' }];
  const SOUNDS = [
    ['alef', 'أ', 'صوت الهمزة', 'rabbit', [
      ['أَرْنَبٌ صَغِيرٌ', ['small', 'rabbit']], ['أَسَدٌ كَبِيرٌ', ['big', 'lion']], ['أَكَلَ الْوَلَدُ الْأَنَانَاسَ', ['kid', 'pineapple', 'eat', 'boy']], ['فَأْرٌ نَائِمٌ', ['one', 'mouse', 'sleep']], ['شَرِبْتُ الْمَاءَ', ['kid', 'water', 'eat', 'me']],
      ['طَائِرَةٌ فِي السَّمَاءِ', ['sky', 'plane']], ['حِذَاءٌ جَدِيدٌ', ['one', 'shoe', 'shine']], ['الذِّئْبُ وَالْأَسَدُ', ['and', 'wolf', 'lion']], ['إِصْبَعٌ وَإِبْرَةٌ', ['and', 'finger', 'needle']], ['دَوَاءٌ فِي وِعَاءٍ', ['in', 'medicine', 'bowl']]]],
    ['ba', 'ب', 'صوت الباء', 'duck', [
      ['بَطَّةٌ صَغِيرَةٌ', ['small', 'duck']], ['بَيْتٌ كَبِيرٌ', ['big', 'house']], ['أَكَلْتُ الْخُبْزَ', ['kid', 'bread', 'eat', 'me']], ['كَلْبٌ نَائِمٌ', ['one', 'dog', 'sleep']], ['الْبَقَرَةُ وَالْحَلِيبُ', ['and', 'cow', 'milk']],
      ['كِتَابٌ عَلَى الْمَكْتَبِ', ['on', 'book', 'desk']], ['الدُّبُّ وَالْبَالُونُ', ['and', 'bear', 'toyballoon']], ['بُرْتُقَالَةٌ فِي الصَّحْنِ', ['on', 'citrus', 'plate']], ['بِنْتٌ وَقُبَّعَةٌ', ['and', 'kidgirl', 'hat']], ['ثَعْلَبٌ وَعِنَبٌ', ['and', 'fox', 'grapes']]]],
    ['ta', 'ت', 'صوت التاء', 'apple', [
      ['تُفَّاحَةٌ حَمْرَاءُ', ['one', 'apple']], ['تِمْسَاحٌ كَبِيرٌ', ['big', 'crocodile']], ['تَاجٌ لَامِعٌ', ['one', 'crown', 'shine']], ['أَكَلْتُ التَّمْرَ', ['kid', 'dates', 'eat', 'me']], ['هَاتِفٌ جَدِيدٌ', ['one', 'phone', 'shine']],
      ['مِفْتَاحُ الْبَيْتِ', ['and', 'key', 'house']], ['حُوتٌ فِي الْبَحْرِ', ['in', 'whale', 'sea']], ['بِنْتٌ وَكَتْكُوتٌ', ['and', 'kidgirl', 'chick']], ['زَيْتٌ وَزَيْتُونٌ', ['and', 'oil', 'olive']], ['فُسْتَانٌ جَمِيلٌ', ['one', 'dress', 'shine']]]],
    ['tha', 'ث', 'صوت الثاء', 'fox', [
      ['ثَعْلَبٌ صَغِيرٌ', ['small', 'fox']], ['ثَلْجٌ أَبْيَضُ', ['one', 'snowfall', 'cold']], ['ثَوْرٌ قَوِيٌّ', ['big', 'bull']], ['ثَلَاثُ تُفَّاحَاتٍ', ['many', 'apple', 3]], ['ثُعْبَانٌ طَوِيلٌ', ['one', 'snake']],
      ['مُثَلَّجَاتٌ بَارِدَةٌ', ['one', 'icecream', 'cold']], ['كُمَّثْرَى خَضْرَاءُ', ['one', 'pear']], ['ثِيَابٌ فِي الْخِزَانَةِ', ['in', 'clothes', 'closet']], ['لَيْثٌ نَائِمٌ', ['one', 'lion', 'sleep']], ['ثُومٌ وَكُرَّاثٌ', ['and', 'garlic', 'leek']]]],
    ['jeem', 'ج', 'صوت الجيم', 'camel', [
      ['جَمَلٌ كَبِيرٌ', ['big', 'camel']], ['جَزَرٌ لَذِيذٌ', ['one', 'carrots']], ['جَرَسُ الْمَدْرَسَةِ', ['and', 'bell', 'school']], ['دَجَاجَةٌ وَبَيْضَةٌ', ['and', 'chicken', 'egg']], ['شَجَرَةٌ عَالِيَةٌ', ['big', 'bigtree']],
      ['سَجَّادَةٌ جَمِيلَةٌ', ['one', 'carpet']], ['فِنْجَانُ قَهْوَةٍ', ['one', 'coffeecup', 'hot']], ['تَاجٌ وَبُرْجٌ', ['and', 'crown', 'tower']], ['مَوْجُ الْبَحْرِ', ['one', 'waves']], ['الْمُهَرِّجُ يَضْحَكُ', ['one', 'clown', 'happy']]]],
    ['ha', 'ح', 'صوت الحاء', 'horse', [
      ['حِصَانٌ سَرِيعٌ', ['one', 'horse', 'run']], ['حُوتٌ كَبِيرٌ', ['big', 'whale']], ['شَرِبْتُ الْحَلِيبَ', ['kid', 'milk', 'eat', 'me']], ['حِمَارٌ صَغِيرٌ', ['small', 'donkey']], ['نَحْلَةٌ وَزَهْرَةٌ', ['and', 'bee', 'flowerword']],
      ['لَحْمٌ فِي الصَّحْنِ', ['on', 'meat', 'plate']], ['سُلَحْفَاةٌ بَطِيئَةٌ', ['one', 'turtle']], ['تِمْسَاحٌ فِي الْبُحَيْرَةِ', ['in', 'crocodile', 'lake']], ['مِفْتَاحٌ وَمِصْبَاحٌ', ['and', 'key', 'lantern']], ['رِيحٌ قَوِيَّةٌ', ['one', 'wind', 'run']]]],
    ['kha', 'خ', 'صوت الخاء', 'lamb', [
      ['خَرُوفٌ صَغِيرٌ', ['small', 'lamb']], ['خُبْزٌ سَاخِنٌ', ['one', 'bread', 'hot']], ['خَيْمَةٌ كَبِيرَةٌ', ['big', 'tentword']], ['خَاتَمٌ ذَهَبِيٌّ', ['one', 'ring', 'shine']], ['أَكَلْتُ الْخِيَارَ', ['kid', 'cucumber', 'eat', 'me']],
      ['نَخْلَةٌ عَالِيَةٌ', ['big', 'palmtree']], ['بِطِّيخٌ أَحْمَرُ', ['one', 'watermelon']], ['صَارُوخٌ فِي السَّمَاءِ', ['sky', 'rocket']], ['خَوْخٌ لَذِيذٌ', ['one', 'peach']], ['الطَّبَّاخُ فِي الْمَطْبَخِ', ['in', 'chef', 'kitchen']]]],
    ['dal', 'د', 'صوت الدال', 'bear', [
      ['دُبٌّ كَبِيرٌ', ['big', 'bear']], ['دِيكٌ وَدَجَاجَةٌ', ['and', 'rooster', 'chicken']], ['دُمْيَةٌ جَمِيلَةٌ', ['one', 'doll', 'happy']], ['وَلَدٌ وَمَدْرَسَةٌ', ['and', 'boy', 'school']], ['وَرْدَةٌ حَمْرَاءُ', ['one', 'rose']],
      ['هَدِيَّةٌ جَمِيلَةٌ', ['one', 'gift', 'shine']], ['يَدٌ وَقَدَمٌ', ['and', 'hand', 'foot']], ['أَسَدٌ وَقِرْدٌ', ['and', 'lion', 'monkey']], ['ضِفْدَعٌ أَخْضَرُ', ['one', 'frog']], ['دَرَّاجَةُ الْوَلَدِ', ['kid', 'bicycle', 'ride', 'boy']]]],
    ['dhal', 'ذ', 'صوت الذال', 'wolf', [
      ['ذِئْبٌ جَائِعٌ', ['one', 'wolf']], ['ذَيْلٌ طَوِيلٌ', ['one', 'tail']], ['ذُبَابَةٌ صَغِيرَةٌ', ['small', 'fly']], ['ذُرَةٌ صَفْرَاءُ', ['one', 'corn']], ['أُذُنُ الْأَرْنَبِ', ['one', 'rabbit']],
      ['نَافِذَةٌ مَفْتُوحَةٌ', ['one', 'window']], ['قُنْفُذٌ صَغِيرٌ', ['small', 'hedgehog']], ['غِذَاءٌ لَذِيذٌ', ['one', 'food']], ['الْأُسْتَاذُ وَالتِّلْمِيذُ', ['and', 'teacher', 'pupil']], ['ذَهَبٌ فِي الصُّنْدُوقِ', ['in', 'gold', 'chest']]]],
    ['ra', 'ر', 'صوت الراء', 'pomegranate', [
      ['رُمَّانٌ أَحْمَرُ', ['one', 'pomegranate']], ['رَجُلٌ طَوِيلٌ', ['big', 'man']], ['رِيشَةٌ خَفِيفَةٌ', ['one', 'feather']], ['أَرْنَبٌ يَرْكُضُ', ['one', 'rabbit', 'run']], ['شَجَرَةٌ وَوَرْدَةٌ', ['and', 'bigtree', 'rose']],
      ['كُرَةٌ حَمْرَاءُ', ['one', 'ball']], ['قِطَارٌ سَرِيعٌ', ['one', 'train', 'run']], ['قَمَرٌ فِي السَّمَاءِ', ['sky', 'moon']], ['نَمِرٌ كَبِيرٌ', ['big', 'tiger']], ['عُصْفُورٌ عَلَى الشَّجَرَةِ', ['on', 'sparrow', 'bigtree']]]],
    ['zay', 'ز', 'صوت الزاي', 'giraffe', [
      ['زَرَافَةٌ طَوِيلَةٌ', ['big', 'giraffe']], ['زَهْرَةٌ جَمِيلَةٌ', ['one', 'flowerword', 'shine']], ['زُجَاجَةُ مَاءٍ', ['one', 'bottle']], ['مَوْزَةٌ صَفْرَاءُ', ['one', 'banana']], ['غَزَالٌ سَرِيعٌ', ['one', 'gazelle', 'run']],
      ['عَنْزَةٌ صَغِيرَةٌ', ['small', 'goat']], ['أَكَلَ الْوَلَدُ الْخُبْزَ', ['kid', 'bread', 'eat', 'boy']], ['أَرُزٌّ لَذِيذٌ', ['one', 'rice']], ['كَنْزٌ ثَمِينٌ', ['one', 'treasure', 'shine']], ['حَلَزُونٌ بَطِيءٌ', ['one', 'snail']]]],
    ['seen', 'س', 'صوت السين', 'fish', [
      ['سَمَكَةٌ صَغِيرَةٌ', ['small', 'fish']], ['سَيَّارَةٌ سَرِيعَةٌ', ['one', 'car', 'run']], ['سَاعَةٌ كَبِيرَةٌ', ['big', 'clock']], ['سَرِيرٌ مُرِيحٌ', ['one', 'bed', 'sleep']], ['سَفِينَةٌ فِي الْبَحْرِ', ['in', 'ship', 'sea']],
      ['شَمْسٌ سَاطِعَةٌ', ['sky', 'sun']], ['أَسَدٌ وَتِمْسَاحٌ', ['and', 'lion', 'crocodile']], ['عَسَلٌ لَذِيذٌ', ['one', 'honey']], ['فَانُوسٌ مُضِيءٌ', ['one', 'fanous', 'shine']], ['جَرَسٌ صَغِيرٌ', ['small', 'bell']]]],
    ['sheen', 'ش', 'صوت الشين', 'sun', [
      ['شَمْسٌ وَغَيْمَةٌ', ['and', 'sun', 'cloudword']], ['شَجَرَةٌ خَضْرَاءُ', ['one', 'bigtree']], ['شَمْعَةٌ مُضِيئَةٌ', ['one', 'candle', 'shine']], ['شَرِبْتُ الشَّايَ', ['kid', 'tea', 'eat', 'me']], ['شَاحِنَةٌ كَبِيرَةٌ', ['big', 'truck']],
      ['فَرَاشَةٌ مُلَوَّنَةٌ', ['one', 'butterflyword']], ['مُشْطٌ صَغِيرٌ', ['small', 'comb']], ['عُشٌّ عَلَى الشَّجَرَةِ', ['on', 'nest', 'bigtree']], ['كَبْشٌ كَبِيرٌ', ['big', 'ram']], ['قِرْشٌ فِي الْبَحْرِ', ['in', 'shark', 'sea']]]],
    ['sad', 'ص', 'صوت الصاد', 'soap', [
      ['صَابُونٌ وَمَاءٌ', ['and', 'soap', 'water']], ['صَحْنٌ نَظِيفٌ', ['one', 'plate', 'shine']], ['صَقْرٌ فِي السَّمَاءِ', ['sky', 'falcon']], ['صُنْدُوقٌ كَبِيرٌ', ['big', 'chest']], ['حِصَانٌ أَبْيَضُ', ['one', 'horse']],
      ['عُصْفُورٌ صَغِيرٌ', ['small', 'sparrow']], ['شَرِبْتُ الْعَصِيرَ', ['kid', 'juice', 'eat', 'me']], ['قَمِيصٌ جَدِيدٌ', ['one', 'shirt', 'shine']], ['مِقَصٌّ حَادٌّ', ['one', 'scissors']], ['عُصْفُورٌ فِي الْقَفَصِ', ['in', 'sparrow', 'cage']]]],
    ['dad', 'ض', 'صوت الضاد', 'frog', [
      ['ضِفْدَعٌ يَقْفِزُ', ['one', 'frog', 'run']], ['ضَوْءُ الْمِصْبَاحِ', ['one', 'bulb', 'shine']], ['بَيْضَةٌ بَيْضَاءُ', ['one', 'egg']], ['ضِمَادَةٌ عَلَى الْيَدِ', ['on', 'bandage', 'hand']], ['خُضَارٌ طَازَجَةٌ', ['one', 'vegetables']],
      ['مُمَرِّضَةٌ لَطِيفَةٌ', ['one', 'nurse', 'happy']], ['كَوْكَبُ الْأَرْضِ', ['sky', 'earth']], ['بَيْضٌ فِي السَّلَّةِ', ['in', 'eggs', 'basket']], ['حَوْضٌ نَظِيفٌ', ['one', 'sink', 'shine']], ['ضَيْفٌ سَعِيدٌ', ['one', 'guest', 'happy']]]],
    ['tta', 'ط', 'صوت الطاء', 'plane', [
      ['طَائِرَةٌ كَبِيرَةٌ', ['big', 'plane']], ['طَبْلٌ صَغِيرٌ', ['small', 'drum']], ['طِفْلٌ نَائِمٌ', ['one', 'baby', 'sleep']], ['قِطَّةٌ صَغِيرَةٌ', ['small', 'cat']], ['بَطَّةٌ فِي الْبِرْكَةِ', ['in', 'duck', 'pond']],
      ['قِطَارٌ طَوِيلٌ', ['big', 'train']], ['بِطْرِيقٌ فِي الثَّلْجِ', ['one', 'penguin', 'cold']], ['مُشْطٌ وَخَيْطٌ', ['and', 'comb', 'thread']], ['طَبِيبٌ لَطِيفٌ', ['one', 'doctor', 'happy']], ['شَرِيطٌ أَحْمَرُ', ['one', 'ribbon']]]],
    ['zha', 'ظ', 'صوت الظاء', 'envelope', [
      ['ظَرْفٌ أَبْيَضُ', ['one', 'envelope']], ['ظَبْيٌ صَغِيرٌ', ['small', 'gazelle']], ['نَظَّارَةٌ جَدِيدَةٌ', ['one', 'glasses', 'shine']], ['مِظَلَّةٌ وَمَطَرٌ', ['and', 'umbrella', 'rainfall']], ['عَظْمَةُ الْكَلْبِ', ['and', 'boneword', 'dog']],
      ['بَيْتٌ نَظِيفٌ', ['one', 'house', 'shine']], ['ظِلُّ الْوَلَدِ', ['one', 'shadow']], ['مِنْظَارٌ كَبِيرٌ', ['big', 'binoculars']], ['حَظِيرَةُ الْبَقَرِ', ['and', 'barn', 'cow']], ['حَظٌّ سَعِيدٌ', ['one', 'clover', 'happy']]]],
    ['ain', 'ع', 'صوت العين', 'grapes', [
      ['عِنَبٌ لَذِيذٌ', ['one', 'grapes']], ['عَنْكَبُوتٌ صَغِيرٌ', ['small', 'spider']], ['عُصْفُورٌ يُغَرِّدُ', ['one', 'sparrow', 'sing']], ['عَسَلُ النَّحْلِ', ['and', 'honey', 'bee']], ['عَلَمٌ يُرَفْرِفُ', ['one', 'flag', 'run']],
      ['كَعْكَةٌ لَذِيذَةٌ', ['one', 'cake']], ['لُعْبَةٌ جَدِيدَةٌ', ['one', 'toy', 'shine']], ['ضِفْدَعٌ وَضَبُعٌ', ['and', 'frog', 'hyena']], ['إِصْبَعُ الْيَدِ', ['one', 'finger']], ['قِنَاعٌ جَمِيلٌ', ['one', 'mask']]]],
    ['ghain', 'غ', 'صوت الغين', 'crow', [
      ['غَزَالٌ صَغِيرٌ', ['small', 'gazelle']], ['غُرَابٌ أَسْوَدُ', ['one', 'crow']], ['غَيْمَةٌ فِي السَّمَاءِ', ['sky', 'cloudword']], ['غَسَّالَةٌ كَبِيرَةٌ', ['big', 'washer']], ['غَابَةٌ خَضْرَاءُ', ['one', 'forest']],
      ['غُصْنُ الشَّجَرَةِ', ['one', 'branch']], ['رَغِيفُ خُبْزٍ', ['one', 'loaf']], ['بَبَّغَاءُ مُلَوَّنٌ', ['one', 'parrot', 'sing']], ['دِمَاغٌ ذَكِيٌّ', ['one', 'brain', 'shine']], ['صَمْغٌ لَاصِقٌ', ['one', 'glue']]]],
    ['fa', 'ف', 'صوت الفاء', 'elephant', [
      ['فِيلٌ كَبِيرٌ', ['big', 'elephant']], ['فَأْرٌ صَغِيرٌ', ['small', 'mouse']], ['فَرَاشَةٌ جَمِيلَةٌ', ['one', 'butterflyword', 'shine']], ['فُسْتَانٌ أَحْمَرُ', ['one', 'dress']], ['أَكَلْتُ التُّفَّاحَةَ', ['kid', 'apple', 'eat', 'me']],
      ['دُلْفِينٌ فِي الْبَحْرِ', ['in', 'dolphin', 'sea']], ['زَرَافَةٌ وَفِيلٌ', ['and', 'giraffe', 'elephant']], ['خَرُوفٌ أَبْيَضُ', ['one', 'lamb']], ['رَغِيفٌ سَاخِنٌ', ['one', 'loaf', 'hot']], ['سَيْفُ الْفَارِسِ', ['and', 'sword', 'knight']]]],
    ['qaf', 'ق', 'صوت القاف', 'monkey', [
      ['قِطَّةٌ وَفَأْرٌ', ['and', 'cat', 'mouse']], ['قِرْدٌ وَمَوْزَةٌ', ['and', 'monkey', 'banana']], ['قَلَمٌ أَزْرَقُ', ['one', 'pencil']], ['قَارِبٌ فِي الْبَحْرِ', ['in', 'boatword', 'sea']], ['بَقَرَةٌ كَبِيرَةٌ', ['big', 'cow']],
      ['حَقِيبَةُ الْمَدْرَسَةِ', ['and', 'satchel', 'school']], ['مِلْعَقَةٌ وَطَبَقٌ', ['and', 'spoon', 'dish']], ['صُنْدُوقٌ مُغْلَقٌ', ['one', 'chest']], ['وَرَقٌ أَبْيَضُ', ['one', 'paper']], ['بِطْرِيقٌ صَغِيرٌ', ['small', 'penguin']]]],
    ['kaf', 'ك', 'صوت الكاف', 'dog', [
      ['كَلْبٌ صَغِيرٌ', ['small', 'dog']], ['كِتَابٌ جَدِيدٌ', ['one', 'book', 'shine']], ['كُرَةٌ وَكُرْسِيٌّ', ['and', 'ball', 'armchair']], ['شَمْعَةٌ عَلَى الْكَعْكَةِ', ['on', 'candle', 'cake']], ['كُوبُ حَلِيبٍ', ['one', 'cup']],
      ['سَمَكَةٌ فِي الْبِرْكَةِ', ['in', 'fish', 'pond']], ['كَتْكُوتٌ أَصْفَرُ', ['one', 'chick']], ['دِيكٌ يَصِيحُ', ['one', 'rooster', 'sing']], ['الْمَلِكُ سَعِيدٌ', ['one', 'king', 'happy']], ['سَمَكٌ فِي الشَّبَكِ', ['in', 'fishes', 'net']]]],
    ['lam', 'ل', 'صوت اللام', 'lemon', [
      ['لَيْمُونٌ أَصْفَرُ', ['one', 'lemon']], ['لُعْبَةُ الطِّفْلِ', ['and', 'toy', 'baby']], ['لَيْلٌ هَادِئٌ', ['one', 'night', 'sleep']], ['كَلْبٌ وَقِطَّةٌ', ['and', 'dog', 'cat']], ['نَحْلَةٌ عَلَى الزَّهْرَةِ', ['on', 'bee', 'flowerword']],
      ['سُلَّمٌ طَوِيلٌ', ['big', 'ladder']], ['جَمَلٌ فِي الصَّحْرَاءِ', ['in', 'camel', 'desert']], ['فِيلٌ رَمَادِيٌّ', ['one', 'elephant']], ['طَبْلٌ وَجَرَسٌ', ['and', 'drum', 'bell']], ['هِلَالٌ فِي السَّمَاءِ', ['sky', 'crescent']]]],
    ['mim', 'م', 'صوت الميم', 'banana', [
      ['مَوْزَةٌ وَتُفَّاحَةٌ', ['and', 'banana', 'apple']], ['مِفْتَاحٌ صَغِيرٌ', ['small', 'key']], ['مِرْوَحَةٌ سَرِيعَةٌ', ['one', 'fan', 'run']], ['مِلْعَقَةٌ فِي الصَّحْنِ', ['on', 'spoon', 'plate']], ['شَمْعَةٌ وَنَجْمَةٌ', ['and', 'candle', 'starword']],
      ['حَمَامَةٌ تَطِيرُ', ['sky', 'dove']], ['قَلَمٌ وَدَفْتَرٌ', ['and', 'pencil', 'notebook']], ['قَدَمُ الطِّفْلِ', ['one', 'foot']], ['فَمٌ مَفْتُوحٌ', ['one', 'mouth']], ['هَرَمٌ كَبِيرٌ', ['big', 'pyramid']]]],
    ['nun', 'ن', 'صوت النون', 'starword', [
      ['نَجْمَةٌ لَامِعَةٌ', ['sky', 'starword']], ['نَارٌ حَارَّةٌ', ['one', 'fire', 'hot']], ['نَسْرٌ فِي السَّمَاءِ', ['sky', 'eagle']], ['نَخْلَةٌ وَتَمْرٌ', ['and', 'palmtree', 'dates']], ['عِنَبٌ وَتِينٌ', ['and', 'grapes', 'figs']],
      ['أَرْنَبٌ أَبْيَضُ', ['one', 'rabbit']], ['حَلَزُونٌ عَلَى الْوَرَقَةِ', ['on', 'snail', 'leafword']], ['أَسْنَانٌ بَيْضَاءُ', ['one', 'teeth', 'shine']], ['عَيْنٌ مَفْتُوحَةٌ', ['one', 'eyeword']], ['بَالُونٌ أَحْمَرُ', ['one', 'toyballoon']]]],
    ['heh', 'ه', 'صوت الهاء', 'phone', [
      ['هَاتِفٌ صَغِيرٌ', ['small', 'phone']], ['هَدِيَّةٌ كَبِيرَةٌ', ['big', 'gift']], ['هِرَّةٌ نَائِمَةٌ', ['one', 'cat', 'sleep']], ['هُدْهُدٌ جَمِيلٌ', ['one', 'hoopoe']], ['نَهْرٌ طَوِيلٌ', ['one', 'river']],
      ['قَهْوَةٌ سَاخِنَةٌ', ['one', 'coffee', 'hot']], ['فَهْدٌ سَرِيعٌ', ['one', 'cheetah', 'run']], ['وَجْهٌ ضَاحِكٌ', ['one', 'faceword', 'happy']], ['فَوَاكِهُ لَذِيذَةٌ', ['one', 'fruits']], ['مُنَبِّهٌ يَرِنُّ', ['one', 'clock', 'sing']]]],
    ['waw', 'و', 'صوت الواو', 'rose', [
      ['وَلَدٌ وَوَرْدَةٌ', ['kid', 'rose', 'hold', 'boy']], ['وِسَادَةٌ نَاعِمَةٌ', ['one', 'pillow', 'sleep']], ['وِشَاحٌ دَافِئٌ', ['one', 'scarf', 'cold']], ['وَرَقَةٌ خَضْرَاءُ', ['one', 'leafword']], ['بُومَةٌ عَلَى الشَّجَرَةِ', ['on', 'owl', 'bigtree']],
      ['ثَوْرٌ وَبَقَرَةٌ', ['and', 'bull', 'cow']], ['شَوْكَةٌ وَمِلْعَقَةٌ', ['and', 'fork', 'spoon']], ['دَلْوُ الْمَاءِ', ['one', 'pail']], ['جَرْوٌ صَغِيرٌ', ['small', 'puppy']], ['الْجَوُّ صَحْوٌ', ['sky', 'clearsky']]]],
    ['ya', 'ي', 'صوت الياء', 'hand', [
      ['يَدٌ نَظِيفَةٌ', ['one', 'hand', 'shine']], ['يَخْتٌ فِي الْبَحْرِ', ['in', 'yacht', 'sea']], ['يَقْطِينٌ كَبِيرٌ', ['big', 'pumpkin']], ['يَرَقَةٌ صَغِيرَةٌ', ['small', 'caterpillar']], ['يَمَامَةٌ تَطِيرُ', ['sky', 'dovebird']],
      ['بَيْتٌ جَمِيلٌ', ['one', 'house', 'happy']], ['دِيكٌ وَكَتْكُوتٌ', ['and', 'rooster', 'chick']], ['سَيَّارَةٌ زَرْقَاءُ', ['one', 'car']], ['كُرْسِيٌّ مُرِيحٌ', ['one', 'armchair']], ['جَدْيٌ صَغِيرٌ', ['small', 'kidgoat']]]],
  ];
  const sounds = SOUNDS.map(([id, letter, name, art, list], s) => {
    const phrases = list.map(([text, picture], i) => ({ n: s * 10 + i + 1, id: `${id}-${i + 1}`, text, picture, sound: id }));
    /* The plan reads words[level] to count a whole session of ten. */
    return { id, letter, name, art, phrases, words: Object.fromEntries(positions.map(position => [position.id, phrases])) };
  });
  return { positions, sounds, soundById: id => sounds.find(entry => entry.id === id), positionName: id => positions.find(entry => entry.id === id)?.name || id };
})();
