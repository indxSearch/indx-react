import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// pixl 1.6.0 names four icons after globals (Object, Array, String, Number) and declares each as a
// module-level const. The package is not "type": "module", so vitest transforms it instead of
// loading it natively, and the transform's own `Object.defineProperty` then meets the icon's
// `const Object` before it is initialised. Any test that renders a component with a pixl icon from
// this package fails to load. Renaming the local here is test-only; the fix belongs in pixl's
// generator (convert-icons.js: a local name that is not a global, exported under the icon's name).
const pixlGlobalNames = {
  name: 'pixl-global-names',
  transform(code: string, id: string) {
    const m = id.match(/@indxsearch\/pixl\/dist\/(Object|Array|String|Number)\.js$/);
    if (!m) return null;
    return code.replace(new RegExp(`\\b${m[1]}\\b(?=\\s*=|;\\s*$)`, 'gm'), `${m[1]}Icon`);
  },
};

export default defineConfig({
  plugins: [react(), pixlGlobalNames],
  resolve: {
    alias: {
      '@indxsearch/indx-types': fileURLToPath(new URL('../indx-types/src', import.meta.url)),
      '@indxsearch/systm': fileURLToPath(new URL('../indx-systm/src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
});
