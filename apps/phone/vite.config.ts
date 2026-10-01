import {defineConfig} from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// iOS Safari blocks camera access on non-HTTPS pages.
export default defineConfig({
  plugins: [basicSsl()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/ws': {target: 'ws://localhost:8787', ws: true},
    },
  },
});
