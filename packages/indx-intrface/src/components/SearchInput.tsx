import React from 'react';
import { useSearchContext, DEFAULT_PLACEHOLDER } from '../context/SearchContext';
import { SearchField, Button, Chip, Tooltip, Kbd, ShimmerText } from '@indxsearch/systm';
import type { InputSize } from '@indxsearch/systm';
import { Ai_agent, Filter, Fuzzy_search } from '@indxsearch/pixl';
import { useSearchOrAsk, type SearchOrAskState } from '../hooks/useSearchOrAsk';
import { QuickAnswer } from './QuickAnswer';
import styles from './SearchInput.module.css';

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize; // Optional prop with valid values
  /** One Clear button that resets the query and the filters, shown whenever there is either. */
  showClear?: boolean;
  showFocus?: boolean;
  /** Chips that say what the search is doing: the number of active filters, "Nearest" when no
   *  result reached the coverage bar, and "No results". */
  showStatus?: boolean;
  /** Search or ask: when given, and the dataset has it switched on, an offer to ask appears in
   *  the chip row while the visitor types something an answer would serve. A strong offer also
   *  makes Enter ask. Called with the text to ask; show the answer with `AskPanel`. The dataset's
   *  mode decides how forward the offer is: in `open` and `proactive` an Ask button is there
   *  whenever something is typed and Enter asks; in `proactive` the field also asks on its own
   *  once the judge is sure, with `{ proactive: true }`, which the page passes to `AskPanel`. */
  onAsk?: (text: string, how?: { proactive: boolean }) => void;
  /** The offer, when the page runs `useSearchOrAsk` itself (to show it elsewhere too, or to use
   *  `describes`): the field then shows this one and does not judge again. */
  searchOrAsk?: SearchOrAskState;
  /** Where the offer to ask shows. `chip` (default): a button in the field's chip row. `below`: a
   *  QuickAnswer under the field, as on the Indx docs. The row keeps its height while Search or ask
   *  is on, so an offer appearing moves nothing under it. `none`: the field shows no offer; the page
   *  shows it itself, with `QuickAnswer` above the results or from `searchOrAsk`. Enter still asks
   *  on a strong offer, and proactive still answers on its own. */
  askOffer?: 'chip' | 'below' | 'none';
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className = '',
  autoFocus = false,
  inputSize = 'default',
  showClear = true,
  showFocus = false,
  showStatus = true,
  onAsk,
  searchOrAsk,
  askOffer = 'chip',
  onKeyDown,
  ...rest
}) => {
  const {
    state: { query, filters, rangeFilters, bucketFilters, results, truncationIndex, searchSettings },
    setQuery,
    resetFilters,
  } = useSearchContext();

  const filterCount =
    Object.values(filters).reduce((n, values) => n + values.length, 0) +
    Object.keys(rangeFilters).length +
    Object.values(bucketFilters ?? {}).reduce((n, ranges) => n + ranges.length, 0);
  const hasQuery = query.length > 0;
  const noResults = hasQuery && results !== null && results.length === 0;
  // With coverage on and a text query, truncationIndex is the place of the last result that reached
  // the coverage bar, and -1 when none did: no word matched as typed, whole, joined, by prefix or
  // suffix, or with a near spelling. What is listed is then the pattern-matching fallback.
  const nearest =
    hasQuery && searchSettings.enableCoverage && results !== null && results.length > 0 && truncationIndex === -1;

  const own = useSearchOrAsk({ enabled: !!onAsk && !searchOrAsk });
  const sor = searchOrAsk ?? own;
  // Only while the offer is for what is in the field (it extends the judged text): typing on keeps
  // it, a backspace takes it away until the judge has read the new text.
  const strongOffer = sor.quick === 'ready';
  const enterAsks = strongOffer || sor.askAnytime;

  // Proactive: the answer starts on the pause where the judge is sure, once per text, and only
  // while the field still holds that text.
  const answered = React.useRef<string | null>(null);
  React.useEffect(() => {
    const t = sor.answerNow;
    if (!onAsk || !t || t !== query.trim() || answered.current === t) return;
    answered.current = t;
    onAsk(t, { proactive: true });
  }, [sor.answerNow, query, onAsk]);
  // Once proactive has started the answer for what is in the field, the chip has nothing more to say.
  const started = answered.current !== null && answered.current === query.trim();
  // What the chip shows: the hook's quick state (QuickAnswer draws the same), or open's plain Ask.
  const chip = !onAsk || !hasQuery || started ? 'none'
    : sor.quick !== 'none' ? sor.quick
    : sor.askAnytime ? 'ask'
    : 'none';

  // While asking is on the field invites both, unless the page chose its own words (a placeholder
  // prop, or placeholderText in the search settings).
  const placeholder = sor.available && searchSettings.placeholderText === DEFAULT_PLACEHOLDER
    ? 'Search or ask'
    : searchSettings.placeholderText;

  const keyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.key !== 'Enter' || !onAsk || !enterAsks || !query.trim()) return;
    e.preventDefault();
    ask();
  };

  const clear = () => {
    setQuery('');
    if (filterCount > 0) resetFilters();
  };

  // Asked by hand counts as started, so proactive does not ask the same text again on its own.
  const ask = () => { answered.current = query.trim(); onAsk!(query.trim()); };
  const field = (
    <SearchField
      type="text"
      value={query}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={className}
      showSearchIcon={true}
      inputSize={inputSize}
      showFocusBorder={showFocus}
      clearable={false}
      onKeyDown={keyDown}
      {...rest}
    >
      {askOffer === 'chip' && chip === 'thinking' && (
        // Proactive, about to answer on its own: no button to press, only the sweep.
        <span className={styles.thinking} aria-live="polite"><Ai_agent /><ShimmerText>Thinking</ShimmerText></span>
      )}
      {askOffer === 'chip' && (chip === 'ready' || chip === 'invite' || chip === 'hint' || chip === 'ask') && (
        <Button
          variant={chip === 'ready' ? 'primary' : 'ghost'}
          className={chip === 'ready' ? styles.askStrong : undefined}
          size="micro"
          iconLeft={<Ai_agent />}
          // A strong offer is what Enter asks, so the button says so with the key.
          iconRight={chip === 'ready' ? <Kbd>Enter ↵</Kbd> : undefined}
          onClick={ask}
          title={enterAsks ? 'Enter asks' : undefined}
        >
          {chip === 'ready' ? 'Ask'
            : chip === 'hint' ? <ShimmerText>For a quick answer, type a bit more</ShimmerText>
            : chip === 'invite' ? 'Ask about this'
            : 'Ask'}
        </Button>
      )}
      {showStatus && noResults && <Chip>No results</Chip>}
      {showStatus && nearest && (
        <Tooltip content="No direct match. Showing the nearest results.">
          <span>
            <Chip icon={<Fuzzy_search />}>Nearest</Chip>
          </span>
        </Tooltip>
      )}
      {showStatus && filterCount > 0 && (
        <Tooltip content={`${filterCount} filter${filterCount === 1 ? '' : 's'} active`}>
          <span>
            <Chip icon={<Filter />} color="var(--CLightBlue)" textColor="#080809">
              {filterCount}
            </Chip>
          </span>
        </Tooltip>
      )}
      {showClear && (hasQuery || filterCount > 0) && (
        <Button
          variant="ghost"
          size="micro"
          onClick={clear}
          aria-label={filterCount > 0 ? 'Clear search and filters' : 'Clear search'}
        >
          Clear
        </Button>
      )}
    </SearchField>
  );

  if (askOffer !== 'below' || !onAsk || !sor.available) return field;
  return (
    <div className={styles.withOffer}>
      {field}
      <div className={styles.offerRow}>
        {!started && <QuickAnswer searchOrAsk={sor} onAsk={ask} className={styles.offerQuick} />}
      </div>
    </div>
  );
};
