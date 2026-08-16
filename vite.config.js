import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the built dist/ runs from any static host or subpath.
  base: './',
  build: {
    // Three.js alone exceeds the default 500 kB advisory limit, and it is needed
    // on the first frame, so splitting it out would move bytes without saving any.
    chunkSizeWarningLimit: 800
  }
});
