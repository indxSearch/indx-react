import React from 'react';
import styles from './Tooltip.module.css';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export type TooltipProps = {
  content: string;
  position?: TooltipPosition;
  children: React.ReactElement;
  className?: string;
};

export function Tooltip({ content, position = 'top', children, className }: TooltipProps) {
  return (
    <span className={[styles.wrapper, styles[position], className].filter(Boolean).join(' ')}>
      {children}
      <span className={styles.tooltip} role="tooltip">
        {content}
      </span>
    </span>
  );
}
