/* Decides what a child plays next, from the therapist's goals or else from the child's report. */
window.ArticulationPlan = (() => {
  const data = window.ArticulationData;
  const TARGET = 80, STREAK = 2;
  const sum = attempt => Object.values(attempt.scores).reduce((total, score) => total + score, 0);
  const size = attempt => Object.keys(attempt.scores).length;
  const percent = attempt => Math.round(sum(attempt) / size(attempt) * 100);
  const attemptsOf = (child, sound, position) => child.progress.attempts.filter(entry => entry.sound === sound && (!position || entry.zone === position));
  const allPositions = data.positions.map(entry => entry.id);

  /* A session only counts towards "reached" when every syllable of that type was graded. */
  function reached(child, sound, position) {
    const whole = attemptsOf(child, sound, position).filter(entry => size(entry) >= data.soundById(sound).words[position].length).slice(-STREAK);
    return whole.length === STREAK && whole.every(entry => percent(entry) >= TARGET);
  }
  const openPositions = (child, sound) => allPositions.filter(position => !reached(child, sound, position));
  const goalSounds = child => data.sounds.filter(sound => child.progress.goals[sound.id]?.length);

  /* Returns { sound, positions } to start at once, or { choose: [sounds] } to show the letter board. */
  function planFor(child) {
    const goals = goalSounds(child);
    if (goals.length === 1) return { sound: goals[0], positions: allPositions.filter(position => child.progress.goals[goals[0].id].includes(position)) };
    if (goals.length > 1) return { choose: goals };
    const recent = [...new Set([...child.progress.attempts].reverse().map(entry => entry.sound))].map(data.soundById);
    for (const sound of recent) { const positions = openPositions(child, sound.id); if (positions.length) return { sound, positions }; }
    return { choose: data.sounds };
  }
  /* What a tap on one letter of the board starts. */
  function planForSound(child, sound) {
    const goal = child.progress.goals[sound.id];
    if (goal?.length) return { sound, positions: allPositions.filter(position => goal.includes(position)) };
    const positions = openPositions(child, sound.id);
    return { sound, positions: positions.length ? positions : allPositions };
  }
  /* A sound's own scenario the first time, then a random one that differs from the last. */
  function scenarioFor(child, sound, random = Math.random) {
    if (!child.progress.played[sound.id]) return sound.scenario;
    const pool = Object.keys(window.ArticulationScenes).filter(id => id !== child.progress.lastScenario);
    return pool[Math.floor(random() * pool.length)];
  }
  return { TARGET, STREAK, sum, size, percent, attemptsOf, reached, openPositions, goalSounds, planFor, planForSound, scenarioFor };
})();
