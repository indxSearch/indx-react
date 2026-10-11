import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, renderHook, screen, act, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { SearchProvider, useSearchContext } from '../context/SearchContext';
import { useSearchOrAsk } from '../hooks/useSearchOrAsk';
import { AskPanel } from '../components/AskPanel';
import { SearchInput } from '../components/SearchInput';
import { nextOffer, triggers, DEFAULT_THRESHOLDS } from '../utils/searchOrAsk';
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

function settings(enabled: boolean, available = true) {
  server.use(http.get(SOA, () => HttpResponse.json({
    settings: { enabled, thresholds: DEFAULT_THRESHOLDS },
    effective: {},
    available,
  })));
}

/** The judge answers from a table of text → p, and records what it was asked. */
function judge(scores: Record<string, number>, asked: string[] = []) {
  server.use(http.post(`${SOA}/intent`, async ({ request }) => {
    const { text } = await request.json() as { text: string };
    asked.push(text);
    const p = scores[text] ?? 0;
    return HttpResponse.json({ p, answerable: null, offer: 'none', thresholds: DEFAULT_THRESHOLDS, cached: false, ms: 1 });
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
    server.use(http.post(`${SOA}/intent`, () => {
      calls++;
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

describe('statistics', () => {
  it('names the search and the session with each judgement', async () => {
    settings(true);
    const urls: URL[] = [];
    server.use(
      http.post('http://localhost/api/teams/team/datasets/test/search', () =>
        HttpResponse.json({ records: [], facets: {}, truncationIndex: -1 }, { headers: { 'Indx-Query-Id': 'q-42' } })),
      http.post(`${SOA}/intent`, ({ request }) => {
        urls.push(new URL(request.url));
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
