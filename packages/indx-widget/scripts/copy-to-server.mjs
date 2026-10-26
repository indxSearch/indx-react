// Copies the built widget to IndxServer, which serves it at /widget/widget.js: each server then
// serves the widget it was released with. Run after `npm run build`, before a server release.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const from = resolve(here, '../dist/widget.js');
const to = resolve(here, '../../../../IndxServer/wwwroot/widget/widget.js');
mkdirSync(dirname(to), { recursive: true });
copyFileSync(from, to);
console.log(`copied ${from} -> ${to}`);
