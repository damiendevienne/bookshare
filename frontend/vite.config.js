import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from './package.json'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'bookmybook-app-meta',
      transformIndexHtml: (html) => html
        .replaceAll('%APP_NAME%', packageJson.appName)
        .replaceAll('%APP_VERSION%', packageJson.version),
    },
    react(),
  ],
  server: {
    host: "0.0.0.0",
    // Allow temporary public LocalTunnel URLs used for friend testing.
    allowedHosts: [".loca.lt"],
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
