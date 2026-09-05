import React, { useEffect, useRef, useState } from 'react';
import styles from './ValueFilterPanel.module.css';
import { useSearchContext } from '../context/SearchContext';
import { Checkbox, Button, ToggleSwitch, FilterPanelBase } from '@indxsearch/systm';
import { FilterPanelSkeleton } from './FilterPanelSkeleton';

export interface ValueFilterPanelProps {
  field: string;
  label?: string;
  preserveBlankFacetState?: boolean; // True if values should still render when facets are empty
  preserveBlankFacetStateOrder?: boolean; // Keep the order of facets that are preserved even if they are empty
  sortFacetsBy?: 'histogram' | 'alphabetical' | 'numeric';
  limit?: number; // Maximum number of items to show before collapsing.
  collapsible?: boolean; // If filter panel should be able to be collapsed
  startCollapsed?: boolean; // If filter should display as collapsed from init
  displayType?: 'checkbox' | 'button' | 'toggle';
  layout?: 'list' | 'grid';
  showActivePanel?: boolean; // Change background color of panel when filtered
  showCount?: boolean; // Show histogram of filters
  showNull?: boolean; // If true, include entries with count === null
  /**
   * How several selected values combine. `'all'` (default) requires a document to
   * carry every selected value — right for multi-valued fields such as genres,
   * where each click narrows the results. `'any'` matches documents with at least
   * one of them — use it on scalar fields, where a document can only hold one value
   * and AND would always return nothing.
   */
  match?: 'all' | 'any';
  displayIfEmptyQuery?: boolean;
  displayCondition?: (context: {
    query: string;
    filters: Record<string, string[]>;
    facets: any;
  }) => boolean;
}

export const ValueFilterPanel: React.FC<ValueFilterPanelProps> = ({
  field,
  label,
  preserveBlankFacetState = false,
  preserveBlankFacetStateOrder = false,
  sortFacetsBy = 'histogram',
  limit = 10,
  collapsible = true,
  startCollapsed = false,
  displayType = 'checkbox',
  layout = 'list',
  showActivePanel = false,
  showCount = true,
  showNull = false,
  match = 'all',
  displayIfEmptyQuery = true,
  displayCondition = (_: { query: string; filters: any; facets: any }) => true
}) => {
  const {
    state: { facets, filterableFields, facetableFields, filters, query },
    toggleFilter,
    setValueMatch,
    isFetchingInitial,
    allowEmptySearch
  } = useSearchContext();

  useEffect(() => {
    setValueMatch(field, match);
  }, [field, match, setValueMatch]);

  const preservedFacetValuesRef = useRef<Record<string, number | null> | null>(null);
  const [visibleCount, setVisibleCount] = useState(limit);

  // Reset visible count when facets change (e.g., new search results or filters applied)
  useEffect(() => {
    setVisibleCount(limit);
  }, [facets?.[field], limit]);

  // Don't show if query is empty and allowEmptySearch is false
  if (!allowEmptySearch && !query) {
    return null;
  }

  if (isFetchingInitial || !facets) {
    if (displayType === 'toggle') {
      return <FilterPanelSkeleton rows={1} collapsible={false} />;
    }
    return (
      <FilterPanelSkeleton
        title={label}
        rows={Math.min(limit, 6)}
        collapsible={collapsible}
        startCollapsed={startCollapsed}
      />
    );
  }

  if (!displayCondition({ query: query ?? "", filters, facets })) {
    return null;
  }

  if (!displayIfEmptyQuery && !query && Object.keys(filters).length < 1 ) {
    return null;
  }

  // 1) Field validation
  if (!filterableFields?.includes(field) || !facetableFields?.includes(field)) {
    const missing: string[] = [];
    if (!filterableFields?.includes(field)) missing.push('filterable');
    if (!facetableFields?.includes(field))   missing.push('facetable');
    return (
      <FilterPanelBase collapsible={false}>
        <div style={{ color: 'red', fontSize: '12px' }}>
          Cannot render filter for "{field}": missing {missing.join(' and ')}.
        </div>
      </FilterPanelBase>
    );
  }

  // 2) Get raw facet values & selected filters
  // A toggle whose filter is on may get no facet entry back at all (every
  // remaining document is 'true', or none are); keep rendering it so it can be
  // switched off again.
  const facetValues = facets?.[field] ?? (displayType === 'toggle' ? [] : undefined);
  if (!facetValues || !Array.isArray(facetValues)) return null;
  const selectedValues = filters?.[field] ?? [];

  // 3) Optionally preserve blank state
  if (
    preserveBlankFacetState &&
    !preservedFacetValuesRef.current &&
    facetValues.length > 0
  ) {
    preservedFacetValuesRef.current = facetValues.reduce(
      (acc, f: any) => {
        acc[f.key] = f.value;
        return acc;
      },
      {} as Record<string, number | null>
    );
  }

  // 4) Merge counts
  const mergedValuesMap = new Map<string, number | null>();
  if (preserveBlankFacetState && preservedFacetValuesRef.current) {
    Object.keys(preservedFacetValuesRef.current).forEach((key) => {
      mergedValuesMap.set(key, 0);
    });
    facetValues.forEach((f: any) => {
      mergedValuesMap.set(f.key, f.value);
    });
  } else {
    facetValues.forEach((f: any) => {
      mergedValuesMap.set(f.key, f.value);
    });
  }

  // 5) Boolean‐toggle special case + validation.
  // The server only returns facet keys present in the *filtered* result set, so
  // once the toggle is on the response may contain just { true: n } — or nothing
  // at all. A field is treated as boolean when every key it does have is a
  // boolean-ish literal, or when the facet is empty but our own filter is active.
  const BOOLEAN_KEYS = new Set(['true', 'false', 'null']);
  const facetKeys = Array.from(mergedValuesMap.keys());
  const isBooleanFacet =
    displayType === 'toggle' &&
    ((facetKeys.length > 0 && facetKeys.every(k => BOOLEAN_KEYS.has(k))) ||
      (facetKeys.length === 0 && selectedValues.length > 0));

  // For boolean toggles only: fold the "null" bucket into "false" so the
  // off-state count is "everything that is not true". Checkbox/button panels keep
  // the literal 'null' key so the showNull prop can decide whether to list it.
  if (isBooleanFacet && mergedValuesMap.has('null')) {
    const nullCount = mergedValuesMap.get('null') ?? 0;
    const existingFalseCount = mergedValuesMap.get('false') ?? 0;
    mergedValuesMap.set('false', existingFalseCount + nullCount);
    mergedValuesMap.delete('null');
  }

  if (displayType === 'toggle' && !isBooleanFacet) {
    // If toggle is requested but facet doesn't have exactly two boolean values,
    // render a disabled toggle instead of an error
    return (
      <FilterPanelBase collapsible={false}>
        <div className={styles.count}>
          <ToggleSwitch
            label={label}
            checked={false}
            onChange={() => {}}
            disabled={true}
          />
        </div>
      </FilterPanelBase>
    );
  }

  if (isBooleanFacet) {
    // Get raw count (could be number or null)
    const rawTrueCount = mergedValuesMap.get('true');
    const trueCount = typeof rawTrueCount === 'number' ? rawTrueCount : null;
    const isOn = selectedValues.includes('true');
    // Disable only when nothing would match — and never while the toggle is on,
    // so the user can always switch an active filter back off.
    const disabled = trueCount === 0 && !isOn;
    // Display just the number if > 0
    const countLabel = showCount && (trueCount ?? 0) > 0 ? `${trueCount}` : '';

    // For boolean facet, the panel should always be non-collapsible
    return (
      <FilterPanelBase collapsible={false}>
        <div className={styles.count}>
          <ToggleSwitch
            label={label}
            checked={isOn}
            onChange={() => toggleFilter(field, 'true')}
            disabled={disabled}
          />{' '}
          {countLabel}
        </div>
      </FilterPanelBase>
    );
  }

  // 6) Build and filter “null” keys
  let allEntries = Array.from(mergedValuesMap.entries());
  if (!showNull) {
    allEntries = allEntries.filter(([key]) => key !== 'null');
  }

  // 7) If there really are no entries to show—and we’re not forcibly preserving blank state—return null
  if (allEntries.length === 0 && !preserveBlankFacetState) {
    return null;
  }

  // 8) Decide ordering:
  if (preserveBlankFacetStateOrder) {
    // → Skip all reordering: keep whatever order came from the search engine.
    //    (So do nothing here—just use `allEntries` as-is.)
  } else if (sortFacetsBy === 'alphabetical') {
    // → Alphabetical‐within‐groups: positive‐count first (A→Z), then zero/null (A→Z)
    const positives = allEntries
      .filter(([, c]) => typeof c === 'number' && c > 0)
      .sort(([a], [b]) => a.localeCompare(b));
    const nonPositives = allEntries
      .filter(([, c]) => c === 0 || c === null)
      .sort(([a], [b]) => a.localeCompare(b));
    allEntries = [...positives, ...nonPositives];
  } else if (sortFacetsBy === 'numeric') {
    // positive counts first (numeric order), then zero/null (numeric order)
    const numericCompare = (keyA: string, keyB: string) => {
      const nA = Number(keyA);
      const nB = Number(keyB);
      const aIsNum = !isNaN(nA);
      const bIsNum = !isNaN(nB);

      if (aIsNum && bIsNum) {
        return nA - nB; // both numeric → numeric comparison
      }
      // otherwise fallback to alphabetical
      return keyA.localeCompare(keyB);
    };

    const positives = allEntries
      .filter(([, c]) => typeof c === 'number' && c > 0)
      .sort(([a], [b]) => numericCompare(a, b));
    const nonPositives = allEntries
      .filter(([, c]) => c === 0 || c === null)
      .sort(([a], [b]) => numericCompare(a, b));
    allEntries = [...positives, ...nonPositives];
  } else {
    // → “Histogram” order (default): positives first in their original order,
    //    then zero/null in original order.
    const positives = allEntries.filter(([, c]) => typeof c === 'number' && c > 0);
    const nonPositives = allEntries.filter(([, c]) => c === 0 || c === null);
    allEntries = [...positives, ...nonPositives];
  }

  // 9) Limit list length

  const shouldCollapse = typeof limit === 'number' && allEntries.length > limit;
  const visibleEntries = shouldCollapse ? allEntries.slice(0, visibleCount) : allEntries;

  const renderControl = (key: string, count: number | null) => {
    const isSelected = selectedValues.includes(key);
    // Only disable when count === 0. If count is null (unknown), keep enabled.
    const disabled = count === 0;
    // For grid layout, show "(n)" within the control
    // const countDisplay = (count ?? 0) > 0 ? ` (${count})` : '';
    const countDisplay = showCount && (count ?? 0) > 0 ? ` (${count})` : '';
    // For list layout, show count as plain number to the right
    // const countNumber = (count ?? 0) > 0 ? count : '';
    const countNumber = showCount && (count ?? 0) > 0 ? count : '';

    switch (displayType) {
      case 'button':
        if (layout === 'list') {
          return (
            <div className={styles.count}>
              <Button
                variant={isSelected ? 'primary' : 'secondary'}
                onClick={() => toggleFilter(field, key)}
                disabled={disabled}
                size="micro"
                className={styles.chip}
                title={key}
              >
                <span className={styles.chipLabel}>{key}</span>
              </Button>
              <span className={styles.countValue}>{countNumber}</span>
            </div>
          );
        }
        // grid
        return (
          <Button
            variant={isSelected ? 'primary' : 'secondary'}
            onClick={() => toggleFilter(field, key)}
            disabled={disabled}
            size="micro"
            className={styles.chip}
            title={`${key}${countDisplay}`}
          >
            <span className={styles.chipLabel}>{`${key}${countDisplay}`}</span>
          </Button>
        );

      case 'toggle':
        return (
          <ToggleSwitch
            label={key}
            checked={isSelected}
            onChange={() => toggleFilter(field, key)}
            disabled={disabled}
          />
        );

      case 'checkbox':
      default:
        if (layout === 'list') {
          return (
            <div className={styles.count}>
              <Checkbox
                label={key}
                score=""
                checked={isSelected}
                onChange={() => toggleFilter(field, key)}
                disabled={disabled}
              />
              <span>{countNumber}</span>
            </div>
          );
        }
        // grid
        return (
          <Checkbox
            label={key}
            score={countDisplay}
            checked={isSelected}
            onChange={() => toggleFilter(field, key)}
            disabled={disabled}
          />
        );
    }
  };

  // Determine whether to actually collapse based on `collapsible` + `startCollapsed`
  const actualCollapsed = collapsible ? startCollapsed : false;

  return (
    <FilterPanelBase
      title={label}
      collapsible={collapsible}
      collapsed={actualCollapsed}
    >
      <ul
        className={layout === 'grid' ? styles.grid : styles.list}
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
      >
        {visibleEntries.map(([key, count]) => (
          <li key={key}>{renderControl(key, count)}</li>
        ))}
        {shouldCollapse && visibleCount < allEntries.length && (() => {
          const remaining = allEntries.length - visibleCount;
          const toShow = Math.min(50, remaining);
          return (
            <li className={styles.toggleItem}>
              <Button
                variant="ghost"
                size="micro"
                onClick={() => setVisibleCount((prev) => prev + 50)}
              >
                {`Show ${toShow} more of ${allEntries.length} total`}
              </Button>
            </li>
          );
        })()}
      </ul>
    </FilterPanelBase>
  );
};
