import React, { useEffect, useId, useRef, useState } from 'react';
import { Search } from '@indxsearch/pixl';
import { Kbd } from '../Kbd/Kbd';
import styles from './CommandPalette.module.css';

// A jump menu over the page: Cmd or Ctrl and K opens it anywhere, typing narrows it, the arrows
// move the highlight, Enter goes and Escape closes. It shows what it is given: the page that hosts
// it searches (the Indx console with Indx itself) and hands back the items, grouped and in order.
// The Blazor CommandPalette in Indx.Systm.Blazor is its port.

export interface CommandPaletteItem {
  /** What it goes to: the host's own key. */
  id: string;
  label: string;
  /** Consecutive items of one group are listed under its name. */
  group?: string;
  /** A 14px pixl icon. */
  icon?: React.ReactNode;
  /** A note at the end: the team, "opens in a new tab". */
  hint?: string;
}

export interface CommandPaletteProps {
  /** The items for the current query, in order. */
  items: CommandPaletteItem[];
  query: string;
  onQueryChange: (query: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** An item was chosen; the palette closes itself. */
  onChoose: (item: CommandPaletteItem) => void;
  /** The key that opens it with Cmd or Ctrl; 'k' by default, null for none. */
  shortcut?: string | null;
  placeholder?: string;
  /** Shown when there is nothing to list and nothing typed. */
  emptyText?: string;
  noMatchText?: string;
  'aria-label'?: string;
}

export function CommandPalette({
  items,
  query,
  onQueryChange,
  open,
  onOpenChange,
  onChoose,
  shortcut = 'k',
  placeholder = 'Search',
  emptyText = 'Nothing to show.',
  noMatchText = 'No matches.',
  'aria-label': ariaLabel = 'Command palette',
}: CommandPaletteProps) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // Cmd or Ctrl and the key, anywhere on the page.
  useEffect(() => {
    if (!shortcut) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === shortcut) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [shortcut, open, onOpenChange]);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);
  // New results: the highlight back on the first.
  useEffect(() => { setActive(0); }, [items]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const close = () => { onOpenChange(false); if (query) onQueryChange(''); };
  const choose = (item: CommandPaletteItem) => { close(); onChoose(item); };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const rows = items.filter((i, k) => items.findIndex((j) => j.id === i.id) === k);
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(rows.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); const item = rows[active] ?? rows[0]; if (item) choose(item); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  };

  if (!open) return null;
  // A row is keyed by its id: one given twice is shown once.
  const seen = new Set<string>();
  const rows = items.filter((i) => !seen.has(i.id) && (seen.add(i.id), true));
  let group: string | undefined;
  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label={ariaLabel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.field}>
          <span className={styles.icon}><Search size={14} color="currentColor" /></span>
          <input
            ref={input}
            className={styles.input}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active < items.length ? `${listId}-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
            placeholder={placeholder}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <Kbd>esc</Kbd>
        </div>
        <div ref={list} className={styles.list} id={listId} role="listbox" aria-label={ariaLabel}>
          {rows.length === 0 && <p className={styles.empty}>{query.trim() ? noMatchText : emptyText}</p>}
          {rows.map((item, i) => {
            const heading = item.group !== group && item.group ? item.group : null;
            group = item.group;
            return (
              <React.Fragment key={item.id}>
                {heading && <div className={styles.group} role="presentation">{heading}</div>}
                <button
                  type="button"
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  className={`${styles.item} ${i === active ? styles.active : ''}`}
                  onPointerMove={() => i !== active && setActive(i)}
                  onClick={() => choose(item)}
                >
                  {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                  <span className={styles.label}>{item.label}</span>
                  {item.hint && <span className={styles.hint}>{item.hint}</span>}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
