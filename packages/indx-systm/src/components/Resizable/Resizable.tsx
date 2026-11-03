import React, { useEffect, useRef, useState } from 'react';
import styles from './Resizable.module.css';

export interface ResizableProps {
  first: React.ReactNode;
  second: React.ReactNode;
  /** 'horizontal' (side by side) or 'vertical' (one over the other). */
  direction?: 'horizontal' | 'vertical';
  /** The first pane's share at the start, in percent. */
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  /** Where the viewer's size is kept (localStorage). */
  storageKey?: string;
  /** Told once a drag or a key has settled. */
  onSizeChange?: (size: number) => void;
  /** A grip on the line, for a handle that should be found at a glance. */
  withHandle?: boolean;
  'aria-label'?: string;
  className?: string;
}

const STEP = 2, BIG = 10;

function kept(key?: string) {
  if (!key) return undefined;
  try { const v = parseFloat(localStorage.getItem(key) ?? ''); return Number.isNaN(v) ? undefined : v; } catch { return undefined; }
}

/** Two panes with a handle between them that the reader drags: a list beside its detail, a canvas
 *  beside its records. The first pane's share is a percentage between minSize and maxSize; the
 *  arrow keys on the focused handle move it a step, Home and End to the limits, and storageKey keeps
 *  the viewer's size. The Blazor Resizable is its port. */
export function Resizable({
  first, second, direction = 'horizontal', defaultSize = 50, minSize = 10, maxSize = 90,
  storageKey, onSizeChange, withHandle = false, 'aria-label': ariaLabel = 'Resize', className = '',
}: ResizableProps) {
  const clamp = (v: number) => Math.min(maxSize, Math.max(minSize, v));
  const [size, setSize] = useState(() => clamp(kept(storageKey) ?? defaultSize));
  const [dragging, setDragging] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const live = useRef(size);
  live.current = size;
  const horizontal = direction === 'horizontal';

  const settle = (v: number) => {
    if (storageKey) { try { localStorage.setItem(storageKey, String(v)); } catch { /* refused */ } }
    onSizeChange?.(v);
  };

  useEffect(() => {
    if (!dragging) return;
    const box = root.current!.getBoundingClientRect();
    const onMove = (e: PointerEvent) => setSize(clamp(horizontal ? ((e.clientX - box.left) / box.width) * 100 : ((e.clientY - box.top) / box.height) * 100));
    const onUp = () => { setDragging(false); settle(live.current); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: React.KeyboardEvent) => {
    const less = horizontal ? 'ArrowLeft' : 'ArrowUp', more = horizontal ? 'ArrowRight' : 'ArrowDown';
    const to = e.key === less ? size - STEP : e.key === more ? size + STEP : e.key === 'PageUp' ? size - BIG
      : e.key === 'PageDown' ? size + BIG : e.key === 'Home' ? minSize : e.key === 'End' ? maxSize : null;
    if (to === null) return;
    e.preventDefault();
    const v = clamp(to);
    setSize(v);
    settle(v);
  };

  return (
    <div ref={root} className={`${styles.root} ${horizontal ? styles.horizontal : styles.vertical} ${className}`}
         data-dragging={dragging || undefined} style={{ ['--resizable-size' as string]: `${size}%` }}>
      <div className={`${styles.pane} ${styles.first}`}>{first}</div>
      <div className={styles.handle} role="separator" tabIndex={0} aria-label={ariaLabel}
           aria-orientation={horizontal ? 'vertical' : 'horizontal'} aria-valuemin={minSize} aria-valuemax={maxSize} aria-valuenow={Math.round(size)}
           onPointerDown={e => { if (e.button === 0) { e.preventDefault(); setDragging(true); } }} onKeyDown={onKeyDown}>
        {withHandle && <span className={styles.grip} aria-hidden="true" />}
      </div>
      <div className={`${styles.pane} ${styles.second}`}>{second}</div>
    </div>
  );
}
