import type { ReactNode } from 'react';
import { SearchResults, IndxApiError, SearchSetupError, describeSearchError } from '@indxsearch/intrface';
import { MockSearchProvider, type MockSearchProviderProps } from '../mock/MockSearchProvider';
import styles from './page.module.css';

const where = { team: 'mock', dataset: 'pokemon' };

// Each failure built the way intrface meets it, and classified by intrface's own describeSearchError.
const api = (status: number, problem?: Record<string, unknown>, retryAfter?: number) =>
  describeSearchError(new IndxApiError('Search', status, problem as never, retryAfter), where);

type Row = {
  title: string;
  when: ReactNode;
  mock: Omit<MockSearchProviderProps, 'children'>;
};

const rows: Row[] = [
  {
    title: 'Loading',
    when: <>The first request is still out: fields and facets are being read.</>,
    mock: { isFetchingInitial: true },
  },
  {
    title: 'Idle',
    when: <>No search yet, or results held back because empty searches are off.</>,
    mock: { resultsSuppressed: true },
  },
  {
    title: 'No results',
    when: <>A query that returned nothing. Nothing is shown: SearchInput's No results chip says it.</>,
    mock: { initialQuery: 'xyzzy', resultCount: 0 },
  },
  {
    title: 'Server unreachable',
    when: <>No answer at all: the server is down, the url is wrong, or the network is gone.</>,
    mock: { authErrorInfo: describeSearchError(new TypeError('Failed to fetch'), where) },
  },
  {
    title: 'Key rejected (401)',
    when: <>The token is invalid or has expired. The visitor cannot fix it, so there is no button.</>,
    mock: { authErrorInfo: api(401) },
  },
  {
    title: 'No access (403)',
    when: <>The key is valid but does not reach this dataset.</>,
    mock: { authErrorInfo: api(403, { code: 'insufficientRole' }) },
  },
  {
    title: 'Dataset not found (404)',
    when: <>The team or dataset name is wrong.</>,
    mock: { authErrorInfo: api(404, { code: 'datasetNotFound' }) },
  },
  {
    title: 'Getting ready (409, retryable)',
    when: <>Loading or indexing. Retried by itself after the server's Retry-After.</>,
    mock: { initialQuery: 'pika', errorInfo: api(409, { code: 'invalidState', retryable: true, currentState: 'Indexing' }, 2) },
  },
  {
    title: 'Unavailable (409)',
    when: <>A state search cannot use, such as Error.</>,
    mock: { initialQuery: 'pika', errorInfo: api(409, { code: 'invalidState', retryable: false, currentState: 'Error', detail: 'Search requires the dataset to be Ready; it is currently Error.' }) },
  },
  {
    title: 'Too many searches (429)',
    when: <>The key went over its requests-per-second budget.</>,
    mock: { initialQuery: 'pika', errorInfo: api(429, { code: 'rateLimited' }, 1) },
  },
  {
    title: 'Server error (5xx)',
    when: <>The server answered with an error of its own.</>,
    mock: { initialQuery: 'pika', errorInfo: api(500) },
  },
  {
    title: 'Not set up',
    when: <>SearchProvider was not given a token, url or dataset.</>,
    mock: { authErrorInfo: describeSearchError(new SearchSetupError('A bearer token is required. Check console for instructions.'), where) },
  },
];

export default function SearchResultsStatesPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SearchResults states</h1>
        <p className={styles.desc}>
          What SearchResults shows instead of a list. A failure gets an icon, a line for the visitor, the technical
          reason for whoever built the page, and Try again where that can help. The visitor cannot fix a key or a
          dataset name, so those have no button. Try again does nothing here: the page has no server.
        </p>
      </div>

      <div className={styles.grid}>
        {rows.map((r) => (
          <MockSearchProvider key={r.title} {...r.mock}>
            <div className={styles.label}>
              <div className={styles.labelTitle}>{r.title}</div>
              <div className={styles.labelWhen}>{r.when}</div>
            </div>
            <div className={styles.cell}>
              <SearchResults fields={['name']} resultsPerPage={3}>{(item) => <div>{String(item.name ?? '')}</div>}</SearchResults>
            </div>
          </MockSearchProvider>
        ))}
      </div>
    </main>
  );
}
