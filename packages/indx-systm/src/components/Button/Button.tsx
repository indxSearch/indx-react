import React from 'react';
import styles from './Button.module.css';
import { Spinner } from '../Spinner/Spinner';

interface IconProps {
  size?: string | number;
  color?: string;
}

type ButtonBaseProps = {
  size?: 'micro' | 'default' | 'large';
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  /** The action behind this button is in progress: a Spinner takes the left-icon slot and the
   *  button is disabled until it clears. Set it on every button that starts work the user has
   *  to wait for, so a slow operation never reads as a dead click. */
  loading?: boolean;
  iconLeft?: React.ReactElement<IconProps>;
  iconRight?: React.ReactElement<IconProps>;
  className?: string;
};

type ButtonAsButton = ButtonBaseProps & Omit<React.ComponentProps<'button'>, keyof ButtonBaseProps> & {
  href?: never;
};

type ButtonAsLink = ButtonBaseProps & Omit<React.ComponentProps<'a'>, keyof ButtonBaseProps> & {
  href: string;
};

export type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button(props: ButtonProps) {
  const { size = 'default', variant = 'primary', iconLeft, iconRight, className, children, loading = false, ...rest } = props;
  const disabled = props.disabled || loading;
  const { href } = rest as { href?: string };

  const iconSize = size === 'micro' ? '14px' : size === 'large' ? '21px' : '14px';
  const iconPx = size === 'large' ? 21 : 14;

  const buttonClassName = [
    styles.button,
    styles[size],
    styles[variant],
    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
    className
  ].filter(Boolean).join(' ');

  // Warn in development if button has only icons and no accessible label
  if (import.meta.env.DEV) {
    const hasIconOnly = (iconLeft || iconRight) && !children;
    const hasAccessibleLabel = rest['aria-label'] || rest['aria-labelledby'];
    if (hasIconOnly && !hasAccessibleLabel) {
      console.warn('Button: Icon-only buttons should have an aria-label or aria-labelledby for accessibility.');
    }
  }

  const content = (
    <>
      {loading
        ? <Spinner size={iconPx} />
        : iconLeft && React.cloneElement(iconLeft, { size: iconSize, color: 'currentColor' })}
      {children}
      {iconRight && React.cloneElement(iconRight, { size: iconSize, color: 'currentColor' })}
    </>
  );

  if (href) {
    const { type: _, href: _href, onClick, tabIndex: _tabIndex, disabled: _disabled, ...anchorProps } = rest as any;

    if (disabled) {
      return (
        <a
          className={buttonClassName}
          {...anchorProps}
          aria-disabled="true"
          aria-busy={loading || undefined}
          tabIndex={-1}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          {content}
        </a>
      );
    }

    return (
      <a
        className={buttonClassName}
        href={href}
        {...anchorProps}
        tabIndex={_tabIndex}
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  const { type = 'button', href: _, disabled: _disabled, ...buttonProps } = rest as any;
  return (
    <button className={buttonClassName} type={type} disabled={disabled} aria-busy={loading || undefined} {...buttonProps}>
      {content}
    </button>
  );
}
