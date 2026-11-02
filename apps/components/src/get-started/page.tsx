import { useEffect, useLayoutEffect, useRef, useState, type ReactElement, type RefObject } from 'react';
import {
  Alert, AlertDescription, AlertTitle, BarMeter, Breadcrumbs, Button, Chip, EmptyState, Kbd, Popover, ScoreMeter,
  SegmentedControl, Sidebar, type BreadcrumbItem, type SidebarGroup,
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
// teaser for it, and Managed Free (one user) has no Invite step. "Show me around" is a tour of
// the console, a stop at a time. A step is done by what has happened, not by a click on it; here a
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

const TOUR_STEP: Step = { key: 'tour', title: 'Show me around', line: 'Where everything is, in seven stops.', icon: <Rocket />, doneWhen: 'The tour finished or skipped.' };

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
      TOUR_STEP,
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

function Progress({ groups, done }: { groups: Group[]; done: Set<string> }) {
  const steps = allSteps(groups);
  const n = steps.filter(s => done.has(s.key)).length;
  // A zone in the ink at the start of each group after the first: its bar is a tick, so the bar
  // shows where one part ends and the next begins before either is reached.
  let at = 0;
  const zones = [{ from: 0, color: 'var(--lv8)' }];
  for (const g of groups.slice(0, -1)) { at += g.steps.length; zones.push({ from: at / steps.length, color: 'var(--lv8)' }); }
  return <BarMeter value={n} max={steps.length} zones={zones} format={v => `${v} done`} maxLabel={`of ${steps.length}`} />;
}

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
function Panel({ who, plan, done, toggle, onHide, onTour }: {
  who: Who; plan: Plan; done: Set<string>; toggle: (k: string) => void; onHide?: () => void; onTour?: () => void;
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
        {who === 'first' && onTour && <> <button type="button" className={styles.link} onClick={onTour}>Show me around</button></>}
      </p>
      <Progress groups={groups} done={done} />
      {n === steps.length && (
        <EmptyState size="compact" icon={<Finish_flag />} title="You are set up"
                    actions={onHide && <Button variant="secondary" size="micro" onClick={onHide}>Hide Get started</Button>}>
          Everything here is done. The steps and the tour stay a click away under your account.
        </EmptyState>
      )}
      {groups.map(g => {
        const gn = g.steps.filter(s => done.has(s.key)).length;
        return (
          <div key={g.title} className={styles.group}>
            <div className={styles.groupHead}>
              <span>{g.title}</span>
              {/* The group's own steps as cells, lit up to how many are done. */}
              <ScoreMeter value={gn / g.steps.length} cells={g.steps.length * 3} cell={5} aria-label={`${gn} of ${g.steps.length}`} />
            </div>
            {g.steps.map(s => {
              const isDone = done.has(s.key), isNext = s.key === next;
              return (
                <button key={s.key} type="button" className={`${styles.step} ${isDone ? styles.stepDone : ''}`}
                        onClick={() => s.key === 'tour' && onTour && !isDone ? onTour() : toggle(s.key)}>
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
  const steps = allSteps(groupsFor(who, plan));
  const n = steps.filter(s => done.has(s.key)).length;
  if (collapsed)
    return (
      <span className={styles.ringCard} title={`Get started: ${n} of ${steps.length} done`}>
        <BarMeter shape="ring" size={48} value={n} max={steps.length} format={v => `${v}/${steps.length}`} />
      </span>
    );
  return (
    <span className={styles.card}>
      <span className={styles.cardHead}>
        <Rocket size={16} color="var(--lv8)" />
        <span className={styles.cardTitle}>Get started</span>
        <span className={styles.count}>{n} of {steps.length}</span>
      </span>
      <ScoreMeter value={n / steps.length} cells={steps.length * 4} cell={4} aria-label={`${n} of ${steps.length} done`} />
    </span>
  );
}

// ── The tour ────────────────────────────────────────────────────────────────────────────────
// A stop at a time: the rest of the console dimmed, the part a stop is about outlined in the ink
// and left as it is, a small surface beside it with what it is, and Back, Next and Skip. No
// shadow, no glow: the dim and a 1px line.

interface Stop { target: string; title: string; text: (plan: Plan) => string; pro?: boolean }
const STOPS: Stop[] = [
  { target: 'column', title: 'Sections', text: () => 'Everything about the team, or the dataset you are in, is listed here. Fold it to icons with ⌘B.' },
  { target: 'trail', title: 'Where you are', text: () => 'The team, then the dataset. Click either to switch to another.' },
  { target: 'jump', title: 'Jump to', text: () => '⌘K finds any page, dataset or setting by its name.' },
  { target: 'datasets', title: 'Your datasets', text: () => 'Each card shows how a dataset is doing: ready, asleep or indexing. Open one to search it, tune it and read its statistics.' },
  { target: 'bell', title: 'Notifications', text: () => 'What happened while you were away: an index that finished, a webhook batch held back.' },
  { target: 'agent', title: 'Observr', pro: true, text: plan => plan === 'pro'
      ? 'Ask about your search in plain words, and read what Observr noticed this week.'
      : 'With Pro, ask about your search in plain words, and read what Observr noticed this week.' },
  { target: 'getstarted', title: 'Get started', text: () => 'Your checklist stays here until everything is done. The tour is under your account if you want it again.' },
];

function Tour({ root, plan, at, setAt, onEnd }: { root: RefObject<HTMLDivElement | null>; plan: Plan; at: number; setAt: (i: number) => void; onEnd: () => void }) {
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number; W: number; H: number } | null>(null);
  const stop = STOPS[at];
  useLayoutEffect(() => {
    const measure = () => {
      const r = root.current, el = r?.querySelector<HTMLElement>(`[data-tour="${stop.target}"]`);
      if (!r || !el) { setBox(null); return; }
      const a = r.getBoundingClientRect(), b = el.getBoundingClientRect();
      setBox({ x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height, W: a.width, H: a.height });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [root, stop.target]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onEnd(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onEnd]);
  if (!box) return null;
  const pad = 4, x = box.x - pad, y = box.y - pad, w = box.w + 2 * pad, h = box.h + 2 * pad;
  // Beside the column, under the header, otherwise under the part, kept inside the console.
  const right = box.x < 40 && box.y >= 40;
  const calloutW = 300;
  const left = right ? Math.min(x + w + 12, box.W - calloutW - 12) : Math.max(12, Math.min(x, box.W - calloutW - 12));
  const top = right ? Math.max(12, Math.min(y + h - 190, box.H - 200)) : Math.min(y + h + 12, box.H - 200);
  return (
    <div className={styles.tour} role="dialog" aria-label={`Tour: ${stop.title}`}>
      {/* The dim, as four pieces around the part, so the part itself is untouched. */}
      <div className={styles.dim} style={{ left: 0, top: 0, width: box.W, height: Math.max(0, y) }} />
      <div className={styles.dim} style={{ left: 0, top: y + h, width: box.W, height: Math.max(0, box.H - y - h) }} />
      <div className={styles.dim} style={{ left: 0, top: y, width: Math.max(0, x), height: h }} />
      <div className={styles.dim} style={{ left: x + w, top: y, width: Math.max(0, box.W - x - w), height: h }} />
      <div className={styles.outline} style={{ left: x, top: y, width: w, height: h }} />
      <div className={styles.callout} style={{ left, top, width: calloutW }}>
        <div className={styles.calloutHead}>
          <span className={styles.panelTitle}>{stop.title}</span>
          {stop.pro && plan !== 'pro' && <Chip size="default">Pro</Chip>}
          <span className={styles.spacer} />
          <span className={styles.count}>{at + 1} of {STOPS.length}</span>
        </div>
        <p className={styles.calloutText}>{stop.text(plan)}</p>
        <ScoreMeter value={(at + 1) / STOPS.length} cells={STOPS.length * 4} cell={4} aria-label={`Stop ${at + 1} of ${STOPS.length}`} />
        <div className={styles.calloutActions}>
          <Button variant="ghost" size="micro" onClick={onEnd}>Skip</Button>
          <span className={styles.spacer} />
          {at > 0 && <Button variant="secondary" size="micro" onClick={() => setAt(at - 1)}>Back</Button>}
          <Button variant="primary" size="micro" onClick={() => at + 1 < STOPS.length ? setAt(at + 1) : onEnd()}>
            {at + 1 < STOPS.length ? 'Next' : 'Done'}
          </Button>
        </div>
      </div>
    </div>
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

function Console({ who, plan, done, toggle, hidden, setHidden, tour, setTour }: {
  who: Who; plan: Plan; done: Set<string>; toggle: (k: string) => void; hidden: boolean; setHidden: (h: boolean) => void;
  tour: number | null; setTour: (t: number | null) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const startTour = () => { setOpen(false); setTour(0); };
  const getStarted = (
    <Popover open={open} onOpenChange={setOpen} side="right" align="end" sideOffset={8}
             trigger={<button type="button" className={styles.trigger} data-tour="getstarted"><Card who={who} plan={plan} done={done} collapsed={collapsed} /></button>}>
      <Panel who={who} plan={plan} done={done} toggle={toggle} onTour={startTour} onHide={() => { setHidden(true); setOpen(false); }} />
    </Popover>
  );
  const empty = who === 'first' && !done.has('data');
  return (
    <div className={styles.console} ref={root}>
      <header className={styles.header}>
        <Button variant="ghost" size="micro" iconLeft={<Indx />} className={styles.brand}>Indx Server</Button>
        {plan === 'free' && <Chip>Free</Chip>}
        {plan === 'pro' && <Chip>Pro</Chip>}
        <span className={styles.trail} data-tour="trail"><Breadcrumbs size="micro" items={CRUMBS} /></span>
        <span className={styles.headerRight}>
          <span data-tour="jump"><Button variant="secondary" size="micro" iconLeft={<Search />} aria-label="Jump to"><Kbd>⌘K</Kbd></Button></span>
          <span data-tour="bell"><Button variant="ghost" size="micro" iconLeft={<Bell />} aria-label="Notifications" /></span>
          <Button variant="ghost" size="micro" iconLeft={<User />} aria-label="Account" />
          <span data-tour="agent"><Button variant="ghost" size="micro" iconLeft={<Observr />} aria-label="Agent">Agent</Button></span>
        </span>
      </header>
      <div className={styles.body}>
        <div className={styles.column} data-tour="column">
          {/* Folded, the rail hides the footer: the ring is the Sidebar's railFooter. */}
          <Sidebar groups={TEAM} active="datasets" footer={hidden ? undefined : getStarted} railFooter={hidden ? undefined : getStarted}
                   collapsed={collapsed} onCollapsedChange={setCollapsed} aria-label="Sections" />
        </div>
        <main className={styles.content}>
          <h2 className={styles.title}>Datasets</h2>
          {who !== 'first' && !done.has('tour') && tour === null && (
            <Alert variant="info">
              <AlertTitle>Welcome to Indx intern</AlertTitle>
              <AlertDescription>
                Anders invited you as {who === 'editor' ? 'an editor: you tune search, and do not manage keys or members' : 'a viewer: you can see everything and change nothing'}.{' '}
                <button type="button" className={styles.link} onClick={startTour}>Show me around</button>
              </AlertDescription>
            </Alert>
          )}
          {empty ? (
            <span data-tour="datasets">
              <EmptyState icon={<Database />} title="No datasets yet"
                          actions={<>
                            <Button variant="primary" size="micro" onClick={() => toggle('data')}>New dataset</Button>
                            <Button variant="secondary" size="micro" iconLeft={<Document_or_file />} onClick={() => toggle('data')}>Start from a demo</Button>
                          </>}>
                A dataset is a JSON file of your records: products, articles, people. Upload one, or try Indx on a demo first.
              </EmptyState>
            </span>
          ) : (
            <div className={styles.cards} data-tour="datasets">
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
      {tour !== null && (
        <Tour root={root} plan={plan} at={tour} setAt={setTour} onEnd={() => { setTour(null); if (!done.has('tour')) toggle('tour'); }} />
      )}
    </div>
  );
}

export default function GetStartedMockup() {
  const [who, setWho] = useState<Who>('first');
  const [plan, setPlan] = useState<Plan>('selfhost');
  const [done, setDone] = useState<Record<Who, Set<string>>>({ first: new Set(['data']), editor: new Set(), viewer: new Set() });
  const [hidden, setHidden] = useState(false);
  const [tour, setTour] = useState<number | null>(null);
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
          A checklist for someone new to IndxServer, at the foot of the side column, and a tour of where everything is.
          The first user on a new server sets search up; someone invited to a team finds their way, by role. The plan
          decides the rest: with Pro, Search or ask and Observr are steps; without it, the first user's list ends in a
          small teaser. In the console a step ticks itself off when it has happened; here a click on a step stands in.
        </p>
      </div>
      <div className={styles.controls}>
        <SegmentedControl items={WHO} value={who} onChange={v => { setWho(v); setHidden(false); setTour(null); }} size="default" aria-label="Who" />
        <SegmentedControl items={PLANS} value={plan} onChange={setPlan} size="default" aria-label="Plan" />
        <Button variant="secondary" size="micro" iconLeft={<Rocket />} onClick={() => setTour(0)}>Show me around</Button>
        <Button variant="ghost" size="micro" onClick={() => setDone(d => ({ ...d, [who]: new Set() }))}>Start over</Button>
        <Button variant="ghost" size="micro" onClick={() => setDone(d => ({ ...d, [who]: new Set(allSteps(groups).map(s => s.key)) }))}>Finish all</Button>
      </div>
      <div className={styles.frames}>
        <div className={styles.desktop}>
          <Console who={who} plan={plan} done={done[who]} toggle={toggle} hidden={hidden} setHidden={setHidden} tour={tour} setTour={setTour} />
        </div>
        <div className={styles.open}>
          <span className={styles.openLabel}>The panel, open</span>
          <Panel who={who} plan={plan} done={done[who]} toggle={toggle} onTour={() => setTour(0)} />
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
          <li><strong>The tour:</strong> seven stops. The first step for someone invited, a link at the top of the first user's panel, and under the account menu any time. The rest dims, the part is outlined in the ink, Escape or Skip ends it, and finishing or skipping both tick the step.</li>
          <li><strong>The progress:</strong> the card's row of cells is ScoreMeter; the panel's BarMeter has a tick where each group starts (a zone in the ink); each group has its own cells; the tour has its own row; folded, the card is the 48px ring.</li>
          <li><strong>Folded:</strong> the Sidebar's rail hides its footer and shows its railFooter instead, here the ring (React and Blazor alike).</li>
          <li><strong>No green:</strong> done is the check in the ink on an ink disc; Next is an ink chip; Pro is a plain chip.</li>
        </ul>
      </div>
    </main>
  );
}
