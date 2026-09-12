import type { IndxProblem, IndxProblemCode } from '@indxsearch/indx-types';

/**
 * A failed Indx request, carrying the server's RFC 9457 problem document so a caller
 * can act on the machine-readable `code` rather than the HTTP status:
 *
 * - `unknownFilter` — the filter token could not be honoured; re-create the filter and retry.
 *   The text search path never holds a stale token (it rebuilds the filter on every search),
 *   so this reaches consumers only through `useVectorSearch` / `useHybridSearch`, whose
 *   `filter` option is the caller's own token.
 * - `invalidState` with `retryable` — the dataset is loading or indexing; the same request
 *   succeeds once the build completes (`retryAfterSeconds` from the `Retry-After` header).
 * - `shadowBusy` — a field-configuration or replace build is in progress.
 *
 * `message` keeps the previous "<label> failed: HTTP <status>" form, with the server's detail
 * appended when the body carried one, so existing string matching keeps working.
 */
export class IndxApiError extends Error {
  readonly status: number;
  readonly code: IndxProblemCode | (string & {}) | undefined;
  readonly problem: IndxProblem | undefined;
  readonly retryAfterSeconds: number | undefined;

  constructor(label: string, status: number, problem?: IndxProblem, retryAfterSeconds?: number) {
    const detail = problem?.detail ?? problem?.title;
    super(`${label} failed: HTTP ${status}${detail ? ` — ${detail}` : ''}`);
    this.name = 'IndxApiError';
    this.status = status;
    this.code = problem?.code;
    this.problem = problem;
    this.retryAfterSeconds = retryAfterSeconds;
  }

  /** True for `invalidState` while the dataset loads or indexes: retry after `retryAfterSeconds`. */
  get retryable(): boolean {
    return this.code === 'invalidState' && this.problem?.retryable === true;
  }

  /** Builds the error from a non-2xx response, reading the problem body when there is one. */
  static async fromResponse(label: string, response: Response): Promise<IndxApiError> {
    let problem: IndxProblem | undefined;
    try {
      const body = await response.json();
      if (body && typeof body === 'object' && typeof body.code === 'string') problem = body as IndxProblem;
      else if (body && typeof body === 'object') problem = { ...body, code: '' } as IndxProblem;
    } catch {
      // body not JSON (401 from the JWT middleware has none) — status alone is the message
    }
    const header = response.headers?.get?.('Retry-After');
    const retryAfter = header != null && /^\d+$/.test(header) ? Number(header) : undefined;
    return new IndxApiError(label, response.status, problem, retryAfter);
  }
}
