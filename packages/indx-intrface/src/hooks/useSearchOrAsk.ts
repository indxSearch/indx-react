import { useEffect, useRef, useState } from 'react';
import { useSearchContext } from '../context/SearchContext';
import {
  DEFAULT_THRESHOLDS, canAnswer, isIdentifier, nextOffer, statisticsParams, triggers,
  type Offer, type OfferThresholds,
} from '../utils/searchOrAsk';

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
  /** The text the offer is about: what would be asked. */
  text: string;
  /** On a catalogue: the probability the visitor describes what to list. Null elsewhere. */
  criteria: number | null;
  /** On a catalogue: the text describes what to list, so it can become filters (useFilterSuggestion). */
  describes: boolean;
  /** The list should show coverage hits only: the offer is strong and the dataset has the rule on
   *  (`cutWhileAsking`). SearchResults applies it when handed this state; `visibleResults` is the rule. */
  cutResults: boolean;
}

const IDLE: SearchOrAskState = { available: false, offer: 'none', p: null, text: '', criteria: null, describes: false, cutResults: false };

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
        const body = await res.json() as { settings?: { enabled?: boolean; thresholds?: OfferThresholds; cutWhileAsking?: boolean }; available?: boolean };
        if (cancelled || !body.available || !body.settings?.enabled) return;
        thresholds.current = { ...DEFAULT_THRESHOLDS, ...body.settings.thresholds };
        cutWhileAsking.current = body.settings.cutWhileAsking ?? true;
        setAvailable(true);
      } catch {
        // Off is the safe reading.
      }
    })();
    return () => { cancelled = true; };
  }, [ready, base, authenticatedFetch]);

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
        const { p, criteria, cutWhileAsking: cut } = await res.json() as { p: number; criteria?: number | null; cutWhileAsking?: boolean };
        if (mine !== seq.current) return; // a newer pause has asked since
        // The rule travels with every judgement, so an editor's change applies on the next pause.
        if (cut != null) cutWhileAsking.current = cut;
        setState(s => {
          const offer = nextOffer(s.offer, p, thresholds.current);
          const c = criteria ?? null;
          const describes = c != null && c >= thresholds.current.strong;
          // On a catalogue a description is answered too (what it finds), so it gets the full offer.
          const asked = offer === 'strong' && !canAnswer(text) ? 'invite' : offer;
          const final = describes ? 'strong' : asked;
          // A description becomes filters, which replace the list; the cut is for questions.
          return { available: true, offer: final, p, text, criteria: c, describes, cutResults: cutWhileAsking.current && final === 'strong' && !describes };
        });
      } catch {
        // No offer is the safe outcome.
      }
    }, pauseMs);
    return () => clearTimeout(timer);
  }, [text, available, base, authenticatedFetch, pauseMs]);

  return available ? state : IDLE;
}
