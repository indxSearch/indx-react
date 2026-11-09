import { useEffect, useRef, useState } from 'react';
import { useSearchContext } from '../context/SearchContext';
import {
  DEFAULT_THRESHOLDS, STRICT_MATCH, canAnswer, isIdentifier, nextOffer, pageMode, sentence, statisticsParams, triggers,
  type Offer, type OfferThresholds, type SearchOrAskMode,
} from '../utils/searchOrAsk';

export interface UseSearchOrAskOptions {
  /** false keeps the hook quiet: no settings read, no judgement. Default true. */
  enabled?: boolean;
  /** The text to judge. Defaults to the search query of the surrounding SearchProvider. */
  text?: string;
  /** How long the visitor must pause before the offer is shown. Default 300 ms. */
  pauseMs?: number;
  /** Ask the judge while the visitor still types, one call in flight at a time, so its answer is
   *  ready when the pause comes; the pause then shows it. Default true. Off, the judge is asked
   *  only once the pause has passed, and the offer follows a judge's round trip later. */
  prefetch?: boolean;
  /** The page's own mode in place of the dataset's: `strict` on a page where a wrong offer costs
   *  more, `open` where asking should always be there. `proactive` applies only where the dataset
   *  is proactive too, since the server starts no answer on its own for any other; elsewhere it is
   *  `inviting`. Left out, the dataset's mode applies. */
  mode?: SearchOrAskMode;
  /** Proactive: how long the visitor must have been still before an answer starts on its own, at
   *  least the pause. Default 1000 ms: a typing pause is a breath, this is having stopped. */
  answerAfterMs?: number;
}

export interface SearchOrAskState {
  /** True once the dataset's settings say Search or ask is on and the instance can run it. Until
   *  then, and for good when it is off, the offer stays 'none' and nothing is sent. */
  available: boolean;
  /** What to show: nothing, a quiet "ask about this", or a strong offer where Enter asks. */
  offer: Offer;
  /** The latest probability from the server, for a readout; null before the first judgement. */
  p: number | null;
  /** The judge's reading of whether the top results could answer what is typed; null when it did not say. */
  answerable: number | null;
  /** The text the offer is about: what would be asked. */
  text: string;
  /** On a catalogue: the probability the visitor describes what to list. Null elsewhere. */
  criteria: number | null;
  /** On a catalogue: the text describes what to list, so it can become filters (useFilterSuggestion). */
  describes: boolean;
  /** The judge's reading of whether what is asked about is among the results; null when it did not
   *  say (a judge not asked it). */
  found: number | null;
  /** Under the full offer to a question, the judge reads what is asked about as not in the results
   *  (`found` below the dataset's `thresholds.found`): dim the list, with a line above it, so the
   *  offer is what the visitor reads first. SearchResults does it when handed this state. */
  notFound: boolean;
  /** Asking is held: the model provider refuses answers for now (the judgement's reason `paused`),
   *  or the dataset's calls for today are spent. Nothing is offered, in any mode, until it passes;
   *  the search works as before. */
  held: boolean;
  /** The page's searches match whole words only: the offer is strong and the dataset has that rule
   *  on (`strictCoverageWhileAsking`). The hook sets and clears it on the search context itself. */
  strictCoverage: boolean;
  /** On a catalogue, what to do with a description while typing (the dataset's `filtersWhileTyping`):
   *  'off' leaves the list until Ask, 'facets' applies typed facet values at once, 'model' also asks
   *  the filters route for the rest. `useFilterSuggestion({ auto })` acts on it. */
  filtersWhileTyping: 'off' | 'facets' | 'model';
  /** The dataset's mode (`strict`, `soft`, `open`, `inviting`, `proactive`), as the latest
   *  judgement said it: proactive comes back as inviting once the day's proactive answers are spent. */
  mode: SearchOrAskMode;
  /** Asking is there whatever the judge says (open, inviting and proactive): show an Ask button
   *  once something is typed, and let Enter ask. */
  askAnytime: boolean;
  /** The judge's reading of whether the visitor has finished typing it ("what type is" has not);
   *  null when it did not say. */
  finished: number | null;
  /** Proactive: the text to answer now, without a click, once the judge is sure, reads it as
   *  finished, and the visitor has been still for `answerAfterMs`.
   *  SearchInput asks it once (`onAsk(text, { proactive: true })`); a page with its own field does
   *  the same. Null otherwise. */
  answerNow: string | null;
  /** The offer as one state for a surface to draw (QuickAnswer, SearchInput's chip), so they never
   *  disagree: `invite`, the quiet "Ask about this" (strict, soft, open); `hint`, the inviting
   *  modes' "For a quick answer, type a bit more", sweeping (inviting, proactive: from the
   *  thresholds' low `hint` score, or a sentence; also proactive's sure offer on a question not yet
   *  finished); `ready`, the full offer, Enter asks
   *  (every mode but proactive); `thinking`, proactive about to answer on its own, sweeping, no
   *  button; `ask`, a plain Ask with nothing more to say (open, inviting and proactive, where
   *  asking is always there); `none` otherwise. Only while the offer stands for what is in the field. */
  quick: QuickState;
  /** The offer is for what is in the field now: the field still extends the text it was judged on.
   *  Typing on from a question keeps it (the hook does not ask again while the text only grows);
   *  backspacing into it, or changing it, does not, until the judge has read the new text. Show an
   *  offer only while this holds, or it blinks out on every keystroke or lingers after a change. */
  stands: boolean;
}

export type QuickState = 'none' | 'invite' | 'hint' | 'ready' | 'thinking' | 'ask';

/** Thresholds as sent, with the defaults where they say nothing. The server resolves every one, the
 *  judge's own where the dataset sets none; the defaults are for a value it leaves out. */
function withDefaults(t?: OfferThresholds): OfferThresholds {
  return { ...DEFAULT_THRESHOLDS, ...t, hint: t?.hint ?? DEFAULT_THRESHOLDS.hint, finished: t?.finished ?? DEFAULT_THRESHOLDS.finished,
    found: t?.found ?? DEFAULT_THRESHOLDS.found };
}

const IDLE: SearchOrAskState = { available: false, offer: 'none', p: null, answerable: null, text: '', criteria: null, describes: false, found: null, notFound: false, held: false, strictCoverage: false, filtersWhileTyping: 'off', mode: 'soft', askAnytime: false, finished: null, answerNow: null, quick: 'none', stands: false };

/**
 * Decides, while the visitor types, whether to offer an answer beside the results. Reads the
 * dataset's Search or ask settings once, then on each typing pause asks the server's judge
 * (`search-or-ask/intent`) when the rules allow, keeps only the newest answer, and applies the
 * dataset's thresholds with hysteresis. It never asks again while the text only grows and the
 * offer is already strong. A failure of any kind leaves the offer at 'none': the search itself is
 * never affected.
 *
 * While the visitor types, the judge is asked ahead (`prefetch`): one call in flight, and when it
 * returns, the next for whatever the field holds by then, so the calls keep pace with the judge
 * rather than the keyboard. Those fill the server's cache and show nothing. The pause's own call
 * is the judgement, as before, and answers from that cache at once; while a call for the same text
 * is still out, the pause waits for it instead of asking the judge twice. A judgement is shown only
 * for the text it was made on (27 Oct 2026).
 */
export function useSearchOrAsk(options: UseSearchOrAskOptions = {}): SearchOrAskState {
  const { enabled = true, pauseMs = 300, prefetch = true, mode: chosenMode, answerAfterMs = 1000 } = options;
  const ctx = useSearchContext();
  const { url, team, dataset, authenticatedFetch, isFetchingInitial, authError, state: search } = ctx;
  // Read when the pause ends, so the judgement names the search the visitor is looking at.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const text = (options.text ?? search.query).trim();

  const [available, setAvailable] = useState(false);
  const [state, setState] = useState<SearchOrAskState>(IDLE);
  const thresholds = useRef<OfferThresholds>(DEFAULT_THRESHOLDS);
  const strictWhileAsking = useRef(true);
  const filtersWhileTyping = useRef<'off' | 'facets' | 'model'>('off');
  // The dataset's mode, as the settings and each judgement say it; `modeNow` is what applies.
  const datasetMode = useRef<SearchOrAskMode>('soft');
  const chosenModeRef = useRef(chosenMode);
  chosenModeRef.current = chosenMode;
  const mode = { get current() { return pageMode(datasetMode.current, chosenModeRef.current); } };
  // The coverage values the strict setup replaced, to put back when the offer drops.
  const relaxed = useRef<Record<string, unknown> | null>(null);
  const offerRef = useRef<Offer>('none');
  const lastAsked = useRef('');
  const seq = useRef(0);
  const quietUntil = useRef(0);
  offerRef.current = state.offer;
  // Ahead of the pause: the call out now, the texts the judge has already read (its cache holds
  // them), and a quiet of its own after a 429, so a refused prefetch never silences the pauses.
  const flight = useRef<{ text: string; done: Promise<void> } | null>(null);
  const readAhead = useRef(new Set<string>());
  const aheadQuietUntil = useRef(0);
  const latest = useRef(text);
  latest.current = text;
  const availableRef = useRef(false);
  availableRef.current = available;
  // The dataset's calls for today are spent (an intent's 429 searchOrAskBudgetSpent): held until then.
  const [spentUntil, setSpentUntil] = useState(0);
  useEffect(() => {
    if (!spentUntil) return;
    const timer = setTimeout(() => setSpentUntil(0), Math.max(0, spentUntil - Date.now()));
    return () => clearTimeout(timer);
  }, [spentUntil]);

  const base = `${url}/api/teams/${team}/datasets/${dataset}/search-or-ask`;
  // The inviting modes ask the judge from three characters, so "How" gets its hint.
  const minChars = () => (mode.current === 'inviting' || mode.current === 'proactive' ? 3 : 4);
  const isFinished = (f: number | null | undefined) => f != null && f >= (thresholds.current.finished ?? 0.5);
  // Typing on from a sure question needs no new judgement, except in proactive, where whether it is
  // finished is the judge's to say for each text.
  const growsFromStrong = (t: string) =>
    mode.current !== 'proactive' && offerRef.current === 'strong' && !!lastAsked.current && t.startsWith(lastAsked.current);
  const ready = enabled && !isFetchingInitial && !authError;

  // The settings, once per dataset: whether it is on here, and the thresholds to apply.
  useEffect(() => {
    setAvailable(false);
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await authenticatedFetch(base);
        if (!res.ok) return;
        const body = await res.json() as { settings?: { enabled?: boolean; mode?: SearchOrAskMode; thresholds?: OfferThresholds; strictCoverageWhileAsking?: boolean; filtersWhileTyping?: 'off' | 'facets' | 'model'; }; available?: boolean };
        if (cancelled || !body.available || !body.settings?.enabled) return;
        filtersWhileTyping.current = body.settings.filtersWhileTyping ?? 'off';
        datasetMode.current = body.settings.mode ?? 'soft';
        thresholds.current = withDefaults(body.settings.thresholds);
        strictWhileAsking.current = body.settings.strictCoverageWhileAsking ?? true;
        setAvailable(true);
      } catch {
        // Off is the safe reading.
      }
    })();
    return () => { cancelled = true; };
  }, [ready, base, authenticatedFetch]);

  // One judgement ahead of the pause, then the next for what the field holds when it returns.
  const ahead = useRef<(t: string) => void>(() => {});
  ahead.current = (t: string) => {
    if (!prefetch || !availableRef.current || flight.current || !t || !triggers(t, minChars()) || readAhead.current.has(t)) return;
    if (growsFromStrong(t)) return;
    if (Date.now() < quietUntil.current || Date.now() < aheadQuietUntil.current) return;
    const done = (async () => {
      try {
        const res = await authenticatedFetch(`${base}/intent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: t, prefetch: true }),
        });
        if (res.status === 429) {
          const after = Number(res.headers.get('Retry-After'));
          aheadQuietUntil.current = Date.now() + (Number.isFinite(after) && after > 0 ? after : 60) * 1000;
          return;
        }
        if (res.ok) {
          if (readAhead.current.size > 200) readAhead.current.clear();
          readAhead.current.add(t);
        }
      } catch {
        // The pause asks for itself.
      }
    })();
    flight.current = { text: t, done };
    void done.then(() => {
      if (flight.current?.done === done) flight.current = null;
      if (latest.current !== t) ahead.current(latest.current);
    });
  };

  useEffect(() => {
    if (!available) { setState(IDLE); return; }
    if (!text) {
      lastAsked.current = '';
      setState({ ...IDLE, available });
      return;
    }
    if (!triggers(text, minChars())) {
      if (isIdentifier(text)) setState(s => ({ ...s, available, offer: 'none', text }));
      return;
    }
    ahead.current(text);
    let gone = false;
    const timer = setTimeout(async () => {
      if (growsFromStrong(text)) {
        setState(s => ({ ...s, text }));
        return;
      }
      if (Date.now() < quietUntil.current) return;
      // The judge is reading this very text ahead: its answer, not a second call to the judge.
      if (flight.current?.text === text) await flight.current.done;
      if (gone) return;
      const mine = ++seq.current;
      lastAsked.current = text;
      try {
        const res = await authenticatedFetch(`${base}/intent${statisticsParams(ctxRef.current)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (res.status === 429) {
          // Too many from this address, or the dataset's budget for today: stay quiet until told.
          // A spent budget also holds asking, since an ask would be refused the same way.
          const after = Number(res.headers.get('Retry-After'));
          quietUntil.current = Date.now() + (Number.isFinite(after) && after > 0 ? after : 60) * 1000;
          const { code } = await res.json().catch(() => ({})) as { code?: string };
          if (code === 'searchOrAskBudgetSpent' && mine === seq.current) {
            setSpentUntil(quietUntil.current);
            setState(s => ({ ...s, offer: 'none', answerNow: null, strictCoverage: false, notFound: false }));
          }
          return;
        }
        // Switched off since the settings were read (409), or not shown on the dataset (404).
        if (res.status === 409 || res.status === 404) { setAvailable(false); return; }
        if (!res.ok) return;
        const { p, answerable, criteria, finished: fin, found: fnd, reason, thresholds: judged, strictCoverageWhileAsking: strict, filtersWhileTyping: fwt, mode: m } = await res.json() as
          { p: number; answerable?: number | null; criteria?: number | null; finished?: number | null; found?: number | null; reason?: string | null; thresholds?: OfferThresholds; strictCoverageWhileAsking?: boolean; filtersWhileTyping?: 'off' | 'facets' | 'model'; mode?: SearchOrAskMode };
        if (fwt != null) filtersWhileTyping.current = fwt;
        if (mine !== seq.current) return; // a newer pause has asked since
        // The rules travel with every judgement, so an editor's change applies on the next pause.
        if (strict != null) strictWhileAsking.current = strict;
        if (m != null) datasetMode.current = m;
        // The judgement's thresholds are the dataset's resolved: the kind's hint filled in.
        if (judged) thresholds.current = withDefaults(judged);
        setState(s => {
          const offer = nextOffer(s.offer, p, thresholds.current);
          const c = criteria ?? null;
          const describes = c != null && c >= thresholds.current.strong;
          // The full offer waits for a whole question: one word holds nothing to answer, and the
          // judge's "finished" reads the rest ("hvilken skole er" is sure but stops on a word still
          // waiting). Until then the invitation. Entering only: a sure question typed on stays sure.
          const typedOn = s.offer === 'strong' && !!s.text && text.startsWith(s.text);
          const whole = typedOn || (canAnswer(text) && (fin == null || isFinished(fin)));
          const asked = offer === 'strong' && !whole ? 'invite' : offer;
          // On a catalogue a description is answered too (what it finds), so it gets the full offer,
          // once it is whole as well: "barneskoler i" has no place yet.
          const chosen = describes && whole ? 'strong' : describes ? 'invite' : asked;
          const final = mode.current === 'strict' && chosen === 'invite' ? 'none' : chosen;
          // Both can be high ("what is the largest": question 0.79, description 0.67). The larger
          // decides: a description becomes filters, which replace the list; a question is answered
          // beside it.
          const asking = final === 'strong' && !(describes && c! > p);
          const found = fnd ?? null;
          const foundLine = thresholds.current.found ?? 0;
          return { available: true, offer: final, p, answerable: answerable ?? null, text, criteria: c, describes,
            found, notFound: asking && found != null && foundLine > 0 && found < foundLine,
            // The provider refuses answers for now: the server answered p 0, and nothing is offered.
            held: reason === 'paused',
            strictCoverage: strictWhileAsking.current && asking,
            filtersWhileTyping: filtersWhileTyping.current, mode: mode.current, askAnytime: false, quick: 'none',
            finished: fin ?? null,
            answerNow: mode.current === 'proactive' && final === 'strong' && isFinished(fin) ? text : null, stands: true };
        });
      } catch {
        // No offer is the safe outcome.
      }
    }, pauseMs);
    return () => { gone = true; clearTimeout(timer); };
  }, [text, available, base, authenticatedFetch, pauseMs]);

  // Proactive: the answer is ripe once the visitor has stayed still for answerAfterMs. The judgement
  // came after the pause, so what is left to wait is the rest of it; typing again resets it.
  const [ripe, setRipe] = useState<string | null>(null);
  useEffect(() => {
    setRipe(null);
    const t = state.answerNow;
    if (!t || t !== text) return;
    const timer = setTimeout(() => setRipe(t), Math.max(0, answerAfterMs - pauseMs));
    return () => clearTimeout(timer);
  }, [state.answerNow, text, answerAfterMs, pauseMs]);

  // The strict matching goes on the page's own searches while the offer is strong, and comes off
  // after; each change is a search, so the list tightens as the offer appears and loosens as it
  // goes. Only the values the strict setup names are touched, and they are put back as they were.
  const strictOn = available && state.strictCoverage;
  useEffect(() => {
    const { setSearchSettings, state: search } = ctxRef.current;
    if (strictOn) {
      if (relaxed.current) return;
      const before = (search.searchSettings.match ?? {}) as Record<string, unknown>;
      relaxed.current = Object.fromEntries(Object.keys(STRICT_MATCH).map(k => [k, before[k]]));
      setSearchSettings({ match: { ...STRICT_MATCH } });
    } else if (relaxed.current) {
      setSearchSettings({ match: { ...relaxed.current } });
      relaxed.current = null;
    }
  }, [strictOn]);

  if (!available) return IDLE;
  const m = mode.current;
  const stands = !!state.text && text.startsWith(state.text);
  const held = state.held || spentUntil > 0;
  if (held) return { ...state, mode: m, held, offer: 'none', askAnytime: false, answerNow: null, quick: 'none', notFound: false, strictCoverage: false, stands };
  const sweeps = m === 'inviting' || m === 'proactive';
  // Proactive's sure offer on the text in the field: it answers on its own, so it thinks rather
  // than offering a button; on a text that stops on "is", it is still a hint to type on.
  // Inviting and proactive invite early, to teach that the field answers: from the low hint score
  // (Jev reads "How" and "Hvordan" as a question starting, a name or a place as a lookup), and on
  // a sentence (a question mark, or three words) whatever the judge says of it, before the judge
  // has answered for it too. No word list: the judge reads any language.
  const hinted = sweeps && !!text && ((stands && state.p != null && state.p >= (thresholds.current.hint ?? 1)) || sentence(text));
  const quick: QuickState = !text ? 'none'
    : stands && state.offer === 'strong' ? (m === 'proactive' ? (isFinished(state.finished) ? 'thinking' : 'hint') : 'ready')
    : stands && state.offer === 'invite' ? (sweeps ? 'hint' : 'invite')
    : hinted ? 'hint'
    : m === 'open' || sweeps ? 'ask'
    : 'none';
  return { ...state, mode: m, askAnytime: m === 'open' || sweeps,
    answerNow: ripe !== null && ripe === text && state.answerNow === text ? ripe : null,
    // A hint from the shape alone is about what is in the field, which no judgement has named yet.
    text: (quick === 'hint' || quick === 'ask') && !stands ? text : state.text,
    notFound: stands && state.notFound,
    quick, stands };
}
