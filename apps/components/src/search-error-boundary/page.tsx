import { useState } from 'react';
import { SearchErrorBoundary } from '@indxsearch/intrface';
import { Button } from '@indxsearch/systm';
import { PropsTable } from '../PropsTable';
import styles from '../search-input/page.module.css';

/**
 * SearchErrorBoundary: catches what throws while the search components render (a render prop that
 * throws, a misconfigured component). Failed requests never reach it: SearchResults shows those.
 */

function Breaks() {
  const [broken, setBroken] = useState(false);
  if (broken) throw new Error('A render prop threw: cannot read properties of undefined (reading "title")');
  return <Button variant="secondary" size="micro" onClick={() => setBroken(true)}>Throw while rendering</Button>;
}

export default function SearchErrorBoundaryPage() {
  const [key, setKey] = useState(0);
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SearchErrorBoundary</h1>
        <p className={styles.desc}>
          Wraps a search page and catches errors thrown while it renders, so one broken result template does not
          blank the whole page. It does not see failed requests: a bad token, an unknown dataset or a server that
          is down are shown by SearchResults (see SearchResultsMessage). Press the button to throw.
        </p>
        <PropsTable rows={[
          { name: 'children', type: 'ReactNode', description: 'The search page: usually the SearchProvider and everything in it.' },
          { name: 'fallback', type: '(error, reset) => ReactNode', description: 'What to show instead. Without it, a built-in panel with the message and common fixes.' },
        ]} />
        <p className={styles.note}><Button variant="ghost" size="micro" onClick={() => setKey(k => k + 1)}>Reset both</Button></p>
      </div>
      <div className={styles.grid}>
        <div className={styles.stateLabel}>
          <div className={styles.stateTitle}>Built-in fallback</div>
          <div className={styles.stateWhen}>No <code>fallback</code>: the message and a list of common fixes, for whoever built the page.</div>
        </div>
        <div className={styles.cell}>
          <SearchErrorBoundary key={`a${key}`}><Breaks /></SearchErrorBoundary>
        </div>
        <div className={styles.stateLabel}>
          <div className={styles.stateTitle}>Own fallback</div>
          <div className={styles.stateWhen}><code>fallback</code> gets the error and a reset, which renders the children again.</div>
        </div>
        <div className={styles.cell}>
          <SearchErrorBoundary key={`b${key}`} fallback={(error, reset) => (
            <div>
              <p className={styles.desc}>Search hit a snag: {error.message}</p>
              <Button variant="secondary" size="micro" onClick={reset}>Try again</Button>
            </div>
          )}>
            <Breaks />
          </SearchErrorBoundary>
        </div>
      </div>
    </main>
  );
}
