/* The therapist's phrase recordings (sounds/<number>.m4a, added later; until then the game stays silent for that phrase),
   and soft game sounds made only from sine notes and filtered noise. Web Audio keeps playback working on iOS after a tap. */
window.PhraseAudio = (() => {
  let context, master, current, noise;
  const buffers = new Map();
  function unlock() {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!context && Audio) { context = new Audio(); master = context.createGain(); master.connect(context.destination); }
    if (context && context.state !== 'running') void context.resume().catch(() => {});
  }
  function load(url) {
    if (!buffers.has(url)) {
      const job = fetch(url).then(response => { if (!response.ok) throw Error('missing recording'); return response.arrayBuffer(); })
        .then(bytes => new Promise((resolve, reject) => { context.decodeAudioData(bytes, resolve, reject)?.catch?.(() => {}); }));
      buffers.set(url, job);
      job.catch(() => buffers.delete(url));
    }
    return buffers.get(url);
  }
  function stop() {
    if (!current) return;
    const { source, finish } = current;
    current = null;
    try { source.stop(); } catch {}
    finish(false);
  }
  /* Resolves true when the recording played to the end, false when something else stopped it. */
  async function play(url) {
    unlock();
    if (!context) throw Error('no audio');
    stop();
    await context.resume();
    const buffer = await load(url);
    return new Promise(resolve => {
      const source = context.createBufferSource(), item = { source, finish: resolve };
      source.buffer = buffer; source.connect(master);
      source.onended = () => { if (current === item) { current = null; resolve(true); } };
      current = item;
      source.start();
    });
  }
  function warm(urls) { unlock(); if (context) urls.forEach(url => load(url).catch(() => {})); }

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
    if (!noise) { noise = context.createBuffer(1, context.sampleRate, context.sampleRate); const data = noise.getChannelData(0); for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1; }
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain(), at = context.currentTime;
    source.buffer = noise; source.loop = true; filter.type = 'lowpass';
    filter.frequency.setValueAtTime(fromHz, at); filter.frequency.exponentialRampToValueAtTime(toHz, at + length);
    gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(volume, at + length * .35); gain.gain.exponentialRampToValueAtTime(.0001, at + length);
    source.connect(filter); filter.connect(gain); gain.connect(master);
    source.start(at); source.stop(at + length + .02);
  }
  /* Whether a phrase's recording is in the folder yet; asked once per phrase. */
  const found = new Map();
  function has(url) { if (!found.has(url)) found.set(url, fetch(url, { method: 'HEAD', cache: 'no-store' }).then(response => response.ok).catch(() => false)); return found.get(url); }
  const effects = {
    drop: () => { note(150, 0, .22, .08, 70); air(.2, .05, 1200, 300); },
    oops: () => { note(520, 0, .22, .05, 300); note(330, .2, .35, .05, 180); },
    boom: () => { note(90, 0, .6, .12, 40); air(.7, .09, 900, 150); },
    pop: () => { note(700, 0, .1, .04, 1300); air(.25, .03, 3000, 800); },
    whoosh: () => air(1.3, .06, 300, 2200),
    snap: () => note(880, 0, .1, .04),
    swing: () => air(.5, .015, 400, 900),
    toot: () => { note(392, 0, .5, .05); note(494, 0, .5, .035); note(392, .55, .7, .05); note(494, .55, .7, .035); },
    chug: () => air(.18, .04, 900, 400),
    steam: () => air(1.2, .05, 500, 1400),
    tap: () => note(660, 0, .14, .03),
    collect: () => [659, 784, 988].forEach((f, i) => chime(f, i * .11)),
    fanfare: () => [523, 659, 784, 1047].forEach((f, i) => chime(f, i * .16)),
  };
  function sfx(name) { if (context && context.state === 'running') try { effects[name]?.(); } catch {} }
  return { unlock, play, stop, warm, sfx, has };
})();
