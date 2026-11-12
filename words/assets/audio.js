/* Web Audio plays after a walk ends, where iOS would block an ordinary audio element. */
window.ArticulationAudio = (() => {
  let context, master, current, noise, recordings = new Set();
  const buffers = new Map();
  /* The release lists which recordings exist, so words without one stay quiet until it is added. */
  function setRecordings(urls) { recordings = new Set(urls.map(url => Number(/(\d+)\.m4a$/.exec(url)?.[1]))); }
  const has = n => recordings.has(n);
  function unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!context && Audio) { context = new Audio(); master = context.createGain(); master.connect(context.destination); }
    if (context && context.state !== 'running') void context.resume().catch(() => {});
  }
  function load(n) {
    if (!buffers.has(n)) {
      const job = fetch(`sounds/${n}.m4a`).then(response => {
        if (!response.ok) throw Error('missing recording');
        return response.arrayBuffer();
      }).then(bytes => new Promise((resolve, reject) => { context.decodeAudioData(bytes, resolve, reject)?.catch?.(() => {}); }));
      buffers.set(n, job);
      job.catch(() => buffers.delete(n));
    }
    return buffers.get(n);
  }
  function stop() {
    if (!current) return;
    const { source, finish } = current;
    current = null;
    try { source.stop(); } catch {}
    finish();
  }
  async function play(n) {
    if (!has(n)) return;
    unlock();
    if (!context) throw Error('no audio');
    stop();
    await context.resume();
    const buffer = await load(n);
    return new Promise(resolve => {
      const source = context.createBufferSource(), item = { source, finish: resolve };
      source.buffer = buffer; source.connect(master);
      source.onended = () => { if (current === item) current = null; resolve(); };
      current = item;
      source.start();
    });
  }
  function warm(numbers) { unlock(); if (context) numbers.filter(has).forEach(n => load(n).catch(() => {})); }

  /* Game sounds use only pure sine notes and softened air, so nothing buzzes. */
  function note(frequency, start, length, volume, glideTo) {
    const oscillator = context.createOscillator(), gain = context.createGain(), at = context.currentTime + start;
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, at);
    if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, at + length);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + .03);
    gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    oscillator.connect(gain); gain.connect(master);
    oscillator.start(at); oscillator.stop(at + length + .02);
  }
  const chime = (frequency, start, volume = .05) => { note(frequency, start, .6, volume); note(frequency * 2, start, .32, volume * .22); };
  function air(length, volume, fromHz, toHz) {
    if (!noise) {
      noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain(), at = context.currentTime;
    source.buffer = noise; source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(fromHz, at);
    filter.frequency.exponentialRampToValueAtTime(toHz, at + length);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(volume, at + length * .35);
    gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    source.connect(filter); filter.connect(gain); gain.connect(master);
    source.start(at); source.stop(at + length + .02);
  }
  const effects = {
    collect: () => [659, 784, 988].forEach((f, i) => chime(f, i * .11)),
    hint: () => { note(880, 0, .24, .03); note(880, .2, .24, .03); },
    jump: () => note(300, 0, .24, .055, 620),
    boing: () => note(620, 0, .3, .05, 340),
    rustle: () => air(.2, .05, 1300, 600),
    whoosh: () => air(1.6, .05, 400, 1200),
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => chime(f, i * .16)),
  };
  function sfx(name) { if (context && context.state === 'running') try { effects[name]?.(); } catch {} }
  return { unlock, setRecordings, has, play, stop, warm, sfx };
})();
