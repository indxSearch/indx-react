import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { Warning, X_or_error } from '@indxsearch/pixl';
import { Button } from '../Button/Button';
import styles from './Toast.module.css';

// Brief notices for a thing done ("Settings saved.") or failed, at the window's lower right, gone
// by themselves: four seconds, a failure eight; the pointer on one holds it. A notice is plain ink,
// with an icon when it has one; a failure has the signal colour. No motion: it is simply there, and
// then not. Call toast() or toast.error() from anywhere and place one <Toaster /> in the app. The
// Blazor ToastService and ToastHost in Indx.Systm.Blazor are its port.

export interface ToastOptions {
  /** A 14px pixl icon. */
  icon?: React.ReactNode;
  /** How long it stays, in milliseconds. */
  duration?: number;
  /** One action, "Undo"; pressing it closes the notice. */
  action?: { label: string; onClick: () => void };
}

interface ToastEntry extends ToastOptions {
  id: number;
  message: string;
  kind: 'neutral' | 'error';
  duration: number;
}

const MAX_SHOWN = 4;
let entries: ToastEntry[] = [];
let next = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function add(entry: Omit<ToastEntry, 'id'>): number {
  const id = ++next;
  entries = [...entries, { ...entry, id }].slice(-MAX_SHOWN);
  emit();
  return id;
}

/** Shows a notice and returns its id. */
export function toast(message: string, options: ToastOptions = {}): number {
  return add({ message, kind: 'neutral', ...options, duration: options.duration ?? 4000 });
}

/** Shows a failure, in the signal colour, for longer. */
toast.error = (message: string, options: Omit<ToastOptions, 'icon'> = {}): number =>
  add({ message, kind: 'error', ...options, duration: options.duration ?? 8000 });

toast.dismiss = (id: number) => {
  entries = entries.filter((e) => e.id !== id);
  emit();
};

function useToasts(): ToastEntry[] {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => entries,
    () => entries,
  );
}

function ToastItem({ t }: { t: ToastEntry }) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const start = () => { clearTimeout(timer.current); timer.current = setTimeout(() => toast.dismiss(t.id), t.duration); };
  const hold = () => clearTimeout(timer.current);
  useEffect(() => { start(); return hold; }, [t.id]);
  return (
    <div
      className={`${styles.toast} ${t.kind === 'error' ? styles.error : ''}`}
      role={t.kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={hold}
      onMouseLeave={start}
    >
      {t.kind === 'error'
        ? <span className={styles.icon}><Warning size={14} color="currentColor" /></span>
        : t.icon && <span className={styles.icon}>{t.icon}</span>}
      <span className={styles.message}>{t.message}</span>
      {t.action && (
        <Button variant="ghost" size="micro" onClick={() => { toast.dismiss(t.id); t.action!.onClick(); }}>{t.action.label}</Button>
      )}
      <button type="button" className={styles.close} aria-label="Dismiss" title="Dismiss" onClick={() => toast.dismiss(t.id)}>
        <X_or_error size={7} color="currentColor" />
      </button>
    </div>
  );
}

/** Where the notices show; place one in the app. */
export function Toaster() {
  const list = useToasts();
  return (
    <div className={styles.stack} role="region" aria-label="Notices">
      {list.map((t) => <ToastItem key={t.id} t={t} />)}
    </div>
  );
}
