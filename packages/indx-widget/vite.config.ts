import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// One classic script, everything inside it: React, systm, intrface, pixl and the styles (as strings
// the element puts in its shadow root). A classic script, not a module, so any page can load it
// from the Indx server without CORS headers on the file itself.
export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['iife'],
      name: 'IndxSearchWidget',
      fileName: () => 'widget.js',
    },
    // The page-level stylesheets the packages import for an ordinary app land in a CSS file the
    // widget never loads; its styles are the inline strings in its shadow root.
    cssCodeSplit: false,
  },
});
