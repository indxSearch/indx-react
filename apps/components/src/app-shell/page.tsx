import { useState } from 'react';
import {
  Breadcrumbs, type BreadcrumbItem, Button, Chip, Alert, AlertTitle, AlertDescription,
  NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
} from '@indxsearch/systm';
import { Bell, User_id, Shield, Key, Logout, Book, Api, Document_or_file, Users, Field, Search, Boost, Synonym, Sliders_horizontal, Status, Database, Panel_add, Flag, Hibernate } from '@indxsearch/pixl';
import styles from './page.module.css';

/**
 * Mockup of option A for the IndxServer shell: the breadcrumb IS the header. Everything that is
 * not "where am I" moves to the right cluster — an instance menu (License, Admin), notifications,
 * and a personal menu (Account, API keys, help links, log out). Pages outside the console show
 * their name in the breadcrumb slot. Not wired to anything; navigation is state.
 */

type Screen = 'dataset' | 'team' | 'account' | 'admin';

const teams = ['acme', 'design', 'engineering'].map(v => ({ label: v, value: v }));
const datasets = ['products', 'customers', 'orders'].map(v => ({ label: v, value: v }));
const adminPages = [['users', 'Users'], ['datasets', 'All datasets'], ['settings', 'Settings'], ['license', 'License']].map(([value, label]) => ({ label, value }));
const accountPages = [['account', 'Account'], ['api-keys', 'API keys']].map(([value, label]) => ({ label, value }));
const tabs = [
  { key: 'status', label: 'Status', icon: <Status /> },
  { key: 'fields', label: 'Field configuration', icon: <Field /> },
  { key: 'search', label: 'Search preview', icon: <Search /> },
  { key: 'boosts', label: 'Boost rules', icon: <Boost /> },
  { key: 'synonyms', label: 'Synonyms', icon: <Synonym /> },
  { key: 'options', label: 'Options', icon: <Sliders_horizontal /> },
];

export default function AppShellPage() {
  const [screen, setScreen] = useState<Screen>('dataset');
  const [team, setTeam] = useState('acme');
  const [dataset, setDataset] = useState('products');
  const [tab, setTab] = useState('status');
  const [adminPage, setAdminPage] = useState('settings');
  const [accountPage, setAccountPage] = useState('api-keys');

  // The same grammar everywhere: the trail says where you are, and the last step's caret
  // switches between siblings. The right-hand menu is only an entry point into a section.
  const stop = (e: React.MouseEvent<HTMLAnchorElement>) => e.preventDefault();
  const crumbs: BreadcrumbItem[] =
    screen === 'admin' ? [
      { id: 'admin', label: 'Admin', href: '#admin', icon: <Shield />, onClick: e => { stop(e); setAdminPage('users'); } },
      { id: 'page', label: adminPages.find(p => p.value === adminPage)!.label, href: '#page', onClick: stop,
        switcher: { label: 'Admin page', value: adminPage, options: adminPages, onValueChange: setAdminPage } },
    ] :
    screen === 'account' ? [
      { id: 'me', label: 'anders', href: '#me', icon: <User_id />, onClick: e => { stop(e); setAccountPage('account'); } },
      { id: 'page', label: accountPages.find(p => p.value === accountPage)!.label, href: '#page', onClick: stop,
        switcher: { label: 'Account page', value: accountPage, options: accountPages, onValueChange: setAccountPage } },
    ] : [
      { id: 'team', label: team, href: '#team', icon: <Users />, onClick: e => { stop(e); setScreen('team'); },
        switcher: { label: 'Switch team', value: team, options: teams, onValueChange: v => { setTeam(v); setScreen('team'); },
                    action: { label: 'New team…', onSelect: () => alert('New team dialog') } } },
      ...(screen === 'dataset' ? [{ id: 'dataset', label: dataset, href: '#dataset', icon: <Database />, onClick: stop,
        switcher: { label: 'Switch dataset', value: dataset, options: datasets, onValueChange: setDataset,
                    action: { label: 'New dataset…', onSelect: () => alert('New dataset dialog') } } } as BreadcrumbItem] : []),
    ];

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>App shell — option A</h1>
        <p className={styles.desc}>The breadcrumb is the header, in every section: Team › Dataset, Admin › Settings, anders › API keys — and the last step's caret switches between siblings. The right side is down to the bell and one menu, which only <em>enters</em> a section (Admin, Account); once inside, the trail carries you. Click around: everything works.</p>
        <div className={styles.screens}>
          <Button size="micro" variant={screen === 'dataset' ? 'primary' : 'secondary'} onClick={() => setScreen('dataset')}>Dataset page</Button>
          <Button size="micro" variant={screen === 'team' ? 'primary' : 'secondary'} onClick={() => setScreen('team')}>Team page</Button>
          <Button size="micro" variant={screen === 'account' ? 'primary' : 'secondary'} onClick={() => setScreen('account')}>Account page</Button>
          <Button size="micro" variant={screen === 'admin' ? 'primary' : 'secondary'} onClick={() => setScreen('admin')}>Admin page</Button>
        </div>
      </div>

      <div className={styles.frame}>
        {/* ── Header: home · breadcrumb · instance · bell · me ── */}
        <header className={styles.header}>
          <a className={styles.home} href="#home" onClick={e => { e.preventDefault(); setScreen('team'); }}>
            <span className={styles.logo}>Indx</span>
            <span className={styles.instance}>search.acme.no</span>
          </a>
          <div className={styles.crumbs}><Breadcrumbs items={crumbs} size="micro" /></div>
          <div className={styles.right}>
            <NavigationMenu size="micro" aria-label="Account">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink variant="navigation" href="#notifications" aria-label="Notifications"><span className={styles.bell}><Bell size={14} /><span className={styles.dot} /></span></NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger icon={<User_id />}>anders</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <NavigationMenuLink href="#account" onClick={e => { e.preventDefault(); setAccountPage('account'); setScreen('account'); }}><span className={styles.mi}><User_id size={14} />Account</span></NavigationMenuLink>
                    <NavigationMenuLink href="#api-keys" onClick={e => { e.preventDefault(); setAccountPage('api-keys'); setScreen('account'); }}><span className={styles.mi}><Key size={14} />API keys</span></NavigationMenuLink>
                    <div className={styles.divider} />
                    <NavigationMenuLink href="#admin" onClick={e => { e.preventDefault(); setAdminPage('users'); setScreen('admin'); }}><span className={styles.mi}><Shield size={14} />Admin</span></NavigationMenuLink>
                    <div className={styles.divider} />
                    <NavigationMenuLink href="https://v5.docs.indx.co"><span className={styles.mi}><Book size={14} />Docs ↗</span></NavigationMenuLink>
                    <NavigationMenuLink href="#swagger"><span className={styles.mi}><Api size={14} />Swagger ↗</span></NavigationMenuLink>
                    <div className={styles.divider} />
                    <NavigationMenuLink href="#logout"><span className={styles.mi}><Logout size={14} />Log out</span></NavigationMenuLink>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </header>

        {/* ── Page ── */}
        <main className={styles.main}>
          {screen === 'dataset' && (
            <>
              <nav className={styles.tabs}>
                {tabs.map(t => (
                  <Button key={t.key} size="micro" variant={tab === t.key ? 'primary' : 'ghost'} iconLeft={t.icon} onClick={() => setTab(t.key)}>{t.label}</Button>
                ))}
              </nav>
              {tab === 'status' ? (
                <div className={styles.status}>
                  <h3 className={styles.h3}>Index</h3>
                  <table className={styles.table}><tbody>
                    <tr><td>State</td><td><Chip size="large" color="var(--CTeal)" textColor="#080809" icon={<Flag />}>Ready</Chip></td></tr>
                    <tr><td>Documents</td><td>212 404</td></tr>
                    <tr><td>Records on disk</td><td>212 404</td></tr>
                    <tr><td>Last index build</td><td>2h ago</td></tr>
                    <tr><td>Seconds to index</td><td>41.2s</td></tr>
                  </tbody></table>
                  <h3 className={`${styles.h3} ${styles.h3Section}`}>Usage</h3>
                  <table className={styles.table}><tbody>
                    <tr><td>Searches since load</td><td>18 342</td></tr>
                    <tr><td>Keep-alive</td><td>Always on</td></tr>
                  </tbody></table>
                </div>
              ) : (
                <p className={styles.placeholder}>{tabs.find(t => t.key === tab)?.label} — content as today.</p>
              )}
            </>
          )}

          {screen === 'team' && (
            <>
              <div className={styles.teamHead}>
                <h2 className={styles.h2}>Datasets</h2>
                <Button size="micro" variant="secondary" iconLeft={<Users />}>Manage team</Button>
              </div>
              <div className={styles.grid}>
                {[['products', 'Ready', '212 404 documents', 'ready'], ['customers', 'Ready', '16 761 documents', 'ready'], ['orders', 'Hibernated', '518 927 records', 'hib']].map(([name, state, count, kind]) => (
                  <a key={name} className={styles.card} href="#open" onClick={e => { e.preventDefault(); setDataset(name); setScreen('dataset'); }}>
                    <span className={styles.cardHead}><Database size={14} />{name}</span>
                    <span className={styles.cardFoot}>
                      {kind === 'ready'
                        ? <Chip color="var(--CTeal)" textColor="#080809" icon={<Flag />}>{state}</Chip>
                        : <Chip color="var(--CLightBlue)" textColor="#080809" icon={<Hibernate />}>{state}</Chip>}
                      <span className={styles.count}>{count}</span>
                    </span>
                  </a>
                ))}
              </div>
              <div className={styles.below}><Button size="micro" variant="primary" iconLeft={<Panel_add />}>New dataset</Button></div>
            </>
          )}

          {screen === 'account' && (
            <div className={styles.narrow}>
              <h2 className={styles.h2}>{accountPages.find(p => p.value === accountPage)!.label}</h2>
              {accountPage === 'api-keys' ? (
                <>
                  <p className={styles.muted}>Keys are yours, not the team's: they call the instance as you, with your roles on every team.</p>
                  <Alert variant="info"><AlertTitle>One key expires in 3 days</AlertTitle><AlertDescription>Create a new one before it does; the old one keeps working until then.</AlertDescription></Alert>
                </>
              ) : (
                <p className={styles.muted}>Email, password, notification preferences — as today.</p>
              )}
            </div>
          )}

          {screen === 'admin' && (
            <div className={styles.narrow}>
              <h2 className={styles.h2}>{adminPages.find(p => p.value === adminPage)!.label}</h2>
              <p className={styles.muted}>
                {adminPage === 'users' && 'Every account on this instance, with roles and teams.'}
                {adminPage === 'datasets' && 'Every dataset across all teams, with keep-alive policy and memory.'}
                {adminPage === 'settings' && 'Registration mode, email provider, OAuth, instance name.'}
                {adminPage === 'license' && 'License status and files; auto-fetch from the license portal.'}
              </p>
              <p className={styles.muted}>Switch between admin pages with the caret on the trail above — the same move as switching datasets.</p>
            </div>
          )}
        </main>
      </div>

      <div className={styles.notes}>
        <h2 className={styles.h2}>What moved where</h2>
        <table className={styles.table}><tbody>
          <tr><td>Datasets (top nav)</td><td>Gone — the breadcrumb is the nav; the logo is home</td></tr>
          <tr><td>API key, Account</td><td>Personal menu; inside, the trail reads <code>anders › API keys ▾</code></td></tr>
          <tr><td>Admin, License</td><td>One "Admin" entry in the personal menu (admins only); inside, <code>Admin › Settings ▾</code> switches Users / All datasets / Settings / License</td></tr>
          <tr><td>Swagger, Docs</td><td>Personal menu, below a divider</td></tr>
          <tr><td>Notifications</td><td>The bell, right cluster</td></tr>
          <tr><td>"Manage team"</td><td>Stays on the team page as a page action, not in the header</td></tr>
        </tbody></table>
      </div>
    </div>
  );
}
