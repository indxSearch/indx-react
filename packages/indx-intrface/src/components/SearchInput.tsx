import React from 'react';
import { useSearchContext, DEFAULT_PLACEHOLDER } from '../context/SearchContext';
import { SearchField, Button, Chip, Tooltip } from '@indxsearch/systm';
import type { InputSize } from '@indxsearch/systm';
import { Ai_agent, Enter_key, Filter, Fuzzy_search } from '@indxsearch/pixl';
import { useSearchOrAsk, type SearchOrAskState } from '../hooks/useSearchOrAsk';
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
   *  makes Enter ask. Called with the text to ask; show the answer with `AskPanel`. */
  onAsk?: (text: string) => void;
  /** The offer, when the page runs `useSearchOrAsk` itself (to show it elsewhere too, or to use
   *  `describes`): the field then shows this one and does not judge again. */
  searchOrAsk?: SearchOrAskState;
  /** Where the offer to ask shows. `chip` (default): a button in the field's chip row. `below`: a
   *  row of its own under the field, as on the Indx docs: a full-size button and an Enter hint.
   *  The row keeps its height while Search or ask is on, so an offer appearing moves nothing under it. */
  askOffer?: 'chip' | 'below';
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
  const offerAsk = !!onAsk && hasQuery && sor.offer !== 'none' && sor.stands;

  // While asking is on the field invites both, unless the page chose its own words (a placeholder
  // prop, or placeholderText in the search settings).
  const placeholder = sor.available && searchSettings.placeholderText === DEFAULT_PLACEHOLDER
    ? 'Search or ask'
    : searchSettings.placeholderText;

  const keyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.key !== 'Enter' || !onAsk || sor.offer !== 'strong' || !sor.stands || !query.trim()) return;
    e.preventDefault();
    onAsk(query.trim());
  };

  const clear = () => {
    setQuery('');
    if (filterCount > 0) resetFilters();
  };

  const ask = () => onAsk!(query.trim());
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
      {offerAsk && askOffer === 'chip' && (
        <Button
          variant={sor.offer === 'strong' ? 'primary' : 'ghost'}
          size="micro"
          iconLeft={<Ai_agent />}
          // A strong offer is what Enter asks, so the button says so with the key.
          iconRight={sor.offer === 'strong' ? <Enter_key /> : undefined}
          onClick={ask}
          title={sor.offer === 'strong' ? 'Enter asks' : undefined}
        >
          {sor.offer === 'strong' ? 'Ask' : 'Ask about this'}
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
  const strong = sor.offer === 'strong';
  return (
    <div className={styles.withOffer}>
      {field}
      <div className={styles.offerRow} aria-live="polite">
        {offerAsk && (
          <>
            <Button variant={strong ? 'primary' : 'ghost'} iconLeft={<Ai_agent />} onClick={ask}>
              {strong ? 'Ask the assistant' : 'Ask about this'}
            </Button>
            {strong && <span className={styles.offerHint}><kbd className={styles.kbd}>↵</kbd> to ask</span>}
          </>
        )}
      </div>
    </div>
  );
};
