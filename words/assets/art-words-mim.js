/* م: the three new drawings. The other words reuse drawings from earlier sounds; قلم is drawn with ق. */
(() => {
  const { INK, S, T, F, eye, cheeks, tube, dots, clump, line, head, face, words } = window.ArticulationKit;
  Object.assign(words, {
    mouth: `<path d="M36 200c-4-26 24-40 64-40s68 14 64 40z" ${F('blue')} ${S}/>${head(100, 92, 72, 'brown')}${eye(72, 76, 10)}${eye(128, 76, 10)}<circle cx="100" cy="124" r="33" fill="#fff3b0" opacity=".9" stroke="#f0b63b" stroke-width="6"/><path d="M76 112h48c2 22-10 36-24 36s-26-14-24-36z" fill="#a13f4c" ${S} stroke-width="4"/><path d="M78 112h44l-2 8H80z" fill="#fff"/><ellipse cx="100" cy="138" rx="12" ry="7" ${F('pinkin')}/>`,
    pyramid: `<circle cx="162" cy="38" r="20" ${F('gold')} ${S}/><path d="M0 186c50-16 150-16 200 0v14H0z" ${F('sandy')}/><path d="M124 180l34-58 36 58z" ${F('sandy')} ${S}/><path d="M158 122l36 58h-20z" fill="#c9a266"/><path d="M6 180L90 36l84 144z" ${F('sandy')} ${S}/><path d="M90 36l84 144h-44z" fill="#c9a266"/><path d="M6 180L90 36l84 144z" fill="none" ${S}/>${line('M64 82h52M42 118h96M24 150h132', '#b98b47', 4)}`,
    artist: `<path d="M22 200c-4-46 26-70 66-70s70 24 66 70z" ${F('blue')} ${S}/>${head(88, 84, 44, 'date')}${face(88, 84, 44)}<path d="M36 62c-4-34 44-54 86-38 20 8 26 26 18 40-30-12-72-14-104-2z" ${F('red')} ${S}/>${tube('M138 150l40-92', '#a86b3c', 5)}<path d="M176 60l12-22-2-26-20 16-2 24z" ${F('sky')} ${S} stroke-width="4"/><path d="M12 176c2-14 22-20 40-16 16 4 26 12 24 20-2 8-14 6-18 12H22c-6-4-10-10-10-16z" ${F('sandy')} ${S}/>${dots([[30, 174, 5], [46, 168, 5], [60, 178, 5]], '#ef5a6a')}`,
  });
})();
