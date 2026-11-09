import { Fragment, useState } from 'react';
import { Chip, SearchField, SegmentedControl, Tabs } from '@indxsearch/systm';
import { BOOKS, BOOK_QUESTIONS, FILMS, FILM_QUESTIONS, search, type Outcome } from './data';
import styles from './page.module.css';

// A mockup: how a page shows that a search was focused (IndxServer's focusing, Nov 2026). When no
// record holds every word, as in a question, the list is ordered by the rarest words the records
// hold, and the words the first record does not hold were in effect not searched. Three ways of
// saying which, against a stand-in search over a handful of films and books.

type Variant = 'field' | 'line' | 'chips';
type Set = 'films' | 'books';

const ABOUT: Record<Variant, string> = {
  field: 'The words the search did not use are greyed in the field itself, as they are typed. Nothing is added to the page; the visitor sees what counted where they are looking.',
  line: 'A line under the field says what was searched and what was left out, in words. Plain to read, and a place for a link that searches the whole text after all.',
  chips: 'Each word of the search as a chip under the field, the ones left out greyed. Room for a later step: a chip that puts a word back.',
};

export default function FocusingMockup() {
  const [variant, setVariant] = useState<Variant>(() => {
    const asked = new URLSearchParams(window.location.search).get('variant');
    return asked === 'line' || asked === 'chips' ? asked : 'field';
  });
  const choose = (v: string) => {
    setVariant(v as Variant);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.replaceState(null, '', url);
  };
  const [set, setSet] = useState<Set>('films');
  const [text, setText] = useState(FILM_QUESTIONS[0]);
  const records = set === 'films' ? FILMS : BOOKS;
  const questions = set === 'films' ? FILM_QUESTIONS : BOOK_QUESTIONS;
  const outcome = search(records, text);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Focusing</h1>
        <p className={styles.desc}>
          When no record holds every word of a search, as in a question, the list is ordered by the rarest words the
          records hold, and the common words of the question count for little. These variants show the visitor which
          words the search went by. A stand-in search over a few films and books; type, or pick a question.
        </p>
      </div>
      <Tabs value={variant} onValueChange={choose} items={[
        { label: 'A: In the field', value: 'field' },
        { label: 'B: A line under it', value: 'line' },
        { label: 'C: Words as chips', value: 'chips' },
      ]} />
      <p className={styles.note}>{ABOUT[variant]}</p>

      <div className={styles.controls}>
        <SegmentedControl size="micro" value={set} onChange={(s: Set) => { setSet(s); setText((s === 'films' ? FILM_QUESTIONS : BOOK_QUESTIONS)[0]); }}
          items={[{ value: 'films', label: 'Films' }, { value: 'books', label: 'Books' }]} />
        <div className={styles.examples}>
          {questions.map(q => <Chip key={q} selected={q === text} onClick={() => setText(q)}>{q}</Chip>)}
        </div>
      </div>

      <div className={styles.page}>
        {variant === 'field' ? <FieldVariant text={text} setText={setText} outcome={outcome} /> : (
          <SearchField value={text} onChange={e => setText(e.target.value)} placeholder="Search or ask" clearable={false} />
        )}
        {variant === 'line' && <Line outcome={outcome} />}
        {variant === 'chips' && <Chips outcome={outcome} />}
        <Results outcome={outcome} />
      </div>
    </main>
  );
}

/** A: the field draws its own text, greyed where a word was left out. The input's own text is
 *  transparent and a copy of it lies under, word by word; the caret and the selection stay real. */
function FieldVariant({ text, setText, outcome }: { text: string; setText: (t: string) => void; outcome: Outcome }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  outcome.words.forEach((w, i) => {
    if (w.start > at) parts.push(<Fragment key={`s${i}`}>{text.slice(at, w.start)}</Fragment>);
    parts.push(<span key={i} className={w.used ? undefined : styles.leftOut}>{text.slice(w.start, w.end)}</span>);
    at = w.end;
  });
  if (at < text.length) parts.push(<Fragment key="end">{text.slice(at)}</Fragment>);
  return (
    <div className={styles.inField}>
      <SearchField value={text} onChange={e => setText(e.target.value)} placeholder="Search or ask" clearable={false} />
      {/* One span inside the flex box: a flex container drops text that is only spaces. */}
      <div className={styles.mirror} aria-hidden="true"><span>{parts}</span></div>
    </div>
  );
}

/** B: one line, what was searched and what was left out. */
function Line({ outcome }: { outcome: Outcome }) {
  if (!outcome.focused) return null;
  const used = outcome.words.filter(w => w.used).map(w => w.text);
  const left = outcome.words.filter(w => !w.used).map(w => w.text);
  return (
    <p className={styles.line}>
      Searched for <strong>{used.join(' ')}</strong>
      {left.length > 0 && <span className={styles.lineLeft}>, without {left.join(' ')}</span>}
    </p>
  );
}

/** C: the words as chips, the ones left out greyed. */
function Chips({ outcome }: { outcome: Outcome }) {
  if (!outcome.focused) return null;
  return (
    <div className={styles.wordChips}>
      {outcome.words.map((w, i) => (
        <Chip key={i} textColor={w.used ? undefined : 'var(--lv4)'} title={w.used ? 'Searched for' : 'Not in the first result, so not searched for'}>
          {w.text}
        </Chip>
      ))}
    </div>
  );
}

function Results({ outcome }: { outcome: Outcome }) {
  if (outcome.words.length === 0) return null;
  return (
    <div className={styles.results}>
      <p className={styles.count}>
        {outcome.focused
          ? `No record holds every word. ${outcome.count} hold the most of them; the ones with the rarest words come first.`
          : `${outcome.count} ${outcome.count === 1 ? 'record holds' : 'records hold'} every word.`}
      </p>
      {outcome.results.map(r => (
        <div key={r.title} className={styles.result}>
          <div className={styles.resultHead}>
            <span className={styles.resultTitle}>{r.title}</span>
            <span className={styles.resultMeta}>{r.meta}</span>
          </div>
          <span className={styles.resultText}>{r.text}</span>
        </div>
      ))}
    </div>
  );
}
