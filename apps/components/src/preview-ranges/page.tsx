import { Button, Chip, InputField, Slider } from '@indxsearch/systm';
import { Filter } from '@indxsearch/pixl';
import React, { useMemo, useState } from 'react';
import styles from './page.module.css';

// Mockups for the console's Search preview, step 2 (Nov 2026): how to filter on a number field.
// Step 1 made a facet value a toggle chip. A number field's facet is a long list of distinct
// numbers (release_year: 124 values, vote_average: 2,979), so picking one by one does not work.
// Each mockup sits in a copy of the preview's facet panel, between two text fields as they are.

type Histogram = [number, number][];

// release_year in tmdb23k, roughly: few early films, growing to the 2010s.
const YEARS: Histogram = Array.from({ length: 106 }, (_, i) => {
  const year = 1920 + i;
  const n = Math.round(4 + 950 * Math.pow(i / 100, 3.2) * (year > 2020 ? 0.7 : 1));
  return [year, Math.max(1, n)];
});

// vote_average, by tenths.
const VOTES: Histogram = Array.from({ length: 91 }, (_, i) => {
  const v = 1 + i / 10;
  return [Math.round(v * 10) / 10, Math.round(700 * Math.exp(-Math.pow((v - 6.4) / 1.0, 2)))];
});

// runtime in minutes: most films an hour and a half to two.
const RUNTIMES: Histogram = Array.from({ length: 151 }, (_, i) => {
  const m = 60 + i;
  return [m, Math.max(1, Math.round(900 * Math.exp(-Math.pow((m - 102) / 22, 2))))];
});

// budget in millions of dollars: most small, a long tail.
const BUDGETS: Histogram = Array.from({ length: 301 }, (_, i) => [i, Math.round(2500 * Math.exp(-i / 18)) + 1]);

// votes: a few films with very many.
const VOTE_COUNTS: Histogram = Array.from({ length: 121 }, (_, i) => [i * 250, Math.round(6000 * Math.exp(-i / 6)) + 2]);

interface NumberField {
  field: string;
  histogram: Histogram;
  step: number;
  buckets: number;
  edges: number[];
  label: (from: number, to?: number) => string;
}

// The number fields every mockup shows, with D's buckets for each.
const NUMBERS: NumberField[] = [
  { field: 'release_year', histogram: YEARS, step: 1, buckets: 36, edges: [1920, 1960, 1980, 1990, 2000, 2010, 2020],
    label: (f, t) => (f === 1920 ? 'before 1960' : t == null ? `${f}–` : `${f}s`) },
  { field: 'vote_average', histogram: VOTES, step: 0.1, buckets: 30, edges: [1, 5, 6, 7, 8],
    label: (f, t) => (f === 1 ? 'under 5' : t == null ? `${f}+` : `${f}–${t}`) },
  { field: 'runtime', histogram: RUNTIMES, step: 1, buckets: 30, edges: [60, 90, 120, 150],
    label: (f, t) => (f === 60 ? 'under 90 min' : t == null ? `${f}+ min` : `${f}–${t} min`) },
  { field: 'budget', histogram: BUDGETS, step: 1, buckets: 30, edges: [0, 10, 50, 100],
    label: (f, t) => (f === 0 ? 'under 10M' : t == null ? `${f}M+` : `${f}–${t}M`) },
  { field: 'votes', histogram: VOTE_COUNTS, step: 1, buckets: 30, edges: [0, 1000, 5000, 10000],
    label: (f, t) => (f === 0 ? 'under 1,000' : t == null ? `${fmt(f)}+` : `${fmt(f)}–${fmt(t)}`) },
];

const sumIn = (h: Histogram, from?: number, to?: number) =>
  h.filter(([v]) => (from == null || v >= from) && (to == null || v <= to)).reduce((s, [, n]) => s + n, 0);

const fmt = (n: number) => n.toLocaleString('en');

function Panel({ picked, onClear, children }: { picked: boolean; onClear: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.panel}>
      <div className={styles.caption}>
        <Filter size={14} color="currentColor" />
        <span>Facets</span>
        {picked && (
          <span className={styles.captionEnd}>
            <Button variant="ghost" size="micro" onClick={onClear}>Clear filters</Button>
          </span>
        )}
      </div>
      <TextRow field="genres" values={[['Drama', 10447], ['Comedy', 8429], ['Thriller', 5574], ['Action', 4572], ['Romance', 3961], ['Horror', 2893]]} />
      <TextRow field="certification" values={[['R', 7336], ['PG-13', 3518], ['PG', 2116], ['NR', 1530], ['G', 412]]} />
      {children}
      <TextRow field="language" values={[['English', 15831], ['French', 2018], ['Italian', 1113], ['Japanese', 1044], ['Spanish', 812]]} />
      <TextRow field="countries" values={[['United States of America', 13965], ['France', 3272], ['United Kingdom', 3017], ['Germany', 1874]]} />
    </div>
  );
}

function TextRow({ field, values }: { field: string; values: [string, number][] }) {
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <div className={styles.row}>
      <span className={styles.field}>{field}</span>
      <span className={styles.values}>
        {values.map(([v, n]) => (
          <Chip key={v} selected={picked.includes(v)} onClick={() => setPicked(p => (p.includes(v) ? p.filter(x => x !== v) : [...p, v]))}>
            {v}<span className={styles.count}>{fmt(n)}</span>
          </Chip>
        ))}
      </span>
    </div>
  );
}

// ── A: from and to ─────────────────────────────────────────────────────────

function FromTo({ field, histogram, step }: { field: string; histogram: Histogram; step: number }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const lo = histogram[0][0], hi = histogram[histogram.length - 1][0];
  const f = from === '' ? undefined : Number(from), t = to === '' ? undefined : Number(to);
  const picked = f != null || t != null;
  return (
    <div className={styles.row}>
      <span className={styles.field}>{field}</span>
      <span className={styles.fromTo}>
        <InputField variant="ghost" type="number" step={step} placeholder={String(lo)} value={from} aria-label={`${field} from`}
          onChange={e => setFrom(e.target.value)} />
        <span className={styles.dash}>to</span>
        <InputField variant="ghost" type="number" step={step} placeholder={String(hi)} value={to} aria-label={`${field} to`}
          onChange={e => setTo(e.target.value)} />
        {picked && <span className={styles.matched}>{fmt(sumIn(histogram, f, t))}</span>}
      </span>
    </div>
  );
}

// ── B: a range slider ──────────────────────────────────────────────────────

function RangeSlider({ field, histogram, step }: { field: string; histogram: Histogram; step: number }) {
  const lo = histogram[0][0], hi = histogram[histogram.length - 1][0];
  const [range, setRange] = useState<[number, number]>([lo, hi]);
  const picked = range[0] !== lo || range[1] !== hi;
  return (
    <div className={styles.row}>
      <span className={styles.field}>{field}{picked && <span className={styles.count}>{fmt(sumIn(histogram, range[0], range[1]))}</span>}</span>
      <div className={styles.rangeRow}>
        <span className={styles.end}>{range[0]}</span>
        <Slider isRange min={lo} max={hi} step={step} value={range} aria-label={field}
          onChange={v => setRange(v as [number, number])} />
        <span className={`${styles.end} ${styles.endRight}`}>{range[1]}</span>
      </div>
    </div>
  );
}

// ── C: the histogram, with from and to under it ────────────────────────────

function HistogramRange({ field, histogram, buckets, step }: { field: string; histogram: Histogram; buckets: number; step: number }) {
  // The facet's values gathered into a few bars, so a long list of numbers reads as its shape.
  const lo = histogram[0][0], hi = histogram[histogram.length - 1][0];
  const bars = useMemo(() => {
    const width = (hi - lo) / buckets;
    return Array.from({ length: buckets }, (_, i) => {
      const from = lo + i * width, to = i === buckets - 1 ? hi : lo + (i + 1) * width;
      const inBar = histogram.filter(([v]) => v >= from && (i === buckets - 1 ? v <= to : v < to));
      return { from: inBar[0]?.[0] ?? from, to: inBar[inBar.length - 1]?.[0] ?? to, n: inBar.reduce((s, [, n]) => s + n, 0) };
    });
  }, [histogram, buckets, lo, hi]);
  const max = Math.max(...bars.map(b => b.n));

  // One range, two ways in: dragging across the bars writes the numbers, typing a number lights
  // the bars it reaches. Empty means open at that end.
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [anchor, setAnchor] = useState<number | null>(null);
  const f = from === '' ? undefined : Number(from), t = to === '' ? undefined : Number(to);
  const picked = f != null || t != null;
  const inRange = (bar: { from: number; to: number }) => (f == null || bar.to >= f) && (t == null || bar.from <= t);
  const pickBars = (a: number, b: number) => {
    const first = bars[Math.min(a, b)], last = bars[Math.max(a, b)];
    setFrom(String(first.from));
    setTo(String(last.to));
  };

  return (
    <div className={styles.row}>
      <span className={styles.field}>
        {field}
        {picked && <span className={styles.count}>{fmt(sumIn(histogram, f, t))}</span>}
      </span>
      <div className={styles.histogram} onPointerLeave={() => setAnchor(null)} onPointerUp={() => setAnchor(null)}>
        {bars.map((bar, i) => (
          <div key={i} className={`${styles.bar} ${picked && inRange(bar) ? styles.barIn : ''}`}
            style={{ height: `${Math.max(4, (bar.n / max) * 100)}%` }}
            title={`${bar.from} to ${bar.to}: ${fmt(bar.n)}`}
            onPointerDown={() => {
              setAnchor(i);
              if (picked && f === bar.from && t === bar.to) { setFrom(''); setTo(''); } else pickBars(i, i);
            }}
            onPointerEnter={() => anchor != null && pickBars(anchor, i)} />
        ))}
      </div>
      <span className={`${styles.fromTo} ${styles.fromToUnder}`}>
        <InputField variant="ghost" type="number" step={step} placeholder={String(lo)} value={from} aria-label={`${field} from`}
          onChange={e => setFrom(e.target.value)} />
        <span className={styles.dash}>to</span>
        <InputField variant="ghost" type="number" step={step} placeholder={String(hi)} value={to} aria-label={`${field} to`}
          onChange={e => setTo(e.target.value)} />
      </span>
    </div>
  );
}

// ── D: buckets as chips ────────────────────────────────────────────────────

function Buckets({ field, histogram, edges, label }: { field: string; histogram: Histogram; edges: number[]; label: (from: number, to?: number) => string }) {
  const [picked, setPicked] = useState<number[]>([]);
  const buckets = edges.map((from, i) => {
    const to = edges[i + 1];
    return { from, to, n: histogram.filter(([v]) => v >= from && (to == null || v < to)).reduce((s, [, n]) => s + n, 0) };
  }).filter(b => b.n > 0);
  return (
    <div className={styles.row}>
      <span className={styles.field}>{field}</span>
      <span className={styles.values}>
        {buckets.map((b, i) => (
          <Chip key={i} selected={picked.includes(i)} onClick={() => setPicked(p => (p.includes(i) ? p.filter(x => x !== i) : [...p, i]))}>
            {label(b.from, b.to)}<span className={styles.count}>{fmt(b.n)}</span>
          </Chip>
        ))}
      </span>
    </div>
  );
}

export default function PreviewRangesPage() {
  const [key, setKey] = useState(0);
  const clear = () => setKey(k => k + 1);
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Search preview: number filters</h1>
        <p className={styles.desc}>
          Step 2 of filters in the console's search preview. A text field's values are toggle chips (step 1). A number
          field's facet is a long list of distinct numbers, so it needs a range. Four ways, each in a copy of the preview's
          facet panel, with tmdb23k's fields (made-up counts): five number fields between four text fields.
        </p>
      </div>

      <div className={styles.grid} key={key}>
        <div>
          <h2 className={styles.heading}>A · From and to</h2>
          <p className={styles.desc}>Two ghost numbers, the data's ends as placeholders. No new component: InputField ghost.</p>
          <Panel picked onClear={clear}>
            {NUMBERS.map(n => <FromTo key={n.field} field={n.field} histogram={n.histogram} step={n.step} />)}
          </Panel>
        </div>

        <div>
          <h2 className={styles.heading}>B · Range slider</h2>
          <p className={styles.desc}>Two handles, the values at the ends. Needs a range Slider in systm Blazor (React has one).</p>
          <Panel picked onClear={clear}>
            {NUMBERS.map(n => <RangeSlider key={n.field} field={n.field} histogram={n.histogram} step={n.step} />)}
          </Panel>
        </div>

        <div>
          <h2 className={styles.heading}>C · Histogram with from and to</h2>
          <p className={styles.desc}>A and the facet's counts as bars, one range: drag across the bars and the numbers follow, type a number and the bars light up to it. Shows the shape of the data. A new component.</p>
          <Panel picked onClear={clear}>
            {NUMBERS.map(n => <HistogramRange key={n.field} field={n.field} histogram={n.histogram} buckets={n.buckets} step={n.step} />)}
          </Panel>
        </div>

        <div>
          <h2 className={styles.heading}>D · Buckets as chips</h2>
          <p className={styles.desc}>Ranges made from the data, picked like step 1's values. No new component, but the buckets must be chosen (here: decades, whole stars, lengths, sizes).</p>
          <Panel picked onClear={clear}>
            {NUMBERS.map(n => <Buckets key={n.field} field={n.field} histogram={n.histogram} edges={n.edges} label={n.label} />)}
          </Panel>
        </div>
      </div>

      <div className={styles.section} style={{ marginTop: '3rem' }}>
        <p className={styles.verdict}>
          <strong>Cheapest:</strong> A and D reuse what is there. <strong>Clearest for any number:</strong> A, typed or stepped.
          <strong> Most telling:</strong> C, which shows where the records are before anything is picked, and takes an exact number too.
        </p>
      </div>
    </main>
  );
}
