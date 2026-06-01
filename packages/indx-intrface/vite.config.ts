import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      // Tell it to emit declarations into dist/
      outDir: 'dist',
      // And create a dist/index.d.ts entrypoint for the package.json "types"
      insertTypesEntry: true,
      // Don't re-process the dist folder itself
      exclude: ['dist/**', 'node_modules/**'],
      // Use build tsconfig to avoid path mapping issues
      tsconfigPath: './tsconfig.build.json',
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      // Externalize React (incl. sub-paths like react/jsx-runtime) and every runtime
      // dependency, including @indxsearch/* (systm + its /styles.css subpath, pixl, types).
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^@radix-ui\//,
        /^react-range($|\/)/,
        /^@indxsearch\//,
      ],
    },
  },
});
