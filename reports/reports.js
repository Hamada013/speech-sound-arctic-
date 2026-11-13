/* The reports page: each part's results on their own, or several parts combined into one report, graphs first.
   Rings of each part's latest scores; a sounds grid (one part: a column per level; several: a column per part with a block
   per level); the approaches' bars; progress lines by day; the sessions as a collapsed table; print to PDF.
   The data comes from ../assets/results.js. The chosen parts are remembered on this device only. */
(() => {
  const R = window.ArticulationResults, T = window.ArticulationTherapy, Children = window.ArticulationChildren, $ = id => document.getElementById(id);
  const PICK_KEY = 'articulation-reports-parts-v1', TARGET = T.TARGET;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const svg = (tag, attrs = {}) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); return n; };
  const seq = p => { const a = [238, 247, 241], b = [31, 122, 74], k = p / 100; return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`; };
  const dateLabel = iso => new Date(`${iso}T12:00:00`).toLocaleDateString('ar-SY', { day: 'numeric', month: 'numeric' });
  let picked = null;
  try { picked = JSON.parse(localStorage.getItem(PICK_KEY)); } catch {}

  function draw() {
    const child = Children.active();
    $('name').textContent = child ? child.name : 'لا يوجد طفل مختار';
    $('face').replaceChildren(...(child && window.SuiteAccounts ? [window.SuiteAccounts.avatar(child, 'small')] : []));
    $('plan-link').hidden = !(child && T.planOf(child.id));
    const parts = child ? R.all(child.id) : [];
    $('empty').hidden = parts.length > 0; $('content').hidden = !parts.length; $('chips').hidden = !parts.length;
    $('empty-text').textContent = child ? 'لا توجد نتائج بعد. تُسجَّل النتائج حين يقيّم المعالج أثناء اللعب، أو من اختبار النطق.' : 'اختر طفلًا من الصفحة الرئيسية أولًا.';
    $('when').textContent = parts.length ? `حتى ${dateLabel(T.today())}` : '';
    if (!parts.length) return;
    const chosen = parts.filter(p => !Array.isArray(picked) || picked.includes(p.part));
    const shown = chosen.length ? chosen : parts;
    drawChips(parts, shown);
    drawRings(shown); drawGrid(shown); drawPatterns(shown); drawProgress(shown); drawSessions(shown);
  }

  function drawChips(parts, shown) {
    $('chips').replaceChildren(...Object.keys(R.NAMES).map(id => {
      const part = parts.find(p => p.part === id), chip = el('button', 'chip');
      chip.type = 'button'; chip.style.setProperty('--c', R.COLORS[id]); chip.disabled = !part;
      chip.setAttribute('aria-pressed', String(!!part && shown.some(p => p.part === id)));
      chip.append(el('i'), document.createTextNode(R.NAMES[id]));
      chip.onclick = () => {
        const now = shown.map(p => p.part), next = now.includes(id) ? now.filter(x => x !== id) : [...now, id];
        if (!next.length) return;
        picked = next; try { localStorage.setItem(PICK_KEY, JSON.stringify(next)); } catch {}
        draw();
      };
      return chip;
    }));
  }

  function drawRings(parts) {
    $('rings').replaceChildren(...parts.map(part => {
      const box = el('figure', 'ring'), p = part.percent ?? 0, C = 2 * Math.PI * 40, chart = svg('svg', { viewBox: '0 0 100 100', role: 'img', 'aria-label': `${part.name}: ${part.percent}%` });
      chart.append(svg('circle', { cx: 50, cy: 50, r: 40, fill: 'none', stroke: '#eef3f7', 'stroke-width': 13 }));
      if (p) chart.append(svg('circle', { cx: 50, cy: 50, r: 40, fill: 'none', stroke: part.color, 'stroke-width': 13, 'stroke-linecap': 'round', 'stroke-dasharray': `${C * p / 100} ${C}`, transform: 'rotate(-90 50 50)' }));
      const t = svg('text', { x: 50, y: 57, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, fill: '#22445a', 'font-family': 'system-ui,sans-serif' }); t.textContent = `${part.percent}%`; chart.append(t);
      box.append(chart, el('b', '', part.name), el('span', '', part.part === 'test' ? `${part.count} اختبار` : `${part.count} جلسة`));
      return box;
    }));
  }

  /* One part: a column per level with the score. Several: a column per part, a block per level. */
  function drawGrid(parts) {
    const games = parts.filter(p => p.part !== 'approaches');
    $('sounds-card').hidden = !games.length;
    if (!games.length) return;
    /* With other parts shown, the test adds only the sounds it ever found an error in; alone it shows every sound tested. */
    const test = games.find(p => p.part === 'test'), wrongInTest = new Set((test?.assessments || []).flatMap(a => Object.entries(a.items).filter(([, z]) => Object.values(z).includes(0)).map(([l]) => l)));
    const letters = R.ORDER.filter(l => games.some(p => p.part === 'test' ? (games.length === 1 ? p.sounds.some(s => s.letter === l) : wrongInTest.has(l)) : p.sounds.some(s => s.letter === l)));
    const single = games.length === 1, nodes = [], box = $('grid');
    const columns = single ? games[0].levels.map(level => ({ part: games[0], levels: [level], title: level.name })) : games.map(part => ({ part, levels: part.levels, title: part.name }));
    box.style.gridTemplateColumns = `40px repeat(${columns.length}, minmax(${single ? 64 : 46}px, 1fr))`;
    nodes.push(el('span'));
    columns.forEach(col => { const h = el('span', 'h'); h.style.setProperty('--c', col.part.color); h.append(el('i'), document.createTextNode(col.title)); nodes.push(h); });
    for (const letter of letters) {
      nodes.push(el('span', 'l', letter));
      for (const col of columns) {
        const sound = col.part.sounds.find(s => s.letter === letter), cell = el('span', 'c');
        const said = [];
        for (const level of col.levels) {
          const r = sound?.levels[level.id], b = el('span', r ? 'b' : 'b none');
          if (r) {
            b.style.background = seq(r.percent); b.style.color = r.percent > 55 ? '#fff' : '#22445a';
            b.textContent = col.part.part === 'test' ? (r.percent ? '✓' : '✗') : single ? `${r.percent}%${r.reached ? ' ✓' : ''}` : r.reached ? '✓' : '';
            said.push(`${level.name} ${col.part.part === 'test' ? (r.percent ? 'صحيح' : 'خطأ') : `${r.percent}%`}${r.reached && col.part.part !== 'test' ? ' تحقق الهدف' : ''}`);
          } else { b.textContent = single ? '—' : ''; }
          b.dir = 'ltr'; b.title = `${letter}، ${col.part.name}، ${level.name}${r ? `: ${r.percent}%` : ': لا نتائج'}`;
          cell.append(b);
        }
        cell.setAttribute('role', 'img'); cell.setAttribute('aria-label', `${letter} في ${col.part.name}: ${said.join('، ') || 'لا نتائج'}`);
        nodes.push(cell);
      }
    }
    box.replaceChildren(...nodes);
  }

  function drawPatterns(parts) {
    const part = parts.find(p => p.part === 'approaches');
    $('patterns-card').hidden = !part;
    if (!part) return;
    const rows = [];
    for (const sound of part.sounds) for (const level of part.levels) {
      const r = sound.levels[level.id]; if (!r) continue;
      const row = el('div', 'pbar'), name = el('span', '', sound.name), track = el('span', 't'), fill = el('i');
      name.append(el('small', '', level.name)); fill.style.width = `${r.percent}%`; fill.style.background = part.color; track.append(fill);
      row.setAttribute('role', 'img'); row.setAttribute('aria-label', `${sound.name}، ${level.name}: ${r.percent}%${r.reached ? '، تحقق الهدف' : ''}`);
      row.append(name, track, el('b', '', `${r.percent}%${r.reached ? ' ✓' : ''}`));
      rows.push(row);
    }
    $('pattern-bars').replaceChildren(...rows);
  }

  /* A line per part: the mean of each day's sessions (the test: each assessment). The goal line at 80%. */
  function drawProgress(parts) {
    const series = parts.map(part => {
      const byDay = {};
      part.sessions.forEach(s => { const d = part.part === 'test' ? s.date : R.day(s.date); (byDay[d] ||= []).push(s.percent); });
      return { part, points: Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([d, list]) => ({ d, v: Math.round(R.mean(list)) })) };
    }).filter(s => s.points.length);
    const days = [...new Set(series.flatMap(s => s.points.map(p => p.d)))].sort();
    $('progress-card').hidden = !days.length;
    if (!days.length) return;
    $('legend').replaceChildren(...series.map(s => { const item = el('span'); item.style.setProperty('--c', s.part.color); item.append(el('i'), document.createTextNode(s.part.name)); return item; }));
    const W = Math.max(300, $('chart').clientWidth || 600), H = 220, m = { l: 36, r: 14, t: 12, b: 28 };
    const x = i => days.length < 2 ? (m.l + W - m.r) / 2 : m.l + i / (days.length - 1) * (W - m.l - m.r), y = v => m.t + (1 - v / 100) * (H - m.t - m.b);
    const chart = svg('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `التقدّم بالأيام. ${series.map(s => `${s.part.name}: آخر قيمة ${s.points.at(-1).v}%`).join('، ')}` });
    const text = (attrs, value) => { const t = svg('text', { 'font-size': 11, fill: '#5c7285', 'font-family': 'system-ui,sans-serif', ...attrs }); t.textContent = value; return t; };
    [0, 50, 100].forEach(v => { chart.append(svg('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), stroke: '#e6edf2' })); chart.append(text({ x: m.l - 6, y: y(v) + 4, 'text-anchor': 'end' }, v)); });
    chart.append(svg('line', { x1: m.l, x2: W - m.r, y1: y(TARGET), y2: y(TARGET), stroke: '#7c8e9c', 'stroke-dasharray': '4 4' }));
    const step = Math.max(1, Math.ceil(days.length / 7));
    days.forEach((d, i) => { if (i % step === 0 || i === days.length - 1) chart.append(text({ x: x(i), y: H - 8, 'text-anchor': 'middle' }, dateLabel(d))); });
    for (const s of series) {
      const pts = s.points.map(p => [x(days.indexOf(p.d)), y(p.v)]);
      if (pts.length > 1) chart.append(svg('polyline', { points: pts.map(p => p.join(',')).join(' '), fill: 'none', stroke: s.part.color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
      pts.forEach(([cx, cy], i) => { const c = svg('circle', { cx, cy, r: 4.5, fill: s.part.color, stroke: '#fff', 'stroke-width': 2 }); const tip = svg('title'); tip.textContent = `${s.part.name} ${dateLabel(s.points[i].d)}: ${s.points[i].v}%`; c.append(tip); chart.append(c); });
    }
    $('chart').replaceChildren(chart);
  }

  function drawSessions(parts) {
    const rows = parts.filter(part => part.part !== 'test').flatMap(part => part.sounds.flatMap(sound => sound.sessions.map(s => ({ date: s.date, part: part.name, what: sound.name, zone: part.levels.find(l => l.id === s.zone)?.name || '', percent: s.percent }))));
    const test = parts.find(p => p.part === 'test');
    if (test) test.assessments.forEach(a => { const all = Object.values(a.items).flatMap(Object.values); rows.push({ date: a.date, part: test.name, what: `${Object.keys(a.items).length} صوتًا`, zone: '', percent: Math.round(R.mean(all) * 100) }); });
    rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    $('sessions').innerHTML = '';
    rows.forEach(r => { const tr = el('tr'); [dateLabel(r.date.length > 10 ? R.day(r.date) : r.date), r.part, r.what, r.zone, `${r.percent}%`].forEach(v => tr.append(el('td', '', v))); $('sessions').append(tr); });
  }

  $('print').onclick = () => { document.querySelector('details.detail').open = true; print(); };
  addEventListener('pageshow', () => { Children.reload?.(); draw(); });
  let width = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - width) > 40) { width = innerWidth; draw(); } });
  draw();
})();
