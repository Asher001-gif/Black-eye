import { defineConfig } from 'vite';

export default defineConfig({
  // Relative paths: works on itch.io (iframe), GitHub Pages, or any folder
  base: './',
  build: {
    outDir: 'dist',
    // Old browser support (Chrome 109 and up)
    target: ['chrome109', 'firefox102', 'safari15'],
    chunkSizeWarningLimit: 1200
  }
});
