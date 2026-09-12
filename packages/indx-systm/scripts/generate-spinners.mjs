#!/usr/bin/env node
// Compiles spinner keyframes authored as pixl-style SVG files into the data and
// CSS the Spinner component renders from.
//
//   spinners/<name>/*.svg             one SVG per frame, played in natural sort
//   (or <name>/keyframes/*.svg)       order (1.svg, 2.svg, ...). A frame with
//                                     no <path>/<rect> is a blank frame.
//   spinners/<name>/config.json       optional: { "delay": <ms per frame>,
//                                                 "pingpong": true }
//
// Output (do not edit by hand):
//   src/components/Spinner/spinners.generated.ts
//   src/components/Spinner/spinners.generated.css

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const spinnersDir = join(root, 'spinners');
const outDir = join(root, 'src', 'components', 'Spinner');

const DEFAULT_DELAY = 100;
const DEFAULT_VIEWBOX = '0 0 7 5';

if (!existsSync(spinnersDir)) {
  console.error(`No spinners directory at ${spinnersDir}`);
  process.exit(1);
}

const names = readdirSync(spinnersDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const spinners = new Map();

// Figma exports pixels either as one merged <path> or as individual <rect>s;
// rects are rewritten as equivalent path segments so a frame is always one path.
// Figma also likes to express bars as rotated rects (transform="rotate(90 x y)"),
// so quarter/half-turn rotations are folded into the coordinates.
function rectToPath(attrs) {
  const attr = (key) => {
    const m = attrs.match(new RegExp(`\\b${key}="([^"]+)"`));
    return m ? parseFloat(m[1]) : 0;
  };
  let [x, y, w, h] = [attr('x'), attr('y'), attr('width'), attr('height')];
  if (!w || !h) return '';

  // matrix(a b c d e f): x' = ax + cy + e, y' = bx + dy + f. Figma uses pure
  // flips (e.g. matrix(1 0 0 -1 tx ty)) and quarter turns; anything axis-aligned
  // ((b,c) or (a,d) zero) maps a rect to a rect — transform two opposite corners
  // and take the bounding box. Skews are not representable on the pixel grid.
  const mat = attrs.match(/transform="matrix\(([-\d. ,]+)\)"/);
  if (mat) {
    const [a, b, c, d, e, f] = mat[1].split(/[ ,]+/).map(parseFloat);
    if ((b === 0 && c === 0) || (a === 0 && d === 0)) {
      const px = (px_, py_) => a * px_ + c * py_ + e;
      const py = (px_, py_) => b * px_ + d * py_ + f;
      const [x1, y1, x2, y2] = [px(x, y), py(x, y), px(x + w, y + h), py(x + w, y + h)];
      return `M${Math.min(x1, x2)} ${Math.min(y1, y2)}H${Math.max(x1, x2)}V${Math.max(y1, y2)}H${Math.min(x1, x2)}V${Math.min(y1, y2)}Z`;
    }
    console.warn(`Skipping rect with non-axis-aligned matrix transform — pixl frames are axis-aligned.`);
    return '';
  }

  const rot = attrs.match(/transform="rotate\((-?\d+(?:\.\d+)?)(?:[ ,]+(-?\d+(?:\.\d+)?)[ ,]+(-?\d+(?:\.\d+)?))?\)"/);
  if (rot) {
    const angle = ((parseFloat(rot[1]) % 360) + 360) % 360;
    const a = rot[2] !== undefined ? parseFloat(rot[2]) : 0;
    const b = rot[3] !== undefined ? parseFloat(rot[3]) : 0;
    if (angle === 90) {
      [x, y, w, h] = [a - (y - b) - h, b + (x - a), h, w];
    } else if (angle === 180) {
      [x, y] = [2 * a - x - w, 2 * b - y - h];
    } else if (angle === 270) {
      [x, y, w, h] = [a + (y - b), b - (x - a) - w, h, w];
    } else if (angle !== 0) {
      console.warn(`Skipping rect with unsupported rotation ${rot[1]}° — pixl frames are axis-aligned.`);
      return '';
    }
  } else if (/transform="/.test(attrs)) {
    console.warn('Skipping rect with unsupported transform — only rotate() is understood.');
    return '';
  }

  return `M${x} ${y}H${x + w}V${y + h}H${x}V${y}Z`;
}

for (const name of names) {
  const nested = join(spinnersDir, name, 'keyframes');
  const keyframesDir = existsSync(nested) ? nested : join(spinnersDir, name);

  const files = readdirSync(keyframesDir)
    .filter((file) => file.endsWith('.svg'))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (files.length === 0) {
    console.warn(`Skipping "${name}": keyframes/ has no .svg files`);
    continue;
  }

  let viewBox = DEFAULT_VIEWBOX;
  const frames = files.map((file) => {
    let svg = readFileSync(join(keyframesDir, file), 'utf8');
    const vb = svg.match(/viewBox="([^"]+)"/);
    if (vb) viewBox = vb[1];
    // Figma exports carry a <defs><clipPath> holding a full-canvas rect — scraping
    // that would paint the whole frame. Defs never contain visible pixels; drop them.
    svg = svg.replace(/<defs>[\s\S]*?<\/defs>/g, '');
    // Frames are pixl-style unions of axis-aligned squares; every visible <path d>
    // and <rect> is merged into one frame drawn with a single fill. White-filled
    // shapes are export artifacts (cutouts/backgrounds), not pixels — skip them.
    const isWhite = (attrs) => /fill="(?:white|#f{3}(?:f{3})?)"/i.test(attrs);
    const paths = [...svg.matchAll(/<path\b([^>]*)>/g)]
      .filter((m) => !isWhite(m[1]))
      .map((m) => m[1].match(/\bd="([^"]+)"/)?.[1] ?? '');
    const rects = [...svg.matchAll(/<rect\b([^/>]*)\/?>/g)]
      .filter((m) => !isWhite(m[1]))
      .map((m) => rectToPath(m[1]));
    return [...paths, ...rects].filter(Boolean).join(' ');
  });

  let delay = DEFAULT_DELAY;
  let pingpong = false;
  const configPath = join(spinnersDir, name, 'config.json');
  if (existsSync(configPath)) {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    if (typeof config.delay === 'number' && config.delay > 0) delay = config.delay;
    pingpong = config.pingpong === true;
  }

  // Ping-pong expands 1,2,3,4 into the loop 1,2,3,4,3,2 — endpoints play once.
  const sequence = pingpong && frames.length > 2 ? [...frames, ...frames.slice(1, -1).reverse()] : frames;

  spinners.set(name, { viewBox, delay, frames: sequence });
}

if (spinners.size === 0) {
  console.error('No spinners found — nothing generated.');
  process.exit(1);
}

const banner = `// AUTO-GENERATED by scripts/generate-spinners.mjs — do not edit.
// Authored keyframes live in spinners/<name>/keyframes/*.svg; re-run
// \`npm run generate:spinners\` after adding or changing frames.`;

const entries = [...spinners.entries()]
  .map(([name, { viewBox, delay, frames }]) => {
    const frameList = frames.map((d) => `      ${JSON.stringify(d)},`).join('\n');
    return `  ${JSON.stringify(name)}: {\n    viewBox: ${JSON.stringify(viewBox)},\n    delay: ${delay},\n    frames: [\n${frameList}\n    ],\n  },`;
  })
  .join('\n');

const ts = `${banner}

export interface SpinnerDef {
  readonly viewBox: string;
  /** Default ms per frame; overridable via the Spinner \`delay\` prop. */
  readonly delay: number;
  /** One pixl-style path per frame; an empty string is a blank frame. */
  readonly frames: readonly string[];
}

export const spinners = {
${entries}
} satisfies Record<string, SpinnerDef>;

export type SpinnerName = keyof typeof spinners;

export const spinnerNames = Object.keys(spinners) as SpinnerName[];
`;

// One @keyframes per distinct frame count: a frame is visible for the first
// 1/N of the cycle (step-end holds it fully on, then hard-cuts off) and the
// component staggers frames with negative animation-delays.
const frameCounts = [...new Set([...spinners.values()].map((s) => s.frames.length))].sort((a, b) => a - b);
const css = `/* AUTO-GENERATED by scripts/generate-spinners.mjs — do not edit. */
${frameCounts
  .map((n) => {
    const cut = +(100 / n).toFixed(4);
    return `@keyframes indx-spinner-${n} {\n  0% { opacity: 1; }\n  ${cut}% { opacity: 0; }\n  100% { opacity: 0; }\n}`;
  })
  .join('\n')}
`;

writeFileSync(join(outDir, 'spinners.generated.ts'), ts);
writeFileSync(join(outDir, 'spinners.generated.css'), css);

// ── Blazor port (Indx.Systm.Blazor) ──────────────────────────────────────────
// Same frames, same keyframes, emitted as a C# data class and a CSS file the
// Razor Spinner component renders from. Written only when the sibling project
// is present (monorepo checkout), so the npm package builds anywhere.
const blazorDir = join(root, '..', '..', '..', 'IndxServer', 'Indx.Systm.Blazor');
if (existsSync(blazorDir)) {
  const csEntries = [...spinners.entries()]
    .map(([name, { viewBox, delay, frames }]) => {
      const frameList = frames.map((d) => `                ${JSON.stringify(d)},`).join('\n');
      return `            [${JSON.stringify(name)}] = new(${JSON.stringify(viewBox)}, ${delay}, new[]\n            {\n${frameList}\n            }),`;
    })
    .join('\n');
  const cs = `// AUTO-GENERATED by indx-react/packages/indx-systm/scripts/generate-spinners.mjs — do not edit.
// Authored keyframes live in indx-react/packages/indx-systm/spinners/<name>/keyframes/*.svg;
// re-run \`npm run generate:spinners\` in that package after adding or changing frames.
// Frames and timing are identical to the React @indxsearch/systm Spinner.

namespace Indx.Systm.Blazor
{
    /// <summary>One spinner: viewBox, default ms per frame, and one pixl-style path per frame
    /// (an empty string is a blank frame).</summary>
    public sealed record SpinnerDef(string ViewBox, int Delay, string[] Frames);

    public static class Spinners
    {
        public static readonly IReadOnlyDictionary<string, SpinnerDef> All = new Dictionary<string, SpinnerDef>
        {
${csEntries}
        };

        public static IEnumerable<string> Names => All.Keys;
    }
}
`;
  writeFileSync(join(blazorDir, 'Spinners.generated.cs'), cs);
  // The keyframes go into indx-systm.css, which every Blazor host already links, inside a
  // marked block that is replaced on each run (no extra <link> per host app).
  const systmCssPath = join(blazorDir, 'wwwroot', 'indx-systm.css');
  const start = '/* ── Spinner keyframes (generated) ── */';
  const end = '/* ── end spinner keyframes ── */';
  const block = `${start}\n${css.replace(/^\/\* AUTO-GENERATED[^\n]*\n/, '')}${end}`;
  let systmCss = readFileSync(systmCssPath, 'utf8');
  const s0 = systmCss.indexOf(start);
  const e0 = systmCss.indexOf(end);
  systmCss = s0 >= 0 && e0 > s0
    ? systmCss.slice(0, s0) + block + systmCss.slice(e0 + end.length)
    : `${systmCss.trimEnd()}\n\n${block}\n`;
  writeFileSync(systmCssPath, systmCss);
  console.log(`Blazor: ${spinners.size} spinners → Indx.Systm.Blazor/Spinners.generated.cs + keyframes in wwwroot/indx-systm.css`);
}

for (const [name, { delay, frames }] of spinners) {
  console.log(`✓ ${name}: ${frames.length} frames @ ${delay}ms`);
}
