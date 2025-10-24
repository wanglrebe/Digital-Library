import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',  // ✅ 允许局域网访问
    port: 5173
  }
})