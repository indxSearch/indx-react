import { useState } from 'react';
import {
  Alert, AlertDescription, AlertTitle, BarMeter, Button, Chip, InputField, Modal, SegmentedControl, Stat, StatGroup,
  Table, TableHeader, Tabs,
} from '@indxsearch/systm';
import { Check, Document_or_file, External_link, Key, Plus, Refresh, User_id } from '@indxsearch/pixl';
import styles from './page.module.css';

// A mockup: Admin > License in the Indx console (Nov 2026). The page today is from before the systm:
// boxes drawn in inline styles, emoji ticks, and an "Option 1, Option 2" text sending people to
// indx.co. The license portal, its other half, now says "Your servers" and hands out tokens; this
// page is where a token goes in, so the two should speak alike.

type Variant = 'portal' | 'tiles';
type State = 'connected' | 'none' | 'waiting' | 'expired' | 'limit' | 'source';

const ABOUT: Record<Variant, string> = {
  portal: "The license portal's page from the other side: two columns, the license on the left, how it reaches this server on the right, in the same words the portal uses for a token and a fetch.",
  tiles: 'The license as a row of figures across the top, like the Monitor: the edition, who it is for, when it renews and the limit per dataset, then the connection and the files below.',
};

const STATES: { value: State; label: string }[] = [
  { value: 'connected', label: 'Licensed, connected' },
  { value: 'none', label: 'No license' },
  { value: 'waiting', label: 'Token set, no license yet' },
  { value: 'expired', label: 'Expired' },
  { value: 'limit', label: 'Over the limit' },
  { value: 'source', label: 'Source build' },
];

const nf = new Intl.NumberFormat('en-US');
const FILES = [{ name: 'acme-as-pro.license', active: true }, { name: 'indx-developer.license', active: false }];

/** The limit is per dataset: a dataset past it takes its first 100,000 documents and leaves the
 *  rest out of the index. So the page names the datasets over it, never a total. */
const LIMIT = 100_000;
const DATASETS = [
  { name: 'products', documents: 1_204_330 },
  { name: 'reviews', documents: 112_480 },
  { name: 'stores', documents: 812 },
  { name: 'help-articles', documents: 2_410 },
];

interface Facts {
  licensed: boolean; edition: string; to: string; renews: string; limited: boolean;
  token: boolean; fetched: string | null;
  /** Built from the Indx source, as we run it: no license is checked, nothing is limited. */
  source?: boolean;
}

function factsOf(state: State): Facts {
  switch (state) {
    case 'none': return { licensed: false, edition: 'No license', to: '', renews: '', limited: true, token: false, fetched: null };
    case 'waiting': return { licensed: false, edition: 'No license', to: '', renews: '', limited: true, token: true, fetched: null };
    case 'expired': return { licensed: false, edition: 'Pro, expired', to: 'Acme AS', renews: 'ended 3 days ago', limited: true, token: false, fetched: null };
    case 'source': return { licensed: false, edition: 'Source build', to: '', renews: '', limited: false, token: true, fetched: '2 hours ago', source: true };
    case 'limit': return { licensed: false, edition: 'No license', to: '', renews: '', limited: true, token: false, fetched: null };
    default: return { licensed: true, edition: 'Pro', to: 'Acme AS', renews: 'in 2 months', limited: false, token: true, fetched: '2 hours ago' };
  }
}

export default function AdminLicenseMockup() {
  // ?variant=portal|tiles opens one, so each can be linked to.
  const [variant, setVariant] = useState<Variant>(() =>
    new URLSearchParams(window.location.search).get('variant') === 'tiles' ? 'tiles' : 'portal');
  const choose = (v: string) => {
    setVariant(v as Variant);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.replaceState(null, '', url);
  };
  const [state, setState] = useState<State>('connected');
  const f = factsOf(state);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Admin license</h1>
        <p className={styles.desc}>
          The console's License page, for the admin of an Indx server: what license it runs on, and how that license
          reaches it from license.indx.co. Its other half is the portal's License page, where the token comes from.
        </p>
      </div>
      <Tabs value={variant} onValueChange={choose} items={[
        { label: 'A: Like the portal', value: 'portal' },
        { label: 'B: Figures first', value: 'tiles' },
      ]} />
      <p className={styles.note}>{ABOUT[variant]}</p>
      <div className={styles.controls}>
        <span className={styles.faint}>Mock state</span>
        <SegmentedControl size="micro" aria-label="State" value={state} onChange={setState} items={STATES} />
      </div>

      <div className={styles.page}>
        <div className={styles.pageHead}>
          <h2 className={styles.h2}>License</h2>
          <p className={styles.lead}>The license this server runs on, and how it gets a new one.</p>
        </div>
        <Notices state={state} f={f} />
        {variant === 'portal' ? <PortalVariant f={f} /> : <TilesVariant f={f} />}
      </div>
    </main>
  );
}

/** What needs doing, at the top, in the systm's Alert: only when something does. */
function Notices({ state, f }: { state: State; f: Facts }) {
  // For us: a server built from the Indx source runs the engine without its license checks.
  if (f.source) return (
    <Alert variant="info">
      <AlertTitle>Built from source</AlertTitle>
      <AlertDescription>
        This server runs the Indx engine from source, where no license is checked: no dataset has a document limit and the
        license file is not read. Customers run the published IndxSearchLib; build with <code className={styles.code}>-p:IndxFromNuGet=true</code> to
        see this page as they do.
      </AlertDescription>
    </Alert>
  );
  if (state === 'expired') return (
    <Alert variant="destructive">
      <AlertTitle>The license ended 3 days ago</AlertTitle>
      <AlertDescription>A dataset loaded since then takes at most 100,000 documents. Renew it at license.indx.co, or connect a token so this server renews it by itself.</AlertDescription>
    </Alert>
  );
  if (state === 'limit') return (
    <Alert variant="warning">
      <AlertTitle>{plural(over().length, 'dataset is', 'datasets are')} over the 100,000 document limit</AlertTitle>
      <AlertDescription>Each takes its first 100,000 documents and leaves the rest out of search. A free license from license.indx.co lifts the limit.</AlertDescription>
    </Alert>
  );
  if (state === 'waiting') return (
    <Alert variant="info">
      <AlertTitle>A token is set, and no license has come yet</AlertTitle>
      <AlertDescription>Fetch now to get it at once. It applies to each dataset the next time it is loaded or indexed.</AlertDescription>
    </Alert>
  );
  return null;
}

function Facts({ f }: { f: Facts }) {
  return (
    <div className={styles.facts}>
      <span className={styles.faint}>Edition</span>
      <span><Chip color={f.licensed ? 'var(--CLightBlue)' : 'var(--lv2)'} textColor={f.licensed ? '#080809' : 'var(--lv6)'}>{f.edition}</Chip></span>
      {f.source && <><span className={styles.faint}>Checked</span><span>No, a source build does not check licenses</span></>}
      {f.to && <><span className={styles.faint}>Licensed to</span><span>{f.to}</span></>}
      {f.renews && <><span className={styles.faint}>{f.licensed ? 'Renews' : 'Ended'}</span><span>{f.renews}</span></>}
      <span className={styles.faint}>Documents</span>
      <span>{f.limited ? `At most ${nf.format(LIMIT)} per dataset` : f.source ? 'No limit, as built' : 'No limit'}</span>
    </div>
  );
}

const over = () => DATASETS.filter(d => d.documents > LIMIT);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The datasets the limit cuts, each with how much of it is searched. Shown only under a limit. */
function OverLimit({ f }: { f: Facts }) {
  if (!f.limited || over().length === 0) return null;
  return (
    <div className={styles.overList}>
      <span className={styles.faint}>Over the limit</span>
      {over().map(d => (
        <div key={d.name} className={styles.overRow}>
          <span className={styles.mono}>{d.name}</span>
          <BarMeter value={LIMIT} max={d.documents} color="var(--CSignal)" format={v => nf.format(v)}
            maxLabel={`of ${nf.format(d.documents)} searched`} />
        </div>
      ))}
    </div>
  );
}

/** How the license reaches this server: a token from the portal, fetched on start and daily. */
function Connection({ f }: { f: Facts }) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [token, setToken] = useState('');
  return (
    <div className={styles.card}>
      <h3 className={styles.h3}>From license.indx.co</h3>
      {f.token && !editing ? (
        <>
          <div className={styles.connected}>
            <span className={styles.tick}><Check size={14} color="currentColor" /></span>
            <span className={styles.connectedText}>
              <span>Connected with a token</span>
              <span className={styles.faint}>{f.fetched ? `Last fetched ${f.fetched}. It fetches on start and once a day.` : 'Nothing fetched yet.'}</span>
            </span>
          </div>
          <div className={styles.inline}>
            <Button variant="secondary" size="micro" iconLeft={<Refresh />}>Fetch now</Button>
            <Button variant="ghost" size="micro" onClick={() => setEditing(true)}>Change token</Button>
            <Button variant="ghost" size="micro" onClick={() => setRemoving(true)}>Remove</Button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.cardText}>
            Create a token on your license page at license.indx.co and paste it here. This server then fetches the license,
            and a new one whenever it renews.
          </p>
          <div><Button variant="ghost" size="micro" iconLeft={<External_link />}>Open license.indx.co</Button></div>
          <InputField label="Token" type="password" placeholder="Paste the token" value={token} onChange={e => setToken(e.target.value)} />
          <div className={styles.inline}>
            <Button variant="primary" size="micro" iconLeft={<Key />} disabled={!token}>Save and fetch</Button>
            {editing && <Button variant="secondary" size="micro" onClick={() => setEditing(false)}>Cancel</Button>}
          </div>
        </>
      )}
      <Modal open={removing} onOpenChange={setRemoving} title="Remove the token?"
        description="This server stops fetching the license. The license file it has keeps working until it ends.">
        <div className={styles.inline}>
          <Button variant="primary" size="micro" onClick={() => setRemoving(false)}>Remove token</Button>
          <Button variant="secondary" size="micro" onClick={() => setRemoving(false)}>Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

function Files() {
  return (
    <div className={styles.card}>
      <h3 className={styles.h3}>License files</h3>
      <p className={styles.cardText}>In IndxData. A fetched license is written here; a server that cannot reach the portal takes one uploaded by hand.</p>
      <Table aria-label="License files">
        <TableHeader>
          <th>File</th>
          <th>Status</th>
          <th aria-label="Actions"></th>
        </TableHeader>
        <tbody>
          {FILES.map(f => (
            <tr key={f.name}>
              <td className={styles.mono}>{f.name}</td>
              <td>{f.active ? <Chip color="var(--lv8)" textColor="var(--lv0)">In use</Chip> : <Chip color="var(--lv2)" textColor="var(--lv5)">Not used</Chip>}</td>
              <td className={styles.actions}><Button variant="ghost" size="micro">Delete</Button></td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div><Button variant="ghost" size="micro" iconLeft={<Plus />}>Upload a .license file</Button></div>
    </div>
  );
}

// ── A: like the portal ──────────────────────────────────────────────────────────────────────────

function PortalVariant({ f }: { f: Facts }) {
  return (
    <div className={styles.twoColumns}>
      <div className={styles.column}>
        <h3 className={styles.h3}>{f.source ? 'Source build' : f.licensed ? 'Your Indx license' : 'No license yet'}</h3>
        {!f.licensed && !f.to && !f.source && (
          <p className={styles.cardText}>Indx runs without a license, with up to 100,000 documents in each dataset. A free license from license.indx.co lifts the limit, for any use.</p>
        )}
        <Facts f={f} />
        <OverLimit f={f} />
        <div className={styles.links}>
          <a className={styles.link} href="https://license.indx.co" target="_blank" rel="noreferrer"><User_id size={14} /><span>Your license at license.indx.co</span><External_link size={14} /></a>
          <a className={styles.link} href="https://docs.indx.co" target="_blank" rel="noreferrer"><Document_or_file size={14} /><span>Licensing in the documentation</span><External_link size={14} /></a>
        </div>
      </div>
      <div className={styles.column}>
        <Connection f={f} />
        <Files />
      </div>
    </div>
  );
}

// ── B: figures first ────────────────────────────────────────────────────────────────────────────

function TilesVariant({ f }: { f: Facts }) {
  return (
    <div className={styles.column}>
      <StatGroup columns={4}>
        <Stat label="Edition" value={f.edition} />
        <Stat label="Licensed to" value={f.to || 'Nobody yet'} />
        <Stat label={f.licensed ? 'Renews' : 'Ends'} value={f.renews || 'Not licensed'} />
        <Stat label="Per dataset" value={f.limited ? nf.format(LIMIT) : 'No limit'}>{f.limited ? `documents, ${plural(over().length, 'dataset', 'datasets')} over` : 'documents'}</Stat>
      </StatGroup>
      <OverLimit f={f} />
      <div className={styles.twoColumns}>
        <Connection f={f} />
        <Files />
      </div>
    </div>
  );
}
