import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider } from '../context/SearchContext';
import { RangeFilterPanel } from '../components/RangeFilterPanel';
import { server } from './mocks/server';

// Real-enough InputField: forwards value/onChange/onBlur/onKeyDown so typing can be exercised.
vi.mock('@indxsearch/systm', () => ({
  FilterPanelBase: ({ children }: { children: React.ReactNode }) => <div data-testid="filter-panel">{children}</div>,
  Slider: ({ min, max, step }: { min: number; max: number; step?: number }) => <div role="slider" data-min={min} data-max={max} data-step={step} />,
  InputField: ({ label, ...props }: any) => <input aria-label={label} {...props} />,
}));

function renderPanel(props: Partial<React.ComponentProps<typeof RangeFilterPanel>> = {}) {
  return render(
    <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token"
      allowEmptySearch enableFacets facetDebounceDelayMillis={0}>
      <RangeFilterPanel field="price" displayType="input" {...props} />
    </SearchProvider>
  );
}

// Fixture facets put price bounds at 10–200.
describe('Min/Max inputs', () => {
  it('keeps what the user types until the value is committed', async () => {
    renderPanel();
    const min = await screen.findByLabelText('Min:') as HTMLInputElement;
    await waitFor(() => expect(min.value).toBe('10'));

    fireEvent.change(min, { target: { value: '' } });
    expect(min.value).toBe('');            // Number('') is 0, but no clamp-to-10 mid-edit
    fireEvent.change(min, { target: { value: '2' } });
    expect(min.value).toBe('2');           // first digit of "25" is not clamped up to 10
    fireEvent.change(min, { target: { value: '25' } });
    fireEvent.keyDown(min, { key: 'Enter' });
    expect(min.value).toBe('25');
  });

  it('clamps and reverts on commit, not on keystroke', async () => {
    renderPanel();
    const min = await screen.findByLabelText('Min:') as HTMLInputElement;
    await waitFor(() => expect(min.value).toBe('10'));

    fireEvent.change(min, { target: { value: '5' } });
    fireEvent.blur(min);
    expect(min.value).toBe('10');          // below queryMin → clamped

    fireEvent.change(min, { target: { value: '' } });
    fireEvent.blur(min);
    expect(min.value).toBe('10');          // empty → reverted, not zero
  });
});

describe('field validation', () => {
  it('reports a facetable-but-not-filterable field instead of rendering a dead slider', async () => {
    server.use(
      http.get('http://localhost/api/teams/team/datasets/test/fields/filterable', () => HttpResponse.json(['category'])),
    );
    renderPanel({ displayType: 'slider' });
    await screen.findByText(/Cannot render filter for "price": missing filterable/);
    expect(screen.queryByRole('slider')).toBeNull();
  });
});

describe('slider step', () => {
  it('derives a fractional step from fractional bounds so values sit on the grid', async () => {
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', () => HttpResponse.json({
        records: [], truncationIndex: -1,
        facets: { price: [{ key: '6.5', value: 3 }, { key: '7.3', value: 4 }, { key: '9.25', value: 1 }] },
      })),
    );
    renderPanel({ displayType: 'slider' });
    const slider = await screen.findByRole('slider');
    await waitFor(() => expect(slider.dataset.step).toBe('0.01'));
  });

  it('uses step 1 for integer data and honours an explicit step prop', async () => {
    renderPanel({ displayType: 'slider' });
    const slider = await screen.findByRole('slider');
    await waitFor(() => expect(slider.dataset.min).toBe('10'));
    expect(slider.dataset.step).toBe('1');
  });
});
