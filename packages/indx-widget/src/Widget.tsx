import React, { useEffect, useRef, useState } from 'react';
import {
  AskPanel, SearchInput, SearchProvider, SearchResults, SearchResultRow, ValueFilterPanel,
  useFilterSuggestion, useSearchContext, useSearchOrAsk,
} from '@indxsearch/intrface';
import type { AskFilters, AskStatus, SearchResultMeta } from '@indxsearch/intrface';
import { Base, Button, Chip, Composer, Kbd, Modal, StreamStatus, Suggestions } from '@indxsearch/systm';
import { Ai_agent, Compose, Indx, Search, Sliders_horizontal } from '@indxsearch/pixl';
import { registerConverter } from './registry';

/** What an <indx-search> element says about itself, read from its attributes. */
export interface WidgetConfig {
  url: string;
  team: string;
  dataset: string;
  token?: string;
  mode: 'page' | 'overlay';
  source: string;
  placeholder?: string;
  /** The fields a result shows: its title, an image URL, a price, a line of text, and chips. */
  titleField?: string;
  imageField?: string;
  priceField?: string;
  textField?: string;
  chipFields: string[];
  /** Where a result leads: a field holding a URL, or a template such as "/products/{id}". */
  link?: string;
  /** Fields to filter on, one value filter each (they must be Facetable). */
  filters: string[];
  /** Questions the assistant offers to start from. */
  examples: string[];
}

/**
 * The search as indx.co's hero has it (indx-web-v4, SearchAskDemo), for any dataset: the field
 * and the results on a framed surface, and beside them a column that switches between Filters and
 * the Assistant. The field judges what is typed (Search or ask); a strong offer puts a prompt above
 * the results; asking opens the assistant, whose filters go on the list once its search settles.
 * Under 800px the column gives way to two buttons under the field and a panel in the results' place.
 */
export function Widget(config: WidgetConfig) {
  return (
    <SearchProvider
      url={config.url}
      team={config.team}
      dataset={config.dataset}
      preAuthenticatedToken={config.token}
      source={config.source}
      // A list may be filters alone: the assistant turns a description into filters and the
      // products it found must show without text in the field.
      allowEmptySearch
      enableFacets={config.filters.length > 0}
      maxResults={30}
      facetDebounceDelayMillis={200}
    >
      <ConvertRegistration />
      {config.mode === 'overlay' ? <Overlay config={config} /> : <Layout config={config} />}
    </SearchProvider>
  );
}

/** Makes this element's search the one IndxSearch.convert() reports to. */
function ConvertRegistration() {
  const { convertResult } = useSearchContext();
  useEffect(() => (convertResult ? registerConverter(convertResult) : undefined), [convertResult]);
  return null;
}

/** How long the list must stay unchanged after the assistant's filters before it is shown:
 *  longer than the facet search's debounce and its round trip. */
const SETTLE_MS = 450;

type Panel = 'filters' | 'assistant';

function Layout({ config, inOverlay }: { config: WidgetConfig; inOverlay?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [open, setOpen] = useState(false);
  const { state, setQuery, setSearchSettings } = useSearchContext();
  const sor = useSearchOrAsk();
  const suggestion = useFilterSuggestion({ auto: sor });
  const hasFilters = config.filters.length > 0;
  const hasAssistant = sor.available;
  const panels: { value: Panel; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
    ...(hasFilters ? [{ value: 'filters' as Panel, label: 'Filters', icon: Sliders_horizontal }] : []),
    ...(hasAssistant ? [{ value: 'assistant' as Panel, label: 'Assistant', icon: Ai_agent }] : []),
  ];
  const [panel, setPanel] = useState<Panel>(hasFilters ? 'filters' : 'assistant');
  useEffect(() => { if (!hasFilters && hasAssistant) setPanel('assistant'); }, [hasFilters, hasAssistant]);
  const hasSide = panels.length > 0;

  const [question, setQuestion] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [askStatus, setAskStatus] = useState<AskStatus>('idle');
  // What the results wait for after asking: the assistant's filters ('asking'), then the page's
  // own search with them ('applied', with the queryId the list had before).
  const [pending, setPending] = useState<{ phase: 'asking' } | { phase: 'applied'; before?: string } | null>(null);
  // Typing after asking hands the field back to the judge; the assistant's own search (it
  // rewrites the query) must not, which is why it is the keys that count and not the text.
  const [typedSinceAsk, setTypedSinceAsk] = useState(true);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setSearchSettings({ placeholderText: config.placeholder ?? (hasAssistant ? 'Search, or ask' : 'Search'), showScore: false });
  }, [setSearchSettings, config.placeholder, hasAssistant]);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width <= 800));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { if (!narrow) setOpen(false); }, [narrow]);

  // Opened over the page, the field takes the typing at once: after the dialog's own focus move,
  // which puts focus on its first control once it has mounted.
  useEffect(() => {
    if (!inOverlay) return;
    const t = setTimeout(() => ref.current?.querySelector('input')?.focus(), 30);
    return () => clearTimeout(t);
  }, [inOverlay]);

  const ask = (text: string) => {
    const q = text?.trim();
    if (!q) return;
    setQuestion(q);
    setRun(r => r + 1);
    setAskStatus('idle');
    setTypedSinceAsk(false);
    setPending({ phase: 'asking' });
    setPanel('assistant');
    if (narrow) setOpen(true);
  };
  const askExample = (text: string) => { setQuery(text); ask(text); };
  // Asked from the assistant itself, the search field is left as it is.
  const askHere = (text: string) => { setDraft(''); ask(text); };
  const newConversation = () => { setQuestion(null); setRun(r => r + 1); };

  const onFilters = (f: AskFilters) => {
    suggestion.apply(f);
    setPending({ phase: 'applied', before: state.queryId });
  };
  // Settled, not merely landed: after the filters the page searches more than once (the fast
  // search, then the debounced facet search, which can bring a different list).
  useEffect(() => {
    if (!pending) return;
    if (pending.phase === 'applied' && !state.isLoading && state.queryId !== pending.before) {
      const t = setTimeout(() => setPending(null), SETTLE_MS);
      return () => clearTimeout(t);
    }
    // No filters came (a failure, a limit, or an answer that needed none): the answer is the end.
    if (pending.phase === 'asking' && ['answered', 'error', 'limited'].includes(askStatus)) setPending(null);
  }, [pending, state.isLoading, state.queryId, askStatus]);
  // Never wait for ever: a search that does not come back shows what there is.
  useEffect(() => {
    if (!pending) return;
    const t = setTimeout(() => setPending(null), pending.phase === 'applied' ? 4000 : 30000);
    return () => clearTimeout(t);
  }, [pending]);

  const text = state.query.trim();
  const asked = question != null && !typedSinceAsk;
  // While the offer stands for what is in the field: typing on keeps the prompt, a backspace
  // takes it away until the judge has read the new text.
  const strong = sor.offer === 'strong' && sor.stands;
  const main = asked ? (pending ? 'working' : 'results') : strong ? 'prompt' : 'results';
  // Over the page the list waits for something to be typed or filtered; a search page may show
  // everything to browse before that.
  const filtered = Object.keys(state.filters).length + Object.keys(state.rangeFilters).length + Object.keys(state.bucketFilters ?? {}).length > 0;
  const showResults = !inOverlay || text.length > 0 || filtered || asked;

  const toggle = (value: Panel) => {
    if (open && panel === value) setOpen(false);
    else { setPanel(value); setOpen(true); }
  };

  const fields = [config.titleField, config.imageField, config.priceField, config.textField, ...config.chipFields, ...linkFields(config.link)]
    .filter((f): f is string => !!f);

  // Both panels stay mounted: switching to the filters must not throw the conversation away.
  const side = (
    <div className="side">
      {!narrow && (
        <div className="side-head">
          {panels.length > 1 ? (
            <div className="switch" role="group" aria-label="Side panel">
              {panels.map(p => (
                <Button key={p.value} size="micro" variant={panel === p.value ? 'secondary' : 'ghost'} aria-pressed={panel === p.value}
                        iconLeft={<p.icon />} onClick={() => setPanel(p.value)}>{p.label}</Button>
              ))}
            </div>
          ) : <span />}
          <span className="logo"><Indx size={28} color="var(--lv4)" /></span>
        </div>
      )}
      <div className="panels">
        {hasFilters && (
          <div className="filters" hidden={panel !== 'filters'}>
            {config.filters.map(f => <ValueFilterPanel key={f} field={f} label={labelOf(f)} control="checkbox" limit={10} />)}
          </div>
        )}
        {hasAssistant && (
          <div className="assistant" hidden={panel !== 'assistant'}>
            {question ? (
              <>
                <div className="assistant-head">
                  <Button variant="ghost" size="micro" iconLeft={<Compose />} onClick={newConversation}>New conversation</Button>
                </div>
                <AskPanel key={run} question={question} followUps fill className="ask-fill"
                          onFilters={onFilters} onStatusChange={setAskStatus} />
              </>
            ) : (
              <div className="empty">
                <p>Ask a question, or describe what you are looking for. The answer comes from this site, with the records it used.</p>
                {config.examples.length > 0 && <Suggestions items={config.examples} onPick={askExample} />}
                <Composer value={draft} onChange={setDraft} onSend={askHere}
                          placeholder="Ask the assistant…" aria-label="Ask the assistant" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="wrapper" ref={ref}>
      <Base className={`component ${!narrow && hasSide ? 'tall' : ''}`}>
        <div className="main">
          <div className="header" onKeyDown={e => { if (e.key !== 'Enter') setTypedSinceAsk(true); }}>
            <SearchInput showFocus={false} className="search-input" onAsk={ask} searchOrAsk={sor} askOffer="none" />
            {(narrow || !hasSide) && <div className="meta"><span className="logo"><Indx size={28} color="var(--lv4)" /></span></div>}
          </div>
          {narrow && hasSide && (
            <div className="mobile-bar">
              {open && <Button variant="secondary" size="micro" className="mobile-back" onClick={() => setOpen(false)}>Show results</Button>}
              {panels.map(p => (
                <Button key={p.value} size="micro" variant={open && panel === p.value ? 'secondary' : 'ghost'}
                        aria-pressed={open && panel === p.value} iconLeft={<p.icon />} onClick={() => toggle(p.value)}>{p.label}</Button>
              ))}
            </div>
          )}
          {narrow && open && <div className="mobile-panel">{side}</div>}
          <div className="body" hidden={narrow && open}>
            {main === 'prompt' && (
              <div className="prompt" aria-live="polite">
                <span className="prompt-icon"><Ai_agent size={20} color="currentColor" /></span>
                <div className="prompt-text">
                  <span className="prompt-title">This reads like a question</span>
                  <p>The assistant answers it from this site, and puts what it means on the list.</p>
                </div>
                <div className="prompt-actions">
                  <Button variant="primary" className="ask-strong" iconLeft={<Ai_agent />} iconRight={<Kbd>Enter ↵</Kbd>} onClick={() => ask(text)}>Ask the assistant</Button>
                </div>
              </div>
            )}
            {main === 'working' && (
              <div className="working"><StreamStatus spinner="searching">The assistant is searching…</StreamStatus></div>
            )}
            {/* The prompt sits above the results, not in their place: with Ask phrases the list under
                a question is usually the right one. Only the wait after asking hides it. */}
            <div hidden={main === 'working' || !showResults}>
              <SearchResults fields={fields.length > 0 ? fields : undefined} resultsPerPage={8} searchOrAsk={sor} showScore={false} parseArrayStrings>
                {(item, meta) => <Result item={item} meta={meta} config={config} />}
              </SearchResults>
            </div>
          </div>
        </div>
        {/* The column takes the results' height and gives nothing to it: the panel fills it,
            scrolling inside, never stretching it. */}
        {!narrow && hasSide && <div className="column"><div className="frame">{side}</div></div>}
      </Base>
    </div>
  );
}

/** A result as the hero's films are: an image beside a title row with chips, a line of text. The
 *  title is what a visitor clicks, which reports the select before the page moves on. */
function Result({ item, meta, config }: { item: Record<string, any>; meta: SearchResultMeta; config: WidgetConfig }) {
  const title = text(item[config.titleField ?? '']) ?? firstText(item) ?? `#${meta.result.documentKey}`;
  const href = linkOf(config.link, item);
  const image = text(item[config.imageField ?? '']);
  const price = text(item[config.priceField ?? '']);
  const line = text(item[config.textField ?? '']);
  const chips = config.chipFields.flatMap(f => values(item[f])).slice(0, 6);

  const open = async (e: React.MouseEvent) => {
    if (!href || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) { void meta.select(); return; }
    e.preventDefault();
    await Promise.race([meta.select(), new Promise(r => setTimeout(r, 300))]);
    window.location.assign(href);
  };

  return (
    <div className="result">
      {config.imageField && (
        <img key={meta.result.documentKey} className="result-image" src={image} alt="" loading="lazy"
             onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
      )}
      <div className="result-body">
        <SearchResultRow variant="title">
          <a className="result-title" href={href ?? '#'} onClick={open}>{title}</a>
          {price && <Chip>{price}</Chip>}
        </SearchResultRow>
        {line && <p className="result-line">{line}</p>}
        {chips.length > 0 && (
          <SearchResultRow>{chips.map((c, i) => <Chip key={`${c}-${i}`}>{c}</Chip>)}</SearchResultRow>
        )}
      </div>
    </div>
  );
}

/** The field in the header, and the whole search over the page when it opens: on a click, or on
 *  Ctrl+K / Cmd+K anywhere on the page. */
function Overlay({ config }: { config: WidgetConfig }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Button variant="secondary" className="trigger" iconLeft={<Search size={14} color="currentColor" />} onClick={() => setOpen(true)}>
        {config.placeholder ?? 'Search'}
        <kbd className="trigger-kbd">{isMac() ? '⌘K' : 'Ctrl K'}</kbd>
      </Button>
      <Modal open={open} onOpenChange={setOpen} className="overlay" showClose={false}>
        <Layout config={config} inOverlay />
      </Modal>
    </>
  );
}

function isMac() {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
}

function labelOf(field: string) {
  const words = field.replace(/[_.-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function text(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.length > 0 ? text(value[0]) : undefined;
  const s = String(value).trim();
  return s.length > 0 ? s : undefined;
}

function values(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value.map(v => text(v)).filter((v): v is string => !!v);
  const s = text(value);
  return s ? [s] : [];
}

function firstText(item: Record<string, any>) {
  for (const v of Object.values(item)) if (typeof v === 'string' && v.trim()) return v.trim();
  return undefined;
}

/** The fields a link template names, so the search returns them. */
function linkFields(link?: string): string[] {
  if (!link) return [];
  if (!link.includes('{')) return /^[\w.]+$/.test(link) ? [link] : [];
  return [...link.matchAll(/\{([\w.]+)\}/g)].map(m => m[1]);
}

/** A result's address: the template with its fields filled in, or the named field's value. */
function linkOf(link: string | undefined, item: Record<string, any>): string | undefined {
  if (!link) return undefined;
  if (link.includes('{')) return link.replace(/\{([\w.]+)\}/g, (_, f) => encodeURIComponent(text(item[f]) ?? ''));
  return text(item[link]);
}
