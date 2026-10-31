import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": { target: process.env.API_PROXY_TARGET || "http://backend:5000", changeOrigin: true },
    },
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === "true",
      interval: 1000,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
      ignored: ["**/dist/**", "**/test-results/**", "**/playwright-report/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
