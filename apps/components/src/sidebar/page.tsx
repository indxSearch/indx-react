import { useState } from 'react';
import { Button, Sidebar, type SidebarGroup } from '@indxsearch/systm';
import { Boost, Database, Fields, Menu, Pulse, Search, Sliders_horizontal, Status, Synonym, Trending_up, Webhooks } from '@indxsearch/pixl';
import styles from './page.module.css';

/**
 * Sidebar: the side column of an app, the rail it folds to (Cmd or Ctrl and B), groups that open
 * and close, badges, and the drawer it becomes on a narrow screen. Shaped after the console's
 * dataset page; nothing here is wired to a server.
 */

const groups: SidebarGroup[] = [
  { title: 'Overview', items: [
    { key: 'status', label: 'Status', icon: <Status /> },
    { key: 'statistics', label: 'Statistics', icon: <Trending_up /> },
  ] },
  { title: 'Data', items: [
    { key: 'fields', label: 'Field configuration', icon: <Fields /> },
    { key: 'categories', label: 'Categories', icon: <Database /> },
    { key: 'webhooks', label: 'Webhooks', icon: <Webhooks />, badge: '2', signal: true, title: 'Two deliveries failed' },
  ] },
  { title: 'Relevance', collapsible: true, items: [
    { key: 'query', label: 'Query parameters', icon: <Sliders_horizontal /> },
    { key: 'boosts', label: 'Boost rules', icon: <Boost />, badge: '4' },
    { key: 'synonyms', label: 'Synonyms', icon: <Synonym /> },
  ] },
  { title: 'Try it', collapsible: true, items: [
    { key: 'search', label: 'Search preview', icon: <Search /> },
    { key: 'observr', label: 'Observr', icon: <Pulse />, disabled: true, title: 'Not on this plan' },
  ] },
];

const labelOf = (key: string) => groups.flatMap(g => g.items).find(i => i.key === key)?.label ?? key;

function Frame({ storageKey, collapsed, onCollapsedChange, shortcut }: { storageKey?: string; collapsed?: boolean; onCollapsedChange?: (c: boolean) => void; shortcut?: string | null }) {
  const [active, setActive] = useState('status');
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.frame}>
      <Sidebar
        groups={groups}
        active={active}
        onSelect={i => setActive(i.key)}
        header={<div className={styles.brand}>pokedex</div>}
        footer={<div className={styles.note}>Indx 5.0.5</div>}
        storageKey={storageKey}
        collapsed={collapsed}
        onCollapsedChange={onCollapsedChange}
        open={open}
        onOpenChange={setOpen}
        shortcut={shortcut}
        aria-label="Dataset"
      />
      <div className={styles.content}>
        <div className={styles.trigger}>
          <Button variant="ghost" size="micro" iconLeft={<Menu />} onClick={() => setOpen(true)} aria-label="Sections">Sections</Button>
        </div>
        <h3 className={styles.contentTitle}>{labelOf(active)}</h3>
        <p className={styles.desc}>The open section's page would be here.</p>
      </div>
    </div>
  );
}

export default function SidebarPage() {
  const [rail, setRail] = useState(true);
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Sidebar</h1>
        <p className={styles.desc}>
          The side column of an app: groups of Buttons, the open one primary. Cmd or Ctrl and B, or the button at its
          foot, folds it to a rail of icons, where each item names itself in a Tooltip and a badge is a dot; with a
          storageKey the viewer's choice is kept. A group with collapsible opens and closes under its title. At 768px
          and narrower it is a drawer over the page that the host's own trigger opens, closed by Escape, a press beside
          it or a choice. No motion: it is simply there, and then not.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>In a page</h2>
        <p className={styles.desc}>Kept per viewer under a storageKey. Narrow the window past 768px for the drawer and its Sections trigger.</p>
        <Frame storageKey="systm-showcase-sidebar" />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>The rail, controlled</h2>
        <p className={styles.desc}>collapsed and onCollapsedChange: the host holds the state, and shortcut={null} leaves Cmd B to the frame above, since a page has one sidebar. Point at an item for its name; Webhooks' badge is a signal dot, Boost rules' a plain one.</p>
        <Frame collapsed={rail} onCollapsedChange={setRail} shortcut={null} />
      </div>
    </main>
  );
}
