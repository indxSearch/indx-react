import { Sparkline } from '@indxsearch/systm';
import styles from '../chart/page.module.css';

const searches = [4, 6, 5, 9, 8, 12, 11, 14, 13, 18, 17, 22, 26, 31];
const falling  = [31, 26, 27, 19, 18, 14, 15, 9, 8, 6, 5, 4, 3, 2];
const flat     = [12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];

const row: React.CSSProperties = { display: 'flex', gap: 32, alignItems: 'center', maxWidth: 640 };

export default function SparklinePage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Sparkline</h1>
        <p className={styles.desc}>
          A tiny display-only graph, the size of a line of text, for putting a trend next to a
          number. No axis, no legend, no tooltip, no interaction &mdash; if you want any of those,
          use <strong>Chart</strong>. It takes its colour from whatever it sits in, and fills the
          width it is given.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Line and bar</h2>
        <div style={row}>
          <Sparkline values={searches} ariaLabel="Searches over the last fourteen days, rising" />
          <Sparkline values={searches} type="bar" ariaLabel="Searches over the last fourteen days, rising" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>In a line of text</h2>
        <p className={styles.desc}>The intended use: beside the number it describes, inheriting its colour and size.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--lv6)', font: 'var(--text-sm)' }}>
          <span>Searches</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>1 284</span>
          <Sparkline values={searches} width={72} height={16} ariaLabel="Searches over the last fourteen days, rising" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Bar gap</h2>
        <p className={styles.desc}>
          <code>gap</code> is real pixels, whatever the width and however many bars. Bars are laid
          out with CSS for that reason: a gap in SVG units would stretch with the viewBox and land
          at a different width every time.
        </p>
        <div style={row}>
          <Sparkline values={searches} type="bar" gap={0.5} ariaLabel="Searches, rising" />
          <Sparkline values={searches} type="bar" gap={1} ariaLabel="Searches, rising" />
          <Sparkline values={searches} type="bar" gap={3} ariaLabel="Searches, rising" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Fill and baseline</h2>
        <p className={styles.desc}>
          <code>fill</code> shades under the curve; <code>baseline</code> adds a hairline at the
          foot, for when the shape alone does not read as a graph.
        </p>
        <div style={row}>
          <Sparkline values={searches} fill ariaLabel="Searches, rising" />
          <Sparkline values={searches} baseline ariaLabel="Searches, rising" />
          <Sparkline values={searches} fill baseline ariaLabel="Searches, rising" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Colour</h2>
        <p className={styles.desc}>
          Defaults to <code>currentColor</code>, so it matches the text around it. Any CSS colour
          overrides that.
        </p>
        <div style={row}>
          <Sparkline values={searches} color="var(--CTeal)" ariaLabel="Searches, rising" />
          <Sparkline values={falling} color="var(--CSignal)" ariaLabel="Errors, falling" />
          <Sparkline values={searches} type="bar" color="var(--CWarning)" ariaLabel="Searches, rising" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Edges</h2>
        <p className={styles.desc}>
          A flat series still draws a line rather than vanishing. One value or none draws nothing,
          or the baseline alone if it is asked for.
        </p>
        <div style={row}>
          <Sparkline values={flat} baseline ariaLabel="Unchanged" />
          <Sparkline values={[7]} baseline ariaLabel="Not enough data" />
          <Sparkline values={[]} baseline ariaLabel="No data" />
        </div>
      </div>
    </main>
  );
}
