import { Alert, AlertTitle, AlertDescription } from '@indxsearch/systm';
import { Hibernate } from '@indxsearch/pixl';
import styles from './page.module.css';

export default function AlertPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Alert</h1>
        <p className={styles.desc}>A callout that stays in the page — for outcomes and conditions the reader must not miss. Not a toast.</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Variants</h2>
        <div className={styles.stack}>
          <Alert>
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>The default tone, for a neutral note that should stay visible.</AlertDescription>
          </Alert>
          <Alert variant="info">
            <AlertTitle>Index rebuilding</AlertTitle>
            <AlertDescription>Searches keep using the current index until the new one is ready.</AlertDescription>
          </Alert>
          <Alert variant="success">
            <AlertTitle>Dataset replaced</AlertTitle>
            <AlertDescription>212 404 documents loaded and indexed in 41 s.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTitle>Indexed text truncated</AlertTitle>
            <AlertDescription>Some documents exceed the indexed-text ceiling; the tail of those fields is not searchable.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>License limit exceeded</AlertTitle>
            <AlertDescription>212 404 of 100 000 documents. Searches still work; loading more does not.</AlertDescription>
          </Alert>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>One line, custom icon, no icon</h2>
        <div className={styles.stack}>
          <Alert variant="warning">A filter token could not be resolved — re-create the filter and retry.</Alert>
          <Alert variant="info" icon={<Hibernate />}>
            <AlertTitle>Hibernated</AlertTitle>
            <AlertDescription>The documents are on disk; wake the dataset to search it.</AlertDescription>
          </Alert>
          <Alert variant="destructive" icon={null}>
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>disk full</AlertDescription>
          </Alert>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Usage</h2>
        <p className={styles.desc}>
          Pick the variant by what the reader should do: <code>destructive</code> for errors and irreversible
          outcomes, <code>warning</code> for something to look at, <code>success</code> for a finished action,
          <code>info</code> for a neutral notice. <code>warning</code> and <code>destructive</code> render with
          <code>role="alert"</code>; the rest with <code>role="status"</code>.
        </p>
      </div>
    </main>
  );
}
