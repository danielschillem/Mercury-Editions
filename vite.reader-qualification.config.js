import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  root: 'dev/reader-qualification',
  plugins: [react()],
  server: { host: '127.0.0.1', fs: { allow: [process.cwd()] } },
  build: { outDir: '../../dist/reader-qualification', emptyOutDir: true },
});
