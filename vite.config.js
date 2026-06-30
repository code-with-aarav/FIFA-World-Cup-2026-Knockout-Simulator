import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/fifa': {
        target: 'https://api.football-data.org',
        changeOrigin: true,
        rewrite: (path) => '/v4/competitions/WC/matches?stage=knockout'
      }
    }
  }
})
