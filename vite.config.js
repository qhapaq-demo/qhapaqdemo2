import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Supabase en su propio chunk
          'supabase': ['@supabase/supabase-js'],
          
          // React y React-DOM juntos
          'vendor': ['react', 'react-dom'],
          
          // Librerías de PDF
          'pdf': ['jspdf', 'jspdf-autotable'],
          
          // Iconos de Lucide
          'icons': ['lucide-react']
        }
      }
    },
    // Aumenta el límite de advertencia a 1000 KB
    chunkSizeWarningLimit: 1000,
    
    // Optimiza el código para producción
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Elimina console.log en producción
      }
    }
  }
})
