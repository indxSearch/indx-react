import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider } from '../context/SearchContext';
import { ValueFilterPanel } from '../components/ValueFilterPanel';
import { server } from './mocks/server';

vi.mock('@indxsearch/systm', () => ({
  FilterPanelBase: ({ children }: { children: React.ReactNode }) => <div data-testid="filter-panel">{children}</div>,
  ToggleSwitch: ({ label, checked, disabled, onChange }: any) => (
    <input type="checkbox" role="switch" aria-label={label} checked={checked} disabled={disabled} onChange={() => onChange(!checked)} />
  ),
  Checkbox: ({ label, checked, disabled, onChange }: any) => (
    <input type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={() => onChange(!checked)} />
  ),
  Button: ({ children, onClick, disabled }: any) => <button onClick={onClick} disabled={disabled}>{children}</button>,
}));

const DS = 'http://localhost/api/teams/team/datasets/test';

// A scalar field: every document has exactly one color. Facet counts are computed
// over the documents the filter admits, which is what the real server does
// (SearchEngine.GetFacets walks the result set).
const DOCS = [
  { key: 1, color: 'red' },
  { key: 2, color: 'red' },
  { key: 3, color: 'blue' },
  { key: 4, color: 'green' },
];

// The mock filter tokens are readable: "color=red", "(color=red OR color=blue)".
function admits(token: string | undefined, doc: { color: string }): boolean {
  if (!token) return true;
  const alternatives = token.replace(/[()]/g, '').split(' OR ');
  return alternatives.some(alt => alt.split(' AND ').every(clause => {
    const [field, value] = clause.split('=');
    return (doc as any)[field] === value;
  }));
}

function facetsFor(token: string | undefined) {
  const counts = new Map<string, number>();
  for (const doc of DOCS) {
    if (!admits(token, doc)) continue;
    counts.set(doc.color, (counts.get(doc.color) ?? 0) + 1);
  }
  return Array.from(counts, ([key, value]) => ({ key, value }));
}

/** Serves a scalar-field dataset; returns the search bodies seen, newest last. */
function serveScalarDataset() {
  const searchBodies: { filter?: { hashString: string }; maxNumberOfRecordsToReturn: number; enableFacets: boolean }[] = [];
  server.use(
    http.get(`${DS}/fields/filterable`, () => HttpResponse.json(['color'])),
    http.get(`${DS}/fields/facetable`, () => HttpResponse.json(['color'])),
    http.post(`${DS}/search`, async ({ request }) => {
      const body = await request.json() as (typeof searchBodies)[number];
      searchBodies.push(body);
      const admitted = DOCS.filter(d => admits(body.filter?.hashString, d));
      return HttpResponse.json({
        records: admitted.map(d => ({ documentKey: d.key, score: 100 })),
        facets: { color: facetsFor(body.filter?.hashString) },
        truncationIndex: -1,
      });
    }),
    http.post(`${DS}/documents/lookup`, async ({ request }) => {
      const keys = await request.json() as number[];
      return HttpResponse.json(keys.map(k => DOCS.find(d => d.key === k)));
    }),
  );
  return searchBodies;
}

function renderPanel(match: 'all' | 'any') {
  return render(
    <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token"
      allowEmptySearch enableFacets facetDebounceDelayMillis={0}>
      <ValueFilterPanel field="color" match={match} />
    </SearchProvider>
  );
}

const settle = () => new Promise(r => setTimeout(r, 50));
// Initialisation always sends one facets-only blank search; anything beyond that is ours.
const facetOnlySearches = (bodies: { maxNumberOfRecordsToReturn: number }[]) =>
  bodies.filter(b => b.maxNumberOfRecordsToReturn === 0).length - 1;
const box = (label: string) => screen.getByLabelText(label) as HTMLInputElement;

describe('match="any" on a scalar field', () => {
  it('keeps the other values selectable after the first one is ticked, with their own counts', async () => {
    serveScalarDataset();
    renderPanel('any');

    await screen.findByLabelText('red');
    expect(box('blue').disabled).toBe(false);

    fireEvent.click(box('red'));
    await waitFor(() => expect(box('red').checked).toBe(true));
    await settle();

    // Counts for this field come from a search that leaves the field's own
    // selection out, so blue and green keep their real counts and stay enabled.
    expect(box('blue').disabled).toBe(false);
    expect(box('green').disabled).toBe(false);
    expect(screen.getAllByText('1')).toHaveLength(2); // blue's and green's counts, shown beside them
  });

  it('ORs the second selection and returns documents of both values', async () => {
    const searchBodies = serveScalarDataset();
    renderPanel('any');

    await screen.findByLabelText('red');
    fireEvent.click(box('red'));
    await waitFor(() => expect(box('red').checked).toBe(true));
    await settle();

    fireEvent.click(box('blue'));
    await waitFor(() => expect(box('blue').checked).toBe(true));
    await settle();

    const main = searchBodies.filter(b => b.maxNumberOfRecordsToReturn > 0).at(-1)!;
    expect(main.filter?.hashString).toBe('(color=red OR color=blue)');
    // Three documents are red or blue; the facet search for the panel excludes color entirely.
    const facetOnly = searchBodies.filter(b => b.maxNumberOfRecordsToReturn === 0).at(-1)!;
    expect(facetOnly.filter).toBeUndefined();
    expect(box('red').checked && box('blue').checked).toBe(true);
    expect(box('green').disabled).toBe(false);
  });

  it('sends no extra facet search while nothing is selected on the field', async () => {
    const searchBodies = serveScalarDataset();
    renderPanel('any');
    await screen.findByLabelText('red');
    await settle();
    expect(facetOnlySearches(searchBodies)).toBe(0);
  });

  it('sends no extra facet search for a match="all" field', async () => {
    const searchBodies = serveScalarDataset();
    renderPanel('all');
    await screen.findByLabelText('red');
    fireEvent.click(box('red'));
    await waitFor(() => expect(box('red').checked).toBe(true));
    await settle();
    expect(facetOnlySearches(searchBodies)).toBe(0);
  });
});
