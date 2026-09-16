import { useState } from 'react';
import { Tabs } from '@indxsearch/systm';
import { Search, Ai_agent, Sliders_horizontal } from '@indxsearch/pixl';
import styles from './page.module.css';

const ITEMS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Settings', value: 'settings' },
  { label: 'Activity', value: 'activity' },
];

// Icons are optional per item and inherit the tab's colour, so the selected tab's icon
// brightens with its label.
const ICON_ITEMS = [
  { label: 'Search', value: 'search', icon: <Search color="currentColor" /> },
  { label: 'Ask', value: 'ask', icon: <Ai_agent color="currentColor" /> },
  { label: 'Settings', value: 'settings', icon: <Sliders_horizontal color="currentColor" /> },
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
  const [activeIcons, setActiveIcons] = useState('search');

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
        <h2 className={styles.heading}>With icons</h2>
        <Tabs items={ICON_ITEMS} value={activeIcons} onValueChange={setActiveIcons} size="micro" />
        <p className={styles.active}>Active: {activeIcons}</p>
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
        <h2 className={styles.heading}>Many tabs &mdash; scrollable</h2>
        <p className={styles.desc}>
          {MANY_ITEMS.length} tabs with <code>scrollable</code>, in a width-constrained panel. Drag the
          bottom-right handle narrower: the row scrolls horizontally instead of clipping, and the edges
          fade to hint there's more (no shadows). The left edge only fades once you've scrolled right.
          Scroll with trackpad/touch, or tab with the keyboard &mdash; the focused tab scrolls into view.
        </p>
        <div className={styles.constrained}>
          <Tabs items={MANY_ITEMS} value={activeMany} onValueChange={setActiveMany} size="micro" scrollable />
        </div>
        <p className={styles.active}>Active: {activeMany}</p>
      </div>
    </main>
  );
}
