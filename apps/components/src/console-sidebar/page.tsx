import { useState, type ReactElement } from 'react';
import { Breadcrumbs, Button, Chip, Kbd, SegmentedControl, Sidebar, type BreadcrumbItem, type SidebarGroup } from '@indxsearch/systm';
import {
  Bell, Boost, Coverage, Empty, Hibernate, Lab_experiment, Hour_glass, Shadow_indexing, Trolley, Warning, Database, Document_or_file, Field, Graph, Indx, Key, Layers, Lock, Menu, Observr, Search,
  Search_or_ask, Server, Shield, Sliders_horizontal, Status, Synonym, User, User_group, User_id, Users, Webhooks,
} from '@indxsearch/pixl';
import styles from './page.module.css';

// A mockup: the console (IndxServer) with the systm Sidebar in place of today's side column, its
// menus and conditions as the console has them (DatasetPanel.NavItems, ConsoleSideMenu, AdminNav):
// sections left out by role, disabled with a reason while a dataset sleeps or is not built, the
// badges for expired boost rules and held webhook batches, Search or ask experimental, the admin
// area's version and update line, and the dataset's state chips after the trail (DatasetStatus):
// none while Ready, one per state otherwise, with the state deciding what the column holds open. The phone view is this page in a 390px frame, since the drawer
// follows the window's width. Nothing here talks to a server.

type Area = 'dataset' | 'team' | 'admin' | 'account';
type State = 'ready' | 'hibernated' | 'loading' | 'indexing' | 'error' | 'created' | 'shadow';
type Role = 'admin' | 'editor' | 'viewer';

const AREAS = [
  { label: 'Dataset', value: 'dataset' }, { label: 'Team', value: 'team' },
  { label: 'Admin', value: 'admin' }, { label: 'Account', value: 'account' },
];
const ROLES = [{ label: 'Admin', value: 'admin' }, { label: 'Editor', value: 'editor' }, { label: 'Viewer', value: 'viewer' }];

const STATES = [
  { label: 'Ready', value: 'ready' }, { label: 'Hibernated', value: 'hibernated' }, { label: 'Loading', value: 'loading' },
  { label: 'Indexing', value: 'indexing' }, { label: 'Error', value: 'error' }, { label: 'Created', value: 'created' },
  { label: 'Shadow indexing', value: 'shadow' },
];

const ASLEEP = 'Available once the dataset is awake';
const NOT_YET = 'Available after the index is built';

/** The header's chip for a state, as DatasetStateChip draws it; Ready has none. */
const CHIP: Record<State, { label: string; color: string; text: string; icon: ReactElement<{ size?: string | number; color?: string }> } | null> = {
  ready: null,
  hibernated: { label: 'Hibernated', color: 'var(--CLightBlue)', text: '#080809', icon: <Hibernate /> },
  loading: { label: 'Loading', color: 'var(--CWarning)', text: '#080809', icon: <Trolley /> },
  indexing: { label: 'Indexing', color: 'var(--CWarning)', text: '#080809', icon: <Hour_glass /> },
  error: { label: 'Error', color: 'var(--CSignal)', text: 'var(--lv0)', icon: <Warning /> },
  created: { label: 'Created', color: 'var(--lv3)', text: 'var(--lv5)', icon: <Empty /> },
  shadow: { label: 'Shadow indexing', color: 'var(--lv8)', text: 'var(--lv0)', icon: <Shadow_indexing /> },
};

/** The dataset page's sections, grouped as the console does (Overview · Data · Relevance · Try it ·
 *  Settings): a role leaves a section out, sleep disables it with the reason. */
function datasetGroups(role: Role, state: State, experimental: boolean): SidebarGroup[] {
  const editor = role !== 'viewer', admin = role === 'admin';
  // Asleep, the sections that read no engine stay open; not built (loading, indexing, error,
  // created), only the webhooks do, a full sync being how an empty dataset gets its documents.
  const asleep = state === 'hibernated', building = state === 'loading' || state === 'indexing' || state === 'error' || state === 'created';
  const off = (enabledAsleep: boolean) => asleep && !enabledAsleep ? { disabled: true, title: ASLEEP } : building ? { disabled: true, title: NOT_YET } : {};
  const groups: SidebarGroup[] = [
    { title: 'Overview', items: [
      { key: 'status', label: 'Status', icon: <Status />, ...off(true) },
      { key: 'statistics', label: 'Statistics', icon: <Graph />, ...off(true) },
    ] },
    { title: 'Data', items: [
      { key: 'fields', label: 'Field configuration', icon: <Field />, ...off(false) },
      { key: 'categories', label: 'Categories', icon: <Layers />, ...off(false) },
      ...(admin ? [{ key: 'webhooks', label: 'Webhooks', icon: <Webhooks />, ...(asleep || building ? {} : { badge: '1', signal: true, title: '1 webhook batch held by the brake, waiting for you' }) }] : []),
    ] },
    { title: 'Relevance', items: editor ? [
      { key: 'query', label: 'Query parameters', icon: <Coverage />, ...off(false) },
      { key: 'boosts', label: 'Boost rules', icon: <Boost />, ...(asleep || building ? off(false) : { badge: '2', signal: true, title: '2 expired boost rules, no longer applying' }) },
      { key: 'synonyms', label: 'Synonyms', icon: <Synonym />, ...off(false) },
    ] : [] },
    { title: 'Try it', items: [
      { key: 'search', label: 'Search preview', icon: <Search />, ...off(false) },
      ...(editor && experimental ? [{ key: 'soa', label: 'Search or ask', icon: <Search_or_ask />, trailing: <Lab_experiment />, trailingTitle: 'Experimental', ...off(false) }] : []),
    ] },
    { title: 'Settings', items: admin ? [{ key: 'options', label: 'Options', icon: <Sliders_horizontal />, ...off(true) }] : [] },
  ];
  return groups.filter(g => g.items.length > 0);
}

const ADMIN: SidebarGroup[] = [{ title: 'Admin', items: [
  { key: 'users', label: 'Users', icon: <Users /> },
  { key: 'teams', label: 'Teams', icon: <User_group /> },
  { key: 'datasets', label: 'Datasets', icon: <Database /> },
  { key: 'monitor', label: 'Monitor', icon: <Server /> },
  { key: 'settings', label: 'Settings', icon: <Sliders_horizontal /> },
  { key: 'license', label: 'License', icon: <Document_or_file /> },
  { key: 'observr', label: 'Observr', icon: <Observr /> },
  { key: 'email', label: 'Email preview', icon: <Bell /> },
] }];

const ACCOUNT: SidebarGroup[] = [{ title: 'Account', items: [
  { key: 'account', label: 'Account', icon: <User_id /> },
  { key: 'keys', label: 'API keys', icon: <Key /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell /> },
  { key: 'password', label: 'Change password', icon: <Lock /> },
] }];

/** The team page, which has no column today: what it could hold. */
const TEAM: SidebarGroup[] = [{ title: 'Indx intern', items: [
  { key: 'datasets', label: 'Datasets', icon: <Database /> },
  { key: 'observr', label: 'Observr', icon: <Observr />, badge: '5', title: '5 open findings' },
  { key: 'keys', label: 'Team API keys', icon: <Key /> },
  { key: 'manage', label: 'Manage team', icon: <Users /> },
] }];

const FIRST: Record<Area, string> = { dataset: 'status', team: 'datasets', admin: 'settings', account: 'account' };

function crumbs(area: Area): BreadcrumbItem[] {
  const team: BreadcrumbItem = { id: 'team', label: 'indx-intern', icon: <Users />, switcher: { label: 'Team', value: 'indx', options: [{ label: 'indx-intern', value: 'indx', icon: <Users /> }], onValueChange: () => {} } };
  if (area === 'dataset')
    return [team, { id: 'ds', label: 'pokedex', icon: <Database />, switcher: { label: 'Dataset', value: 'pokedex', options: [{ label: 'pokedex', value: 'pokedex', icon: <Database /> }], onValueChange: () => {} } }];
  if (area === 'team') return [team];
  return [];
}

/** The console, header and body, at whatever width it is given. */
function Console({ area, role, state, experimental, phone }: { area: Area; role: Role; state: State; experimental: boolean; phone?: boolean }) {
  const [active, setActive] = useState<Record<Area, string>>(FIRST);
  const [open, setOpen] = useState(false);
  const groups = area === 'admin' ? ADMIN : area === 'account' ? ACCOUNT : area === 'team' ? TEAM : datasetGroups(role, state, experimental);
  const chip = area === 'dataset' ? CHIP[state] : null;
  const label = groups.flatMap(g => g.items).find(i => i.key === active[area])?.label ?? '';
  const footer = area === 'admin'
    ? <div className={styles.version}><span>Indx 5.0.5</span><Button variant="ghost" size="micro" className={styles.update}>5.0.6 available</Button></div>
    : undefined;

  return (
    <div className={`${styles.console} ${phone ? styles.consolePhone : ''}`}>
      <header className={styles.header}>
        <div className={styles.brand}>
          {phone && <Button variant="ghost" size="micro" iconLeft={<Menu />} aria-label="Sections" onClick={() => setOpen(true)} />}
          <Button variant="ghost" size="micro" iconLeft={<Indx />} className={styles.brandLink} aria-label="Indx">{phone ? null : 'Indx Server'}</Button>
          {!phone && <Chip>Free</Chip>}
        </div>
        {/* The team is the trail's first step again, the dataset the second; the state chip right
            after it (DatasetStatus). A phone keeps the last step only, and the chip as its icon. */}
        <div className={styles.trail}>
          {crumbs(area).length > 0 && <div className={styles.crumbs}><Breadcrumbs size="micro" overflow="truncate" items={phone ? crumbs(area).slice(-1) : crumbs(area)} /></div>}
          {chip && (
            <span className={styles.state} title={chip.label}>
              <Chip size="large" color={chip.color} textColor={chip.text} icon={chip.icon}>{phone ? null : chip.label}</Chip>
            </span>
          )}
        </div>
        <div className={styles.right}>
          {/* The frame is narrower than a page, so the header is the console's at 1000px: Jump to as
              its icon and key, Admin and the account as icons. */}
          {!phone && <Button variant="secondary" size="micro" iconLeft={<Search />} className={styles.jump} aria-label="Jump to"><Kbd>⌘K</Kbd></Button>}
          <Button variant="ghost" size="micro" iconLeft={<Shield />} aria-label="Admin" />
          <Button variant="ghost" size="micro" iconLeft={<Bell />} aria-label="Notifications" />
          <Button variant="ghost" size="micro" iconLeft={<User />} aria-label="anders" />
          <Button variant="ghost" size="micro" iconLeft={<Observr />} className={styles.agent} aria-label="Agent">{phone ? null : 'Agent'}</Button>
        </div>
      </header>
      <div className={styles.body}>
        <div className={styles.column}>
          <Sidebar groups={groups} active={active[area]} onSelect={i => setActive(a => ({ ...a, [area]: i.key }))}
                   footer={footer} storageKey="mockup-console-sidebar" open={open} onOpenChange={setOpen} aria-label="Sections" />
        </div>
        <main className={styles.content}>
          <h2 className={styles.title}>{label}</h2>
          {area === 'dataset' && state === 'hibernated' && !['status', 'statistics', 'options', 'webhooks'].includes(active[area])
            ? <p className={styles.note}>The dataset is asleep. Status, Statistics, Webhooks and Options read no engine, so they stay open; the rest wait for it to wake.</p>
            : area === 'dataset' && ['loading', 'indexing', 'error', 'created'].includes(state) && active[area] !== 'webhooks'
            ? <p className={styles.note}>The index is not built yet: the page is the upload, or the progress. Only Webhooks is open, since a full sync is how an empty dataset gets its documents.</p>
            : <div className={styles.placeholder}><div className={styles.bar} style={{ width: '62%' }} /><div className={styles.bar} style={{ width: '44%' }} /><div className={styles.block} /></div>}
        </main>
      </div>
    </div>
  );
}

const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');

export default function ConsoleSidebarPage() {
  // The phone frame loads this page alone at its own width, so the Sidebar's drawer takes over.
  if (params.get('embed') === 'phone')
    return (
      <div className={styles.embed}>
        <Console area={(params.get('area') as Area) ?? 'dataset'} role={(params.get('role') as Role) ?? 'admin'} state={(params.get('state') as State) ?? 'ready'} experimental={params.get('lab') !== '0'} phone />
      </div>
    );
  return <Mockup />;
}

function Mockup() {
  const [area, setArea] = useState<Area>('dataset');
  const [role, setRole] = useState<Role>('admin');
  const [state, setState] = useState<State>('ready');
  const [experimental, setExperimental] = useState(true);
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Mockup: the console with Sidebar</h1>
        <p className={styles.desc}>
          IndxServer's side column as the systm Sidebar, with today's menus and their conditions. Press ⌘B (or Collapse at
          its foot) for the rail of icons, kept per viewer; point at an icon for its name. The phone frame shows the same
          console narrow: the column becomes a drawer behind the menu button.
        </p>
      </div>
      <div className={styles.controls}>
        <SegmentedControl items={AREAS} value={area} onChange={v => setArea(v as Area)} size="default" aria-label="Area" />
        {area === 'dataset' && <SegmentedControl items={STATES} value={state} onChange={v => setState(v as State)} size="default" aria-label="State" />}
        {area === 'dataset' && <SegmentedControl items={ROLES} value={role} onChange={v => setRole(v as Role)} size="default" aria-label="Role" />}
        {area === 'dataset' && (
          <Button variant={experimental ? 'secondary' : 'ghost'} size="micro" aria-pressed={experimental} onClick={() => setExperimental(e => !e)}>Search or ask on</Button>
        )}
      </div>
      <div className={styles.frames}>
        <div className={styles.desktop}><Console area={area} role={role} state={state} experimental={experimental} /></div>
        <iframe className={styles.phone} title="Phone" src={`?embed=phone&area=${area}&role=${role}&state=${state}&lab=${experimental ? 1 : 0}`} />
      </div>
      <div className={styles.section}>
        <h2 className={styles.subTitle}>What moves, and what the Sidebar does not do yet</h2>
        <ul className={styles.list}>
          <li><strong>The trail:</strong> the team is its first step again, with its switcher, and the dataset the second; the team leaves the header's right. On a phone the trail keeps the dataset alone.</li>
          <li><strong>State chips:</strong> right after the trail, as today: none while Ready, one per state otherwise, with Shadow indexing while a rebuild runs. The state also decides what the column holds open. On a phone the chip is its icon, its name on hover, so the dataset's name keeps the room.</li>
          <li><strong>Fits as it is:</strong> the five groups, role rules (a section left out), sleep (listed, disabled, the reason on hover), the badges in the signal colour, the active section primary, admin and account as one group each.</li>
          <li><strong>New:</strong> the rail on ⌘B, kept per viewer; groups that fold; a drawer on a phone in place of today's sideways row; a column for the team page, which has none today.</li>
          <li><strong>Experimental mark:</strong> Search or ask carries the lab icon at its end, as today, through the Sidebar's trailing icon.</li>
          <li><strong>Version and update:</strong> today's admin group has the version under its last item and the update as a link. Here they are the Sidebar's footer, which moves them to the column's foot.</li>
          <li><strong>Tooltips in the rail:</strong> the console's column scrolls (<code>.shell-side</code>, overflow-y auto), which clips them; the column would let them out or the Sidebar would place them in a layer of their own.</li>
          <li><strong>The header's menu button:</strong> on a phone the drawer needs a way in. Today the column is a row under the header, so nothing opens it; the mockup puts a menu button before the mark.</li>
        </ul>
      </div>
    </main>
  );
}
