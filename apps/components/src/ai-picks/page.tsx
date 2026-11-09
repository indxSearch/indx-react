import { useState, type ReactNode } from 'react';
import {
  AssistantMessage, AnswerActions, Base, Button, Chip, CitationList, CitationRef, Disclosure, SearchField, Tabs, UserMessage,
} from '@indxsearch/systm';
import { Ai_agent } from '@indxsearch/pixl';
import { ANSWER, LEFT_OUT, PICKS, QUESTION, SEARCHED, SEARCH_COUNT, STEPS, type Film, type Pick } from './data';
import styles from './page.module.css';

// A mockup (9 Nov 2026): while the visitor is in a dialogue with the assistant on a catalogue, the
// result list is the films the assistant picked, not a search it hands the page. Today the agent's
// show_results is one search (words, filters, an order) and the page runs it, so for a property no
// field holds ("queer") the list is whatever the word matches. Mock data, no server.

type Variant = 'replace' | 'then' | 'checked';

const ABOUT: Record<Variant, ReactNode> = {
  replace: <>The picks take the list's place while the conversation is open: numbered as the answer cites them, each with a line on why it was chosen. The search is one click away, and typing in the field brings it back.</>,
  then: <>The picks first, then the search the visitor typed, dimmed under a heading of its own. Nothing is hidden, and the picks still lead.</>,
  checked: <>The picks, and below them what the assistant read and left out, with why: the films the word "queen" matched. It shows the work, so a visitor can trust the picks, and an owner can see where the data falls short.</>,
};

/** The answer's text with each [n] as a citation mark; hovering one marks its pick in the list. */
function Cited({ text, onHover }: { text: string; onHover: (n: number | null) => void }) {
  const parts = text.split(/(\[\d+\])/);
  return (
    <p className={styles.answer}>
      {parts.map((p, i) => {
        const m = /^\[(\d+)\]$/.exec(p);
        if (!m) return <span key={i}>{p}</span>;
        const n = Number(m[1]);
        return (
          <span key={i} onMouseEnter={() => onHover(n)} onMouseLeave={() => onHover(null)}>
            <CitationRef n={n} title={PICKS.find(x => x.n === n)?.title} />
          </span>
        );
      })}
    </p>
  );
}

function Poster({ film }: { film: Film }) {
  return <div className={styles.poster} aria-hidden="true">{film.title.slice(0, 1)}</div>;
}

/** A pick in the list: its number from the answer, the film, and why it was chosen. */
function PickRow({ pick, marked }: { pick: Pick; marked: boolean }) {
  return (
    <div className={`${styles.row} ${marked ? styles.marked : ''}`}>
      <span className={styles.n}>{pick.n}</span>
      <Poster film={pick} />
      <div className={styles.film}>
        <div className={styles.titleLine}>
          <span className={styles.title}>{pick.title}</span>
          <span className={styles.muted}>{pick.year}</span>
        </div>
        <div className={styles.why}><Ai_agent size={12} color="currentColor" /><span>{pick.why}</span></div>
        <div className={styles.genres}>{pick.genres.map(g => <Chip key={g}>{g}</Chip>)}</div>
      </div>
    </div>
  );
}

/** A search hit, as the list shows it today. */
function FilmRow({ film, note }: { film: Film; note?: string }) {
  return (
    <div className={styles.row}>
      <span className={styles.n} />
      <Poster film={film} />
      <div className={styles.film}>
        <div className={styles.titleLine}>
          <span className={styles.title}>{film.title}</span>
          <span className={styles.muted}>{film.year}</span>
        </div>
        {note ? <div className={styles.leftOutWhy}>{note}</div> : <div className={styles.overview}>{film.overview}</div>}
        <div className={styles.genres}>{film.genres.map(g => <Chip key={g}>{g}</Chip>)}</div>
      </div>
    </div>
  );
}

/** The head over the picks: what they are, how many, and the way to the search. */
function PicksHead({ onSearch }: { onSearch: () => void }) {
  return (
    <div className={styles.listHead}>
      <span className={styles.listTitle}><Ai_agent size={14} color="currentColor" />Picked by the assistant</span>
      <span className={styles.muted}>{PICKS.length}</span>
      <span className={styles.spacer} />
      <Button variant="ghost" size="micro" onClick={onSearch}>Show the search instead</Button>
    </div>
  );
}

/** The search list, as today: what the field's words found. */
function SearchList({ onPicks }: { onPicks?: () => void }) {
  return (
    <>
      <div className={styles.listHead}>
        <span className={styles.listTitle}>Search for “{QUESTION}”</span>
        <span className={styles.muted}>{SEARCH_COUNT}</span>
        <span className={styles.spacer} />
        {onPicks && <Button variant="ghost" size="micro" onClick={onPicks}>Back to the assistant's picks</Button>}
      </div>
      {SEARCHED.map(f => <FilmRow key={f.key} film={f} />)}
    </>
  );
}

function Results({ variant, marked }: { variant: Variant; marked: number | null }) {
  const [search, setSearch] = useState(false);
  if (search) return <SearchList onPicks={() => setSearch(false)} />;
  return (
    <>
      <PicksHead onSearch={() => setSearch(true)} />
      {PICKS.map(p => <PickRow key={p.n} pick={p} marked={marked === p.n} />)}
      {variant === 'then' && (
        <div className={styles.after}>
          <div className={styles.listHead}>
            <span className={styles.listTitle}>From the search for “{QUESTION}”</span>
            <span className={styles.muted}>{SEARCH_COUNT}</span>
          </div>
          <div className={styles.dimmed}>{SEARCHED.slice(1).map(f => <FilmRow key={f.key} film={f} />)}</div>
        </div>
      )}
      {variant === 'checked' && (
        <Disclosure summary={<span className={styles.listTitle}>Read and left out <span className={styles.muted}>{LEFT_OUT.length}</span></span>}
                    className={styles.leftOut}>
          {LEFT_OUT.map(f => <FilmRow key={f.key} film={f} note={f.why} />)}
        </Disclosure>
      )}
    </>
  );
}

/** The assistant beside the list, as the democenter has it. */
function Assistant({ onHover }: { onHover: (n: number | null) => void }) {
  return (
    <Base className={styles.assistant}>
      <UserMessage>{QUESTION}</UserMessage>
      <AssistantMessage label="Answer">
        <div className={styles.steps}>{STEPS.map(s => <span key={s}>{s}</span>)}</div>
        <Cited text={ANSWER} onHover={onHover} />
        <CitationList items={PICKS.map(p => ({ n: p.n, title: p.title }))} label="Picked" />
        <AnswerActions onCopy={() => {}} onFollowUp={() => {}} />
      </AssistantMessage>
    </Base>
  );
}

function Frame({ variant }: { variant: Variant }) {
  const [marked, setMarked] = useState<number | null>(null);
  return (
    <div className={styles.frame}>
      <div className={styles.main}>
        <SearchField value={QUESTION} onChange={() => {}} showSearchIcon inputSize="default" />
        <div className={styles.list}><Results key={variant} variant={variant} marked={marked} /></div>
      </div>
      <Assistant onHover={setMarked} />
    </div>
  );
}

export default function AiPicksMockup() {
  const [variant, setVariant] = useState<Variant>(() => {
    const asked = new URLSearchParams(window.location.search).get('variant');
    return asked === 'then' || asked === 'checked' ? asked : 'replace';
  });
  const choose = (v: string) => {
    setVariant(v as Variant);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.replaceState(null, '', url);
  };

  return (
    <main className={styles.page}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>AI picks</h1>
        <p className={styles.desc}>
          On a catalogue, while the visitor talks with the assistant, the result list is the films the assistant picked, in the
          answer's order and numbered as it cites them, not a search it hands the page. A visitor asked a film catalogue to
          "find queer movies": no field holds that, so a search can only match the word, and with a typo allowed "queen" too.
          The assistant reads the records and knows. Mock data.
        </p>
      </div>
      <Tabs value={variant} onValueChange={choose} items={[
        { label: 'A: The picks are the list', value: 'replace' },
        { label: 'B: The picks, then the search', value: 'then' },
        { label: 'C: The picks, and what was left out', value: 'checked' },
      ]} />
      <p className={styles.note}>{ABOUT[variant]} Hover a citation in the answer to see its pick.</p>
      <Frame variant={variant} />
      <p className={styles.note}>
        Today: the list is the search for "queer", which lists Queer (2024) and then four films about queens. The answer's sources
        are that search's first records.
      </p>
    </main>
  );
}
