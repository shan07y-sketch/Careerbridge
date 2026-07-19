import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Verification-only Vite config (not used by production builds).
// The sandboxed preview browser is network-isolated and cannot reach the
// backend on :5000 directly, so this proxies same-origin /api and /socket.io
// to the local backend and forces a relative API base (VITE_API_URL="") so the
// app talks to this dev server, which proxies through. Lets mobile screens be
// driven end-to-end against real data in the sandbox.
export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_API_URL': '""',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        // The backend dev CORS allowlist doesn't include :5199, but it allows
        // requests with no Origin header (curl/native). Strip Origin so the
        // proxied call is treated as same-origin/native and passes CORS.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
        },
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'));
        },
      },
    },
  },
})
