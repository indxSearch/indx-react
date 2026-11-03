import React from 'react';
import styles from './Kbd.module.css';

export interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

/** A key, as the keyboard has it: "esc", "⌘K", "⇧↵". After shadcn's Kbd: a filled cap with no
 *  outline, the page's font small and medium, the muted surface and text; an icon inside is drawn
 *  at 12px. The Blazor Kbd is its port. */
export function Kbd({ children, className = '', ...rest }: KbdProps) {
  return <kbd className={`${styles.kbd} ${className}`} {...rest}>{children}</kbd>;
}
