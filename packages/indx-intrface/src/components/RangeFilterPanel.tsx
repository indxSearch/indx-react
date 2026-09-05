import React from 'react';
import { useSearchContext } from '../context/SearchContext';
import { Slider, InputField, FilterPanelBase } from '@indxsearch/systm';
import styles from './RangeFilterPanel.module.css';
import { FilterPanelSkeleton } from './FilterPanelSkeleton';

export interface RangeFilterPanelProps {
  field: string;
  label?: string;
  displayType?: 'slider' | 'input';
  expectedMin?: number;
  expectedMax?: number;
  collapsible?: boolean; // If filter panel should be able to be collapsed
  startCollapsed?: boolean; // If filter should display as collapsed from init
  showHistogram?: boolean; // Show a histogram above the slider (requires field to be facetable)
  resolution?: number; // Value-range per histogram bucket (e.g. 200 → 5 bars over 0–1000). Auto-derived if omitted (~20 bars)
  step?: number; // Slider step. Derived from the precision of the field's values if omitted (1 for integers, 0.1 for one decimal, …)
}

/** Number of decimals needed to represent `n` exactly (capped at 6). */
function decimalsOf(n: number): number {
  if (!Number.isFinite(n)) return 0;
  const text = String(n);
  const dot = text.indexOf('.');
  return dot === -1 ? 0 : Math.min(6, text.length - dot - 1);
}

/** Snaps `value` onto the `min + k·step` grid react-range expects. */
function snapToStep(value: number, min: number, step: number): number {
  const snapped = min + Math.round((value - min) / step) * step;
  return Number(snapped.toFixed(decimalsOf(step)));
}

export const RangeFilterPanel: React.FC<RangeFilterPanelProps> = ({
  field,
  label,
  expectedMin = 0,
  expectedMax = 1000,
  displayType = 'input',
  collapsible = true,
  startCollapsed = false,
  showHistogram = false,
  resolution,
  step: stepProp
}) => {
  const {
    state: { rangeFilters, rangeBounds, facetStats, facets, filterableFields, facetableFields, query, facetDebounceDelayMillis },
    setRangeFilter,
    resetRangeFilter,
    allowEmptySearch,
    isFetchingInitial
  } = useSearchContext();

  // 1) Query-specific bounds (updates only when query text changes)
  const hasRealBounds = rangeBounds?.[field] !== undefined;
  const queryBounds = rangeBounds?.[field] ?? { min: expectedMin, max: expectedMax };
  const queryMin = queryBounds.min;
  const queryMax = queryBounds.max;

  // 2) Live data bounds (reflects all active filters, used for active region visualization)
  // Clamp to [queryMin, queryMax]: facetStats and rangeBounds can briefly diverge after a
  // query change (e.g. facetStats falls back to the full-dataset initialFacetStats when a
  // field is missing from a search response). Without clamping, the live overlay can
  // visually extend past the slider track until both state slices settle.
  const rawLiveBounds = facetStats?.[field] ?? queryBounds;
  const liveDataMin = Math.max(queryMin, Math.min(queryMax, rawLiveBounds.min));
  const liveDataMax = Math.max(queryMin, Math.min(queryMax, rawLiveBounds.max));

  // Slider step: react-range warns when a value is not on the min + k·step grid,
  // so for fields with fractional values (ratings, prices) derive the step from
  // the precision seen in the bounds and facet keys instead of assuming integers.
  const step = React.useMemo(() => {
    if (stepProp) return stepProp;
    let decimals = Math.max(decimalsOf(queryMin), decimalsOf(queryMax));
    const keys = facets?.[field];
    if (Array.isArray(keys)) {
      for (const f of keys) decimals = Math.max(decimals, decimalsOf(Number(f.key)));
    }
    return decimals === 0 ? 1 : Number((10 ** -decimals).toFixed(decimals));
  }, [stepProp, queryMin, queryMax, facets, field]);

  // 3) If query bounds are equal, disable slider (no range to filter)
  // Only disable if we have real bounds data (not just defaults)
  const isDisabled = hasRealBounds && queryMin === queryMax;

  // 4) Create artificial range for display when disabled (react-range can't handle min === max)
  // Use expectedMin/expectedMax to create a valid range for visual display only
  const displayQueryMin = isDisabled ? expectedMin : queryMin;
  const displayQueryMax = isDisabled ? expectedMax : queryMax;

  // 5) Get intended values from rangeFilters (user's choice, or undefined if unset)
  const intended = rangeFilters?.[field];

  // 5) Display values: use intended if set, otherwise default to query bounds (full range)
  const displayMin = intended ? intended.min : queryMin;
  const displayMax = intended ? intended.max : queryMax;

  // Check if user has set a filter on this field
  const isSelfActive = intended !== undefined;
  // Show as faceted if live data bounds differ from query bounds (other filters affecting this field)
  const isFaceted = liveDataMin !== queryMin || liveDataMax !== queryMax;

  // 6) Local sliderValue (thumb positions). Initialize to display values.
  const [sliderValue, setSliderValue] = React.useState<[number, number]>([
    displayMin,
    displayMax,
  ]);

  // Track if values are invalid with a delay
  const [isMinInvalid, setIsMinInvalid] = React.useState(false);
  const [isMaxInvalid, setIsMaxInvalid] = React.useState(false);

  // What the user has typed in the Min/Max boxes. Kept as raw text so a cleared
  // box or a half-typed number is not clamped on every keystroke; the value is
  // parsed and committed to sliderValue on blur / Enter.
  const [minText, setMinText] = React.useState(String(displayMin));
  const [maxText, setMaxText] = React.useState(String(displayMax));
  React.useEffect(() => {
    setMinText(String(sliderValue[0]));
    setMaxText(String(sliderValue[1]));
  }, [sliderValue]);

  // Memoize clamped values calculation (clamp to query bounds, not live data bounds)
  const { finalMin, finalMax, isValidMin, isValidMax } = React.useMemo(() => {
    const [min, max] = sliderValue;
    const clampedMin = Math.max(queryMin, Math.min(queryMax, min));
    const clampedMax = Math.max(queryMin, Math.min(queryMax, max));
    const finalMin = Math.min(clampedMin, clampedMax);
    const finalMax = Math.max(clampedMin, clampedMax);
    const isValidMin = finalMin >= queryMin && finalMin < finalMax;
    const isValidMax = finalMax <= queryMax && finalMax > finalMin;

    return { finalMin, finalMax, isValidMin, isValidMax };
  }, [sliderValue, queryMin, queryMax]);

  // Combined debounced effect for invalid state and filter updates
  React.useEffect(() => {
    // Don't validate when disabled to prevent red flash during transitions
    if (isDisabled) {
      return;
    }

    // Don't validate when at full range (prevents flash when resetting to defaults)
    const atFullRange = sliderValue[0] === queryMin && sliderValue[1] === queryMax;
    if (atFullRange) {
      setIsMinInvalid(false);
      setIsMaxInvalid(false);
      return;
    }

    // Use facetDebounceDelayMillis from SearchContext, default to 500ms
    const debounceDelay = facetDebounceDelayMillis ?? 500;

    // First timeout for invalid state (300ms)
    const invalidTimer = setTimeout(() => {
      setIsMinInvalid(!isValidMin);
      setIsMaxInvalid(!isValidMax);
    }, 300);

    // Second timeout for filter update (uses configurable delay)
    const filterTimer = setTimeout(() => {
      if (isValidMin && isValidMax) {
        if (finalMin === queryMin && finalMax === queryMax) {
          // Slider at full query bounds, no filtering needed (not a user action)
          resetRangeFilter(field, false);
        } else {
          // Store as intended values (these will be sent to API)
          setRangeFilter(field, finalMin, finalMax);
        }
      }
    }, debounceDelay);

    // Cleanup both timeouts
    return () => {
      clearTimeout(invalidTimer);
      clearTimeout(filterTimer);
    };
  }, [finalMin, finalMax, isValidMin, isValidMax, queryMin, queryMax, field, resetRangeFilter, setRangeFilter, facetDebounceDelayMillis, isDisabled]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7) Sync sliderValue with display values when they change
  //    This happens when: intended values change, query bounds change, or field changes
  React.useEffect(() => {
    setSliderValue([displayMin, displayMax]);
    // Clear invalid state when bounds change to prevent red flash
    setIsMinInvalid(false);
    setIsMaxInvalid(false);
  }, [displayMin, displayMax, field]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 7) Drag handlers (only update local thumb position until let‐go)
  // Clamp min to [queryMin, liveDataMax] and max to [liveDataMin, queryMax]
  const handleSliderChange = React.useCallback((values: number[]) => {
    if (isDisabled) return;
    const clampedMin = Math.max(queryMin, Math.min(liveDataMax, values[0]));
    const clampedMax = Math.max(liveDataMin, Math.min(queryMax, values[1]));
    setSliderValue([clampedMin, clampedMax]);
  }, [isDisabled, queryMin, queryMax, liveDataMin, liveDataMax]);

  const handleSliderCommit = React.useCallback((values: number[]) => {
    if (isDisabled) return;
    const clampedMin = Math.max(queryMin, Math.min(liveDataMax, values[0]));
    const clampedMax = Math.max(liveDataMin, Math.min(queryMax, values[1]));

    // If dragged to full range, immediately clear the filter (IS a user action)
    if (clampedMin === queryMin && clampedMax === queryMax) {
      setSliderValue([queryMin, queryMax]);
      resetRangeFilter(field, true);
    } else {
      setSliderValue([clampedMin, clampedMax]);
    }
  }, [isDisabled, queryMin, queryMax, liveDataMin, liveDataMax, field, resetRangeFilter]);

  // 8) Manual number‐input handlers. Typing only updates the text; the number is
  // committed on blur or Enter. Min can't exceed liveDataMax (can't filter above
  // what exists), max can't be below liveDataMin.
  const commitMin = React.useCallback(() => {
    if (isDisabled) return;
    const trimmed = minText.trim();
    const value = trimmed === '' ? NaN : Number(trimmed);
    if (isNaN(value)) {
      setMinText(String(sliderValue[0])); // revert
      return;
    }
    const clampedValue = Math.max(queryMin, Math.min(liveDataMax, value));
    if (clampedValue < sliderValue[1]) {
      setSliderValue([clampedValue, sliderValue[1]]);
    } else {
      setSliderValue([queryMin, sliderValue[1]]);
    }
    setMinText(String(clampedValue < sliderValue[1] ? clampedValue : queryMin));
  }, [isDisabled, minText, sliderValue, queryMin, liveDataMax]);

  const commitMax = React.useCallback(() => {
    if (isDisabled) return;
    const trimmed = maxText.trim();
    const value = trimmed === '' ? NaN : Number(trimmed);
    if (isNaN(value)) {
      setMaxText(String(sliderValue[1])); // revert
      return;
    }
    const clampedValue = Math.max(liveDataMin, Math.min(queryMax, value));
    if (clampedValue > sliderValue[0]) {
      setSliderValue([sliderValue[0], clampedValue]);
    } else {
      setSliderValue([sliderValue[0], queryMax]);
    }
    setMaxText(String(clampedValue > sliderValue[0] ? clampedValue : queryMax));
  }, [isDisabled, maxText, sliderValue, liveDataMin, queryMax]);

  const commitOnEnter = (commit: () => void) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Histogram: snapshot facet distribution when query changes.
  //
  // The snapshot is keyed on `queryMin:queryMax`. When those bounds change it
  // means a new query arrived, so we update. We also update when facets first
  // become available for the initial blank-search case: rangeBounds is not
  // populated for empty queries, so queryMin/queryMax stay at their prop
  // defaults — the ref lets us detect "facets arrived but no snapshot yet".
  const [histogramSnapshot, setHistogramSnapshot] = React.useState<Array<{ key: string; value: number }> | null>(null);
  const snapshotBoundsRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!showHistogram) return;
    const boundsKey = `${queryMin}:${queryMax}`;
    const isNewBounds = boundsKey !== snapshotBoundsRef.current;
    // Skip if same bounds and we already have a snapshot (i.e. a filter changed, not the query)
    if (!isNewBounds && snapshotBoundsRef.current !== null) return;

    const rawFacets = facets?.[field];
    if (!Array.isArray(rawFacets) || rawFacets.length === 0) return;
    const snapshot = rawFacets
      .filter((f: any) => f.value != null && !isNaN(Number(f.key)))
      .map((f: any) => ({ key: f.key as string, value: f.value as number }));
    if (snapshot.length > 0) {
      snapshotBoundsRef.current = boundsKey;
      setHistogramSnapshot(snapshot);
    }
  }, [queryMin, queryMax, facets, field, showHistogram]); // eslint-disable-line react-hooks/exhaustive-deps

  const histogramBuckets = React.useMemo(() => {
    if (!showHistogram || !histogramSnapshot || histogramSnapshot.length === 0) return [];
    const range = queryMax - queryMin;
    if (range <= 0) return [];
    const effectiveResolution = resolution ?? (Math.ceil(range / 20) || 1);
    const numBars = Math.ceil(range / effectiveResolution);
    return Array.from({ length: numBars }, (_, i) => {
      const bucketStart = queryMin + i * effectiveResolution;
      const bucketEnd = queryMin + (i + 1) * effectiveResolution;
      const count = histogramSnapshot
        .filter(f => { const v = Number(f.key); return v >= bucketStart && v < bucketEnd; })
        .reduce((sum, f) => sum + f.value, 0);
      return { bucketStart, bucketEnd, count };
    });
  }, [showHistogram, histogramSnapshot, queryMin, queryMax, resolution]);

  const histogramMaxCount = React.useMemo(
    () => Math.max(...histogramBuckets.map(b => b.count), 1),
    [histogramBuckets]
  );

  if (showHistogram && !isFetchingInitial && !facetableFields?.includes(field)) {
    console.warn(`RangeFilterPanel: showHistogram=true but field "${field}" is not facetable. Add .Facetable = true to this field.`);
  }

  // Don't show until data is loaded
  // (Must come after all hooks to follow Rules of Hooks)
  if (isFetchingInitial) {
    return (
      <FilterPanelSkeleton
        title={label}
        variant="slider"
        collapsible={collapsible}
        startCollapsed={startCollapsed}
      />
    );
  }

  // Don't show if query is empty and allowEmptySearch is false
  if (!allowEmptySearch && !query) {
    return null;
  }

  // Field validation: /filters/range rejects a non-filterable field with 400, so
  // say so here instead of showing a slider whose filter can never apply.
  if (!filterableFields?.includes(field)) {
    return (
      <FilterPanelBase collapsible={false}>
        <div style={{ color: 'red', fontSize: '12px' }}>
          Cannot render filter for "{field}": missing filterable.
        </div>
      </FilterPanelBase>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9) Render slider (rail at query bounds, active region shows live data bounds)
  if (displayType === 'slider') {
    return (
      <FilterPanelBase title={label} collapsed={startCollapsed} collapsible={collapsible}>
        {isDisabled && (
          <div className={styles.disabledMessage}>
            No adjustable range (all results have the same value: {queryMin}).
          </div>
        )}
        {showHistogram && histogramBuckets.length > 0 && (
          <div className={styles.histogram}>
            {(() => {
              const hasLiveOverlay =
                typeof liveDataMin === 'number' &&
                typeof liveDataMax === 'number' &&
                liveDataMax > liveDataMin &&
                (liveDataMin > queryMin || liveDataMax < queryMax);

              return histogramBuckets.map((bucket, i) => {
                const height = Math.max(1, Math.ceil((bucket.count / histogramMaxCount) * 20));
                const isActive = hasLiveOverlay
                  ? bucket.bucketEnd > liveDataMin && bucket.bucketStart < liveDataMax
                  : bucket.bucketEnd > finalMin && bucket.bucketStart < finalMax;
                return (
                  <div
                    key={i}
                    className={styles.histogramBar}
                    data-testid="histogram-bar"
                    data-active={isActive}
                    style={{
                      height: `${height}px`,
                      background: isActive ? 'var(--lv5)' : 'var(--lv3)',
                    }}
                  />
                );
              });
            })()}
          </div>
        )}
        <div style={{ padding: '10px 10px 20px 10px' }}>
          <Slider
            min={displayQueryMin}
            max={displayQueryMax}
            step={step}
            value={isDisabled
              ? [displayQueryMin, displayQueryMax]
              : [snapToStep(finalMin, displayQueryMin, step), snapToStep(finalMax, displayQueryMin, step)]}
            isRange
            onChange={(vals: number | number[]) => handleSliderChange(vals as [number, number])}
            onFinalChange={(vals: number | number[]) => handleSliderCommit(vals as [number, number])}
            disabled={isDisabled}
            activeMin={liveDataMin}
            activeMax={liveDataMax}
            isFaceted={isFaceted}
            highlightFaceted={isSelfActive}
            aria-label={label || `Filter by ${field}`}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flex: 'flex-grow',
            gap: '10px',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <InputField
            label="Min:"
            type="number"
            value={isDisabled ? String(queryMin) : minText}
            min={queryMin}
            max={Math.min(liveDataMax, sliderValue[1] - 1)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinText(e.target.value)}
            onBlur={commitMin}
            onKeyDown={commitOnEnter(commitMin)}
            disabled={isDisabled}
            isValid={isDisabled || !isMinInvalid}
          />
          <InputField
            label="Max:"
            type="number"
            value={isDisabled ? String(queryMax) : maxText}
            min={Math.max(liveDataMin, sliderValue[0] + 1)}
            max={queryMax}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxText(e.target.value)}
            onBlur={commitMax}
            onKeyDown={commitOnEnter(commitMax)}
            disabled={isDisabled}
            isValid={isDisabled || !isMaxInvalid}
          />
        </div>
      </FilterPanelBase>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 11) Fallback: two number inputs
  return (
    <FilterPanelBase title={label}>
      {isDisabled && (
        <div className={styles.disabledMessage}>
          No adjustable range (all results have the same value: {queryMin}).
        </div>
      )}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <InputField
          label="Min:"
          type="number"
          value={isDisabled ? String(queryMin) : minText}
          min={queryMin}
          max={Math.min(liveDataMax, sliderValue[1] - 1)}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinText(e.target.value)}
          onBlur={commitMin}
          onKeyDown={commitOnEnter(commitMin)}
          disabled={isDisabled}
          isValid={isDisabled || !isMinInvalid}
        />
        <InputField
          label="Max:"
          type="number"
          value={isDisabled ? String(queryMax) : maxText}
          min={Math.max(liveDataMin, sliderValue[0] + 1)}
          max={queryMax}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxText(e.target.value)}
          onBlur={commitMax}
          onKeyDown={commitOnEnter(commitMax)}
          disabled={isDisabled}
          isValid={isDisabled || !isMaxInvalid}
        />
      </div>
    </FilterPanelBase>
  );
};
