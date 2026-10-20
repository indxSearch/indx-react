import { useEffect, useRef, useState } from 'react';
import { useSearchContext } from '../context/SearchContext';
import {
  DEFAULT_CUT, DEFAULT_THRESHOLDS, STRICT_COVERAGE, canAnswer, isIdentifier, nextOffer, statisticsParams, triggers,
  type CutRule, type Offer, type OfferThresholds,
} from '../utils/searchOrAsk';
import { stripAskPhrases, type AskPhrases } from '../utils/askPhrases';

export interface UseSearchOrAskOptions {
  /** false keeps the hook quiet: no settings read, no judgement. Default true. */
  enabled?: boolean;
  /** The text to judge. Defaults to the search query of the surrounding SearchProvider. */
  text?: string;
  /** How long the visitor must pause before the server is asked. Default 300 ms. */
  pauseMs?: number;
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
  /** The list should show coverage hits only: the offer is strong and the dataset has the rule on
   *  (`cutWhileAsking`). SearchResults applies it when handed this state; `visibleResults` is the rule. */
  cutResults: boolean;
  /** The cut's two lines, the dataset's, for `visibleResults`. */
  cutRule: CutRule;
  /** The page's searches run with whole-word coverage: the offer is strong and the dataset has
   *  that rule on. The hook sets and clears it on the search context itself. */
  strictCoverage: boolean;
  /** On a catalogue, what to do with a description while typing (the dataset's `filtersWhileTyping`):
   *  'off' leaves the list until Ask, 'facets' applies typed facet values at once, 'model' also asks
   *  the filters route for the rest. `useFilterSuggestion({ auto })` acts on it. */
  filtersWhileTyping: 'off' | 'facets' | 'model';
  /** The offer is for what is in the field now: the field still extends the text it was judged on.
   *  Typing on from a question keeps it (the hook does not ask again while the text only grows);
   *  backspacing into it, or changing it, does not, until the judge has read the new text. Show an
   *  offer only while this holds, or it blinks out on every keystroke or lingers after a change. */
  stands: boolean;
}

const IDLE: SearchOrAskState = { available: false, offer: 'none', p: null, answerable: null, text: '', criteria: null, describes: false, cutResults: false, cutRule: DEFAULT_CUT, strictCoverage: false, filtersWhileTyping: 'off', stands: false };

/**
 * Decides, while the visitor types, whether to offer an answer beside the results. Reads the
 * dataset's Search or ask settings once, then on each typing pause asks the server's judge
 * (`search-or-ask/intent`) when the rules allow, keeps only the newest answer, and applies the
 * dataset's thresholds with hysteresis. It never asks again while the text only grows and the
 * offer is already strong. A failure of any kind leaves the offer at 'none': the search itself is
 * never affected.
 */
export function useSearchOrAsk(options: UseSearchOrAskOptions = {}): SearchOrAskState {
  const { enabled = true, pauseMs = 300 } = options;
  const ctx = useSearchContext();
  const { url, team, dataset, authenticatedFetch, isFetchingInitial, authError, state: search } = ctx;
  // Read when the pause ends, so the judgement names the search the visitor is looking at.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const text = (options.text ?? search.query).trim();

  const [available, setAvailable] = useState(false);
  const [state, setState] = useState<SearchOrAskState>(IDLE);
  const thresholds = useRef<OfferThresholds>(DEFAULT_THRESHOLDS);
  const cutWhileAsking = useRef(true);
  const cutRule = useRef<CutRule>(DEFAULT_CUT);
  const strictWhileAsking = useRef(true);
  const filtersWhileTyping = useRef<'off' | 'facets' | 'model'>('off');
  // The dataset's Ask phrases: registered on the search context, so the list searches what a
  // question is about ("green ogre") while the field shows the question.
  const phrases = useRef<AskPhrases | null>(null);
  // The dataset's two rules for them: refocus the list, and invite on a question's shape.
  const refocus = useRef(true);
  const inviteOnPhrase = useRef(true);
  // The coverage values the strict setup replaced, to put back when the offer drops.
  const relaxed = useRef<Partial<typeof STRICT_COVERAGE> | null>(null);
  const offerRef = useRef<Offer>('none');
  const lastAsked = useRef('');
  const seq = useRef(0);
  const quietUntil = useRef(0);
  offerRef.current = state.offer;

  const base = `${url}/api/teams/${team}/datasets/${dataset}/search-or-ask`;
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
        const body = await res.json() as { settings?: { enabled?: boolean; thresholds?: OfferThresholds; cutWhileAsking?: boolean; cutShareOfTop?: number; cutTopFloor?: number; strictCoverageWhileAsking?: boolean; filtersWhileTyping?: 'off' | 'facets' | 'model'; refocusWhileTyping?: boolean; inviteOnAskPhrase?: boolean }; effective?: { askPhrases?: AskPhrases }; available?: boolean };
        if (cancelled || !body.available || !body.settings?.enabled) return;
        phrases.current = body.effective?.askPhrases ?? null;
        refocus.current = body.settings.refocusWhileTyping ?? true;
        inviteOnPhrase.current = body.settings.inviteOnAskPhrase ?? true;
        filtersWhileTyping.current = body.settings.filtersWhileTyping ?? 'off';
        thresholds.current = { ...DEFAULT_THRESHOLDS, ...body.settings.thresholds };
        cutWhileAsking.current = body.settings.cutWhileAsking ?? true;
        strictWhileAsking.current = body.settings.strictCoverageWhileAsking ?? true;
        cutRule.current = { shareOfTop: body.settings.cutShareOfTop ?? DEFAULT_CUT.shareOfTop, topFloor: body.settings.cutTopFloor ?? DEFAULT_CUT.topFloor };
        setAvailable(true);
      } catch {
        // Off is the safe reading.
      }
    })();
    return () => { cancelled = true; };
  }, [ready, base, authenticatedFetch]);

  // The Ask phrases on the search context while Search or ask is on here, off with it.
  useEffect(() => {
    const { setSearchRewrite } = ctxRef.current;
    const p = phrases.current;
    if (!available || !p || !refocus.current || !setSearchRewrite) return;
    setSearchRewrite(typed => stripAskPhrases(typed, p).text);
    return () => setSearchRewrite(null);
  }, [available]);

  useEffect(() => {
    if (!available) { setState(IDLE); return; }
    if (!text) {
      lastAsked.current = '';
      setState({ ...IDLE, available });
      return;
    }
    if (!triggers(text)) {
      if (isIdentifier(text)) setState(s => ({ ...s, available, offer: 'none', text }));
      return;
    }
    // A question's shape, on the keystroke it takes: the quiet offer at once, the judge's word on
    // the pause. It never forces the strong offer, and a judgement that says otherwise takes it back.
    if (inviteOnPhrase.current && phrases.current && stripAskPhrases(text, phrases.current).taken.length > 0)
      setState(s => (s.offer === 'none' ? { ...s, available, offer: 'invite', text } : s));
    const timer = setTimeout(async () => {
      if (offerRef.current === 'strong' && lastAsked.current && text.startsWith(lastAsked.current)) {
        setState(s => ({ ...s, text }));
        return;
      }
      if (Date.now() < quietUntil.current) return;
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
          const after = Number(res.headers.get('Retry-After'));
          quietUntil.current = Date.now() + (Number.isFinite(after) && after > 0 ? after : 60) * 1000;
          return;
        }
        if (res.status === 409) { setAvailable(false); return; } // switched off since the settings were read
        if (!res.ok) return;
        const { p, answerable, criteria, cutWhileAsking: cut, cutShareOfTop, cutTopFloor, strictCoverageWhileAsking: strict, filtersWhileTyping: fwt } = await res.json() as
          { p: number; answerable?: number | null; criteria?: number | null; cutWhileAsking?: boolean; cutShareOfTop?: number; cutTopFloor?: number; strictCoverageWhileAsking?: boolean; filtersWhileTyping?: 'off' | 'facets' | 'model' };
        if (fwt != null) filtersWhileTyping.current = fwt;
        if (mine !== seq.current) return; // a newer pause has asked since
        // The rules travel with every judgement, so an editor's change applies on the next pause.
        if (cut != null) cutWhileAsking.current = cut;
        if (strict != null) strictWhileAsking.current = strict;
        if (cutShareOfTop != null && cutTopFloor != null) cutRule.current = { shareOfTop: cutShareOfTop, topFloor: cutTopFloor };
        setState(s => {
          const offer = nextOffer(s.offer, p, thresholds.current);
          const c = criteria ?? null;
          const describes = c != null && c >= thresholds.current.strong;
          // On a catalogue a description is answered too (what it finds), so it gets the full offer.
          const asked = offer === 'strong' && !canAnswer(text) ? 'invite' : offer;
          const final = describes ? 'strong' : asked;
          // Both can be high ("what is the largest": question 0.79, description 0.67). The larger
          // decides: a description becomes filters, which replace the list; a question cuts it.
          const asking = final === 'strong' && !(describes && c! > p);
          return { available: true, offer: final, p, answerable: answerable ?? null, text, criteria: c, describes,
            cutResults: cutWhileAsking.current && asking, cutRule: cutRule.current, strictCoverage: strictWhileAsking.current && asking,
            filtersWhileTyping: filtersWhileTyping.current, stands: true };
        });
      } catch {
        // No offer is the safe outcome.
      }
    }, pauseMs);
    return () => clearTimeout(timer);
  }, [text, available, base, authenticatedFetch, pauseMs]);

  // The strict coverage goes on the page's own searches while the offer is strong, and comes off
  // after; each change is a search, so the list tightens as the offer appears and loosens as it
  // goes. Only the values the strict setup names are touched, and they are put back as they were.
  const strictOn = available && state.strictCoverage;
  useEffect(() => {
    const { setSearchSettings, state: search } = ctxRef.current;
    if (strictOn) {
      if (relaxed.current) return;
      const before = search.searchSettings.coverageSetup ?? {};
      relaxed.current = Object.fromEntries(Object.keys(STRICT_COVERAGE).map(k => [k, (before as Record<string, unknown>)[k]])) as Partial<typeof STRICT_COVERAGE>;
      setSearchSettings({ coverageSetup: { ...STRICT_COVERAGE } });
    } else if (relaxed.current) {
      setSearchSettings({ coverageSetup: { ...relaxed.current } });
      relaxed.current = null;
    }
  }, [strictOn]);

  return available ? { ...state, stands: !!state.text && text.startsWith(state.text) } : IDLE;
}
