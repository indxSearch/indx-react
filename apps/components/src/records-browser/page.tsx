import { useState } from 'react';
import { Tabs } from '@indxsearch/systm';
import { DiscoverVariant } from './discover';
import { PreviewVariant } from './preview';
import { HealthVariant } from './health';
import { CombinedVariant } from './combined';
import { CAP, PAGE, nf } from './data';
import styles from './page.module.css';

// A mockup: the Records section of a dataset (Nov 2026), a browser for its records in four
// variants. All three make one search with facets per change, list at most CAP records (the
// engine has no offset yet) and read only the page's records, which is what holds up at 2M.

type Variant = 'discover' | 'preview' | 'health' | 'combined';

const ABOUT: Record<Variant, string> = {
  discover: 'The way hosted search engines and Kibana do it: a query bar with a search and a filter expression, the fields down the left with what each holds, and the hits as a table whose rows open in place.',
  preview: "The layout the console has now, drawn as the Search preview is: a hairline box with a borderless field at its top, quiet rows, and a base beside it with the open record or the fields. No text search here: the field goes to a record by its key, and searching stays in the Search preview.",
  combined: "The Records section the console has now, with the best of the other three: rows that open in place and a page size (A), the whole row to hover and click (B), and what the data lacks (C), said as counts rather than bars. A searched field missing in a record is marked in its cell, a long value shows more on hover, and the filter menu searches a field's values instead of listing thousands.",
  health: 'Built on what the Search preview cannot show: what the data holds and lacks. Each column says how many records hold its field, a column menu sorts, filters and finds the records without it, and two lists catch the records a search treats badly.',
};

export default function RecordsBrowserMockup() {
  // ?variant=discover|preview|health|combined opens one, so each can be linked to.
  const [variant, setVariant] = useState<Variant>(() => {
    const asked = new URLSearchParams(window.location.search).get('variant');
    return asked === 'discover' || asked === 'preview' || asked === 'health' ? asked : 'combined';
  });
  const choose = (v: string) => {
    setVariant(v as Variant);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.replaceState(null, '', url);
  };

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Records browser</h1>
        <p className={styles.desc}>
          A dataset's records as a table, read-only, with filters, an order and pages. Mock data: 2,400 furniture records.
          Every variant lists at most {nf.format(CAP)} records per search, {PAGE} to a page, since the engine has no offset yet.
        </p>
      </div>
      <Tabs value={variant} onValueChange={choose} items={[
        { label: 'A · Like the others', value: 'discover' },
        { label: 'B · Our layout, preview style', value: 'preview' },
        { label: 'C · What the data lacks', value: 'health' },
        { label: 'D · Together', value: 'combined' },
      ]} />
      <p className={styles.note}>{ABOUT[variant]}</p>
      {variant === 'discover' && <DiscoverVariant />}
      {variant === 'preview' && <PreviewVariant />}
      {variant === 'health' && <HealthVariant />}
      {variant === 'combined' && <CombinedVariant />}
    </main>
  );
}
