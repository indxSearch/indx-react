import React from 'react';
import styles from './EmptyState.module.css';

interface IconProps {
  size?: string | number;
  color?: string;
}

export interface EmptyStateProps {
  /** A pixl icon, drawn 70px ('default') or 35px ('compact') in lv4. */
  icon?: React.ReactElement<IconProps>;
  title: string;
  /** The line under the title: what would be here, and how it gets here. */
  children?: React.ReactNode;
  /** Buttons that start it, primary first. Leave it out where the toolbar above already has the
   *  page's New button. */
  actions?: React.ReactNode;
  size?: 'default' | 'compact';
  className?: string;
}

/** What a list or a page shows while it has nothing yet: a large icon in a quiet tone, a title, a
 *  line saying what would be here and how it gets here, and the action that starts it. 'default'
 *  opens a page; 'compact' sits inside a tab or a section. The Blazor EmptyState is its port. */
export function EmptyState({ icon, title, children, actions, size = 'default', className = '' }: EmptyStateProps) {
  return (
    <div className={`${styles.empty} ${styles[size]} ${className}`} role="status">
      {icon && <span className={styles.icon} aria-hidden="true">{React.cloneElement(icon, { size: size === 'compact' ? 35 : 70, color: 'currentColor' })}</span>}
      <div className={styles.title}>{title}</div>
      {children && <div className={styles.detail}>{children}</div>}
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
