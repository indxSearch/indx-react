import { Fragment, useState } from 'react';
import { Alert, BarMeter, Button, Chip, Disclosure, Modal, Select, Sheet, Sparkline, Stat, StatGroup, Table, TableHeader, Tabs, Toaster, toast } from '@indxsearch/systm';
import { Panel_add, Chevron_down, Chevron_right, Database, Key as KeyIcon, Refresh, Search, User, Users, Warning } from '@indxsearch/pixl';
import { TEAMS, USERS, admins, ago, documentsOf, findings, nf, plural, searchesOf, type Member, type Role, type Team } from './data';
import styles from './page.module.css';

// A mockup: Admin > Teams (Nov 2026). The page today is a card per team with its members, drawn in
// inline styles and a teal chip for the owner. Three variants of what it could be, from the same
// data the server holds per team: members, datasets, keys and searches.

type Variant = 'list' | 'ours' | 'attention' | 'together';

const ABOUT: Record<Variant, string> = {
  list: 'The way hosted services list organisations: one table, a row per team with its numbers, and the team opening in a sheet from the side with its members, datasets and keys.',
  ours: "The layout of Admin > Datasets: the instance's totals and a bar of where the searches go, above a table whose rows open in place to the members and the datasets.",
  attention: 'Built on what only this page sees, every team at once: what an instance admin may want to act on comes first, then a card per team with its last 30 days.',
  together: "Chosen for the console: B's totals and table, without the chart, under C's list of what needs a look. A server admin manages any team's members in the opened row, without joining it: the role, Remove and Add user. A team never loses its last admin, and every change is logged on the server.",
};

// The four teams with the most searches take the data-viz colours in order, the rest the grey.
function searchShares(teams: Team[]) {
  const ranked = [...teams].filter(t => searchesOf(t) > 0).sort((a, b) => searchesOf(b) - searchesOf(a));
  const top = ranked.slice(0, 4).map((t, i) => ({ label: t.name, value: searchesOf(t), color: `var(--viz${i + 1})` }));
  const rest = ranked.slice(4).reduce((s, t) => s + searchesOf(t), 0);
  return rest > 0 ? [...top, { label: 'Others', value: rest, color: 'var(--lv4)' }] : top;
}

export default function AdminTeamsMockup() {
  // ?variant=list|ours|attention opens one, so each can be linked to.
  const [variant, setVariant] = useState<Variant>(() => {
    const asked = new URLSearchParams(window.location.search).get('variant');
    return asked === 'list' || asked === 'attention' || asked === 'ours' ? asked : 'together';
  });
  const choose = (v: string) => {
    setVariant(v as Variant);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.replaceState(null, '', url);
  };

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Admin teams</h1>
        <p className={styles.desc}>
          The instance admin's list of every team. Mock data: {plural(TEAMS.length, 'team')}. There is no last sign-in
          or key last used on the server yet, so no variant shows them.
        </p>
      </div>
      <Tabs value={variant} onValueChange={choose} items={[
        { label: 'A · Like the others', value: 'list' },
        { label: 'B · Our layout', value: 'ours' },
        { label: 'C · What needs a look', value: 'attention' },
        { label: 'D · Together', value: 'together' },
      ]} />
      <p className={styles.note}>{ABOUT[variant]}</p>

      <div className={styles.page}>
        <div className={styles.pageHead}>
          <div>
            <h2 className={styles.h2}>Teams</h2>
            <p className={styles.lead}>All teams on this instance, with their members, datasets and keys.</p>
          </div>
          <Button variant="ghost" size="micro" iconLeft={<Refresh />}>Refresh</Button>
        </div>
        {variant === 'list' && <ListVariant />}
        {variant === 'ours' && <OursVariant />}
        {variant === 'attention' && <AttentionVariant />}
        {variant === 'together' && <><WorthALook /><OursVariant chart={false} manage /></>}
      </div>
      <Toaster />
    </main>
  );
}

const RoleChip = ({ role }: { role: string }) => <Chip color="var(--lv2)" textColor="var(--lv6)">{role}</Chip>;

function Activity({ team, width = 96 }: { team: Team; width?: number }) {
  return (
    <span className={styles.activity}>
      <Sparkline values={team.searches} type="bar" width={width} height={18} color="var(--lv6)" idleColor="var(--lv3)"
        lastIsPartial ariaLabel={`Searches per day over the last 30 days for ${team.name}`} />
      <span className={styles.num}>{nf.format(searchesOf(team))}</span>
    </span>
  );
}

const ROLES = (['Admin', 'Editor', 'Viewer'] as const).map(r => ({ label: r, value: r }));

/** A server admin's controls on a team's members: change a role, remove, add someone with an account. */
interface Manage {
  setMembers: (team: string, members: Member[]) => void;
  add: (team: Team) => void;
  remove: (team: Team, m: Member) => void;
}

function Members({ team, manage }: { team: Team; manage?: Manage }) {
  const [error, setError] = useState<string | null>(null);
  const changeRole = (m: Member, role: Role) => {
    if (role === m.role) return;
    // The team's own rule: it never loses its last admin.
    if (m.role === 'Admin' && admins(team) === 1) { setError('Cannot demote the last Admin of the team.'); return; }
    setError(null);
    manage!.setMembers(team.name, team.members.map(x => x === m ? { ...x, role } : x));
    toast(`${m.email} is now ${role} in ${team.name}.`);
  };
  return (
    <div className={styles.block}>
      <span className={styles.blockTitle}>
        <Users size={14} /> {plural(team.members.length, 'member')}
        {manage && <span className={styles.add}><Button variant="ghost" size="micro" iconLeft={<Panel_add />} onClick={() => manage.add(team)}>Add user</Button></span>}
      </span>
      {error && <Alert variant="destructive">{error}</Alert>}
      {team.members.map(m => (
        <div key={m.email} className={styles.line}>
          <span className={styles.lineMain} title={m.email}>{m.email}</span>
          <span className={styles.faint}>joined {ago(m.joinedDays)}</span>
          {manage ? (
            <>
              <span className={styles.role}><Select size="micro" variant="ghost" aria-label={`Role of ${m.email}`} value={m.role} options={ROLES} onValueChange={v => changeRole(m, v as Role)} /></span>
              <Button variant="ghost" size="micro" onClick={() => {
                if (m.role === 'Admin' && admins(team) === 1) { setError('Cannot remove the last Admin of the team.'); return; }
                setError(null);
                manage.remove(team, m);
              }}>Remove</Button>
            </>
          ) : <RoleChip role={m.role} />}
        </div>
      ))}
    </div>
  );
}

function Datasets({ team }: { team: Team }) {
  return (
    <div className={styles.block}>
      <span className={styles.blockTitle}><Database size={14} /> {plural(team.datasets.length, 'dataset')}</span>
      {team.datasets.length === 0 && <span className={styles.faint}>None yet.</span>}
      {team.datasets.map(d => (
        <div key={d.name} className={styles.line}>
          <span className={`${styles.lineMain} ${styles.mono}`}>{d.name}</span>
          <span className={styles.faint}>{d.state}</span>
          <span className={styles.num}>{nf.format(d.documents)}</span>
        </div>
      ))}
    </div>
  );
}

function Keys({ team }: { team: Team }) {
  return (
    <div className={styles.block}>
      <span className={styles.blockTitle}><KeyIcon size={14} /> {plural(team.keys.length, 'key')}</span>
      {team.keys.length === 0 && <span className={styles.faint}>None.</span>}
      {team.keys.map(k => (
        <div key={k.name} className={styles.line}>
          <span className={styles.lineMain}>{k.name}</span>
          <span className={styles.faint}>{k.team ? 'Team' : 'Personal'}, {k.expiresInDays == null ? 'no expiry' : `expires in ${plural(k.expiresInDays, 'day')}`}</span>
          <RoleChip role={k.level} />
        </div>
      ))}
    </div>
  );
}

// ── A: like the others ──────────────────────────────────────────────────────────────────────────

function ListVariant() {
  const [open, setOpen] = useState<Team | null>(null);
  return (
    <>
      <Table scrollable stickyFirstColumn aria-label="Teams">
        <TableHeader>
          <th>Team</th>
          <th className={styles.num}>Members</th>
          <th className={styles.num}>Datasets</th>
          <th className={styles.num}>Documents</th>
          <th>Searches, 30 days</th>
          <th className={styles.num}>Keys</th>
          <th>Created</th>
        </TableHeader>
        <tbody>
          {TEAMS.map(t => (
            <tr key={t.name} className={styles.row} tabIndex={0} onClick={() => setOpen(t)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(t); } }}>
              <td className={styles.mono}>{t.name}</td>
              <td className={styles.num}>{t.members.length}</td>
              <td className={styles.num}>{t.datasets.length}</td>
              <td className={styles.num}>{nf.format(documentsOf(t))}</td>
              <td><Activity team={t} /></td>
              <td className={styles.num}>{t.keys.length}</td>
              <td className={styles.faint}>{ago(t.createdDays)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Sheet open={open != null} onOpenChange={o => !o && setOpen(null)} size="wide"
        title={open?.name} description={open ? `Created ${ago(open.createdDays)}` : undefined}>
        {open && (
          <div className={styles.sheetBody}>
            <StatGroup columns={3}>
              <Stat label="Documents" value={nf.format(documentsOf(open))} />
              <Stat label="Searches, 30 days" value={nf.format(searchesOf(open))} />
              <Stat label="Found nothing" value={`${(open.zeroHits * 100).toFixed(1)}%`} />
            </StatGroup>
            <Members team={open} />
            <Datasets team={open} />
            <Keys team={open} />
          </div>
        )}
      </Sheet>
    </>
  );
}

// ── B: our layout, as Admin > Datasets ──────────────────────────────────────────────────────────

function OursVariant({ chart = true, manage = false }: { chart?: boolean; manage?: boolean }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  // The members as a server admin has changed them here.
  const [membersOf, setMembersOf] = useState<Record<string, Member[]>>({});
  const teams = TEAMS.map(t => membersOf[t.name] ? { ...t, members: membersOf[t.name] } : t);
  const setMembers = (team: string, members: Member[]) => setMembersOf(s => ({ ...s, [team]: members }));
  const [adding, setAdding] = useState<Team | null>(null);
  const [addUser, setAddUser] = useState('');
  const [addRole, setAddRole] = useState<Role>('Viewer');
  const [removing, setRemoving] = useState<{ team: Team; member: Member } | null>(null);
  const control: Manage | undefined = manage ? {
    setMembers,
    add: t => { setAdding(t); setAddUser(''); setAddRole('Viewer'); },
    remove: (team, member) => setRemoving({ team, member }),
  } : undefined;
  const addable = adding ? USERS.filter(u => !adding.members.some(m => m.email === u)) : [];
  const flip = (name: string) => setOpen(s => { const n = new Set(s); if (!n.delete(name)) n.add(name); return n; });
  const people = new Set(teams.flatMap(t => t.members.map(m => m.email))).size;
  const shares = searchShares(teams);
  const total = teams.reduce((s, t) => s + searchesOf(t), 0);

  return (
    <>
      <StatGroup columns={4}>
        <Stat label="Teams" labelIcon={<Users />} value={nf.format(teams.length)} />
        <Stat label="People" labelIcon={<User />} value={nf.format(people)}>in one team or more</Stat>
        <Stat label="Datasets" labelIcon={<Database />} value={nf.format(teams.reduce((s, t) => s + t.datasets.length, 0))} />
        <Stat label="Searches, 30 days" labelIcon={<Search />} value={nf.format(total)} />
      </StatGroup>

      {chart && <div className={styles.chartCard}>
        <div className={styles.chartHead}>
          <span className={styles.chartTitle}>Searches by team, 30 days</span>
          <span className={styles.chartTotal}>{nf.format(total)} searches</span>
        </div>
        <BarMeter segments={shares} labels="legend" format={v => nf.format(v)} />
      </div>}

      <Table scrollable stickyFirstColumn aria-label="Teams">
        <TableHeader>
          <th>Team</th>
          <th>Admins</th>
          <th className={styles.num}>Members</th>
          <th className={styles.num}>Datasets</th>
          <th className={styles.num}>Documents</th>
          <th>Searches, 30 days</th>
          <th>Created</th>
        </TableHeader>
        <tbody>
          {teams.map(t => {
            const isOpen = open.has(t.name);
            return (
              <Fragment key={t.name}>
                <tr className={styles.row} tabIndex={0} aria-expanded={isOpen} onClick={() => flip(t.name)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(t.name); } }}>
                  <td><span className={styles.rowName}>{isOpen ? <Chevron_down size={14} /> : <Chevron_right size={14} />}{t.name}</span></td>
                  <td className={styles.faint}>{t.members.filter(m => m.role === 'Admin').map(m => m.email.split('@')[0]).join(', ')}</td>
                  <td className={styles.num}>{t.members.length}</td>
                  <td className={styles.num}>{t.datasets.length}</td>
                  <td className={styles.num}>{nf.format(documentsOf(t))}</td>
                  <td><Activity team={t} /></td>
                  <td className={styles.faint}>{ago(t.createdDays)}</td>
                </tr>
                {isOpen && (
                  <tr className={styles.expanded}>
                    <td colSpan={7}>
                      <div className={styles.expandedBody}>
                        <Members team={t} manage={control} />
                        <Datasets team={t} />
                        <Keys team={t} />
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </Table>

      <Modal open={adding != null} onOpenChange={o => !o && setAdding(null)} title="Add user"
        description={adding ? `Anyone with an account on this instance can be added to ${adding.name}.` : undefined}>
        <div className={styles.form}>
          {addable.length === 0
            ? <p className={styles.faint}>Everyone with an account is already on this team.</p>
            : <>
                <Select size="micro" label="User" placeholder="Select a user…" value={addUser} options={addable.map(u => ({ label: u, value: u }))} onValueChange={setAddUser} />
                <Select size="micro" label="Role" value={addRole} options={ROLES} onValueChange={v => setAddRole(v as Role)} />
              </>}
          <div className={styles.actions}>
            <Button variant="primary" size="micro" disabled={!addUser} onClick={() => {
              if (!adding) return;
              setMembers(adding.name, [...adding.members, { email: addUser, role: addRole, joinedDays: 0 }]);
              toast(`Added ${addUser} to ${adding.name} as ${addRole}.`);
              setAdding(null);
            }}>Add</Button>
            <Button variant="secondary" size="micro" onClick={() => setAdding(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      <Modal open={removing != null} onOpenChange={o => !o && setRemoving(null)}
        title={removing ? `Remove ${removing.member.email} from ${removing.team.name}?` : undefined}
        description="They lose access to the team's datasets, and their personal keys for this team stop working.">
        <div className={styles.actions}>
          <Button variant="primary" size="micro" onClick={() => {
            if (!removing) return;
            setMembers(removing.team.name, removing.team.members.filter(m => m !== removing.member));
            toast(`Removed ${removing.member.email} from ${removing.team.name}.`);
            setRemoving(null);
          }}>Remove member</Button>
          <Button variant="secondary" size="micro" onClick={() => setRemoving(null)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}

// ── C: what needs a look ────────────────────────────────────────────────────────────────────────

function WorthALook() {
  const found = findings(TEAMS);
  if (found.length === 0) return null;
  return (
    <Disclosure summary={<span className={styles.findingsSummary}><Warning size={14} color="var(--CWarning)" /> Worth a look · {found.length}</span>}>
      <div className={`${styles.block} ${styles.findings}`}>
        {found.map((f, i) => (
          <div key={i} className={styles.finding}>
            <span className={styles.mono}>{f.team}</span>
            <span className={styles.findingText}>{f.text}</span>
          </div>
        ))}
      </div>
    </Disclosure>
  );
}

function AttentionVariant() {
  const [open, setOpen] = useState<Team | null>(null);
  return (
    <>
      <WorthALook />

      <div className={styles.cards}>
        {TEAMS.map(t => (
          <button key={t.name} type="button" className={styles.card} onClick={() => setOpen(t)}>
            <span className={styles.cardHead}>
              <span className={styles.mono}>{t.name}</span>
              <span className={styles.faint}>{ago(t.createdDays)}</span>
            </span>
            <Sparkline values={t.searches} height={28} color="var(--lv6)" fill baseline lastIsPartial idleColor="var(--lv3)"
              ariaLabel={`Searches per day over the last 30 days for ${t.name}`} />
            <span className={styles.cardFacts}>
              <span><strong>{nf.format(searchesOf(t))}</strong> searches</span>
              <span><strong>{Math.round(t.zeroHits * 100)}%</strong> found nothing</span>
            </span>
            <span className={styles.cardFacts}>
              <span>{plural(t.members.length, 'member')}, {plural(admins(t), 'admin')}</span>
              <span>{plural(t.datasets.length, 'dataset')}</span>
              <span>{nf.format(documentsOf(t))} documents</span>
            </span>
          </button>
        ))}
      </div>

      <Sheet open={open != null} onOpenChange={o => !o && setOpen(null)} size="wide"
        title={open?.name} description={open ? `Created ${ago(open.createdDays)}` : undefined}>
        {open && (
          <div className={styles.sheetBody}>
            <Members team={open} />
            <Datasets team={open} />
            <Keys team={open} />
          </div>
        )}
      </Sheet>
    </>
  );
}
