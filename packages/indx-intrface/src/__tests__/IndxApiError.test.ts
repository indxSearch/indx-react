import { describe, it, expect } from 'vitest';
import { IndxApiError } from '../context/IndxApiError';

const problem = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/problem+json', ...headers } });

describe('IndxApiError', () => {
  it('carries the server code and detail from a problem body', async () => {
    const err = await IndxApiError.fromResponse('Search',
      problem({ title: 'Unknown filter', status: 400, detail: 'The filter token could not be resolved.', code: 'unknownFilter' }, 400));
    expect(err).toBeInstanceOf(IndxApiError);
    expect(err.status).toBe(400);
    expect(err.code).toBe('unknownFilter');
    expect(err.retryable).toBe(false);
    expect(err.message).toBe('Search failed: HTTP 400 — The filter token could not be resolved.');
  });

  it('exposes invalidState extras and Retry-After as retryable', async () => {
    const err = await IndxApiError.fromResponse('Search',
      problem({ code: 'invalidState', currentState: 'Indexing', allowedStates: ['Ready'], retryable: true, detail: 'busy' }, 409, { 'Retry-After': '2' }));
    expect(err.code).toBe('invalidState');
    expect(err.retryable).toBe(true);
    expect(err.retryAfterSeconds).toBe(2);
    expect(err.problem?.currentState).toBe('Indexing');
    expect(err.problem?.allowedStates).toEqual(['Ready']);
  });

  it('keeps the plain "<label> failed: HTTP <status>" message when there is no body', async () => {
    const err = await IndxApiError.fromResponse('VectorSearch', new Response(null, { status: 401 }));
    expect(err.message).toBe('VectorSearch failed: HTTP 401');
    expect(err.code).toBeUndefined();
    expect(err.retryable).toBe(false);
  });
});
