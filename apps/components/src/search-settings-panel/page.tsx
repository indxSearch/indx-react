import { SearchSettingsPanel } from '@indxsearch/intrface';
import { MockSearchProvider } from '../mock/MockSearchProvider';
import styles from '../search-input/page.module.css';

/**
 * SearchSettingsPanel: a developer's panel for trying coverage settings on a page. The mock server
 * answers query-parameters as a dataset would, so values the page leaves alone show as the
 * dataset's; change one and it becomes the page's own.
 */

const json = (body: unknown) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });

const datasetValues = async (url: string) =>
  url.endsWith('/query-parameters')
    ? json({ effective: { coverageDepth: 1000, coverageSetup: { coverFuzzyWords: true, truncate: true, minWordSize: 3 } } })
    : new Response(null, { status: 404 });

export default function SearchSettingsPanelPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SearchSettingsPanel</h1>
        <p className={styles.desc}>
          A panel for whoever builds a search page: the coverage settings this page sends with every search. A
          value the page has not set shows what the dataset uses (its Query parameters tab, read through{' '}
          <code>query-parameters</code>), marked "(dataset)"; set one and it is the page's own. It takes no props:
          everything comes from the search context. Not meant for visitors.
        </p>
      </div>
      <div className={styles.grid}>
        <div className={styles.stateLabel}>
          <div className={styles.stateTitle}>Nothing set by the page</div>
          <div className={styles.stateWhen}>Every value is the dataset's (coverage depth 1,000, words of 3 or more). Change one to make it the page's.</div>
        </div>
        <div className={styles.cell}>
          <MockSearchProvider pageSetsNothing authenticatedFetch={datasetValues}><SearchSettingsPanel /></MockSearchProvider>
        </div>
        <div className={styles.stateLabel}>
          <div className={styles.stateTitle}>No dataset values</div>
          <div className={styles.stateWhen}>An older server, or a key that may not read query parameters: the engine defaults show.</div>
        </div>
        <div className={styles.cell}>
          <MockSearchProvider pageSetsNothing><SearchSettingsPanel /></MockSearchProvider>
        </div>
      </div>
    </main>
  );
}
