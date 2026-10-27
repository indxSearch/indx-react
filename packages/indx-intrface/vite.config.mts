import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({
      // Tell it to emit declarations into dist/
      outDir: 'dist',
      // And create a dist/index.d.ts entrypoint for the package.json "types".
      // tsconfig.build.json sets rootDir: 'src' so declarations flatten to dist/*.d.ts
      // (not dist/src/*.d.ts) — matching the package.json "types" path.
      insertTypesEntry: true,
      // Don't re-process the dist folder, and never emit declarations for tests/mocks.
      exclude: ['dist/**', 'node_modules/**', 'src/**/__tests__/**', 'src/**/*.test.*'],
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
