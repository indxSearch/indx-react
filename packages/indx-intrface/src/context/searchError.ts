import { IndxApiError } from './IndxApiError';

/**
 * What kind of failure stopped the search, so a component can show it to the visitor rather than
 * print the error's text:
 *
 * - `unreachable` — no answer at all: the server is down, the URL is wrong, or the network is gone
 * - `unauthorized` — 401, the key is invalid or has expired
 * - `forbidden` — 403, the key does not reach this dataset
 * - `notFound` — 404, no such team or dataset
 * - `notReady` — 409 `invalidState` with `retryable`: loading or indexing, the same request succeeds soon
 * - `unavailable` — 409 otherwise: the dataset is in a state search cannot use (Error, or a build in progress)
 * - `rateLimited` — 429, too many requests for this key
 * - `server` — 5xx
 * - `setup` — SearchProvider was not given what it needs (url, team, dataset, token)
 * - `unknown` — anything else
 */
export type SearchErrorKind =
  | 'unreachable'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'notReady'
  | 'unavailable'
  | 'rateLimited'
  | 'server'
  | 'setup'
  | 'unknown';

export interface SearchErrorInfo {
  kind: SearchErrorKind;
  /** The error's own message, as `authError` and `state.error` carry it. */
  message: string;
  /** For whoever built the page: the status, the server's code and what to do. */
  technical: string;
  status?: number;
  code?: string;
  /** Seconds the server asked to wait (`Retry-After`), for `notReady` and `rateLimited`. */
  retryAfterSeconds?: number;
  /** Whether trying the same request again can succeed. */
  retryable: boolean;
}

/** Thrown for a missing SearchProvider prop, so it is told apart from a failed request. */
export class SearchSetupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchSetupError';
  }
}

export function describeSearchError(err: unknown, where: { team: string; dataset: string }): SearchErrorInfo {
  const message = err instanceof Error ? err.message : String(err);

  if (err instanceof SearchSetupError) {
    return { kind: 'setup', message, technical: message, retryable: false };
  }

  // fetch rejects with a TypeError when no response came back, worded differently per browser
  // ("Failed to fetch", "Load failed", "NetworkError when attempting to fetch resource").
  if (err instanceof TypeError) {
    return {
      kind: 'unreachable',
      message,
      technical: 'Network error: no response from the server. Check that it is running and that the url is right.',
      retryable: true,
    };
  }

  if (err instanceof IndxApiError) {
    const base = { message, status: err.status, code: err.code, retryAfterSeconds: err.retryAfterSeconds };
    const detail = err.problem?.detail ?? err.problem?.title;
    const withCode = (text: string) => `${err.status}${err.code ? ` ${err.code}` : ''}: ${text}`;
    switch (true) {
      case err.status === 401:
        return { ...base, kind: 'unauthorized', retryable: false,
          technical: withCode('the key is invalid or has expired. Create a new one in the web console.') };
      case err.status === 403:
        return { ...base, kind: 'forbidden', retryable: false,
          technical: withCode(`the key does not reach dataset "${where.dataset}" in team "${where.team}".`) };
      case err.status === 404:
        return { ...base, kind: 'notFound', retryable: false,
          technical: withCode(detail ?? `no dataset "${where.dataset}" in team "${where.team}".`) };
      case err.retryable:
        return { ...base, kind: 'notReady', retryable: true,
          technical: withCode(`the dataset is ${err.problem?.currentState?.toString().toLowerCase() ?? 'not ready'}.`) };
      case err.status === 409:
        return { ...base, kind: 'unavailable', retryable: false, technical: withCode(detail ?? 'the dataset cannot be searched now.') };
      case err.status === 429:
        return { ...base, kind: 'rateLimited', retryable: true, technical: withCode(detail ?? 'too many requests for this key.') };
      case err.status >= 500:
        return { ...base, kind: 'server', retryable: true, technical: withCode(detail ?? 'the server ran into a problem.') };
      default:
        return { ...base, kind: 'unknown', retryable: true, technical: withCode(detail ?? 'the request failed.') };
    }
  }

  return { kind: 'unknown', message, technical: message, retryable: true };
}
