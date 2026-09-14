/**
 * Machine-readable error code carried by every Indx error response, as the `code`
 * extension of an RFC 9457 problem document. Switch on this, not on the HTTP status: a 400 can
 * be any of five things, and the recovery differs.
 *
 * - `unknownFilter` (400): a filter token the server cannot honour (mistyped, truncated, or
 *   from another dataset). Recovery is mechanical — re-create the filter and retry with the new
 *   token; nothing about the request's shape needs fixing. Never silently widened to an
 *   unfiltered search.
 * - `invalidState` (409): the dataset is not in a state that allows the operation. Carries
 *   `currentState`, `allowedStates` and `retryable`; when retryable (Loading / Indexing) the
 *   response also has a `Retry-After` header.
 * - `shadowBusy` (409): a field-configuration or replace build is in progress; try again later.
 * - `rateLimited` (429): too many attempts from this address on an anonymous auth endpoint
 *   (login, register, password reset). Carries `retryAfterSeconds` and a `Retry-After` header.
 */
export type IndxProblemCode =
  | 'invalidArgument'
  | 'invalidDatasetName'
  | 'loadFailed'
  | 'operationFailed'
  | 'unknownFilter'
  | 'invalidCredentials'
  | 'emailNotConfirmed'
  | 'insufficientRole'
  | 'datasetNotFound'
  | 'documentNotFound'
  | 'teamNotFound'
  | 'invalidState'
  | 'shadowBusy'
  | 'rateLimited';

/**
 * An Indx error response body (`application/problem+json`, RFC 9457) with the `code`
 * extension every endpoint adds. 401 from the JWT middleware comes without a body.
 */
export interface IndxProblem {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  /** Machine-readable code; see {@link IndxProblemCode}. */
  code: IndxProblemCode | (string & {});
  /** `invalidState` only: the operation that was refused. */
  operation?: string;
  /** `invalidState` only: the dataset's state at the time. */
  currentState?: string;
  /** `invalidState` only: states in which the operation is allowed. */
  allowedStates?: string[];
  /** `invalidState` only: true while Loading / Indexing — the same request will succeed once
   * the build completes (see the `Retry-After` header). */
  retryable?: boolean;
  /** `invalidState` in the Error state: the engine's error message. */
  errorMessage?: string;
  /** `rateLimited` only: seconds until the window opens again (also the `Retry-After` header). */
  retryAfterSeconds?: number;
  /** Registration / password endpoints: per-field validation messages. */
  errors?: string[];
}
