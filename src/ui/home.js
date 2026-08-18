import { ROUTINES } from '../routines/index.js';
import { DIFFICULTY_LEVELS } from '../difficulty.js';
import { createSensitivity } from '../sensitivity.js';

// Owns the home and pause screens: renders the routine catalogue and settings,
// writes every change straight back into the settings store, and switches
// between the three screen states.
export function createHome({ settings, onStart, onResume, onMenu }) {
  const homeScreen = document.getElementById('home');
  const pauseScreen = document.getElementById('pause');
  const modeGrid = document.getElementById('mode-grid');
  const difficultyRow = document.getElementById('difficulty-row');
  const dpiInput = document.getElementById('dpi-input');
  const sensInput = document.getElementById('sens-input');
  const edpiReadout = document.getElementById('edpi-readout');
  const cm360Readout = document.getElementById('cm360-readout');

  const modeButtons = new Map();
  const difficultyButtons = new Map();

  for (const routine of ROUTINES) {
    const tile = document.createElement('button');
    tile.className = 'mode-tile';
    tile.disabled = routine.available === false;
    tile.innerHTML =
      `<span class="mode-name">${routine.name}</span>` +
      `<span class="mode-blurb">${routine.blurb}</span>` +
      `<span class="mode-tag">${routine.available ? 'Ready' : `Phase ${routine.phase}`}</span>`;
    tile.addEventListener('click', () => settings.update({ routine: routine.id }));
    modeGrid.appendChild(tile);
    modeButtons.set(routine.id, tile);
  }

  for (const level of DIFFICULTY_LEVELS) {
    const button = document.createElement('button');
    button.className = 'segment';
    button.textContent = level;
    button.addEventListener('click', () => settings.update({ difficulty: level }));
    difficultyRow.appendChild(button);
    difficultyButtons.set(level, button);
  }

  function renderReadout(dpi, sens) {
    if (Number.isFinite(dpi) === false || Number.isFinite(sens) === false || dpi <= 0 || sens <= 0) {
      edpiReadout.textContent = '—';
      cm360Readout.textContent = '—';
      return;
    }

    const sensitivity = createSensitivity({ dpi, sens });
    edpiReadout.textContent = Math.round(sensitivity.eDPI);
    cm360Readout.textContent = `${sensitivity.cm360.toFixed(1)} cm`;
  }

  // Preview while typing, without committing: clamping a half-typed "8" on its
  // way to "800" would fight the player's keystrokes. Commit lands on change.
  dpiInput.addEventListener('input', () =>
    renderReadout(Number(dpiInput.value), Number(sensInput.value))
  );
  sensInput.addEventListener('input', () =>
    renderReadout(Number(dpiInput.value), Number(sensInput.value))
  );

  const commit = () =>
    settings.update({ dpi: Number(dpiInput.value), sens: Number(sensInput.value) });

  dpiInput.addEventListener('change', commit);
  sensInput.addEventListener('change', commit);

  document.getElementById('start-button').addEventListener('click', onStart);
  document.getElementById('resume-button').addEventListener('click', onResume);
  document.getElementById('menu-button').addEventListener('click', onMenu);

  return {
    render(state) {
      for (const [id, tile] of modeButtons) {
        tile.classList.toggle('selected', id === state.routine);
      }
      for (const [level, button] of difficultyButtons) {
        button.classList.toggle('selected', level === state.difficulty);
      }

      dpiInput.value = state.dpi;
      sensInput.value = state.sens;
      renderReadout(state.dpi, state.sens);
    },

    setScreen(screen) {
      homeScreen.classList.toggle('hidden', screen !== 'home');
      pauseScreen.classList.toggle('hidden', screen !== 'paused');
    }
  };
}
