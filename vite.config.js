import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Augmente la limite d'avertissement si nécessaire (optionnel)
    chunkSizeWarningLimit: 1000, 
    rollupOptions: {
      output: {
        // Sépare manuellement les grosses librairies pour alléger le chargement initial
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) {
              return 'firebase'; // Crée un fichier séparé pour Firebase
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion'; // Crée un fichier séparé pour Framer Motion
            }
            if (id.includes('lucide-react')) {
              return 'icons'; // Crée un fichier séparé pour les icônes
            }
            return 'vendor'; // Le reste va dans 'vendor'
          }
        }
      }
    }
  }
})