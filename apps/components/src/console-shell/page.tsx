import { useState } from 'react';
import { Breadcrumbs, Button, Chip, Tabs, type BreadcrumbItem } from '@indxsearch/systm';
import { Bell, Database, Indx, Observr, Shield, User, Users } from '@indxsearch/pixl';
import styles from './page.module.css';

// A mockup of the console's header and column, one question: where the team switcher lives.
// Today it is the first crumb of the trail at the content's edge, which reads well on the dataset
// page (team › dataset) and floats alone on the team page. Five placements, each shown as the
// team page and the dataset page side by side. Nothing here talks to a server.

type Variant = 'trail' | 'trail-page' | 'brand' | 'brand-column' | 'brand-head' | 'right';

const VARIANTS: { value: Variant; label: string; about: string }[] = [
  { value: 'trail', label: '1 · In the trail (today)', about: 'The team is the first crumb at the content\'s edge. On the team page it is the only crumb.' },
  { value: 'trail-page', label: '1b · Trail with the page', about: 'As today, but the team page adds "Datasets" as the last crumb, so the switcher is never alone.' },
  { value: 'brand', label: '2a · Brand cell', about: 'The switcher sits beside the mark, over the column\'s width. The trail says only where you are inside the team. No column on the team page.' },
  { value: 'brand-column', label: '2b · Brand cell + column on the team page', about: 'As 2a, and the team page gets a short column with Datasets, Observr and Manage team, so every page has the same shape.' },
  { value: 'brand-head', label: '2c · Brand cell as the column\'s head', about: 'As 2b, with the cell toned as the column\'s head so the switcher reads as the column\'s title.' },
  { value: 'right', label: '3 · Top right', about: 'The team as a global setting among the account icons. The trail starts with the dataset.' },
];

const TEAMS = [{ label: 'Acme', value: 'acme', icon: <Users /> }, { label: 'Indx intern', value: 'indx', icon: <Users /> }];
const DATASETS = [{ label: 'products', value: 'products', icon: <Database /> }, { label: 'pokedex', value: 'pokedex', icon: <Database /> }];

function teamCrumb(): BreadcrumbItem {
  return { id: 'team', label: 'Acme', icon: <Users />, switcher: { label: 'Team', value: 'acme', options: TEAMS, onValueChange: () => {}, action: { label: 'New team', onSelect: () => {} } } };
}
function datasetCrumb(): BreadcrumbItem {
  return { id: 'dataset', label: 'products', icon: <Database />, switcher: { label: 'Dataset', value: 'products', options: DATASETS, onValueChange: () => {}, action: { label: 'New dataset', onSelect: () => {} } } };
}

/** The team switcher on its own, for the brand cell and the top right: a ghost trigger, as the
 *  crumb's is, with the team's icon and the caret. */
function TeamSwitcher({ compact }: { compact?: boolean }) {
  return (
    <Breadcrumbs size="micro" className={compact ? styles.switcherCompact : undefined} items={[teamCrumb()]} />
  );
}

function Brand({ chip, variant }: { chip: boolean; variant: Variant }) {
  const head = variant === 'brand-head';
  return (
    <div className={`${styles.brand} ${head ? styles.brandHead : ''}`}>
      <Button variant="ghost" size="micro" iconLeft={<Indx />} className={styles.brandLink} aria-label="Indx" />
      {chip && <Chip>Free</Chip>}
      {(variant === 'brand' || variant === 'brand-column' || head) && <TeamSwitcher compact />}
    </div>
  );
}

/** The account cluster. Compact (the small frames, and a phone): icons only, as the console does under 768px. */
function RightSlot({ variant, compact }: { variant: Variant; compact?: boolean }) {
  return (
    <div className={styles.right}>
      {variant === 'right' && <TeamSwitcher />}
      {variant === 'right' && <span className={styles.rightDivider} />}
      <Button variant="ghost" size="micro" iconLeft={<Shield />} aria-label="Admin">{compact ? null : 'Admin'}</Button>
      <Button variant="ghost" size="micro" iconLeft={<Bell />} aria-label="Notifications" />
      <Button variant="ghost" size="micro" iconLeft={<User />} aria-label="anders">{compact ? null : 'anders'}</Button>
      <Button variant="ghost" size="micro" iconLeft={<Observr />} className={styles.agent} aria-label="Agent">{compact ? null : 'Agent'}</Button>
    </div>
  );
}

const DATASET_GROUPS = [
  { title: 'Overview', items: ['Status', 'Statistics'] },
  { title: 'Data', items: ['Field configuration'] },
  { title: 'Relevance', items: ['Query parameters', 'Boost rules', 'Synonyms'] },
  { title: 'Try it', items: ['Search preview', 'Search or ask'] },
  { title: 'Settings', items: ['Options'] },
];
const TEAM_GROUPS = [{ title: 'Team', items: ['Datasets', 'Observr', 'Manage team'] }];

function Column({ groups, active, head }: { groups: typeof DATASET_GROUPS; active: string; head?: boolean }) {
  return (
    <nav className={`${styles.column} ${head ? styles.columnHead : ''}`} aria-label="Sections">
      {groups.map(g => (
        <div key={g.title} className={styles.group}>
          <div className={styles.groupTitle}>{g.title}</div>
          {g.items.map(i => (
            <Button key={i} variant={i === active ? 'primary' : 'ghost'} size="micro" className={styles.item} iconLeft={<Database />}>{i}</Button>
          ))}
        </div>
      ))}
    </nav>
  );
}

function Cards() {
  return (
    <div className={styles.cards}>
      {['products', 'pokedex', 'ecom', 'bestbuy'].map(n => (
        <div key={n} className={styles.card}>
          <span className={styles.cardHead}><Database size={14} color="currentColor" /> {n}</span>
          <div className={styles.cardBars}><div className={styles.bar} style={{ width: '70%' }} /><div className={styles.bar} style={{ width: '50%' }} /></div>
          <span className={styles.cardFoot}><Chip color="var(--CTeal)" textColor="#080809">Ready</Chip><span>801 documents</span></span>
        </div>
      ))}
    </div>
  );
}

function Placeholder() {
  return (
    <div className={styles.placeholder}>
      <div className={styles.bar} style={{ width: '62%' }} />
      <div className={styles.bar} style={{ width: '48%' }} />
      <div className={styles.block} />
    </div>
  );
}

/** One page in a frame: the header on the grid, the column where the variant has one, the content. */
function Frame({ variant, page, compact }: { variant: Variant; page: 'team' | 'dataset'; compact?: boolean }) {
  const inBrand = variant === 'brand' || variant === 'brand-column' || variant === 'brand-head';
  const teamColumn = page === 'team' && (variant === 'brand-column' || variant === 'brand-head');
  const column = page === 'dataset' || teamColumn;
  const head = variant === 'brand-head';

  const crumbs: BreadcrumbItem[] = [];
  if (variant === 'trail' || variant === 'trail-page') crumbs.push(teamCrumb());
  if (page === 'dataset') crumbs.push(datasetCrumb());
  else if (variant === 'trail-page' || inBrand || variant === 'right') crumbs.push({ id: 'page', label: 'Datasets', icon: inBrand || variant === 'right' ? <Database /> : undefined });

  return (
    <div className={styles.frame}>
      <div className={styles.frameLabel}>{page === 'team' ? 'Team page' : 'Dataset page'}</div>
      <header className={`${styles.header} ${head ? styles.headerHead : ''}`}>
        <Brand chip={!inBrand} variant={variant} />
        <div className={styles.headerMain}>
          <div className={styles.trail}>
            {crumbs.length > 0 && <Breadcrumbs size="micro" items={crumbs} />}
            {page === 'dataset' && <Chip color="var(--CTeal)" textColor="#080809">Ready</Chip>}
          </div>
          <RightSlot variant={variant} compact={compact} />
        </div>
      </header>
      <div className={`${styles.body} ${column ? styles.bodyColumn : ''}`}>
        {column && (
          page === 'dataset'
            ? <Column groups={DATASET_GROUPS} active="Statistics" head={head} />
            : <Column groups={TEAM_GROUPS} active="Datasets" head={head} />
        )}
        <main className={styles.content}>
          {page === 'team' ? (
            <>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>Datasets</h2>
                {!teamColumn && (
                  <div className={styles.actions}>
                    <Button variant="primary" size="micro">New dataset</Button>
                    <Button variant="secondary" size="micro" iconLeft={<Observr />}>Observr</Button>
                    <Button variant="secondary" size="micro" iconLeft={<Users />}>Manage team</Button>
                  </div>
                )}
                {teamColumn && <Button variant="primary" size="micro">New dataset</Button>}
              </div>
              <Cards />
            </>
          ) : (
            <>
              <div className={styles.contextBar}>
                <Tabs size="micro" value="queries" onValueChange={() => {}} items={[{ label: 'Top queries', value: 'queries' }, { label: 'Fuzzy search', value: 'fuzzy' }, { label: 'Top documents', value: 'documents' }]} />
                <Tabs size="micro" variant="button" value="30" onValueChange={() => {}} items={[{ label: '7 days', value: '7' }, { label: '30 days', value: '30' }]} />
              </div>
              <Placeholder />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ConsoleShellMockup() {
  const [variant, setVariant] = useState<Variant>('brand');
  const v = VARIANTS.find(x => x.value === variant)!;
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Console shell: where the team lives</h1>
        <p className={styles.desc}>
          The console works with one team at a time. Today the team switcher is the first crumb of the trail, at the
          content's edge: right on the dataset page (team › dataset), alone on the team page. Each variant below is
          shown as the team page and the dataset page.
        </p>
        <Tabs size="micro" variant="button" scrollable value={variant} onValueChange={v => setVariant(v as Variant)}
          items={VARIANTS.map(x => ({ label: x.label, value: x.value }))} />
        <p className={styles.note}>{v.about}</p>
      </div>
      <div className={styles.pair}>
        <Frame variant={variant} page="team" />
        <Frame variant={variant} page="dataset" />
      </div>
      <div className={styles.section}>
        <h2 className={styles.subTitle}>All variants, team page only</h2>
        <p className={styles.note}>The page that tells them apart, in a row.</p>
        <div className={styles.all}>
          {VARIANTS.map(x => (
            <div key={x.value} className={styles.allItem}>
              <div className={styles.allLabel}>{x.label}</div>
              <Frame variant={x.value} page="team" compact />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
