import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Chevron_down, Chevron_right, Indent_left, Indent_right } from '@indxsearch/pixl';
import { Button } from '../Button/Button';
import { Tooltip } from '../Tooltip/Tooltip';
import styles from './Sidebar.module.css';

interface IconProps {
  size?: string | number;
  color?: string;
}

export interface SidebarItem {
  /** What `active` and `onSelect` speak of. */
  key: string;
  label: string;
  /** A pixl icon element. */
  icon?: React.ReactElement<IconProps>;
  /** Where it goes; without it the item calls `onSelect` only. */
  href?: string;
  /** At the item's end ("3"); a dot in the rail. */
  badge?: string;
  /** The badge wants attention: the signal colour, a plain count otherwise. */
  signal?: boolean;
  /** The badge's own hover text. */
  badgeTitle?: string;
  /** An icon at the item's end, such as the lab mark of an experimental section. */
  trailing?: React.ReactElement<IconProps>;
  trailingTitle?: string;
  title?: string;
  /** There but not yet usable; its `title` says why. */
  disabled?: boolean;
}

export interface SidebarGroup {
  title?: string;
  items: SidebarItem[];
  /** The title opens and closes the items. */
  collapsible?: boolean;
}

export interface SidebarProps {
  groups: SidebarGroup[];
  /** The key of the open item, drawn primary. */
  active?: string;
  onSelect?: (item: SidebarItem) => void;
  /** Above the groups; hidden in the rail. */
  header?: React.ReactNode;
  /** Under the groups, above the fold button; hidden in the rail. */
  footer?: React.ReactNode;
  /** What the foot shows folded to a rail, in place of the footer, which the rail hides:
   *  something narrow, 50px at most (a progress ring). Not shown unfolded. */
  railFooter?: React.ReactNode;
  /** The rail of icons, controlled with `onCollapsedChange`; leave both out and it keeps its own. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
  /** Whether it can fold to the rail at all. */
  collapsible?: boolean;
  /** The key that folds it with Cmd or Ctrl; `null` for none. */
  shortcut?: string | null;
  /** Where the viewer's own choice is kept (localStorage). */
  storageKey?: string;
  /** The drawer, at 768px and narrower: the host's trigger opens it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  'aria-label'?: string;
  className?: string;
}

const NARROW = '(max-width: 768px)';

const isMac = () => typeof navigator !== 'undefined'
  && (/Mac|iPhone|iPad|iPod/.test(navigator.platform) || /Mac OS X/.test(navigator.userAgent));

const typing = (el: EventTarget | null) => el instanceof HTMLElement
  && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

function readKept(key?: string): boolean | undefined {
  if (!key) return undefined;
  try {
    const v = localStorage.getItem(key);
    return v === 'rail' ? true : v === 'full' ? false : undefined;
  } catch { return undefined; }
}

function useNarrow() {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return narrow;
}

/** The side column of an app: groups of systm Buttons, the open one primary. It folds to a rail of
 *  icons (Cmd or Ctrl and B, or the button at its foot), remembered with `storageKey`; in the rail
 *  each item names itself in a Tooltip and a badge is a dot. At 768px and narrower it is a drawer
 *  over the page, opened by the host and closed by Escape, a press beside it or a choice. No motion. */
export function Sidebar({
  groups, active, onSelect, header, footer, railFooter,
  collapsed, onCollapsedChange, defaultCollapsed = false, collapsible = true, shortcut = 'b', storageKey,
  open = false, onOpenChange, 'aria-label': ariaLabel = 'Sections', className = '',
}: SidebarProps) {
  const [own, setOwn] = useState<boolean | undefined>(() => readKept(storageKey));
  const [shut, setShut] = useState<Set<string>>(() => new Set());
  const narrow = useNarrow();
  const nav = useRef<HTMLElement>(null);
  const rail = collapsible && (collapsed ?? own ?? defaultCollapsed);
  const showRail = rail && !narrow;
  const mac = isMac();
  const keyLabel = shortcut ? (mac ? `⌘${shortcut.toUpperCase()}` : `Ctrl ${shortcut.toUpperCase()}`) : '';

  const toggle = useCallback(() => {
    if (!collapsible) return;
    const next = !rail;
    if (collapsed === undefined) {
      setOwn(next);
      // Kept in localStorage and in a cookie of the same name, which a server-rendered page can
      // read to pass defaultCollapsed before the browser has answered.
      if (storageKey) {
        try { localStorage.setItem(storageKey, next ? 'rail' : 'full'); } catch { /* refused */ }
        try { document.cookie = `${encodeURIComponent(storageKey)}=${next ? 'rail' : 'full'}; path=/; max-age=31536000; samesite=lax`; } catch { /* refused */ }
      }
    }
    onCollapsedChange?.(next);
  }, [collapsible, rail, collapsed, storageKey, onCollapsedChange]);

  const close = useCallback(() => onOpenChange?.(false), [onOpenChange]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (collapsible && shortcut && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey
        && e.key.toLowerCase() === shortcut.toLowerCase() && !typing(e.target)) {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && open && narrow) {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [collapsible, shortcut, toggle, open, narrow, close]);

  // The drawer opened: focus its open item, or its first.
  useEffect(() => {
    if (!open || !narrow || !nav.current) return;
    const target = nav.current.querySelector<HTMLElement>('[aria-current="page"]')
      ?? nav.current.querySelector<HTMLElement>(`.${styles.body} a, .${styles.body} button`);
    target?.focus();
  }, [open, narrow]);

  const choose = (item: SidebarItem) => { onSelect?.(item); close(); };
  const toggleGroup = (title: string) => setShut(s => {
    const n = new Set(s);
    if (!n.delete(title)) n.add(title);
    return n;
  });

  const label = (item: SidebarItem) => (
    <>
      <span className={styles.label}>{item.label}</span>
      {item.badge && <span className={`${styles.badge} ${item.signal ? styles.badgeSignal : ''}`} title={item.badgeTitle}>{item.badge}</span>}
      {item.trailing && <span className={styles.trailing} title={item.trailingTitle}>{React.cloneElement(item.trailing, { size: 14, color: 'currentColor' })}</span>}
    </>
  );

  const button = (item: SidebarItem) => {
    const on = item.key === active;
    if (item.disabled) {
      return <Button variant="ghost" size="micro" iconLeft={item.icon} aria-disabled="true" title={item.title} onClick={e => e.preventDefault()}>{label(item)}</Button>;
    }
    if (item.href) {
      return <Button variant={on ? 'primary' : 'ghost'} size="micro" iconLeft={item.icon} title={item.title} aria-current={on ? 'page' : undefined} href={item.href} onClick={() => choose(item)}>{label(item)}</Button>;
    }
    return <Button variant={on ? 'primary' : 'ghost'} size="micro" iconLeft={item.icon} title={item.title} aria-current={on ? 'page' : undefined} onClick={() => choose(item)}>{label(item)}</Button>;
  };

  const cls = [styles.sidebar, showRail ? styles.rail : '', open ? styles.open : '', className].filter(Boolean).join(' ');

  return (
    <>
      {open && narrow && <div className={styles.overlay} onClick={close} />}
      <nav ref={nav} className={cls} aria-label={ariaLabel}>
        {header && <div className={styles.header}>{header}</div>}
        <div className={styles.body}>
          {groups.map((g, gi) => {
            const isShut = !!(g.collapsible && g.title && shut.has(g.title));
            return (
              <div key={g.title ?? gi} className={styles.group}>
                {g.title && (g.collapsible ? (
                  <button type="button" className={`${styles.title} ${styles.titleToggle}`} aria-expanded={!isShut} onClick={() => toggleGroup(g.title!)}>
                    <span className={styles.titleText}>{g.title}</span>
                    <span className={styles.titleChevron} aria-hidden="true">
                      {isShut ? <Chevron_right size={14} color="currentColor" /> : <Chevron_down size={14} color="currentColor" />}
                    </span>
                  </button>
                ) : (
                  <div className={styles.title}><span className={styles.titleText}>{g.title}</span></div>
                ))}
                {/* The rail shows every item: a closed group has no title there to open it by. */}
                {(!isShut || showRail) && (
                  <div className={styles.items}>
                    {g.items.map(item => (
                      <span key={item.key} className={styles.item}>
                        {showRail
                          ? <Tooltip content={item.badge ? `${item.label} (${item.badge})` : item.label} position="right">{button(item)}</Tooltip>
                          : button(item)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {(footer || (railFooter && showRail) || (collapsible && !narrow)) && (
          <div className={styles.footer}>
            {/* The rail's footer first: where it stands for something in the footer, it keeps that
                thing's place at the top of the foot, folded or not. */}
            {railFooter && showRail && <div className={styles.railFooter}>{railFooter}</div>}
            {footer && <div className={styles.footerContent}>{footer}</div>}
            {collapsible && !narrow && (
              <span className={styles.item}>
                {showRail ? (
                  <Tooltip content={`Expand${keyLabel ? ` (${keyLabel})` : ''}`} position="right">
                    <Button variant="ghost" size="micro" iconLeft={<Indent_right />} aria-expanded={false} aria-label="Expand" onClick={toggle} />
                  </Tooltip>
                ) : (
                  <Button variant="ghost" size="micro" iconLeft={<Indent_left />} aria-expanded title={keyLabel ? `Collapse (${keyLabel})` : 'Collapse'} onClick={toggle}>
                    <span className={styles.label}>Collapse</span>
                  </Button>
                )}
              </span>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
