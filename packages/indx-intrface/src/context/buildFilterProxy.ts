import { IndxApiError } from './IndxApiError';

type AuthenticatedFetch = (url: string, options?: RequestInit) => Promise<Response>;

async function postFilter(
  path: string,
  body: unknown,
  label: string,
  url: string,
  team: string,
  dataset: string,
  authenticatedFetch: AuthenticatedFetch
): Promise<any> {
  const response = await authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/filters/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw await IndxApiError.fromResponse(label, response);
  }
  const proxy = await response.json();
  if (!proxy || typeof proxy.hashString !== 'string') {
    throw new Error(`${label} failed: server returned no filter token`);
  }
  return proxy;
}

/**
 * Folds a list of filter proxies into one with the given operator. `and` = every
 * filter must match (intersection), `or` = any may match (union).
 */
async function combineAll(
  filters: any[],
  operator: 'and' | 'or',
  url: string,
  team: string,
  dataset: string,
  authenticatedFetch: AuthenticatedFetch
): Promise<any> {
  if (filters.length === 0) return null;
  if (filters.length === 1) return filters[0];

  let current = filters[0];
  for (let i = 1; i < filters.length; i++) {
    current = await postFilter(
      'combine',
      { a: current, b: filters[i], useAndOperation: operator === 'and' },
      'CombineFilters',
      url, team, dataset, authenticatedFetch
    );
  }
  return current;
}

export type ValueMatch = 'all' | 'any';

export interface NumericRange { min: number; max: number }

/**
 * Builds the server-side filter token for the current selection.
 *
 * Several selected values on the *same* field are combined per that field's
 * match mode: `'all'` (default) ANDs them — a document must carry every value,
 * which is the natural reading for multi-valued fields such as genres and
 * narrows the result set with each click; `'any'` ORs them, for scalar fields
 * where a document can only ever hold one of the values. Bucket filters (the
 * ranges a BucketFilterPanel selects) are disjoint, so several on one field are
 * always ORed. The per-field results are then ANDed with each other and with
 * every range filter. Any failed filter call throws — the caller must not fall
 * back to an unfiltered search.
 *
 * A selected value on a field whose type is 'Number' (per `fieldTypes`, from
 * fields/configuration) is sent as a range filter with equal limits, not a
 * value filter. A value filter compares text, so on a number it is slow and
 * misses 129.0 when asked for 129; a range with equal limits is numeric
 * equality through the field's index. A value that is not a number on such a
 * field, or a field of unknown type, goes as a value filter and the server
 * answers.
 */
export async function buildFilterProxy(
  filters: Record<string, string[]>,
  rangeFilters: Record<string, NumericRange>,
  url: string,
  team: string,
  dataset: string,
  authenticatedFetch: AuthenticatedFetch,
  valueMatch: Record<string, ValueMatch> = {},
  bucketFilters: Record<string, NumericRange[]> = {},
  fieldTypes: Record<string, string> = {}
): Promise<any> {
  const filterEntries = Object.entries(filters ?? {}).filter(([, values]) => values.length > 0);
  const rangeFilterEntries = Object.entries(rangeFilters ?? {});
  const bucketEntries = Object.entries(bucketFilters ?? {}).filter(([, ranges]) => ranges.length > 0);

  const rangeProxy = (field: string, { min, max }: NumericRange) =>
    postFilter(
      'range',
      { fieldName: field, lowerLimit: min, upperLimit: max },
      `Range filter '${field}'`,
      url, team, dataset, authenticatedFetch
    );

  const valueProxy = (field: string, value: string) => {
    const asNumber = fieldTypes[field] === 'Number' ? Number(value) : NaN;
    return Number.isFinite(asNumber)
      ? rangeProxy(field, { min: asNumber, max: asNumber })
      : postFilter('value', { fieldName: field, value }, `Value filter '${field}'`, url, team, dataset, authenticatedFetch);
  };

  const [perFieldProxies, rangeFilterProxies, bucketProxies] = await Promise.all([
    Promise.all(
      filterEntries.map(async ([field, values]) => {
        const valueProxies = await Promise.all(values.map(value => valueProxy(field, value)));
        const operator = valueMatch[field] === 'any' ? 'or' : 'and';
        return combineAll(valueProxies, operator, url, team, dataset, authenticatedFetch);
      })
    ),
    Promise.all(rangeFilterEntries.map(([field, range]) => rangeProxy(field, range))),
    Promise.all(
      bucketEntries.map(async ([field, ranges]) => {
        const proxies = await Promise.all(ranges.map(range => rangeProxy(field, range)));
        return combineAll(proxies, 'or', url, team, dataset, authenticatedFetch);
      })
    ),
  ]);

  return combineAll([...perFieldProxies, ...rangeFilterProxies, ...bucketProxies], 'and', url, team, dataset, authenticatedFetch);
}
