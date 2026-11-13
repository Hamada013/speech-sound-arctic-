/* The side bar: from any page, a menu button next to the home icon opens a list on the right with the active child, the
   home page, every part (the current one marked; parts outside the plan locked unless the therapist opened them), the
   reports and the plan. It finds its place by itself: after a.home-link (the parts), a.app-home-link (the test), the
   bar's home icon (plan, reports), or in the home page's header. Needs assets/therapy.js and assets/children.js. */
(() => {
  const T = window.ArticulationTherapy, Children = window.ArticulationChildren;
  if (!T) return;
  const ITEMS = [
    ['home', 'الرئيسية', 'index.html'], ['test', 'اختبار النطق', 'test/index.html'], ['syllables', 'المقاطع', 'syllable/syllable.html'], ['words', 'الكلمات', 'words/index.html'],
    ['phrases', 'العبارات', 'phrases/index.html'], ['sentences', 'الجمل', 'sentences/index.html'], ['stories', 'القصص', 'stories/index.html'], ['approaches', 'المناهج', 'approaches/index.html'],
    '-', ['reports', 'التقارير', 'reports/index.html'], ['plan', 'الخطة العلاجية', 'plan/index.html'],
  ];
  const EXTRA = {
    home: T.ICONS.home, test: '<path d="M9 4h6v3H9zM7 5H5v16h14V5h-2"/><path d="m9 13 2 2 4-4"/>', reports: '<path d="M4 20V10m6 10V4m6 16v-7m6 7H2"/>',
  };
  const icon = id => `<svg viewBox="0 0 24 24" aria-hidden="true">${EXTRA[id] || T.ICONS[id]}</svg>`;
  const MENU = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  const here = new URL(location.href).pathname.replace(/index\.html$/, '');
  const same = path => new URL(T.url(path)).pathname.replace(/index\.html$/, '') === here;

  function anchor() {
    const link = document.querySelector('a.home-link, a.app-home-link, .bar a.icon[href="../index.html"]');
    if (link) return { at: link, where: 'afterend' };
    const reports = document.querySelector('header .reports-link');
    if (reports) return { at: reports, where: 'beforebegin' };
    const header = document.querySelector('body > header');
    return header ? { at: header, where: 'afterbegin' } : null;
  }
  const place = anchor();
  if (!place) return;
  const button = document.createElement('button');
  button.type = 'button'; button.className = `icon nav-open${place.at.classList.contains('app-home-link') ? ' on-test' : ''}`;
  button.setAttribute('aria-label', 'القائمة'); button.title = 'القائمة'; button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', 'false');
  button.innerHTML = MENU;
  place.at.insertAdjacentElement(place.where, button);

  const panel = document.createElement('dialog');
  panel.className = 'nav-panel'; panel.setAttribute('aria-label', 'التنقل في التطبيق');
  document.body.append(panel);

  function draw() {
    const child = Children?.active(), info = child ? T.day(child.id) : null, open = !info || T.therapistOpen(), parts = info ? T.partsOf(info.view) : null;
    const head = document.createElement('div'); head.className = 'nav-head';
    const who = document.createElement('div'); who.className = 'nav-who';
    if (child && window.SuiteAccounts) who.append(window.SuiteAccounts.avatar(child, 'small'));
    const name = document.createElement('b'); name.textContent = child ? child.name : 'لا يوجد طفل مختار'; who.append(name);
    const close = document.createElement('button'); close.type = 'button'; close.className = 'icon nav-close'; close.setAttribute('aria-label', 'إغلاق');
    close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'; close.onclick = () => shut();
    head.append(who, close);
    const list = document.createElement('ul'); list.className = 'nav-list';
    for (const item of ITEMS) {
      if (item === '-') { list.append(Object.assign(document.createElement('li'), { className: 'nav-sep', role: 'separator' })); continue; }
      const [id, label, path] = item;
      if (id === 'plan' && !info) continue;
      const li = document.createElement('li'), link = document.createElement('a'), locked = !!info && !open && id !== 'home' && id !== 'reports' && id !== 'plan' && !parts.has(id);
      link.href = T.url(path); link.innerHTML = `${icon(id)}<span>${label}</span>${locked ? `<i class="nav-lock">${icon('lock')}</i>` : ''}`;
      if (same(path)) { link.setAttribute('aria-current', 'page'); link.classList.add('current'); }
      if (locked) { link.classList.add('locked'); link.setAttribute('aria-disabled', 'true'); link.removeAttribute('href'); link.setAttribute('aria-description', 'مقفل: خارج الخطة. يفتحه المعالج من الصفحة الرئيسية'); }
      li.append(link); list.append(li);
    }
    panel.replaceChildren(head, list);
  }
  function shut() { panel.classList.remove('in'); setTimeout(() => { if (panel.open) panel.close(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200); button.setAttribute('aria-expanded', 'false'); }
  button.onclick = () => { draw(); panel.showModal(); requestAnimationFrame(() => panel.classList.add('in')); button.setAttribute('aria-expanded', 'true'); panel.querySelector('.current, a[href]')?.focus({ preventScroll: true }); };
  panel.addEventListener('click', event => { if (event.target === panel) shut(); });
  panel.addEventListener('cancel', event => { event.preventDefault(); shut(); });
  panel.addEventListener('close', () => { panel.classList.remove('in'); button.setAttribute('aria-expanded', 'false'); });
})();
