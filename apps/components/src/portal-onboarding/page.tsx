import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle, Button, Chip, CodeCopy, Disclosure, InputField, SegmentedControl, Table, TableHeader, Tabs } from '@indxsearch/systm';
import { Book, Check, Code, Download, External_link, Github, Key, Nuget, Server } from '@indxsearch/pixl';
import styles from './page.module.css';

// A mockup: onboarding in the License Portal (Nov 2026). Until now a new user picks a seat and lands
// on "Your Indx license", which offers a license file and nothing about where Indx itself is or how
// the license reaches it. Here the wizard asks how they will run Indx, and the page they land on
// leads with what to do next for that path. Three variants of that page; the wizard step is shared.

type Variant = 'checklist' | 'ours' | 'servers';
type Path = 'server' | 'library';

const ABOUT: Record<Variant, string> = {
  checklist: 'The way developer platforms do it: a numbered checklist across the page, each step with what to type, ticked off as it is done. The license details move to a narrow column beside it.',
  ours: "The page as it is today, two columns, with the left column's resources replaced by the steps for the chosen path. On the right the way the license reaches Indx comes first: a token for a server, the file for the library. Once done, the steps fold into one line that opens them again, and the servers card on the right becomes where tokens are made and revoked: for a server that is when its first fetch arrives, for the library when they say so, since the portal cannot see an application.",
  servers: "Built on what only the portal knows: which servers fetched this license and when, with the version each runs. Until one has, the page says how to connect one; for the library it is the file and how to use it.",
};

const FILE = 'acme-as.license';
// The server's own version line (2.x), which is what it sends when it fetches the license.
const LATEST = '2.0.0';

interface Fetched { label: string; ago: string; version: string; stale?: boolean }
const SERVERS: Fetched[] = [
  { label: 'prod-server', ago: '2 hours ago', version: '2.0.0' },
  { label: 'staging', ago: '9 days ago', version: '2.0.0-beta.2', stale: true },
];

export default function PortalOnboardingMockup() {
  // ?variant=checklist|ours|servers opens one, so each can be linked to.
  const [variant, setVariant] = useState<Variant>(() => {
    const asked = new URLSearchParams(window.location.search).get('variant');
    return asked === 'checklist' || asked === 'servers' ? asked : 'ours';
  });
  const choose = (v: string) => {
    setVariant(v as Variant);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.replaceState(null, '', url);
  };
  const [path, setPath] = useState<Path>('server');
  const [connected, setConnected] = useState(false);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Portal onboarding</h1>
        <p className={styles.desc}>
          How a new user of the License Portal finds out where Indx is, how to run it and how the license reaches it.
          A third wizard step asks how they will run Indx; the page they land on then leads with that path.
        </p>
      </div>

      <h2 className={styles.h2}>The new wizard step</h2>
      <p className={styles.note}>After the name and the seat. The answer is kept, and the page lets them switch.</p>
      <div className={styles.wizardFrame}><WizardStep path={path} setPath={setPath} /></div>

      <h2 className={styles.h2}>Where they land</h2>
      <Tabs value={variant} onValueChange={choose} items={[
        { label: 'A: A checklist', value: 'checklist' },
        { label: 'B: Our layout', value: 'ours' },
        { label: 'C: Your servers', value: 'servers' },
      ]} />
      <p className={styles.note}>{ABOUT[variant]}</p>
      <div className={styles.controls}>
        <span className={styles.faint}>Mock state</span>
        <SegmentedControl size="micro" aria-label="Path" value={path} onChange={v => setPath(v)}
          items={[{ value: 'server', label: 'Server' }, { value: 'library', label: 'Library' }]} />
        {path === 'server' && (
          <SegmentedControl size="micro" aria-label="Server connected" value={connected ? 'yes' : 'no'} onChange={v => setConnected(v === 'yes')}
            items={[{ value: 'no', label: 'No server yet' }, { value: 'yes', label: 'Two servers fetched' }]} />
        )}
      </div>

      <div className={styles.portal}>
        {variant === 'checklist' && <ChecklistVariant path={path} setPath={setPath} connected={connected} />}
        {variant === 'ours' && <OursVariant path={path} setPath={setPath} connected={connected} />}
        {variant === 'servers' && <ServersVariant path={path} setPath={setPath} connected={connected} />}
      </div>
    </main>
  );
}

// ── The wizard step ─────────────────────────────────────────────────────────────────────────────

function WizardStep({ path, setPath }: { path: Path; setPath: (p: Path) => void }) {
  const [unsure, setUnsure] = useState(false);
  const pick = (p: Path | 'unsure') => { setUnsure(p === 'unsure'); if (p !== 'unsure') setPath(p); };
  const card = (value: Path | 'unsure', title: string, desc: string, icon: React.ReactNode) => {
    const on = value === 'unsure' ? unsure : !unsure && path === value;
    return (
      <label className={`${styles.choice} ${on ? styles.choiceOn : ''}`}>
        <input type="radio" name="path" checked={on} onChange={() => pick(value)} />
        <span className={styles.choiceHead}>{icon}{title}</span>
        <span className={styles.choiceDesc}>{desc}</span>
      </label>
    );
  };
  return (
    <div className={styles.wizard}>
      <span className={styles.faint}>Step 3 of 3</span>
      <h3 className={styles.wizardTitle}>How will you run Indx?</h3>
      <p className={styles.wizardLead}>We will show you the steps for it. Both use the same license, and you can switch later.</p>
      <div role="radiogroup" aria-label="How you will run Indx" className={styles.choices}>
        {card('server', 'Indx server', 'Run Indx on your own machine or cloud, with a web console and an HTTP API for your site or app.', <Server size={14} />)}
        {card('library', '.NET library', 'Search inside your own .NET application with the IndxSearchLib package from NuGet.', <Nuget size={14} />)}
        {card('unsure', 'Not sure yet', 'Start with the server: it has everything, and nothing to write before you can search.', <Book size={14} />)}
      </div>
      <div className={styles.wizardActions}>
        <Button variant="ghost">Back</Button>
        <Button variant="primary">Continue</Button>
      </div>
    </div>
  );
}

// ── The steps, per path ─────────────────────────────────────────────────────────────────────────

interface Step { title: string; done: boolean; body: React.ReactNode }

function useSteps(path: Path, connected: boolean): Step[] {
  const [token, setToken] = useState<string | null>(null);
  if (path === 'server') return [
    {
      title: 'Install and run the server', done: connected,
      body: (
        <>
          <p className={styles.stepText}>You need the <a href="https://dotnet.microsoft.com/download/dotnet/10.0" target="_blank" rel="noreferrer">.NET 10 SDK</a>. Then:</p>
          <div className={styles.commands}>
            <CodeCopy code="git clone https://github.com/indxSearch/Indx" />
            <CodeCopy code="cd Indx" />
            <CodeCopy code="dotnet run" />
          </div>
          <p className={styles.stepText}>Open https://localhost:5001 and the first visit sets up your admin account and team. It runs without a license, with up to 100,000 documents in each dataset.</p>
        </>
      ),
    },
    {
      title: 'Connect your license', done: connected,
      body: (
        <>
          <p className={styles.stepText}>A token lets your server fetch this license, and a new one whenever it renews. Paste it in your server under Admin &gt; License, or set it as <code>Indx__LicenseToken</code>.</p>
          {token
            ? <CodeCopy code={token} />
            : <div><Button variant="primary" size="micro" iconLeft={<Key />} onClick={() => setToken('indx_lt_7f3a91c2e04b4d6e8a1f')}>Create a token</Button></div>}
          {token && <p className={styles.faint}>Copy it now: it is shown once.</p>}
        </>
      ),
    },
    {
      title: 'See it connected', done: connected,
      body: connected
        ? <p className={styles.stepText}>prod-server fetched your license 2 hours ago, running {LATEST}.</p>
        : <p className={styles.stepText}>Your server shows up here the first time it fetches the license, with the version it runs.</p>,
    },
  ];
  return [
    {
      title: 'Add the package', done: false,
      body: <CodeCopy code="dotnet add package IndxSearchLib" />,
    },
    {
      title: 'Download your license', done: false,
      body: (
        <>
          <div><Button variant="primary" size="micro" iconLeft={<Download />}>Download {FILE}</Button></div>
          <p className={styles.stepText}>Put it next to your application and give the engine its path. Without it each engine takes up to 100,000 documents.</p>
          <CodeCopy code={`var engine = new SearchEngine("${FILE}");`} />
        </>
      ),
    },
    {
      title: 'Load and search', done: false,
      body: <p className={styles.stepText}>Init, Load, Index, then Search: the <a href="https://docs.indx.co" target="_blank" rel="noreferrer">quickstart</a> walks through it with a sample dataset.</p>,
    },
  ];
}

function PathSwitch({ path, setPath }: { path: Path; setPath: (p: Path) => void }) {
  return (
    <SegmentedControl size="micro" aria-label="How you run Indx" value={path} onChange={setPath}
      items={[{ value: 'server', label: 'Server', icon: <Server size={14} /> }, { value: 'library', label: 'Library', icon: <Nuget size={14} /> }]} />
  );
}

function Resources() {
  return (
    <div className={styles.resources}>
      <a className={styles.resource} href="https://github.com/indxSearch/Indx" target="_blank" rel="noreferrer"><Github size={14} /><span>Indx server on GitHub</span><External_link size={14} /></a>
      <a className={styles.resource} href="https://www.nuget.org/packages/IndxSearchLib/" target="_blank" rel="noreferrer"><Nuget size={14} /><span>NuGet package</span><External_link size={14} /></a>
      <a className={styles.resource} href="https://docs.indx.co" target="_blank" rel="noreferrer"><Book size={14} /><span>Documentation</span><External_link size={14} /></a>
      <a className={styles.resource} href="https://www.skills.sh/indxsearch/skill-indx-search/indx-search" target="_blank" rel="noreferrer"><Code size={14} /><span>AI skill</span><External_link size={14} /></a>
    </div>
  );
}

function LicenseFacts() {
  return (
    <div className={styles.facts}>
      <span className={styles.faint}>Edition</span><span><Chip color="var(--CTeal)" textColor="#080809">Free Developer</Chip></span>
      <span className={styles.faint}>Name</span><span>Kari Nordmann</span>
      <span className={styles.faint}>Company</span><span>Acme AS</span>
      <span className={styles.faint}>Renew by</span><span>9 Nov 2027</span>
    </div>
  );
}

function ProCard() {
  return (
    <div className={styles.card}>
      <h4 className={styles.h4}>Upgrade to Pro</h4>
      <p className={styles.cardText}>Your free license searches as well as Pro does. Pro adds the help to make it better.</p>
      <div><Button variant="secondary" size="micro">See what Pro adds</Button></div>
    </div>
  );
}

// ── A: a checklist ──────────────────────────────────────────────────────────────────────────────

function ChecklistVariant({ path, setPath, connected }: { path: Path; setPath: (p: Path) => void; connected: boolean }) {
  const steps = useSteps(path, connected);
  const done = steps.filter(s => s.done).length;
  const firstOpen = steps.findIndex(s => !s.done);
  const [open, setOpen] = useState<number | null>(null);
  const shown = open ?? firstOpen;
  return (
    <div className={styles.checklistGrid}>
      <div className={styles.column}>
        <div className={styles.head}>
          <div>
            <h3 className={styles.h3}>Get started</h3>
            <p className={styles.faint}>{done} of {steps.length} done</p>
          </div>
          <PathSwitch path={path} setPath={setPath} />
        </div>
        <ol className={styles.checklist}>
          {steps.map((s, i) => (
            <li key={s.title} className={styles.checkItem}>
              <button type="button" className={styles.checkHead} aria-expanded={shown === i} onClick={() => setOpen(shown === i ? -1 : i)}>
                <span className={`${styles.checkMark} ${s.done ? styles.checkDone : ''}`}>{s.done ? <Check size={14} color="currentColor" /> : i + 1}</span>
                <span className={styles.checkTitle}>{s.title}</span>
              </button>
              {shown === i && <div className={styles.checkBody}>{s.body}</div>}
            </li>
          ))}
        </ol>
      </div>
      <aside className={styles.side}>
        <h4 className={styles.h4}>Your license</h4>
        <LicenseFacts />
        {path === 'server' && <Button variant="ghost" size="micro" iconLeft={<Download />}>Download {FILE}</Button>}
        <Resources />
        <ProCard />
      </aside>
    </div>
  );
}

// ── B: our layout ───────────────────────────────────────────────────────────────────────────────

function OursVariant({ path, setPath, connected }: { path: Path; setPath: (p: Path) => void; connected: boolean }) {
  const steps = useSteps(path, connected);
  // The portal sees a server fetch its license, so a server's steps are done by themselves. It
  // cannot see an application, so the library's are done when the user says so.
  const [hidden, setHidden] = useState(false);
  const done = path === 'server' ? connected : hidden;
  const list = (
    <ol className={styles.steps}>
      {steps.map((s, i) => (
        <li key={s.title} className={styles.step}>
          <span className={`${styles.checkMark} ${s.done ? styles.checkDone : ''}`}>{s.done ? <Check size={14} color="currentColor" /> : i + 1}</span>
          <div className={styles.stepMain}>
            <span className={styles.checkTitle}>{s.title}</span>
            {s.body}
          </div>
        </li>
      ))}
    </ol>
  );
  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        <h3 className={styles.h3}>Your Indx license</h3>
        <LicenseFacts />
        {done ? (
          <>
            <Disclosure summary={
              <span className={styles.doneSummary}>
                <span className={`${styles.checkMark} ${styles.checkDone}`}><Check size={14} color="currentColor" /></span>
                <span className={styles.checkTitle}>Set up</span>
                <span className={styles.faint}>{path === 'server' ? 'prod-server is connected' : 'IndxSearchLib with your license'}</span>
              </span>}>
              <div className={styles.doneBody}>
                <PathSwitch path={path} setPath={setPath} />
                {list}
                {path === 'library' && <div><Button variant="ghost" size="micro" onClick={() => setHidden(false)}>Show the steps here again</Button></div>}
              </div>
            </Disclosure>
          </>
        ) : (
          <>
            <div className={styles.head}>
              <h4 className={styles.h4}>Get started</h4>
              <PathSwitch path={path} setPath={setPath} />
            </div>
            {list}
            {path === 'library' && <div><Button variant="ghost" size="micro" iconLeft={<Check />} onClick={() => setHidden(true)}>I am set up</Button></div>}
          </>
        )}
        <Resources />
      </div>
      <div className={styles.column}>
        <div className={styles.card}>
          {path === 'server' ? (
            <>
              <h4 className={styles.h4}>Your servers</h4>
              {connected ? (
                <>
                  <ServerList manage />
                  <p className={styles.cardText}>staging has not fetched for 9 days. A server fetches daily: it may be stopped, or its token revoked.</p>
                  <NewToken />
                </>
              ) : <p className={styles.cardText}>No server has fetched this license yet. Create a token on the left and paste it in your server.</p>}
              <div className={styles.divider} />
              <p className={styles.cardText}>No token where your server runs? Download the file and put it in its IndxData folder.</p>
              <div><Button variant="ghost" size="micro" iconLeft={<Download />}>Download {FILE}</Button></div>
            </>
          ) : (
            <>
              <h4 className={styles.h4}>Your license file</h4>
              <p className={styles.cardText}>Valid for 365 days from activation. Come back to renew it before it ends.</p>
              <div><Button variant="primary" size="micro" iconLeft={<Download />}>Download {FILE}</Button></div>
            </>
          )}
        </div>
        <ProCard />
      </div>
    </div>
  );
}

/** A token for one more server: named for where it runs, shown once, then listed above. */
function NewToken() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [token, setToken] = useState<string | null>(null);
  if (!open) return <div><Button variant="secondary" size="micro" iconLeft={<Key />} onClick={() => setOpen(true)}>Connect another server</Button></div>;
  if (token) return (
    <div className={styles.newToken}>
      <span className={styles.h4}>Token for {label || 'your server'}</span>
      <CodeCopy code={token} />
      <p className={styles.faint}>Copy it now: it is shown once. Paste it in that server under Admin &gt; License, or set it as Indx__LicenseToken.</p>
      <div><Button variant="ghost" size="micro" onClick={() => { setOpen(false); setToken(null); setLabel(''); }}>Done</Button></div>
    </div>
  );
  return (
    <div className={styles.newToken}>
      <InputField label="Where it runs" placeholder="prod-server" value={label} onChange={e => setLabel(e.target.value)} />
      <div className={styles.inline}>
        <Button variant="primary" size="micro" iconLeft={<Key />} onClick={() => setToken('indx_lt_2b8e40d97c1f4a33b6e5')}>Create token</Button>
        <Button variant="secondary" size="micro" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}

// ── C: your servers ─────────────────────────────────────────────────────────────────────────────

/** Every token, with the server that fetched with it. manage: each row can be revoked, for a
 *  server taken down or a token that leaked. */
function ServerList({ manage = false }: { manage?: boolean }) {
  const [revoked, setRevoked] = useState<string[]>([]);
  return (
    <Table aria-label="Servers that fetched this license">
      <TableHeader>
        <th>Token</th>
        <th>Last fetch</th>
        <th>Version</th>
        {manage && <th aria-label="Actions"></th>}
      </TableHeader>
      <tbody>
        {SERVERS.filter(s => !revoked.includes(s.label)).map(s => (
          <tr key={s.label}>
            <td className={styles.mono}>{s.label}</td>
            <td className={s.stale ? styles.attention : undefined}>{s.ago}</td>
            <td>{s.version}{s.version !== LATEST && <span className={styles.faint}> {LATEST} is out</span>}</td>
            {manage && <td className={styles.actionsCell}><Button variant="ghost" size="micro" onClick={() => setRevoked(r => [...r, s.label])}>Revoke</Button></td>}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function ServersVariant({ path, setPath, connected }: { path: Path; setPath: (p: Path) => void; connected: boolean }) {
  const steps = useSteps(path, connected);
  return (
    <div className={styles.column}>
      <div className={styles.head}>
        <div>
          <h3 className={styles.h3}>{path === 'server' ? 'Your Indx servers' : 'Your Indx license'}</h3>
          <p className={styles.faint}>Free Developer, Acme AS, renew by 9 Nov 2027</p>
        </div>
        <PathSwitch path={path} setPath={setPath} />
      </div>

      {path === 'server' && connected && (
        <>
          <ServerList manage />
          <NewToken />
          <Alert variant="info">
            <AlertTitle>staging has not fetched for 9 days</AlertTitle>
            <AlertDescription>A server fetches daily. It may be stopped, or its token revoked. Its license lasts until 9 Nov 2027 either way.</AlertDescription>
          </Alert>
          <div className={styles.inline}>
            <Button variant="ghost" size="micro" iconLeft={<Download />}>Download {FILE}</Button>
          </div>
        </>
      )}

      {(path === 'library' || !connected) && (
        <div className={styles.cardsRow}>
          {steps.map((s, i) => (
            <div key={s.title} className={styles.card}>
              <span className={styles.stepLabel}>{i + 1}</span>
              <h4 className={styles.h4}>{s.title}</h4>
              {s.body}
            </div>
          ))}
        </div>
      )}

      <div className={styles.twoColumns}>
        <Resources />
        <ProCard />
      </div>
    </div>
  );
}
