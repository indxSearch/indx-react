import React from 'react';
import { Chevron_down, Chevron_right } from '@indxsearch/pixl';
import styles from './Disclosure.module.css';

export interface DisclosureProps {
  /**
   * What the closed row shows. It sits inside the button that opens the section, so keep it to
   * text and icons: no links, inputs or buttons of its own.
   */
  summary: React.ReactNode;
  /** The section. Rendered only while open, so a long list of closed rows stays light. */
  children: React.ReactNode;
  /** Controlled state. Leave it out and use `defaultOpen` to let the component keep its own. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * One row that opens to show more: a button with `aria-expanded` and the section it controls.
 * For a list where each item has detail worth hiding, such as settings per field on a narrow
 * screen. Stack several for an accordion; each keeps its own state, so more than one can be open.
 */
export function Disclosure({ summary, children, open, defaultOpen = false, onOpenChange, className = '' }: DisclosureProps) {
  const [own, setOwn] = React.useState(defaultOpen);
  const isOpen = open ?? own;
  const contentId = React.useId();

  const toggle = () => {
    if (open === undefined) setOwn(!isOpen);
    onOpenChange?.(!isOpen);
  };

  return (
    <div className={`${styles.disclosure} ${className}`} data-state={isOpen ? 'open' : 'closed'}>
      <button type="button" className={styles.trigger} aria-expanded={isOpen} aria-controls={isOpen ? contentId : undefined} onClick={toggle}>
        <span className={styles.summary}>{summary}</span>
        <span className={styles.chevron} aria-hidden="true">
          {isOpen ? <Chevron_down size={14} color="currentColor" /> : <Chevron_right size={14} color="currentColor" />}
        </span>
      </button>
      {isOpen && <div id={contentId} className={styles.content}>{children}</div>}
    </div>
  );
}
