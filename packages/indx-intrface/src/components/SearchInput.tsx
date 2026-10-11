import React from 'react';
import { useSearchContext } from '../context/SearchContext';
import { SearchField, Button, Chip, Tooltip } from '@indxsearch/systm';
import type { InputSize } from '@indxsearch/systm';
import { Ai_agent, Filter, Fuzzy_search } from '@indxsearch/pixl';
import { useSearchOrAsk } from '../hooks/useSearchOrAsk';

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
}

export const SearchInput: React.FC<SearchInputProps> = ({
  className = '',
  autoFocus = false,
  inputSize = 'default',
  showClear = true,
  showFocus = false,
  showStatus = true,
  onAsk,
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

  const sor = useSearchOrAsk({ enabled: !!onAsk });
  const offerAsk = !!onAsk && hasQuery && sor.offer !== 'none';

  const keyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || e.key !== 'Enter' || !onAsk || sor.offer !== 'strong' || !query.trim()) return;
    e.preventDefault();
    onAsk(query.trim());
  };

  const clear = () => {
    setQuery('');
    if (filterCount > 0) resetFilters();
  };

  return (
    <SearchField
      type="text"
      value={query}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
      placeholder={searchSettings.placeholderText}
      autoFocus={autoFocus}
      className={className}
      showSearchIcon={true}
      inputSize={inputSize}
      showFocusBorder={showFocus}
      onKeyDown={keyDown}
      {...rest}
    >
      {offerAsk && (
        <Button
          variant={sor.offer === 'strong' ? 'primary' : 'ghost'}
          size="micro"
          iconLeft={<Ai_agent />}
          onClick={() => onAsk!(query.trim())}
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
};
