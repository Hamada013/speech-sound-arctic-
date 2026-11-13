/* The 28 syllable pictures, drawn in code in the train's warm flat style: thin brown outlines, muted colours, little faces.
   Each one shows the same cue as images/<id>.png (the plane for ا, the balloon for ب, …) and is drawn in a 100 by 100 box,
   so it fits a car window, the station sign and the letter board alike. The PNGs stay for the older practice screens. */
const INK = '#5a3d2b';
const P = { cream: '#fffaf0', red: '#d9655a', redD: '#b5633f', mus: '#e0b25c', musD: '#c9984a', sky: '#cfeaf2', blue: '#92c5e8', blueD: '#6fa9d0', teal: '#6ba39b', green: '#9fc378', greenD: '#86ad62', wood: '#d0a06e', woodD: '#a9784a', skin: '#f6d2b4', hair: '#8a5a3a', pink: '#ef9a8a', grey: '#55585e', stone: '#c9c0b0', dark: '#3f4650' };
const L = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
const T = (w = 2, color = INK) => `fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;
const eye = (x, y, r = 2.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${INK}"/><circle cx="${x + r * .4}" cy="${y - r * .4}" r="${r * .38}" fill="#fff"/>`;
const eyes = (x, y, gap, r) => eye(x - gap, y, r) + eye(x + gap, y, r);
const smile = (x, y, w = 5) => `<path d="M${x - w} ${y}q${w} ${w * .8} ${w * 2} 0" ${T(2)}/>`;
const cheeks = (x, y, gap, r = 3.2) => `<circle cx="${x - gap}" cy="${y}" r="${r}" fill="${P.pink}" opacity=".55"/><circle cx="${x + gap}" cy="${y}" r="${r}" fill="${P.pink}" opacity=".55"/>`;
const face = (x, y, gap = 6, r = 2.6) => eyes(x, y, gap, r) + smile(x, y + 6, gap * .7) + cheeks(x, y + 5, gap + 4);
const shine = d => `<path d="${d}" ${T(3.5, '#fff')} opacity=".6"/>`;
const tube = (d, color, w) => `<path d="${d}" ${T(w + 5)}/><path d="${d}" ${T(w, color)}/>`;
const wheel = (x, y, r, color = P.grey) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" ${L}/><circle cx="${x}" cy="${y}" r="${r * .4}" fill="${P.stone}" stroke="${INK}" stroke-width="2"/>`;
const puff = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${P.cream}" ${L}/>`;
const drop = (x, y) => `<path d="M${x} ${y}q-4 6 0 8.5q4-2.5 0-8.5Z" fill="${P.blueD}" stroke="${INK}" stroke-width="1.6"/>`;
const kidHead = (x, y, r, hairColor = P.hair) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${P.skin}" ${L}/><path d="M${x - r} ${y - 1}C${x - r - 1} ${y - r * 1.15} ${x + r + 1} ${y - r * 1.15} ${x + r} ${y - 1}C${x + r * .5} ${y - r * .45} ${x - r * .1} ${y - r * .55} ${x - r * .35} ${y - r * .75}C${x - r * .5} ${y - r * .4} ${x - r * .8} ${y - r * .2} ${x - r} ${y - 1}Z" fill="${hairColor}" ${L}/>`;

const DRAW = {
  /* ا: the plane goes aaa */
  1: `<path d="M84 46 92 30h5l-3 18Z" fill="${P.red}" ${L}/>
    <path d="M12 54c0-8 8-12 18-12h50c8 0 14 4 14 10s-6 10-14 10H28c-10 0-16-3-16-8Z" fill="${P.cream}" ${L}/>
    <path d="M12 54c0-6 4-10 10-11.5V62c-6-1.5-10-4-10-8Z" fill="${P.red}" ${L}/><path d="M24 56h66" ${T(3, P.red)}/>
    <ellipse cx="9" cy="54" rx="2.5" ry="13" fill="${P.stone}" ${L}/>
    <path d="M42 56h20l-10 20h-9Z" fill="${P.red}" ${L}/>
    <path d="M23 49q3-6 9-6v6Z" fill="${P.sky}" ${L}/>${[40, 50, 60, 70].map(x => `<circle cx="${x}" cy="49" r="3" fill="${P.sky}" stroke="${INK}" stroke-width="1.8"/>`).join('')}
    <path d="M70 72h18M76 80h14" ${T(2)} opacity=".45"/>`,
  /* ب: the balloon */
  2: `<path d="M50 76c-6 8 6 12-2 21" ${T(2)}/><path d="M46 71h8l-4 6Z" fill="${P.blue}" ${L}/>
    <ellipse cx="50" cy="40" rx="25" ry="30" fill="${P.blue}" ${L}/>${shine('M35 27q4-10 12-12')}${face(50, 42, 7, 2.8)}`,
  /* ت: the clock ticks */
  3: `<path d="M17 34c-5-12 6-22 19-16Z" fill="${P.red}" ${L}/><path d="M83 34c5-12-6-22-19-16Z" fill="${P.red}" ${L}/>
    <path d="M50 22v-8" ${T(3)}/><circle cx="50" cy="12" r="3.5" fill="${P.mus}" ${L}/><path d="M30 82 23 93M70 82l7 11" ${T(4)}/>
    <circle cx="50" cy="55" r="32" fill="${P.red}" ${L}/><circle cx="50" cy="55" r="24" fill="${P.cream}" ${L}/>
    <path d="M50 33v4M50 73v4M28 55h4M68 55h4" ${T(2.4)}/><path d="M50 54V40M50 54l9-6" ${T(2.6)}/><circle cx="50" cy="54" r="2.4" fill="${INK}"/>
    ${eyes(50, 62, 7, 2.2)}${smile(50, 67, 3.5)}${cheeks(50, 65, 13, 2.6)}`,
  /* ث: the snake sticks its tongue out */
  4: `<ellipse cx="50" cy="82" rx="36" ry="11" fill="${P.green}" ${L}/><ellipse cx="50" cy="71" rx="28" ry="9" fill="${P.green}" ${L}/>
    <path d="M24 82q26 6 52 0M30 71q20 5 40 0" ${T(1.8, P.greenD)}/>
    <path d="M36 68c-3-12 2-19 9-22l12 4c-7 4-9 10-8 18Z" fill="${P.green}" ${L}/>
    <ellipse cx="54" cy="40" rx="18" ry="14" fill="${P.green}" ${L}/>${eyes(54, 36, 6.5, 2.8)}
    <path d="M54 50v7m0 0-3 4m3-4 3 4" ${T(2.2, P.redD)}/><path d="M47 48q7 3 14 0" ${T(2)}/>${cheeks(54, 44, 12, 2.6)}`,
  /* ج: the washing machine spins */
  5: `<rect x="18" y="12" width="64" height="78" rx="10" fill="${P.sky}" ${L}/><path d="M18 30h64" ${T(2.4)}/>
    <circle cx="28" cy="21" r="3.5" fill="${P.mus}" ${L}/><circle cx="38" cy="21" r="3.5" fill="${P.pink}" ${L}/><rect x="56" y="17" width="18" height="8" rx="2" fill="${P.cream}" stroke="${INK}" stroke-width="2"/>
    <circle cx="50" cy="60" r="23" fill="${P.cream}" ${L}/><circle cx="50" cy="60" r="16" fill="#d6ecf6" stroke="${INK}" stroke-width="2"/>
    <path d="M34.5 63q7.5-5 15.5 0t15.5 0a16 16 0 0 1-31 0Z" fill="${P.blue}"/><circle cx="56" cy="56" r="2" fill="#fff"/><circle cx="43" cy="69" r="1.6" fill="#fff"/>
    ${eyes(50, 56, 6, 2.2)}${smile(50, 61, 3)}<path d="M24 90v4M76 90v4" ${T(4)}/><path d="M10 50q-4 6 0 12M90 50q4 6 0 12" ${T(2)} opacity=".45"/>`,
  /* ح: the hot cup steams */
  6: `<path d="M36 40c-6-8 6-12 0-22M50 40c-6-8 6-12 0-24M64 40c-6-8 6-12 0-22" ${T(2.4)} opacity=".55"/>
    <ellipse cx="50" cy="86" rx="36" ry="7" fill="#e7c39a" ${L}/>
    <path d="M73 56c14-3 14 21-3 19" ${T(7)}/><path d="M73 56c14-3 14 21-3 19" ${T(2.5, P.sky)}/>
    <path d="M24 48h50v18c0 13-10 20-25 20s-25-7-25-20Z" fill="${P.sky}" ${L}/><ellipse cx="49" cy="48" rx="25" ry="5" fill="${P.woodD}" ${L}/>
    ${[[34, 62], [48, 72], [62, 62], [40, 78], [58, 79]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${P.green}"/>`).join('')}`,
  /* خ: the cat's paw scratches */
  7: `<path d="M24 98c-2-22 6-38 20-46l20 14c-8 10-14 20-16 32Z" fill="${P.mus}" ${L}/><path d="M30 80l10-4M32 90l10-4M36 66l8-6" ${T(2.4, P.musD)}/>
    <circle cx="58" cy="48" r="20" fill="#fbe3c0" ${L}/>
    ${[[42, 32], [52, 25], [64, 25], [74, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="#fbe3c0" ${L}/><ellipse cx="${x}" cy="${y + 1}" rx="3.6" ry="3" fill="${P.pink}"/>`).join('')}
    <path d="M51 52c0-6 5-8 9-6 4-2 9 0 9 6s-7 9-9 9-9-3-9-9Z" fill="${P.pink}"/>
    <path d="M82 58l10-13M85 68l10-13M88 78l8-11" ${T(3, P.redD)}/>`,
  /* د: the drum */
  8: `<path d="M26 10l28 32M80 12 52 42" ${T(4.5)}/><path d="M26 10l28 32M80 12 52 42" ${T(2, P.wood)}/><circle cx="25" cy="9" r="4.5" fill="${P.cream}" ${L}/><circle cx="81" cy="11" r="4.5" fill="${P.cream}" ${L}/>
    <path d="M16 46v32c0 6 15 11 34 11s34-5 34-11V46Z" fill="${P.red}" ${L}/>
    <path d="M17 50l11 30 11-30 11 30 11-30 11 30 11-30" ${T(2.4, P.cream)}/><path d="M16 78c0 6 15 11 34 11s34-5 34-11" ${T(5, P.mus)}/><path d="M16 78c0 6 15 11 34 11s34-5 34-11" ${T(2.4)}/>
    <ellipse cx="50" cy="46" rx="34" ry="10" fill="${P.cream}" ${L}/>`,
  /* ذ: the fly buzzes */
  9: `<path d="M12 78c8 14 26 12 22 0s-18-6-8 4" ${T(2)} stroke-dasharray="3 5" opacity=".6"/>
    <ellipse cx="56" cy="34" rx="12" ry="8" fill="#e6f4fa" ${L} opacity=".95" transform="rotate(-30 56 34)"/><ellipse cx="70" cy="36" rx="12" ry="8" fill="#e6f4fa" ${L} opacity=".95" transform="rotate(25 70 36)"/>
    <path d="M52 62l-6 12M60 64l-2 13M68 62l4 12" ${T(2.4)}/><ellipse cx="62" cy="54" rx="17" ry="12" fill="#6d7680" ${L}/><path d="M56 44v20M66 44v20" ${T(2, '#59616a')}/>
    <circle cx="40" cy="54" r="11" fill="#6d7680" ${L}/><circle cx="35" cy="50" r="5" fill="${P.redD}" stroke="${INK}" stroke-width="1.8"/><circle cx="45" cy="50" r="5" fill="${P.redD}" stroke="${INK}" stroke-width="1.8"/><circle cx="34" cy="49" r="1.5" fill="#fff"/><circle cx="44" cy="49" r="1.5" fill="#fff"/>
    ${smile(40, 58, 3)}<path d="M78 16h8l-8 7h8M86 30h6l-6 5h6" ${T(2)} opacity=".6"/>`,
  /* ر: the truck rumbles */
  10: `${puff(10, 34, 6)}${puff(16, 24, 5)}${puff(24, 18, 4)}
    <rect x="12" y="36" width="48" height="34" rx="4" fill="${P.mus}" ${L}/><path d="M24 36v34M36 36v34M48 36v34" ${T(2, P.musD)}/>
    <path d="M60 44h17l11 14v12H60Z" fill="${P.red}" ${L}/><path d="M64 48h11l7 10H64Z" fill="${P.sky}" stroke="${INK}" stroke-width="2"/>
    <rect x="9" y="69" width="82" height="7" rx="3" fill="${INK}"/><circle cx="88" cy="64" r="3" fill="#fff3b0" stroke="${INK}" stroke-width="1.8"/>
    ${wheel(28, 80, 10)}${wheel(72, 80, 10)}<path d="M2 50h6M0 60h8" ${T(2)} opacity=".45"/>`,
  /* ز: the bee */
  11: `<ellipse cx="54" cy="32" rx="10" ry="14" fill="#e6f4fa" ${L} opacity=".95" transform="rotate(-20 54 32)"/><ellipse cx="68" cy="31" rx="10" ry="14" fill="#e6f4fa" ${L} opacity=".95" transform="rotate(20 68 31)"/>
    <path d="M86 56 96 60l-10 4Z" fill="${INK}"/><ellipse cx="62" cy="58" rx="26" ry="19" fill="#f0c24a" ${L}/><path d="M56 40q-5 18 0 36M70 41q5 17 0 34" ${T(6)}/>
    <path d="M20 46q-4-10-10-10M30 44q2-10 9-12" ${T(2.2)}/><circle cx="10" cy="36" r="3" fill="${INK}"/><circle cx="39" cy="32" r="3" fill="${INK}"/>
    <circle cx="26" cy="58" r="15" fill="#f0c24a" ${L}/>${face(26, 56, 5.5, 2.4)}`,
  /* س: the snake hisses */
  12: `${tube('M20 88c40 8 66-6 42-20s-24-28-8-36', P.greenD, 12)}<path d="M24 88c36 6 58-6 38-18" ${T(1.8, P.green)}/>
    <ellipse cx="56" cy="26" rx="15" ry="12" fill="${P.green}" ${L}/>${eyes(56, 22, 6, 2.6)}<path d="M50 32q6 3 12 0" ${T(2)}/>
    <path d="M70 29h9l3-3m-3 3 3 3" ${T(2.2, P.redD)}/><path d="M86 14q4 4 0 8M91 10q6 8 0 16" ${T(2)} opacity=".5"/>`,
  /* ش: shhh */
  13: `<path d="M18 98c0-16 14-22 32-22s32 6 32 22Z" fill="#d9c4a0" ${L}/>
    <circle cx="50" cy="48" r="28" fill="${P.skin}" ${L}/><path d="M22 46c-2-22 12-32 28-32s30 10 28 32c-4-8-10-13-18-14-6 4-14 5-20 2-8 2-14 6-18 12Z" fill="#e3bd6a" ${L}/>
    <path d="M35 52q5 4 10 0M55 52q5 4 10 0" ${T(2.4)}/>${cheeks(50, 60, 19, 3.4)}<ellipse cx="50" cy="68" rx="7" ry="3.6" fill="${P.redD}"/>
    <rect x="46.5" y="57" width="7" height="24" rx="3.5" fill="${P.skin}" ${L}/><ellipse cx="50" cy="86" rx="11" ry="8" fill="${P.skin}" ${L}/><path d="M44 84h12" ${T(1.6)}/>
    <path d="M78 62q4 2 7 0M80 70q4 2 7 0" ${T(2)} opacity=".5"/>`,
  /* ص: the hen and her chicks peep */
  14: `<path d="M28 52 12 40l5 15-8 2 18 8Z" fill="${P.woodD}" ${L}/><ellipse cx="48" cy="58" rx="26" ry="20" fill="#c98a5a" ${L}/><path d="M36 56c10-6 22-2 26 8-10 6-20 4-26-8Z" fill="${P.woodD}" ${L}/>
    <path d="M64 25q2-7 5-3 3-6 6 0 4-3 4 4Z" fill="${P.red}" ${L}/><circle cx="70" cy="37" r="12" fill="#c98a5a" ${L}/><path d="M81 35l8 3-8 3Z" fill="${P.mus}" ${L}/><ellipse cx="80" cy="45" rx="2.5" ry="4" fill="${P.red}"/>${eye(72, 34, 2.4)}
    ${[[22, 84, 9], [42, 88, 8]].map(([x, y, r]) => `<path d="M${x - 3} ${y + r}v4M${x + 3} ${y + r}v4" ${T(2, P.musD)}/><circle cx="${x}" cy="${y}" r="${r}" fill="#f6d36a" ${L}/>${eye(x - 2, y - 2, 1.8)}<path d="M${x + r - 2} ${y}l5 2-5 2Z" fill="${P.redD}"/>`).join('')}
    <path d="M10 70q-3-3 0-6M60 86q4-2 8 0" ${T(1.8)} opacity=".5"/>`,
  /* ض: the frog */
  15: `<ellipse cx="18" cy="78" rx="10" ry="8" fill="${P.green}" ${L}/><ellipse cx="82" cy="78" rx="10" ry="8" fill="${P.green}" ${L}/>
    <ellipse cx="50" cy="68" rx="32" ry="22" fill="${P.green}" ${L}/><ellipse cx="50" cy="74" rx="18" ry="13" fill="#e6efc8"/>
    <ellipse cx="50" cy="52" rx="30" ry="16" fill="${P.green}" ${L}/><circle cx="33" cy="38" r="11" fill="${P.green}" ${L}/><circle cx="67" cy="38" r="11" fill="${P.green}" ${L}/>
    <circle cx="33" cy="38" r="6.5" fill="#fff" stroke="${INK}" stroke-width="1.8"/><circle cx="67" cy="38" r="6.5" fill="#fff" stroke="${INK}" stroke-width="1.8"/>${eye(34, 39, 3)}${eye(66, 39, 3)}
    <path d="M32 56q18 12 36 0" ${T(2.4)}/>${cheeks(50, 58, 24, 4)}
    <ellipse cx="36" cy="90" rx="9" ry="4" fill="${P.green}" ${L}/><ellipse cx="64" cy="90" rx="9" ry="4" fill="${P.green}" ${L}/>`,
  /* ط: the robot */
  16: `<path d="M50 16V8" ${T(2.6)}/><circle cx="50" cy="7" r="4" fill="${P.red}" ${L}/>
    <rect x="30" y="16" width="40" height="30" rx="8" fill="#92abbf" ${L}/><circle cx="28" cy="31" r="4" fill="#7b95aa" ${L}/><circle cx="72" cy="31" r="4" fill="#7b95aa" ${L}/>
    <circle cx="41" cy="29" r="5.5" fill="${P.cream}" stroke="${INK}" stroke-width="2"/><circle cx="59" cy="29" r="5.5" fill="${P.cream}" stroke="${INK}" stroke-width="2"/>${eye(41, 29, 2.4)}${eye(59, 29, 2.4)}
    <rect x="42" y="37" width="16" height="5" rx="2" fill="${P.cream}" stroke="${INK}" stroke-width="1.8"/>
    ${tube('M26 58 14 72', '#92abbf', 6)}${tube('M74 58l12-12', '#92abbf', 6)}<rect x="80" y="30" width="16" height="10" rx="3" fill="${P.mus}" ${L}/><path d="M96 35h3" ${T(2.4, P.red)}/>
    <rect x="34" y="82" width="11" height="12" rx="3" fill="#7b95aa" ${L}/><rect x="55" y="82" width="11" height="12" rx="3" fill="#7b95aa" ${L}/>
    <rect x="26" y="49" width="48" height="35" rx="8" fill="#92abbf" ${L}/><rect x="36" y="57" width="28" height="17" rx="3" fill="${P.cream}" stroke="${INK}" stroke-width="2"/>
    <circle cx="43" cy="65.5" r="2.6" fill="${P.red}"/><circle cx="50" cy="65.5" r="2.6" fill="${P.mus}"/><circle cx="57" cy="65.5" r="2.6" fill="${P.green}"/>`,
  /* ظ: the turtle */
  17: `<path d="M86 70l10 4-10 3Z" fill="#b9cf8f" ${L}/><ellipse cx="28" cy="82" rx="8" ry="7" fill="#b9cf8f" ${L}/><ellipse cx="72" cy="82" rx="8" ry="7" fill="#b9cf8f" ${L}/>
    <path d="M18 72c0-28 18-40 36-40s34 12 34 40Z" fill="${P.greenD}" ${L}/><path d="M34 72l4-20 16-8 16 8 4 20M38 52l-14 6M70 52l14 6M54 44V33" ${T(2.2, '#5f7f45')}/>
    <rect x="14" y="68" width="78" height="9" rx="4.5" fill="#c7d9a5" ${L}/>
    <circle cx="14" cy="58" r="12" fill="#b9cf8f" ${L}/>${eye(11, 55, 2.6)}${smile(13, 62, 3.5)}<circle cx="20" cy="61" r="2.6" fill="${P.pink}" opacity=".55"/>`,
  /* ع: the car */
  18: `<path d="M8 66c0-8 6-12 14-12l10-14c2-4 6-6 12-6h18c6 0 10 2 13 6l10 14c6 0 8 4 8 12v8H8Z" fill="${P.red}" ${L}/>
    <path d="M35 42h15v12H29Z" fill="${P.sky}" stroke="${INK}" stroke-width="2"/><path d="M54 42h12l7 12H54Z" fill="${P.sky}" stroke="${INK}" stroke-width="2"/>${shine('M16 60h16')}
    <path d="M46 62h6" ${T(2.4)}/><circle cx="88" cy="62" r="3" fill="#fff3b0" stroke="${INK}" stroke-width="1.8"/><rect x="6" y="72" width="88" height="5" rx="2.5" fill="${P.stone}" stroke="${INK}" stroke-width="2"/>
    ${wheel(27, 78, 10)}${wheel(73, 78, 10)}`,
  /* غ: the rain cloud */
  19: `${[[28, 66], [42, 72], [56, 66], [70, 72], [35, 84], [63, 84], [49, 88]].map(([x, y]) => drop(x, y)).join('')}
    <path d="M22 58c-13 0-13-20 1-20 0-14 18-20 27-8 6-13 27-10 27 6 14 0 16 22 1 22Z" fill="#b9dcef" ${L}/>
    <path d="M36 44q4 3 8 0M56 44q4 3 8 0" ${T(2.2)}/>${smile(50, 50, 4)}${cheeks(50, 49, 16, 3)}`,
  /* ف: blowing bubbles */
  20: `<path d="M14 98c0-16 10-22 26-22s26 6 26 22Z" fill="${P.blue}" ${L}/>${kidHead(40, 50, 24)}
    ${eyes(40, 50, 7, 2.6)}${cheeks(40, 57, 12, 3.4)}<circle cx="40" cy="62" r="3.6" fill="${P.redD}"/>
    <path d="M46 72 62 58" ${T(4)}/><path d="M46 72 62 58" ${T(2, P.wood)}/><circle cx="66" cy="54" r="6" ${T(2.4)}/>
    ${[[80, 38, 8], [68, 26, 6], [88, 18, 5], [92, 52, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e6f4fa" fill-opacity=".7" stroke="${INK}" stroke-width="1.8"/><circle cx="${x - r * .35}" cy="${y - r * .35}" r="${r * .25}" fill="#fff"/>`).join('')}`,
  /* ق: the crow */
  21: `<path d="M24 64 6 58l4 10-6 6 20-2Z" fill="${P.dark}" ${L}/><path d="M42 84v8m-4 0h8M56 84v8m-4 0h8" ${T(2.6, P.musD)}/>
    <ellipse cx="48" cy="64" rx="28" ry="22" fill="${P.dark}" ${L}/><path d="M28 58c10-8 26-4 32 8-12 8-26 6-32-8Z" fill="#59616e" ${L}/>
    <path d="M82 38l14 6-14 6Z" fill="${P.mus}" ${L}/><circle cx="70" cy="42" r="15" fill="${P.dark}" ${L}/>
    <circle cx="73" cy="38" r="5.5" fill="#fff" stroke="${INK}" stroke-width="1.8"/>${eye(74, 39, 2.6)}<path d="M64 30q6-4 12 0" ${T(2)}/>`,
  /* ك: the rooster on the fence */
  22: `<rect x="4" y="72" width="92" height="7" rx="3" fill="${P.wood}" ${L}/><rect x="4" y="85" width="92" height="7" rx="3" fill="${P.wood}" ${L}/>
    <rect x="12" y="64" width="10" height="34" rx="3" fill="${P.woodD}" ${L}/><rect x="78" y="64" width="10" height="34" rx="3" fill="${P.woodD}" ${L}/>
    <path d="M38 52C22 40 20 22 32 20c0 12 6 20 10 24Z" fill="${P.teal}" ${L}/><path d="M38 58C20 54 14 38 22 32c4 14 12 18 18 20Z" fill="#3f6e6a" ${L}/>
    <path d="M46 70v4M54 70v4" ${T(3, P.musD)}/><ellipse cx="50" cy="58" rx="18" ry="14" fill="#c98a5a" ${L}/><path d="M38 56c8-4 18-2 22 6-8 5-16 3-22-6Z" fill="${P.woodD}" ${L}/>
    <path d="M56 31q1-7 5-3 2-6 6 0 4-3 4 4Z" fill="${P.red}" ${L}/><circle cx="62" cy="40" r="10" fill="#d98c4a" ${L}/><path d="M71 38l8 3-8 3Z" fill="${P.mus}" ${L}/><ellipse cx="70" cy="48" rx="2.5" ry="4" fill="${P.red}"/>${eye(64, 38, 2.2)}
    <path d="M84 30q4-2 7 0M84 38q4 0 8 2" ${T(1.8)} opacity=".5"/>`,
  /* ل: no! */
  23: `<path d="M12 98c0-16 12-22 30-22s30 6 30 22Z" fill="${P.blue}" ${L}/><path d="M16 86h52M14 93h56" ${T(2.4, P.cream)}/>
    ${kidHead(42, 48, 25)}<path d="M29 41l9 3M55 41l-9 3" ${T(2.8)}/>${eyes(42, 49, 8, 2.6)}<path d="M35 64q7-5 14 0" ${T(2.4)}/>
    <path d="M70 96 76 60" ${T(10)}/><path d="M70 96 76 60" ${T(5, P.blue)}/>
    <rect x="76" y="20" width="8" height="24" rx="4" fill="${P.skin}" ${L}/><ellipse cx="79" cy="50" rx="10" ry="9" fill="${P.skin}" ${L}/>
    <path d="M88 14l4-6M92 24l6-2" ${T(2.2, P.redD)}/>`,
  /* م: mmm, ice cream */
  24: `<path d="M34 52 50 95 66 52Z" fill="${P.mus}" ${L}/><path d="M38 60l22-4M42 70l16-4M46 80l10-3M40 56l14 32M50 54l10 16" ${T(1.6, P.musD)}/>
    <path d="M27 55c-6-18 6-34 23-34s29 16 23 34c-6-4-10 2-16-2-6 6-12 0-16 4-4-4-8 2-14-2Z" fill="#f2a7b8" ${L}/>
    ${[[34, 32, P.blue], [62, 30, P.mus], [68, 44, P.green], [30, 46, P.cream]].map(([x, y, c]) => `<path d="M${x} ${y}l4 2" ${T(2.6, c)}/>`).join('')}
    <path d="M50 16q3-7 9-7" ${T(2)}/><circle cx="50" cy="16" r="6" fill="${P.red}" ${L}/>${eyes(50, 38, 7, 2.4)}${smile(50, 43, 4)}${cheeks(50, 42, 12, 3)}`,
  /* ن: yum yum, the baby eats */
  25: `<rect x="6" y="80" width="88" height="10" rx="4" fill="${P.wood}" ${L}/>
    ${kidHead(50, 38, 22, '#c98a4a')}<path d="M36 40q4 3 8 0M56 40q4 3 8 0" ${T(2.2)}/><ellipse cx="50" cy="49" rx="5" ry="4" fill="${P.redD}"/>${cheeks(50, 46, 14, 3.4)}<circle cx="36" cy="50" r="1.6" fill="${P.mus}"/><circle cx="62" cy="53" r="1.4" fill="${P.mus}"/>
    <path d="M34 58c0 8 8 13 16 13s16-5 16-13Z" fill="${P.cream}" ${L}/>
    <path d="M30 70h40c0 12-10 16-20 16s-20-4-20-16Z" fill="${P.blue}" ${L}/><ellipse cx="50" cy="70" rx="20" ry="4" fill="${P.mus}" ${L}/>
    <path d="M70 62l10-28" ${T(4)}/><path d="M70 62l10-28" ${T(2, P.stone)}/><ellipse cx="81" cy="30" rx="4.5" ry="6.5" fill="${P.stone}" ${L}/><circle cx="70" cy="64" r="6" fill="${P.skin}" ${L}/>`,
  /* ه: ha ha! */
  26: `<path d="M18 98c0-14 14-20 32-20s32 6 32 20Z" fill="${P.teal}" ${L}/>${kidHead(50, 48, 28)}
    <path d="M33 46l7 3-7 3M67 46l-7 3 7 3" ${T(2.6)}/>
    <path d="M36 58c0 16 28 16 28 0Z" fill="${P.redD}" ${L}/><path d="M38 59h24v3H38Z" fill="#fff"/><ellipse cx="50" cy="68" rx="7" ry="3.5" fill="${P.pink}"/>${cheeks(50, 57, 20, 3.6)}
    ${drop(24, 52)}${drop(76, 52)}<path d="M84 22l6-4M86 32h7M12 22l-6-4" ${T(2)} opacity=".5"/>`,
  /* و: woo woo, the train */
  27: `${puff(72, 20, 6)}${puff(82, 12, 5)}${puff(92, 6, 4)}
    <path d="M64 44l-2-16h12l-2 16Z" fill="${INK}"/><path d="M60 28h16l-2 5H62Z" fill="${P.mus}" ${L}/>
    <rect x="34" y="44" width="48" height="24" rx="11" fill="#5b86b0" ${L}/><path d="M48 44v24M62 44v24" ${T(2.4, '#4a7299')}/><circle cx="82" cy="54" r="4.5" fill="#fff3b0" ${L}/>
    <rect x="10" y="30" width="28" height="38" rx="4" fill="${P.red}" ${L}/><rect x="15" y="36" width="18" height="13" rx="3" fill="${P.sky}" stroke="${INK}" stroke-width="2"/><path d="M6 30h36v-6H6Z" fill="${P.redD}" ${L}/>
    <path d="M82 62l10 8H80Z" fill="${P.mus}" ${L}/><rect x="6" y="66" width="82" height="7" rx="3" fill="${INK}"/>
    ${wheel(22, 80, 10, P.red)}${wheel(48, 82, 8, P.red)}${wheel(68, 82, 8, P.red)}`,
  /* ي: yee! down the slide */
  28: `<path d="M4 94h92" ${T(2.4)} opacity=".4"/>
    <path d="M20 30v64M36 30v64" ${T(4.5)}/><path d="M20 30v64M36 30v64" ${T(2, '#92abbf')}/><path d="M20 46h16M20 60h16M20 74h16M20 88h16" ${T(2.6)}/>
    <rect x="16" y="24" width="26" height="7" rx="3" fill="#92abbf" ${L}/>
    <path d="M40 26c18 2 22 34 54 56l-6 9C56 70 50 42 38 34Z" fill="${P.red}" ${L}/><path d="M66 60v34M84 80v14" ${T(3)}/>
    <ellipse cx="66" cy="60" rx="9" ry="6" fill="${P.mus}" ${L} transform="rotate(38 66 60)"/><path d="M62 56l-8-10M68 56l-1-13" ${T(2.6)}/>
    <circle cx="60" cy="48" r="8" fill="${P.skin}" ${L}/><path d="M53 46c0-7 12-9 14-2-4-2-9-1-14 2Z" fill="${P.hair}" stroke="${INK}" stroke-width="1.8"/>${eye(61, 48, 1.6)}<path d="M58 52q3 2 5 0" ${T(1.8)}/>
    <path d="M78 34q4-2 8 0M80 42h8" ${T(2)} opacity=".5"/>`,
};

const cache = new Map();
/* The drawing as an <svg> string, a data URI for <img>, or a nested <svg> placed in a bigger drawing. */
export const pictureSVG = id => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${DRAW[id] || ''}</svg>`;
export const pictureURI = id => { if (!cache.has(id)) cache.set(id, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pictureSVG(id))); return cache.get(id); };
export const pictureAt = (id, x, y, size) => `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100" overflow="visible">${DRAW[id] || ''}</svg>`;
export const PICTURE_IDS = Object.keys(DRAW).map(Number);
