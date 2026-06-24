import { useEffect, useRef, useState } from 'react';
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
}

export function Tabs({ items, value, onValueChange, size = 'default', scrollable = false }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);
  // Whether there's content scrolled off each edge — drives the fade (left fade only appears once
  // you've scrolled right; right fade only while there's more to the right).
  const [edges, setEdges] = useState({ start: false, end: false });

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
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          type="button"
          aria-selected={value === item.value}
          className={`${styles.tab} ${styles[size]} ${value === item.value ? styles.active : ''}`}
          onClick={() => onValueChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
