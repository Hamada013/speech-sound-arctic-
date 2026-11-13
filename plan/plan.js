/* The intervention plan page: where each sound stands on the ladder of parts, the patterns and their approaches, the days
   practised, and the therapist's changes behind the 013 switch (shared with the home page's locks). Graphs first; the
   test results only as a collapsed table. The plan itself is in ../assets/therapy.js. */
(() => {
  const T = window.ArticulationTherapy, Children = window.ArticulationChildren, $ = id => document.getElementById(id);
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${T.ICONS[name] || name}</svg>`;
  const CHEVRON = '<path d="m6 9 6 6 6-6"/>', MORE = '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>';
  const STATE = { now: 'الآن', next: 'بعدها', held: 'موقوف', done: 'تمّ' };
  const APPROACH = { pairs: 'الأزواج الدنيا', oppositions: 'المتقابلات', cycles: 'الدورات' };
  const WEEKDAYS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  const digits = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  const el = (tag, cls, html) => { const node = document.createElement(tag); if (cls) node.className = cls; if (html != null) node.innerHTML = html; return node; };
  let editing = T.therapistOpen();

  const child = () => Children.active();
  const plan = () => T.planOf(child()?.id);
  function change(edit) { const p = plan(); if (!p) return; edit(p); T.savePlan(p); T.applyGoals(p); draw(); }

  /* ---------- Menus: a rounded white trigger opens a list; the chosen row is soft green with a check. ---------- */
  let open = null;
  function closeMenu() { if (!open) return; open.box.remove(); open.trigger.setAttribute('aria-expanded', 'false'); const t = open.trigger; open = null; t.focus({ preventScroll: true }); }
  function menu(trigger, items, cls = '') {
    if (open?.trigger === trigger) { closeMenu(); return; }
    if (open) closeMenu();
    const box = el('div', `menu ${cls}`); box.setAttribute('role', 'menu');
    for (const item of items) {
      if (item === '-') { box.append(el('hr')); continue; }
      const row = el('button', item.selected ? 'selected' : item.danger ? 'danger-row' : '', `<span>${item.label}</span>${item.selected ? icon('check') : ''}`);
      row.type = 'button'; row.setAttribute('role', 'menuitem'); if (item.aria) row.setAttribute('aria-label', item.aria);
      row.onclick = () => { closeMenu(); item.action(); };
      box.append(row);
    }
    document.body.append(box);
    const r = trigger.getBoundingClientRect(), w = box.offsetWidth, h = box.offsetHeight;
    box.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, r.right - w))}px`;
    box.style.top = `${r.bottom + 6 + h > innerHeight - 8 ? Math.max(8, r.top - 6 - h) : r.bottom + 6}px`;
    open = { box, trigger }; trigger.setAttribute('aria-expanded', 'true');
    box.querySelector('button')?.focus({ preventScroll: true });
  }
  document.addEventListener('pointerdown', event => { if (open && !open.box.contains(event.target) && !open.trigger.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && open) { event.preventDefault(); closeMenu(); } });
  addEventListener('scroll', () => { if (open) closeMenu(); }, { passive: true });
  addEventListener('resize', () => { if (open) closeMenu(); });

  /* ---------- Drawing ---------- */
  function draw() {
    const person = child(), p = plan();
    $('name').textContent = person ? person.name : 'لا يوجد طفل مختار';
    $('face').replaceChildren(...(person && window.SuiteAccounts ? [window.SuiteAccounts.avatar(person, 'small')] : []));
    $('therapist').innerHTML = icon(editing ? 'open' : 'lock'); $('therapist').setAttribute('aria-pressed', String(editing));
    document.querySelectorAll('.tool').forEach(node => { node.hidden = !editing || !p; });
    $('empty').hidden = !!p; $('content').hidden = !p;
    $('empty-text').textContent = person ? 'لا توجد خطة بعد. افتح تقرير اختبار النطق واضغط «الخطة العلاجية».' : 'اختر طفلًا من الصفحة الرئيسية أولًا.';
    if (!p) { $('source').textContent = ''; return; }
    T.applyGoals(p);
    const view = T.status(p);
    $('source').textContent = `من اختبار النطق ${p.source?.date || ''}`;
    drawSummary(view); drawLadder(view); drawPatterns(view); drawDays(p); drawResults(p);
  }

  function drawSummary(view) {
    const share = view.total ? view.reached / view.total : 0, c = 2 * Math.PI * 42;
    $('ring').innerHTML = `<circle cx="50" cy="50" r="42" stroke="#eef3f7" stroke-width="12" fill="none"/><circle cx="50" cy="50" r="42" stroke="#3f9a6c" stroke-width="12" fill="none" stroke-linecap="round" stroke-dasharray="${(c * share).toFixed(1)} ${c.toFixed(1)}"${share ? '' : ' opacity="0"'}/>`;
    $('ring-text').textContent = `${view.reached}/${view.total}`;
    $('stat-sounds').textContent = digits(view.sounds.length);
    $('stat-letters').textContent = view.sounds.map(s => s.letter).join(' ');
    $('stat-patterns').textContent = digits(view.patterns.length);
    $('stat-week').textContent = digits(T.calendar(view.plan, 7).reduce((n, d) => n + d.done, 0));
  }

  function drawLadder(view) {
    const box = $('ladder'), nodes = [el('div', 'head', '')];
    T.LADDER.forEach(part => { const head = el('div', 'head', `${icon(part)}<span>${T.PARTS[part].name}</span>`); head.setAttribute('role', 'columnheader'); nodes.push(head); });
    view.sounds.forEach((sound, index) => {
      const row = el('div', 'sound', `<b>${sound.letter}</b><small>${STATE[sound.state]}</small>`); row.dataset.state = sound.state; row.setAttribute('role', 'rowheader');
      if (editing) {
        const more = el('button', 'more', icon(MORE)); more.type = 'button'; more.setAttribute('aria-haspopup', 'menu'); more.setAttribute('aria-label', `تعديل الصوت ${sound.letter}`);
        more.onclick = () => menu(more, soundMenu(sound, index));
        row.append(more);
      }
      nodes.push(row);
      for (const step of sound.steps) {
        const cell = el('div', 'cell'); cell.dataset.state = step.state; cell.setAttribute('role', 'cell');
        const where = `${sound.letter} في ${T.PARTS[step.part].name}`;
        if (step.state === 'done') { cell.innerHTML = icon('check'); cell.setAttribute('aria-label', `${where}: تمّ`); }
        else if (step.state === 'now') {
          const open = step.zones.find(z => !z.reached), last = open?.last;
          cell.innerHTML = `<span class="dots">${step.zones.map(z => `<i class="${z.reached ? 'on' : ''}" title="${T.ZONE_NAMES[z.zone]}"></i>`).join('')}</span><span dir="ltr">${last == null ? '—' : `${last}%`}</span>`;
          cell.setAttribute('aria-label', `${where}: الآن، ${step.zones.filter(z => z.reached).length} من ${step.zones.length}${last == null ? '' : `، آخر نتيجة ${last}%`}`);
        } else if (step.state === 'soon') { cell.textContent = 'قريبًا'; }
        else cell.setAttribute('aria-label', `${where}: ${step.state === 'skip' ? 'لا يحتاجها' : 'لاحقًا'}`);
        nodes.push(cell);
      }
    });
    box.replaceChildren(...nodes);
  }
  function soundMenu(sound, index) {
    const at = s => s.sounds.findIndex(x => x.letter === sound.letter);
    const levels = T.LADDER.filter(part => !T.PARTS[part].soon && (part !== 'syllables' || T.SYLLABLE_IDS[sound.letter]));
    return [
      { label: sound.held ? 'متابعة' : 'إيقاف مؤقت', action: () => change(s => { s.sounds[at(s)].held = !sound.held; }) },
      ...(index ? [{ label: 'إلى أول القائمة', action: () => change(s => { s.sounds.unshift(...s.sounds.splice(at(s), 1)); }) }] : []),
      '-',
      ...levels.map(part => ({ label: `البدء من ${T.PARTS[part].name}`, selected: sound.from === part, action: () => change(s => { s.sounds[at(s)].from = part; }) })),
      '-',
      { label: 'حذف من الخطة', danger: true, action: () => change(s => { s.sounds.splice(at(s), 1); }) },
    ];
  }

  function drawPatterns(view) {
    const max = Math.max(1, ...view.patterns.map(p => p.count));
    $('patterns-none').hidden = view.patterns.length > 0;
    $('patterns').replaceChildren(...view.patterns.map(pattern => {
      const row = el('div', 'pattern'); row.dataset.state = pattern.state;
      row.append(el('div', 'pattern-name', `${pattern.name}<small>${pattern.examples.join('  ') || (pattern.added ? 'أضافه المعالج' : '')}</small>`));
      const track = el('div', 'bar-track', `<span class="bar-fill" style="width:${Math.max(8, pattern.count / max * 100)}%"></span><b>${digits(pattern.count)}</b>`);
      track.setAttribute('aria-label', `${pattern.count} أخطاء`); row.append(track);
      const label = `${APPROACH[pattern.approach]}${pattern.state === 'held' ? ' · موقوف' : pattern.state === 'done' ? ' · تمّ' : ''}`;
      if (editing) {
        const pick = el('button', 'pick', `${label}${icon(CHEVRON)}`); pick.type = 'button'; pick.setAttribute('aria-haspopup', 'menu');
        const at = s => s.patterns.findIndex(x => x.id === pattern.id);
        pick.onclick = () => menu(pick, [
          ...Object.entries(APPROACH).map(([id, name]) => ({ label: name, selected: pattern.approach === id, action: () => change(s => { s.patterns[at(s)].approach = id; }) })),
          '-',
          { label: pattern.held ? 'متابعة' : 'إيقاف مؤقت', action: () => change(s => { s.patterns[at(s)].held = !pattern.held; }) },
          { label: 'حذف من الخطة', danger: true, action: () => change(s => { s.patterns.splice(at(s), 1); }) },
        ]);
        row.append(pick);
      } else row.append(el('span', 'approach', `${icon('approaches')}${label}`));
      return row;
    }));
  }

  function drawDays(p) {
    const days = T.calendar(p, 28), nodes = [];
    for (let i = 0; i < 7; i++) nodes.push(el('span', 'wd', WEEKDAYS[(days[0].weekday + i) % 7]));
    for (const d of days) {
      const cell = el('span', `day${d.today ? ' today' : ''}`, digits(d.day));
      cell.dataset.done = String(Math.min(2, d.done)); cell.dataset.started = String(d.started);
      cell.setAttribute('aria-label', `${d.date}: ${d.done ? `${d.done} تدريب` : d.started ? 'بدأ' : 'لا تدريب'}`);
      nodes.push(cell);
    }
    $('days').replaceChildren(...nodes);
    const s = p.settings || {};
    $('days-note').textContent = `${digits((s.activities || 3) * T.MINUTES)} دقيقة · حتى ${digits(s.perDay || 2)} في اليوم`;
    document.querySelectorAll('.seg').forEach(seg => seg.querySelectorAll('button').forEach(b => { b.setAttribute('aria-pressed', String(Number(b.dataset.value) === (s[seg.dataset.setting] || (seg.dataset.setting === 'activities' ? 3 : 2)))); }));
  }
  document.querySelectorAll('.seg').forEach(seg => seg.addEventListener('click', event => {
    const b = event.target.closest('button'); if (!b) return;
    change(p => { p.settings = { ...(p.settings || {}), [seg.dataset.setting]: Number(b.dataset.value) }; });
  }));

  function drawResults(p) {
    const show = v => v == null ? '<span class="muted">—</span>' : v === 'ok' ? '<span class="ok">✓</span>' : `<span class="err">${{ omitted: 'حذف', distorted: 'تشويه', added: 'إضافة' }[v] || v}</span>`;
    $('results').innerHTML = p.sounds.map(s => `<tr><td>${s.letter}</td>${['first', 'middle', 'last'].map(z => `<td>${show(s.said?.[z])}</td>`).join('')}</tr>`).join('');
  }

  /* ---------- Adding ---------- */
  $('add-sound').onclick = () => {
    const p = plan(), have = new Set(p.sounds.map(s => s.letter));
    menu($('add-sound'), Object.keys(T.FEATURES).filter(l => !have.has(l)).map(letter => ({ label: letter, aria: `إضافة ${letter}`, action: () => change(s => {
      s.sounds.push({ letter, said: { first: null, middle: null, last: null }, words: [], from: T.SYLLABLE_IDS[letter] ? 'syllables' : 'words', held: false, added: true });
    }) })), 'letters-menu');
  };
  $('add-pattern').onclick = () => {
    const p = plan(), have = new Set(p.patterns.map(x => x.id));
    menu($('add-pattern'), T.PATTERNS.filter(x => !have.has(x.id)).map(x => ({ label: x.name, action: () => change(s => { s.patterns.push({ id: x.id, name: x.name, count: 0, examples: [], approach: 'pairs', held: false, added: true }); }) })));
  };

  /* ---------- The therapist switch, print and delete ---------- */
  $('therapist').onclick = () => {
    if (editing) { editing = false; T.setTherapist(false); draw(); return; }
    $('gate-code').value = ''; $('gate-error').hidden = true; $('gate').showModal(); $('gate-code').focus();
  };
  $('gate-form').addEventListener('submit', event => {
    if ($('gate-code').value !== '013') { event.preventDefault(); $('gate-error').hidden = false; $('gate-code').select(); return; }
    editing = true; T.setTherapist(true); draw();
  });
  $('gate-cancel').onclick = () => $('gate').close();
  $('print').onclick = () => { document.querySelector('details.detail').open = true; print(); };
  $('delete-plan').onclick = () => $('confirm').showModal();
  $('confirm-no').onclick = () => $('confirm').close();
  $('confirm-yes').onclick = () => { T.remove(child().id); $('confirm').close(); draw(); };

  addEventListener('pageshow', () => { Children.reload?.(); editing = T.therapistOpen(); draw(); });
  addEventListener('storage', event => { if (event.key === T.KEY) draw(); });
  draw();
})();
