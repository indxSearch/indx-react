import { useState } from 'react';
import { Chip, SearchField, Tabs } from '@indxsearch/systm';
import { EXAMPLES, typed, words, type Example } from './data';
import styles from './page.module.css';

// A mockup: how a page shows that a search was focused (IndxServer's focusing, Nov 2026). When no
// record holds every word, as in a question, the list is ordered by the rarest words the records
// hold, and the server says which typed words the first record does not hold. Two ways of saying
// so under the field, on real outcomes from tmdb23k and the school register, the wrong ones too.

type Variant = 'line' | 'matched';

const ABOUT: Record<Variant, string> = {
  line: 'A line under the field says what the list went by and what it left out, in words.',
  matched: 'Only what the list went by, each word in its own box: shorter, and a wrong match shows at a glance (Ronin is not among them).',
};

export default function FocusingMockup() {
  const [variant, setVariant] = useState<Variant>(() =>
    new URLSearchParams(window.location.search).get('variant') === 'matched' ? 'matched' : 'line');
  const choose = (v: string) => {
    setVariant(v as Variant);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.replaceState(null, '', url);
  };
  const [example, setExample] = useState<Example>(EXAMPLES[0]);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Focusing</h1>
        <p className={styles.desc}>
          When no record holds every word of a search, as in a question, the list is ordered by the rarest words the
          records hold, and the server says which typed words the first record does not hold. Real outcomes from the
          6.0 engine on two datasets, the misses kept; pick a question.
        </p>
      </div>
      <Tabs value={variant} onValueChange={choose} items={[
        { label: 'B: A line under it', value: 'line' },
        { label: 'D: Matched words', value: 'matched' },
      ]} />
      <p className={styles.note}>{ABOUT[variant]}</p>

      {(['Films', 'Schools'] as const).map(set => (
        <div key={set} className={styles.examples}>
          <span className={styles.exampleSet}>{set}</span>
          {EXAMPLES.filter(e => e.set === set).map(e => (
            <Chip key={e.typed} selected={e === example} onClick={() => setExample(e)}>{typed(e)}</Chip>
          ))}
        </div>
      ))}

      <div className={styles.page}>
        <SearchField value={typed(example)} readOnly placeholder="Search or ask" clearable={false} />
        {variant === 'line' ? <Line example={example} /> : <Matched example={example} />}
        <Results example={example} />
      </div>
    </main>
  );
}

/** B: what the list went by, and what it left out. */
function Line({ example }: { example: Example }) {
  const ws = words(example);
  const left = ws.filter(w => !w.matched).map(w => w.text);
  return (
    <p className={styles.line}>
      Searched for <strong>{ws.filter(w => w.matched).map(w => w.text).join(' ')}</strong>
      {left.length > 0 && <span className={styles.lineLeft}>, without {left.join(' ')}</span>}
    </p>
  );
}

/** D: only what it went by, a box per word. */
function Matched({ example }: { example: Example }) {
  return (
    <p className={styles.matched}>
      <span className={styles.matchedLabel}>Matched</span>
      {words(example).filter(w => w.matched).map((w, i) => <span key={i} className={styles.word}>{w.text}</span>)}
    </p>
  );
}

function Results({ example }: { example: Example }) {
  return (
    <div className={styles.results}>
      <p className={styles.count}>
        No record holds every word. {example.count} {example.count === 1 ? 'holds' : 'hold'} the most of them; the ones with the rarest words come first.
      </p>
      {example.results.map((title, i) => (
        <div key={title} className={styles.result}>
          <span className={styles.resultTitle}>{title}</span>
          {/* Only for the mockup's reader: which result the question was written about. */}
          {i === example.right && <span className={styles.resultMeta}>the one asked about</span>}
        </div>
      ))}
      {example.right < 0 && <p className={styles.miss}>The one asked about is not among the first three.</p>}
    </div>
  );
}
