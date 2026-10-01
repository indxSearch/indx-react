import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { server } from './mocks/server';
import { SEARCH_RESPONSE } from './mocks/fixtures';

// What the page tells the dataset's statistics: a session per page load on every search, and
// the chosen result through selectResult, carrying the queryId of the search it came from.

const DS_BASE = 'http://localhost/api/teams/team/datasets/test';

function setup() {
  return renderHook(() => useSearchContext(), {
    wrapper: ({ children }) => (
      <SearchProvider url="http://localhost" team="team" dataset="test"
                      preAuthenticatedToken="test-token" enableFacets={false}>
        {children}
      </SearchProvider>
    ),
  });
}

describe('session', () => {
  it('sends one session id with every search of the page', async () => {
    const sessions: (string | null)[] = [];
    // The visitor's searches, the ones with text. Start-up also sends a blank search to seed
    // the range bounds; empty and unfiltered, the server never records it.
    server.use(http.post(`${DS_BASE}/search`, async ({ request }) => {
      const body = await request.clone().json() as { text?: string };
      if (body.text) sessions.push(new URL(request.url).searchParams.get('session'));
      return HttpResponse.json(SEARCH_RESPONSE);
    }));

    const { result } = setup();
    await waitFor(() => expect(result.current.isFetchingInitial).toBe(false));
    act(() => result.current.setQuery('shoe'));
    await waitFor(() => expect(result.current.state.results).not.toBeNull());
    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(sessions.length).toBeGreaterThanOrEqual(2));

    expect(sessions[0]).toBeTruthy();
    expect(new Set(sessions).size).toBe(1);
    expect(sessions[0]).toBe(result.current.sessionId);
  });
});

describe('selectResult', () => {
  it('numbers the results by the position the visitor saw', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isFetchingInitial).toBe(false));
    act(() => result.current.setQuery('shoe'));
    await waitFor(() => expect(result.current.state.results?.length).toBeGreaterThan(0));

    expect(result.current.state.results!.map(r => r.position)).toEqual(
      result.current.state.results!.map((_, i) => i + 1));
  });

  it('reports the chosen result with the queryId of its search', async () => {
    let sent: unknown = null;
    server.use(
      http.post(`${DS_BASE}/search`, () =>
        HttpResponse.json(SEARCH_RESPONSE, { headers: { 'Indx-Query-Id': 'q-123' } })),
      http.post(`${DS_BASE}/events/select`, async ({ request }) => {
        sent = await request.json();
        return new HttpResponse(null, { status: 202 });
      }),
    );

    const { result } = setup();
    await waitFor(() => expect(result.current.isFetchingInitial).toBe(false));
    act(() => result.current.setQuery('shoe'));
    await waitFor(() => expect(result.current.state.queryId).toBe('q-123'));

    const second = result.current.state.results![1];
    await act(() => result.current.selectResult!(second));

    expect(sent).toEqual({ queryId: 'q-123', documentKey: second.documentKey, position: 2 });
  });

  it('never throws when the event cannot be recorded', async () => {
    server.use(http.post(`${DS_BASE}/events/select`, () =>
      HttpResponse.json({ code: 'statisticsDisabled' }, { status: 404 })));

    const { result } = setup();
    await waitFor(() => expect(result.current.isFetchingInitial).toBe(false));
    act(() => result.current.setQuery('shoe'));
    await waitFor(() => expect(result.current.state.results?.length).toBeGreaterThan(0));

    await expect(result.current.selectResult!(result.current.state.results![0])).resolves.toBeUndefined();
  });
});
