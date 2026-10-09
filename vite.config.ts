import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/alphavantage': {
        target: 'https://www.alphavantage.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/alphavantage/, ''),
      },
      // Setu AA API routes are handled by:
      // - Vercel serverless functions in production (api/setu/*.ts)
      // - Mock data in development (src/utils/setuMockData.ts)
      // No dev proxy needed — setuApi.ts auto-detects dev mode
    }
  }
})

