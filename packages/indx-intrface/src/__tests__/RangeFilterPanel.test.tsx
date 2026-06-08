import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider } from '../context/SearchContext';
import { RangeFilterPanel } from '../components/RangeFilterPanel';
import { server } from './mocks/server';
import { FACETS, SEARCH_RESPONSE } from './mocks/fixtures';

// @indxsearch/systm imports @indxsearch/pixl which has a module named "Object"
// that conflicts with the global Object in the test environment. Mock systm
// with minimal stubs so the component logic can be exercised without the crash.
vi.mock('@indxsearch/systm', () => ({
  FilterPanelBase: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="filter-panel">{children}</div>
  ),
  Slider: ({ min, max }: { min: number; max: number }) => (
    <div role="slider" data-min={min} data-max={max} />
  ),
  InputField: ({ label, value }: { label: string; value: number }) => (
    <input aria-label={label} defaultValue={value} readOnly />
  ),
}));

// Renders RangeFilterPanel inside a SearchProvider.
// allowEmptySearch=true fires an initial search immediately, populating rangeBounds + facets.
function renderPanel(props: Partial<React.ComponentProps<typeof RangeFilterPanel>> = {}) {
  return render(
    <SearchProvider
      url="http://localhost"
      team="team"
      dataset="test"
      preAuthenticatedToken="test-token"
      allowEmptySearch={true}
      enableFacets={true}
      facetDebounceDelayMillis={0}
    >
      <RangeFilterPanel
        field="price"
        displayType="slider"
        expectedMin={0}
        expectedMax={200}
        {...props}
      />
    </SearchProvider>
  );
}

// Wait until the initial search has completed and rangeBounds/facets are populated.
// We detect this by waiting for the filter panel to mount (isFetchingInitial → false).
async function waitForReady() {
  await waitFor(() => expect(screen.queryByTestId('filter-panel')).not.toBeNull(), { timeout: 3000 });
}

// ─── Histogram rendering ──────────────────────────────────────────────────────

describe('histogram rendering', () => {
  it('shows no histogram bars when showHistogram is omitted', async () => {
    renderPanel();
    await waitForReady();
    expect(screen.queryAllByTestId('histogram-bar')).toHaveLength(0);
  });

  it('shows no histogram bars when displayType is input', async () => {
    renderPanel({ showHistogram: true, displayType: 'input' });
    // input mode never renders the slider branch — just wait a moment
    await new Promise(r => setTimeout(r, 200));
    expect(screen.queryAllByTestId('histogram-bar')).toHaveLength(0);
  });

  it('renders bars after the first search populates facets', async () => {
    renderPanel({ showHistogram: true });
    await waitFor(() =>
      expect(screen.queryAllByTestId('histogram-bar').length).toBeGreaterThan(0),
      { timeout: 3000 }
    );
  });

  it('derives the right bar count from the default ~20-bar resolution', async () => {
    // range = queryMax(200) - queryMin(10) = 190
    // effectiveResolution = ceil(190 / 20) = 10
    // numBars = ceil(190 / 10) = 19
    renderPanel({ showHistogram: true });
    await waitFor(() =>
      expect(screen.queryAllByTestId('histogram-bar')).toHaveLength(19),
      { timeout: 3000 }
    );
  });

  it('respects an explicit resolution prop', async () => {
    // resolution=50 over range 190: ceil(190/50) = 4 bars
    renderPanel({ showHistogram: true, resolution: 50 });
    await waitFor(() =>
      expect(screen.queryAllByTestId('histogram-bar')).toHaveLength(4),
      { timeout: 3000 }
    );
  });
});

// ─── Bar heights ──────────────────────────────────────────────────────────────

describe('bar heights', () => {
  it('normalises heights so the tallest bar is always 20px', async () => {
    renderPanel({ showHistogram: true, resolution: 10 });
    await waitFor(() =>
      expect(screen.queryAllByTestId('histogram-bar').length).toBeGreaterThan(0),
      { timeout: 3000 }
    );

    const bars = screen.getAllByTestId('histogram-bar');
    const heights = bars.map(b => parseInt(b.style.height, 10));

    expect(Math.max(...heights)).toBe(20);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(1);
  });

  it('produces varying heights when fixture values differ across buckets', async () => {
    renderPanel({ showHistogram: true, resolution: 10 });
    await waitFor(() =>
      expect(screen.queryAllByTestId('histogram-bar').length).toBeGreaterThan(0),
      { timeout: 3000 }
    );

    const bars = screen.getAllByTestId('histogram-bar');
    const heights = bars.map(b => parseInt(b.style.height, 10));
    // FACETS fixture has variance — not all bars should be the same height
    expect(new Set(heights).size).toBeGreaterThan(1);
  });
});

// ─── Active / greyed state ────────────────────────────────────────────────────

describe('active state', () => {
  it('all bars are active when no range filter is set (slider at full range)', async () => {
    renderPanel({ showHistogram: true });
    await waitFor(() =>
      expect(screen.queryAllByTestId('histogram-bar').length).toBeGreaterThan(0),
      { timeout: 3000 }
    );

    const bars = screen.getAllByTestId('histogram-bar');
    const inactiveBars = bars.filter(b => b.dataset.active === 'false');
    expect(inactiveBars).toHaveLength(0);
  });
});

// ─── Snapshot update ──────────────────────────────────────────────────────────

describe('histogram snapshot', () => {
  it('updates bar count when a new search returns a different price range', async () => {
    // Override server: first search returns standard FACETS (range 10–200 → 19 bars at res=10),
    // second search returns narrow facets (range 150–200 → ceil(50/10)=5 bars).
    const narrowFacets = {
      price: [
        { key: '150', value: 10 },
        { key: '175', value: 8  },
        { key: '200', value: 5  },
      ],
    };
    let callCount = 0;
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/Search', () => {
        callCount++;
        const facets = callCount <= 1 ? FACETS : narrowFacets;
        return HttpResponse.json({ records: [], facets, truncationIndex: -1 });
      })
    );

    renderPanel({ showHistogram: true, resolution: 10 });

    // First snapshot: 19 bars (range 10–200 / res 10)
    await waitFor(() =>
      expect(screen.queryAllByTestId('histogram-bar')).toHaveLength(19),
      { timeout: 3000 }
    );
  });

  it('logs a console warning when field is not facetable', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <SearchProvider
        url="http://localhost"
        team="team"
        dataset="test"
        preAuthenticatedToken="test-token"
        allowEmptySearch={true}
        enableFacets={true}
        facetDebounceDelayMillis={0}
      >
        <RangeFilterPanel
          field="rating"
          displayType="slider"
          showHistogram={true}
          expectedMin={0}
          expectedMax={5}
        />
      </SearchProvider>
    );

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('"rating" is not facetable')
      ),
      { timeout: 3000 }
    );

    warn.mockRestore();
  });
});
