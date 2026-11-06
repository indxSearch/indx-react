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
      <TextRow field="genres" values={[['Drama', 10447], ['Comedy', 8429], ['Thriller', 5574], ['Action', 4572]]} />
      {children}
      <TextRow field="language" values={[['English', 15831], ['French', 2018], ['Italian', 1113]]} />
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

// ── C: the histogram, dragged across ───────────────────────────────────────

function HistogramRange({ field, histogram, buckets }: { field: string; histogram: Histogram; buckets: number }) {
  // The facet's values gathered into a few bars, so a long list of numbers reads as its shape.
  const bars = useMemo(() => {
    const lo = histogram[0][0], hi = histogram[histogram.length - 1][0];
    const width = (hi - lo) / buckets;
    return Array.from({ length: buckets }, (_, i) => {
      const from = lo + i * width, to = i === buckets - 1 ? hi : lo + (i + 1) * width;
      const inBar = histogram.filter(([v]) => v >= from && (i === buckets - 1 ? v <= to : v < to));
      return { from: inBar[0]?.[0] ?? from, to: inBar[inBar.length - 1]?.[0] ?? to, n: inBar.reduce((s, [, n]) => s + n, 0) };
    });
  }, [histogram, buckets]);
  const max = Math.max(...bars.map(b => b.n));
  const [sel, setSel] = useState<[number, number] | null>(null);
  const [anchor, setAnchor] = useState<number | null>(null);
  const inSel = (i: number) => sel != null && i >= Math.min(...sel) && i <= Math.max(...sel);
  const a = sel ? bars[Math.min(...sel)] : null, b = sel ? bars[Math.max(...sel)] : null;
  return (
    <div className={styles.row}>
      <span className={styles.field}>
        {field}
        {a && b && <span className={styles.count}>{a.from} to {b.to} · {fmt(bars.filter((_, i) => inSel(i)).reduce((s, x) => s + x.n, 0))}</span>}
      </span>
      <div className={styles.histogram} onPointerLeave={() => setAnchor(null)} onPointerUp={() => setAnchor(null)}>
        {bars.map((bar, i) => (
          <div key={i} className={`${styles.bar} ${sel == null || inSel(i) ? styles.barIn : ''}`}
            style={{ height: `${Math.max(4, (bar.n / max) * 100)}%`, opacity: sel == null ? 0.35 : 1 }}
            title={`${bar.from} to ${bar.to}: ${fmt(bar.n)}`}
            onPointerDown={() => { setAnchor(i); setSel(sel && sel[0] === i && sel[1] === i ? null : [i, i]); }}
            onPointerEnter={() => anchor != null && setSel([anchor, i])} />
        ))}
      </div>
      <div className={styles.histogramAxis}><span>{bars[0].from}</span><span>{bars[bars.length - 1].to}</span></div>
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
          facet panel, with release_year and vote_average from tmdb23k (made-up counts).
        </p>
      </div>

      <div className={styles.grid} key={key}>
        <div>
          <h2 className={styles.heading}>A · From and to</h2>
          <p className={styles.desc}>Two ghost numbers, the data's ends as placeholders. No new component: InputField ghost.</p>
          <Panel picked onClear={clear}>
            <FromTo field="release_year" histogram={YEARS} step={1} />
            <FromTo field="vote_average" histogram={VOTES} step={0.1} />
          </Panel>
        </div>

        <div>
          <h2 className={styles.heading}>B · Range slider</h2>
          <p className={styles.desc}>Two handles, the values at the ends. Needs a range Slider in systm Blazor (React has one).</p>
          <Panel picked onClear={clear}>
            <RangeSlider field="release_year" histogram={YEARS} step={1} />
            <RangeSlider field="vote_average" histogram={VOTES} step={0.1} />
          </Panel>
        </div>

        <div>
          <h2 className={styles.heading}>C · Histogram</h2>
          <p className={styles.desc}>The facet's counts as bars; click a bar, or drag across bars, to pick a range. Shows the shape of the data. A new component.</p>
          <Panel picked onClear={clear}>
            <HistogramRange field="release_year" histogram={YEARS} buckets={36} />
            <HistogramRange field="vote_average" histogram={VOTES} buckets={30} />
          </Panel>
        </div>

        <div>
          <h2 className={styles.heading}>D · Buckets as chips</h2>
          <p className={styles.desc}>Ranges made from the data, picked like step 1's values. No new component, but the buckets must be chosen (here: decades, whole stars).</p>
          <Panel picked onClear={clear}>
            <Buckets field="release_year" histogram={YEARS} edges={[1920, 1960, 1980, 1990, 2000, 2010, 2020]}
              label={(f, t) => (t == null ? `${f}–` : `${f}s`.replace(/^1920s$/, 'before 1960'))} />
            <Buckets field="vote_average" histogram={VOTES} edges={[1, 5, 6, 7, 8]}
              label={(f, t) => (f === 1 ? 'under 5' : t == null ? `${f}+` : `${f}–${t}`)} />
          </Panel>
        </div>
      </div>

      <div className={styles.section} style={{ marginTop: '3rem' }}>
        <p className={styles.verdict}>
          <strong>Cheapest:</strong> A and D reuse what is there. <strong>Clearest for any number:</strong> A, typed or stepped.
          <strong> Most telling:</strong> C, which shows where the records are before anything is picked.
        </p>
      </div>
    </main>
  );
}
