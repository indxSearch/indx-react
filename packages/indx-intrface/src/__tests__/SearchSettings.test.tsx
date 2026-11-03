import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchMode, Tolerance } from '@indxsearch/indx-types';
import type { MatchSetup, CandidateSetup } from '@indxsearch/indx-types';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { server } from './mocks/server';
import { SEARCH_RESPONSE } from './mocks/fixtures';

// A search sends only the values the page sets (6.0: the mode and the members of match,
// candidates and ranking). Every value it sends wins over the dataset's query parameters on the
// server, so a value the page never chose must stay out.

const DS_BASE = 'http://localhost/api/teams/team/datasets/test';

interface SentBody { text?: string; mode?: SearchMode; match?: MatchSetup; candidates?: CandidateSetup }

function setup(props: { mode?: SearchMode; match?: MatchSetup; candidates?: CandidateSetup } = {}) {
  return renderHook(() => useSearchContext(), {
    wrapper: ({ children }) => (
      <SearchProvider url="http://localhost" team="team" dataset="test"
                      preAuthenticatedToken="test-token" enableFacets={false} {...props}>
        {children}
      </SearchProvider>
    ),
  });
}

function captureBodies(into: SentBody[]) {
  server.use(http.post(`${DS_BASE}/search`, async ({ request }) => {
    const body = await request.clone().json() as SentBody;
    if (body.text) into.push(body);
    return HttpResponse.json(SEARCH_RESPONSE);
  }));
}

async function searchOnce(props: Parameters<typeof setup>[0]) {
  const sent: SentBody[] = [];
  captureBodies(sent);
  const { result } = setup(props);
  await waitFor(() => expect(result.current.isFetchingInitial).toBe(false));
  act(() => result.current.setQuery('shoe'));
  await waitFor(() => expect(sent.length).toBeGreaterThan(0));
  return { body: sent[0], result, sent };
}

describe('search settings', () => {
  it('sends none when the page sets none, so the dataset decides them all', async () => {
    const { body } = await searchOnce({});
    expect(body.mode).toBeUndefined();
    expect(body.match ?? {}).toEqual({});
    expect(body.candidates ?? {}).toEqual({});
  });

  it('sends exactly what the page set', async () => {
    const { body } = await searchOnce({ mode: SearchMode.Bm25f, candidates: { maxCandidates: 300 } });
    expect(body.mode).toBe(SearchMode.Bm25f);
    expect(body.candidates).toEqual({ maxCandidates: 300 });
    expect(body.match ?? {}).toEqual({});
  });

  it('setting one value later adds it and keeps the rest; clearing hands them back', async () => {
    const { result, sent } = await searchOnce({ match: { joinedWords: false } });

    act(() => result.current.setSearchSettings({ match: { tolerance: Tolerance.Exact } }));
    act(() => result.current.setQuery('shoes'));
    await waitFor(() => expect(sent.some(b => b.text === 'shoes')).toBe(true));
    expect(sent.find(b => b.text === 'shoes')!.match).toEqual({ joinedWords: false, tolerance: Tolerance.Exact });

    act(() => result.current.setSearchSettings({ match: undefined }));
    act(() => result.current.setQuery('boots'));
    await waitFor(() => expect(sent.some(b => b.text === 'boots')).toBe(true));
    expect(sent.find(b => b.text === 'boots')!.match ?? {}).toEqual({});
  });
});
