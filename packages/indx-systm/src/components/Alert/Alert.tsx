import React from 'react';
import { Warning, Check } from '@indxsearch/pixl';
import styles from './Alert.module.css';

export type AlertVariant = 'default' | 'info' | 'success' | 'warning' | 'destructive';

export interface AlertProps {
  /** Tone. `destructive` for errors and irreversible outcomes, `warning` for things that need
   *  attention, `success` for a completed action, `info` for neutral notices. */
  variant?: AlertVariant;
  /** Leading icon; defaults per variant (none for `default` and `info`). Pass `null` to suppress. */
  icon?: React.ReactNode;
  className?: string;
  /** Use `AlertTitle` and `AlertDescription` for the standard layout; any content works. */
  children: React.ReactNode;
  role?: 'alert' | 'status';
}

const defaultIcons: Partial<Record<AlertVariant, React.ReactNode>> = {
  success: <Check />,
  warning: <Warning />,
  destructive: <Warning />,
};

function sizedIcon(icon: React.ReactNode) {
  return React.isValidElement<{ size?: string | number; color?: string }>(icon)
    ? React.cloneElement(icon, { size: 16, color: 'currentColor' })
    : icon;
}

/** A callout that stays in the flow of the page — for outcomes and conditions the reader must
 *  not miss, not for transient toasts. Title and description are optional; an alert can be one line. */
export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  icon,
  className = '',
  children,
  role,
}) => {
  const resolvedIcon = icon === undefined ? defaultIcons[variant] : icon;
  const resolvedRole = role ?? (variant === 'destructive' || variant === 'warning' ? 'alert' : 'status');
  return (
    <div role={resolvedRole} className={`${styles.root} ${styles[variant]} ${className}`}>
      {resolvedIcon && <span className={styles.icon} aria-hidden="true">{sizedIcon(resolvedIcon)}</span>}
      <div className={styles.body}>{children}</div>
    </div>
  );
};

export const AlertTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`${styles.title} ${className}`}>{children}</div>
);

export const AlertDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`${styles.description} ${className}`}>{children}</div>
);
