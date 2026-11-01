import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { useVectorSearch } from '../hooks/useVectorSearch';
import { useHybridSearch } from '../hooks/useHybridSearch';
import { server } from './mocks/server';

const DS = 'http://localhost/api/teams/team/datasets/test';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token" enableFacets={false}>
    {children}
  </SearchProvider>
);

// Review of 1 Nov 2026: both hooks wrote whatever finished last, so an older search held up in
// its embedding overwrote the newer one's results.
describe.each([
  ['vector', useVectorSearch, '/search/vector'],
  ['hybrid', useHybridSearch, '/search/hybrid'],
] as const)('%s search', (_, useHook, path) => {
  it('lets an older search finishing last leave the newer results alone', async () => {
    server.use(
      // The document found is the vector's first number, so each search's answer is its own.
      http.post(`${DS}${path}`, async ({ request }) => {
        const body = await request.json() as { vector: number[] };
        return HttpResponse.json([{ documentKey: body.vector[0], score: 1 }]);
      }),
      http.post(`${DS}/documents/lookup`, async ({ request }) => {
        const keys = await request.json() as number[];
        return HttpResponse.json(keys.map(k => ({ id: k })));
      }),
    );
    let releaseFirst!: (vector: number[]) => void;
    const embed = (text: string) => text === 'first'
      ? new Promise<number[]>(r => { releaseFirst = r; })
      : Promise.resolve([2]);

    const { result: hooked } = renderHook(() => ({ ctx: useSearchContext(), hook: useHook(embed, { fieldName: 'vec' }) }), { wrapper });
    await waitFor(() => expect(hooked.current.ctx.isFetchingInitial).toBe(false));
    const result = { get current() { return hooked.current.hook; } };

    let first!: Promise<void>;
    act(() => { first = result.current.search('first'); });
    await act(async () => { await result.current.search('second'); });
    expect(result.current.error).toBeUndefined();
    expect(result.current.results?.[0].documentKey).toBe(2);

    await act(async () => {
      releaseFirst([1]);
      await first;
    });
    expect(result.current.results?.[0].documentKey).toBe(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });
});
