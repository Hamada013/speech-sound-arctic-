/* The phrases (or sentences) report for one child, graphs first: a ring of right, partial and wrong with the overall score,
   a bar for each sound, a progress line, then each sound's details, and a PDF download. With more than one level per sound,
   the bars are per level and a sounds-by-level grid is added.
   summaryOf() gives the same results in the shape every part shares, for the report that combines the parts. */
window.ArticulationReport = (() => {
  const Data = window.ArticulationData, Plan = window.ArticulationPlan;
  /* Colours follow the short goal everywhere and never change with what is shown. */
  const COLORS = { say: '#6250d6', imitation: '#2a78d6', independent: '#eb6834', pairs: '#2a78d6', oppositions: '#eb6834', cycles: '#1baf7a', pages: '#6250d6', retell: '#eb6834' }, SOUND_COLOR = '#6250d6', PART = window.PartConfig || { id: 'phrases', name: 'العبارات' };
  const INK = '#22445a', MUTED = '#5c7285', FONT = 'system-ui,-apple-system,Segoe UI,Tahoma,Arial,sans-serif';
  const STATES = { done: ['تحقق الهدف', '#0ca30c'], close: ['قريب من الهدف', '#fab219'], working: ['قيد التدريب', '#fab219'], low: ['يحتاج تدريبًا', '#d03b3b'], none: ['لم يبدأ', '#c3c2b7'] };
  const SVG = 'http://www.w3.org/2000/svg';
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; };
  const svgEl = (tag, attrs = {}) => { const node = document.createElementNS(SVG, tag); Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value)); return node; };
  /* Chart text carries its own styling so it survives being drawn into the PDF. */
  const label = (attrs, value, bold) => { const node = svgEl('text', { 'font-family': FONT, 'font-size': bold ? 12 : 11, 'font-weight': bold ? 700 : 400, fill: bold ? INK : MUTED, stroke: 'none', ...attrs }); node.textContent = value; return node; };
  const dateOf = iso => new Date(iso).toLocaleDateString('ar-SY', { day: 'numeric', month: 'numeric' });
  const stateOf = (percent, reached) => (percent === null ? 'none' : reached ? 'done' : percent >= Plan.TARGET ? 'close' : percent >= 50 ? 'working' : 'low');

  /* The latest session of a short goal: its ten phrases added up and averaged. */
  function positionStat(child, soundId, positionId) {
    const last = Plan.attemptsOf(child, soundId, positionId).at(-1);
    return last ? { points: Plan.sum(last), size: Plan.size(last), percent: Plan.percent(last), reached: Plan.reached(child, soundId, positionId) } : null;
  }
  function soundStat(child, soundId) {
    const stats = Data.positions.map(position => positionStat(child, soundId, position.id)).filter(Boolean);
    if (!stats.length) return null;
    const points = stats.reduce((total, stat) => total + stat.points, 0), size = stats.reduce((total, stat) => total + stat.size, 0);
    return { points, size, percent: Math.round(points / size * 100), reached: stats.length === Data.positions.length && stats.every(stat => stat.reached) };
  }

  function barRow({ name, color, keyed, stat }) {
    const percent = stat ? stat.percent : null, state = STATES[stateOf(percent, stat?.reached)], row = el('div', 'rp-row'), head = el('div', 'rp-row-head'), title = el('span', 'rp-row-name');
    row.setAttribute('role', 'img');
    row.setAttribute('aria-label', `${name}: ${percent === null ? 'لا توجد جلسات' : `${percent}%، ${stat.points} من ${stat.size}`}، ${state[0]}`);
    if (keyed) { const key = el('i', 'rp-key'); key.style.background = color; title.append(key); }
    title.append(document.createTextNode(name));
    head.append(title);
    if (stat) { const points = el('span', 'rp-points', `${stat.points} / ${stat.size}`); points.dir = 'ltr'; head.append(points); }
    const status = el('span', 'rp-state'), dot = el('i'); dot.style.background = state[1];
    status.append(dot, el('span', '', state[0])); head.append(status);
    const line = el('div', 'rp-bar-line'), track = el('div', 'rp-track'), value = el('b', '', percent === null ? '—' : `${percent}%`);
    if (percent) { const fill = el('div', 'rp-fill'); fill.style.width = `${percent}%`; fill.style.background = color; track.append(fill); }
    track.append(el('div', 'rp-goal')); value.dir = 'ltr';
    line.append(track, value);
    row.append(head, line);
    return row;
  }

  function lineChart(host, series, interactive) {
    host.replaceChildren();
    const width = Math.max(260, host.clientWidth), height = 210, m = { left: 38, right: 46, top: 14, bottom: 30 };
    const count = Math.max(...series.map(entry => entry.points.length));
    const x = index => (count < 2 ? (m.left + width - m.right) / 2 : m.left + (index / (count - 1)) * (width - m.left - m.right));
    const y = value => m.top + (1 - value / 100) * (height - m.top - m.bottom);
    const summary = series.map(entry => `${entry.name}: ${entry.points.at(-1).value}%`).join('، ');
    const chart = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': `تقدّم الجلسات. آخر قيمة: ${summary}`, style: 'direction:ltr' });
    [0, 25, 50, 75, 100].forEach(tick => {
      chart.append(svgEl('line', { x1: m.left, x2: width - m.right, y1: y(tick), y2: y(tick), stroke: '#e1e8ee', 'stroke-width': 1 }));
      chart.append(label({ x: m.left - 8, y: y(tick) + 4, 'text-anchor': 'end' }, tick));
    });
    chart.append(svgEl('line', { x1: m.left, x2: width - m.right, y1: y(Plan.TARGET), y2: y(Plan.TARGET), stroke: '#7c8e9c', 'stroke-width': 1 }));
    const step = count > 12 ? Math.ceil(count / 8) : 1;
    for (let i = 0; i < count; i += step) chart.append(label({ x: x(i), y: height - 9, 'text-anchor': 'middle' }, i + 1));
    series.forEach(entry => {
      if (entry.points.length > 1) chart.append(svgEl('polyline', { points: entry.points.map((point, i) => `${x(i)},${y(point.value)}`).join(' '), fill: 'none', stroke: entry.color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      entry.points.forEach((point, i) => chart.append(svgEl('circle', { cx: x(i), cy: y(point.value), r: 4, fill: entry.color, stroke: '#fff', 'stroke-width': 2 })));
    });
    chart.append(label({ x: m.left + 4, y: y(Plan.TARGET) - 5, 'text-anchor': 'end', style: 'direction:rtl;paint-order:stroke', stroke: '#fff', 'stroke-width': 4, 'stroke-linejoin': 'round' }, `الهدف ${Plan.TARGET}%`));
    /* End values label the lines; when two ends would touch, the legend and readout carry them instead. */
    const ends = series.map(entry => ({ entry, at: y(entry.points.at(-1).value), index: entry.points.length - 1 }));
    ends.forEach(end => {
      if (ends.some(other => other !== end && Math.abs(other.at - end.at) < 15 && Math.abs(other.index - end.index) < 2)) return;
      chart.append(label({ x: x(end.index) + 9, y: end.at + 4 }, `${end.entry.points.at(-1).value}%`, true));
    });
    host.append(chart);
    if (!interactive) return;
    chart.setAttribute('tabindex', '0');
    const cross = svgEl('line', { y1: m.top, y2: height - m.bottom, stroke: '#7c8e9c', 'stroke-width': 1, visibility: 'hidden' }); chart.append(cross);
    const tip = el('div', 'rp-tip'); tip.hidden = true; host.append(tip);
    let shown = -1;
    const show = index => {
      shown = index; cross.setAttribute('x1', x(index)); cross.setAttribute('x2', x(index)); cross.setAttribute('visibility', 'visible');
      tip.replaceChildren(el('div', 'rp-tip-head', `الجلسة ${index + 1}`), ...series.filter(entry => entry.points[index]).map(entry => {
        const row = el('div', 'rp-tip-row'), key = el('i'); key.style.background = entry.color;
        row.append(key, el('b', '', `${entry.points[index].value}%`), el('span', '', entry.name)); return row;
      }));
      tip.hidden = false;
      tip.style.left = `${Math.min(width - tip.offsetWidth - 2, Math.max(2, x(index) - tip.offsetWidth / 2))}px`;
    };
    const hide = () => { shown = -1; cross.setAttribute('visibility', 'hidden'); tip.hidden = true; };
    const nearest = event => { const at = event.clientX - chart.getBoundingClientRect().left; let best = 0; for (let i = 1; i < count; i++) if (Math.abs(x(i) - at) < Math.abs(x(best) - at)) best = i; return best; };
    chart.addEventListener('pointermove', event => show(nearest(event)));
    chart.addEventListener('pointerdown', event => show(nearest(event)));
    chart.addEventListener('pointerleave', hide);
    chart.addEventListener('focus', () => show(Math.max(0, count - 1)));
    chart.addEventListener('blur', hide);
    chart.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' && shown > 0) show(shown - 1);
      if (event.key === 'ArrowRight' && shown < count - 1) show(shown + 1);
    });
  }

  function sessionTable(child, soundId) {
    const wrap = el('details', 'rp-table'), table = el('table'), head = el('tr');
    wrap.append(el('summary', '', 'جدول الجلسات'));
    ['التاريخ', 'الهدف', 'النسبة', 'صحيح', 'جزئي', 'خطأ'].forEach(title => head.append(el('th', '', title)));
    table.append(head);
    [...Plan.attemptsOf(child, soundId)].reverse().forEach(attempt => {
      const row = el('tr'), scores = Object.values(attempt.scores), count = value => scores.filter(score => score === value).length;
      [dateOf(attempt.date), Data.positionName(attempt.zone), `${Plan.percent(attempt)}%`, count(1), count(.5), count(0)].forEach(value => row.append(el('td', '', value)));
      table.append(row);
    });
    wrap.append(table);
    return wrap;
  }

  const blockTitle = text => el('h3', 'rp-title', text);
  function soundBlock(host, child, sound, pdf) {
    const block = el('section', 'rp-block');
    block.append(blockTitle(`${sound.name} (${sound.letter})`));
    Data.positions.forEach(position => block.append(barRow({ name: position.name, color: COLORS[position.id], keyed: true, stat: positionStat(child, sound.id, position.id) })));
    const series = Data.positions.map(position => ({ name: position.name, color: COLORS[position.id], points: Plan.attemptsOf(child, sound.id, position.id).map(attempt => ({ value: Plan.percent(attempt) })) })).filter(entry => entry.points.length);
    const figure = el('figure', 'rp-chart'), plot = el('div', 'rp-plot');
    figure.append(el('figcaption', '', 'التقدّم عبر الجلسات'));
    if (series.length > 1) { const legend = el('div', 'rp-legend'); series.forEach(entry => { const item = el('span'), key = el('i', 'rp-key'); key.style.background = entry.color; item.append(key, document.createTextNode(entry.name)); legend.append(item); }); figure.append(legend); }
    figure.append(plot); block.append(figure);
    host.append(block);
    lineChart(plot, series, !pdf);
    if (!pdf) block.append(sessionTable(child, sound.id));
  }
  /* ---------- Graphs first ---------- */
  const OUTCOMES = [['right', 'صحيح', '#0ca30c'], ['partial', 'جزئي', '#fab219'], ['wrong', 'خطأ', '#d03b3b']];
  const mean = list => list.reduce((a, b) => a + b, 0) / list.length;
  /* The latest session of each sound and short goal: its grades. */
  function latestOf(child) {
    const latest = new Map();
    child.progress.attempts.forEach(attempt => latest.set(`${attempt.sound}|${attempt.zone}`, Object.values(attempt.scores)));
    return latest;
  }
  const hasData = child => child.progress.attempts.length > 0;
  const seq = percent => { const a = [238, 247, 241], b = [31, 122, 74], k = percent / 100; return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`; };

  function summary(child, latest) {
    const block = el('section', 'rp-block rp-summary'), all = [...latest.values()].flat();
    const counts = { right: all.filter(v => v === 1).length, partial: all.filter(v => v > 0 && v < 1).length, wrong: all.filter(v => v === 0).length };
    const overall = Math.round(mean([...latest.values()].map(mean)) * 100), size = 150, R = 58, W = 22, C = 2 * Math.PI * R, total = all.length;
    const ring = svgEl('svg', { width: size, height: size, viewBox: `0 0 ${size} ${size}`, role: 'img', 'aria-label': `النتيجة ${overall}%. ${OUTCOMES.map(([id, name]) => `${name} ${counts[id]}`).join('، ')}` });
    ring.append(svgEl('circle', { cx: size / 2, cy: size / 2, r: R, fill: 'none', stroke: '#eef2f5', 'stroke-width': W }));
    let at = 0;
    OUTCOMES.forEach(([id, name, color]) => {
      const part = counts[id] / total * C; if (!part) return;
      const arc = svgEl('circle', { cx: size / 2, cy: size / 2, r: R, fill: 'none', stroke: color, 'stroke-width': W, 'stroke-dasharray': `${Math.max(0, part - 2)} ${C}`, 'stroke-dashoffset': -at, transform: `rotate(-90 ${size / 2} ${size / 2})` });
      const tip = svgEl('title'); tip.textContent = `${name}: ${counts[id]} (${Math.round(counts[id] / total * 100)}%)`; arc.append(tip);
      ring.append(arc); at += part;
    });
    ring.append(label({ x: size / 2, y: size / 2 + 9, 'text-anchor': 'middle', 'font-size': 30, 'font-weight': 800, fill: INK }, `${overall}%`));
    const left = el('div', 'rp-ring'), legend = el('div', 'rp-ring-legend');
    OUTCOMES.forEach(([id, name, color]) => { const row = el('span'), dot = el('i'); dot.style.background = color; row.append(dot, el('span', '', name), el('b', '', String(counts[id]))); legend.append(row); });
    left.append(ring, legend);
    const bars = el('div', 'rp-sources');
    const single = Data.positions.length === 1, statOf = values => values.length ? { points: values.reduce((a, b) => a + b, 0), size: values.length, percent: Math.round(mean(values) * 100) } : null;
    if (single) Data.sounds.filter(sound => latest.has(`${sound.id}|${Data.positions[0].id}`)).forEach(sound => bars.append(barRow({ name: `${sound.letter} ${sound.name}`, color: SOUND_COLOR, stat: { ...statOf(latest.get(`${sound.id}|${Data.positions[0].id}`)), reached: Plan.reached(child, sound.id, Data.positions[0].id) } })));
    else Data.positions.forEach(position => {
      const values = [...latest].filter(([key]) => key.endsWith('|' + position.id)).flatMap(([, list]) => list);
      bars.append(barRow({ name: position.name, color: COLORS[position.id], keyed: true, stat: statOf(values) }));
    });
    block.append(blockTitle('النتيجة'), el('div', 'rp-summary-row'));
    block.lastChild.append(left, bars);
    return block;
  }
  /* Sounds down the side, the two short goals across: each cell is that goal's latest session for that sound. */
  function grid(child, latest) {
    const block = el('section', 'rp-block'), table = el('table', 'rp-grid'), head = el('tr');
    head.append(el('th', '', ''), ...Data.positions.map(position => el('th', '', position.name)));
    table.append(head);
    Data.sounds.filter(sound => Data.positions.some(position => latest.has(`${sound.id}|${position.id}`))).forEach(sound => {
      const row = el('tr'); row.append(el('th', '', sound.letter));
      Data.positions.forEach(position => {
        const values = latest.get(`${sound.id}|${position.id}`), td = el('td');
        if (values) {
          const percent = Math.round(mean(values) * 100), reached = Plan.reached(child, sound.id, position.id);
          td.style.background = seq(percent); td.style.color = percent > 55 ? '#fff' : INK; td.textContent = `${percent}%${reached ? ' ✓' : ''}`; td.dir = 'ltr';
          td.title = `${sound.name}، ${position.name}: ${percent}%${reached ? '، تحقق الهدف' : ''}`;
        } else { td.textContent = '—'; td.className = 'rp-grid-empty'; }
        row.append(td);
      });
      table.append(row);
    });
    const key = el('div', 'rp-grid-key'); key.append(el('span', '', '0%'), el('i'), el('span', '', '100%'));
    block.append(blockTitle('الأصوات والأهداف'), table, key);
    return block;
  }
  /* One line per short goal: each session's score, in order. */
  function progress(host, child, pdf) {
    const series = Data.positions.map(position => ({ name: position.name, color: COLORS[position.id], points: child.progress.attempts.filter(attempt => attempt.zone === position.id).map(attempt => ({ value: Plan.percent(attempt) })) })).filter(entry => entry.points.length);
    if (!series.length) return;
    const block = el('section', 'rp-block'), plot = el('div', 'rp-plot');
    block.append(blockTitle('التقدّم'));
    if (series.length > 1) { const legend = el('div', 'rp-legend'); series.forEach(entry => { const item = el('span'), key = el('i', 'rp-key'); key.style.background = entry.color; item.append(key, document.createTextNode(entry.name)); legend.append(item); }); block.append(legend); }
    block.append(plot); host.append(block);
    lineChart(plot, series, !pdf);
  }
  function build(host, child, pdf) {
    const latest = latestOf(child);
    host.append(summary(child, latest));
    if (Data.positions.length > 1) host.append(grid(child, latest));
    progress(host, child, pdf);
    const played = Data.sounds.filter(sound => Plan.attemptsOf(child, sound.id).length);
    if (played.length) { host.append(el('h3', 'rp-part', 'التفاصيل')); played.forEach(sound => soundBlock(host, child, sound, pdf)); }
  }
  /* The shape every part shares, for the report that combines the parts: each sound by letter, each level with its latest score. */
  function summaryOf(child) {
    return { part: PART.id, name: PART.name, sounds: Data.sounds.filter(sound => Plan.attemptsOf(child, sound.id).length).map(sound => ({ letter: sound.letter, levels: Data.positions.map(position => { const stat = positionStat(child, sound.id, position.id); return { name: position.name, percent: stat ? stat.percent : null, reached: !!stat?.reached }; }) })) };
  }

  function draw(host, child) {
    host.replaceChildren();
    const doc = el('div', 'rp-doc'); host.append(doc);
    doc.append(el('p', 'center muted', child.name));
    if (!hasData(child)) { doc.append(el('p', 'center muted rp-empty', `لا توجد نتائج بعد: قيّم ${PART.name} أثناء اللعب في وضع المعالج.`)); return; }
    build(doc, child, false);
  }

  /* The PDF tools are large, so they load the first time a report is downloaded. */
  let libraries;
  const loadScript = src => new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = src; script.onload = resolve; script.onerror = () => reject(Error('load failed')); document.head.append(script); });
  const loadLibraries = () => libraries || (libraries = Promise.all(['../syllable/assets/vendor/html2canvas.min.js', '../syllable/assets/vendor/jspdf.umd.min.js'].map(loadScript)).catch(error => { libraries = null; throw error; }));

  /* A4 pages of whole sections, so a page break never cuts through a graph. */
  function addPages(doc, canvas, stage, scale) {
    const width = 186, height = 273, top0 = stage.getBoundingClientRect().top, perMM = canvas.width / width, pagePixels = Math.floor(height * perMM);
    const breaks = [...stage.children].map(node => Math.round((node.getBoundingClientRect().bottom - top0) * scale));
    breaks.push(canvas.height);
    let top = 0, page = 0;
    while (top < canvas.height) {
      const limit = Math.min(top + pagePixels, canvas.height), end = limit === canvas.height ? limit : breaks.filter(y => y > top + 80 && y <= limit).at(-1) || limit;
      const slice = document.createElement('canvas');
      slice.width = canvas.width; slice.height = end - top;
      const paint = slice.getContext('2d');
      paint.fillStyle = '#fff'; paint.fillRect(0, 0, slice.width, slice.height);
      paint.drawImage(canvas, 0, top, canvas.width, end - top, 0, 0, canvas.width, end - top);
      if (page++) doc.addPage();
      doc.addImage(slice.toDataURL('image/jpeg', .94), 'JPEG', 12, 12, width, (end - top) / perMM);
      top = end;
    }
  }
  async function download(child) {
    await loadLibraries();
    await document.fonts?.ready;
    const stage = el('article', 'rp-doc rp-pdf'), head = el('header', 'rp-pdf-head'), today = new Date();
    stage.dir = 'rtl';
    head.append(el('h1', '', `تقرير ${PART.name}`), el('p', '', `${child.name} — ${today.toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })}`));
    stage.append(head);
    document.body.append(stage);
    try {
      build(stage, child, true);
      const scale = 2, canvas = await window.html2canvas(stage, { scale, backgroundColor: '#fff', windowWidth: 900, logging: false });
      const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
      addPages(doc, canvas, stage, scale);
      doc.setProperties({ title: `تقرير ${PART.name} - ${child.name}`, creator: PART.name });
      doc.save(`تقرير-${PART.name}-${child.name.replace(/[\\/:*?"<>|]/g, '')}-${today.toISOString().slice(0, 10)}.pdf`);
    } finally { stage.remove(); }
  }
  return { draw, download, hasData, summaryOf };
})();
