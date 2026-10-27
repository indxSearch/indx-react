import { Button, EmptyState } from '@indxsearch/systm';
import { Bell, Boost, Empty, Panel_add, Synonym } from '@indxsearch/pixl';
import styles from './page.module.css';

export default function EmptyStatePage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>EmptyState</h1>
        <p className={styles.desc}>
          What a list or a page shows while it has nothing yet: a large icon in a quiet tone, a title, a line saying what
          would be here and how it gets here, and the action that starts it when there is one to offer. default opens a page;
          compact sits inside a tab or a section, under the toolbar that already holds the page's New button.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Default, with an action</h2>
        <div className={styles.frame}>
          <EmptyState icon={<Empty />} title="Nothing here yet"
                      actions={<Button variant="primary" size="micro" iconLeft={<Panel_add />}>New dataset</Button>}>
            Three steps to your first search.
          </EmptyState>
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Compact, in a tab</h2>
        <div className={styles.grid}>
          <div className={styles.frame}>
            <EmptyState size="compact" icon={<Boost />} title="No boost rules yet">
              A rule lifts the records it matches, on every search or between two dates. New boost rule adds one at the top.
            </EmptyState>
          </div>
          <div className={styles.frame}>
            <EmptyState size="compact" icon={<Synonym />} title="No synonyms yet">
              A synonym lets a search for one word find records that use another, as sofa and couch.
            </EmptyState>
          </div>
          <div className={styles.frame}>
            <EmptyState size="compact" icon={<Bell />} title="No notifications yet" />
          </div>
        </div>
      </div>
    </main>
  );
}
