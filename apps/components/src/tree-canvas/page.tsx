import { useState } from 'react';
import { SegmentedControl, TreeCanvas, type TreeNode } from '@indxsearch/systm';
import { Boost } from '@indxsearch/pixl';
import { PropsTable } from '../PropsTable';
import styles from './page.module.css';

// A sports shop's categories, as a Google product_type field would give them: "Run > Running
// shoes > Trail shoes". Counts are products in the category, overlapping across branches.
const boost = { icon: <Boost size={14} color="currentColor" />, title: 'Boosted' };
const SHOP: TreeNode[] = [
  {
    id: 'run', label: 'Run', count: 372,
    children: [
      {
        id: 'run/shoes', label: 'Running shoes', count: 121,
        children: [
          {
            id: 'run/shoes/types', label: 'Types', count: 121, muted: true,
            children: [
              { id: 'run/shoes/types/training', label: 'Training shoes', count: 121 },
              { id: 'run/shoes/types/race', label: 'Lightweight and racing shoes', count: 19 },
              { id: 'run/shoes/types/trail', label: 'Trail shoes', count: 78, marks: [boost] },
              { id: 'run/shoes/types/winter', label: 'Winter and spiked shoes', count: 6 },
            ],
          },
          { id: 'run/shoes/all', label: 'All jogging shoes', count: 121 },
        ],
      },
      {
        id: 'run/clothes', label: 'Training clothes', count: 121,
        children: [
          {
            id: 'run/clothes/men', label: 'Men', count: 121,
            children: ['Jackets and vests', 'Sweaters', 'Tops', 'Tights and trousers', 'Shorts', 'Singlets', 'Accessories']
              .map((l, i) => ({ id: `run/clothes/men/${i}`, label: l, count: 121 })),
          },
          {
            id: 'run/clothes/women', label: 'Women', count: 121,
            children: ['Jackets and vests', 'Sweaters', 'Tops', 'Tights and trousers', 'Shorts', 'Singlets', 'Accessories']
              .map((l, i) => ({ id: `run/clothes/women/${i}`, label: l, count: 121 })),
          },
        ],
      },
    ],
  },
  {
    id: 'cycle', label: 'Cycling', count: 240,
    children: Array.from({ length: 70 }, (_, i) => ({ id: `cycle/${i}`, label: `Brand ${i + 1}`, count: 70 - i })),
  },
];

export default function TreeCanvasPage() {
  const [selected, setSelected] = useState<string | undefined>('run/shoes/types/trail');
  const [view, setView] = useState<'tree' | 'list'>('tree');

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>TreeCanvas</h1>
        <p className={styles.desc}>
          A hierarchy as a horizontal tree: a pill a node with its name and a count, children fanned out to the right
          on soft connectors, the chosen node and the path to it lit, the rest collapsed until opened. For a
          catalogue's categories. Arrows move between nodes, right opens, left closes. The list view is the same tree
          as nested rows, for a phone.
        </p>
      </div>

      <div className={styles.section}>
        <div className={styles.bar}>
          <h2 className={styles.heading} style={{ margin: 0 }}>A shop's categories</h2>
          <SegmentedControl aria-label="View" value={view} onChange={setView} items={[{ value: 'tree', label: 'Tree' }, { value: 'list', label: 'List' }]} />
        </div>
        <p className={styles.desc}>
          Run and Cycling open at first; Types is muted, a level that is hidden from search; Trail shoes carries a
          boost mark. Cycling has 70 children, so it shows 50 and a step to the rest. Chosen: <span className={styles.chosen}>{selected ?? 'none'}</span>
        </p>
        <TreeCanvas
          roots={SHOP}
          selected={selected}
          onSelect={setSelected}
          defaultExpanded={['run', 'run/shoes', 'run/shoes/types', 'run/clothes', 'run/clothes/men']}
          view={view}
          aria-label="Categories of the shop"
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Props</h2>
        <PropsTable rows={[
          { name: 'roots', type: 'TreeNode[]', description: 'The tree: { id, label, count?, children?, marks?, muted? }.' },
          { name: 'selected', type: 'string', description: "The chosen node's id; the path to it is lit." },
          { name: 'onSelect', type: '(id) => void', description: 'Called with the node clicked.' },
          { name: 'defaultExpanded', type: 'string[]', description: 'The ids open at first; the roots when left out.' },
          { name: 'view', type: "'tree' | 'list'", default: "'tree'", description: 'The canvas, or the same as nested rows.' },
          { name: 'maxChildren', type: 'number', default: '50', description: 'Children shown before the step to the rest.' },
          { name: 'format', type: '(count) => string', description: 'The count as shown.' },
          { name: 'aria-label', type: 'string', description: 'A name for assistive technology.' },
        ]} />
      </div>
    </main>
  );
}
