import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse, delay } from 'msw';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { server } from './mocks/server';
import { DOCUMENTS, SEARCH_RESPONSE } from './mocks/fixtures';

// Renders useSearchContext inside a SearchProvider.
// Uses preAuthenticatedToken to skip the Login call in most tests.
// enableFacets=false removes the debounced second search, keeping assertions simple.
function setup(props: Partial<React.ComponentProps<typeof SearchProvider>> = {}) {
  return renderHook(() => useSearchContext(), {
    wrapper: ({ children }) => (
      <SearchProvider
        url="http://localhost"
        team="team"
        dataset="test"
        preAuthenticatedToken="test-token"
        enableFacets={false}
        {...props}
      >
        {children}
      </SearchProvider>
    ),
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function waitForAuth(result: ReturnType<typeof setup>['result']) {
  await waitFor(() => expect(result.current.isFetchingInitial).toBe(false));
}

// ─── Initialisation ─────────────────────────────────────────────────────────

describe('missing dataset', () => {
  it('fails on the status 404 and never calls CreateOrOpen', async () => {
    // CreateOrOpen creates a dataset that does not exist, so calling it before
    // the status probe would silently create an empty dataset from a typo'd
    // name. This pins the status-first order introduced in 3.0.0.
    let createOrOpenCalls = 0;
    const MISSING = 'http://localhost/api/teams/team/datasets/typo';
    server.use(
      http.get(`${MISSING}/status`, () => new HttpResponse(null, { status: 404 })),
      http.put(MISSING, () => {
        createOrOpenCalls++;
        return HttpResponse.json({});
      }),
    );

    const { result } = setup({ dataset: 'typo' });
    await waitFor(() => expect(result.current.isFetchingInitial).toBe(false));
    expect(createOrOpenCalls).toBe(0);
    expect(result.current.authError).toMatch(/not found/i);
  });
});

describe('initialisation', () => {
  it('completes auth and populates field lists', async () => {
    const { result } = setup();
    await waitForAuth(result);

    expect(result.current.state.filterableFields).toEqual(['price', 'category']);
    expect(result.current.state.facetableFields).toEqual(['price', 'category']);
    expect(result.current.state.sortableFields).toEqual(['price', 'title']);
  });

  it('seeds rangeBounds from the blank search facets', async () => {
    const { result } = setup({ enableFacets: true });
    await waitForAuth(result);

    // Blank search returns FACETS: price keys 10..200
    expect(result.current.state.rangeBounds).toEqual({
      price: { min: 10, max: 200 },
    });
  });
});

// ─── Empty search behaviour ──────────────────────────────────────────────────

describe('empty search', () => {
  it('suppresses results initially when allowEmptySearch is false', async () => {
    const { result } = setup({ allowEmptySearch: false });
    await waitForAuth(result);

    expect(result.current.state.resultsSuppressed).toBe(true);
    expect(result.current.state.results).toBeNull();
  });

  it('fires initial search when allowEmptySearch is true', async () => {
    const { result } = setup({ allowEmptySearch: true, enableFacets: false });
    await waitFor(() => expect(result.current.state.results).not.toBeNull());
    expect(result.current.state.results).toHaveLength(2);
  });
});

// ─── Search execution ────────────────────────────────────────────────────────

describe('search', () => {
  it('populates results after setQuery', async () => {
    const { result } = setup();
    await waitForAuth(result);

    act(() => result.current.setQuery('shoes'));

    await waitFor(() => expect(result.current.state.results).toHaveLength(2));
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.results![0].documentKey).toBe(1);
    expect(result.current.state.results![0].document).toEqual(DOCUMENTS[0]);
  });

  it('shows isLoading while a search is in flight', async () => {
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', async () => {
        await delay(50);
        return HttpResponse.json(SEARCH_RESPONSE);
      })
    );

    const { result } = setup();
    await waitForAuth(result);

    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.isLoading).toBe(true));
    await waitFor(() => expect(result.current.state.isLoading).toBe(false));
  });

  it('clears active filters when query changes', async () => {
    const { result } = setup();
    await waitForAuth(result);

    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());

    act(() => result.current.toggleFilter('category', 'running'));
    expect(result.current.state.filters).toEqual({ category: ['running'] });

    act(() => result.current.setQuery('boots'));
    expect(result.current.state.filters).toEqual({});
  });

  it('fires a new search when a filter is toggled', async () => {
    let searchCount = 0;
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', () => {
        searchCount++;
        return HttpResponse.json(SEARCH_RESPONSE);
      })
    );

    // Need facets enabled so filter effect triggers a search
    const { result } = setup({ enableFacets: true, facetDebounceDelayMillis: 0 });
    await waitForAuth(result);

    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());

    const countBefore = searchCount;
    act(() => result.current.toggleFilter('category', 'running'));
    await waitFor(() => expect(searchCount).toBeGreaterThan(countBefore));
  });
});

// ─── Filters ─────────────────────────────────────────────────────────────────

describe('filters', () => {
  it('resetFilters clears all value and range filters', async () => {
    const { result } = setup();
    await waitForAuth(result);

    act(() => {
      result.current.toggleFilter('category', 'running');
      result.current.setRangeFilter('price', 20, 80);
    });
    expect(Object.keys(result.current.state.filters)).toHaveLength(1);
    expect(Object.keys(result.current.state.rangeFilters)).toHaveLength(1);

    act(() => result.current.resetFilters());
    expect(result.current.state.filters).toEqual({});
    expect(result.current.state.rangeFilters).toEqual({});
  });

  it('resetRangeFilter removes only the targeted range filter', async () => {
    const { result } = setup();
    await waitForAuth(result);

    act(() => {
      result.current.setRangeFilter('price', 20, 80);
      result.current.setRangeFilter('rating', 3, 5);
    });

    act(() => result.current.resetRangeFilter('price'));
    expect(result.current.state.rangeFilters).toEqual({ rating: { min: 3, max: 5 } });
  });

  it('resetSingleFilter removes a single value from a multi-value filter', async () => {
    const { result } = setup();
    await waitForAuth(result);

    act(() => {
      result.current.toggleFilter('category', 'running');
      result.current.toggleFilter('category', 'trail');
    });
    expect(result.current.state.filters.category).toHaveLength(2);

    act(() => result.current.resetSingleFilter('category', 'running'));
    expect(result.current.state.filters.category).toEqual(['trail']);
  });
});

// ─── Race conditions ──────────────────────────────────────────────────────────

describe('race condition protection', () => {
  it('ignores stale response from a superseded search', async () => {
    let unblockSlow!: () => void;
    const slowBlocked = new Promise<void>(r => { unblockSlow = r; });

    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', async ({ request }) => {
        const body = await request.json() as { text: string };
        if (body.text === 'slow') {
          await slowBlocked;
          // Would produce documentKey: 99 — should never reach state
          return HttpResponse.json({
            records: [{ documentKey: 99, score: 100 }],
            facets: {},
          });
        }
        return HttpResponse.json(SEARCH_RESPONSE);
      })
    );

    const { result } = setup();
    await waitForAuth(result);

    // Fire the slow query first, then immediately supersede it
    act(() => result.current.setQuery('slow'));
    act(() => result.current.setQuery('fast'));

    // fast response arrives — results should come from it
    await waitFor(() => expect(result.current.state.results).toHaveLength(2));
    expect(result.current.state.results![0].documentKey).toBe(1);

    // Now let the slow response through — state must not change
    await act(async () => {
      unblockSlow();
      await new Promise(r => setTimeout(r, 50));
    });

    expect(result.current.state.results).toHaveLength(2);
    expect(result.current.state.results![0].documentKey).toBe(1);
  });
});

// ─── fetchMoreResults ─────────────────────────────────────────────────────────

describe('fetchMoreResults', () => {
  it('triggers a new search with an increased maxNumberOfRecordsToReturn', async () => {
    const searchBodies: { maxNumberOfRecordsToReturn: number }[] = [];
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', async ({ request }) => {
        const body = await request.json() as { maxNumberOfRecordsToReturn: number };
        searchBodies.push(body);
        return HttpResponse.json(SEARCH_RESPONSE);
      })
    );

    const { result } = setup({ maxResults: 5 });
    await waitForAuth(result);

    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());

    const countBefore = searchBodies.length;
    act(() => result.current.fetchMoreResults(20));

    await waitFor(() => expect(searchBodies.length).toBeGreaterThan(countBefore));
    expect(searchBodies.at(-1)!.maxNumberOfRecordsToReturn).toBe(20);
  });
});

// ─── Errors ──────────────────────────────────────────────────────────────────

describe('errors', () => {
  it('stores a failed search as state.error and clears it on the next success', async () => {
    let fail = true;
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', () =>
        fail ? HttpResponse.json({ title: 'boom' }, { status: 500 }) : HttpResponse.json(SEARCH_RESPONSE))
    );

    const { result } = setup();
    await waitForAuth(result);

    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.error).toMatch(/HTTP 500/));
    expect(result.current.state.results).toBeNull();

    fail = false;
    act(() => result.current.setQuery('shoes again'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());
    expect(result.current.state.error).toBeUndefined();
  });

  it('surfaces a failed filter call as an error rather than searching unfiltered', async () => {
    const searchBodies: any[] = [];
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/filters/value', () =>
        HttpResponse.json({ title: 'Invalid argument' }, { status: 400 })),
      http.post('http://localhost/api/teams/team/datasets/test/search', async ({ request }) => {
        searchBodies.push(await request.json());
        return HttpResponse.json(SEARCH_RESPONSE);
      })
    );

    const { result } = setup();
    await waitForAuth(result);
    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());

    const before = searchBodies.length;
    act(() => result.current.toggleFilter('category', 'running'));
    await waitFor(() => expect(result.current.state.error).toMatch(/Value filter 'category' failed: HTTP 400/));
    expect(searchBodies.length).toBe(before); // no unfiltered search went out
  });
});

// ─── Settings ────────────────────────────────────────────────────────────────

describe('search settings', () => {
  it('fires a new search when a search-affecting setting changes', async () => {
    const searchBodies: any[] = [];
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', async ({ request }) => {
        searchBodies.push(await request.json());
        return HttpResponse.json(SEARCH_RESPONSE);
      })
    );

    const { result } = setup();
    await waitForAuth(result);
    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());

    const before = searchBodies.length;
    act(() => result.current.setSearchSettings({ enableCoverage: false }));
    await waitFor(() => expect(searchBodies.length).toBe(before + 1));
    expect(searchBodies.at(-1).enableCoverage).toBe(false);
  });

  it('does not fire on display-only settings', async () => {
    let searchCount = 0;
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', () => {
        searchCount++;
        return HttpResponse.json(SEARCH_RESPONSE);
      })
    );

    const { result } = setup();
    await waitForAuth(result);
    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());

    const before = searchCount;
    act(() => result.current.setSearchSettings({ showScore: false, placeholderText: 'x' }));
    await new Promise(r => setTimeout(r, 50));
    expect(searchCount).toBe(before);
  });

  it('keeps a user-chosen page size across query changes', async () => {
    const searchBodies: any[] = [];
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', async ({ request }) => {
        searchBodies.push(await request.json());
        return HttpResponse.json(SEARCH_RESPONSE);
      })
    );

    const { result } = setup({ maxResults: 10 });
    await waitForAuth(result);
    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());

    act(() => result.current.setSearchSettings({ maxNumberOfRecordsToReturn: 50 }));
    await waitFor(() => expect(searchBodies.at(-1).maxNumberOfRecordsToReturn).toBe(50));

    // "Load more" grows the page, a new query resets to the chosen 50 — not the prop's 10.
    act(() => result.current.fetchMoreResults(80));
    await waitFor(() => expect(searchBodies.at(-1).maxNumberOfRecordsToReturn).toBe(80));

    const before = searchBodies.length;
    act(() => result.current.setQuery('boots'));
    await waitFor(() => expect(searchBodies.length).toBe(before + 1));
    expect(searchBodies.at(-1).maxNumberOfRecordsToReturn).toBe(50);
    expect(result.current.state.searchSettings.maxNumberOfRecordsToReturn).toBe(50);
  });

  it('refreshes results on filter and sort changes even with facets disabled', async () => {
    const searchBodies: any[] = [];
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', async ({ request }) => {
        searchBodies.push(await request.json());
        return HttpResponse.json(SEARCH_RESPONSE);
      })
    );

    const { result } = setup({ enableFacets: false });
    await waitForAuth(result);
    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());

    let before = searchBodies.length;
    act(() => result.current.toggleFilter('category', 'running'));
    await waitFor(() => expect(searchBodies.length).toBe(before + 1));
    expect(searchBodies.at(-1).filter?.hashString).toBe('category=running');
    expect(searchBodies.at(-1).enableFacets).toBe(false);

    before = searchBodies.length;
    act(() => result.current.setSort('price', true));
    await waitFor(() => expect(searchBodies.length).toBe(before + 1));
    expect(searchBodies.at(-1).sortBy).toBe('price');
  });
});
