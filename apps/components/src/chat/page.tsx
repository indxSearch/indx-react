import { useState } from 'react';
import { Button, Chip, SearchField, Spinner, Tabs, Alert, AlertTitle, AlertDescription, Modal } from '@indxsearch/systm';
import { Ai_agent, Api, ArrowUp, Book, Chevron_right, Code, Copy, Refresh, Search, Search_query, Stop, Thumbs_up } from '@indxsearch/pixl';
import styles from './page.module.css';

/**
 * Mockup of the chat "Ask" mode for the docs search palette — the component family a docs
 * assistant (and, later, a dataset assistant in the console) needs: ChatPanel, Message,
 * Composer, Citation, StreamStatus, Suggestions, Feedback. Built from the systm parts that
 * exist; the pieces that don't yet are plain markup here and are the shopping list.
 * Not wired to anything: the state switcher stands in for the conversation.
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
type Source = { n: number; title: string; kind: keyof typeof sourceIcon };

function Ref({ n }: { n: number }) {
  return <a href="#" className={styles.ref} onClick={e => e.preventDefault()}>{n}</a>;
}

function Citations({ sources }: { sources: Source[] }) {
  return (
    <div className={styles.stack}>
      <div className={styles.label}>SOURCES</div>
      <div className={styles.wrap}>
        {sources.map(s => (
          <a key={s.n} href="#" className={styles.citation} onClick={e => e.preventDefault()}>
            <Chip icon={sourceIcon[s.kind]}>{s.n}&nbsp; {s.title}</Chip>
          </a>
        ))}
      </div>
    </div>
  );
}

function StreamStatus({ children }: { children: string }) {
  return (
    <div className={styles.status}>
      <span className={styles.statusSpinner}><Spinner size={14} /></span>
      <span>{children}</span>
    </div>
  );
}

function Feedback({ onFollowUp }: { onFollowUp?: () => void }) {
  return (
    <div className={styles.feedback}>
      <Button variant="ghost" size="micro" aria-label="Helpful" iconLeft={<Thumbs_up />} />
      <Button variant="ghost" size="micro" aria-label="Not helpful" iconLeft={<span className={styles.flipY}><Thumbs_up /></span>} />
      <Button variant="ghost" size="micro" iconLeft={<Copy />}>Copy</Button>
      <span className={styles.spacer} />
      <Button variant="ghost" size="micro" iconRight={<Chevron_right />} onClick={onFollowUp}>Ask a follow-up</Button>
    </div>
  );
}

function UserMessage({ children }: { children: string }) {
  return <div className={styles.userRow}><div className={styles.userMsg}>{children}</div></div>;
}

function AssistantHead() {
  return <div className={styles.assistantHead}><Ai_agent color="currentColor" size={14} /><span>Indx assistant</span></div>;
}

function Composer({ streaming, value, placeholder }: { streaming?: boolean; value?: string; placeholder: string }) {
  return (
    <div className={styles.composer}>
      <div className={styles.composerField}>
        <SearchField inputSize="default" placeholder={placeholder} defaultValue={value} searchIcon={<Ai_agent />} showFocusBorder={false} />
      </div>
      {streaming
        ? <Button variant="secondary" size="micro" aria-label="Stop" iconLeft={<Stop />} />
        : <Button variant="primary" size="micro" aria-label="Send" iconLeft={<ArrowUp />} disabled={!value} />}
    </div>
  );
}

const question = 'How do I stop strangers from signing up on my server?';
const sources: Source[] = [
  { n: 1, title: 'Server setup · Registration control', kind: 'guide' },
  { n: 2, title: 'Server setup · Deploy to Azure', kind: 'guide' },
];

function Thread({ stage, phone }: { stage: Stage; phone: boolean }) {
  switch (stage) {
    case 'empty':
      return (
        <>
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>Ask about Indx</div>
            <div className={styles.emptyDesc}>Answers come from the guides, how-tos and API references, with the pages they came from.</div>
          </div>
          <div className={styles.suggestions}>
            <div className={styles.label}>TRY ASKING</div>
            <div className={styles.wrap}>
              {['How do I set up hybrid search?', 'What does Coverage measure?', 'Restrict who can register', 'Search several JSON types in one index']
                .map(s => <Button key={s} variant="secondary" size="micro">{s}</Button>)}
            </div>
          </div>
        </>
      );
    case 'searching':
      return (
        <>
          <UserMessage>Can I move a dataset to another team?</UserMessage>
          <div className={styles.assistant}><AssistantHead /><StreamStatus>Searching the docs…</StreamStatus></div>
        </>
      );
    case 'streaming':
      return (
        <>
          <UserMessage>Why did my Coverage scores drop after I added synonyms?</UserMessage>
          <div className={styles.assistant}>
            <AssistantHead />
            <p className={styles.answer}>That is by design. Coverage is <code>totalSum / q × 65535</code>, and synonym expansion appends terms to the query text the engine scores against, so a longer <em>q</em> scales every</p>
            <StreamStatus>Writing…</StreamStatus>
          </div>
        </>
      );
    case 'answered':
      return (
        <>
          <UserMessage>{question}</UserMessage>
          <div className={styles.assistant}>
            <AssistantHead />
            <p className={styles.answer}>
              Set the registration mode. The server starts open, and the admin Settings page switches it to <strong>Invite</strong> (only addresses you add can register), <strong>EmailDomain</strong> (anyone on your domain), or <strong>Closed</strong>.<Ref n={1} /> The same setting is exposed for deployment:
            </p>
            <pre className={styles.code}>Indx__Registration__Mode=Invite</pre>
            {!phone && (
              <p className={styles.answer}>Invites are then managed under Admin → Users; an invited address can register once and drops off the list when the account exists.<Ref n={2} /></p>
            )}
            <Citations sources={sources} />
            <Feedback />
          </div>
        </>
      );
    case 'error':
      return (
        <>
          <UserMessage>Can I move a dataset to another team?</UserMessage>
          <div className={styles.assistant}>
            <AssistantHead />
            <Alert variant="default" icon={null}>
              <AlertTitle>The answer did not come through</AlertTitle>
              <AlertDescription>The connection dropped while the answer was being written. Your question is kept.</AlertDescription>
              <div style={{ marginTop: 10 }}><Button variant="secondary" size="micro" iconLeft={<Refresh />}>Try again</Button></div>
            </Alert>
          </div>
        </>
      );
    case 'limited':
      return (
        <>
          <UserMessage>Can I move a dataset to another team?</UserMessage>
          <div className={styles.assistant}>
            <AssistantHead />
            <Alert variant="default" icon={null}>
              <AlertTitle>Too many questions for now</AlertTitle>
              <AlertDescription>You can ask again in about a minute. Search still works in the meantime.</AlertDescription>
              <div style={{ marginTop: 10 }}><Button variant="ghost" size="micro" iconLeft={<Search />}>Switch to search</Button></div>
            </Alert>
          </div>
        </>
      );
  }
}

function ChatPanel({ stage, phone, mode, onMode }: { stage: Stage; phone: boolean; mode: string; onMode: (m: string) => void }) {
  const streaming = stage === 'searching' || stage === 'streaming';
  const placeholder = stage === 'empty' ? 'Ask about Indx…' : 'Ask a follow-up…';
  return (
    <div className={`${styles.panel} ${phone ? styles.panelPhone : styles.panelDesktop}`}>
      <div className={styles.modeTabs}><Tabs items={modes} value={mode} onValueChange={onMode} size="micro" /></div>
      <div className={styles.thread}><Thread stage={stage} phone={phone} /></div>
      <Composer streaming={streaming} placeholder={placeholder} />
      <div className={styles.hints}>
        <span><kbd className={styles.kbd}>↵</kbd> send</span>
        <span><kbd className={styles.kbd}>⇧↵</kbd> new line</span>
        <span><kbd className={styles.kbd}>esc</kbd> close</span>
      </div>
    </div>
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
        <h1 className={styles.title}>Chat · Ask mode</h1>
        <p className={styles.desc}>
          The docs assistant as a second tab in the search palette. One conversation shown state by state; the parts
          — ChatPanel, Message, Composer, Citation, StreamStatus, Suggestions, Feedback — are what indx-systm gains.
        </p>
      </div>

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
          <ChatPanel stage={stage} phone={false} mode={mode} onMode={setMode} />
        </Modal>
      </div>

      <div className={styles.stage}>
        <ChatPanel stage={stage} phone={phone} mode={mode} onMode={setMode} />
      </div>
    </main>
  );
}
