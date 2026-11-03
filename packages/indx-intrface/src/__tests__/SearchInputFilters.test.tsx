import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { SearchInput } from '../components/SearchInput';

// The field's filter count opens the active filters, to see them and remove them one by one.

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

let ctx: ReturnType<typeof useSearchContext>;
function Grab() { ctx = useSearchContext(); return null; }

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token" enableFacets={false}>
      <Grab />{children}
    </SearchProvider>
  );
}

describe('SearchInput filter count', () => {
  it('opens the active filters, and closes once the last one is removed', async () => {
    render(<SearchInput />, { wrapper });
    await waitFor(() => expect(ctx.isFetchingInitial).toBe(false));
    act(() => { ctx.toggleFilter('type1', 'fire'); ctx.toggleFilter('type1', 'water'); });

    fireEvent.click(await screen.findByRole('button', { name: '2 filters active: show them' }));
    expect(await screen.findByText('Active filters')).toBeTruthy();
    fireEvent.click(screen.getByText('type1: fire'));
    await waitFor(() => expect(screen.queryByText('type1: fire')).toBeNull());
    expect(screen.getByText('type1: water')).toBeTruthy();

    fireEvent.click(screen.getByText('type1: water'));
    await waitFor(() => expect(screen.queryByText('Active filters')).toBeNull());
    expect(screen.queryByRole('button', { name: /filters? active/ })).toBeNull();
  });
});
