import { useState } from 'react';
import {
  AssistantMessage, Button, Checkbox, ChatPanel, Chip, CitationList, Composer, InputField, SearchField, SegmentedControl,
  Suggestions, Tabs, Textarea, UserMessage,
} from '@indxsearch/systm';
import { Book, Bug, Chevron_left, Clock, Home, Indx, Key, Mail, Plus, Question, Server, Support, Warning, X_or_error } from '@indxsearch/pixl';
import styles from './page.module.css';

// A mockup: support in the License Portal (Nov 2026), a widget in the lower right corner that opens
// a panel. The portal knows who is asking: the name, the plan and what it promises, the servers
// that fetch the license and the version each runs, when the license ends. Today the only way to
// write to us is from an Indx server's Support page; here the tickets are the same ones
// (SupportService), read and written from the portal too. Nothing here talks to a server.

type Variant = 'others' | 'ask' | 'known';

const ABOUT: Record<Variant, string> = {
  others: 'The way help widgets usually work: a home with a greeting and a search of the documentation, your conversations, and a button to write to us.',
  ask: "Like the Agent in the Indx console: ask, and it answers from the documentation with its sources. When that is not enough, Send to Indx turns the conversation into a ticket, with what the portal knows about you attached for you to check.",
  known: 'Built on what the portal knows: it opens on your account as it stands, with anything that needs attention. An open ticket comes before a new one; with none open, the topics start a ticket with the right facts already in it. Chosen, and built in the portal.',
};

// What the portal knows about Kari.
const ME = { name: 'Kari', plan: 'Pro', promise: 'Pro: we answer within one business day.', email: 'kari@acme.example' };
const SERVERS = [
  { label: 'prod-server', ago: '2 hours ago', version: '2.0.0' },
  { label: 'staging', ago: '9 days ago', version: '2.0.0-beta.2', stale: true },
];
const TICKETS = [
  { id: 42, subject: 'Synonyms do not apply after import', status: 'Answered', when: 'yesterday', unread: true },
  { id: 37, subject: 'Invoice address for Acme AS', status: 'Closed', when: '3 weeks ago', unread: false },
];

export default function PortalSupportMockup() {
  // ?variant=others|ask|known opens one, so each can be linked to.
  const [variant, setVariant] = useState<Variant>(() => {
    const asked = new URLSearchParams(window.location.search).get('variant');
    return asked === 'others' || asked === 'known' ? asked : 'ask';
  });
  const choose = (v: string) => {
    setVariant(v as Variant);
    const url = new URL(window.location.href);
    url.searchParams.set('variant', v);
    window.history.replaceState(null, '', url);
  };
  const [open, setOpen] = useState(true);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Portal support</h1>
        <p className={styles.desc}>
          Help in the License Portal, from a corner of every page. The portal knows who is asking, so nobody has to say
          their plan, their version or which server it is. The tickets are the ones an Indx server's Support page shows.
        </p>
      </div>
      <Tabs value={variant} onValueChange={choose} items={[
        { label: 'A: Like the others', value: 'others' },
        { label: 'B: Ask, then send', value: 'ask' },
        { label: 'C: What we know', value: 'known' },
      ]} />
      <p className={styles.note}>{ABOUT[variant]}</p>

      {/* The portal page behind it, greyed, with the widget in its corner. */}
      <div className={styles.frame}>
        <div className={styles.backdrop} aria-hidden="true">
          <div className={styles.fakeHead} />
          <div className={styles.fakeCols}>
            <div className={styles.fakeCol}><div className={styles.fakeLine} /><div className={styles.fakeLineShort} /><div className={styles.fakeBlock} /></div>
            <div className={styles.fakeCol}><div className={styles.fakeBlock} /><div className={styles.fakeBlockLow} /></div>
          </div>
        </div>
        {open && (
          <div className={styles.panel} role="dialog" aria-label="Help">
            {variant === 'others' && <OthersPanel onClose={() => setOpen(false)} />}
            {variant === 'ask' && <AskPanel onClose={() => setOpen(false)} />}
            {variant === 'known' && <KnownPanel onClose={() => setOpen(false)} />}
          </div>
        )}
        <div className={styles.launcher}>
          <Button variant={open ? 'secondary' : 'primary'} size="default" iconLeft={open ? <X_or_error /> : <Support />}
            onClick={() => setOpen(o => !o)} aria-expanded={open}>
            {open ? 'Close' : 'Help'}
            {!open && TICKETS.some(t => t.unread) && <span className={styles.unread} aria-label="A new answer">1</span>}
          </Button>
        </div>
      </div>
    </main>
  );
}

function PanelHead({ title, onBack, onClose, children }: { title: string; onBack?: () => void; onClose: () => void; children?: React.ReactNode }) {
  return (
    <div className={styles.head}>
      {onBack && <Button variant="ghost" size="micro" iconLeft={<Chevron_left />} aria-label="Back" onClick={onBack} />}
      <span className={styles.headTitle}>{title}</span>
      {children}
      <Button variant="ghost" size="micro" iconLeft={<X_or_error />} aria-label="Close" onClick={onClose} />
    </div>
  );
}

function TicketList({ onOpen, tickets = TICKETS }: { onOpen: (id: number) => void; tickets?: typeof TICKETS }) {
  return (
    <div className={styles.list}>
      {tickets.map(t => (
        <button key={t.id} type="button" className={styles.ticket} onClick={() => onOpen(t.id)}>
          <span className={styles.ticketTop}>
            <span className={styles.ticketSubject}>{t.subject}</span>
            {t.unread && <span className={styles.unread}>New</span>}
          </span>
          <span className={styles.faint}>#{t.id}, {t.status.toLowerCase()} {t.when}</span>
        </button>
      ))}
    </div>
  );
}

function Thread() {
  return (
    <div className={styles.thread}>
      <div className={styles.msg}><span className={styles.faint}>You, 2 days ago</span><p>After importing synonyms from CSV the search for "sofa" no longer finds couches.</p></div>
      <div className={`${styles.msg} ${styles.msgUs}`}><span className={styles.faint}>Jens at Indx, yesterday</span><p>The import kept the entries one-way, from couch to sofa. Open Synonyms, select the entries and choose Both ways. It applies at once, no reindex.</p></div>
    </div>
  );
}

/** Everything the portal would attach, each one the user can leave out. */
function Facts() {
  const [on, setOn] = useState<Record<string, boolean>>({ account: true, servers: true, license: true });
  const row = (key: string, label: string, value: string) => (
    <label className={styles.fact}>
      <Checkbox checked={on[key]} onChange={e => setOn(s => ({ ...s, [key]: (e.target as HTMLInputElement).checked }))} />
      <span className={styles.factText}><span className={styles.factLabel}>{label}</span><span className={styles.faint}>{value}</span></span>
    </label>
  );
  return (
    <div className={styles.facts}>
      <span className={styles.factsTitle}>Sent with it</span>
      {row('account', 'Your account', `${ME.email}, ${ME.plan}`)}
      {row('servers', 'Your servers', SERVERS.map(s => `${s.label} ${s.version}`).join(', '))}
      {row('license', 'Your license', 'Pro, renews 9 Dec 2026')}
    </div>
  );
}

function SentNote({ onDone }: { onDone: () => void }) {
  return (
    <div className={styles.sent}>
      <span className={styles.sentTitle}>Sent as #43</span>
      <p className={styles.faint}>{ME.promise} The answer comes here and by email.</p>
      <div><Button variant="secondary" size="micro" onClick={onDone}>Back</Button></div>
    </div>
  );
}

// ── A: like the others ──────────────────────────────────────────────────────────────────────────

function OthersPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'home' | 'messages' | 'help'>('home');
  const [view, setView] = useState<'tabs' | 'thread' | 'write' | 'sent'>('tabs');
  const [q, setQ] = useState('');
  const articles = ['Connect your server to its license', 'Install the Indx server', 'Synonyms: one way or both', 'Upgrade a server'];

  if (view === 'thread') return (<><PanelHead title="Synonyms do not apply after import" onBack={() => setView('tabs')} onClose={onClose} /><div className={styles.body}><Thread /></div><div className={styles.foot}><Composer value="" onChange={() => {}} onSend={() => {}} placeholder="Reply" /></div></>);
  if (view === 'write') return (<><PanelHead title="Write to us" onBack={() => setView('tabs')} onClose={onClose} /><div className={styles.body}><WriteForm onSent={() => setView('sent')} /></div></>);
  if (view === 'sent') return (<><PanelHead title="Write to us" onClose={onClose} /><div className={styles.body}><SentNote onDone={() => { setView('tabs'); setTab('messages'); }} /></div></>);

  return (
    <>
      <PanelHead title="Help" onClose={onClose} />
      <div className={styles.body}>
        {tab === 'home' && (
          <>
            <div className={styles.hello}>
              <span className={styles.helloTitle}>Hi {ME.name}</span>
              <span className={styles.faint}>{ME.promise}</span>
            </div>
            <SearchField placeholder="Search the documentation" value={q} onChange={e => setQ(e.target.value)} />
            <div className={styles.list}>
              {articles.filter(a => a.toLowerCase().includes(q.toLowerCase())).map(a => (
                <a key={a} className={styles.article} href="https://docs.indx.co" target="_blank" rel="noreferrer"><Book size={14} />{a}</a>
              ))}
            </div>
            <span className={styles.sectionLabel}>Your conversations</span>
            <TicketList onOpen={() => setView('thread')} />
            <div><Button variant="primary" size="micro" iconLeft={<Mail />} onClick={() => setView('write')}>Write to us</Button></div>
          </>
        )}
        {tab === 'messages' && <><TicketList onOpen={() => setView('thread')} /><div><Button variant="secondary" size="micro" iconLeft={<Plus />} onClick={() => setView('write')}>New conversation</Button></div></>}
        {tab === 'help' && (
          <div className={styles.list}>
            {articles.map(a => <a key={a} className={styles.article} href="https://docs.indx.co" target="_blank" rel="noreferrer"><Book size={14} />{a}</a>)}
          </div>
        )}
      </div>
      <div className={styles.tabbar}>
        <SegmentedControl stretch aria-label="Section" value={tab} onChange={setTab}
          items={[{ value: 'home', label: 'Home', icon: <Home size={14} /> }, { value: 'messages', label: 'Messages', icon: <Mail size={14} />, badge: 1 }, { value: 'help', label: 'Help', icon: <Book size={14} /> }]} />
      </div>
    </>
  );
}

function WriteForm({ onSent, subject = '', body = '' }: { onSent: () => void; subject?: string; body?: string }) {
  const [s, setS] = useState(subject);
  const [b, setB] = useState(body);
  return (
    <div className={styles.form}>
      <InputField label="Subject" value={s} onChange={e => setS(e.target.value)} />
      <Textarea label="What happened" rows={5} value={b} onChange={e => setB(e.target.value)} />
      <Facts />
      <div><Button variant="primary" size="micro" iconLeft={<Mail />} disabled={!s.trim() || !b.trim()} onClick={onSent}>Send to Indx</Button></div>
    </div>
  );
}

// ── B: ask, then send ───────────────────────────────────────────────────────────────────────────

function AskPanel({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<'ask' | 'tickets' | 'thread' | 'draft' | 'sent'>('ask');
  const [asked, setAsked] = useState<string | null>(null);
  const [text, setText] = useState('');

  if (view === 'thread') return (<><PanelHead title="Synonyms do not apply after import" onBack={() => setView('tickets')} onClose={onClose} /><div className={styles.body}><Thread /></div><div className={styles.foot}><Composer value="" onChange={() => {}} onSend={() => {}} placeholder="Reply" /></div></>);
  if (view === 'draft') return (
    <>
      <PanelHead title="Send to Indx" onBack={() => setView('ask')} onClose={onClose} />
      <div className={styles.body}>
        <p className={styles.faint}>Your question and the answer go with it, so you need not say it twice. Change anything before it goes.</p>
        <WriteForm onSent={() => setView('sent')} subject="staging stopped fetching its license"
          body={'staging has not fetched its license for 9 days, though it is running. The token is the same as on prod-server, which fetches fine.\n\nThe answer suggested checking the server log for the daily fetch; it shows a timeout to license.indx.co.'} />
      </div>
    </>
  );
  if (view === 'sent') return (<><PanelHead title="Send to Indx" onClose={onClose} /><div className={styles.body}><SentNote onDone={() => setView('tickets')} /></div></>);

  return (
    <>
      <PanelHead title={view === 'tickets' ? 'Your tickets' : 'Ask about Indx'} onClose={onClose}>
        <SegmentedControl size="micro" aria-label="View" value={view} onChange={v => setView(v)}
          items={[{ value: 'ask', label: 'Ask' }, { value: 'tickets', label: 'Tickets', badge: 1 }]} />
      </PanelHead>
      {view === 'tickets' ? (
        <div className={styles.body}>
          <TicketList onOpen={() => setView('thread')} />
          <div><Button variant="secondary" size="micro" iconLeft={<Plus />} onClick={() => setView('draft')}>New ticket</Button></div>
        </div>
      ) : (
        <div className={styles.chat}>
          <ChatPanel hints={false} composer={
            <Composer value={text} onChange={setText} placeholder="Ask about Indx, your license or your servers"
              onSend={t => { setAsked(t); setText(''); }} />
          }>
            {!asked ? (
              <div className={styles.hello}>
                <span className={styles.helloTitle}>Hi {ME.name}</span>
                <span className={styles.faint}>Answers come from the documentation and what the portal knows about your account. {ME.promise}</span>
                <Suggestions items={['Why has staging stopped fetching?', 'How do I upgrade my server?', 'Where is my invoice?']} onPick={t => setAsked(t)} />
              </div>
            ) : (
              <>
                <UserMessage>{asked}</UserMessage>
                <AssistantMessage label="Indx" icon={<Indx size={14} />}>
                  <p>staging last fetched its license 9 days ago and runs 2.0.0-beta.2. A server fetches once a day, so it has either stopped or cannot reach license.indx.co.</p>
                  <p>Its license still runs until 9 Dec 2026, so nothing has stopped working yet. Look in the server log for the daily license fetch: a timeout there is usually a firewall.</p>
                  <CitationList items={[{ n: 1, title: 'Auto-fetch from the license portal', href: 'https://docs.indx.co' }, { n: 2, title: 'Updates', href: 'https://docs.indx.co' }]} />
                  <div className={styles.answerFoot}>
                    <span className={styles.faint}>Not solved?</span>
                    <Button variant="secondary" size="micro" iconLeft={<Mail />} onClick={() => setView('draft')}>Send to Indx</Button>
                  </div>
                </AssistantMessage>
              </>
            )}
          </ChatPanel>
        </div>
      )}
    </>
  );
}

// ── C: what we know ─────────────────────────────────────────────────────────────────────────────

function KnownPanel({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<'home' | 'topics' | 'write' | 'thread' | 'sent'>('home');
  const [topic, setTopic] = useState<{ subject: string; body: string } | null>(null);
  const start = (subject: string, body = '') => { setTopic({ subject, body }); setView('write'); };

  if (view === 'thread') return (<><PanelHead title="Synonyms do not apply after import" onBack={() => setView('home')} onClose={onClose} /><div className={styles.body}><Thread /></div><div className={styles.foot}><Composer value="" onChange={() => {}} onSend={() => {}} placeholder="Reply" /></div></>);
  if (view === 'write' && topic) return (<><PanelHead title="Write to us" onBack={() => setView('home')} onClose={onClose} /><div className={styles.body}><WriteForm onSent={() => setView('sent')} subject={topic.subject} body={topic.body} /></div></>);
  if (view === 'sent') return (<><PanelHead title="Write to us" onClose={onClose} /><div className={styles.body}><SentNote onDone={() => setView('home')} /></div></>);

  const topics = [
    { icon: <Server size={14} />, label: 'Installing or upgrading a server', subject: 'Installing a server' },
    { icon: <Key size={14} />, label: 'My license or a token', subject: 'My license' },
    { icon: <Bug size={14} />, label: 'Something does not work', subject: '' },
    { icon: <Question size={14} />, label: 'Billing and invoices', subject: 'Billing' },
    { icon: <Plus size={14} />, label: 'An idea for Indx', subject: 'Feature request: ' },
  ];
  const topicList = (
    <>
      <span className={styles.sectionLabel}>What is it about?</span>
      <div className={styles.list}>
        {topics.map(t => (
          <button key={t.label} type="button" className={styles.topic} onClick={() => start(t.subject)}>{t.icon}{t.label}</button>
        ))}
      </div>
    </>
  );
  if (view === 'topics') return (<><PanelHead title="New ticket" onBack={() => setView('home')} onClose={onClose} /><div className={styles.body}>{topicList}</div></>);
  // An open ticket comes before a new one: the conversation already going is where an answer is.
  const open = TICKETS.filter(t => t.status !== 'Closed');
  const closed = TICKETS.filter(t => t.status === 'Closed');


  return (
    <>
      <PanelHead title="Help" onClose={onClose} />
      <div className={styles.body}>
        <div className={styles.hello}>
          <span className={styles.helloTitle}>Hi {ME.name}</span>
          <span className={styles.helloRow}><Chip color="var(--lv2)" textColor="var(--lv7)">{ME.plan}</Chip><span className={styles.faint}>{ME.promise}</span></span>
        </div>

        <span className={styles.sectionLabel}>Worth a look</span>
        <div className={styles.notice}>
          <Warning size={14} color="var(--CWarning)" />
          <span className={styles.noticeText}>
            <span>staging has not fetched its license for 9 days.</span>
            <span className={styles.faint}>It runs 2.0.0-beta.2, and its license lasts until 9 Dec 2026.</span>
          </span>
          <Button variant="ghost" size="micro" onClick={() => start('staging stopped fetching its license', 'staging has not fetched its license for 9 days.\n\n')}>Ask us</Button>
        </div>
        <div className={styles.notice}>
          <Clock size={14} />
          <span className={styles.noticeText}><span>A new answer on #42</span><span className={styles.faint}>Synonyms do not apply after import, yesterday</span></span>
          <Button variant="ghost" size="micro" onClick={() => setView('thread')}>Read</Button>
        </div>

        {open.length > 0 ? (
          <>
            <span className={styles.sectionLabel}>Open</span>
            <TicketList tickets={open} onOpen={() => setView('thread')} />
            <div><Button variant="secondary" size="micro" iconLeft={<Plus />} onClick={() => setView('topics')}>New ticket</Button></div>
          </>
        ) : topicList}

        {closed.length > 0 && (
          <>
            <span className={styles.sectionLabel}>Earlier</span>
            <TicketList tickets={closed} onOpen={() => setView('thread')} />
          </>
        )}
      </div>
    </>
  );
}
