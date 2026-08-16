export function createHud() {
  const scoreEl = document.getElementById('hud-score');
  const attemptsEl = document.getElementById('hud-attempts');
  const accuracyEl = document.getElementById('hud-accuracy');
  const avgTimeEl = document.getElementById('hud-avg-time');

  return {
    // Called once per attempt, and once with zeroes when a session starts.
    update({ hits, attempts, totalTimeMs }) {
      scoreEl.textContent = hits;
      attemptsEl.textContent = attempts;
      accuracyEl.textContent =
        attempts === 0 ? '0%' : `${Math.round((hits / attempts) * 100)}%`;
      avgTimeEl.textContent =
        attempts === 0 ? '0 ms' : `${Math.round(totalTimeMs / attempts)} ms`;
    }
  };
}
