import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Proxy-Konfiguration für Solr-Anfragen im Entwicklungsmodus
      '/solr': {
        target: 'http://localhost:8983',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
