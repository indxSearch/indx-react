import React from 'react';
import styles from './SaveBar.module.css';

export interface SaveBarProps {
  /** Render at all. Bind to the page's dirty flag. Defaults to true. */
  visible?: boolean;
  /** Short status next to the actions, e.g. "Unsaved changes". */
  message?: React.ReactNode;
  /** Secondary actions (export, import) pushed to the end of the bar. */
  aside?: React.ReactNode;
  /** The actions, primary first. */
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

/** The Save / Cancel row of a page that edits a working copy. It sits after the content it
 *  concludes and sticks to the bottom of the window while that content is taller than the screen,
 *  so the way out of an edit is always in reach. Render it only while there is something to save,
 *  which is also how the page says "this one needs Save". */
export const SaveBar: React.FC<SaveBarProps> = ({
  visible = true,
  message,
  aside,
  children,
  className = '',
  'aria-label': ariaLabel = 'Unsaved changes',
}) => {
  if (!visible) return null;
  return (
    <div role="region" aria-label={ariaLabel} className={`${styles.root} ${className}`}>
      <div className={styles.main}>
        {children}
        {message && <span className={styles.message}>{message}</span>}
      </div>
      {aside && <div className={styles.aside}>{aside}</div>}
    </div>
  );
};
