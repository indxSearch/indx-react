import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    fs: {
      allow: ['..', '../..'],
    },
  },
  resolve: {
    preserveSymlinks: false,
  },
  optimizeDeps: {
    exclude: ['@indxsearch/systm', '@indxsearch/intrface', '@indxsearch/pixl', '@indxsearch/indx-types'],
    // The excluded workspace packages import these lazily (only discovered when the
    // browser first requests them), which makes the optimizer re-run mid-session and
    // bump the ?v= hash — immutable-cached chunks from the earlier wave then 404 on
    // minified exports. Listing them here makes the first optimization run complete.
    include: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'react-range',
      '@radix-ui/react-dialog',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-tooltip',
    ],
  },
});
