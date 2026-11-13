/* Today's session inside a part. When the home page opens a part for one of today's activities (its address ends in
   #today), the part shows that activity with one big play button (the tap also lets sound play), a small ring fills
   gently over the activity's five minutes, and when the round ends the part's result window gets the session's stars
   and the way on: the next activity, or home when the session is over.
   A part calls offer(part, start) once it is ready, with start(activity) opening that sound (or pattern) and short goal,
   and done(part, id, zones) when a round ends. Both do nothing when the child has no plan. Needs assets/therapy.js. */
window.ArticulationToday = (() => {
  const T = window.ArticulationTherapy;
  const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${T?.ICONS[name] || ''}</svg>`;
  let timer = null;

  function offer(part, start) {
    if (!T || !/^#today/.test(location.hash)) return false;
    history.replaceState(history.state, '', location.pathname + location.search);
    const activity = T.current();
    if (!activity || activity.part !== part) return false;
    const label = T.label(activity), layer = document.createElement('div');
    layer.className = 'today-offer'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-label', 'تدريب اليوم');
    layer.innerHTML = `<div class="today-card"><p class="today-kicker">${svg('star')}<span>تدريب اليوم</span></p><b class="today-target${[...label.target].length > 2 ? ' long' : ''}" dir="rtl">${label.target}</b><p class="today-what">${label.detail}</p><button type="button" class="today-play" aria-label="ابدأ">${svg('play')}</button><button type="button" class="today-later">ليس الآن</button></div>`;
    document.body.append(layer);
    layer.querySelector('.today-play').onclick = () => { layer.remove(); startTimer(activity.minutes || T.MINUTES); start(activity); };
    layer.querySelector('.today-later').onclick = () => layer.remove();
    layer.querySelector('.today-play').focus({ preventScroll: true });
    return true;
  }

  /* A quiet ring in the corner; when the time is over it turns gold. Nothing stops the child. */
  function startTimer(minutes) {
    stopTimer();
    const ring = document.createElement('div');
    ring.className = 'today-timer'; ring.setAttribute('role', 'timer'); ring.setAttribute('aria-label', `${minutes} دقائق`);
    ring.innerHTML = '<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="14" class="track"/><circle cx="18" cy="18" r="14" class="fill" pathLength="100" stroke-dasharray="0 100"/></svg>';
    document.body.append(ring);
    const began = Date.now(), total = minutes * 60000, fill = ring.querySelector('.fill');
    const tick = () => {
      const share = Math.min(1, (Date.now() - began) / total);
      fill.setAttribute('stroke-dasharray', `${(share * 100).toFixed(1)} 100`);
      if (share >= 1) { ring.classList.add('over'); clearInterval(timer?.id); }
    };
    timer = { ring, id: setInterval(tick, 1000) }; tick();
  }
  function stopTimer() { if (!timer) return; clearInterval(timer.id); timer.ring.remove(); timer = null; }

  function done(part, id, zones) {
    const panel = document.querySelector('#done .panel');
    panel?.querySelector('.today-strip')?.remove();
    const result = T?.done(part, id, zones);
    if (!result) return null;
    stopTimer();
    if (panel) show(panel, result);
    return result;
  }
  function show(panel, { session, next }) {
    const strip = document.createElement('div'), count = session.activities.filter(a => a.done).length;
    strip.className = 'today-strip';
    strip.innerHTML = `<div class="today-stars" role="img" aria-label="تدريب اليوم: ${count} من ${session.activities.length}">${session.activities.map(a => `<i class="${a.done ? 'on' : ''}">${svg('star')}</i>`).join('')}</div>`;
    const go = document.createElement('button'), child = window.ArticulationChildren?.active();
    go.type = 'button'; go.className = 'today-next';
    if (next) {
      const l = T.label(next);
      go.innerHTML = `<span>التالي</span><b dir="rtl"${[...l.target].length > 2 ? ' class="long"' : ''}>${l.target}</b>${svg('play')}`; go.setAttribute('aria-label', `النشاط التالي: ${l.title} ${l.target}`);
      go.onclick = () => { const href = child && T.begin(child.id, next.key); location.href = href || T.url('index.html'); };
    } else {
      go.innerHTML = `${svg('home')}<span>انتهى تدريب اليوم</span>`;
      go.onclick = () => { location.href = T.url('index.html'); };
    }
    strip.append(go);
    const row = panel.querySelector('.row');
    panel.insertBefore(strip, row);
    panel.querySelector('#done-again')?.addEventListener('click', () => strip.remove(), { once: true });
  }
  return { offer, done, startTimer, stopTimer };
})();
