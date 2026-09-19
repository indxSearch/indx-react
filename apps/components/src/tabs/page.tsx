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

// A view bar: one tab carries a badge, one is not available yet and says why.
const VIEW_ITEMS = [
  { label: 'Status', value: 'status', icon: <Search color="currentColor" /> },
  { label: 'Field configuration', value: 'fields', icon: <Sliders_horizontal color="currentColor" /> },
  { label: 'Boost rules', value: 'boosts', icon: <Ai_agent color="currentColor" />, badge: 2, badgeTitle: '2 expired boost rules' },
  { label: 'Synonyms', value: 'synonyms', disabled: true, title: 'Available after the index is built' },
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
  const [activeView, setActiveView] = useState('status');

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
        <Tabs items={ICON_ITEMS} value={activeIcons} onValueChange={setActiveIcons} />
        <p className={styles.active}>Active: {activeIcons}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>With icons &mdash; all sizes</h2>
        <p className={styles.desc}>
          The tab sizes the icon: 21 on large, 14 on default and micro. Pass a size on the icon
          itself to override it.
        </p>
        <div className={styles.stack}>
          <Tabs items={ICON_ITEMS} value="search" onValueChange={() => {}} size="micro" />
          <Tabs items={ICON_ITEMS} value="search" onValueChange={() => {}} size="default" />
          <Tabs items={ICON_ITEMS} value="search" onValueChange={() => {}} size="large" />
        </div>
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
        <h2 className={styles.heading}>Button variant, with a badge and a disabled tab</h2>
        <p className={styles.desc}>
          <code>variant="button"</code> fills the active tab like a primary Button. A disabled tab keeps
          its place, takes no clicks, is skipped by the arrow keys, and says why on hover. With{' '}
          <code>scrollable</code> the bar stays on one line: drag the handle narrower and it scrolls
          sideways, labels never wrap.
        </p>
        <div className={styles.constrained}>
          <Tabs items={VIEW_ITEMS} value={activeView} onValueChange={setActiveView} size="micro" variant="button" scrollable />
        </div>
        <p className={styles.desc}>
          The same bar with <code>bleed={'{'}24{'}'}</code>, in a box with 24px of padding. The bar reaches out
          into that gutter and the fade sits there, fixed. At rest nothing is faded. Scroll, and the tabs
          move out into the fade.
        </p>
        <div className={styles.constrained} style={{ padding: 24 }}>
          <Tabs items={VIEW_ITEMS} value={activeView} onValueChange={setActiveView} size="micro" variant="button" scrollable bleed={24} />
        </div>
        <p className={styles.active}>Active: {activeView}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Links to separate pages</h2>
        <p className={styles.desc}>
          Give the items an <code>href</code> and the bar becomes a nav of links: the active one carries{' '}
          <code>aria-current="page"</code>, and open-in-new-tab works. Use <code>renderLink</code> for a router link.
        </p>
        <Tabs aria-label="Example sections" size="micro" variant="button" value="users" onValueChange={() => {}}
          items={[{ label: 'Users', value: 'users', href: '#users' }, { label: 'Teams', value: 'teams', href: '#teams' }, { label: 'Settings', value: 'settings', href: '#settings' }]} />
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
