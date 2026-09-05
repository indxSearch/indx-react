import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import styles from './Tabs.module.css';

export interface TabItem {
  label: string;
  value: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  size?: 'micro' | 'default' | 'large';
  /**
   * When the tabs don't fit, scroll horizontally instead of clipping. The edges fade to hint
   * there's more (the design system uses no shadows). Opt-in — leave off for a small, fixed set.
   */
  scrollable?: boolean;
  /**
   * Returns the ID of the consumer-rendered tab panel for an item. When supplied,
   * each tab exposes that relationship through `aria-controls`.
   */
  getPanelId?: (item: TabItem) => string | undefined;
}

export function Tabs({ items, value, onValueChange, size = 'default', scrollable = false, getPanelId }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const tabsId = useId();
  // Whether there's content scrolled off each edge — drives the fade (left fade only appears once
  // you've scrolled right; right fade only while there's more to the right).
  const [edges, setEdges] = useState({ start: false, end: false });
  const selectedIndex = Math.max(items.findIndex((item) => item.value === value), 0);

  const selectAndFocus = (index: number) => {
    const item = items[index];
    if (!item) return;

    onValueChange(item.value);
    const tab = tabRefs.current.get(item.value);
    tab?.focus({ preventScroll: true });
    if (scrollable) {
      tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (items.length === 0) return;

    let nextIndex: number | undefined;
    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = (index - 1 + items.length) % items.length;
        break;
      case 'ArrowRight':
        nextIndex = (index + 1) % items.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = items.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    selectAndFocus(nextIndex);
  };

  useEffect(() => {
    const el = listRef.current;
    if (!scrollable || !el) return;
    const update = () => {
      const start = el.scrollLeft > 1;
      const end = Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 1;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [scrollable, items.length]);

  return (
    <div
      ref={listRef}
      className={`${styles.tabs} ${scrollable ? styles.scrollable : ''}`}
      data-overflow-start={scrollable && edges.start ? '' : undefined}
      data-overflow-end={scrollable && edges.end ? '' : undefined}
      role="tablist"
    >
      {items.map((item, index) => {
        const selected = index === selectedIndex;

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
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${styles[size]} ${selected ? styles.active : ''}`}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
