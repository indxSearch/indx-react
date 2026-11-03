import { useMemo } from 'react';
import { Heatmap, calendarCells } from '@indxsearch/systm';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

// A deterministic stand-in for a year of readings, so the page looks the same on every load.
function noise(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

export default function HeatmapPage() {
  const today = useMemo(() => new Date(), []);
  const halfYear = useMemo(() => {
    const from = new Date(today);
    from.setDate(from.getDate() - 7 * 26 + 1);
    return calendarCells(from, today, (d) => {
      const n = noise(d.getTime() / 86_400_000);
      return d.getDay() === 0 || d.getDay() === 6 ? (n < 0.8 ? 0 : 1) : n < 0.25 ? 0 : Math.ceil(n * 6);
    });
  }, [today]);
  const woken = useMemo(() => {
    const from = new Date(today);
    from.setDate(from.getDate() - 7 * 16 + 1);
    return calendarCells(from, today, (d) => (noise(d.getTime() / 86_400_000 + 7) < 0.55 ? 1 : 0));
  }, [today]);
  // Searches by hour and weekday: 24 columns of 7, busiest in office hours.
  const byHour = useMemo(
    () => HOURS.flatMap((h) => Array.from({ length: 7 }, (_, d) => {
      const office = h >= 8 && h <= 17 && d < 5 ? 1 : 0.15;
      return Math.round(noise(h * 7 + d) * 400 * office);
    })),
    [],
  );

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Heatmap</h1>
        <p className={styles.desc}>
          A grid of pixel cells toned by value: columns of cells, filled top to bottom then the next column, so a
          calendar is weeks across and weekdays down. Zero is the empty tone, the rest four steps up to the ink.
          For days a dataset woke, searches by hour and weekday, anything that is a count per cell of a regular grid.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>A calendar</h2>
        <p className={styles.desc}>
          The last 26 weeks, from <code>calendarCells</code>: gaps before the first day, a month label at the column
          of each first, Mon, Wed and Fri at the left. The title on a cell is the day and its count.
        </p>
        <Heatmap
          values={halfYear.values}
          columnLabels={halfYear.columnLabels}
          rowLabels={halfYear.rowLabels}
          format={(v, i) => `${halfYear.dates[i]?.toLocaleDateString()}: ${v} searches`}
          aria-label="Searches per day, last 26 weeks"
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Days woken</h2>
        <p className={styles.desc}>
          A yes or no per day: a dataset on a timed hibernation, the days it was woken in the ink. With max at 1
          every woken day is the ink; the rest empty.
        </p>
        <div className={styles.card} style={{ maxWidth: 'max-content' }}>
          <p className={styles.cardLabel}>Woken, last 16 weeks</p>
          <Heatmap values={woken.values} columnLabels={woken.columnLabels} max={1} aria-label="Days woken, last 16 weeks" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>By hour and weekday</h2>
        <p className={styles.desc}>Twenty-four columns of seven, 8px cells, labelled every six hours.</p>
        <Heatmap
          values={byHour}
          rows={7}
          cell={8}
          columnLabels={[0, 6, 12, 18].map((h) => ({ at: h, label: `${h}:00` }))}
          rowLabels={[{ at: 0, label: 'Mon' }, { at: 2, label: 'Wed' }, { at: 4, label: 'Fri' }, { at: 6, label: 'Sun' }]}
          format={(v) => `${v} searches`}
          aria-label="Searches by hour and weekday"
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Levels</h2>
        <p className={styles.desc}>The tones, from empty to the ink: 0, then a quarter, a half, three quarters and all of max.</p>
        <Heatmap values={[0, 1, 2, 3, 4]} rows={1} max={4} cell={10} columnLabels={[0, 1, 2, 3, 4].map((v) => ({ at: v, label: `${v}` }))} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'values', type: '(number | null)[]', description: 'One value per cell, column by column, top to bottom. null is a gap.' },
          { name: 'rows', type: 'number', default: '7', description: 'Cells down.' },
          { name: 'max', type: 'number', description: 'The value that is the ink; the largest value by default.' },
          { name: 'columnLabels', type: '{ at, label }[]', description: 'Labels beneath the grid, at the columns they name.' },
          { name: 'rowLabels', type: '{ at, label }[]', description: 'Labels left of the grid, at the rows they name.' },
          { name: 'cell', type: 'number', default: '6', description: 'A cell\'s side in pixels, with a 2px gap.' },
          { name: 'format', type: '(value, index) => string', description: 'A cell\'s title on hover.' },
          { name: 'aria-label', type: 'string', description: 'A name for assistive technology.' },
        ]} />
        <h2 className={styles.heading} style={{ marginTop: 24 }}>calendarCells(from, to, valueOf)</h2>
        <p className={styles.desc}>
          Days from one date to another as weeks across and weekdays down, Monday first. Returns values, columnLabels,
          rowLabels and the dates by cell index, for a format callback.
        </p>
      </div>
    </main>
  );
}
