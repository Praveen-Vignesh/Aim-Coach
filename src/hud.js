export function createHud() {
  const scoreEl = document.getElementById('hud-score');
  const attemptsEl = document.getElementById('hud-attempts');
  const accuracyEl = document.getElementById('hud-accuracy');
  const avgTimeEl = document.getElementById('hud-avg-time');
  const modeEl = document.getElementById('hud-mode');

  return {
    // Names the running routine and difficulty, so two single-target
    // routines are never mistaken for each other.
    setMode(label) {
      modeEl.textContent = label;
    },

    // Called once per attempt, and once with zeroes when a session starts.
    // clicks counts only attempts that ended in a shot: a target that
    // expired belongs in accuracy but would distort the average time.
    update({ hits, attempts, clicks, totalTimeMs }) {
      const timed = clicks ?? attempts;

      scoreEl.textContent = hits;
      attemptsEl.textContent = attempts;
      accuracyEl.textContent =
        attempts === 0 ? '0%' : `${Math.round((hits / attempts) * 100)}%`;
      avgTimeEl.textContent = timed === 0 ? '0 ms' : `${Math.round(totalTimeMs / timed)} ms`;
    }
  };
}
