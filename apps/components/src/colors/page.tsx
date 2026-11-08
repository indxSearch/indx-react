import { useState, type CSSProperties, type ReactNode } from 'react';
import { Table, SliderField, SegmentedControl } from '@indxsearch/systm';
import styles from './page.module.css';

// Colours (Nov 2026 mockup). The levels and the accents as they are, and a proposed set of eight
// data-viz colours for the places where greys run out of nuance: a dataset's memory, its field
// roles, a chart with more than two series. Every accent here is drawn at --accent-strength:
// color-mix toward the theme's lv0, so a whole page can dim its accents in one place.
//
// The eight were picked by the dataviz validator (OKLCH lightness band per theme, chroma floor,
// colourblind separation between neighbours, contrast against lv0), in the one order that also
// keeps the first three apart in every pairing, for charts where any two can meet (scatter).
// Light: worst neighbours ΔE 14.5 colourblind, 16.2 normal; gold is 2.7:1 on white, so a gold
// mark needs a visible label. Dark: 14.0 / 15.8, all at least 3:1 on lv0.

type Theme = 'light' | 'dark';

const LEVELS: Record<Theme, string[]> = {
  light: ['#FFFFFF', '#FBFBFB', '#EFEFEF', '#CFCFCF', '#757575', '#4A4A50', '#1A1A21', '#121215', '#080809'],
  dark: ['#080809', '#121215', '#1A1A21', '#393941', '#565661', '#8F8F97', '#EFEFEF', '#FBFBFB', '#FFFFFF'],
};

interface Accent { token: string; light: string; dark: string; use: string }

const ACCENTS: Accent[] = [
  { token: '--CSignal', light: '#FF4238', dark: '#FF4238', use: 'Errors, destructive actions, the notifications bell' },
  { token: '--CWarning', light: '#FFC107', dark: '#FFC107', use: 'Warning alerts, warning marks on a slider' },
  { token: '--CLightBlue', light: '#6B9EFF', dark: '#6B9EFF', use: 'Info alerts, info badges on tabs (Observr), chart markers' },
  { token: '--CPureBlue', light: '#0000FF', dark: '#0000FF', use: 'A full progress bar; positive and confirmed on light' },
  { token: '--CTeal', light: '#72F5C6', dark: '#72F5C6', use: 'Success alerts, chat; positive and confirmed on dark' },
];

const SEMANTIC: Accent[] = [
  { token: '--CPositive', light: '#0000FF', dark: '#72F5C6', use: 'On / enabled: ToggleSwitch. Pure blue on light, teal on dark' },
  { token: '--CConfirmed', light: '#0000FF', dark: '#72F5C6', use: 'Confirmed / success (Blazor only so far)' },
];

interface Viz { token: string; name: string; light: string; dark: string }

const VIZ: Viz[] = [
  { token: '--viz1', name: 'Blue', light: '#2C6BE7', dark: '#3D7EFC' },
  { token: '--viz2', name: 'Orange', light: '#E15F0A', dark: '#E15F0A' },
  { token: '--viz3', name: 'Pink', light: '#D14186', dark: '#D8488C' },
  { token: '--viz4', name: 'Gold', light: '#C79608', dark: '#BB8D07' },
  { token: '--viz5', name: 'Cyan', light: '#078EAD', dark: '#049CBD' },
  { token: '--viz6', name: 'Lime', light: '#699700', dark: '#73A40A' },
  { token: '--viz7', name: 'Violet', light: '#7A42CA', dark: '#915CE5' },
  { token: '--viz8', name: 'Jade', light: '#019D7E', dark: '#0DAB89' },
];

// ---- colour arithmetic, for the hex and contrast shown under a dimmed swatch ----

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const rgbOf = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);

function toOklab(hex: string) {
  const [r, g, b] = rgbOf(hex).map(toLinear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}

function fromOklab([L, a, b]: number[]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return '#' + rgb.map(c => Math.round(Math.min(1, Math.max(0, toGamma(c))) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/** What color-mix(in oklab, c p%, surface) gives. */
function mix(hex: string, surface: string, p: number) {
  const x = toOklab(hex), y = toOklab(surface);
  return fromOklab(x.map((v, i) => v * p + y[i] * (1 - p)));
}

function contrast(a: string, b: string) {
  const lum = (h: string) => { const [r, g, bl] = rgbOf(h).map(toLinear); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// ---- pieces ----

/** The same content twice, in a light and a dark panel, each with its own levels and accents. */
function ThemePair({ children }: { children: (theme: Theme) => ReactNode }) {
  return (
    <div className={styles.pair}>
      {(['light', 'dark'] as const).map(t => (
        <div key={t} className={`${styles.panel} ${styles[t]}`}>
          <span className={styles.panelName}>{t === 'light' ? 'Light' : 'Dark'}</span>
          {children(t)}
        </div>
      ))}
    </div>
  );
}

function Swatch({ color, theme, strength, label, sub }: { color: string; theme: Theme; strength: number; label: string; sub?: string }) {
  const surface = LEVELS[theme][0];
  const shown = mix(color, surface, strength / 100);
  const ratio = contrast(shown, surface);
  return (
    <div className={styles.swatch}>
      <span className={styles.chip} style={{ '--c': color } as CSSProperties} />
      <span className={styles.swatchName}>{label}</span>
      <span className={styles.swatchHex}>{shown}</span>
      <span className={styles.swatchHex}>{ratio.toFixed(1)}:1{sub ? ` · ${sub}` : ''}</span>
    </div>
  );
}

// ---- the datasets example ----

const DATASETS = [
  { name: 'ecom', records: '412,880', state: 'Ready', mem: [380, 210, 64, 0] },
  { name: 'tmdb23k', records: '23,439', state: 'Ready', mem: [96, 58, 12, 140] },
  { name: 'boligmappa', records: '1,204,551', state: 'Hibernated', mem: [0, 0, 0, 0] },
  { name: 'pokedex', records: '801', state: 'Rebuilding', mem: [4, 3, 1, 0] },
];
const MEM_PARTS = ['Index', 'Records', 'Filters', 'Vectors'];

const ROLES = [
  { name: 'searchable', n: 6 },
  { name: 'filterable', n: 9 },
  { name: 'facetable', n: 4 },
  { name: 'preloaded', n: 2 },
];

type Look = 'grey' | 'colour';

/** Fill for part i: greys by level, or the data-viz slots in order from `first`. One page, one
 *  meaning per colour: memory's parts take slots 1 to 4, field roles 5 to 8. */
const fillOf = (look: Look, i: number, first = 1) => (look === 'grey' ? `var(--lv${[6, 5, 4, 3][i]})` : `var(--viz${first + i}s)`);

const STATE_DOT: Record<string, string> = { Ready: 'var(--CPositiveS)', Hibernated: 'var(--lv4)', Rebuilding: 'var(--CLightBlueS)' };

function DatasetsExample({ look }: { look: Look }) {
  const parts = MEM_PARTS.map((_, i) => DATASETS.reduce((s, d) => s + d.mem[i], 0));
  const total = parts.reduce((a, b) => a + b, 0);
  const roleTotal = ROLES.reduce((s, r) => s + r.n, 0);
  return (
    <div className={styles.example}>
      <div className={styles.exampleBlock}>
        <span className={styles.exampleTitle}>Memory, the team</span>
        <div className={styles.stack} role="img" aria-label="Memory by part">
          {parts.map((v, i) => (
            <span key={MEM_PARTS[i]} className={styles.segment} style={{ flexGrow: v, background: fillOf(look, i) }} title={`${MEM_PARTS[i]}: ${v} MB`} />
          ))}
        </div>
        <div className={styles.legend}>
          {MEM_PARTS.map((p, i) => (
            <span key={p} className={styles.legendItem}><span className={styles.legendMark} style={{ background: fillOf(look, i) }} />{p} {parts[i]} MB</span>
          ))}
          <span className={styles.legendEnd}>{total.toLocaleString('en')} MB</span>
        </div>
      </div>

      {DATASETS.map(d => {
        const sum = d.mem.reduce((a, b) => a + b, 0);
        return (
          <div key={d.name} className={styles.card}>
            <div className={styles.cardHead}>
              <span className={styles.cardName}>{d.name}</span>
              <span className={styles.state}>
                <span className={styles.stateDot} style={{ background: look === 'grey' ? 'var(--lv5)' : STATE_DOT[d.state] }} />
                {d.state}
              </span>
            </div>
            <div className={styles.cardFacts}>
              <span>{d.records} records</span>
              <span>{sum > 0 ? `${sum} MB` : 'on disk'}</span>
            </div>
            {sum > 0 && (
              <div className={styles.stackThin}>
                {d.mem.map((v, i) => v > 0 && <span key={i} className={styles.segment} style={{ flexGrow: v, background: fillOf(look, i) }} />)}
              </div>
            )}
          </div>
        );
      })}

      <div className={styles.exampleBlock}>
        <span className={styles.exampleTitle}>Field roles, ecom</span>
        <div className={styles.stack}>
          {ROLES.map((r, i) => <span key={r.name} className={styles.segment} style={{ flexGrow: r.n, background: fillOf(look, i, 5) }} title={`${r.name}: ${r.n}`} />)}
        </div>
        <div className={styles.legend}>
          {ROLES.map((r, i) => (
            <span key={r.name} className={styles.legendItem}><span className={styles.legendMark} style={{ background: fillOf(look, i, 5) }} />{r.name} {r.n}</span>
          ))}
          <span className={styles.legendEnd}>{roleTotal} roles</span>
        </div>
      </div>
    </div>
  );
}

// ---- page ----

export default function ColorsPage() {
  const [strength, setStrength] = useState(100);
  const [look, setLook] = useState<Look>('colour');

  return (
    <div className={styles.container} style={{ '--accent-strength': `${strength}%` } as CSSProperties}>
      <h1>Colours</h1>
      <p className={styles.lead}>
        The nine levels carry the interface. The accents mark state. The data-viz set is a proposal, for the charts
        and summaries where greys run out.
      </p>

      <div className={styles.controls}>
        <div className={styles.strength}>
          <span className={styles.controlLabel}>Accent strength</span>
          <SliderField aria-label="Accent strength" value={strength} onChange={setStrength} min={30} max={100} step={5} format={(v: number) => `${v}%`} />
        </div>
        <p className={styles.note}>
          Every accent on this page is drawn as <code>color-mix(in oklab, accent var(--accent-strength), var(--lv0))</code>.
          Lower strength moves it toward the background, so it dims on light and on dark alike. The hex and the
          contrast under each swatch are what it becomes.
        </p>
      </div>

      <section className={styles.section}>
        <h2>Levels</h2>
        <ThemePair>
          {t => (
            <div className={styles.levels}>
              {LEVELS[t].map((hex, i) => (
                <div key={i} className={styles.level}>
                  <span className={styles.levelChip} style={{ background: `var(--lv${i})` }} />
                  <span className={styles.swatchName}>lv{i}</span>
                  <span className={styles.swatchHex}>{hex}</span>
                </div>
              ))}
            </div>
          )}
        </ThemePair>
      </section>

      <section className={styles.section}>
        <h2>Accents in use</h2>
        <ThemePair>
          {t => (
            <div className={styles.swatches}>
              {ACCENTS.map(a => <Swatch key={a.token} color={a[t]} theme={t} strength={strength} label={a.token} />)}
            </div>
          )}
        </ThemePair>
        <Table aria-label="Accent tokens">
          <thead>
            <tr><th>Token</th><th>Light</th><th>Dark</th><th>Used for</th></tr>
          </thead>
          <tbody>
            {[...ACCENTS, ...SEMANTIC].map(a => (
              <tr key={a.token}>
                <td><code>{a.token}</code></td>
                <td className={styles.mono}>{a.light}</td>
                <td className={styles.mono}>{a.dark}</td>
                <td>{a.use}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      <section className={styles.section}>
        <h2>Proposed: data viz</h2>
        <p className={styles.note}>
          Eight hues in a fixed order, the first series always blue, the second always orange. A chart takes them in
          order and never skips one, and a colour follows its series when a filter removes others. Past eight, the rest
          go under Other. Red and yellow stay with Signal and Warning, so a series never reads as an error. Each hue
          has a light and a dark step; the dark ones are a little lighter where lv0 is near black.
        </p>
        <ThemePair>
          {t => (
            <div className={styles.swatches}>
              {VIZ.map(v => <Swatch key={v.token} color={v[t]} theme={t} strength={strength} label={`${v.token} ${v.name}`} />)}
            </div>
          )}
        </ThemePair>
      </section>

      <section className={styles.section}>
        <h2>Strength steps</h2>
        <ThemePair>
          {t => (
            <div className={styles.steps}>
              {[...ACCENTS, ...VIZ].map(a => (
                <div key={a.token} className={styles.stepRow}>
                  <span className={styles.stepName}>{a.token}</span>
                  {[100, 85, 70, 55, 40].map(p => (
                    <span key={p} className={styles.step} style={{ background: mix(a[t], LEVELS[t][0], p / 100) }} title={`${p}%`} />
                  ))}
                </div>
              ))}
              <div className={styles.stepRow}>
                <span className={styles.stepName} />
                {[100, 85, 70, 55, 40].map(p => <span key={p} className={styles.stepLabel}>{p}%</span>)}
              </div>
            </div>
          )}
        </ThemePair>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>On the datasets page</h2>
          <SegmentedControl<Look> size="micro" aria-label="Look" value={look} onChange={setLook}
            items={[{ value: 'grey', label: 'Greys' }, { value: 'colour', label: 'Colour' }]} />
        </div>
        <p className={styles.note}>
          Four parts of memory in greys need the legend to be told apart; in colour they read at a glance. Text stays in
          the levels: the colour is on the marks beside it. A colour means one thing on a page, so memory's parts take
          the first four slots and the field roles the last four.
        </p>
        <ThemePair>{() => <DatasetsExample look={look} />}</ThemePair>
      </section>
    </div>
  );
}
