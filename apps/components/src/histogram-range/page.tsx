import { HistogramRange, type HistogramRangeValue } from '@indxsearch/systm';
import { useState } from 'react';
import styles from './page.module.css';

// release_year, roughly as tmdb23k has it: few early films, many in the 2010s.
const YEARS: [number, number][] = Array.from({ length: 106 }, (_, i) => [1920 + i, Math.max(1, Math.round(4 + 950 * Math.pow(i / 100, 3.2)))]);
const DECADES: [number, number][] = Array.from({ length: 11 }, (_, i) => {
  const d = 1920 + i * 10;
  return [d, YEARS.filter(([y]) => y >= d && y < d + 10).reduce((s, [, n]) => s + n, 0)];
});
const VOTES: [number, number][] = Array.from({ length: 91 }, (_, i) => [Math.round((1 + i / 10) * 10) / 10, Math.round(700 * Math.exp(-Math.pow((i / 10 - 5.4) / 1.0, 2)))]);

const open: HistogramRangeValue = { from: null, to: null };
const describe = (v: HistogramRangeValue) => `From ${v.from ?? 'open'} to ${v.to ?? 'open'}`;

export default function HistogramRangePage() {
  const [years, setYears] = useState(open);
  const [votes, setVotes] = useState<HistogramRangeValue>({ from: 7, to: null });
  const [decades, setDecades] = useState(open);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>HistogramRange</h1>
        <p className={styles.desc}>
          A range over a number field's values, picked on their histogram or typed. Drag across the bars, or click one,
          and the numbers under them follow; type a number and the bars light up to it. An empty end is open; clicking
          the one bar that is the whole range clears it. The console's search preview filters a number field with it.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Many values, 30 bars</h2>
        <div className={styles.stack} style={{ width: 320 }}>
          <HistogramRange aria-label="release_year" values={YEARS} step={1} value={years} onChange={setYears} />
          <HistogramRange aria-label="vote_average" values={VOTES} step={0.1} value={votes} onChange={setVotes} />
        </div>
        <p className={styles.valueDisplay}>release_year: {describe(years)} · vote_average: {describe(votes)}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Few values, a bar each</h2>
        <div className={styles.stack} style={{ width: 320 }}>
          <HistogramRange aria-label="decade" values={DECADES} step={10} value={decades} onChange={setDecades} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Disabled</h2>
        <div className={styles.stack} style={{ width: 320 }}>
          <HistogramRange aria-label="decade" values={DECADES} value={{ from: 1990, to: 2010 }} onChange={() => {}} disabled />
        </div>
      </div>
    </main>
  );
}
