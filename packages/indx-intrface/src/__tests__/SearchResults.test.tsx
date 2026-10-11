import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { SearchResults, parseArrayString } from '../components/SearchResults';
import { server } from './mocks/server';
import { SEARCH_RESPONSE } from './mocks/fixtures';

vi.mock('@indxsearch/systm', () => ({
  Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));
vi.mock('@indxsearch/pixl', () => {
  const icon = () => <span />;
  return {
    Indx: () => <div data-testid="idle-logo" />,
    Cloud: icon, Key: icon, Lock: icon, Search: icon, Hour_glass: icon, Speedometer: icon, Warning: icon,
  };
});
vi.mock('../components/SearchResult', () => ({
  SearchResult: ({ children }: any) => <div>{children}</div>,
}));

const DS = 'http://localhost/api/teams/team/datasets/test';

let setQueryRef: (q: string) => void = () => {};
function QueryTap() {
  setQueryRef = useSearchContext().setQuery;
  return null;
}

function renderResults(props: Partial<React.ComponentProps<typeof SearchResults>> = {}, dataset = 'test') {
  return render(
    <SearchProvider url="http://localhost" team="team" dataset={dataset} preAuthenticatedToken="test-token" enableFacets={false}>
      <QueryTap />
      <SearchResults {...props}>
        {item => <span data-testid="title" data-type={Array.isArray(item.title) ? 'array' : typeof item.title}>{String(item.title)}</span>}
      </SearchResults>
    </SearchProvider>
  );
}

describe('parseArrayString', () => {
  it('parses JSON and Python list literals only', () => {
    expect(parseArrayString('["a","b"]')).toEqual(['a', 'b']);
    expect(parseArrayString("['Overgrow', 'Chlorophyll']")).toEqual(['Overgrow', 'Chlorophyll']);
    expect(parseArrayString('[]')).toEqual([]);
    expect(parseArrayString('[Draft] Report, v2 [final]')).toBeUndefined();
    expect(parseArrayString('[1, 2]')).toEqual(['1', '2']);
  });
});

describe('array-like strings', () => {
  it('are left untouched by default', async () => {
    server.use(http.post(`${DS}/documents/lookup`, () =>
      HttpResponse.json([{ id: 1, title: '[Draft] Report, v2 [final]' }, { id: 2, title: 'Plain' }])));
    renderResults();
    await screen.findByTestId('idle-logo');
    act(() => setQueryRef('report'));
    const titles = await screen.findAllByTestId('title');
    expect(titles[0].dataset.type).toBe('string');
    expect(titles[0].textContent).toBe('[Draft] Report, v2 [final]');
  });

  it('become arrays with parseArrayStrings', async () => {
    server.use(http.post(`${DS}/documents/lookup`, () =>
      HttpResponse.json([{ id: 1, title: "['a', 'b']" }, { id: 2, title: 'Plain' }])));
    renderResults({ parseArrayStrings: true });
    await screen.findByTestId('idle-logo');
    act(() => setQueryRef('ab'));
    const titles = await screen.findAllByTestId('title');
    expect(titles[0].dataset.type).toBe('array');
    expect(titles[1].dataset.type).toBe('string');
  });
});

describe('errors', () => {
  it('shows the initialisation error instead of the idle placeholder', async () => {
    const MISSING = 'http://localhost/api/teams/team/datasets/typo';
    server.use(http.get(`${MISSING}/status`, () => new HttpResponse(null, { status: 404 })));
    renderResults({}, 'typo');
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/Nothing to search here/);
    expect(alert.textContent).toMatch(/404/);
    expect(screen.queryByText('Try again')).toBeNull();
    expect(screen.queryByTestId('idle-logo')).toBeNull();
  });

  it('shows a failed search', async () => {
    server.use(http.post(`${DS}/search`, () => HttpResponse.json({}, { status: 401 })));
    renderResults();
    await screen.findByTestId('idle-logo');
    act(() => setQueryRef('shoes'));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/Search is unavailable/);
    expect(alert.textContent).toMatch(/401/);
    // A visitor cannot fix a key, so there is nothing to retry.
    expect(screen.queryByText('Try again')).toBeNull();
  });

  it('offers Try again when the server cannot be reached, and recovers', async () => {
    renderResults();
    await screen.findByTestId('idle-logo');
    server.use(http.post(`${DS}/search`, () => HttpResponse.error(), { once: true }));
    act(() => setQueryRef('shoes'));
    expect((await screen.findByRole('alert')).textContent).toMatch(/can’t be reached/);
    act(() => screen.getByText('Try again').click());
    expect((await screen.findAllByTestId('title')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('retries by itself while the dataset is getting ready', async () => {
    renderResults();
    await screen.findByTestId('idle-logo');
    server.use(http.post(`${DS}/search`, () => HttpResponse.json(
      { code: 'invalidState', retryable: true, currentState: 'Indexing' },
      { status: 409, headers: { 'Retry-After': '0' } },
    ), { once: true }));
    act(() => setQueryRef('shoes'));
    expect((await screen.findByRole('alert')).textContent).toMatch(/getting ready/);
    expect(screen.queryByText('Try again')).toBeNull();
    expect((await screen.findAllByTestId('title')).length).toBeGreaterThan(0);
  });
});

describe('no results', () => {
  it('renders nothing: the search field says so', async () => {
    server.use(http.post(`${DS}/search`, () => HttpResponse.json({ ...SEARCH_RESPONSE, records: [] })));
    const { container } = renderResults();
    await screen.findByTestId('idle-logo');
    act(() => setQueryRef('xyzzy'));
    await waitFor(() => expect(screen.queryByTestId('idle-logo')).toBeNull());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container.textContent).toBe('');
  });
});
