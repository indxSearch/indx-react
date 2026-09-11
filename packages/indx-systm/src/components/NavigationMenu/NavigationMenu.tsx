import React from 'react';
import * as Primitive from '@radix-ui/react-navigation-menu';
import { Chevron_down } from '@indxsearch/pixl';
import styles from './NavigationMenu.module.css';

export interface NavigationMenuProps extends React.ComponentPropsWithoutRef<typeof Primitive.Root> {
  size?: 'micro' | 'default';
}

/** Compose with List, Item, Trigger, Content and Link. The shared panel is included. */
export const NavigationMenu = React.forwardRef<React.ComponentRef<typeof Primitive.Root>, NavigationMenuProps>(
  ({ size = 'default', className = '', children, 'aria-label': ariaLabel = 'Main navigation', ...props }, ref) => (
    <Primitive.Root {...props} ref={ref} aria-label={ariaLabel} className={`${styles.root} ${styles[size]} ${className}`}>
      {children}
      <div className={styles.viewportPosition}>
        <Primitive.Viewport className={styles.viewport} />
      </div>
    </Primitive.Root>
  ),
);
NavigationMenu.displayName = 'NavigationMenu';

export const NavigationMenuList = React.forwardRef<React.ComponentRef<typeof Primitive.List>, React.ComponentPropsWithoutRef<typeof Primitive.List>>(
  ({ className = '', ...props }, ref) => <Primitive.List {...props} ref={ref} className={`${styles.list} ${className}`} />,
);
NavigationMenuList.displayName = 'NavigationMenuList';

export const NavigationMenuItem = Primitive.Item;

type Icon = React.ReactElement<{ size?: string | number; color?: string }>;
export interface NavigationMenuTriggerProps extends Omit<React.ComponentPropsWithoutRef<typeof Primitive.Trigger>, 'asChild'> {
  icon?: Icon;
}

export const NavigationMenuTrigger = React.forwardRef<React.ComponentRef<typeof Primitive.Trigger>, NavigationMenuTriggerProps>(
  ({ className = '', icon, children, ...props }, ref) => (
    <Primitive.Trigger {...props} ref={ref} className={`${styles.control} ${className}`}>
      {icon && <span className={styles.icon} aria-hidden="true">{React.cloneElement(icon, { size: 14, color: 'currentColor' })}</span>}
      {children}
      <span className={styles.caret} aria-hidden="true"><Chevron_down size={14} color="currentColor" /></span>
    </Primitive.Trigger>
  ),
);
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

export const NavigationMenuContent = React.forwardRef<React.ComponentRef<typeof Primitive.Content>, React.ComponentPropsWithoutRef<typeof Primitive.Content>>(
  ({ className = '', ...props }, ref) => <Primitive.Content {...props} ref={ref} className={`${styles.content} ${className}`} />,
);
NavigationMenuContent.displayName = 'NavigationMenuContent';

export interface NavigationMenuLinkProps extends React.ComponentPropsWithoutRef<typeof Primitive.Link> {
  /** Use navigation for a direct link in the top-level list. */
  variant?: 'navigation' | 'panel';
}

/** Supports asChild for React Router and other link components. */
export const NavigationMenuLink = React.forwardRef<React.ComponentRef<typeof Primitive.Link>, NavigationMenuLinkProps>(
  ({ variant = 'panel', className = '', ...props }, ref) => (
    <Primitive.Link {...props} ref={ref} className={`${variant === 'navigation' ? styles.control : styles.link} ${className}`} />
  ),
);
NavigationMenuLink.displayName = 'NavigationMenuLink';
