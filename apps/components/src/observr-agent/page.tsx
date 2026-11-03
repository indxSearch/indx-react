import { useState, type ReactNode } from 'react';
import {
  AssistantMessage, Button, ChatPanel, Chip, Composer, SegmentedControl, Sidebar, Suggestions, ToolStep, ToolSteps,
  UserMessage, type SidebarGroup,
} from '@indxsearch/systm';
import {
  ArrowLeft, Bell, Boost, Check, Clock, Coverage, Database, Field, Graph, Indx, Lock, Observr, Plus, Search, Shield,
  Status, Synonym, Trash, User, X_or_error,
} from '@indxsearch/pixl';
import shell from '../console-sidebar/page.module.css';
import styles from './page.module.css';

// A mockup: the Agent panel (Observr in the console) made honest and lasting, step 1 and a
// glimpse of step 2 (Notes/observr-agent-plan.md). What the panel shows is what Observr
// remembers: one current conversation, remembered whole, its older part summarised rather than
// dropped; New conversation instead of Clear, and earlier ones in a History list; where you
// are as one chip at the input; what each answer looked at kept with it. Step 2: a few notes per
// dataset Observr keeps and the owner can read and delete. Monochrome, as Observr is in the
// console. Nothing here talks to a server.

type View = 'conversation' | 'long' | 'history' | 'memory' | 'new';

const VIEWS = [
  { label: 'A conversation', value: 'conversation' }, { label: 'A long one', value: 'long' },
  { label: 'History', value: 'history' }, { label: 'What it knows', value: 'memory' }, { label: 'New conversation', value: 'new' },
];

const DATASET: SidebarGroup[] = [
  { title: 'Overview', items: [{ key: 'status', label: 'Status', icon: <Status /> }, { key: 'statistics', label: 'Statistics', icon: <Graph /> }] },
  { title: 'Data', items: [{ key: 'fields', label: 'Field configuration', icon: <Field /> }] },
  { title: 'Relevance', items: [
    { key: 'query', label: 'Query parameters', icon: <Coverage /> },
    { key: 'boosts', label: 'Boost rules', icon: <Boost /> },
    { key: 'synonyms', label: 'Synonyms', icon: <Synonym /> },
  ] },
];

/** The panel's head: the conversation's title and the two ways out of it. */
function PanelHead({ title, onHistory, onNew, back }: { title: string; onHistory?: () => void; onNew?: () => void; back?: () => void }) {
  return (
    <div className={styles.head}>
      {back
        ? <Button variant="ghost" size="micro" iconLeft={<ArrowLeft />} onClick={back} aria-label="Back to the conversation" />
        : <span className={styles.mark}><Observr /></span>}
      <span className={styles.title} title={title}>{title}</span>
      {onHistory && <Button variant="ghost" size="micro" iconLeft={<Clock />} onClick={onHistory} aria-label="History">History</Button>}
      {onNew && <Button variant="ghost" size="micro" iconLeft={<Plus />} onClick={onNew} aria-label="New conversation" />}
      <Button variant="ghost" size="micro" iconLeft={<X_or_error />} aria-label="Close" />
    </div>
  );
}

/** Where the question is about, at the input: one chip, not a label on every turn. */
function ContextChip({ notes, onMemory }: { notes: number; onMemory: () => void }) {
  return (
    <div className={styles.context}>
      <Chip icon={<Database />}>About pokedex</Chip>
      <Button variant="ghost" size="micro" onClick={onMemory} className={styles.memoryLink}>{notes} notes about pokedex</Button>
    </div>
  );
}

/** A proposal as a card: what changes, why, Yes and No; after a yes, Undo for a while. */
function Proposal({ accepted, onDecide }: { accepted: boolean; onDecide: (yes: boolean) => void }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}><Synonym size={14} /> Synonym</div>
      <div className={styles.terms}><Chip>tv</Chip><span className={styles.quiet}>and</span><Chip>television</Chip></div>
      <p className={styles.why}>Visitors write tv; your records say television. 41 searches found nothing this week.</p>
      {accepted
        ? <div className={styles.cardActions}><span className={styles.done}><Check size={14} /> Added to Synonyms</span>
            <Button variant="ghost" size="micro" onClick={() => onDecide(false)}>Undo</Button></div>
        : <div className={styles.cardActions}>
            <Button variant="primary" size="micro" onClick={() => onDecide(true)}>Yes</Button>
            <Button variant="secondary" size="micro" onClick={() => onDecide(false)}>No</Button>
          </div>}
    </div>
  );
}

function Conversation({ long, onHistory, onNew, onMemory }: { long?: boolean; onHistory: () => void; onNew: () => void; onMemory: () => void }) {
  const [accepted, setAccepted] = useState(false);
  const [text, setText] = useState('');
  return (
    <ChatPanel aria-label="Observr" hints={false}
      header={<PanelHead title="Why does tv find nothing?" onHistory={onHistory} onNew={onNew} />}
      composer={<div className={styles.composer}><ContextChip notes={4} onMemory={onMemory} />
        <Composer value={text} onChange={setText} onSend={() => setText('')} placeholder="Ask Observr about pokedex" /></div>}>
      {long && (
        <div className={styles.summary}>
          <span className={styles.summaryHead}>Earlier in this conversation, as Observr remembers it</span>
          You asked why the weekly searches fell; Observr found the drop was the holiday week, not the search. You agreed to
          make <code>type</code> facetable, which was done.
        </div>
      )}
      <UserMessage>Why does "tv" find nothing?</UserMessage>
      <AssistantMessage label="Observr" icon={<Observr />}>
        <ToolSteps summary="Looked at 3 things">
          <ToolStep icon={<Graph />} meta="41 searches">Zero-hit searches this week</ToolStep>
          <ToolStep icon={<Search />} meta="0 records">Searched "tv"</ToolStep>
          <ToolStep icon={<Search />} meta="212 records">Searched "television"</ToolStep>
        </ToolSteps>
        <p>Your records say <strong>television</strong>, never tv, and 41 searches for tv found nothing this week. A synonym joins the two:</p>
        <Proposal accepted={accepted} onDecide={setAccepted} />
      </AssistantMessage>
      {accepted && <>
        <UserMessage>And the second one on the list?</UserMessage>
        <AssistantMessage label="Observr" icon={<Observr />}>
          <p>That was <strong>fridge</strong>: 17 searches, nothing found. Your records use <em>refrigerator</em>. Same kind of fix, shall I propose it?</p>
          <p className={styles.footnote}>It knows which list: what an answer looked at is kept with it, so a follow-up can point back.</p>
        </AssistantMessage>
      </>}
    </ChatPanel>
  );
}

const CONVERSATIONS: { title: string; where: string; when: string; current?: boolean; turns: number }[] = [
  { title: 'Why does tv find nothing?', where: 'pokedex', when: 'now', current: true, turns: 6 },
  { title: 'Weekly searches fell', where: 'pokedex', when: 'yesterday', turns: 8 },
  { title: 'Set up Search or ask', where: 'ecom', when: '3 days ago', turns: 14 },
  { title: 'Which fields should be facets?', where: 'ecom', when: 'last week', turns: 5 },
  { title: 'API keys for the shop', where: 'team indx-intern', when: '2 weeks ago', turns: 4 },
];

function History({ back, onNew }: { back: () => void; onNew: () => void }) {
  return (
    <div className={styles.panel}>
      <PanelHead title="Conversations" back={back} onNew={onNew} />
      <div className={styles.list}>
        {CONVERSATIONS.map(c => (
          <button key={c.title} className={`${styles.row} ${c.current ? styles.rowCurrent : ''}`} onClick={back}>
            <span className={styles.rowTitle}>{c.title}</span>
            <span className={styles.rowMeta}>{c.where} · {c.when} · {c.turns} turns{c.current ? ' · current' : ''}</span>
          </button>
        ))}
      </div>
      <p className={styles.note}>A conversation stays current until you start a new one, or after four quiet hours. Continue any of these where it left off.</p>
    </div>
  );
}

const NOTES: { text: string; from: string }[] = [
  { text: 'A shop for home electronics. Titles matter most; descriptions are long and repetitive.', from: 'You said, 12 Oct' },
  { text: 'Declined: tv and telly as synonyms. They are different product lines here.', from: 'Your No, 20 Oct' },
  { text: 'Declined: making brand searchable. Brand is a filter only.', from: 'Your No, 28 Oct' },
  { text: 'type was made facetable.', from: 'Your Yes, yesterday' },
];

function Memory({ back }: { back: () => void }) {
  const [notes, setNotes] = useState(NOTES);
  return (
    <div className={styles.panel}>
      <PanelHead title="What Observr knows about pokedex" back={back} />
      <p className={styles.note}>Observr reads these with every question about pokedex, so it does not propose what you turned down. Delete what is no longer true.</p>
      <div className={styles.list}>
        {notes.map(n => (
          <div key={n.text} className={styles.noteRow}>
            <div className={styles.noteText}>{n.text}<span className={styles.rowMeta}>{n.from}</span></div>
            <Button variant="ghost" size="micro" iconLeft={<Trash />} aria-label="Forget this" onClick={() => setNotes(ns => ns.filter(x => x !== n))} />
          </div>
        ))}
      </div>
      <p className={styles.note}><Lock size={12} /> Kept on this instance, beside the dataset. Sent to Observr only with a question.</p>
    </div>
  );
}

function NewConversation({ onHistory, onMemory }: { onHistory: () => void; onMemory: () => void }) {
  const [text, setText] = useState('');
  return (
    <ChatPanel aria-label="Observr" hints={false}
      header={<PanelHead title="New conversation" onHistory={onHistory} />}
      composer={<div className={styles.composer}><ContextChip notes={4} onMemory={onMemory} />
        <Composer value={text} onChange={setText} onSend={() => setText('')} placeholder="Ask Observr about pokedex" /></div>}>
      <div className={styles.empty}>
        <span className={styles.emptyMark}><Observr size={28} /></span>
        <p className={styles.emptyText}>Ask about pokedex: what visitors search for, what they do not find, how its fields and settings work.</p>
        <Suggestions label="From this page" items={['What did visitors not find this week?', 'Are the fields set up well?', 'Which searches end without a click?']} onPick={setText} />
      </div>
    </ChatPanel>
  );
}

function Console({ children }: { children: ReactNode }) {
  return (
    <div className={shell.console}>
      <header className={shell.header}>
        <div className={shell.brand}><Button variant="ghost" size="micro" iconLeft={<Indx />} className={shell.brandLink}>Indx Server</Button></div>
        <div className={shell.trail} />
        <div className={shell.right}>
          <Button variant="ghost" size="micro" iconLeft={<Shield />} aria-label="Admin" />
          <Button variant="ghost" size="micro" iconLeft={<Bell />} aria-label="Notifications" />
          <Button variant="ghost" size="micro" iconLeft={<User />} aria-label="anders" />
          <Button variant="secondary" size="micro" iconLeft={<Observr />}>Agent</Button>
        </div>
      </header>
      <div className={shell.body}>
        <div className={shell.column}><Sidebar groups={DATASET} active="synonyms" aria-label="Sections" storageKey="mockup-observr-sidebar" /></div>
        <main className={shell.content}>
          <h2 className={shell.title}>Synonyms</h2>
          <div className={shell.placeholder}><div className={shell.bar} style={{ width: '62%' }} /><div className={shell.bar} style={{ width: '44%' }} /><div className={shell.block} /></div>
        </main>
        <aside className={styles.agent}>{children}</aside>
      </div>
    </div>
  );
}

export default function ObservrAgentMockup() {
  const [view, setView] = useState<View>('conversation');
  const go = (v: View) => () => setView(v);
  return (
    <main className={shell.main}>
      <div className={shell.section}>
        <h1 className={shell.pageTitle}>Mockup: Observr, honest and lasting</h1>
        <p className={shell.desc}>
          The Agent panel as it should be: what it shows is what Observr remembers. One current conversation, remembered whole,
          its older part summarised rather than dropped. New conversation instead of Clear, earlier ones in History. Where you are
          as one chip at the input. And a few notes per dataset that Observr keeps, which you can read and delete.
        </p>
      </div>
      <div className={shell.controls}>
        <SegmentedControl items={VIEWS} value={view} onChange={v => setView(v as View)} size="default" aria-label="View" />
      </div>
      <div className={shell.frames}>
        <div className={`${shell.desktop} ${styles.tall}`}>
          <Console>
            {view === 'history' ? <History back={go('conversation')} onNew={go('new')} />
              : view === 'memory' ? <Memory back={go('conversation')} />
              : view === 'new' ? <NewConversation onHistory={go('history')} onMemory={go('memory')} />
              : <Conversation key={view} long={view === 'long'} onHistory={go('history')} onNew={go('new')} onMemory={go('memory')} />}
          </Console>
        </div>
      </div>
      <div className={shell.section}>
        <h2 className={shell.subTitle}>What changes from today</h2>
        <ul className={shell.list}>
          <li><strong>Memory matches the screen:</strong> today the panel shows 40 turns and Observr reads the last 10. Here the current conversation is read whole; past a length its older part becomes a short summary, shown at the top, so nothing is silently dropped.</li>
          <li><strong>Conversations, not one endless thread:</strong> New conversation replaces Clear, which wiped everything. A conversation also ends after four quiet hours. History lists the earlier ones, each with where it was about, to read or continue.</li>
          <li><strong>Where you are:</strong> one chip at the input, About pokedex, instead of a dataset label on each turn asked elsewhere.</li>
          <li><strong>What an answer looked at</strong> is kept with it, folded (Looked at 3 things), so "the second one" means something in the next question. Today only the text is kept.</li>
          <li><strong>Undo</strong> after a Yes, for a while: saying yes becomes cheap.</li>
          <li><strong>Step 2, notes per dataset:</strong> what you told it and what you declined, kept beside the dataset and read with every question about it, so a No holds. Shown and deletable under "4 notes about pokedex".</li>
          <li><strong>A new conversation</strong> offers questions drawn from the page you are on.</li>
        </ul>
      </div>
    </main>
  );
}
