import { useState } from 'react';
import {
  Button, Tabs, Alert, AlertTitle, AlertDescription, Modal,
  ChatPanel, UserMessage, AssistantMessage, Composer, CitationRef, CitationList, StreamStatus, Suggestions, AnswerActions,
} from '@indxsearch/systm';
import { Api, Book, Code, Refresh, Search, Search_query } from '@indxsearch/pixl';
import styles from './page.module.css';

/**
 * The chat "Ask" mode for the docs search palette, shown state by state — the demo of the systm
 * Chat family: ChatPanel, UserMessage / AssistantMessage, Composer, CitationRef / CitationList,
 * StreamStatus, Suggestions, AnswerActions. Not wired to anything: the state switcher stands in
 * for the conversation. The live one is the Ask tab in indx-docs.
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
          The docs assistant as a second tab in the search palette, one conversation shown state by state. Built from the
          systm Chat family — ChatPanel, UserMessage / AssistantMessage, Composer, CitationRef / CitationList,
          StreamStatus, Suggestions, AnswerActions. The live one is the Ask tab on docs.indx.co.
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
          <Panel stage={stage} phone={false} mode={mode} onMode={setMode} />
        </Modal>
      </div>

      <div className={styles.stage}>
        <Panel stage={stage} phone={phone} mode={mode} onMode={setMode} />
      </div>
    </main>
  );
}
