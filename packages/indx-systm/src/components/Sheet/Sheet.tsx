import React, { useRef } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X_or_error } from '@indxsearch/pixl';
import { Button } from '../Button/Button';
import { usePortalContainer } from '../PortalContainer/PortalContainer';
import styles from './Sheet.module.css';

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** What opens it, when the Sheet holds its own state. */
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  /** Buttons at the foot, primary first. */
  footer?: React.ReactNode;
  side?: 'right' | 'left';
  /** 'default' (480px) or 'wide' (720px); the whole width on a phone. */
  size?: 'default' | 'wide';
  className?: string;
}

/** A panel the height of the window, over the page from its right edge (or left): a record opened
 *  from a list, a finding with its evidence, settings too long for a Modal. Radix's dialog keeps the
 *  focus inside, closes it on Escape and a press on the scrim, and gives the focus back. Header,
 *  a body that scrolls, an optional footer. No motion. The Blazor Sheet is its port. */
export function Sheet({ open, onOpenChange, trigger, title, description, children, footer, side = 'right', size = 'default', className = '' }: SheetProps) {
  const portalContainer = usePortalContainer();
  // Radix gives the focus back to its own Trigger; a Sheet opened by the host's button (open and
  // onOpenChange) gives it back to whatever had it when it opened.
  const opener = useRef<HTMLElement | null>(null);
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal container={portalContainer}>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content className={`${styles.sheet} ${styles[side]} ${size === 'wide' ? styles.wide : ''} ${className}`}
                             {...(description ? {} : { 'aria-describedby': undefined })}
                             onOpenAutoFocus={() => { opener.current = document.activeElement as HTMLElement | null; }}
                             onCloseAutoFocus={e => {
                               if (trigger || !opener.current || !document.contains(opener.current)) return;
                               e.preventDefault();
                               opener.current.focus({ preventScroll: true });
                             }}>
          <div className={styles.header}>
            <div className={styles.heading}>
              <RadixDialog.Title className={title ? styles.title : styles.srOnly}>{title || 'Panel'}</RadixDialog.Title>
              {description && <RadixDialog.Description className={styles.description}>{description}</RadixDialog.Description>}
            </div>
            <RadixDialog.Close asChild>
              <Button variant="ghost" size="micro" iconLeft={<X_or_error />} aria-label="Close" />
            </RadixDialog.Close>
          </div>
          <div className={styles.body}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
