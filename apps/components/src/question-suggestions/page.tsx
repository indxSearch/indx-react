import { useState } from 'react';
import { SearchField, Tabs, Button, Chip } from '@indxsearch/systm';
import { Search_or_ask, Question, Document_or_file, Enter_key } from '@indxsearch/pixl';
import { mockScore } from '../mock/searchOrAsk';
import styles from './page.module.css';

/**
 * Mockup, not built: question suggestions. Once the judge thinks the visitor is writing a question,
 * suggest whole questions from a strict question index (questions written from the records, as
 * JevProbe's generator writes them), the way Google and Dia complete a question. In doubt, mix a
 * few into the result list. To judge whether it feels useful before anything is built.
 */

// The question index: questions the records answer. Strict: every word typed must start a word of
// the question, so a suggestion is only ever a question the visitor could be typing.
const QUESTIONS = [
  'How do I add synonyms to a dataset?',
  'How do I turn on fuzzy matching?',
  'How do I give a field more weight than the others?',
  'How do I update one document without reloading everything?',
  'How do I combine two filters?',
  'How do I set up hybrid search?',
  'How do I restrict who can register on my server?',
  'Why does search return fewer results than expected?',
  'Why are my facet counts different from the result count?',
  'What does coverage measure?',
  'What is the difference between filterable and facetable?',
  'What happens to searches while a dataset is reindexed?',
  'Can I run the server in Docker?',
  'Can I change synonyms without reindexing?',
  'Is there a limit on how many documents I can index for free?',
  'Where is my data stored?',
];

const PAGES = [
  { title: 'Synonyms', section: 'Guides' },
  { title: 'Fuzzy matching and typos', section: 'Guides' },
  { title: 'Field weights', section: 'How To' },
  { title: 'Filters', section: 'Guides' },
  { title: 'Set Up Filter or Boost with Multiple Conditions', section: 'How To' },
  { title: 'Hybrid search', section: 'Guides' },
  { title: 'Coverage', section: 'Guides' },
  { title: 'Server Setup', section: 'Guides' },
  { title: 'Licensing', section: 'Guides' },
  { title: 'Troubleshooting', section: 'Guides' },
  { title: 'GDPR & Privacy', section: 'Guides' },
  { title: 'Dynamic indexing', section: 'How To' },
];

const words = (t: string) => t.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

function questionsFor(text: string): string[] {
  const typed = words(text);
  if (typed.length === 0) return [];
  return QUESTIONS.filter(q => {
    const qw = words(q);
    return typed.every(t => qw.some(w => w.startsWith(t)));
  }).slice(0, 5);
}

const QUESTION_WORDS = new Set(['how', 'what', 'why', 'where', 'can', 'is', 'do', 'does', 'i', 'a', 'the', 'to', 'my', 'are']);

function pagesFor(text: string) {
  const typed = words(text).filter(w => !QUESTION_WORDS.has(w));
  if (typed.length === 0) return PAGES.slice(0, 4);
  return PAGES.filter(p => typed.some(t => words(p.title).some(w => w.startsWith(t.slice(0, 4)))));
}

type Mode = 'lookup' | 'doubt' | 'question';
const modeOf = (p: number): Mode => (p >= 0.65 ? 'question' : p >= 0.4 ? 'doubt' : 'lookup');

const MODE_ITEMS = [
  { label: 'From the score', value: 'auto' },
  { label: 'Lookup', value: 'lookup' },
  { label: 'In doubt', value: 'doubt' },
  { label: 'Question', value: 'question' },
];

const EXAMPLES = ['synonyms', 'synonyms dataset', 'how do i', 'how do i add syn', 'why are my facet', 'can i change'];

function Highlight({ text, typed }: { text: string; typed: string }) {
  // The words the visitor typed stay plain; what the suggestion adds is bold, as search engines do.
  const t = words(typed);
  return (
    <>
      {text.split(/(\s+)/).map((part, i) => {
        const w = part.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
        const own = w && t.some(x => w.startsWith(x));
        return own ? <span key={i}>{part}</span> : <strong key={i}>{part}</strong>;
      })}
    </>
  );
}

export default function QuestionSuggestionsPage() {
  const [text, setText] = useState('how do i add syn');
  const [forced, setForced] = useState('auto');
  const [asked, setAsked] = useState<string | null>(null);
  const p = text.trim() ? mockScore(text) : 0;
  const mode: Mode = forced === 'auto' ? modeOf(p) : (forced as Mode);
  const questions = questionsFor(text);
  const pages = pagesFor(text);

  const ask = (q: string) => { setAsked(q); };

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Question suggestions</h1>
        <p className={styles.desc}>
          Mockup, not built. Once the judge thinks the visitor is writing a question, the list under the field
          suggests whole questions from a strict question index: questions the records answer, every typed word
          starting a word of the question. In doubt, a few are mixed in above the results. Picking one asks it.
        </p>
        <p className={styles.note}>Mock judge: a question word or a question mark scores 0.85, three words 0.5, anything else 0.2.</p>
      </div>

      <div className={styles.controls}>
        <Tabs items={MODE_ITEMS} value={forced} onValueChange={setForced} size="micro" variant="button" />
        <div className={styles.examples}>
          {EXAMPLES.map(e => <Button key={e} variant="ghost" size="micro" onClick={() => { setText(e); setAsked(null); }}>{e}</Button>)}
        </div>
      </div>

      <div className={styles.stage}>
        <SearchField value={text} onChange={e => { setText(e.target.value); setAsked(null); }}
                     placeholder="Search or ask" showSearchIcon>
          <span className={styles.score}>p {p.toFixed(2)} · {mode === 'question' ? 'question' : mode === 'doubt' ? 'in doubt' : 'lookup'}</span>
        </SearchField>

        {text.trim() && !asked && (
          <div className={styles.dropdown} role="listbox">
            {mode === 'question' && (
              <>
                <Button variant="ghost" className={`${styles.row} ${styles.askRow}`} onClick={() => ask(text)}
                        iconLeft={<Search_or_ask size={16} />} iconRight={<Enter_key size={14} />}>
                  <span className={styles.rowText}>Ask “{text.trim()}”</span>
                </Button>
                {questions.map(q => (
                  <Button key={q} variant="ghost" className={styles.row} onClick={() => ask(q)} iconLeft={<Question size={16} />}>
                    <span className={styles.rowText}><Highlight text={q} typed={text} /></span>
                  </Button>
                ))}
                {pages.length > 0 && <div className={styles.group}>Pages</div>}
                {pages.slice(0, 2).map(pg => (
                  <div key={pg.title} className={`${styles.row} ${styles.quiet}`}>
                    <span className={styles.rowIcon}><Document_or_file size={16} /></span>
                    <span className={styles.rowText}>{pg.title}</span>
                    <Chip>{pg.section}</Chip>
                  </div>
                ))}
              </>
            )}

            {mode === 'doubt' && (
              <>
                {questions.length > 0 && <div className={styles.group}>Questions</div>}
                {questions.slice(0, 2).map(q => (
                  <Button key={q} variant="ghost" className={styles.row} onClick={() => ask(q)} iconLeft={<Question size={16} />}>
                    <span className={styles.rowText}><Highlight text={q} typed={text} /></span>
                  </Button>
                ))}
                <div className={styles.group}>Pages</div>
                {pages.slice(0, 5).map(pg => (
                  <div key={pg.title} className={styles.row}>
                    <span className={styles.rowIcon}><Document_or_file size={16} /></span>
                    <span className={styles.rowText}>{pg.title}</span>
                    <Chip>{pg.section}</Chip>
                  </div>
                ))}
              </>
            )}

            {mode === 'lookup' && pages.slice(0, 6).map(pg => (
              <div key={pg.title} className={styles.row}>
                <span className={styles.rowIcon}><Document_or_file size={16} /></span>
                <span className={styles.rowText}>{pg.title}</span>
                <Chip>{pg.section}</Chip>
              </div>
            ))}
          </div>
        )}

        {asked && (
          <div className={styles.asked}>
            Would ask <strong>{asked}</strong>, and AskPanel would answer it here.{' '}
            <Button variant="ghost" size="micro" onClick={() => setAsked(null)}>Back to the list</Button>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>The three lists</h2>
        <ul className={styles.notes}>
          <li><strong>Lookup</strong> (below 0.4): results only, as today. No question is suggested to someone looking for a page.</li>
          <li><strong>In doubt</strong> (0.4 to 0.65): two questions above the results. The visitor can take one, or ignore them and pick a page.</li>
          <li><strong>Question</strong> (from 0.65): "Ask" what they typed, first, then whole questions that complete it, then two pages.</li>
          <li><strong>Strict</strong>: a question shows only if every typed word starts one of its words. A loose match would suggest questions the visitor is not writing, which is what makes suggestions feel random rather than magical.</li>
        </ul>
      </div>
    </main>
  );
}
