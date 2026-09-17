import React, { useMemo } from 'react';
import styles from './BucketFilterPanel.module.css';
import { useSearchContext } from '../context/SearchContext';
import type { NumericRange } from '../context/SearchContext';
import { Checkbox, Button, FilterPanelBase } from '@indxsearch/systm';
import { FilterPanelSkeleton } from './FilterPanelSkeleton';
import { precisionOf, roundTo } from '../utils/numeric';

/** A bucket the caller spells out. Leave `min` or `max` off for an open end. */
export interface BucketSpec {
  label?: string;
  min?: number;
  max?: number;
}

export interface BucketFilterPanelProps {
  field: string;
  label?: string;
  /**
   * Bucket width, or the lower edges of the buckets. A number gives equal-width
   * buckets aligned to multiples of it across the field's range (width 20 on a
   * 5-200 field: 0-19, 20-39, ... 180-199). An array gives the lower edge of
   * each bucket, the last entry closing the final one: [1, 21, 41, 81, 181] is
   * 1-20, 21-40, 41-80, 81-180. Ignored when `buckets` is given.
   */
  width?: number | number[];
  /** Explicit buckets, optionally named and open-ended. Takes precedence over `width`. */
  buckets?: BucketSpec[];
  displayType?: 'checkbox' | 'button';
  layout?: 'list' | 'grid';
  showCount?: boolean;
  /** Drop buckets with a count of 0 instead of showing them disabled. */
  hideEmpty?: boolean;
  collapsible?: boolean;
  startCollapsed?: boolean;
}

interface Bucket {
  label: string;
  /** The range sent to the server. Open ends are closed at the field's bounds. */
  range: NumericRange;
  /** Whether a facet value falls in the bucket, open ends honoured. */
  contains: (value: number) => boolean;
}

/** Buckets are ranges, so counts are sums over the facet values that fall inside each one. */
function countIn(bucket: Bucket, facetValues: { key: string; value: number | null }[] | undefined): number | null {
  if (!facetValues) return null;
  let sum = 0;
  let seen = false;
  for (const f of facetValues) {
    const v = Number(f.key);
    if (Number.isNaN(v) || !bucket.contains(v)) continue;
    if (typeof f.value !== 'number') return null; // unknown count on any member makes the sum unknown
    sum += f.value;
    seen = true;
  }
  return seen ? sum : 0;
}

export const BucketFilterPanel: React.FC<BucketFilterPanelProps> = ({
  field,
  label,
  width,
  buckets: bucketSpecs,
  displayType = 'checkbox',
  layout = 'list',
  showCount = true,
  hideEmpty = false,
  collapsible = true,
  startCollapsed = false,
}) => {
  const {
    state: { facets, filterableFields, facetableFields, bucketFilters, rangeBounds, facetStats, query },
    toggleBucketFilter,
    isFetchingInitial,
    allowEmptySearch,
  } = useSearchContext();

  const facetValues: { key: string; value: number | null }[] | undefined = facets?.[field];
  const selected = bucketFilters[field] ?? [];

  // The field's full extent: the per-query bounds when known, else the live stats.
  // Open-ended buckets close at these so the server always gets finite limits.
  const bounds = rangeBounds?.[field] ?? facetStats?.[field];

  // Buckets are laid on the field's own grid: integers step by 1, one-decimal
  // fields by 0.1, so the top of one bucket and the bottom of the next don't
  // overlap (range filters are inclusive at both ends).
  const step = useMemo(() => {
    const values: number[] = [];
    if (bounds) values.push(bounds.min, bounds.max);
    if (Array.isArray(facetValues)) for (const f of facetValues) values.push(Number(f.key));
    return precisionOf(values.filter(Number.isFinite));
  }, [bounds, facetValues]);

  const buckets = useMemo<Bucket[]>(() => {
    const lo = bounds?.min ?? -Number.MAX_VALUE;
    const hi = bounds?.max ?? Number.MAX_VALUE;
    const make = (min: number | undefined, max: number | undefined, name?: string): Bucket => ({
      label: name ?? (min === undefined ? `up to ${max}` : max === undefined ? `${min} and up` : `${min}-${max}`),
      range: { min: min ?? lo, max: max ?? hi },
      contains: v => (min === undefined || v >= min) && (max === undefined || v <= max),
    });

    if (bucketSpecs && bucketSpecs.length > 0) {
      return bucketSpecs.map(b => make(b.min, b.max, b.label));
    }
    if (Array.isArray(width)) {
      const edges = [...width].sort((a, b) => a - b);
      const out: Bucket[] = [];
      for (let i = 0; i < edges.length - 1; i++) {
        out.push(make(edges[i], roundTo(edges[i + 1] - step, step)));
      }
      return out;
    }
    if (typeof width === 'number' && width > 0 && bounds) {
      const out: Bucket[] = [];
      const first = Math.floor(bounds.min / width) * width;
      for (let start = first; start <= bounds.max; start = roundTo(start + width, step)) {
        out.push(make(roundTo(start, step), roundTo(start + width - step, step)));
      }
      return out;
    }
    return [];
  }, [bucketSpecs, width, bounds, step]);

  // Every bucket on this field is its own range; two can never both hold a
  // value, so the panel's own counts must come from a search that leaves its
  // selection out. useSearchExecution does that for any field with selected
  // buckets, so there is nothing to register here.

  if (isFetchingInitial || !facets) {
    return (
      <FilterPanelSkeleton
        title={label}
        rows={Math.max(1, Math.min(buckets.length || 5, 8))}
        collapsible={collapsible}
        startCollapsed={startCollapsed}
      />
    );
  }

  if (!allowEmptySearch && !query) return null;

  if (!filterableFields?.includes(field)) {
    return (
      <FilterPanelBase collapsible={false}>
        <div className={styles.error}>
          Cannot render buckets for "{field}": field is not filterable.
        </div>
      </FilterPanelBase>
    );
  }
  const countable = facetableFields?.includes(field) && Array.isArray(facetValues);

  const isSelected = (b: Bucket) => selected.some(r => r.min === b.range.min && r.max === b.range.max);

  let rows = buckets.map(b => ({ bucket: b, count: countable ? countIn(b, facetValues) : null }));
  if (hideEmpty) rows = rows.filter(r => r.count !== 0 || isSelected(r.bucket));
  if (rows.length === 0) return null;

  const renderControl = (bucket: Bucket, count: number | null) => {
    const checked = isSelected(bucket);
    const disabled = count === 0 && !checked;
    const countText = showCount && (count ?? 0) > 0 ? `${count}` : '';
    const onToggle = () => toggleBucketFilter(field, bucket.range);

    if (displayType === 'button') {
      const button = (
        <Button variant={checked ? 'primary' : 'secondary'} onClick={onToggle} disabled={disabled} size="micro" className={styles.chip}>
          {layout === 'grid' && countText ? `${bucket.label} (${countText})` : bucket.label}
        </Button>
      );
      return layout === 'list'
        ? <div className={styles.count}>{button}<span className={styles.countValue}>{countText}</span></div>
        : button;
    }
    return layout === 'list'
      ? (
        <div className={styles.count}>
          <Checkbox label={bucket.label} score="" checked={checked} onChange={onToggle} disabled={disabled} />
          <span className={styles.countValue}>{countText}</span>
        </div>
      )
      : <Checkbox label={bucket.label} score={countText ? ` (${countText})` : ''} checked={checked} onChange={onToggle} disabled={disabled} />;
  };

  return (
    <FilterPanelBase title={label} collapsible={collapsible} collapsed={collapsible ? startCollapsed : false}>
      <ul className={layout === 'grid' ? styles.grid : styles.list} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {rows.map(({ bucket, count }) => (
          <li key={`${bucket.range.min}-${bucket.range.max}`}>{renderControl(bucket, count)}</li>
        ))}
      </ul>
    </FilterPanelBase>
  );
};
