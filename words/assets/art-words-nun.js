/* ن: the one new drawing. The other words reuse drawings from earlier sounds. */
(() => {
  const { S, F, tube, words } = window.ArticulationKit;
  Object.assign(words, {
    fire: `<path d="M100 6c34 36 62 62 62 104 0 44-28 66-62 66s-62-22-62-66c0-26 16-44 30-58 2 18 8 26 18 30 2-30 0-54 14-76z" ${F('flame')} stroke="#d9481f" stroke-width="5" stroke-linejoin="round"/><path d="M100 78c16 18 30 32 30 54 0 22-14 36-30 36s-30-14-30-36c0-20 16-34 30-54z" ${F('gold')}/><path d="M100 118c8 10 14 16 14 26 0 10-6 18-14 18s-14-8-14-18c0-10 6-16 14-26z" fill="#fff4c4"/>${tube('M22 186l156-22', '#a86b3c', 15)}${tube('M22 164l156 22', '#8a5a30', 15)}`,
  });
})();
