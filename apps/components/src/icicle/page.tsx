import { Icicle, type IcicleNode } from '@indxsearch/systm';
import styles from './page.module.css';

// A bookshop's browsing paths: how visitors narrow the catalogue with its filters.
const PATHS: IcicleNode = {
  label: 'Every filtered search', value: 1000, children: [
    { label: 'category = literature', value: 520, children: [
      { label: 'subcategory = non-fiction', value: 260, children: [
        { label: 'price (range)', value: 140, children: [{ label: 'language = norwegian', value: 40 }] },
        { label: 'format = paperback', value: 50 },
      ] },
      { label: 'subcategory = fiction', value: 180, children: [{ label: 'author (2 values)', value: 30 }] },
      { label: 'Other', value: 30 },
    ] },
    { label: 'category = children', value: 260, children: [{ label: 'age (range)', value: 190, children: [{ label: 'format = board book', value: 60 }] }] },
    { label: 'price (range)', value: 140 },
    { label: 'Other', value: 80 },
  ],
};

export default function IciclePage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Icicle</h1>
        <p className={styles.desc}>
          A tree as nested blocks, read top to bottom: the root across the top, each node's children in the row under it,
          a block as wide as its share of the root. A block is toned by how much of it goes on to its children, and the
          space a parent leaves under it is the part that stopped there. Made for browsing paths in Statistics, and for
          any tree whose values add up. Point at a block for its numbers.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>A bookshop's browsing paths</h2>
        <Icicle root={PATHS} aria-label="Browsing paths"
                title={n => `${n.label}: ${n.value.toLocaleString()} searches`} />
      </div>
    </main>
  );
}
