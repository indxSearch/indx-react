import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, renderHook, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { useSearchOrAsk } from '../hooks/useSearchOrAsk';
import { useFilterSuggestion, localFilters } from '../hooks/useFilterSuggestion';
import { AskPanel } from '../components/AskPanel';
import { QuickAnswer } from '../components/QuickAnswer';
import { SearchInput } from '../components/SearchInput';
import { nextOffer, triggers, visibleResults, DEFAULT_THRESHOLDS } from '../utils/searchOrAsk';
import { server } from './mocks/server';

// Search or ask from the page's side: the settings decide whether anything is sent, a typing pause
// asks the judge, the offer keeps its hysteresis, and an answer streams into AskPanel.

const SOA = 'http://localhost/api/teams/team/datasets/test/search-or-ask';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token" enableFacets={false}>
      {children}
    </SearchProvider>
  );
}

function settings(enabled: boolean, available = true, mode?: string) {
  server.use(http.get(SOA, () => HttpResponse.json({
    settings: { enabled, mode, thresholds: DEFAULT_THRESHOLDS },
    effective: {},
    available,
  })));
}

/** The judge answers from a table of text → p, and records what it was asked: the pauses' calls in
 *  `asked`, the calls made ahead of a pause (prefetch) in `ahead`. `unfinished` are texts it reads
 *  as still being typed; everything else is finished. */
function judge(scores: Record<string, number>, asked: string[] = [], ahead: string[] = [], delayMs = 0, unfinished: string[] = []) {
  server.use(http.post(`${SOA}/intent`, async ({ request }) => {
    const { text, prefetch } = await request.json() as { text: string; prefetch?: boolean };
    (prefetch ? ahead : asked).push(text);
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
    const p = scores[text] ?? 0;
    return HttpResponse.json({ p, answerable: null, offer: 'none', thresholds: DEFAULT_THRESHOLDS, cached: false, ms: 1,
      finished: unfinished.includes(text) ? 0.1 : 0.9 });
  }));
  return asked;
}

function sse(events: [string, unknown][]) {
  const body = events.map(([e, d]) => `event: ${e}\ndata: ${JSON.stringify(d)}\n\n`).join('');
  return new HttpResponse(body, { headers: { 'Content-Type': 'text/event-stream' } });
}

function useBoth(pauseMs = 10) {
  const ctx = useSearchContext();
  const sor = useSearchOrAsk({ pauseMs });
  return { ctx, sor };
}

describe('the rules', () => {
  it('holds an offer below its entry threshold until the lower one', () => {
    expect(nextOffer('none', 0.5)).toBe('invite');
    expect(nextOffer('none', 0.7)).toBe('strong');
    expect(nextOffer('strong', 0.5)).toBe('strong');
    expect(nextOffer('strong', 0.4)).toBe('invite');
    expect(nextOffer('invite', 0.35)).toBe('invite');
    expect(nextOffer('none', 0.35)).toBe('none');
  });

  it('keeps the strong matches only while the offer is strong and the rule is on', () => {
    // The pokedex, 14 Oct 2026: 45 records counted on "is" and "or", so the scores decide.
    const pikachuOrBulbasaur = [{ score: 19843 }, { score: 15871 }, { score: 4527 }, { score: 4459 }, { score: 3744 }];
    expect(visibleResults(pikachuOrBulbasaur, 45, true)).toEqual([{ score: 19843 }, { score: 15871 }]);
    const whichIsStrongest = [{ score: 7029 }, { score: 6767 }, { score: 6633 }];
    expect(visibleResults(whichIsStrongest, 61, true)).toEqual([]);
    const whatTypeIsPikachu = [{ score: 22921 }, { score: 16367 }, { score: 9830 }];
    expect(visibleResults(whatTypeIsPikachu, 3, true)).toEqual([{ score: 22921 }, { score: 16367 }]);
    // The count of records counted, which come first: 1 is one confirmed, 0 none (a fallback),
    // undefined all (nothing counted to tell apart, Bm25f).
    expect(visibleResults(whatTypeIsPikachu, 1, true, { shareOfTop: 0, topFloor: 0 })).toEqual([{ score: 22921 }]);
    expect(visibleResults(whatTypeIsPikachu, 0, true, { shareOfTop: 0, topFloor: 0 })).toEqual([]);
    expect(visibleResults(whatTypeIsPikachu, undefined, true, { shareOfTop: 0, topFloor: 0 })).toEqual(whatTypeIsPikachu);
    expect(visibleResults(pikachuOrBulbasaur, 45, false)).toEqual(pikachuOrBulbasaur);
    expect(visibleResults(pikachuOrBulbasaur, 45, true, { shareOfTop: 0.9, topFloor: 0.2 })).toEqual([{ score: 19843 }]);
    expect(visibleResults(pikachuOrBulbasaur, 45, true, { shareOfTop: 0.5, topFloor: 0.5 })).toEqual([]);
    expect(visibleResults([], 0, true)).toEqual([]);
  });

  it('never judges an identifier', () => {
    expect(triggers('978-0-13-110362-7')).toBe(false);
    expect(triggers('SearchEngine.Index')).toBe(false);
    expect(triggers('how do I index')).toBe(true);
  });
});

describe('useSearchOrAsk', () => {
  it('sends nothing when the dataset has it off', async () => {
    settings(false);
    const asked = judge({});
    const { result } = renderHook(() => useBoth(), { wrapper });
    await waitFor(() => expect(result.current.ctx.isFetchingInitial).toBe(false));
    act(() => result.current.ctx.setQuery('how do I add synonyms'));
    await new Promise(r => setTimeout(r, 60));
    expect(asked).toEqual([]);
    expect(result.current.sor).toMatchObject({ available: false, offer: 'none' });
  });

  it('sends nothing when the instance has no key', async () => {
    settings(true, false);
    const asked = judge({});
    const { result } = renderHook(() => useBoth(), { wrapper });
    await waitFor(() => expect(result.current.ctx.isFetchingInitial).toBe(false));
    act(() => result.current.ctx.setQuery('how do I add synonyms'));
    await new Promise(r => setTimeout(r, 60));
    expect(asked).toEqual([]);
  });

  it('offers on a pause, and keeps a strong offer while the score dips above the hide line', async () => {
    settings(true);
    judge({ 'how do I add synonyms': 0.8, 'how do I add synonyms to x': 0.5 });
    const { result } = renderHook(() => useBoth(), { wrapper });
    await waitFor(() => expect(result.current.ctx.isFetchingInitial).toBe(false));
    await waitFor(() => expect(result.current.sor.available).toBe(true));

    act(() => result.current.ctx.setQuery('how do I add synonyms'));
    await waitFor(() => expect(result.current.sor.offer).toBe('strong'));
    expect(result.current.sor.p).toBe(0.8);
  });

  it('stands while the visitor types on from the judged text, and not after a backspace into it', async () => {
    settings(true);
    judge({ 'which film has tom hanks': 0.9 });
    const { result } = renderHook(() => useBoth(500), { wrapper });
    await waitFor(() => expect(result.current.ctx.isFetchingInitial).toBe(false));
    await waitFor(() => expect(result.current.sor.available).toBe(true));

    act(() => result.current.ctx.setQuery('which film has tom hanks'));
    await waitFor(() => expect(result.current.sor.offer).toBe('strong'));
    expect(result.current.sor.stands).toBe(true);

    // Typing on, before the next pause: the offer still stands for what is in the field.
    act(() => result.current.ctx.setQuery('which film has tom hanks stranded'));
    expect(result.current.sor.offer).toBe('strong');
    expect(result.current.sor.stands).toBe(true);

    // A backspace into the judged text: the offer was for a text the field no longer holds.
    act(() => result.current.ctx.setQuery('which film has tom han'));
    expect(result.current.sor.stands).toBe(false);
  });

  it('puts strict matching on the search while the offer is strong, and takes it off after', async () => {
    settings(true);
    judge({ 'how do I add synonyms': 0.8, 'synonyms': 0.1 });
    const { result } = renderHook(() => useBoth(), { wrapper });
    await waitFor(() => expect(result.current.ctx.isFetchingInitial).toBe(false));
    expect(result.current.ctx.state.searchSettings.match.tolerance).toBeUndefined();
    act(() => result.current.ctx.setQuery('how do I add synonyms'));
    await waitFor(() => expect(result.current.sor.offer).toBe('strong'));
    await waitFor(() => expect(result.current.ctx.state.searchSettings.match).toMatchObject({ tolerance: 'Exact', typingPrefixFrom: 0, joinedWords: false }));
    expect(result.current.sor).toMatchObject({ cutResults: true, strictCoverage: true });
    act(() => result.current.ctx.setQuery('synonyms'));
    await waitFor(() => expect(result.current.sor.offer).toBe('none'));
    await waitFor(() => expect(result.current.ctx.state.searchSettings.match.tolerance).toBeUndefined());
    expect(result.current.sor.strictCoverage).toBe(false);
  });

  it('gives one word the invitation at most', async () => {
    settings(true);
    judge({ synonyms: 0.9 });
    const { result } = renderHook(() => useBoth(), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('synonyms'));
    await waitFor(() => expect(result.current.sor.p).toBe(0.9));
    expect(result.current.sor.offer).toBe('invite');
  });

  it('asks only after the pause, for the text the visitor stopped at', async () => {
    settings(true);
    const asked = judge({});
    const { result } = renderHook(() => useBoth(40), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('how do'));
    act(() => result.current.ctx.setQuery('how do I'));
    act(() => result.current.ctx.setQuery('how do I sort'));
    await waitFor(() => expect(asked.length).toBe(1));
    expect(asked).toEqual(['how do I sort']);
  });

  it('goes quiet after a 429 rather than retrying every pause', async () => {
    settings(true);
    let calls = 0;
    server.use(http.post(`${SOA}/intent`, async ({ request }) => {
      if (!(await request.json() as { prefetch?: boolean }).prefetch) calls++;
      return HttpResponse.json({ code: 'searchOrAskBudgetSpent' }, { status: 429, headers: { 'Retry-After': '600' } });
    }));
    const { result } = renderHook(() => useBoth(), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('how do I sort'));
    await waitFor(() => expect(calls).toBe(1));
    act(() => result.current.ctx.setQuery('how do I sort by price'));
    await new Promise(r => setTimeout(r, 60));
    expect(calls).toBe(1);
    expect(result.current.sor.offer).toBe('none');
  });
});

describe('judging ahead of the pause', () => {
  it('asks while the visitor types, one call at a time, and the pause for what they stopped at', async () => {
    settings(true);
    const asked: string[] = [], ahead: string[] = [];
    judge({ 'how do I sort': 0.8 }, asked, ahead, 30);
    const { result } = renderHook(() => useBoth(150), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('how do'));
    act(() => result.current.ctx.setQuery('how do I'));
    act(() => result.current.ctx.setQuery('how do I sort'));
    // The first keystroke's call is out; the two after it wait for it, and only the newest follows.
    await waitFor(() => expect(ahead).toEqual(['how do', 'how do I sort']));
    await waitFor(() => expect(result.current.sor.offer).toBe('strong'));
    expect(asked).toEqual(['how do I sort']);
  });

  it('waits at the pause for the call already reading the same text', async () => {
    settings(true);
    const order: string[] = [];
    server.use(http.post(`${SOA}/intent`, async ({ request }) => {
      const { prefetch } = await request.json() as { prefetch?: boolean };
      order.push(prefetch ? 'ahead' : 'pause');
      if (prefetch) await new Promise(r => setTimeout(r, 80));
      if (prefetch) order.push('ahead done');
      return HttpResponse.json({ p: 0.8, answerable: null, offer: 'strong', thresholds: DEFAULT_THRESHOLDS, cached: !prefetch, ms: 1 });
    }));
    const { result } = renderHook(() => useBoth(10), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('how do I sort'));
    await waitFor(() => expect(result.current.sor.offer).toBe('strong'));
    expect(order).toEqual(['ahead', 'ahead done', 'pause']);
  });

  it('keeps the pauses when a call ahead is refused', async () => {
    settings(true);
    server.use(http.post(`${SOA}/intent`, async ({ request }) => {
      const { prefetch } = await request.json() as { prefetch?: boolean };
      if (prefetch) return HttpResponse.json({ code: 'searchOrAskRateLimited' }, { status: 429, headers: { 'Retry-After': '60' } });
      return HttpResponse.json({ p: 0.8, answerable: null, offer: 'strong', thresholds: DEFAULT_THRESHOLDS, cached: false, ms: 1 });
    }));
    const { result } = renderHook(() => useBoth(20), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('how do I sort'));
    await waitFor(() => expect(result.current.sor.offer).toBe('strong'));
  });

  it('asks nothing ahead with prefetch off', async () => {
    settings(true);
    const asked: string[] = [], ahead: string[] = [];
    judge({}, asked, ahead);
    const { result } = renderHook(() => ({ ctx: useSearchContext(), sor: useSearchOrAsk({ pauseMs: 10, prefetch: false }) }), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('how do I sort'));
    await waitFor(() => expect(asked).toEqual(['how do I sort']));
    expect(ahead).toEqual([]);
  });
});

describe('statistics', () => {
  it('names the search and the session with each judgement', async () => {
    settings(true);
    const urls: URL[] = [];
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', () =>
        HttpResponse.json({ records: [], facets: {}, count: 0, isFallback: false }, { headers: { 'Indx-Query-Id': 'q-42' } })),
      http.post(`${SOA}/intent`, async ({ request }) => {
        if (!(await request.clone().json() as { prefetch?: boolean }).prefetch) urls.push(new URL(request.url));
        return HttpResponse.json({ p: 0.8, answerable: null, offer: 'strong', thresholds: DEFAULT_THRESHOLDS, cached: false, ms: 1 });
      }));
    const { result } = renderHook(() => useBoth(), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('how do I add synonyms'));
    await waitFor(() => expect(urls.length).toBe(1));
    expect(urls[0]!.searchParams.get('queryId')).toBe('q-42');
    expect(urls[0]!.searchParams.get('session')).toBe(result.current.ctx.sessionId);
  });

  it('reports an opened source against the ask, with its citation number', async () => {
    const selects: unknown[] = [];
    server.use(
      http.post(`${SOA}/ask`, () => {
        const r = sse([
          ['sources', [{ n: 2, documentKey: 12, title: 'Synonyms' }]],
          ['text', { delta: 'See [2].' }],
          ['done', { model: 'm', latencyMs: 1 }],
        ]);
        r.headers.set('Indx-Ask-Id', 'ask-7');
        return r;
      }),
      http.post('http://localhost/api/teams/team/datasets/test/events/select', async ({ request }) => {
        selects.push(await request.json());
        return new HttpResponse(null, { status: 202 });
      }));
    render(<AskPanel question="how do I add synonyms" onSourceClick={() => {}} />, { wrapper });
    await screen.findByText('Copy');
    fireEvent.click(screen.getByText('Synonyms'));
    await waitFor(() => expect(selects).toEqual([{ queryId: 'ask-7', documentKey: 12, position: 2 }]));
  });
});

describe('catalogue: a description becomes filters while typing', () => {
  it('turns a typed facet value into that filter, and leaves the rest as the text', () => {
    const facets = { 'Kommune.Navn': [{ key: 'Bærum' }, { key: 'Oslo' }, { key: 'Nordre Follo' }], ErPrivatskole: [{ key: 'true' }] };
    expect(localFilters('bærum skoleoversikt?', facets)).toEqual({ filters: [{ field: 'Kommune.Navn', value: 'Bærum' }], text: 'skoleoversikt', sort: null });
    expect(localFilters('skoler i nordre follo', facets)).toEqual({ filters: [{ field: 'Kommune.Navn', value: 'Nordre Follo' }], text: 'skoler i', sort: null });
    expect(localFilters('osloveien 3', facets)).toBeNull();
    expect(localFilters('bærum', null)).toBeNull();
    // A number or a boolean is a condition for the model ("over 500"), never a value to equal.
    const numeric = { ...facets, Elevtall: [{ key: '500' }, { key: '120' }] };
    expect(localFilters('skoler med over 500 elever', numeric)).toBeNull();
    expect(localFilters('privatskoler true', numeric)).toBeNull();
  });

  it('applies the filters on its own while typing when the dataset says so, facets first', async () => {
    server.use(http.get(SOA, () => HttpResponse.json({ settings: { enabled: true, thresholds: DEFAULT_THRESHOLDS, filtersWhileTyping: 'model' }, effective: {}, available: true })));
    const modelAsked: string[] = [];
    server.use(
      http.post(`${SOA}/intent`, () => HttpResponse.json({ p: 0.1, answerable: null, offer: 'none', thresholds: DEFAULT_THRESHOLDS, cached: false, ms: 1, criteria: 0.9, filtersWhileTyping: 'model' })),
      http.post(`${SOA}/filters`, async ({ request }) => {
        const text = (await request.json() as { text: string }).text;
        modelAsked.push(text);
        if (text === 'shoes') return HttpResponse.json({ filters: [], text, ms: 900 });
        return HttpResponse.json({ filters: [{ field: 'price', min: 0, max: 50 }], text: 'cheap', ms: 900 });
      }));
    // Facets on: the local pass reads the facet values the page holds.
    const facetWrapper = ({ children }: { children: React.ReactNode }) => (
      <SearchProvider url="http://localhost" team="team" dataset="test" preAuthenticatedToken="test-token">{children}</SearchProvider>
    );
    const { result } = renderHook(() => { const b = useBoth(); return { ...b, f: useFilterSuggestion({ auto: b.sor }) }; }, { wrapper: facetWrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    // A facet value typed: the filter at once, before any model. The facets come with the first
    // search. The model then reads what the facets left, and here names nothing for it.
    act(() => result.current.ctx.setQuery('trail shoes'));
    await waitFor(() => expect(result.current.ctx.state.filters).toEqual({ category: ['trail'] }), { timeout: 3000 });
    expect(result.current.ctx.state.query).toBe('shoes');
    await waitFor(() => expect(modelAsked).toEqual(['shoes']), { timeout: 3000 });
    expect(result.current.ctx.state.filters).toEqual({ category: ['trail'] });
    // Nothing the facets name: the model, once for the text.
    act(() => result.current.ctx.setQuery('cheap ones'));
    await waitFor(() => expect(result.current.ctx.state.rangeFilters.price!.max).toBe(50), { timeout: 3000 });
    expect(modelAsked).toEqual(['shoes', 'cheap ones']);
    expect(result.current.f.appliedText).toBe('cheap ones');
    // A facet value and more: the facets' filter stays beside the model's, one apply.
    act(() => result.current.ctx.setQuery('cheap trail ones'));
    await waitFor(() => expect(result.current.ctx.state.query).toBe('cheap'), { timeout: 3000 });
    expect(result.current.ctx.state.filters).toEqual({ category: ['trail'] });
    expect(result.current.ctx.state.rangeFilters.price!.max).toBe(50);
    expect(modelAsked).toEqual(['shoes', 'cheap ones', 'cheap ones']);
    // A question that names a facet value is not asking for that filter ("great against dark").
    server.use(http.post(`${SOA}/intent`, () => HttpResponse.json({ p: 0.9, answerable: 0.8, offer: 'strong', thresholds: DEFAULT_THRESHOLDS, cached: false, ms: 1, criteria: 0.1, filtersWhileTyping: 'model' })));
    act(() => result.current.ctx.setQuery('which trail shoe is lightest'));
    await waitFor(() => expect(result.current.sor.p).toBe(0.9), { timeout: 3000 });
    await new Promise(r => setTimeout(r, 700));
    expect(result.current.ctx.state.query).toBe('which trail shoe is lightest');
    expect(result.current.ctx.state.filters).toEqual({});
    expect(modelAsked).toEqual(['shoes', 'cheap ones', 'cheap ones']);
  });
});

describe('catalogue: a description becomes filters', () => {
  it('says the text describes what to list, and applies the filters to the search', async () => {
    settings(true);
    server.use(
      http.post(`${SOA}/intent`, () => HttpResponse.json({ p: 0.1, answerable: null, offer: 'none', thresholds: DEFAULT_THRESHOLDS, cached: false, ms: 1, criteria: 0.9 })),
      http.post(`${SOA}/filters`, () => HttpResponse.json({ filters: [
        { field: 'type1', value: 'electric' }, { field: 'speed', min: 80, max: null },
      ], text: 'cute', ms: 900 })));
    const { result } = renderHook(() => ({ ...useBoth(), f: useFilterSuggestion() }), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('fast electric pokemon'));
    await waitFor(() => expect(result.current.sor.describes).toBe(true));
    expect(result.current.sor.offer).toBe('strong'); // a description is answered too: what it finds

    await act(() => result.current.f.suggest('fast electric pokemon'));
    expect(result.current.f.suggestion!.filters.length).toBe(2);
    act(() => result.current.f.apply(result.current.f.suggestion!));
    await waitFor(() => expect(result.current.ctx.state.filters).toEqual({ type1: ['electric'] }));
    expect(result.current.ctx.state.rangeFilters.speed!.min).toBe(80);
    expect(result.current.ctx.state.query).toBe('cute');

    act(() => result.current.f.apply({ filters: [], text: '', sort: { field: 'speed', descending: true } }));
    expect(result.current.ctx.state.sortBy).toBe('speed');
    expect(result.current.ctx.state.sortAscending).toBe(false);
  });

  it('lets a page hand SearchInput the offer, so each pause is judged once', async () => {
    settings(true);
    const asked = judge({ 'how do I add synonyms': 0.8 });
    function Page() {
      const sor = useSearchOrAsk({ pauseMs: 10 });
      return <SearchInput onAsk={() => {}} searchOrAsk={sor} />;
    }
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
    render(<Page />, { wrapper });
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'how do I add synonyms' } });
    await screen.findByText('Ask', {}, { timeout: 2000 });
    await new Promise(r => setTimeout(r, 400));
    expect(asked).toEqual(['how do I add synonyms']);
  });
});

describe('AskPanel', () => {
  it('streams the answer and lists the sources it cites', async () => {
    server.use(http.post(`${SOA}/ask`, () => sse([
      ['sources', [{ n: 1, documentKey: 11, title: 'Synonyms' }, { n: 2, documentKey: 12, title: 'Boost rules' }]],
      ['text', { delta: 'Add them on the Synonyms tab' }],
      ['text', { delta: ' [1].' }],
      ['done', { model: 'm', latencyMs: 5 }],
    ])));
    const picked: number[] = [];
    render(<AskPanel question="how do I add synonyms" onSourceClick={s => picked.push(s.documentKey)} />, { wrapper });

    await screen.findByText(/Add them on the Synonyms tab/);
    await waitFor(() => expect(screen.getByText('Copy')).toBeTruthy());
    expect(screen.getByText('Synonyms')).toBeTruthy();
    expect(screen.queryByText('Boost rules')).toBeNull(); // not cited
    fireEvent.click(screen.getByText('Synonyms'));
    expect(picked).toEqual([11]);
  });

  it('on a catalogue, sends the list a turn put on the page with the follow-up', async () => {
    const bodies: { question: string; history?: unknown[] }[] = [];
    server.use(http.post(`${SOA}/ask`, async ({ request }) => {
      bodies.push(await request.json() as { question: string });
      return sse([
        ...(bodies.length === 1 ? [['filters', { filters: [{ field: 'Kommune.Navn', value: 'Bærum' }], text: '', sort: null, found: 45, more: false }] as [string, unknown]] : []),
        ['sources', [{ n: 1, documentKey: 11, title: 'Levre skole' }]],
        ['text', { delta: bodies.length === 1 ? '45 schools in Bærum.' : 'Levre is the largest.' }],
        ['done', { model: 'm', latencyMs: 1 }],
      ]);
    }));
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
    render(<AskPanel question="skoler i bærum" followUps />, { wrapper });
    await screen.findByText(/45 schools in Bærum/);
    const field = screen.getByLabelText('Ask a follow-up');
    fireEvent.change(field, { target: { value: 'hvilken er den største?' } });
    fireEvent.keyDown(field, { key: 'Enter' });
    await screen.findByText(/Levre is the largest/);
    expect(bodies[1]!.history).toEqual([{ question: 'skoler i bærum', answer: '45 schools in Bærum.',
      shown: { filters: [{ field: 'Kommune.Navn', value: 'Bærum' }], text: '', sort: null } }]);
  });

  it('asks a follow-up with the conversation, and keeps the first turn on screen', async () => {
    const bodies: { question: string; history?: { question: string; answer: string }[] }[] = [];
    server.use(http.post(`${SOA}/ask`, async ({ request }) => {
      const body = await request.json() as { question: string };
      bodies.push(body);
      return sse([
        ['sources', [{ n: 1, documentKey: 11, title: 'Synonyms' }]],
        ['text', { delta: bodies.length === 1 ? 'On the Synonyms tab [1].' : 'Over HTTP, PUT them [1].' }],
        ['done', { model: 'm', latencyMs: 1 }],
      ]);
    }));
    globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
    render(<AskPanel question="how do I add synonyms" followUps />, { wrapper });
    await screen.findByText(/On the Synonyms tab/);

    const field = screen.getByLabelText('Ask a follow-up');
    fireEvent.change(field, { target: { value: 'and over http?' } });
    fireEvent.keyDown(field, { key: 'Enter' });

    await screen.findByText(/Over HTTP, PUT them/);
    expect(screen.getByText(/On the Synonyms tab/)).toBeTruthy();
    expect(bodies[1]).toEqual({ question: 'and over http?', history: [{ question: 'how do I add synonyms', answer: 'On the Synonyms tab [1].' }] });
  });

  it('on a catalogue, shows what a description was searched with and hands the filters to the page', async () => {
    server.use(http.post(`${SOA}/ask`, () => sse([
      ['filters', { filters: [{ field: 'ErPrivatskole', value: 'true' }, { field: 'Kommune.Navn', value: 'Trondheim - Tråante' }, { field: 'Elevtall', min: 300, max: null }], text: '', found: 9, more: false }],
      ['sources', [{ n: 1, documentKey: 11, title: 'Thora Storm' }]],
      ['text', { delta: '9 private schools in Trondheim [1].' }],
      ['done', { model: 'm', latencyMs: 1 }],
    ])));
    const got: unknown[] = [];
    render(<AskPanel question="private skoler i trondheim" onFilters={f => got.push(f)} />, { wrapper });
    await screen.findByText(/9 private schools/);
    expect(screen.getByText('9 found')).toBeTruthy();
    expect(screen.getByText('ErPrivatskole')).toBeTruthy();
    expect(screen.getByText('Trondheim - Tråante')).toBeTruthy();
    expect(screen.getByText('Elevtall ≥ 300')).toBeTruthy();
    expect(got.length).toBe(1);
  });

  it('says when the records hold nothing to answer from', async () => {
    server.use(http.post(`${SOA}/ask`, () => sse([
      ['error', { code: 'nothingFound', message: 'The search found nothing to answer from.' }],
    ])));
    render(<AskPanel question="what is the meaning of life" />, { wrapper });
    await screen.findByText('Nothing to answer from');
    expect(screen.queryByText('Try again')).toBeNull();
  });

  it('shows the limit with the wait, not an error', async () => {
    server.use(http.post(`${SOA}/ask`, () =>
      HttpResponse.json({ code: 'rateLimited', retryAfterSeconds: 300 }, { status: 429, headers: { 'Retry-After': '300' } })));
    render(<AskPanel question="how do I add synonyms" />, { wrapper });
    await screen.findByText('Too many questions for now');
    expect(screen.getByText(/5 minutes/)).toBeTruthy();
  });
});

describe('modes', () => {
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

  function Page() {
    const [asked, setAsked] = useState<string[]>([]);
    return (
      <>
        <SearchInput onAsk={(t, how) => setAsked(a => [...a, `${how?.proactive ? 'proactive:' : ''}${t}`])} />
        <div data-testid="asked">{asked.join('|')}</div>
      </>
    );
  }

  it('strict shows no quiet offer: only the full one', async () => {
    settings(true, true, 'strict');
    judge({ 'how do I add synonyms': 0.5, 'how do I add synonyms now': 0.8 });
    const { result } = renderHook(() => useBoth(), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('how do I add synonyms'));
    await waitFor(() => expect(result.current.sor.p).toBe(0.5));
    expect(result.current.sor.offer).toBe('none');
    act(() => result.current.ctx.setQuery('how do I add synonyms now'));
    await waitFor(() => expect(result.current.sor.offer).toBe('strong'));
  });

  it('a page chooses its own mode, and proactive only where the dataset is proactive', async () => {
    settings(true, true, 'open');
    judge({ 'how do I add synonyms': 0.5 });
    const { result } = renderHook(() => ({ ctx: useSearchContext(), sor: useSearchOrAsk({ pauseMs: 10, mode: 'strict' }) }), { wrapper });
    await waitFor(() => expect(result.current.sor.available).toBe(true));
    act(() => result.current.ctx.setQuery('how do I add synonyms'));
    await waitFor(() => expect(result.current.sor.p).toBe(0.5));
    expect(result.current.sor).toMatchObject({ mode: 'strict', offer: 'none', askAnytime: false });

    settings(true, true, 'soft');
    const open = renderHook(() => useSearchOrAsk({ pauseMs: 10, mode: 'open' }), { wrapper });
    await waitFor(() => expect(open.result.current.available).toBe(true));
    expect(open.result.current).toMatchObject({ mode: 'open', askAnytime: true });
    const forward = renderHook(() => useSearchOrAsk({ pauseMs: 10, mode: 'proactive' }), { wrapper });
    await waitFor(() => expect(forward.result.current.available).toBe(true));
    expect(forward.result.current.mode).toBe('inviting');
  });

  it('open lets Enter ask whatever the judge says, with an Ask button there', async () => {
    settings(true, true, 'open');
    judge({ synonyms: 0.05 });
    render(<Page />, { wrapper });
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'synonyms' } });
    await screen.findByText('Ask');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('asked').textContent).toBe('synonyms');
  });

  it('proactive invites as soon as the judge reads a question starting, and answers on its own once sure', async () => {
    settings(true, true, 'proactive');
    // "How" at the hint score: a question starting, as Jev reads it (0.39 on the pokédex).
    judge({ How: 0.39, 'how do I add synonyms': 0.8 });
    render(<Page />, { wrapper });
    const input = await screen.findByRole('textbox');
    // Wait for the settings, then the first word alone: the hint, from the judge's low score.
    await new Promise(r => setTimeout(r, 50));
    fireEvent.change(input, { target: { value: 'How' } });
    await screen.findByText('For a quick answer, type a bit more');
    fireEvent.change(input, { target: { value: 'how do I add synonyms' } });
    // After a second of stillness, not on the pause.
    await waitFor(() => expect(screen.getByTestId('asked').textContent).toBe('proactive:how do I add synonyms'), { timeout: 3000 });
    // Once per text: the next pause on the same text asks nothing more.
    await new Promise(r => setTimeout(r, 400));
    expect(screen.getByTestId('asked').textContent).toBe('proactive:how do I add synonyms');
  });

  it('proactive answers no question the judge reads as unfinished', async () => {
    settings(true, true, 'proactive');
    judge({ 'what type is': 0.9 }, [], [], 0, ['what type is']);
    render(<Page />, { wrapper });
    const input = await screen.findByRole('textbox');
    await new Promise(r => setTimeout(r, 50));
    fireEvent.change(input, { target: { value: 'what type is' } });
    // Sure, but still being typed: the hint to type on, not an answer.
    await new Promise(r => setTimeout(r, 1500));
    expect(screen.getByText('For a quick answer, type a bit more')).toBeTruthy();
    expect(screen.getByTestId('asked').textContent).toBe('');
  });

  it('a lookup gets no hint in inviting: the judge scores it below the hint', async () => {
    settings(true, true, 'inviting');
    judge({ pikachu: 0.13 });
    render(<Page />, { wrapper });
    const input = await screen.findByRole('textbox');
    await new Promise(r => setTimeout(r, 50));
    fireEvent.change(input, { target: { value: 'pikachu' } });
    await screen.findByText('Ask');
    await new Promise(r => setTimeout(r, 400));
    expect(screen.queryByText('For a quick answer, type a bit more')).toBeNull();
  });

  it('proactive never offers the full Ask button: it thinks, then answers', async () => {
    settings(true, true, 'proactive');
    judge({ 'how do I add synonyms': 0.9 });
    render(<Page />, { wrapper });
    const input = await screen.findByRole('textbox');
    await new Promise(r => setTimeout(r, 50));
    fireEvent.change(input, { target: { value: 'how do I add synonyms' } });
    await screen.findByText('Thinking');
    expect(screen.queryByText('Enter ↵')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('asked').textContent).toBe('proactive:how do I add synonyms'), { timeout: 3000 });
    // Started: the chip has nothing more to say.
    await waitFor(() => expect(screen.queryByText('Thinking')).toBeNull());
  });

  it('QuickAnswer draws each state, and asks on a click', () => {
    const asked: string[] = [];
    const base = { available: true, text: 'how do I add synonyms', stands: true } as const;
    const draw = (quick: 'hint' | 'ready' | 'thinking' | 'invite' | 'none') =>
      render(<QuickAnswer searchOrAsk={{ ...base, quick } as never} onAsk={t => asked.push(t)} />);
    const hint = draw('hint');
    fireEvent.click(screen.getByText('For a quick answer, type a bit more'));
    hint.unmount();
    const ready = draw('ready');
    expect(screen.getByText('how do I add synonyms')).toBeTruthy();
    fireEvent.click(screen.getByText('Ask the assistant'));
    ready.unmount();
    const thinking = draw('thinking');
    expect(screen.getByText('Thinking')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
    thinking.unmount();
    expect(draw('none').container.textContent).toBe('');
    expect(asked).toEqual(['how do I add synonyms', 'how do I add synonyms']);
  });

  it('inviting sweeps from the hint score, and answers only when asked', async () => {
    settings(true, true, 'inviting');
    judge({ How: 0.39, 'how do I add synonyms': 0.9 });
    render(<Page />, { wrapper });
    const input = await screen.findByRole('textbox');
    await new Promise(r => setTimeout(r, 50));
    fireEvent.change(input, { target: { value: 'How' } });
    await screen.findByText('For a quick answer, type a bit more');
    fireEvent.change(input, { target: { value: 'how do I add synonyms' } });
    await screen.findByText('Ask');
    await new Promise(r => setTimeout(r, 1500));
    expect(screen.getByTestId('asked').textContent).toBe('');
  });

  it('proactive past its day answers nothing on its own: the judgement says inviting', async () => {
    settings(true, true, 'proactive');
    server.use(http.post(`${SOA}/intent`, () =>
      HttpResponse.json({ p: 0.8, answerable: null, offer: 'strong', thresholds: DEFAULT_THRESHOLDS, cached: false, ms: 1, mode: 'inviting', finished: 0.9 })));
    render(<Page />, { wrapper });
    const input = await screen.findByRole('textbox');
    await new Promise(r => setTimeout(r, 50));
    fireEvent.change(input, { target: { value: 'how do I add synonyms' } });
    await screen.findByText('Ask');
    await new Promise(r => setTimeout(r, 400));
    expect(screen.getByTestId('asked').textContent).toBe('');
  });

  it('AskPanel says when the page started the answer on its own', async () => {
    const bodies: { proactive?: boolean }[] = [];
    server.use(http.post(`${SOA}/ask`, async ({ request }) => {
      bodies.push(await request.json() as { proactive?: boolean });
      return sse([['text', { delta: 'Yes.' }], ['done', { model: 'm', latencyMs: 1 }]]);
    }));
    render(<AskPanel question="how do I add synonyms" proactive />, { wrapper });
    await screen.findByText(/Yes\./);
    expect(bodies[0]).toEqual({ question: 'how do I add synonyms', proactive: true });
  });
});

describe('SearchInput onAsk', () => {
  // SearchField measures its chip row; jsdom has no ResizeObserver.
  globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;

  function Page() {
    const [question, setQuestion] = useState<string | null>(null);
    return (
      <>
        <SearchInput onAsk={setQuestion} />
        <div data-testid="asked">{question}</div>
      </>
    );
  }

  it('offers to ask, and a strong offer makes Enter ask', async () => {
    settings(true);
    judge({ 'how do I add synonyms': 0.8 });
    render(<Page />, { wrapper });
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'how do I add synonyms' } });
    await screen.findByText('Ask', {}, { timeout: 2000 });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('asked').textContent).toBe('how do I add synonyms');
  });

  it('says Search or ask while asking is on, unless the page set its own placeholder', async () => {
    settings(true);
    judge({});
    render(<><SearchInput onAsk={() => {}} /><SearchInput onAsk={() => {}} placeholder="Find a Pokémon" /></>, { wrapper });
    await waitFor(() => expect(screen.getAllByPlaceholderText('Search or ask').length).toBe(1));
    expect(screen.getByPlaceholderText('Find a Pokémon')).toBeTruthy();
  });

  it('keeps the usual placeholder when asking is off for the dataset', async () => {
    settings(false);
    render(<SearchInput onAsk={() => {}} />, { wrapper });
    await new Promise(r => setTimeout(r, 100));
    expect(screen.getByPlaceholderText('Type to search')).toBeTruthy();
  });

  it('shows no offer without onAsk, and reads no settings', async () => {
    let read = 0;
    server.use(http.get(SOA, () => { read++; return HttpResponse.json({}); }));
    render(<SearchInput />, { wrapper });
    const input = await screen.findByRole('textbox');
    fireEvent.change(input, { target: { value: 'how do I add synonyms' } });
    await new Promise(r => setTimeout(r, 400));
    expect(read).toBe(0);
    expect(screen.queryByText('Ask')).toBeNull();
  });
});
