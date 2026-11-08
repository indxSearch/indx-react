import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react';
import { Table, SliderField, SegmentedControl, ToggleSwitch, Button } from '@indxsearch/systm';
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

type Group = 'brand' | 'semantic';
interface Accent { token: string; light: string; dark: string; use: string; group: Group }

// The brand sheet (8 Nov 2026) groups them: branding, and semantic (Signal, Warning). Pink, violet and
// the two lavenders are new there and have no token yet; their hex is read off the sheet. Light blue is
// not on the sheet; it is the semantic information colour. --CSuccess (#00D575) is a proposed semantic green.
const ACCENTS: Accent[] = [
  { token: '--CPureBlue', light: '#0000FF', dark: '#0000FF', use: 'A full progress bar; positive and confirmed on light', group: 'brand' },
  { token: '--CTeal', light: '#72F5C6', dark: '#72F5C6', use: 'Success alerts, chat; positive and confirmed on dark', group: 'brand' },
  { token: '--CPink', light: '#EB4367', dark: '#EB4367', use: 'New on the brand sheet, not in use', group: 'brand' },
  { token: '--CViolet', light: '#5B02EA', dark: '#5B02EA', use: 'New on the brand sheet, not in use', group: 'brand' },
  { token: '--CLavender', light: '#AAAAFF', dark: '#AAAAFF', use: 'New on the brand sheet, not in use', group: 'brand' },
  { token: '--CLavenderLight', light: '#EAEAFF', dark: '#EAEAFF', use: 'New on the brand sheet, not in use', group: 'brand' },
  { token: '--CSignal', light: '#FF4238', dark: '#FF4238', use: 'Errors, destructive actions, the notifications bell', group: 'semantic' },
  { token: '--CWarning', light: '#FFC107', dark: '#FFC107', use: 'Warning alerts, warning marks on a slider. The sheet shows #FFC941', group: 'semantic' },
  { token: '--CSuccess', light: '#00D575', dark: '#00D575', use: 'Proposed: success and good states, on marks and icons, never on text', group: 'semantic' },
  { token: '--CLightBlue', light: '#6B9EFF', dark: '#6B9EFF', use: 'Information: info alerts, info badges on tabs (Observr), chart markers', group: 'semantic' },
];

const GROUPS: { group: Group; name: string }[] = [
  { group: 'brand', name: 'Branding' },
  { group: 'semantic', name: 'Semantic' },
];

const SEMANTIC: Omit<Accent, 'group'>[] = [
  { token: '--CPositive', light: '#0000FF', dark: '#72F5C6', use: 'On / enabled: ToggleSwitch. Pure blue on light, teal on dark' },
  { token: '--CConfirmed', light: '#0000FF', dark: '#72F5C6', use: 'Confirmed / success (Blazor only so far)' },
];

type ThemeKey = 'light' | 'dark' | 'blue' | 'rust' | 'green';
interface Viz { token: string; name: string; values: Record<ThemeKey, string> }

// Soft and light (8 Nov 2026, second round): each hue at its own natural lightness (violet and blue
// a step darker, lime and mint a step lighter), which is what keeps neighbours apart for colourblind
// readers at this softness. The tinted themes take the same hues leaned a little toward their own.
// Validator, adjacent pairs, worst colourblind / normal ΔE: light 11.5 / 20.9, dark 11.3 / 20.0,
// blue 11.7 / 18.3, rust 10.4 / 18.5, green 9.6 / 18.3. All are lighter than the validator's band by
// choice. On white every mark is about 2:1, so a chart there carries a legend and labels or a table.
const VIZ_ORDER = ['Blue', 'Apricot', 'Cyan', 'Violet', 'Mint', 'Orchid'];
const VIZ_VALUES: Record<ThemeKey, string[]> = {
  light: ['#5F96DC', '#F0AB64', '#3CC5E2', '#8D77C8', '#68DDB8', '#CB84C4'],
  dark: ['#6DA0E0', '#F6B676', '#59CEE8', '#9582CC', '#7DE5C3', '#D290CB'],
  blue: ['#72A4DD', '#E5C37A', '#6CCFE9', '#9089CD', '#83E7D1', '#C899D6'],
  rust: ['#8393D5', '#EDB07A', '#5CCAC9', '#9B79B9', '#91DBAB', '#CE8BB9'],
  green: ['#68A7DB', '#ECC07C', '#68D1E2', '#878CD0', '#8AE7C7', '#C29BDC'],
};

// Slots 7 and 8 are open (8 Nov 2026: lime and rose did not land). Each hue below, made the same way
// as the six (its own lightness, leaned per theme), in the order light, dark, blue, rust, green.
const HUE: Record<string, string[]> = {
  Lime: ['#AFD884', '#BAE194', '#AFE7AA', '#C3D68B', '#BAE5A2'],
  Rose: ['#E9889F', '#EE95A9', '#E79CC0', '#E4929E', '#EF9D96'],
  Moss: ['#7F9C45', '#89A556', '#7DAB6E', '#909A4F', '#87A965'],
  Gold: ['#DBCA69', '#E3D47D', '#D2DE91', '#E2CB7E', '#DBDB8D'],
  Sage: ['#8DCA7F', '#9AD28E', '#92D6A3', '#A7C781', '#9CD59A'],
  Denim: ['#387ABA', '#4884BF', '#4F87BC', '#6177B5', '#448AB9'],
  Teal: ['#0CAFA8', '#34B7B1', '#48B8B8', '#4FB095', '#4CB9B0'],
  Lilac: ['#D3A5F5', '#DBB1FA', '#D3B9FF', '#DDA9E5', '#CABDFF'],
  Plum: ['#BA6898', '#C074A0', '#B77CAF', '#B97090', '#B27EB6'],
  Terracotta: ['#BD6A42', '#C37552', '#C57670', '#B87252', '#BC804D'],
  Blush: ['#FFA9AF', '#FFB8BC', '#FEBBD0', '#FFAFB0', '#FFC0B1'],
};
const THEME_KEYS: ThemeKey[] = ['light', 'dark', 'blue', 'rust', 'green'];

// Every pair here passes on all five themes after orchid: colourblind neighbours at least 8.6 (target
// 8), normal at least 18.1 (floor 15). Moss and Denim also lift the worst of any two colours in the
// set, which matters in a scatter, from 6.1 to 7.5.
const PAIRS: [string, string][] = [['Moss', 'Lilac'], ['Gold', 'Plum'], ['Sage', 'Terracotta'], ['Denim', 'Blush'], ['Gold', 'Teal'], ['Lime', 'Rose']];
const pairKey = (p: [string, string]) => p.join('+');

type VizSet = Record<ThemeKey, string[]>;
const vizSetOf = ([a, b]: [string, string]): VizSet =>
  Object.fromEntries(THEME_KEYS.map((k, i) => [k, [...VIZ_VALUES[k], HUE[a][i], HUE[b][i]]])) as VizSet;
const vizOf = (pair: [string, string], set: VizSet): Viz[] => [...VIZ_ORDER, ...pair].map((name, i) => ({
  token: `--viz${i + 1}`, name, values: Object.fromEntries(THEME_KEYS.map(k => [k, set[k][i]])) as Record<ThemeKey, string>,
}));
const VizContext = createContext<VizSet>(vizSetOf(PAIRS[0]));
const vizVars = (set: VizSet, k: ThemeKey) => Object.fromEntries(set[k].map((hex, i) => [`--viz${i + 1}`, hex]));

// The terminal themes (8 Nov 2026 sheet), each a dark ground with a bright and a dim accent, made
// into a full set of levels. lv0 is the sheet's ground; lv1 and lv2 step up from it; lv3 to lv8 keep
// the dark levels' OKLab lightness, so every contrast the console relies on holds, and carry the
// ground's hue, strong in the surfaces and fading to a trace in the text. Blue's third colour, the
// pale one, is its lv6. Bright is the theme's positive (toggle, focus, a ready dataset); dim is a
// fill behind lv8 text (the selected row, the open menu item).
interface Tint { key: ThemeKey; name: string; lv: string[]; bright: string; dim: string }

const TINTS: Tint[] = [
  { key: 'dark', name: 'Dark, today', lv: LEVELS.dark, bright: '#72F5C6', dim: '#393941' },
  { key: 'blue', name: 'Blue', lv: ['#101B22', '#18232B', '#202C33', '#313C43', '#4F5960', '#899197', '#CAE6F8', '#F8FCFE', '#FFFFFF'], bright: '#88CEFA', dim: '#064D7B' },
  { key: 'rust', name: 'Rust', lv: ['#221714', '#2B1F1C', '#332824', '#423734', '#5F5451', '#978E8B', '#F5EDEB', '#FEFAF9', '#FFFFFF'], bright: '#C84817', dim: '#644439' },
  { key: 'green', name: 'Green', lv: ['#0C1D1A', '#142522', '#1D2E2B', '#2E3E3B', '#4C5B58', '#879390', '#E7F2F0', '#F7FCFB', '#FFFFFF'], bright: '#5DD1A4', dim: '#3D6C58' },
];

const tintStyle = (t: Tint, set: VizSet) => ({
  ...Object.fromEntries(t.lv.map((hex, i) => [`--lv${i}`, hex])),
  ...vizVars(set, t.key),
  '--CPositive': t.bright, '--CPositiveHandle': t.lv[0], '--CThemeBright': t.bright, '--CThemeDim': t.dim,
}) as CSSProperties;

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

/** n greys, evenly in OKLab lightness, from the strongest text level to the faintest that still reads as
 *  a mark on lv0 (lv3 on light, lv4 on dark). */
function greys(t: Theme, n: number) {
  const [from, to] = t === 'light' ? [LEVELS.light[7], LEVELS.light[3]] : [LEVELS.dark[7], LEVELS.dark[4]];
  return Array.from({ length: n }, (_, i) => mix(to, from, i / (n - 1)));
}

// ---- pieces ----

/** The same content twice, in a light and a dark panel, each with its own levels and accents. */
function ThemePair({ children }: { children: (theme: Theme) => ReactNode }) {
  const set = useContext(VizContext);
  return (
    <div className={styles.pair}>
      {(['light', 'dark'] as const).map(t => (
        <div key={t} className={`${styles.panel} ${styles[t]}`} style={vizVars(set, t) as CSSProperties}>
          <span className={styles.panelName}>{t === 'light' ? 'Light' : 'Dark'}</span>
          {children(t)}
        </div>
      ))}
    </div>
  );
}

function Swatch({ color, theme, surface = LEVELS[theme ?? 'dark'][0], strength, label, sub }: { color: string; theme?: Theme; surface?: string; strength: number; label: string; sub?: string }) {
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

// ---- a theme, worn ----

function ThemeSample({ t }: { t: Tint }) {
  const [on, setOn] = useState(true);
  const rows = [['ecom', '412,880', 'Ready'], ['tmdb23k', '23,439', 'Ready'], ['pokedex', '801', 'Rebuilding']];
  return (
    <div className={styles.sample}>
      <div className={styles.sampleMenu}>
        {['Overview', 'Records', 'Fields', 'Search'].map((m, i) => (
          <span key={m} className={i === 1 ? styles.sampleItemOn : styles.sampleItem}>{m}</span>
        ))}
      </div>
      <div className={styles.sampleMain}>
        <span className={styles.cardName}>Datasets</span>
        <span className={styles.sampleSub}>3 in memory, 1 on disk</span>
        <div className={styles.sampleRows}>
          {rows.map(([n, r, st], i) => (
            <div key={n} className={i === 0 ? styles.sampleRowOn : styles.sampleRow}>
              <span>{n}</span><span className={styles.sampleMuted}>{r}</span>
              <span className={styles.state}><span className={styles.stateDot} style={{ background: st === 'Ready' ? 'var(--CPositive)' : 'var(--lv4)' }} />{st}</span>
            </div>
          ))}
        </div>
        <div className={styles.stackThin}>
          {[380, 210, 64, 140].map((v, i) => <span key={i} className={styles.segment} style={{ flexGrow: v, background: `var(--viz${i + 1}s)` }} />)}
        </div>
        <div className={styles.sampleFoot}>
          <ToggleSwitch checked={on} onChange={setOn} variant="positive" label="Keep in memory" />
          <Button size="micro">Save</Button>
        </div>
      </div>
    </div>
  );
}

// ---- page ----

export default function ColorsPage() {
  const [strength, setStrength] = useState(100);
  const [look, setLook] = useState<Look>('colour');
  const [pick, setPick] = useState(pairKey(PAIRS[0]));
  const pair = PAIRS.find(p => pairKey(p) === pick) ?? PAIRS[0];
  const set = vizSetOf(pair);
  const VIZ = vizOf(pair, set);

  return (
    <VizContext.Provider value={set}>
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
            <>
              {GROUPS.map(g => (
                <div key={g.group} className={styles.group}>
                  <span className={styles.groupName}>{g.name}</span>
                  <div className={styles.swatches}>
                    {ACCENTS.filter(a => a.group === g.group).map(a => <Swatch key={a.token} color={a[t]} theme={t} strength={strength} label={a.token} />)}
                  </div>
                </div>
              ))}
            </>
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
        <div className={styles.sectionHead}>
          <h2>Proposed: data viz</h2>
          <SegmentedControl<string> size="micro" aria-label="Slots 7 and 8" value={pick} onChange={setPick}
            items={PAIRS.map(p => ({ value: pairKey(p), label: p.join(' + ') }))} />
        </div>
        <p className={styles.note}>
          Eight soft hues in a fixed order, the first series always blue, the second always apricot. A chart takes them
          in order and never skips one, and a colour follows its series when a filter removes others. Past eight, the
          rest go under Other. The last two slots are open: the switch tries the pairs that pass beside the first six. Each hue sits at its own lightness, which is what keeps neighbours apart for colourblind
          readers at this softness. On white they are light, about 2:1, so a chart there always has a legend and
          labels. Each terminal theme has its own eight, leaned toward its hue (below).
        </p>
        <ThemePair>
          {t => (
            <div className={styles.swatches}>
              {VIZ.map(v => <Swatch key={v.token} color={v.values[t]} theme={t} strength={strength} label={`${v.token} ${v.name}`} />)}
            </div>
          )}
        </ThemePair>
      </section>

      <section className={styles.section}>
        <h2>How many greys</h2>
        <p className={styles.note}>
          Greys from the levels, evenly spaced in lightness. Neighbours stay apart up to eight steps on dark and on light.
          Matching a grey to its legend is the hard part: four is easy, six needs a careful look, at eight a reader can
          no longer tell which grey is which.
        </p>
        <ThemePair>
          {t => (
            <div className={styles.example}>
              {[4, 6, 8].map(n => {
                const g = greys(t, n);
                return (
                  <div key={n} className={styles.exampleBlock}>
                    <span className={styles.exampleTitle}>{n} parts</span>
                    <div className={styles.stack}>{g.map((c, i) => <span key={i} className={styles.segment} style={{ flexGrow: 1, background: c }} />)}</div>
                    <div className={styles.legend}>
                      {g.map((c, i) => <span key={i} className={styles.legendItem}><span className={styles.legendMark} style={{ background: c }} />{String.fromCharCode(65 + i)}</span>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ThemePair>
      </section>

      <section className={styles.section}>
        <h2>Terminal themes</h2>
        <p className={styles.note}>
          The three from the sheet, each made into nine levels: the sheet's ground is lv0, the rest keep today's dark
          lightness and take the ground's hue, so every contrast holds. Bright is the theme's positive, dim the fill
          behind a selected row. Signal and Warning stay as they are; each theme has its own eight data-viz colours. In IndxServer a theme would be
          one attribute beside dark mode, <code>data-tint="blue"</code>, setting only these tokens.
        </p>
        <div className={styles.tints}>
          {TINTS.map(t => (
            <div key={t.key} className={`${styles.panel} ${styles.dark}`} style={tintStyle(t, set)}>
              <span className={styles.panelName}>{t.name}</span>
              <div className={styles.tintLevels}>
                {t.lv.map((hex, i) => <span key={i} className={styles.levelChip} style={{ background: hex }} title={`lv${i} ${hex}`} />)}
              </div>
              <div className={styles.swatches}>
                <Swatch color={t.bright} surface={t.lv[0]} strength={strength} label="Bright" />
                <Swatch color={t.dim} surface={t.lv[0]} strength={100} label="Dim" sub={`lv8 ${contrast(t.lv[8], t.dim).toFixed(1)}:1`} />
              </div>
              <ThemeSample t={t} />
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Strength steps</h2>
        <ThemePair>
          {t => (
            <div className={styles.steps}>
              {[...ACCENTS, ...VIZ.map(v => ({ token: v.token, light: v.values.light, dark: v.values.dark }))].map(a => (
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
    </VizContext.Provider>
  );
}
