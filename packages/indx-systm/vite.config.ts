import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';

/** A page stylesheet as a shadow root's: `:root` and a bare `body` selector become `:host`. */
export function toShadow(css: string): string {
  return css
    .replace(/:root\b/g, ':host')
    .replace(/(^|[\s,}])body(?=\s*[{,])/g, '$1:host');
}

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
    }),
    {
      name: 'copy-global-css',
      closeBundle() {
        // Copy cursors.css to dist after build
        const cursorsSource = resolve(__dirname, 'src/globals/cursors.css');
        const cursorsDest = resolve(__dirname, 'dist/cursors.css');
        mkdirSync(dirname(cursorsDest), { recursive: true });
        copyFileSync(cursorsSource, cursorsDest);

        // Copy patterns.css to dist after build
        const patternsSource = resolve(__dirname, 'src/globals/patterns.css');
        const patternsDest = resolve(__dirname, 'dist/patterns.css');
        copyFileSync(patternsSource, patternsDest);

        // The same styles for a shadow root (the Indx widget, systm embedded in another site):
        // the tokens and the page rules sit on :root and body, which match nothing inside one, so
        // they move to :host. Everything else is the same stylesheet.
        const systm = readFileSync(resolve(__dirname, 'dist/systm.css'), 'utf8');
        writeFileSync(resolve(__dirname, 'dist/systm.shadow.css'), toShadow(systm));
      }
    }
  ],
  build: {
    lib: {
      entry: 'src/index.tsx',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      // Externalize React (incl. sub-paths like react/jsx-runtime) and every runtime
      // dependency. Bundling a CJS dep (react-range, @indxsearch/pixl) would leave a
      // `require("react")` that Rolldown can't rewrite for ESM and throws in the browser.
      // Only the package's own source + relative CSS/assets get bundled.
      external: [
        /^react($|\/)/,
        /^react-dom($|\/)/,
        /^@radix-ui\//,
        /^react-range($|\/)/,
        /^@indxsearch\//,
      ],
      output: {
        assetFileNames: (assetInfo) => {
          // Keep SVG and PNG images in assets folder with their original names
          if (assetInfo.name?.endsWith('.png') || assetInfo.name?.endsWith('.svg')) {
            return 'assets/[name][extname]';
          }
          // Keep CSS with original name
          return '[name][extname]';
        },
      },
    },
  },
});
