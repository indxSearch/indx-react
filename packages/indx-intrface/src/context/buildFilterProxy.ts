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
    let detail = '';
    try {
      const problem = await response.json();
      detail = problem?.detail ?? problem?.title ?? '';
    } catch {
      // body not JSON — status alone is the message
    }
    throw new Error(`${label} failed: HTTP ${response.status}${detail ? ` — ${detail}` : ''}`);
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

/**
 * Builds the server-side filter token for the current selection.
 *
 * Semantics: several selected values on the *same* field are ORed (a document
 * matches if it has any of them), and the per-field results are then ANDed with
 * each other and with every range filter. Any failed filter call throws — the
 * caller must not fall back to an unfiltered search.
 */
export async function buildFilterProxy(
  filters: Record<string, string[]>,
  rangeFilters: Record<string, { min: number; max: number }>,
  url: string,
  team: string,
  dataset: string,
  authenticatedFetch: AuthenticatedFetch
): Promise<any> {
  const filterEntries = Object.entries(filters ?? {}).filter(([, values]) => values.length > 0);
  const rangeFilterEntries = Object.entries(rangeFilters ?? {});

  const [perFieldProxies, rangeFilterProxies] = await Promise.all([
    Promise.all(
      filterEntries.map(async ([field, values]) => {
        const valueProxies = await Promise.all(
          values.map(value =>
            postFilter('value', { fieldName: field, value }, `Value filter '${field}'`, url, team, dataset, authenticatedFetch)
          )
        );
        return combineAll(valueProxies, 'or', url, team, dataset, authenticatedFetch);
      })
    ),
    Promise.all(
      rangeFilterEntries.map(([field, { min, max }]) =>
        postFilter(
          'range',
          { fieldName: field, lowerLimit: min, upperLimit: max },
          `Range filter '${field}'`,
          url, team, dataset, authenticatedFetch
        )
      )
    ),
  ]);

  return combineAll([...perFieldProxies, ...rangeFilterProxies], 'and', url, team, dataset, authenticatedFetch);
}
