import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: {
    game: resolve(process.cwd(), 'index.html'),
    studio: resolve(process.cwd(), 'warrior-studio.html'),
    compare: resolve(process.cwd(), 'warrior-compare.html'),
  } } },
  server: { host: '0.0.0.0', port: 3000 },
  preview: { host: '0.0.0.0', port: 3000 },
});
