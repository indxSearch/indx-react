import React from 'react';
import * as RadixPopover from '@radix-ui/react-popover';
import styles from './Popover.module.css';
import { usePortalContainer } from '../PortalContainer/PortalContainer';

// A panel that opens from a trigger and floats by it, without blocking the page: a menu of actions,
// a few settings, a short list. Radix places it (flipping when the side has no room), closes it on
// a press outside and on Escape, and returns focus to the trigger. role="menu" makes it a menu: its
// items are ghost Buttons, full width, and the arrows move between them; PopoverDivider separates
// groups. The Blazor Popover in Indx.Systm.Blazor is its port.

export interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  /** 'dialog' (the default) for a panel of content, 'menu' for a list of actions. */
  role?: 'dialog' | 'menu';
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

// In a menu the arrows, Home and End move between its items, as the Blazor Popover's do.
function onMenuKey(e: React.KeyboardEvent<HTMLDivElement>) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')];
  if (!items.length) return;
  const i = items.indexOf(document.activeElement as HTMLElement);
  const to = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1
    : e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
  items[to].focus();
  e.preventDefault();
}

export const Popover: React.FC<PopoverProps> = ({
  trigger,
  children,
  open,
  onOpenChange,
  align = 'end',
  side = 'bottom',
  sideOffset = 5,
  role = 'dialog',
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const portalContainer = usePortalContainer();
  const contentRef = React.useRef<HTMLDivElement>(null);
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild aria-haspopup={role}>
        {trigger}
      </RadixPopover.Trigger>
      <RadixPopover.Portal container={portalContainer}>
        <RadixPopover.Content
          ref={contentRef}
          className={`${styles.content} ${role === 'menu' ? styles.menu : ''} ${className}`}
          align={align}
          side={side}
          sideOffset={sideOffset}
          collisionPadding={8}
          role={role}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          onKeyDown={role === 'menu' ? onMenuKey : undefined}
          // A Select or DatePicker open inside the panel, with the focus in it, takes the first
          // Escape for itself.
          onEscapeKeyDown={(e) => {
            const panel = contentRef.current;
            if (panel && e.target !== panel && panel.querySelector('[aria-expanded="true"]')) e.preventDefault();
          }}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
};

/** A hairline between groups in a Popover menu: account, then docs, then log out. */
export const PopoverDivider: React.FC = () => <div className={styles.divider} role="separator" />;
