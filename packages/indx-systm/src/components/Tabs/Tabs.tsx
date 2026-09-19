import { cloneElement, isValidElement, useEffect, useId, useRef, type ComponentPropsWithoutRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  label: string;
  value: string;
  /**
   * Optional icon shown before the label. Pass a rendered pixl icon; it inherits the tab's colour
   * through `currentColor`, and the tab sizes it (see `iconSize`) unless the icon carries a size
   * of its own. So `icon: <Search color="currentColor" />` is the whole call site.
   */
  icon?: ReactNode;
  /**
   * Not available yet. The tab stays focusable and keeps its place, so the bar does not change
   * shape, but it cannot be selected and arrow keys skip it. Rendered with `aria-disabled`, not
   * the `disabled` attribute, so that `title` still shows why on hover and focus.
   */
  disabled?: boolean;
  /** Tooltip. With `disabled`, say why: "Available after the index is built". */
  title?: string;
  /** A small count or marker after the label, in the signal colour. */
  badge?: ReactNode;
  /** Tooltip for the badge. */
  badgeTitle?: string;
  /**
   * Makes the item a link to a separate page. The bar then renders as a nav of anchors, the
   * active item carries `aria-current="page"`, and the browser's own link behaviour applies.
   */
  href?: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  size?: 'micro' | 'default' | 'large';
  /**
   * `underline` (default) marks the active tab with a rule under it. `button` fills it like a
   * primary Button and leaves the rest as ghost buttons, for a bar that reads as a set of views
   * rather than as a page's sections.
   */
  variant?: 'underline' | 'button';
  /**
   * When the tabs don't fit, scroll horizontally instead of clipping. The edges fade to hint
   * there's more (the design system uses no shadows). Opt-in — leave off for a small, fixed set.
   */
  scrollable?: boolean;
  /**
   * With `scrollable`: how far the bar reaches out of its box into the gutter on each side, as a
   * CSS length (a number is px). The edge fade then lives in the gutter and stays put, and the
   * tabs scroll out into it. Set it to the width of the gutter the bar sits in, for example the
   * page padding. Without it the fade slides in over the bar's own edges.
   */
  bleed?: string | number;
  /**
   * Returns the ID of the consumer-rendered tab panel for an item. When supplied,
   * each tab exposes that relationship through `aria-controls`.
   */
  getPanelId?: (item: TabItem) => string | undefined;
  /** Names the bar for assistive technology. Needed in link mode, where it is a nav landmark. */
  'aria-label'?: string;
  /** Link mode: return a router link, forwarding these anchor props. */
  renderLink?: (item: TabItem, props: ComponentPropsWithoutRef<'a'>) => ReactNode;
}

/**
 * Scrolls the list sideways just far enough to show a tab, clear of the edge fade. Done by hand
 * because scrollIntoView also scrolls the page, which a tab bar has no business doing.
 */
function reveal(list: HTMLElement | null, tab: HTMLElement | null | undefined) {
  if (!list || !tab) return;
  // Keep the tab clear of the fade: the bleed padding when there is one, else the sliding fade.
  const fade = parseFloat(getComputedStyle(list).paddingInlineStart) || 32;
  const l = list.getBoundingClientRect();
  const t = tab.getBoundingClientRect();
  if (t.left < l.left + fade) list.scrollLeft -= l.left + fade - t.left;
  else if (t.right > l.right - fade) list.scrollLeft += t.right - (l.right - fade);
}

/**
 * Icon width per tab size, in the pixl grid's multiples of 7 (a 7×5 icon at 14 is 14×10). Large
 * tabs carry a pixl icon at its own default, 21; smaller tabs step down one multiple.
 */
const iconSize = { micro: 14, default: 14, large: 21 } as const;

export function Tabs({ items, value, onValueChange, size = 'default', variant = 'underline', scrollable = false, bleed, getPanelId, 'aria-label': ariaLabel, renderLink }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLElement>());
  const tabsId = useId();
  const selectedIndex = Math.max(items.findIndex((item) => item.value === value), 0);
  // Items with an href are links to separate pages: a nav of anchors, not a tablist.
  const links = items.some((item) => item.href !== undefined);

  const selectAndFocus = (index: number) => {
    const item = items[index];
    if (!item) return;

    onValueChange(item.value);
    const tab = tabRefs.current.get(item.value);
    tab?.focus({ preventScroll: true });
    if (scrollable) reveal(listRef.current, tab);
  };

  /** The next enabled tab from `from` in `step` direction, wrapping; undefined if there is none. */
  const nextEnabled = (from: number, step: 1 | -1) => {
    for (let n = 1; n <= items.length; n++) {
      const i = (from + step * n + items.length * n) % items.length;
      if (!items[i].disabled) return i;
    }
    return undefined;
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (items.length === 0) return;

    let nextIndex: number | undefined;
    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = nextEnabled(index, -1);
        break;
      case 'ArrowRight':
        nextIndex = nextEnabled(index, 1);
        break;
      case 'Home':
        nextIndex = nextEnabled(-1, 1);
        break;
      case 'End':
        nextIndex = nextEnabled(items.length, -1);
        break;
      default:
        return;
    }

    event.preventDefault();
    if (nextIndex !== undefined) selectAndFocus(nextIndex);
  };

  useEffect(() => {
    const el = listRef.current;
    if (!scrollable || !el) return;
    // With bleed the fade is fixed in the gutter and needs no measuring.
    if (bleed !== undefined) {
      el.style.removeProperty('--tabs-fade-start');
      el.style.removeProperty('--tabs-fade-end');
      return;
    }
    const update = () => {
      const max = 32;
      const start = Math.min(el.scrollLeft, max);
      const end = Math.min(Math.max(el.scrollWidth - el.clientWidth - el.scrollLeft, 0), max);
      el.style.setProperty('--tabs-fade-start', `${start}px`);
      el.style.setProperty('--tabs-fade-end', `${end}px`);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [scrollable, bleed, items.length]);

  // A deep link or a change made elsewhere can select a tab that is scrolled out of sight.
  useEffect(() => {
    if (scrollable) reveal(listRef.current, tabRefs.current.get(value));
  }, [scrollable, value]);

  return (
    <div
      ref={listRef}
      className={`${styles.tabs} ${variant === 'button' ? styles.buttonVariant : ''} ${scrollable ? styles.scrollable : ''} ${scrollable && bleed !== undefined ? styles.bleed : ''}`}
      style={scrollable && bleed !== undefined ? { '--tabs-bleed': typeof bleed === 'number' ? `${bleed}px` : bleed } as CSSProperties : undefined}
      role={links ? 'navigation' : 'tablist'}
      aria-label={ariaLabel}
    >
      {items.map((item, index) => {
        const selected = index === selectedIndex;

        const content = (
          <>
            {item.icon ? (
              <span className={styles.icon} aria-hidden="true">
                {isValidElement<{ size?: number | string }>(item.icon) && item.icon.props.size === undefined
                  ? cloneElement(item.icon, { size: iconSize[size] })
                  : item.icon}
              </span>
            ) : null}
            {item.label}
            {item.badge != null && item.badge !== false ? <span className={styles.badge} title={item.badgeTitle}>{item.badge}</span> : null}
          </>
        );
        const className = `${styles.tab} ${styles[size]} ${selected ? styles.active : ''}`;

        if (item.href !== undefined) {
          const props: ComponentPropsWithoutRef<'a'> = {
            id: `${tabsId}-tab-${item.value}`,
            className,
            href: item.disabled ? undefined : item.href,
            'aria-current': selected ? 'page' : undefined,
            'aria-disabled': item.disabled || undefined,
            title: item.title,
            children: content,
          };
          return (
            <span key={item.value} style={{ display: 'contents' }} ref={(wrapper) => {
              const element = wrapper?.firstElementChild as HTMLElement | null;
              if (element) tabRefs.current.set(item.value, element);
              else tabRefs.current.delete(item.value);
            }}>
              {renderLink ? renderLink(item, props) : <a {...props} />}
            </span>
          );
        }

        return (
          <button
            key={item.value}
            ref={(element) => {
              if (element) tabRefs.current.set(item.value, element);
              else tabRefs.current.delete(item.value);
            }}
            id={`${tabsId}-tab-${item.value}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={getPanelId?.(item)}
            aria-disabled={item.disabled || undefined}
            title={item.title}
            tabIndex={selected ? 0 : -1}
            className={className}
            onClick={() => { if (!item.disabled) onValueChange(item.value); }}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
