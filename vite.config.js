import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/tree-counter/',
  plugins: [react()],
  build: {
    sourcemap: false, // Disable source maps in production (security + smaller bundles)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React into its own vendor chunk (cached separately by browsers)
          vendor: ['react', 'react-dom'],
          // Split heavy libraries into separate chunks (only loaded when needed)
          panzoom: ['react-zoom-pan-pinch'],
          pdf: ['jspdf'],
        },
      },
    },
  },
})
