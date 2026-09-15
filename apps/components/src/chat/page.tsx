import { useState } from 'react';
import {
  Button, Tabs, Alert, AlertTitle, AlertDescription, Modal,
  ChatPanel, UserMessage, AssistantMessage, Composer, CitationRef, CitationList, StreamStatus, Suggestions, AnswerActions,
} from '@indxsearch/systm';
import { Api, Book, Code, Refresh, Search, Search_query } from '@indxsearch/pixl';
import styles from './page.module.css';

/**
 * The Chat family: ChatPanel, UserMessage / AssistantMessage, Composer, CitationRef /
 * CitationList, StreamStatus, Suggestions, AnswerActions. Shown part by part, then assembled
 * as the docs assistant's Ask tab, one conversation state by state. Nothing here is wired to
 * a model; the live one is the Ask tab on docs.indx.co.
 */

type Stage = 'empty' | 'searching' | 'streaming' | 'answered' | 'error' | 'limited';

const stages = [
  { label: 'Empty', value: 'empty' },
  { label: 'Searching', value: 'searching' },
  { label: 'Streaming', value: 'streaming' },
  { label: 'Answered', value: 'answered' },
  { label: 'Error', value: 'error' },
  { label: 'Rate limited', value: 'limited' },
];
const frames = [{ label: 'Desktop', value: 'desktop' }, { label: 'Phone', value: 'phone' }];
const modes = [{ label: 'Search', value: 'search' }, { label: 'Ask', value: 'ask' }];

const sourceIcon = { guide: <Book />, howto: <Search_query />, csharp: <Code />, http: <Api /> };

const question = 'How do I stop strangers from signing up on my server?';
const sources = [
  { n: 1, title: 'Server setup · Registration control', icon: sourceIcon.guide, href: '#' },
  { n: 2, title: 'Server setup · Deploy to Azure', icon: sourceIcon.guide, href: '#' },
];
const stop = (e: React.MouseEvent) => e.preventDefault();

function Assistant({ children }: { children: React.ReactNode }) {
  return <AssistantMessage label="Indx assistant">{children}</AssistantMessage>;
}

function Thread({ stage, phone, onPick }: { stage: Stage; phone: boolean; onPick: (s: string) => void }) {
  switch (stage) {
    case 'empty':
      return (
        <>
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Ask about Indx</div>
            <div className={styles.emptyDesc}>Answers come from the guides, how-tos and API references, with the pages they came from.</div>
          </div>
          <Suggestions
            items={['How do I set up hybrid search?', 'What does Coverage measure?', 'Restrict who can register', 'Search several JSON types in one index']}
            onPick={onPick}
          />
        </>
      );
    case 'searching':
      return (
        <>
          <UserMessage>Can I move a dataset to another team?</UserMessage>
          <Assistant><StreamStatus>Searching the docs…</StreamStatus></Assistant>
        </>
      );
    case 'streaming':
      return (
        <>
          <UserMessage>Why did my Coverage scores drop after I added synonyms?</UserMessage>
          <Assistant>
            <p>That is by design. Coverage is <code>totalSum / q × 65535</code>, and synonym expansion appends terms to the query text the engine scores against, so a longer <em>q</em> scales every</p>
            <StreamStatus>Writing…</StreamStatus>
          </Assistant>
        </>
      );
    case 'answered':
      return (
        <>
          <UserMessage>{question}</UserMessage>
          <Assistant>
            <p>
              Set the registration mode. The server starts open, and the admin Settings page switches it to <strong>Invite</strong> (only addresses you add can register), <strong>EmailDomain</strong> (anyone on your domain), or <strong>Closed</strong>.<CitationRef n={1} href="#" onClick={stop} /> The same setting is exposed for deployment:
            </p>
            <pre className={styles.code}>Indx__Registration__Mode=Invite</pre>
            {!phone && (
              <p>Invites are then managed under Admin → Users; an invited address can register once and drops off the list when the account exists.<CitationRef n={2} href="#" onClick={stop} /></p>
            )}
            <CitationList items={sources.map(s => ({ ...s, onClick: stop }))} />
            <AnswerActions onCopy={() => {}} onFollowUp={() => {}} />
          </Assistant>
        </>
      );
    case 'error':
      return (
        <>
          <UserMessage>Can I move a dataset to another team?</UserMessage>
          <Assistant>
            <Alert variant="default" icon={null}>
              <AlertTitle>The answer did not come through</AlertTitle>
              <AlertDescription>The connection dropped while the answer was being written. Your question is kept.</AlertDescription>
              <div style={{ marginTop: 10 }}><Button variant="secondary" size="micro" iconLeft={<Refresh />}>Try again</Button></div>
            </Alert>
          </Assistant>
        </>
      );
    case 'limited':
      return (
        <>
          <UserMessage>Can I move a dataset to another team?</UserMessage>
          <Assistant>
            <Alert variant="default" icon={null}>
              <AlertTitle>Too many questions for now</AlertTitle>
              <AlertDescription>You can ask again in about a minute. Search still works in the meantime.</AlertDescription>
              <div style={{ marginTop: 10 }}><Button variant="ghost" size="micro" iconLeft={<Search />}>Switch to search</Button></div>
            </Alert>
          </Assistant>
        </>
      );
  }
}

function Panel({ stage, phone, mode, onMode }: { stage: Stage; phone: boolean; mode: string; onMode: (m: string) => void }) {
  const [draft, setDraft] = useState('');
  const streaming = stage === 'searching' || stage === 'streaming';
  const placeholder = stage === 'empty' ? 'Ask about Indx…' : 'Ask a follow-up…';
  return (
    <ChatPanel
      className={phone ? styles.panelPhone : styles.panelDesktop}
      header={<Tabs items={modes} value={mode} onValueChange={onMode} size="micro" />}
      composer={<Composer value={draft} onChange={setDraft} onSend={() => setDraft('')} onStop={() => {}} streaming={streaming} placeholder={placeholder} />}
      hints={phone ? false : undefined}
    >
      <Thread stage={stage} phone={phone} onPick={setDraft} />
    </ChatPanel>
  );
}

/** One demo box with a label, for the parts section. */
function Demo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.demo}>
      <div className={styles.demoLabel}>{label}</div>
      {children}
    </div>
  );
}

function ComposerDemo() {
  const [empty, setEmpty] = useState('');
  const [typed, setTyped] = useState('Can I move a dataset to another team?');
  const [long, setLong] = useState('Enter sends.\nShift+Enter breaks the line, and the field grows with it\nup to maxLines, then scrolls.');
  return (
    <div className={styles.stack}>
      <Demo label="Empty — Send disabled"><Composer value={empty} onChange={setEmpty} onSend={() => setEmpty('')} placeholder="Ask about Indx…" /></Demo>
      <Demo label="Typed — Enter or the button sends"><Composer value={typed} onChange={setTyped} onSend={() => setTyped('')} /></Demo>
      <Demo label="Multi-line"><Composer value={long} onChange={setLong} onSend={() => setLong('')} /></Demo>
      <Demo label="Streaming — Send is Stop, Enter does nothing"><Composer value="" onChange={() => {}} onSend={() => {}} onStop={() => {}} streaming placeholder="Ask a follow-up…" /></Demo>
    </div>
  );
}

function ActionsDemo() {
  const [copied, setCopied] = useState(false);
  return (
    <AnswerActions
      copied={copied}
      onCopy={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      onFollowUp={() => {}}
    />
  );
}

export default function ChatPage() {
  const [stage, setStage] = useState<Stage>('answered');
  const [frame, setFrame] = useState('desktop');
  const [mode, setMode] = useState('ask');
  const [open, setOpen] = useState(false);
  const phone = frame === 'phone';

  return (
    <main className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Chat</h1>
        <p className={styles.desc}>
          A conversation with an assistant, as parts that compose: <code>ChatPanel</code> frames it,
          <code>UserMessage</code> and <code>AssistantMessage</code> are the turns, <code>Composer</code> takes the
          next one, <code>CitationRef</code> and <code>CitationList</code> point answers at their sources, and
          <code>StreamStatus</code>, <code>Suggestions</code> and <code>AnswerActions</code> fill the moments around
          an answer. The rendering of the answer itself is the host's — markdown, code, tables — so the parts
          carry no text styling beyond the message frame.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Messages</h2>
        <div className={styles.stack}>
          <Demo label="UserMessage — right-aligned, keeps line breaks">
            <UserMessage>{'Why did my Coverage scores drop\nafter I added synonyms?'}</UserMessage>
          </Demo>
          <Demo label="AssistantMessage — labelled head, then whatever the answer is made of">
            <Assistant>
              <p>That is by design. Coverage scales with the length of the query text, and synonym expansion makes the text longer.<CitationRef n={1} href="#" onClick={stop} /></p>
            </Assistant>
          </Demo>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Composer</h2>
        <ComposerDemo />
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Citations</h2>
        <div className={styles.stack}>
          <Demo label="CitationRef — inline, numbered, a link when it has an href">
            <p className={styles.prose}>
              The server starts open<CitationRef n={1} href="#" onClick={stop} title="Server setup · Registration control" /> and invites are managed under Admin → Users.<CitationRef n={2} href="#" onClick={stop} /> A ref without an href is a button.<CitationRef n={3} onClick={() => {}} />
            </p>
          </Demo>
          <Demo label="CitationList — the sources, with the icon of each source type">
            <CitationList items={[
              ...sources.map(s => ({ ...s, onClick: stop })),
              { n: 3, title: 'ISearchEngine · Methods', icon: sourceIcon.csharp, href: '#', onClick: stop },
              { n: 4, title: 'HTTP API · Search', icon: sourceIcon.http, href: '#', onClick: stop },
            ]} />
          </Demo>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Status, suggestions, actions</h2>
        <div className={styles.stack}>
          <Demo label="StreamStatus — what the assistant is doing right now">
            <div className={styles.stackTight}>
              <StreamStatus>Searching the docs…</StreamStatus>
              <StreamStatus>Writing…</StreamStatus>
            </div>
          </Demo>
          <Demo label="Suggestions — questions to start from, shown while the thread is empty">
            <Suggestions items={['How do I set up hybrid search?', 'What does Coverage measure?', 'Restrict who can register']} onPick={() => {}} />
          </Demo>
          <Demo label="AnswerActions — Copy acknowledges, the follow-up focuses the composer">
            <ActionsDemo />
          </Demo>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Assembled — the docs assistant, state by state</h2>
        <div className={styles.controls}>
          <Tabs items={stages} value={stage} onValueChange={v => setStage(v as Stage)} size="micro" />
          <Tabs items={frames} value={frame} onValueChange={setFrame} size="micro" />
          <Modal
            open={open}
            onOpenChange={setOpen}
            showClose={false}
            className={styles.modal}
            trigger={<Button variant="secondary" size="micro">Open as modal</Button>}
          >
            <Panel stage={stage} phone={false} mode={mode} onMode={setMode} />
          </Modal>
        </div>
        <div className={styles.stage}>
          <Panel stage={stage} phone={phone} mode={mode} onMode={setMode} />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Usage</h2>
        <p className={styles.desc}>
          Give <code>ChatPanel</code> a height and the thread scrolls; pass <code>threadRef</code> to keep the newest
          text in view while streaming. <code>Composer</code> is controlled: <code>onSend</code> gets the trimmed text,
          and while <code>streaming</code> the button is Stop and Enter is ignored. Citations are numbers into the
          list you render; the host decides what a click does. Hints default to Enter / Shift+Enter / Esc and
          take <code>false</code> to hide the row, which the phone frame does.
        </p>
      </div>
    </main>
  );
}
