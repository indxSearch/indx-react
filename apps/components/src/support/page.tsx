import { useState, type ReactNode } from 'react';
import {
  Button, Checkbox, Chip, Disclosure, InputField, Kbd, Modal, SegmentedControl, Sidebar, Table, TableHeader,
  TableRow, Tabs, Textarea, type SidebarGroup,
} from '@indxsearch/systm';
import {
  Bell, Database, Document_or_file, Indx, Lock, Mail, Observr, Plus, Search, Shield, Support, User, Users,
} from '@indxsearch/pixl';
import shell from '../console-sidebar/page.module.css';
import styles from './page.module.css';

// A mockup: support tickets (Notes/support-tickets-design.md). The customer writes and reads in
// IndxServer, from Support at the foot of the side column; we answer in the Portal, under Admin →
// Support, Queue. Email only notifies. The console frame is the Sidebar mockup's. Nothing here talks to a server.

type View = 'list' | 'new' | 'ticket' | 'queue' | 'staff';
type Plan = 'free' | 'pro' | 'managed';
type Status = 'us' | 'answered' | 'closed';

const VIEWS = [
  { label: 'Console: tickets', value: 'list' }, { label: 'Console: new ticket', value: 'new' },
  { label: 'Console: a ticket', value: 'ticket' }, { label: 'Portal: queue', value: 'queue' },
  { label: 'Portal: a ticket', value: 'staff' },
];
const PLANS = [{ label: 'Free', value: 'free' }, { label: 'Pro', value: 'pro' }, { label: 'Managed', value: 'managed' }];

/** What the plan promises, as the console says it above the list. */
const PROMISE: Record<Plan, string> = {
  free: 'On Free we answer when we can. Pro is answered within one business day.',
  pro: 'Pro: we answer within one business day.',
  managed: 'Managed: we answer within four business hours.',
};

const STATUS: Record<Status, { label: string; color: string; text: string }> = {
  us: { label: 'Waiting on us', color: 'var(--lv3)', text: 'var(--lv8)' },
  answered: { label: 'Answered', color: 'var(--lv8)', text: 'var(--lv0)' },
  closed: { label: 'Closed', color: 'var(--lv2)', text: 'var(--lv5)' },
};

function StatusChip({ status }: { status: Status }) {
  const s = STATUS[status];
  return <Chip color={s.color} textColor={s.text}>{s.label}</Chip>;
}

type Kind = 'support' | 'feature' | 'feedback';
const KINDS = [{ label: 'Support request', value: 'support' }, { label: 'Feature request', value: 'feature' }, { label: 'Feedback', value: 'feedback' }];
const KIND_LABEL: Record<Kind, string> = { support: 'Support', feature: 'Feature request', feedback: 'Feedback' };

const TICKETS: { id: number; subject: string; kind: Kind; status: Status; activity: string; by: string; unread?: boolean }[] = [
  { id: 1042, subject: 'Index fails after upgrading to 5.0.6', kind: 'support', status: 'answered', activity: '20 minutes ago', by: 'Kari Nordmann', unread: true },
  { id: 1039, subject: 'Webhook from Sanity held by the brake every night', kind: 'support', status: 'us', activity: '3 hours ago', by: 'Ola Hansen' },
  { id: 1031, subject: 'Export the statistics as CSV', kind: 'feature', status: 'us', activity: '4 days ago', by: 'Ola Hansen' },
  { id: 1021, subject: 'How do I weight the title above the description?', kind: 'support', status: 'closed', activity: '2 weeks ago', by: 'Kari Nordmann' },
];

/** /support belongs to no area, so the column is the active team's, none of it open. */
const TEAM: SidebarGroup[] = [{ title: 'nordvarer', items: [
  { key: 'datasets', label: 'Datasets', icon: <Database /> },
  { key: 'observr', label: 'Observr', icon: <Observr /> },
  { key: 'keys', label: 'API keys', icon: <Document_or_file /> },
  { key: 'manage', label: 'Manage team', icon: <Users /> },
] }];

/** The thread both sides read; internal notes only where the Portal draws it. */
const THREAD: { from: 'customer' | 'staff' | 'note'; who: string; when: string; body: string }[] = [
  { from: 'customer', who: 'Kari Nordmann', when: '3 hours ago', body: 'After upgrading to 5.0.6 the products dataset stops at "Indexing" and the log says the field configuration could not be read. Restarting does not help. Diagnostics are attached.' },
  { from: 'note', who: 'Anders', when: '2 hours ago', body: 'Same as #1031: the diagnostics show a field configuration saved by 4.x and never saved since.' },
  { from: 'staff', who: 'Anders, Indx', when: '20 minutes ago', body: 'Thanks, the diagnostics made this quick. The field configuration was saved by 4.x and 5.0.6 reads it differently. Open Field configuration and press Save without changes: that writes it in the new form, and the next index runs. A fix that reads the old form is in 5.0.7.' },
];

/** IndxServer's console around a page: the header, and the Admin column with Jump to at its top. */
function Console({ plan, children }: { plan: Plan; children: ReactNode }) {
  return (
    <div className={shell.console}>
      <header className={shell.header}>
        <div className={shell.brand}>
          <Button variant="ghost" size="micro" iconLeft={<Indx />} className={shell.brandLink} aria-label="Indx">Indx Server</Button>
          <Chip>{plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Managed'}</Chip>
        </div>
        <div className={shell.trail} />
        <div className={shell.right}>
          <Button variant="ghost" size="micro" iconLeft={<Shield />} aria-label="Admin" />
          <span className={styles.bell}><Button variant="ghost" size="micro" iconLeft={<Bell />} aria-label="Notifications: a reply from Indx" /><span className={styles.dot} /></span>
          <Button variant="ghost" size="micro" iconLeft={<User />} aria-label="kari" />
        </div>
      </header>
      <div className={shell.body}>
        <div className={shell.column}>
          {/* Support at the column's foot, above Collapse, on every page with a column, for the
              instance's admins and the editors and admins of a team; the badge counts new replies. */}
          <Sidebar groups={TEAM} aria-label="Sections" storageKey="mockup-support-sidebar"
                   header={<Button variant="secondary" size="micro" iconLeft={<Search />} className={styles.jump}><span className={styles.jumpLabel}>Jump to…</span><Kbd>⌘K</Kbd></Button>}
                   footer={<Button variant="primary" size="micro" iconLeft={<Support />} className={styles.supportLink} aria-current="page">
                     <span className={styles.jumpLabel}>Support</span><span className={styles.badge}>1</span></Button>} />
        </div>
        <main className={shell.content}>{children}</main>
      </div>
    </div>
  );
}

function TicketList({ plan, onOpen, onNew }: { plan: Plan; onOpen: () => void; onNew: () => void }) {
  return (
    <>
      <h2 className={shell.title}>Support</h2>
      <p className={styles.promise}>
        {PROMISE[plan]} {plan === 'free' && <Button variant="ghost" size="micro" className={styles.inline}>See Pro</Button>}
      </p>
      <div className={styles.toolbar}>
        <Button variant="primary" size="micro" iconLeft={<Plus />} onClick={onNew}>New ticket</Button>
        <span className={styles.count}>4 tickets</span>
      </div>
      <Table aria-label="Tickets">
        <TableHeader>
          <th>Subject</th><th>Kind</th><th>Status</th><th>Last activity</th><th>Written by</th>
        </TableHeader>
        <tbody>
          {TICKETS.map(t => (
            <TableRow key={t.id}>
              <td>
                <Button variant="ghost" size="micro" className={styles.subject} onClick={onOpen}>
                  {t.unread && <span className={styles.unread} aria-label="New reply" />}{t.subject}
                </Button>
              </td>
              <td className={styles.quiet}>{KIND_LABEL[t.kind]}</td>
              <td><StatusChip status={t.status} /></td>
              <td className={styles.quiet}>{t.activity}</td>
              <td className={styles.quiet}>{t.by}</td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </>
  );
}

/** One message of a thread. A staff note is the Portal's alone and says so. */
function Message({ m }: { m: typeof THREAD[number] }) {
  return (
    <article className={`${styles.message} ${m.from === 'staff' ? styles.fromStaff : ''} ${m.from === 'note' ? styles.note : ''}`}>
      <header className={styles.messageHead}>
        <span className={styles.who}>{m.from !== 'customer' && <Support size={14} />}{m.who}</span>
        {m.from === 'note' && <span className={styles.noteMark}><Lock size={12} /> Internal note, not shown to the customer</span>}
        <span className={styles.quiet}>{m.when}</span>
      </header>
      <p className={styles.body}>{m.body}</p>
    </article>
  );
}

function TicketThread({ onBack }: { onBack: () => void }) {
  return (
    <>
      <div><Button variant="ghost" size="micro" className={styles.back} onClick={onBack}>← Support</Button></div>
      <h2 className={shell.title}>Index fails after upgrading to 5.0.6</h2>
      <p className={styles.meta}><StatusChip status="answered" /><span className={styles.quiet}>#1042 · opened 3 hours ago by Kari Nordmann · diagnostics sent</span></p>
      <div className={styles.thread}>
        {THREAD.filter(m => m.from !== 'note').map((m, i) => <Message key={i} m={m} />)}
      </div>
      <Textarea label="Reply" rows={4} placeholder="Write a reply" />
      <div className={styles.actions}>
        <Button variant="primary" size="micro">Send reply</Button>
        <Button variant="secondary" size="micro">Mark solved</Button>
      </div>
      <p className={styles.quiet}>We email you when Indx answers, and the bell lights up here.</p>
    </>
  );
}

const DIAGNOSTICS = `{
  "indx": "5.0.6", "indxServer": "2.4.0", "edition": "SelfHost",
  "os": "Linux 6.8, x64", "runtime": ".NET 10.0.2", "memoryMb": { "used": 2140, "available": 7980 },
  "datasets": [
    { "name": "products", "state": "Indexing", "records": 182400, "scoring": "BM25F",
      "fields": { "searchable": 4, "filterable": 9, "facetable": 6, "sortable": 3 } }
  ],
  "settings": { "statistics": true, "searchOrAsk": false },
  "log": [ "12:04:11 error products: the field configuration could not be read (FormatException)" ]
}`;

function NewTicket({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  const [kind, setKind] = useState<Kind>('support');
  const [diagnostics, setDiagnostics] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  // The writer chooses what it is: a support request (the plan's promise, diagnostics), a feature
  // request or feedback (read by the team, answered when there is something to say).
  const subject = kind === 'feature' ? 'What would you like Indx to do?' : kind === 'feedback' ? 'What is it about?' : 'What is not working?';
  const label = kind === 'feature' ? 'Tell us more' : kind === 'feedback' ? 'Your feedback' : 'What happened';
  const hint = kind === 'feature' ? 'What you are trying to do, and what is in the way today'
    : kind === 'feedback' ? 'What works, what does not, what you would change' : 'What you did, what you expected, what you saw instead';
  return (
    <Modal open onOpenChange={o => { if (!o) onClose(); }} title="New ticket"
           description={kind === 'support' ? PROMISE[plan] : 'Read by the people who build Indx. We answer when there is something to say.'}>
      <div className={styles.form}>
        <SegmentedControl items={KINDS} value={kind} onChange={v => setKind(v as Kind)} stretch aria-label="Kind of ticket" />
        <InputField label="Subject" placeholder={subject} />
        <Textarea label={label} rows={6} placeholder={hint} />
        {kind === 'support' && <>
          {/* What is sent can be seen, quietly: a micro Show beside the box, as VS Code's issue reporter
              and Chrome's feedback form do, not a panel of its own. */}
          <div className={styles.diagRow}>
            <Checkbox label="Include diagnostics" checked={diagnostics} onChange={e => setDiagnostics(e.target.checked)} />
            <Button variant="ghost" size="micro" aria-expanded={showDiagnostics} onClick={() => setShowDiagnostics(s => !s)}>{showDiagnostics ? 'Hide' : 'Show'}</Button>
          </div>
          {showDiagnostics && <>
            <p className={styles.warn}>Versions, memory, your datasets' names, states and sizes, and the last warnings and errors in the log, with addresses and anything like a key masked. Never records or search text.</p>
            <pre className={styles.diag}>{DIAGNOSTICS}</pre>
          </>}
        </>}
        <p className={styles.warn}>Do not paste API keys, tokens or passwords: we never need them.</p>
        <div className={styles.actions}>
          <Button variant="primary" size="micro" iconLeft={<Mail />} onClick={onClose}>Send</Button>
          <Button variant="secondary" size="micro" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

/** The Portal's frame: its header and nav, Support open. */
function Portal({ children }: { children: ReactNode }) {
  return (
    <div className={shell.console}>
      <header className={shell.header}>
        <div className={shell.brand}><Button variant="ghost" size="micro" iconLeft={<Indx />} className={shell.brandLink}>Indx License Portal</Button></div>
        <nav className={styles.portalNav}>
          {['Licenses', 'Users', 'Support', 'Settings'].map(n => (
            <Button key={n} variant={n === 'Support' ? 'primary' : 'ghost'} size="micro">{n}</Button>
          ))}
        </nav>
        <div className={shell.right}><Button variant="ghost" size="micro" iconLeft={<User />} aria-label="anders" /></div>
      </header>
      <div className={shell.body}><main className={shell.content}>{children}</main></div>
    </div>
  );
}

const QUEUE: { id: number; subject: string; customer: string; plan: Plan; kind: Kind; status: Status; waiting: string; over?: boolean }[] = [
  { id: 1044, subject: 'Search slow since Monday', customer: 'Fjordbok AS', plan: 'managed', kind: 'support', status: 'us', waiting: '5 hours', over: true },
  { id: 1039, subject: 'Webhook from Sanity held by the brake every night', customer: 'Kari Nordmann, Nordvarer AS', plan: 'pro', kind: 'support', status: 'us', waiting: '3 hours' },
  { id: 1043, subject: 'Can I run Indx on a Raspberry Pi?', customer: 'jonas@example.com', plan: 'free', kind: 'support', status: 'us', waiting: '2 days' },
  { id: 1042, subject: 'Index fails after upgrading to 5.0.6', customer: 'Kari Nordmann, Nordvarer AS', plan: 'pro', kind: 'support', status: 'answered', waiting: '20 minutes' },
];

const PLAN_CHIP: Record<Plan, { label: string; color: string }> = {
  free: { label: 'Free', color: 'var(--lv2)' },
  pro: { label: 'Pro', color: 'var(--lv5)' },
  managed: { label: 'Managed', color: 'var(--lv8)' },
};

function Queue({ onOpen }: { onOpen: () => void }) {
  const [tab, setTab] = useState('queue');
  const [status, setStatus] = useState('open');
  return (
    <>
      <h2 className={shell.title}>Support</h2>
      <Tabs items={[{ label: 'Queue', value: 'queue' }, { label: 'Lookup', value: 'lookup' }]} value={tab} onValueChange={setTab} size="micro" aria-label="Support" />
      {tab === 'lookup'
        ? <p className={styles.quiet}>Today's Support lookup: a person by email, name or company, with their edition.</p>
        : <>
          <div className={styles.toolbar}>
            <SegmentedControl items={[{ label: 'Open', value: 'open' }, { label: 'Answered', value: 'answered' }, { label: 'Closed', value: 'closed' }, { label: 'All', value: 'all' }]}
                              value={status} onChange={setStatus} aria-label="Status" />
            <span className={styles.count}>3 waiting on us, 1 past its promise</span>
          </div>
          <Table aria-label="Queue">
            <TableHeader><th>Subject</th><th>Kind</th><th>Customer</th><th>Plan</th><th>Status</th><th>Waiting</th></TableHeader>
            <tbody>
              {QUEUE.filter(q => status === 'all' || (status === 'open' ? q.status !== 'closed' : q.status === status)).map(q => (
                <TableRow key={q.id}>
                  <td><Button variant="ghost" size="micro" className={styles.subject} onClick={onOpen}>{q.subject}</Button></td>
                  <td className={styles.quiet}>{KIND_LABEL[q.kind]}</td>
                  <td className={styles.quiet}>{q.customer}</td>
                  <td><Chip color={PLAN_CHIP[q.plan].color} textColor={q.plan === 'managed' ? 'var(--lv0)' : 'var(--lv8)'}>{PLAN_CHIP[q.plan].label}</Chip></td>
                  <td><StatusChip status={q.status} /></td>
                  <td className={q.over ? styles.over : styles.quiet} title={q.over ? 'Past the four business hours Managed is promised' : undefined}>{q.waiting}</td>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </>}
    </>
  );
}

function StaffTicket({ onBack }: { onBack: () => void }) {
  const [kind, setKind] = useState('reply');
  return (
    <>
      <div><Button variant="ghost" size="micro" className={styles.back} onClick={onBack}>← Queue</Button></div>
      <h2 className={shell.title}>Index fails after upgrading to 5.0.6</h2>
      <p className={styles.meta}><StatusChip status="answered" /><span className={styles.quiet}>#1042 · Pro when written · opened 3 hours ago</span></p>
      <div className={styles.staffGrid}>
        <div className={styles.staffMain}>
          <div className={styles.thread}>{THREAD.map((m, i) => <Message key={i} m={m} />)}</div>
          <SegmentedControl items={[{ label: 'Reply', value: 'reply' }, { label: 'Internal note', value: 'note' }]} value={kind} onChange={setKind} aria-label="Kind" />
          <Textarea rows={4} placeholder={kind === 'note' ? 'Only Indx sees this' : 'Kari gets it in the console and by email'} aria-label={kind === 'note' ? 'Internal note' : 'Reply'} />
          <div className={styles.actions}>
            <Button variant="primary" size="micro">{kind === 'note' ? 'Add note' : 'Send reply'}</Button>
            <Button variant="secondary" size="micro">Close ticket</Button>
          </div>
        </div>
        <aside className={styles.account}>
          <h3 className={styles.asideTitle}>Nordvarer AS</h3>
          <dl className={styles.facts}>
            <dt>Plan</dt><dd><Chip color="var(--lv5)" textColor="var(--lv8)">Pro</Chip> since 12 Mar 2026</dd>
            <dt>Written by</dt><dd>Kari Nordmann, kari@nordvarer.example</dd>
            <dt>Instances</dt><dd>prod-server, 5.0.6, seen 4 minutes ago<br />staging, 5.0.5, seen 2 days ago</dd>
            <dt>Tickets</dt><dd>3, the last two weeks ago</dd>
          </dl>
          <Disclosure summary="Diagnostics">
            <pre className={styles.diag}>{DIAGNOSTICS}</pre>
          </Disclosure>
        </aside>
      </div>
    </>
  );
}

export default function SupportMockup() {
  const [view, setView] = useState<View>('list');
  const [plan, setPlan] = useState<Plan>('pro');
  return (
    <main className={shell.main}>
      <div className={shell.section}>
        <h1 className={shell.pageTitle}>Mockup: support tickets</h1>
        <p className={shell.desc}>
          The customer writes and reads in IndxServer, from Support at the foot of the side column; we answer in the Portal,
          under Admin → Support, Queue. Email only notifies. The plan decides how fast we answer, not whether you can write. Design:
          Notes/support-tickets-design.md.
        </p>
      </div>
      <div className={shell.controls}>
        <SegmentedControl items={VIEWS} value={view} onChange={v => setView(v as View)} size="default" aria-label="View" />
        {(view === 'list' || view === 'new') && <SegmentedControl items={PLANS} value={plan} onChange={v => setPlan(v as Plan)} size="default" aria-label="Plan" />}
      </div>
      <div className={shell.frames}>
        <div className={`${shell.desktop} ${styles.tall}`}>
          {view === 'queue' || view === 'staff'
            ? <Portal>{view === 'queue' ? <Queue onOpen={() => setView('staff')} /> : <StaffTicket onBack={() => setView('queue')} />}</Portal>
            : <Console plan={plan}>
                {view === 'ticket'
                  ? <TicketThread onBack={() => setView('list')} />
                  : <TicketList plan={plan} onOpen={() => setView('ticket')} onNew={() => setView('new')} />}
              </Console>}
        </div>
      </div>
      {view === 'new' && <NewTicket plan={plan} onClose={() => setView('list')} />}
      <div className={shell.section}>
        <h2 className={shell.subTitle}>What the mockup decides, and what it leaves open</h2>
        <ul className={shell.list}>
          <li><strong>Where:</strong> Support sits at the foot of the side column, above Collapse, on every page that has a column, for the instance's admins and the editors and admins of any team; a viewer does not see it. The badge counts new replies, and the bell lights up as well. The page is /support, with the active team's column.</li>
          <li><strong>Who owns a ticket:</strong> the customer's account, through the licence token the instance already has. Everyone who sees the Support link, on every instance of that customer, sees the same tickets; Kari can take over Ola's.</li>
          <li><strong>The promise:</strong> said once, above the list and in the new-ticket dialog. Free can write too, and sees what Pro adds. The numbers are placeholders until decided.</li>
          <li><strong>Diagnostics:</strong> ticked by default, shown in full before sending, never records, search text, keys or addresses.</li>
          <li><strong>Statuses:</strong> Waiting on us, Answered, Closed. Answered is the one that wants the customer, so it is the strong chip.</li>
          <li><strong>The Portal:</strong> the queue by plan and wait, the wait in the signal red past its promise; the ticket with Reply or Internal note, and the account beside it. Today's lookup becomes a tab.</li>
          <li><strong>Open:</strong> the promises; whether the notification email carries the reply's text; how long closed tickets are kept; whether a non-admin can write.</li>
        </ul>
      </div>
    </main>
  );
}
