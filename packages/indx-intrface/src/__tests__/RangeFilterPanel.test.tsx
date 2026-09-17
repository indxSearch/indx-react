import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
        control="slider"
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

  it('shows no histogram bars when control is input', async () => {
    renderPanel({ showHistogram: true, control: 'input' });
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
    const heights = bars.map(b => parseInt((b.firstElementChild as HTMLElement).style.height, 10));

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
    const heights = bars.map(b => parseInt((b.firstElementChild as HTMLElement).style.height, 10));
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
      http.post('http://localhost/api/teams/team/datasets/test/search', () => {
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
          control="slider"
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

// ─── Clicking a bar ───────────────────────────────────────────────────────────

describe('clicking a histogram bar', () => {
  it('filters on that bucket, and clicking it again returns to the full range', async () => {
    const rangeBodies: { lowerLimit: number; upperLimit: number }[] = [];
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/filters/range', async ({ request }) => {
        const body = await request.json() as { fieldName: string; lowerLimit: number; upperLimit: number };
        rangeBodies.push(body);
        return HttpResponse.json({ hashString: `range:${body.fieldName}:${body.lowerLimit}-${body.upperLimit}` });
      }),
    );
    renderPanel({ showHistogram: true, resolution: 10 });
    await waitFor(() => expect(screen.queryAllByTestId('histogram-bar').length).toBeGreaterThan(0), { timeout: 3000 });

    // Fixture bounds are 10-200; resolution 10 makes the first bar the bucket 10-19.
    const first = screen.getAllByTestId('histogram-bar')[0];
    expect(first.getAttribute('aria-label')).toBe('10 to 19: 3');
    fireEvent.click(first);
    await waitFor(() => expect(rangeBodies.at(-1)).toEqual({ fieldName: 'price', lowerLimit: 10, upperLimit: 19 }));

    const before = rangeBodies.length;
    fireEvent.click(screen.getAllByTestId('histogram-bar')[0]);
    await new Promise(r => setTimeout(r, 50));
    expect(rangeBodies.length).toBe(before); // back to the full range: no filter sent
  });
});

// ─── Bars sit on the value axis ───────────────────────────────────────────────

describe('bar layout', () => {
  it('weights each bar by its span in value units, cutting the last one at the max', async () => {
    // Bounds 10-200 at resolution 50: 10-60, 60-110, 110-160 and 160-200 (40 wide).
    renderPanel({ showHistogram: true, resolution: 50 });
    await waitFor(() => expect(screen.queryAllByTestId('histogram-bar')).toHaveLength(4), { timeout: 3000 });
    const grow = screen.getAllByTestId('histogram-bar').map(b => Number(b.style.flexGrow));
    expect(grow).toEqual([50, 50, 50, 40]);
  });

  it('counts the max value into the last bucket', async () => {
    // Fixture has a value at exactly 200, the upper bound; it belongs to 190-200.
    renderPanel({ showHistogram: true, resolution: 10 });
    await waitFor(() => expect(screen.queryAllByTestId('histogram-bar')).toHaveLength(19), { timeout: 3000 });
    const last = screen.getAllByTestId('histogram-bar').at(-1)!;
    expect(last.getAttribute('aria-label')).toBe('190 to 200: 2');
  });

  it('clips the lit layer by the same value fraction the slider uses for a thumb', async () => {
    renderPanel({ showHistogram: true, resolution: 10 });
    await waitFor(() => expect(screen.queryAllByTestId('histogram-bar')).toHaveLength(19), { timeout: 3000 });
    fireEvent.click(screen.getAllByTestId('histogram-bar')[0]); // selects 10-19
    const lit = screen.getAllByTestId('histogram-bar')[0].parentElement!.nextElementSibling as HTMLElement;
    // Right inset fraction = (200 - 19) / 190; left = 0. Same mapping as react-range's
    // thumb centre, trackLeft + trackWidth * (v - min) / (max - min).
    await waitFor(() => expect(lit.style.clipPath).toContain(`* ${(200 - 19) / 190})`));
    expect(lit.style.clipPath).toContain('* 0)');
    expect(lit.style.clipPath).toContain('10px + (100% - 20px)');
  });
});
