import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider } from '../context/SearchContext';
import { ValueFilterPanel } from '../components/ValueFilterPanel';
import { server } from './mocks/server';
import { RECORDS } from './mocks/fixtures';

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

const SEARCH = 'http://localhost/api/teams/team/datasets/test/search';
const FIELDS = ['price', 'category', 'inStock', 'color'];

/** Serves facets for one field; `narrowed` is what comes back once a filter is active. */
function serveFacets(field: string, initial: { key: string; value: number }[], narrowed?: { key: string; value: number }[]) {
  server.use(
    http.get('http://localhost/api/teams/team/datasets/test/fields/filterable', () => HttpResponse.json(FIELDS)),
    http.get('http://localhost/api/teams/team/datasets/test/fields/facetable', () => HttpResponse.json(FIELDS)),
    http.post(SEARCH, async ({ request }) => {
      const body = await request.json() as { filter?: unknown };
      const facets = body.filter && narrowed ? narrowed : initial;
      return HttpResponse.json({ records: RECORDS, facets: { [field]: facets }, truncationIndex: -1 });
    }),
  );
}

function renderPanel(props: React.ComponentProps<typeof ValueFilterPanel>) {
  return render(
    <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token"
      allowEmptySearch enableFacets facetDebounceDelayMillis={0}>
      <ValueFilterPanel {...props} />
    </SearchProvider>
  );
}

describe('boolean toggle', () => {
  it('stays on and enabled once the filter narrows the facet to {true} only', async () => {
    serveFacets('inStock', [{ key: 'true', value: 42 }, { key: 'false', value: 8 }], [{ key: 'true', value: 42 }]);
    renderPanel({ field: 'inStock', label: 'In stock', displayType: 'toggle' });

    const toggle = await screen.findByRole('switch') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect(toggle.disabled).toBe(false);

    fireEvent.click(toggle);
    // After the filtered search returns only { true: 42 } the toggle must still be on and clickable.
    await waitFor(() => expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(true));
    await new Promise(r => setTimeout(r, 30));
    const after = screen.getByRole('switch') as HTMLInputElement;
    expect(after.checked).toBe(true);
    expect(after.disabled).toBe(false);

    fireEvent.click(after);
    await waitFor(() => expect((screen.getByRole('switch') as HTMLInputElement).checked).toBe(false));
  });

  it('accepts a true/false/null field', async () => {
    serveFacets('inStock', [{ key: 'true', value: 5 }, { key: 'false', value: 3 }, { key: 'null', value: 2 }]);
    renderPanel({ field: 'inStock', label: 'In stock', displayType: 'toggle' });
    const toggle = await screen.findByRole('switch') as HTMLInputElement;
    expect(toggle.disabled).toBe(false);
  });
});

describe('null facet key', () => {
  it('is not turned into a fabricated "false" option on a checkbox panel', async () => {
    serveFacets('color', [{ key: 'red', value: 5 }, { key: 'null', value: 3 }]);
    renderPanel({ field: 'color', label: 'Color' });

    await screen.findByLabelText('red');
    expect(screen.queryByLabelText('false')).toBeNull();
    expect(screen.queryByLabelText('null')).toBeNull(); // hidden by default
  });

  it('is listed when showNull is set', async () => {
    serveFacets('color', [{ key: 'red', value: 5 }, { key: 'null', value: 3 }]);
    renderPanel({ field: 'color', label: 'Color', showNull: true });

    await screen.findByLabelText('red');
    expect(screen.getByLabelText('null')).not.toBeNull();
    expect(screen.queryByLabelText('false')).toBeNull();
  });
});

describe('match prop', () => {
  it("registers 'any' for the field so its values are ORed; default is 'all'", async () => {
    const combineOps: boolean[] = [];
    server.use(
      http.get('http://localhost/api/teams/team/datasets/test/fields/filterable', () => HttpResponse.json(FIELDS)),
      http.get('http://localhost/api/teams/team/datasets/test/fields/facetable', () => HttpResponse.json(FIELDS)),
      http.post(SEARCH, () => HttpResponse.json({
        records: RECORDS,
        facets: { color: [{ key: 'red', value: 5 }, { key: 'blue', value: 4 }], category: [{ key: 'a', value: 2 }, { key: 'b', value: 3 }] },
        truncationIndex: -1,
      })),
      http.post('http://localhost/api/teams/team/datasets/test/filters/combine', async ({ request }) => {
        const { useAndOperation } = await request.json() as { useAndOperation: boolean };
        combineOps.push(useAndOperation);
        return HttpResponse.json({ hashString: 'c' });
      }),
    );
    render(
      <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token"
        allowEmptySearch enableFacets facetDebounceDelayMillis={0}>
        <ValueFilterPanel field="color" match="any" />
        <ValueFilterPanel field="category" />
      </SearchProvider>
    );

    fireEvent.click(await screen.findByLabelText('red'));
    fireEvent.click(await screen.findByLabelText('blue'));
    await waitFor(() => expect(combineOps).toContain(false)); // color: OR

    fireEvent.click(await screen.findByLabelText('a'));
    fireEvent.click(await screen.findByLabelText('b'));
    await waitFor(() => expect(combineOps.filter(op => op === true).length).toBeGreaterThan(0)); // category: AND
  });
});
