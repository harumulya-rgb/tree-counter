import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Respect GITHUB_ACTIONS environment variable to set base path for GitHub Pages
  // while keeping it root '/' for Vercel and other platforms.
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
  const base = isGitHubPages ? '/tree-counter/' : '/';

  return {
    base,
    plugins: [react()],
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            panzoom: ['react-zoom-pan-pinch'],
            pdf: ['jspdf'],
          },
        },
      },
    },
  };
});
