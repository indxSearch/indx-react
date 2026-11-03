import type { ReactNode } from 'react';
import { SearchResultsMessage, IndxApiError, SearchSetupError, describeSearchError } from '@indxsearch/intrface';
import { PropsTable } from '../PropsTable';
import styles from '../search-input/page.module.css';

/**
 * SearchResultsMessage: what SearchResults shows in place of the list when a search fails. Every
 * kind of failure, classified by intrface's own describeSearchError from the error intrface meets.
 */

const where = { team: 'mock', dataset: 'pokemon' };
const api = (status: number, problem?: Record<string, unknown>, retryAfter?: number) =>
  describeSearchError(new IndxApiError('Search', status, problem as never, retryAfter), where);

const rows: { title: string; when: ReactNode; error: ReturnType<typeof api>; retry?: boolean; hideTechnical?: boolean }[] = [
  { title: 'Unreachable', when: <>No answer: the server is down, the url is wrong, or the network is gone.</>,
    error: describeSearchError(new TypeError('Failed to fetch'), where), retry: true },
  { title: 'Key rejected', when: <>401: the key is invalid or has expired.</>, error: api(401) },
  { title: 'No access', when: <>403: the key does not reach this dataset.</>, error: api(403, { code: 'forbidden' }) },
  { title: 'Not found', when: <>404: no such team or dataset (or a key bound to other datasets).</>, error: api(404, { code: 'datasetNotFound' }) },
  { title: 'Getting ready', when: <>409 with <code>retryable</code>: loading or indexing. Retries by itself after Retry-After.</>,
    error: api(409, { code: 'invalidState', retryable: true }, 2), retry: true },
  { title: 'Unavailable', when: <>409 otherwise: a state search cannot use.</>, error: api(409, { code: 'invalidState' }) },
  { title: 'Too many searches', when: <>429: rate limited. Try again shows.</>, error: api(429, { code: 'rateLimited' }, 30), retry: true },
  { title: 'Server error', when: <>5xx.</>, error: api(500), retry: true },
  { title: 'Not set up', when: <>SearchProvider is missing its url, team, dataset or token.</>,
    error: describeSearchError(new SearchSetupError('A bearer token is required.'), where) },
  { title: 'Technical line hidden', when: <><code>hideTechnical</code>: for a page whose visitors should not see it.</>,
    error: api(500), retry: true, hideTechnical: true },
];

export default function SearchResultsMessagePage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SearchResultsMessage</h1>
        <p className={styles.desc}>
          What SearchResults shows in place of the list when a search fails: an icon, a line for the visitor,
          the technical reason for whoever built the page, and Try again where retrying can help. It takes the
          failure as <code>error</code>, a <code>SearchErrorInfo</code> from <code>describeSearchError</code>, which
          the search context already carries as <code>state.errorInfo</code> and <code>authErrorInfo</code>.
        </p>
        <PropsTable rows={[
          { name: 'error', type: 'SearchErrorInfo', description: 'Required. The failure, classified: kind, message, technical line, whether a retry can help.' },
          { name: 'onRetry', type: '() => void', description: 'Tries again. Shown as a button where that can help; a dataset getting ready is retried by itself.' },
          { name: 'hideTechnical', type: 'boolean', default: 'false', description: 'Hides the technical line.' },
        ]} />
      </div>
      <div className={styles.grid}>
        {rows.map(r => (
          <div key={r.title} style={{ display: 'contents' }}>
            <div className={styles.stateLabel}>
              <div className={styles.stateTitle}>{r.title}</div>
              <div className={styles.stateWhen}>{r.when}</div>
            </div>
            <div className={styles.cell}>
              <SearchResultsMessage error={r.error} onRetry={r.retry ? () => {} : undefined} hideTechnical={r.hideTechnical} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
