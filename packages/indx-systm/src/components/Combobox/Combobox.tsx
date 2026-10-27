import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, Chevron_down, Search } from '@indxsearch/pixl';
import { Popover } from '../Popover/Popover';
import type { SelectOption } from '../Select/Select';
import styles from './Combobox.module.css';

export interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  /** The host's own search over the options; left out, a label that starts with what was typed
   *  comes first, then one that holds it. */
  search?: (query: string) => SelectOption[];
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  noMatchText?: string;
  size?: 'micro' | 'default' | 'large';
  disabled?: boolean;
  'aria-label'?: string;
  id?: string;
  className?: string;
}

function narrow(options: SelectOption[], q: string) {
  const t = q.toLowerCase();
  const starts = options.filter(o => o.label.toLowerCase().startsWith(t));
  const holds = options.filter(o => !o.label.toLowerCase().startsWith(t) && o.label.toLowerCase().includes(t));
  return [...starts, ...holds];
}

/** A Select you can type into, for a list too long to scroll. Closed it is a Select; open, a
 *  Popover holds a search box over the options: typing narrows them, the arrows move the
 *  highlight, Enter chooses and Escape closes, the field getting its focus back. The Blazor
 *  Combobox in Indx.Systm.Blazor is its port. */
export function Combobox({
  value, onValueChange, options, search, label, placeholder = 'Choose…', searchPlaceholder = 'Search',
  noMatchText = 'No matches.', size = 'default', disabled = false, 'aria-label': ariaLabel, id, className = '',
}: ComboboxProps) {
  const own = useId();
  const fieldId = id ?? own;
  const listId = `${fieldId}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLButtonElement>(null);
  const selected = options.find(o => o.value === value);
  const iconSize = size === 'large' ? 21 : 14;

  const matches = useMemo(() => {
    const q = query.trim();
    if (!q) return options;
    return search ? search(q) : narrow(options, q);
  }, [options, query, search]);

  useEffect(() => { setActive(0); }, [matches]);
  useEffect(() => {
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  // Opened again, it starts from the whole list.
  const onOpenChange = (o: boolean) => { setOpen(o); if (!o) setQuery(''); };
  useEffect(() => { if (open) requestAnimationFrame(() => input.current?.focus()); }, [open]);

  const choose = (o: SelectOption) => { onOpenChange(false); onValueChange(o.value); requestAnimationFrame(() => field.current?.focus()); };
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(matches.length - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(matches.length - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); const o = matches[active] ?? matches[0]; if (o) choose(o); }
    // The Popover leaves an Escape to an open field inside it, which the search box is: it closes
    // here, and the field gets the focus back.
    else if (e.key === 'Escape') { e.preventDefault(); onOpenChange(false); requestAnimationFrame(() => field.current?.focus()); }
  };

  const icon = (node: React.ReactNode, px: number) =>
    React.isValidElement(node) ? React.cloneElement(node as React.ReactElement<{ size?: number; color?: string }>, { size: px, color: 'currentColor' }) : node;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label id={`${fieldId}-label`} htmlFor={fieldId} className={styles.label}>{label}</label>}
      <Popover
        open={open}
        onOpenChange={onOpenChange}
        align="start"
        className={styles.panel}
        aria-label={ariaLabel ?? label}
        trigger={
          <button ref={field} type="button" id={fieldId} className={`${styles.field} ${styles[size]}`} disabled={disabled} aria-haspopup="listbox"
                  aria-labelledby={label ? `${fieldId}-label ${fieldId}-value` : undefined} aria-label={label ? undefined : ariaLabel}>
            <span id={`${fieldId}-value`} className={`${styles.value} ${selected ? '' : styles.placeholder}`}>
              {selected?.icon && icon(selected.icon, iconSize)}
              <span className={styles.text}>{selected?.label ?? placeholder}</span>
            </span>
            <span className={styles.chevron} aria-hidden="true"><Chevron_down size={iconSize} color="currentColor" /></span>
          </button>
        }
      >
        <div className={styles.body}>
          <div className={styles.search}>
            <span className={styles.searchIcon} aria-hidden="true"><Search size={14} color="currentColor" /></span>
            <input ref={input} className={styles.input} type="text" role="combobox" aria-expanded="true" aria-controls={listId}
                   aria-autocomplete="list" aria-activedescendant={matches.length ? `${listId}-${active}` : undefined}
                   autoComplete="off" spellCheck={false} placeholder={searchPlaceholder}
                   value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKeyDown} />
          </div>
          <div ref={list} className={styles.list} id={listId} role="listbox" aria-label={ariaLabel ?? label}>
            {matches.length === 0 && <p className={styles.empty}>{noMatchText}</p>}
            {matches.map((o, i) => (
              <button key={o.value} type="button" id={`${listId}-${i}`} data-index={i} role="option" aria-selected={o.value === value}
                      className={`${styles.item} ${i === active ? styles.active : ''}`}
                      onPointerMove={() => i !== active && setActive(i)} onClick={() => choose(o)}>
                {o.icon && <span className={styles.itemIcon}>{icon(o.icon, 14)}</span>}
                <span className={styles.itemLabel}>{o.label}</span>
                {o.value === value && <span className={styles.check}><Check size={14} color="currentColor" /></span>}
              </button>
            ))}
          </div>
        </div>
      </Popover>
    </div>
  );
}
