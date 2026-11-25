/* Articulation and the clinic system (2026-11). Every page of the app loads this right after children.js and the shared
   accounts.js, before the page's own script:
   - window.ArticulationProgress: the active child, the list, signIn (used by the clinic start screen and «أطفال من
     العيادة»), and the child's intervention plan. The plan is saved with the child in articulation-children-v1, so
     «ملف الطفل» and the clinic sync carry it; saving it also updates the app's plan engine (assets/therapy.js).
   - Each child's summary for the reports page in tools (child.summary): every sound by part, the latest test, the
     patterns, recent sessions and home practice. Made on load and whenever the page is hidden.
   - The standard «حسابات الأطفال» window inside each page's dialog#accounts (the ids the pages use stay the same).
   - One therapist switch for the whole app: the lock in the header (password 013, key articulation-therapist,
     handled by the shared assets/intervention.js). The parts' old switches are hidden; pages hear
     'voc-therapist-change'. Goals and reports buttons show only while it is open.
   - Parents' mode (the clinic start screen with the child's name and number): no articulation test, no reports, no
     approaches; the test, reports, plan and approaches pages send parents back home. */
(root => {
  'use strict';
  const C = root.ArticulationChildren, THERAPIST_KEY = 'articulation-therapist';
  if (!C || !root.document) return;
  const doc = root.document, script = doc.currentScript;
  const BASE = (() => { try { return new URL('..', script.src).href; } catch { return ''; } })();
  const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  // Parents' mode: the clinic start screen (assets/speech-entry.js) opened this device with a child's name and number.
  const isParents = () => read('speech-entry-v1')?.mode === 'parent';
  const svg = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

  // ---- The child, for the plan window, the start screen, the clinic sync and the accounts list ----
  const P = root.ArticulationProgress = {
    active: () => C.active(),
    children: () => C.list(),
    signIn(name) {
      const clean = String(name || '').normalize('NFKC').replace(/\s+/g, ' ').trim().slice(0, 60);
      if (!clean) return null;
      const child = C.add(clean); C.choose(child.id); return child;
    },
    intervention: () => clone(C.active()?.intervention || null),
    saveIntervention(plan) {
      const child = C.active(); if (!child) return false;
      const ok = C.update(child.id, { intervention: clone(plan) });
      try { root.ArticulationTherapy?.fromGoals?.(child.id, (plan?.goals || []).map(goal => goal.id)); } catch (error) { console.error(error); }
      summarize(child.id);
      return ok;
    },
  };
  // The shared accounts file calls the face avatarFor; the app's pages call it avatar.
  if (root.SuiteAccounts && !root.SuiteAccounts.avatar) root.SuiteAccounts.avatar = (child, size) => root.SuiteAccounts.avatarFor(child, size);

  // ---- Summary for the clinic reports page: each sound by part, test, patterns, sessions, home practice ----
  const HOME_PARTS = ['syllables', 'words', 'phrases', 'sentences', 'stories'];
  function summaryOf(childId) {
    const R = root.ArticulationResults, T = root.ArticulationTherapy; if (!R || !T) return null;
    const parts = R.all(childId), sounds = {}, patterns = {}, sessions = [];
    for (const part of parts) {
      for (const sound of part.sounds) {
        const levels = Object.values(sound.levels).filter(Boolean), cell = {
          percent: levels.length ? Math.round(R.mean(levels.map(level => level.percent))) : null,
          reached: levels.length > 0 && levels.every(level => level.reached),
          sessions: part.part === 'test' ? 1 : levels.reduce((n, level) => n + level.sessions, 0),
        };
        if (part.part === 'approaches') patterns[sound.key] = { name: sound.name, ...cell };
        else (sounds[sound.key] ||= {})[part.part] = cell;
      }
      if (part.part !== 'test') for (const session of part.sessions) sessions.push({ date: session.date, part: part.part, percent: session.percent });
    }
    const test = parts.find(part => part.part === 'test'), latest = test?.assessments?.at(-1);
    const home = { sessions: 0, right: 0, again: 0, last: null };
    for (const part of HOME_PARTS) for (const entry of T.recordIn(part, childId)?.progress?.home || []) {
      home.sessions++; home.right += entry.right || 0; home.again += entry.again || 0;
      if (!home.last || entry.date > home.last) home.last = entry.date;
    }
    return {
      v: 1, sounds, patterns,
      test: latest ? { date: latest.date, percent: test.percent, errors: test.sounds.filter(sound => Object.values(sound.levels).some(level => level && !level.reached)).map(sound => sound.letter) } : null,
      sessions: sessions.filter(session => session.date).sort((a, b) => a.date.localeCompare(b.date)).slice(-120),
      home,
    };
  }
  function summarize(only) {
    for (const child of C.list()) {
      if (only && child.id !== only) continue;
      let summary; try { summary = summaryOf(child.id); } catch (error) { console.error(error); continue; }
      // Saved only when something changed (compared without the time stamp; JSON drops the undefined field).
      if (!summary || JSON.stringify(summary) === JSON.stringify(child.summary && { ...child.summary, updated: undefined })) continue;
      C.update(child.id, { summary: { ...summary, updated: new Date().toISOString() } });
    }
  }
  /* A graded round: the therapist's grades are the part's attempts (they make the goal percentages); in parents' mode
     the round is home practice (progress.home: right and «مرة ثانية» counts), shown apart and never in the percentages. */
  function keep(progress, attempt) {
    if (!isParents()) return progress.attempts.push(attempt);
    const scores = Object.values(attempt.scores || {});
    (progress.home ||= []).push({ date: attempt.date, run: attempt.run, sound: attempt.sound, zone: attempt.zone, right: scores.filter(score => score >= 1).length, again: scores.filter(score => score < 1).length });
    return progress.home.length;
  }
  root.ArticulationClinic = { summaryOf, summarize, keep, parents: () => isParents() };

  // ---- The standard accounts window ----
  const CLOSE = svg('<path d="m6 6 12 12M18 6 6 18"/>');
  function standardWindow() {
    const dialog = doc.getElementById('accounts'); if (!dialog || dialog.dataset.standard) return;
    dialog.dataset.standard = '1'; dialog.className = 'suite-account-dialog'; dialog.dir = 'rtl'; dialog.setAttribute('aria-labelledby', 'accounts-title');
    dialog.innerHTML = `<div class="account-head"><h2 id="accounts-title" tabindex="-1">حسابات الأطفال</h2><div class="account-head-tools"><button type="button" data-close aria-label="إغلاق" title="إغلاق">${CLOSE}</button></div></div>`
      + `<form id="account-form" class="account-add" novalidate><label for="child-name">فتح أو إضافة طفل</label><div class="account-add-row"><input id="child-name" name="name" autocomplete="off" maxlength="60" dir="auto" placeholder="اسم الطفل"><button type="submit">دخول / إضافة</button></div></form>`
      + `<p id="account-error" class="account-error" role="alert" hidden></p><div id="account-list"></div>`;
  }

  // ---- One therapist switch, and what shows only while it is open ----
  const therapist = () => { try { return localStorage.getItem(THERAPIST_KEY) === 'on'; } catch { return false; } };
  const PLAN_ICON = svg('<path d="M9 4h6v3H9zM7 5H5v16h14V5h-2"/><path d="M9 12h6M9 16h4"/>');
  function headerButtons() {
    // The page's own header toolbar, in this order (the test page has .header-controls inside its header).
    const host = ['header .tools', 'header .bar-tools', 'header .header-controls', 'body > header'].map(selector => doc.querySelector(selector)).find(Boolean);
    if (!host || host.querySelector('[data-therapist]')) return;
    const make = (attr, label, icon) => { const b = doc.createElement('button'); b.type = 'button'; b.className = 'icon artic-clinic-button'; b.setAttribute(attr, ''); b.setAttribute('aria-label', label); b.title = label; b.innerHTML = icon; return b; };
    const plan = make('data-open-plan', 'خطة التدخل', PLAN_ICON); plan.hidden = !therapist();
    const lock = make('data-therapist', 'وضع المعالج', '');
    const anchor = [...host.children].find(node => node.matches('#account, #accountsButton, .account')) || host.firstElementChild;
    host.insertBefore(plan, anchor); host.insertBefore(lock, plan);
    // The plan window's PDF loads jsPDF from the page's own folder; load the app's copy first.
    plan.addEventListener('click', () => { if (root.jspdf || doc.querySelector('script[data-artic-pdf]')) return; const s = doc.createElement('script'); s.src = BASE + 'assets/vendor/jspdf.umd.min.js'; s.dataset.articPdf = ''; doc.head.append(s); }, true);
  }
  function syncTherapist() { doc.body?.classList.toggle('artic-therapist', therapist()); }
  root.addEventListener('voc-therapist-change', syncTherapist);
  root.addEventListener('storage', event => { if (event.key === THERAPIST_KEY) { syncTherapist(); root.dispatchEvent(new CustomEvent('voc-therapist-change', { detail: { active: therapist() } })); } });

  // ---- Parents' mode ----
  const PAGE = (() => { try { return new URL(location.href).pathname.slice(new URL(BASE).pathname.length); } catch { return ''; } })();
  if (isParents() && /^(test|reports|plan|approaches)\//.test(PAGE)) { location.replace(BASE + 'index.html'); return; }
  // Parents grade with two words: «صح» and «مرة ثانية» (the partial grade is hidden by clinic.css).
  function syncParents() {
    const on = isParents(); doc.body?.classList.toggle('artic-parents', on);
    if (!on) return;
    const relabel = () => { for (const [selector, word] of [['.grade.right:not([id])', 'صح'], ['.grade.wrong:not([id])', 'مرة ثانية']]) doc.querySelectorAll(selector).forEach(button => {
      // Written only when different, so watching the page for new buttons never loops.
      if (button.getAttribute('aria-label') !== word) { button.setAttribute('aria-label', word); button.title = word; }
      const label = button.querySelector('span') || button.appendChild(doc.createElement('span')); if (label.textContent !== word) label.textContent = word;
    }); };
    relabel();
    // Some parts draw their grade buttons later (the syllable train, one set per car).
    new MutationObserver(relabel).observe(doc.body, { childList: true, subtree: true });
  }

  /* The game character (boy or girl) walks in الكلمات and appears in the phrase and story pictures. The accounts window
     has no such choice, so the first part with the games' art asks once, with the game's own portraits. */
  function pickCharacter() {
    const Art = root.ArticulationArt, child = C.active();
    if (!Art?.portrait || !child || child.character || doc.querySelector('dialog[open]') || doc.getElementById('artic-character')) return;
    const box = doc.createElement('dialog'); box.id = 'artic-character'; box.className = 'suite-account-dialog artic-character'; box.dir = 'rtl'; box.setAttribute('aria-labelledby', 'artic-character-title');
    box.innerHTML = `<h2 id="artic-character-title">من يمشي في اللعبة؟</h2><div class="artic-character-row">${[['boy', 'ولد'], ['girl', 'بنت']].map(([kind, word]) => `<button type="button" data-kind="${kind}"><img src="${Art.portrait(kind)}" alt=""><b>${word}</b></button>`).join('')}</div>`;
    box.addEventListener('cancel', event => event.preventDefault());
    box.querySelectorAll('[data-kind]').forEach(button => { button.onclick = () => { C.update(child.id, { character: button.dataset.kind }); box.close(); box.remove(); location.reload(); }; });
    doc.body.append(box); box.showModal();
  }
  root.addEventListener('focus', () => setTimeout(pickCharacter, 300));

  function start() {
    standardWindow(); headerButtons(); syncTherapist(); syncParents();
    setTimeout(pickCharacter, 400);
    doc.getElementById('accounts')?.addEventListener('close', () => setTimeout(pickCharacter, 250));
    summarize();
    doc.addEventListener('visibilitychange', () => { if (doc.hidden) summarize(C.active()?.id); });
    root.addEventListener('pagehide', () => summarize(C.active()?.id));
  }
  if (doc.body) start(); else doc.addEventListener('DOMContentLoaded', start, { once: true });
  // The page's own scripts bind the accounts window by id, so its markup must be in place before them.
  standardWindow();
})(globalThis);
