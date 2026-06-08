import React from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { X_or_error } from '@indxsearch/pixl';
import styles from './Modal.module.css';

export interface ModalProps {
  /** Optional element that opens the modal. Omit when controlling via `open`. */
  trigger?: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  className?: string;
  /** Show the top-right close button (default true). */
  showClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  trigger,
  children,
  open,
  onOpenChange,
  title,
  description,
  className = '',
  showClose = true,
}) => {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={styles.overlay} />
        <RadixDialog.Content className={`${styles.content} ${className}`}>
          {/* Title is required for accessibility; render visually-hidden when none is given. */}
          <RadixDialog.Title className={title ? styles.title : styles.srOnly}>
            {title || 'Dialog'}
          </RadixDialog.Title>
          {description && (
            <RadixDialog.Description className={styles.description}>
              {description}
            </RadixDialog.Description>
          )}
          {showClose && (
            <RadixDialog.Close className={styles.close} aria-label="Close">
              <X_or_error size={16} color="currentColor" />
            </RadixDialog.Close>
          )}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
