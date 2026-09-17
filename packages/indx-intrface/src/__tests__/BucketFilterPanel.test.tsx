import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider } from '../context/SearchContext';
import { BucketFilterPanel } from '../components/BucketFilterPanel';
import { ActiveFiltersPanel } from '../components/ActiveFiltersPanel';
import { server } from './mocks/server';

vi.mock('@indxsearch/systm', () => ({
  FilterPanelBase: ({ title, children }: { title?: string; children: React.ReactNode }) => (
    <div data-testid="filter-panel">{title && <h3>{title}</h3>}{children}</div>
  ),
  Checkbox: ({ label, checked, disabled, onChange }: any) => (
    <input type="checkbox" aria-label={label} checked={checked} disabled={disabled} onChange={() => onChange(!checked)} />
  ),
  Button: ({ children, onClick, disabled, title }: any) => <button onClick={onClick} disabled={disabled} title={title}>{children}</button>,
}));
vi.mock('@indxsearch/pixl', () => ({ X_or_error: () => null }));

const DS = 'http://localhost/api/teams/team/datasets/test';

// A scalar numeric field. Facet counts are computed over the documents the
// filter admits, as the engine does, so the mock behaves like a real server.
const DOCS = [
  { key: 1, speed: 5 },
  { key: 2, speed: 18 },
  { key: 3, speed: 25 },
  { key: 4, speed: 33 },
  { key: 5, speed: 45 },
  { key: 6, speed: 65 },
  { key: 7, speed: 80 },
];

// Range tokens are "speed:lo-hi"; combinations keep the AND/OR shape.
function admits(token: string | undefined, doc: { speed: number }): boolean {
  if (!token) return true;
  const alternatives = token.replace(/[()]/g, '').split(' OR ');
  return alternatives.some(alt => alt.split(' AND ').every(clause => {
    const m = /^speed:(-?[\d.e+]+)-(-?[\d.e+]+)$/.exec(clause);
    if (!m) return false;
    return doc.speed >= Number(m[1]) && doc.speed <= Number(m[2]);
  }));
}

function facetsFor(token: string | undefined) {
  const counts = new Map<string, number>();
  for (const doc of DOCS) {
    if (!admits(token, doc)) continue;
    counts.set(String(doc.speed), (counts.get(String(doc.speed)) ?? 0) + 1);
  }
  return Array.from(counts, ([key, value]) => ({ key, value }));
}

function serveSpeedDataset() {
  const searchBodies: { filter?: { hashString: string }; maxNumberOfRecordsToReturn: number }[] = [];
  server.use(
    http.get(`${DS}/fields/filterable`, () => HttpResponse.json(['speed'])),
    http.get(`${DS}/fields/facetable`, () => HttpResponse.json(['speed'])),
    http.post(`${DS}/filters/range`, async ({ request }) => {
      const { fieldName, lowerLimit, upperLimit } = await request.json() as { fieldName: string; lowerLimit: number; upperLimit: number };
      return HttpResponse.json({ hashString: `${fieldName}:${lowerLimit}-${upperLimit}` });
    }),
    http.post(`${DS}/search`, async ({ request }) => {
      const body = await request.json() as (typeof searchBodies)[number];
      searchBodies.push(body);
      const admitted = DOCS.filter(d => admits(body.filter?.hashString, d));
      return HttpResponse.json({
        records: admitted.map(d => ({ documentKey: d.key, score: 100 })),
        facets: { speed: facetsFor(body.filter?.hashString) },
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

function renderPanel(props: React.ComponentProps<typeof BucketFilterPanel>, withChips = false) {
  return render(
    <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token"
      allowEmptySearch enableFacets facetDebounceDelayMillis={0}>
      {withChips && <ActiveFiltersPanel />}
      <BucketFilterPanel {...props} />
    </SearchProvider>
  );
}

const settle = () => new Promise(r => setTimeout(r, 50));
const box = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const mainSearches = (bodies: { maxNumberOfRecordsToReturn: number }[]) => bodies.filter(b => b.maxNumberOfRecordsToReturn > 0);

describe('BucketFilterPanel', () => {
  it('lays equal-width buckets over the field range and sums the counts into them', async () => {
    serveSpeedDataset();
    renderPanel({ field: 'speed', label: 'Speed', width: 20 });

    // Bounds 5-80 with width 20 → 0-19, 20-39, 40-59, 60-79, 80-99
    await screen.findByLabelText('0-19');
    expect(box('20-39')).not.toBeNull();
    expect(box('80-99')).not.toBeNull();
    expect(screen.queryByLabelText('100-119')).toBeNull();
    // 0-19 holds speeds 5 and 18; 20-39 holds 25 and 33; 40-59 only 45
    const counts = screen.getAllByText('2');
    expect(counts.length).toBe(2);
    expect(screen.getAllByText('1').length).toBe(3);
  });

  it('takes explicit lower edges, closing each bucket one step under the next', async () => {
    serveSpeedDataset();
    renderPanel({ field: 'speed', width: [1, 21, 41, 81] });
    await screen.findByLabelText('1-20');
    expect(box('21-40')).not.toBeNull();
    expect(box('41-80')).not.toBeNull();
    expect(screen.queryByLabelText('81-')).toBeNull();
  });

  it('renders named, open-ended buckets and sends them closed at the field bounds', async () => {
    const searchBodies = serveSpeedDataset();
    renderPanel({
      field: 'speed',
      buckets: [{ label: 'Slow', max: 30 }, { label: 'Average', min: 31, max: 60 }, { label: 'Fast', min: 61 }],
    });
    await screen.findByLabelText('Slow');
    fireEvent.click(box('Fast'));
    await waitFor(() => expect(box('Fast').checked).toBe(true));
    await settle();
    // Open upper end closed at the field's max (80)
    expect(mainSearches(searchBodies).at(-1)!.filter?.hashString).toBe('speed:61-80');
  });

  it('ORs two selected buckets and keeps the others countable', async () => {
    const searchBodies = serveSpeedDataset();
    renderPanel({ field: 'speed', width: 20 }, true);
    await screen.findByLabelText('0-19');

    fireEvent.click(box('0-19'));
    await waitFor(() => expect(box('0-19').checked).toBe(true));
    await settle();
    // With 0-19 selected, the other buckets must keep their real counts, not drop to 0.
    expect(box('20-39').disabled).toBe(false);
    expect(box('60-79').disabled).toBe(false);

    fireEvent.click(box('60-79'));
    await waitFor(() => expect(box('60-79').checked).toBe(true));
    await settle();

    const main = mainSearches(searchBodies).at(-1)!;
    expect(main.filter?.hashString).toBe('(speed:0-19 OR speed:60-79)');
    // The facet search for this panel leaves the field out entirely.
    const facetOnly = searchBodies.filter(b => b.maxNumberOfRecordsToReturn === 0).at(-1)!;
    expect(facetOnly.filter).toBeUndefined();

    // Active filters shows one chip per bucket; clicking one removes just that bucket.
    fireEvent.click(screen.getByTitle('speed: 0-19'));
    await waitFor(() => expect(box('0-19').checked).toBe(false));
    expect(box('60-79').checked).toBe(true);
  });

  it('hides empty buckets when asked and disables them otherwise', async () => {
    serveSpeedDataset();
    const { unmount } = renderPanel({ field: 'speed', buckets: [{ label: 'None', min: 90, max: 99 }, { label: 'Some', min: 1, max: 10 }] });
    await screen.findByLabelText('Some');
    expect(box('None').disabled).toBe(true);
    unmount();

    renderPanel({ field: 'speed', hideEmpty: true, buckets: [{ label: 'None', min: 90, max: 99 }, { label: 'Some', min: 1, max: 10 }] });
    await screen.findByLabelText('Some');
    expect(screen.queryByLabelText('None')).toBeNull();
  });

  it('reports a field that is not filterable instead of rendering', async () => {
    serveSpeedDataset();
    server.use(http.get(`${DS}/fields/filterable`, () => HttpResponse.json([])));
    renderPanel({ field: 'speed', width: 20 });
    await screen.findByText(/not filterable/);
  });
});
