import { useState, type ReactNode } from 'react';
import { AssistantMessage, Breadcrumbs, Button, ChatPanel, Chip, Composer, Select, Suggestions, Tabs, UserMessage, type TabItem } from '@indxsearch/systm';
import {
  Bell, Boost, Coverage, Database, Field, Indx, Fuzzy_search, Graph, Internet_browser, Lab_experiment, Observr, Search,
  Search_or_ask, Search_query, Sliders_horizontal, Sort_ascending, Status, Synonym, Update, User, Users,
} from '@indxsearch/pixl';
import { RecordsBrowser } from './records';
import styles from './page.module.css';

// A mockup: IndxServer's dataset page with a vertical side menu, so the horizontal bar above the
// content can be contextual, the views of the section that is open. Today the page has one row of
// nine tabs and the sections that need views (Statistics, Query parameters, Search or ask) nest
// a second row inside. Nothing here talks to a server.

interface Section {
  id: string;
  label: string;
  icon: ReactNode;
  /** One line under the title: what the section is for. */
  about: string;
  /** The contextual bar. A section with one view has none. */
  views: TabItem[];
  /** Shown at the end of the contextual bar. */
  end?: ReactNode;
  /** Needs a built index: disabled while the dataset sleeps. */
  needsIndex?: boolean;
  experimental?: boolean;
}
interface Group { title: string; sections: Section[] }

const PERIOD = [
  { label: '7 days', value: '7' },
  { label: '30 days', value: '30' },
  { label: '90 days', value: '90' },
];

const GROUPS: Group[] = [
  {
    title: 'Overview',
    sections: [
      { id: 'status', label: 'Status', icon: <Status />, about: 'Whether the dataset is up, how big it is and what it costs to keep.',
        views: [{ label: 'Index', value: 'index' }, { label: 'Usage', value: 'usage' }, { label: 'Last error', value: 'error' }] },
      { id: 'statistics', label: 'Statistics', icon: <Graph />, about: 'What visitors search for, what they open, and what changed.',
        views: [
          { label: 'Top queries', value: 'queries', icon: <Search_query /> },
          { label: 'Fuzzy search', value: 'fuzzy', icon: <Fuzzy_search /> },
          { label: 'Top documents', value: 'documents', icon: <Sort_ascending /> },
          { label: 'Search or ask', value: 'ask', icon: <Search_or_ask /> },
          { label: 'Browsing', value: 'browsing', icon: <Internet_browser /> },
          { label: 'Changes', value: 'changes', icon: <Update />, badge: '3', badgeTone: 'info' },
        ],
        end: 'period' },
    ],
  },
  {
    title: 'Data',
    sections: [
      { id: 'fields', label: 'Fields', icon: <Field />, about: 'Which fields are searched, filtered, faceted and sorted, and how much each weighs.',
        views: [{ label: 'Fields', value: 'fields' }, { label: 'Import and export', value: 'files' }, { label: 'Review my setup', value: 'review', icon: <Observr /> }] },
      { id: 'records', label: 'Records', icon: <Database />, about: 'The data itself: browse it as stored, replace it, download it, or hand the dataset to another team.',
        views: [{ label: 'Browse', value: 'browse' }, { label: 'Replace', value: 'replace' }, { label: 'Download', value: 'download' }, { label: 'Transfer', value: 'transfer' }] },
    ],
  },
  {
    title: 'Relevance',
    sections: [
      { id: 'query', label: 'Query parameters', icon: <Coverage />, about: 'How a search matches and how long the result list is.',
        views: [{ label: 'Matching', value: 'matching' }, { label: 'Result list', value: 'results' }, { label: 'Advanced', value: 'advanced' }] },
      { id: 'boosts', label: 'Boost rules', icon: <Boost />, about: 'Lift or lower records that match a condition, now or on a schedule.', needsIndex: true,
        views: [{ label: 'All rules', value: 'all' }, { label: 'Active now', value: 'active' }, { label: 'Scheduled', value: 'scheduled' }] },
      { id: 'synonyms', label: 'Synonyms', icon: <Synonym />, about: 'Words that should find each other.', needsIndex: true, views: [] },
    ],
  },
  {
    title: 'Try it',
    sections: [
      { id: 'preview', label: 'Search preview', icon: <Search />, about: 'Search the dataset as a visitor would.', needsIndex: true, views: [] },
      { id: 'ask', label: 'Search or ask', icon: <Search_or_ask />, about: 'Answer questions typed into the search field from the records.', experimental: true,
        views: [{ label: 'Settings', value: 'settings' }, { label: 'What the judge sees', value: 'judge' }, { label: 'When to offer', value: 'offer' }, { label: 'Try it', value: 'try' }] },
    ],
  },
  {
    title: 'Settings',
    sections: [
      { id: 'options', label: 'Options', icon: <Sliders_horizontal />, about: 'Description, keep-alive and how statistics are kept.',
        views: [{ label: 'General', value: 'general' }, { label: 'Keep-alive', value: 'keepalive' }, { label: 'Statistics', value: 'statistics' }, { label: 'Delete', value: 'delete' }] },
    ],
  },
];
const ALL = GROUPS.flatMap(g => g.sections);

/** The side menu: groups of ghost Buttons straight on the page, the open one a primary Button, as
 *  the active tab is today (Tabs variant="button"). */
function SideMenu({ open, onOpen, asleep }: { open: string; onOpen: (id: string) => void; asleep: boolean }) {
  return (
    <nav className={styles.side} aria-label="Dataset">
      {GROUPS.map(g => (
        <div key={g.title} className={styles.group}>
          <div className={styles.groupTitle}>{g.title}</div>
          {g.sections.map(s => {
            const off = asleep && !!s.needsIndex;
            return (
              <Button key={s.id} variant={open === s.id ? 'primary' : 'ghost'} size="micro" iconLeft={s.icon as never}
                className={styles.item}
                aria-current={open === s.id ? 'page' : undefined}
                disabled={off} title={off ? 'Wake the dataset first' : undefined}
                onClick={() => onOpen(s.id)}>
                {s.label}
                {s.experimental && <Lab_experiment size={14} color="currentColor" />}
              </Button>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/** Stand-in content: a few bars where the view would be. */
function Placeholder({ section, view }: { section: Section; view?: TabItem }) {
  return (
    <div className={styles.placeholder}>
      <div className={styles.placeholderLabel}>{section.label}{view ? ` › ${view.label}` : ''}</div>
      <div className={styles.bar} style={{ width: '62%' }} />
      <div className={styles.bar} style={{ width: '48%' }} />
      <div className={styles.block} />
      <div className={styles.bar} style={{ width: '38%' }} />
    </div>
  );
}

/** The side column's foot: notifications and the account, out of the header. */
function AccountCorner() {
  return (
    <div className={styles.corner}>
      <Button variant="ghost" size="micro" iconLeft={<Bell />} className={styles.item}>Notifications</Button>
      <Button variant="ghost" size="micro" iconLeft={<User />} className={styles.item}>Account</Button>
    </div>
  );
}

/** The agent: Observr as a general chat about this dataset, in a panel at the right. */
function AgentPanel({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState('');
  const [asked, setAsked] = useState<string[]>([]);
  const ask = (q: string) => { setAsked(a => [...a, q]); setDraft(''); };
  return (
    <aside className={styles.agent} aria-label="Agent">
      <ChatPanel className={styles.agentChat} hints={false}
        header={
          <div className={styles.agentHead}>
            <span className={styles.agentTitle}><Observr size={14} color="currentColor" /> Agent</span>
            <Button variant="ghost" size="micro" onClick={onClose}>Close</Button>
          </div>
        }
        composer={<Composer value={draft} onChange={setDraft} onSend={ask} placeholder="Ask about products…" icon={null} />}>
        <AssistantMessage label="Observr" icon={<Observr size={14} color="currentColor" />}>
          I watch products: its searches, its setup and what changed. Ask me about any of it.
        </AssistantMessage>
        {asked.length === 0 && (
          <Suggestions label="Try asking" onPick={ask} items={[
            'Why do searches for "sofa" find so little?',
            'What changed since last week?',
            'Is my field setup sensible?',
          ]} />
        )}
        {asked.map((q, i) => (
          <div key={i} className={styles.agentTurn}>
            <UserMessage>{q}</UserMessage>
            <AssistantMessage label="Observr" icon={<Observr size={14} color="currentColor" />}>
              (A mockup: the answer would come here, with links into the sections it is about.)
            </AssistantMessage>
          </div>
        ))}
      </ChatPanel>
    </aside>
  );
}

function DatasetPageMock({ asleep }: { asleep: boolean }) {
  const [open, setOpen] = useState('statistics');
  const [agent, setAgent] = useState(false);
  const [views, setViews] = useState<Record<string, string>>({});
  const [period, setPeriod] = useState('30');
  const section = ALL.find(s => s.id === open)!;
  const view = views[open] ?? section.views[0]?.value;

  return (
    <div className={styles.frame}>
      {/* On the body's grid: the brand over the side menu, the breadcrumb at the content's edge. */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <Button variant="ghost" size="micro" iconLeft={<Indx />} className={styles.brandLink}>indx</Button>
          <Chip>Pro</Chip>
        </div>
        <div className={styles.headerMain}>
          <div className={styles.topStart}>
            <Breadcrumbs size="micro" items={[
              { id: 'team', label: 'Acme', icon: <Users /> },
              { id: 'dataset', label: 'products', icon: <Database /> },
            ]} />
            <Chip>{asleep ? 'Hibernated' : 'Ready'}</Chip>
          </div>
          <Button variant={agent ? 'primary' : 'ghost'} size="micro" iconLeft={<Observr />} className={`${styles.agentButton} ${agent ? '' : styles.agentGhost}`}
            aria-expanded={agent} onClick={() => setAgent(a => !a)}>Agent</Button>
        </div>
      </header>

      <div className={`${styles.body} ${agent ? styles.withAgent : ''}`}>
        <div className={styles.sideColumn}>
          <SideMenu open={open} onOpen={setOpen} asleep={asleep} />
          <AccountCorner />
        </div>

        {/* Narrow screens: the side menu folds into one select over the content. */}
        <div className={styles.narrowMenu}>
          <Select size="micro" aria-label="Section" value={open} onValueChange={setOpen}
            options={GROUPS.flatMap(g => g.sections.map(s => ({ label: `${g.title} · ${s.label}`, value: s.id })))} />
        </div>

        <main className={styles.content}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{section.label}</h2>
            {section.experimental && <Chip icon={<Lab_experiment />}>Experimental</Chip>}
          </div>
          <p className={styles.about}>{section.about}</p>

          {section.views.length > 0 && (
            <div className={styles.contextBar}>
              <Tabs items={section.views} value={view!} onValueChange={v => setViews(m => ({ ...m, [open]: v }))} size="micro" scrollable />
              {section.end === 'period' && (
                <div className={styles.contextEnd}>
                  <Tabs items={PERIOD} value={period} onValueChange={setPeriod} size="micro" variant="button" />
                </div>
              )}
            </div>
          )}

          {open === 'records' && view === 'browse'
            ? <RecordsBrowser />
            : <Placeholder section={section} view={section.views.find(v => v.value === view)} />}
        </main>

        {agent && <AgentPanel onClose={() => setAgent(false)} />}
      </div>
    </div>
  );
}

// A test row: the Observr look at four strengths, each closed (ghost) and open (primary).
const STRENGTHS = [
  { label: 'Weaker', className: styles.weaker },
  { label: 'Default', className: '' },
  { label: 'Stronger', className: styles.stronger },
];

function AgentStrengths() {
  return (
    <div className={styles.strengths}>
      {STRENGTHS.map(x => (
        <div key={x.label} className={`${styles.strength} ${x.className}`}>
          <div className={styles.strengthButtons}>
            <Button variant="ghost" size="micro" iconLeft={<Observr />} className={`${styles.agentButton} ${styles.agentGhost}`}>Agent</Button>
            <Button variant="primary" size="micro" iconLeft={<Observr />} className={styles.agentButton}>Agent</Button>
          </div>
          <span className={styles.strengthLabel}>{x.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function DatasetPageMockup() {
  const [state, setState] = useState('ready');
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Dataset page</h1>
        <p className={styles.desc}>
          IndxServer's dataset page with its sections in a grouped side menu, so the bar over the content can be
          contextual: the views of the open section. Today the nine sections share one row of tabs, and Statistics,
          Query parameters and Search or ask nest a second row inside theirs.
        </p>
        <p className={styles.note}>
          Moved in this mockup: Replace, Download and Transfer from Options to their own <b>Records</b> section, which opens on a read-only browser of the stored records, and
          switching Search or ask on from Options to its own section. Sections that need a built index are disabled
          while the dataset sleeps. Narrower than 760px the side menu folds into a select. Agent, at the top right, opens
          Observr as a chat about the dataset in a panel at the right; notifications and the account sit at the foot
          of the side column.
        </p>
        <div className={styles.controls}>
          <Tabs items={[{ label: 'Ready', value: 'ready' }, { label: 'Hibernated', value: 'asleep' }]} value={state} onValueChange={setState} size="micro" variant="button" />
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.subTitle}>Agent button: strengths</h2>
        <p className={styles.note}>The Observr look (the 1px checkerboard and a 2x2 lv8 pixel in each corner) at three strengths, closed and open.</p>
        <AgentStrengths />
      </div>
      <DatasetPageMock asleep={state === 'asleep'} />

    </main>
  );
}
