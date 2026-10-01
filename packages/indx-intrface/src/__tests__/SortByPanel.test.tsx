import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { SortByPanel } from '../components/SortByPanel';

// systm pulls in pixl, whose "Object" icon shadows the global in this environment (see
// RangeFilterPanel.test.tsx). Stubs that show the options as text and let a test choose one.
vi.mock('@indxsearch/systm', () => ({
  FilterPanelBase: ({ children }: { children: React.ReactNode }) => <div data-testid="panel">{children}</div>,
  Select: ({ options, onValueChange }: { options: { label: string; value: string }[]; onValueChange: (v: string) => void }) => (
    <ul>
      {options.map(o => <li key={o.value}><button onClick={() => onValueChange(o.value)}>{o.label}</button></li>)}
    </ul>
  ),
  RadioButton: ({ label }: { label: string }) => <span>{label}</span>,
}));

let sortState: { sortBy: string | null | undefined; sortAscending: boolean | undefined } = { sortBy: undefined, sortAscending: undefined };
function SortProbe() {
  const { state } = useSearchContext();
  sortState = { sortBy: state.sortBy, sortAscending: state.sortAscending };
  return null;
}

function renderPanel(props: React.ComponentProps<typeof SortByPanel> = {}) {
  return render(
    <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token"
      allowEmptySearch enableFacets facetDebounceDelayMillis={0}>
      <SortByPanel {...props} />
      <SortProbe />
    </SearchProvider>
  );
}

// The loading skeleton shares the stubbed panel, so wait for the options, not the panel.
const labels = () => screen.getAllByRole('button').map(b => b.textContent);

describe('SortByPanel options', () => {
  it('lists every sortable field by name, both ways, when no options are given', async () => {
    renderPanel();
    await waitFor(() => expect(screen.queryAllByRole('button').length).toBeGreaterThan(0), { timeout: 3000 });
    expect(labels()).toEqual(['None', 'price (asc)', 'price (desc)', 'title (asc)', 'title (desc)']);
  });

  it('offers only the given options, in order, with their labels', async () => {
    renderPanel({ options: [
      { field: 'price', ascending: true, label: 'Cheapest first' },
      { field: 'title', ascending: true, label: 'A to Z' },
    ] });
    await waitFor(() => expect(screen.queryAllByRole('button').length).toBeGreaterThan(0), { timeout: 3000 });
    expect(labels()).toEqual(['None', 'Cheapest first', 'A to Z']);
  });

  it('leaves out an option whose field is not sortable, and says why', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderPanel({ options: [
      { field: 'category', ascending: true, label: 'By category' },
      { field: 'price', ascending: false, label: 'Most expensive' },
    ] });
    await waitFor(() => expect(screen.queryAllByRole('button').length).toBeGreaterThan(0), { timeout: 3000 });
    expect(labels()).toEqual(['None', 'Most expensive']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("'category' is not sortable"));
    warn.mockRestore();
  });

  it('renames or drops the choice that turns sorting off', async () => {
    const { unmount } = renderPanel({ noneLabel: 'Relevance', options: [{ field: 'price', ascending: true, label: 'Cheapest first' }] });
    await waitFor(() => expect(screen.queryAllByRole('button').length).toBeGreaterThan(0), { timeout: 3000 });
    expect(labels()).toEqual(['Relevance', 'Cheapest first']);
    unmount();
    renderPanel({ noneLabel: null, options: [{ field: 'price', ascending: true, label: 'Cheapest first' }] });
    await waitFor(() => expect(screen.queryAllByRole('button').length).toBeGreaterThan(0), { timeout: 3000 });
    expect(labels()).toEqual(['Cheapest first']);
  });

  it('sorts by the chosen option', async () => {
    renderPanel({ options: [{ field: 'price', ascending: false, label: 'Most expensive' }] });
    await waitFor(() => expect(screen.queryAllByRole('button').length).toBeGreaterThan(0), { timeout: 3000 });
    fireEvent.click(screen.getByText('Most expensive'));
    await waitFor(() => expect(sortState).toEqual({ sortBy: 'price', sortAscending: false }));
  });
});
