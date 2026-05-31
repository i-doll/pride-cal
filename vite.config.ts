import { defineConfig } from 'vite';

// GitHub Pages project sites are served from /<repo>/. CI sets BASE_PATH=/pride-cal/.
// Locally it is unset, so the app runs at the root. Vite requires a trailing slash.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  build: {
    outDir: 'dist',
    target: 'es2022',
  },
});
