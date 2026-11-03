import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SearchField } from '../../../indx-systm/src/components/SearchField/SearchField';

vi.mock('@indxsearch/pixl', () => ({ Search: () => null }));

afterEach(cleanup);

// jsdom has none; the field measures its right slot with one.
globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

// The built-in Clear, as the Blazor port's Clearable: there while the field holds text, and
// clearing reaches a controlled parent as an ordinary change.
function Controlled({ onValue }: { onValue: (v: string) => void }) {
  const [v, setV] = useState('velvet sofa');
  return <SearchField value={v} onChange={e => { setV(e.target.value); onValue(e.target.value); }} />;
}

it('clears a controlled field through its onChange and keeps the focus', () => {
  const seen = vi.fn();
  render(<Controlled onValue={seen} />);
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect(seen).toHaveBeenLastCalledWith('');
  const input = screen.getByRole('searchbox') as HTMLInputElement;
  expect(input.value).toBe('');
  expect(document.activeElement).toBe(input);
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
});

it('shows Clear in an uncontrolled field once something is typed', () => {
  render(<SearchField placeholder="Search" />);
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'desk' } });
  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
  expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('');
});

it('leaves Clear out when clearable is false', () => {
  render(<SearchField value="desk" onChange={() => {}} clearable={false} />);
  expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
});
