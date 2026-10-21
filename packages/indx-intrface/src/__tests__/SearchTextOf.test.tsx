import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { server } from './mocks/server';

const DS = 'http://localhost/api/teams/team/datasets/test';

let setQueryRef: (q: string) => void = () => {};
function Tap() {
  const { state, setQuery, searchText } = useSearchContext();
  setQueryRef = setQuery;
  return <><span data-testid="typed">{state.query}</span><span data-testid="searched">{searchText}</span></>;
}

const typedParams: (string | null)[] = [];
function serve() {
  const texts: string[] = [];
  typedParams.length = 0;
  server.use(http.post(`${DS}/search`, async ({ request }) => {
    typedParams.push(new URL(request.url).searchParams.get('typed'));
    texts.push(((await request.json()) as { text: string }).text);
    return HttpResponse.json({ records: [], facets: {}, truncationIndex: -1 });
  }));
  return texts;
}

const strip = (typed: string) => typed.replace(/^help me find the movie about (the )?/i, '');

describe('searchTextOf', () => {
  it('searches what it makes of the typed text, and the field keeps what was typed', async () => {
    const texts = serve();
    render(
      <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token"
                      enableFacets={false} searchTextOf={strip}>
        <Tap />
      </SearchProvider>
    );
    await waitFor(() => expect(setQueryRef).toBeTypeOf('function'));
    act(() => setQueryRef('Help me find the movie about the green ogre'));
    await waitFor(() => expect(texts).toContain('green ogre'));
    expect(texts).not.toContain('Help me find the movie about the green ogre');
    expect(screen.getByTestId('typed').textContent).toBe('Help me find the movie about the green ogre');
    expect(screen.getByTestId('searched').textContent).toBe('green ogre');
    // The typed text goes along, so the statistics fold the keystrokes by the typing.
    expect(typedParams).toContain('Help me find the movie about the green ogre');
  });

  it('searches the typed text without it', async () => {
    const texts = serve();
    render(
      <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token" enableFacets={false}>
        <Tap />
      </SearchProvider>
    );
    await waitFor(() => expect(setQueryRef).toBeTypeOf('function'));
    act(() => setQueryRef('Help me find the movie about the green ogre'));
    await waitFor(() => expect(texts).toContain('Help me find the movie about the green ogre'));
    expect(screen.getByTestId('searched').textContent).toBe('Help me find the movie about the green ogre');
    expect(typedParams.every(t => t === null), 'nothing rewritten, nothing extra sent').toBe(true);
  });
});
