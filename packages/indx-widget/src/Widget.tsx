import React, { useEffect, useRef, useState } from 'react';
import {
  SearchProvider, SearchInput, SearchResults, AskPanel, ValueFilterPanel,
  useSearchContext, useSearchOrAsk, useFilterSuggestion,
} from '@indxsearch/intrface';
import type { SearchResultMeta } from '@indxsearch/intrface';
import { Button, Modal } from '@indxsearch/systm';
import { Search } from '@indxsearch/pixl';
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
  /** The fields a result card shows: its title, an image URL, a price, and a line of text. */
  titleField?: string;
  imageField?: string;
  priceField?: string;
  textField?: string;
  /** Where a result leads: a field holding a URL, or a template such as "/products/{id}". */
  link?: string;
  /** Fields to filter on, one value filter each (they must be Facetable). */
  filters: string[];
}

export function Widget(config: WidgetConfig) {
  return (
    <SearchProvider
      url={config.url}
      team={config.team}
      dataset={config.dataset}
      preAuthenticatedToken={config.token}
      source={config.source}
      enableFacets={config.filters.length > 0}
      // A list may be filters alone: an answer on a catalogue turns a description into filters and
      // clears the field, and the products it found must still show.
      allowEmptySearch
      maxResults={30}
    >
      <ConvertRegistration />
      {config.mode === 'overlay' ? <Overlay config={config} /> : <SearchView config={config} />}
    </SearchProvider>
  );
}

/** Makes this element's search the one IndxSearch.convert() reports to. */
function ConvertRegistration() {
  const { convertResult } = useSearchContext();
  useEffect(() => (convertResult ? registerConverter(convertResult) : undefined), [convertResult]);
  return null;
}

/** The search itself: the field with the offer to ask, the answer when asked, filters and results. */
function SearchView({ config, inOverlay }: { config: WidgetConfig; inOverlay?: boolean }) {
  const sor = useSearchOrAsk();
  const { state } = useSearchContext();
  const ref = useRef<HTMLDivElement>(null);
  // Opened over the page, the field takes the typing at once. After the dialog's own focus move,
  // which puts focus on its first control (the close button) once it has mounted.
  useEffect(() => {
    if (!inOverlay) return;
    const t = setTimeout(() => ref.current?.querySelector('input')?.focus(), 30);
    return () => clearTimeout(t);
  }, [inOverlay]);
  // Over the page the list waits for something to be typed or filtered; a search page may show
  // everything to browse before that.
  const filtered = Object.keys(state.filters).length + Object.keys(state.rangeFilters).length + Object.keys(state.bucketFilters ?? {}).length > 0;
  const showResults = !inOverlay || state.query.trim().length > 0 || filtered;
  const suggestion = useFilterSuggestion({ auto: sor });
  const [question, setQuestion] = useState<string | null>(null);
  const fields = [config.titleField, config.imageField, config.priceField, config.textField, ...linkFields(config.link)]
    .filter((f): f is string => !!f);

  return (
    <div className="indx-widget" ref={ref}>
      <div className="indx-widget-field">
        <SearchInput onAsk={setQuestion} searchOrAsk={sor} showFocus={inOverlay} />
      </div>
      {question && (
        <div className="indx-widget-answer">
          <AskPanel question={question} followUps onFilters={suggestion.apply} />
        </div>
      )}
      {showResults && (
      <div className={config.filters.length > 0 ? 'indx-widget-body indx-widget-body-filters' : 'indx-widget-body'}>
        {config.filters.length > 0 && (
          <div className="indx-widget-filters">
            {config.filters.map(f => <ValueFilterPanel key={f} field={f} label={labelOf(f)} limit={12} />)}
          </div>
        )}
        {/* One cell: SearchResults renders its message, list and "load more" side by side. */}
        <div className="indx-widget-results">
          <SearchResults fields={fields.length > 0 ? fields : undefined} resultsPerPage={10} searchOrAsk={sor} showScore={false}>
            {(item, meta) => <ResultCard item={item} meta={meta} config={config} />}
          </SearchResults>
        </div>
      </div>
      )}
    </div>
  );
}

/** A result: its image, title, price and line of text where those fields are named. Choosing it
 *  reports the select before the page moves on, so the statistics see the click. */
function ResultCard({ item, meta, config }: { item: Record<string, any>; meta: SearchResultMeta; config: WidgetConfig }) {
  const title = text(item[config.titleField ?? '']) ?? firstText(item) ?? `#${meta.result.documentKey}`;
  const href = linkOf(config.link, item);
  const image = text(item[config.imageField ?? '']);
  const price = text(item[config.priceField ?? '']);
  const line = text(item[config.textField ?? '']);

  const open = async (e: React.MouseEvent) => {
    if (!href) { void meta.select(); return; }
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) { void meta.select(); return; }
    e.preventDefault();
    await Promise.race([meta.select(), new Promise(r => setTimeout(r, 300))]);
    window.location.assign(href);
  };

  return (
    <a className="indx-widget-card" href={href ?? undefined} onClick={open}>
      {image && <img className="indx-widget-card-image" src={image} alt="" loading="lazy" />}
      <span className="indx-widget-card-text">
        <span className="indx-widget-card-title">{title}</span>
        {line && <span className="indx-widget-card-line">{line}</span>}
      </span>
      {price && <span className="indx-widget-card-price">{price}</span>}
    </a>
  );
}

/** The field in the header, and the search over the page when it opens: on a click, on typing a
 *  letter into it, or on Ctrl+K / Cmd+K anywhere on the page. */
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
      <Button variant="secondary" className="indx-widget-trigger" iconLeft={<Search size={14} color="currentColor" />} onClick={() => setOpen(true)}>
        {config.placeholder ?? 'Search'}
        <kbd className="indx-widget-kbd">{isMac() ? '⌘K' : 'Ctrl K'}</kbd>
      </Button>
      <Modal open={open} onOpenChange={setOpen} className="indx-widget-overlay" showClose={false}>
        <SearchView config={config} inOverlay />
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
