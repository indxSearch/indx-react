import React, { useMemo, memo } from "react";
import styles from './ActiveFiltersPanel.module.css';
import { useSearchContext } from '../context/SearchContext';
import { FilterPanelBase } from '@indxsearch/systm';
import { Button } from '@indxsearch/systm';
import { X_or_error } from '@indxsearch/pixl';

const ValueFilterButton = memo(({ field, value, onReset }: { field: string, value: string, onReset: () => void }) => (
  <li>
    <Button
      onClick={onReset}
      iconRight={<X_or_error/>}
      variant='primary'
      size='micro'
      className={styles.chip}
      title={`${field}: ${value}`}
    >
      <span className={styles.chipLabel}>{field}: {value}</span>
    </Button>
  </li>
));

const RangeFilterButton = memo(({ field, min, max, onReset }: { field: string, min: number, max: number, onReset: () => void }) => (
  <li>
    <Button
      onClick={onReset}
      iconRight={<X_or_error />}
      variant='primary'
      size='micro'
      className={styles.chip}
      title={`${field}: ${min} – ${max}`}
    >
      <span className={styles.chipLabel}>{field}: {min} – {max}</span>
    </Button>
  </li>
));

const BucketFilterButton = memo(({ field, label, onReset }: { field: string, label: string, onReset: () => void }) => (
  <li>
    <Button
      onClick={onReset}
      iconRight={<X_or_error />}
      variant='primary'
      size='micro'
      className={styles.chip}
      title={`${field}: ${label}`}
    >
      <span className={styles.chipLabel}>{field}: {label}</span>
    </Button>
  </li>
));

export function ActiveFiltersPanel() {
  const {
    state: { filters, rangeFilters, bucketFilters },
    resetFilters,
    resetSingleFilter,
    resetRangeFilter,
    resetBucketFilter,
  } = useSearchContext();

  const filterEntries = useMemo(() => 
    Object.entries(filters).map(([field, values]) =>
      values.map((value: string) => ({ field, value }))
    ).flat(),
    [filters]
  );

  const rangeFilterEntries = useMemo(() => 
    Object.entries(rangeFilters).map(([field, { min, max }]) => ({ field, min, max })),
    [rangeFilters]
  );

  const bucketEntries = useMemo(() =>
    Object.entries(bucketFilters).flatMap(([field, ranges]) =>
      ranges.map(range => ({ field, range, label: `${range.min}-${range.max}` }))
    ),
    [bucketFilters]
  );

  const hasFilters = useMemo(() => 
    Object.keys(filters).length > 0 || Object.keys(rangeFilters).length > 0 || bucketEntries.length > 0,
    [filters, rangeFilters, bucketEntries]
  );

  if (!hasFilters) return null;

  return (
    <FilterPanelBase collapsible={false} title="Active filters">
      <ul className={styles.grid}>
        {filterEntries.map(({ field, value }) => (
          <ValueFilterButton
            key={`${field}-${value}`}
            field={field}
            value={value}
            onReset={() => resetSingleFilter(field, value)}
          />
        ))}
        {rangeFilterEntries.map(({ field, min, max }) => (
          <RangeFilterButton
            key={field}
            field={field}
            min={min}
            max={max}
            onReset={() => resetRangeFilter(field)}
          />
        ))}
        {bucketEntries.map(({ field, range, label }) => (
          <BucketFilterButton
            key={`${field}-${range.min}-${range.max}`}
            field={field}
            label={label}
            onReset={() => resetBucketFilter(field, range)}
          />
        ))}
        <li>
          <Button 
            onClick={resetFilters}
            size='micro'
            variant='ghost'
          >
            Reset
          </Button>
        </li>
      </ul>
    </FilterPanelBase>
  );
};