import { useState, type ReactElement } from 'react';
import {
  Alert, AlertDescription, AlertTitle, Breadcrumbs, Button, Chip, EmptyState, Kbd, Popover,
  SegmentedControl, Sidebar, StepProgress, type BreadcrumbItem, type SidebarGroup,
} from '@indxsearch/systm';
import {
  Bell, Check, Chevron_right, Circle, Database, Document_or_file, Field, Finish_flag, Graph, Indx, Key, Observr,
  Rocket, Search, Search_or_ask, Synonym, User, User_plus, Users,
} from '@indxsearch/pixl';
import styles from './page.module.css';

// A mockup: "Get started" for IndxServer (Nov 2026), after a checklist pattern seen elsewhere: a
// card at the foot of the side column with the progress, opening a panel of steps in groups.
// Two lists: the first user on a new server or an empty team sets search up; someone invited to a
// team that has datasets finds their way, by role. The plan decides the rest: Search or ask and
// Observr are Pro, and become steps there; without Pro the first user's list ends in a small
// teaser for it, and Managed Free (one user) has no Invite step. A step is done by what has
// happened, not by a click on it; here a
// click stands in for doing it. Nothing talks to a server.

type Who = 'first' | 'editor' | 'viewer';
type Plan = 'selfhost' | 'free' | 'pro';
type Icon = ReactElement<{ size?: string | number; color?: string }>;

interface Step {
  key: string;
  title: string;
  line: string;
  icon: Icon;
  /** What makes it done in the console: shown under the mockup, not in the panel. */
  doneWhen: string;
  /** A Pro feature, shown with its chip. */
  pro?: boolean;
}
interface Group { title: string; steps: Step[] }

const WHO = [
  { label: 'First user, new server', value: 'first' as Who },
  { label: 'Invited editor', value: 'editor' as Who },
  { label: 'Invited viewer', value: 'viewer' as Who },
];
const PLANS = [
  { label: 'Self-host', value: 'selfhost' as Plan },
  { label: 'Managed Free', value: 'free' as Plan },
  { label: 'Pro', value: 'pro' as Plan },
];

function groupsFor(who: Who, plan: Plan): Group[] {
  const pro = plan === 'pro';
  if (who === 'first') return [
    { title: 'Set up your search', steps: [
      { key: 'data', title: 'Add your data', line: 'Upload a JSON file, or start from a demo dataset.', icon: <Database />, doneWhen: 'The team has a dataset.' },
      { key: 'fields', title: 'Choose what to search', line: 'Pick the fields people search, filter and sort by.', icon: <Field />, doneWhen: 'A dataset is indexed with a saved field configuration.' },
      { key: 'try', title: 'Try a search', line: 'Type in the preview, typos and all.', icon: <Search />, doneWhen: 'The first search in Search preview.' },
    ] },
    { title: 'Put it to work', steps: [
      { key: 'connect', title: 'Connect your site', line: 'Make an API key and put the search box on your page.', icon: <Key />, doneWhen: 'The first search from outside the console: one made with an API key, not from the preview. A key made and never used does not count.' },
      ...(plan !== 'free' ? [{ key: 'invite', title: 'Invite your team', line: 'Bring in the people who tune the search with you.', icon: <User_plus />, doneWhen: 'Another member, or an invite waiting. Not on Managed Free, which has one user.' }] : []),
    ] },
    ...(pro ? [{ title: 'Answer and observe', steps: [
      { key: 'soa', title: 'Answer questions', line: 'Search or ask writes answers from your records when a visitor asks.', icon: <Search_or_ask />, pro: true, doneWhen: 'Search or ask switched on for a dataset.' },
      { key: 'observr', title: 'Let Observr watch', line: 'A weekly look at what visitors could not find, and what to change.', icon: <Observr />, pro: true, doneWhen: 'Observr switched on for a dataset.' },
    ] }] : []),
  ];
  const editor = who === 'editor';
  return [
    { title: 'Find your way', steps: [
      { key: 'open', title: 'Open a dataset', line: 'Status, statistics and settings, one dataset at a time.', icon: <Database />, doneWhen: 'The first dataset opened.' },
      { key: 'try', title: 'Try a search', line: 'See what visitors see, in the preview.', icon: <Search />, doneWhen: 'The first search in Search preview.' },
    ] },
    editor
      ? { title: 'Make it better', steps: [
          { key: 'tune', title: 'Add a synonym or a boost rule', line: 'Teach search the words your visitors use, or lift what should come first.', icon: <Synonym />, doneWhen: 'The user saved a synonym, a boost rule or a field change.' },
          ...(pro ? [{ key: 'soa-try', title: 'Ask a question', line: 'Try Search or ask on a dataset, as a visitor would.', icon: <Search_or_ask />, pro: true, doneWhen: 'A question asked in the Search or ask tester.' }] : []),
        ] }
      : { title: 'Follow along', steps: [
          { key: 'stats', title: 'See what people search for', line: 'The searches, what they found and what was chosen.', icon: <Graph />, doneWhen: 'Statistics opened.' },
        ] },
  ];
}

const allSteps = (groups: Group[]) => groups.flatMap(g => g.steps);

/** The groups as parts: a bar per group, as wide as its steps and filled by its own done. */
const partsOf = (groups: Group[], done: Set<string>) =>
  groups.map(g => ({ label: g.title, value: g.steps.filter(s => done.has(s.key)).length, max: g.steps.length }));

/** The teaser at the end of a first user's list without Pro: one card, not a step. */
function ProTeaser({ plan }: { plan: Plan }) {
  return (
    <div className={styles.teaser}>
      <span className={styles.teaserIcon}><Observr size={20} color="var(--lv8)" /></span>
      <span className={styles.teaserText}>
        <span className={styles.teaserTitle}>Add Pro to get Observr <Chip size="default">Pro</Chip></span>
        <span className={styles.stepLine}>
          Observr looks at your search every week and tells you what visitors could not find, and what to change. Pro also
          brings Search or ask{plan === 'free' ? ', your whole team, and no cap on documents' : ''}.
        </span>
        <span><Button variant="secondary" size="micro">See Pro</Button></span>
      </span>
    </div>
  );
}

/** The panel: the steps in their groups, the next one marked. */
function Panel({ who, plan, done, toggle, onHide }: {
  who: Who; plan: Plan; done: Set<string>; toggle: (k: string) => void; onHide?: () => void;
}) {
  const groups = groupsFor(who, plan);
  const steps = allSteps(groups);
  const next = steps.find(s => !done.has(s.key))?.key;
  const n = steps.filter(s => done.has(s.key)).length;
  return (
    <div className={styles.panel}>
      <div className={styles.panelHead}>
        <span className={styles.panelTitle}>Get started</span>
        <span className={styles.count}>{n} of {steps.length} done</span>
      </div>
      <p className={styles.panelLine}>
        {who === 'first' ? 'From your data to search on your site.' : 'Your way around Indx intern.'}
      </p>
      <StepProgress parts={partsOf(groups, done)} labels />
      {n === steps.length && (
        <EmptyState size="compact" icon={<Finish_flag />} title="You are set up"
                    actions={onHide && <Button variant="secondary" size="micro" onClick={onHide}>Hide Get started</Button>}>
          Everything here is done. Get started stays a click away under your account.
        </EmptyState>
      )}
      {groups.map(g => {
        return (
          <div key={g.title} className={styles.group}>
            <div className={styles.groupHead}>{g.title}</div>
            {g.steps.map(s => {
              const isDone = done.has(s.key), isNext = s.key === next;
              return (
                <button key={s.key} type="button" className={`${styles.step} ${isDone ? styles.stepDone : ''}`}
                        onClick={() => toggle(s.key)}>
                  <span className={`${styles.mark} ${isDone ? styles.markDone : ''}`}>
                    {isDone ? <Check size={14} color="var(--lv0)" /> : <Circle size={14} color={isNext ? 'var(--lv8)' : 'var(--lv4)'} />}
                  </span>
                  <span className={styles.stepText}>
                    <span className={styles.stepTitle}>
                      {s.title}
                      {isNext && <Chip size="default" color="var(--lv8)" textColor="var(--lv0)">Next</Chip>}
                      {s.pro && <Chip size="default">Pro</Chip>}
                    </span>
                    <span className={styles.stepLine}>{s.line}</span>
                  </span>
                  <Chevron_right size={14} color="var(--lv5)" />
                </button>
              );
            })}
          </div>
        );
      })}
      {who === 'first' && plan !== 'pro' && <ProTeaser plan={plan} />}
      {onHide && n < steps.length && (
        <div className={styles.panelFoot}>
          <Button variant="ghost" size="micro" onClick={onHide}>Hide for now</Button>
        </div>
      )}
    </div>
  );
}

/** The card at the foot of the column: the panel's trigger. Folded to a rail, a ring. */
function Card({ who, plan, done, collapsed }: { who: Who; plan: Plan; done: Set<string>; collapsed: boolean }) {
  const groups = groupsFor(who, plan);
  const steps = allSteps(groups);
  const n = steps.filter(s => done.has(s.key)).length;
  // Folded: a 30px button like the rail's others, the progress as a short row of cells under the icon.
  if (collapsed)
    return (
      <span className={styles.railButton} title={`Get started: ${n} of ${steps.length} done`}>
        <Rocket size={16} color="var(--lv8)" />
        <span className={styles.railSteps}><StepProgress parts={partsOf(groups, done)} weighted={false} height={2} /></span>
      </span>
    );
  return (
    <span className={styles.card}>
      <span className={styles.cardHead}>
        <Rocket size={16} color="var(--lv8)" />
        <span className={styles.cardTitle}>Get started</span>
        <span className={styles.count}>{n} of {steps.length}</span>
      </span>
      <StepProgress parts={partsOf(groups, done)} />
    </span>
  );
}

// ── The console ─────────────────────────────────────────────────────────────────────────────

const TEAM: SidebarGroup[] = [{ title: 'Indx intern', items: [
  { key: 'datasets', label: 'Datasets', icon: <Database /> },
  { key: 'observr', label: 'Observr', icon: <Observr /> },
  { key: 'keys', label: 'Team API keys', icon: <Key /> },
  { key: 'manage', label: 'Manage team', icon: <Users /> },
] }];
const CRUMBS: BreadcrumbItem[] = [{ id: 'team', label: 'indx-intern', icon: <Users /> }];

function Console({ who, plan, done, toggle, hidden, setHidden }: {
  who: Who; plan: Plan; done: Set<string>; toggle: (k: string) => void; hidden: boolean; setHidden: (h: boolean) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const getStarted = (
    <Popover open={open} onOpenChange={setOpen} side="right" align="end" sideOffset={8}
             trigger={<button type="button" className={styles.trigger}><Card who={who} plan={plan} done={done} collapsed={collapsed} /></button>}>
      <Panel who={who} plan={plan} done={done} toggle={toggle} onHide={() => { setHidden(true); setOpen(false); }} />
    </Popover>
  );
  const empty = who === 'first' && !done.has('data');
  return (
    <div className={styles.console}>
      <header className={styles.header}>
        <Button variant="ghost" size="micro" iconLeft={<Indx />} className={styles.brand}>Indx Server</Button>
        {plan === 'free' && <Chip>Free</Chip>}
        {plan === 'pro' && <Chip>Pro</Chip>}
        <span className={styles.trail}><Breadcrumbs size="micro" items={CRUMBS} /></span>
        <span className={styles.headerRight}>
          <span><Button variant="secondary" size="micro" iconLeft={<Search />} aria-label="Jump to"><Kbd>⌘K</Kbd></Button></span>
          <span><Button variant="ghost" size="micro" iconLeft={<Bell />} aria-label="Notifications" /></span>
          <Button variant="ghost" size="micro" iconLeft={<User />} aria-label="Account" />
          <span><Button variant="ghost" size="micro" iconLeft={<Observr />} aria-label="Agent">Agent</Button></span>
        </span>
      </header>
      <div className={styles.body}>
        <div className={styles.column}>
          {/* Folded, the rail hides the footer: the ring is the Sidebar's railFooter. */}
          <Sidebar groups={TEAM} active="datasets" footer={hidden ? undefined : getStarted} railFooter={hidden ? undefined : getStarted}
                   collapsed={collapsed} onCollapsedChange={setCollapsed} aria-label="Sections" />
        </div>
        <main className={styles.content}>
          <h2 className={styles.title}>Datasets</h2>
          {who !== 'first' && !done.has('open') && (
            <Alert variant="info">
              <AlertTitle>Welcome to Indx intern</AlertTitle>
              <AlertDescription>
                Anders invited you as {who === 'editor' ? 'an editor: you tune search, and do not manage keys or members' : 'a viewer: you can see everything and change nothing'}.
                Get started, at the foot of the column, shows the way.
              </AlertDescription>
            </Alert>
          )}
          {empty ? (
            <span>
              <EmptyState icon={<Database />} title="No datasets yet"
                          actions={<>
                            <Button variant="primary" size="micro" onClick={() => toggle('data')}>New dataset</Button>
                            <Button variant="secondary" size="micro" iconLeft={<Document_or_file />} onClick={() => toggle('data')}>Start from a demo</Button>
                          </>}>
                A dataset is a JSON file of your records: products, articles, people. Upload one, or try Indx on a demo first.
              </EmptyState>
            </span>
          ) : (
            <div className={styles.cards}>
              {['pokedex', 'tmdb23k', 'furniture'].slice(0, who === 'first' ? 1 : 3).map((n, i) => (
                <div key={n} className={styles.datasetCard}>
                  <Database size={16} color="var(--lv6)" /><span>{n}</span>
                  {i === 2 && <span className={styles.cardState}><Chip size="default" color="var(--CLightBlue)" textColor="#080809">Hibernated</Chip></span>}
                </div>
              ))}
            </div>
          )}
          {hidden && <Button variant="ghost" size="micro" onClick={() => setHidden(false)}>Show Get started again</Button>}
        </main>
      </div>
    </div>
  );
}

export default function GetStartedMockup() {
  const [who, setWho] = useState<Who>('first');
  const [plan, setPlan] = useState<Plan>('selfhost');
  const [done, setDone] = useState<Record<Who, Set<string>>>({ first: new Set(['data']), editor: new Set(), viewer: new Set() });
  const [hidden, setHidden] = useState(false);
  const toggle = (k: string) => setDone(d => {
    const s = new Set(d[who]);
    if (s.has(k)) s.delete(k); else s.add(k);
    return { ...d, [who]: s };
  });
  const groups = groupsFor(who, plan);
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Mockup: Get started</h1>
        <p className={styles.desc}>
          A checklist for someone new to IndxServer, at the foot of the side column.
          The first user on a new server sets search up; someone invited to a team finds their way, by role. The plan
          decides the rest: with Pro, Search or ask and Observr are steps; without it, the first user's list ends in a
          small teaser. In the console a step ticks itself off when it has happened; here a click on a step stands in.
        </p>
      </div>
      <div className={styles.controls}>
        <SegmentedControl items={WHO} value={who} onChange={v => { setWho(v); setHidden(false); }} size="default" aria-label="Who" />
        <SegmentedControl items={PLANS} value={plan} onChange={setPlan} size="default" aria-label="Plan" />
        <Button variant="ghost" size="micro" onClick={() => setDone(d => ({ ...d, [who]: new Set() }))}>Start over</Button>
        <Button variant="ghost" size="micro" onClick={() => setDone(d => ({ ...d, [who]: new Set(allSteps(groups).map(s => s.key)) }))}>Finish all</Button>
      </div>
      <div className={styles.frames}>
        <div className={styles.desktop}>
          <Console who={who} plan={plan} done={done[who]} toggle={toggle} hidden={hidden} setHidden={setHidden} />
        </div>
        <div className={styles.open}>
          <span className={styles.openLabel}>The panel, open</span>
          <Panel who={who} plan={plan} done={done[who]} toggle={toggle} />
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.subTitle}>When a step is done</h2>
        <ul className={styles.list}>
          {allSteps(groups).map(s => <li key={s.key}><strong>{s.title}:</strong> {s.doneWhen}</li>)}
        </ul>
      </div>
      <div className={styles.section}>
        <h2 className={styles.subTitle}>Notes</h2>
        <ul className={styles.list}>
          <li><strong>Which list:</strong> someone invited to a team that has datasets gets the invited list for their role; everyone else, the first. Accounts made before it ships see nothing.</li>
          <li><strong>The plan:</strong> Self-host and Managed Free have every core step; Managed Free has one user, so no Invite. Pro adds Answer and observe for the first user, and Ask a question for an editor. Without Pro the first user's list ends in one card: Add Pro to get Observr. Viewers and editors see no teaser, since they cannot buy it.</li>
          <li><strong>Connect your site</strong> is done by the first real search from outside the console, not by a key: a key can be made and never used.</li>
          <li><strong>The progress:</strong> StepProgress, nested: a bar per group, as wide as its steps and filled by its own done, labelled in the panel. Folded, the card is a 30px button with the icon over a small one (a 48px ring looked odd in the 50px rail). A BarMeter with a tick at each group's start was tried and read as a threshold.</li>
          <li><strong>Folded:</strong> the Sidebar's rail hides its footer and shows its railFooter instead (React and Blazor alike). A tour of the console, Show me around, was built and dropped: not worth the time it takes.</li>
          <li><strong>No green:</strong> done is the check in the ink on an ink disc; Next is an ink chip; Pro is a plain chip.</li>
        </ul>
      </div>
    </main>
  );
}
