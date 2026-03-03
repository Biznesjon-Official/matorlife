import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const buildVersion = Date.now().toString()

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'version-file',
      writeBundle() {
        // Build tugaganda version.json yozish
        fs.writeFileSync(
          path.resolve(__dirname, 'dist/version.json'),
          JSON.stringify({ version: buildVersion })
        );
        // sw.js dagi CACHE_NAME ni yangilash
        const swPath = path.resolve(__dirname, 'dist/sw.js');
        if (fs.existsSync(swPath)) {
          let sw = fs.readFileSync(swPath, 'utf-8');
          sw = sw.replace('mator-life-v4', `mator-life-${buildVersion}`);
          fs.writeFileSync(swPath, sw);
        }
      }
    }
  ],
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: 'localhost',
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})