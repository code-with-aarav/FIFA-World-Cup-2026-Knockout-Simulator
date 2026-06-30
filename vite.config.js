import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/fifa': {
          target: 'https://api.football-data.org',
          changeOrigin: true,
          rewrite: (path) => '/v4/competitions/WC/matches?stage=knockout',
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              proxyReq.removeHeader('Origin');
              proxyReq.removeHeader('Referer');
              if (env.VITE_FOOTBALL_DATA_API_KEY) {
                proxyReq.setHeader('X-Auth-Token', env.VITE_FOOTBALL_DATA_API_KEY.trim().replace(/['"]/g, ''));
              }
            });
          }
        }
      }
    }
  }
})
