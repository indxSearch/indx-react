import { useState } from 'react';
import { Tabs } from '@indxsearch/systm';
import styles from './page.module.css';

const ITEMS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Settings', value: 'settings' },
  { label: 'Activity', value: 'activity' },
];

// A realistic "lots of tabs" set — e.g. a team's datasets — to exercise overflow behaviour.
const MANY_ITEMS = [
  'products', 'customers', 'orders', 'invoices', 'suppliers', 'categories',
  'reviews', 'inventory', 'shipments', 'returns', 'promotions', 'warehouses',
  'employees', 'tickets', 'articles', 'media-assets', 'campaigns', 'leads',
  'contracts', 'payments', 'subscriptions', 'audit-logs', 'webhooks', 'bestbuy-seo',
].map((v) => ({ label: v, value: v }));

export default function TabsPage() {
  const [activeDefault, setActiveDefault] = useState('overview');
  const [activeMicro, setActiveMicro] = useState('overview');
  const [activeLarge, setActiveLarge] = useState('overview');
  const [activeMany, setActiveMany] = useState(MANY_ITEMS[0].value);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Tabs</h1>
        <p className={styles.desc}>Tab navigation with border-bottom active indicator and three sizes</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Default</h2>
        <Tabs items={ITEMS} value={activeDefault} onValueChange={setActiveDefault} />
        <p className={styles.active}>Active: {activeDefault}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Micro</h2>
        <Tabs items={ITEMS} value={activeMicro} onValueChange={setActiveMicro} size="micro" />
        <p className={styles.active}>Active: {activeMicro}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Large</h2>
        <Tabs items={ITEMS} value={activeLarge} onValueChange={setActiveLarge} size="large" />
        <p className={styles.active}>Active: {activeLarge}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>All Sizes</h2>
        <div className={styles.stack}>
          <Tabs items={ITEMS} value="overview" onValueChange={() => {}} size="micro" />
          <Tabs items={ITEMS} value="overview" onValueChange={() => {}} size="default" />
          <Tabs items={ITEMS} value="overview" onValueChange={() => {}} size="large" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Many tabs &mdash; overflow</h2>
        <p className={styles.desc}>
          {MANY_ITEMS.length} tabs in a width-constrained panel. Drag the bottom-right handle to resize
          and watch what happens when the tabs no longer fit &mdash; today the row just overflows and
          the trailing tabs are clipped (no scroll, wrap, or overflow menu).
        </p>
        <div className={styles.constrained}>
          <Tabs items={MANY_ITEMS} value={activeMany} onValueChange={setActiveMany} size="micro" />
        </div>
        <p className={styles.active}>Active: {activeMany}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Many tabs &mdash; full width</h2>
        <p className={styles.desc}>
          The same {MANY_ITEMS.length} tabs at the page width, to gauge how many fit before overflow on
          a typical screen.
        </p>
        <Tabs items={MANY_ITEMS} value={activeMany} onValueChange={setActiveMany} size="default" />
      </div>
    </main>
  );
}
