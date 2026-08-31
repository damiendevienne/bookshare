import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    // Keep the shared/local URL stable; Vite may still fall back if occupied.
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:1337",
        changeOrigin: true,
      },
      // Strapi serves locally uploaded media from /uploads (not /api).
      // Proxy it as well so LAN users do not request the file from their own device.
      "/uploads": {
        target: "http://localhost:1337",
        changeOrigin: true,
      },
    },
  },
})
