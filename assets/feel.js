/* Game feel for the practice parts (2026-11). When a word is collected or graded:
   - right: a soft rising chime made in the browser (no sound files, never loud), a small burst of dots at the button,
     and the scene's character gives a small happy hop: the word's picture (words, phrases, sentences, stories) or the
     train's driver (syllables); three right in a row add a second, bigger burst;
   - partial: one soft middle note; «مرة ثانية» / wrong: one low short note and a small nudge, never a buzzer;
   - the star bar and the page dots pop a little when they change.
   Nothing covers the screen or blocks the next tap; with reduced motion only the sounds stay. The grade buttons are
   `.grade.right / .semi / .wrong` in every part, plus الكلمات' collect button and القصص' retelling counters. */
(root => {
  'use strict';
  const doc = root.document; if (!doc) return;
  const calm = () => root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let audio = null, streak = 0;
  function note(frequency, start, length, volume, type = 'sine') {
    try {
      audio ||= new (root.AudioContext || root.webkitAudioContext)(); if (audio.state === 'suspended') void audio.resume();
      const osc = audio.createOscillator(), gain = audio.createGain(), t = audio.currentTime + start;
      osc.type = type; osc.frequency.setValueAtTime(frequency, t);
      gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(volume, t + 0.012); gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
      osc.connect(gain).connect(audio.destination); osc.start(t); osc.stop(t + length + 0.02);
    } catch {}
  }
  const SOUNDS = {
    right: () => { note(1046.5, 0, 0.32, 0.08); note(1318.5, 0.09, 0.42, 0.07); },
    partial: () => note(784, 0, 0.3, 0.06),
    again: () => note(392, 0, 0.22, 0.045, 'triangle'),
  };
  function burst(node, big = false) {
    if (!node || calm()) return;
    const box = node.getBoundingClientRect(), layer = doc.createElement('div'), reach = Math.max(box.width, box.height) * (big ? 0.9 : 0.6) + 18;
    layer.className = 'feel-burst'; layer.setAttribute('aria-hidden', 'true');
    layer.style.left = `${box.left + box.width / 2}px`; layer.style.top = `${box.top + box.height / 2}px`;
    const colours = ['#f59e0b', '#22c55e', '#38bdf8', '#f472b6', '#a78bfa', '#facc15', '#fb7185', '#34d399'];
    (big ? [...colours, ...colours] : colours).forEach((colour, i, all) => {
      const dot = doc.createElement('i'), angle = (i / all.length) * Math.PI * 2, far = big && i % 2 ? reach * 1.3 : reach;
      dot.style.background = colour; layer.append(dot);
      dot.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(angle) * far}px), calc(-50% + ${Math.sin(angle) * far}px)) scale(1)`, opacity: 0 }],
        { duration: big ? 800 : 620, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' });
    });
    doc.body.append(layer); setTimeout(() => layer.remove(), 900);
  }
  // The scene's character: the picture on the word card, or the train's driver.
  const character = () => ['#enc-art', '#card-picture', '#page-picture', '.driver'].map(selector => doc.querySelector(selector)).find(node => node && node.getClientRects().length);
  function play(node, name) { if (!node || calm()) return; node.classList.remove('feel-hop', 'feel-nudge'); void node.getBoundingClientRect(); node.classList.add(name); setTimeout(() => node.classList.remove(name), 700); }
  function react(kind, button) {
    SOUNDS[kind]();
    streak = kind === 'right' ? streak + 1 : 0;
    if (kind === 'right') { burst(button); play(character(), 'feel-hop'); if (streak % 3 === 0) burst(character() || button, true); }
    else if (kind === 'again') play(character(), 'feel-nudge');
  }
  doc.addEventListener('click', event => {
    const button = event.target.closest?.('.grade, #enc-collect');
    if (!button || button.disabled) return;
    const kind = button.id === 'enc-collect' || button.id === 'count-right' || button.classList.contains('right') ? 'right'
      : button.classList.contains('semi') ? 'partial' : button.id === 'count-wrong' || button.classList.contains('wrong') ? 'again' : null;
    if (kind) react(kind, button);
  }, true);
  // The star bar (الكلمات) and the page dots (القصص, المناهج) pop when they change.
  function watch() {
    // (The pop's own class change on the bar itself is not a change of the bar.)
    for (const node of doc.querySelectorAll('#stars, #page-dots, #ap-dots')) new MutationObserver(list => { if (list.some(m => !(m.target === node && m.type === 'attributes'))) play(node, 'feel-pop'); })
      .observe(node, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', watch, { once: true }); else watch();
  root.ArticulationFeel = { react, burst, chime: kind => SOUNDS[kind]?.() };
})(globalThis);
