import React from 'react';
import * as Primitive from '@radix-ui/react-navigation-menu';
import { Chevron_down } from '@indxsearch/pixl';
import styles from './NavigationMenu.module.css';

type Size = 'micro' | 'default' | 'large';

/** Icon sizes per control size, matching Button. */
const iconSize: Record<Size, number> = { micro: 14, default: 14, large: 21 };

const SizeContext = React.createContext<Size>('default');

export interface NavigationMenuProps extends React.ComponentPropsWithoutRef<typeof Primitive.Root> {
  /** Control height, padding and font. `large` matches Button size="large". */
  size?: Size;
  /** Which edge the list and the shared panel hug. Use `end` for a menu at the right edge of a
   * header, so the panel stays on screen. In vertical orientation it also aligns the items. */
  align?: 'start' | 'end';
  /** Width of the shared panel. Any CSS length; defaults to 560px, capped at the menu's width. */
  panelWidth?: string | number;
}

/** Compose with List, Item, Trigger, Content and Link. The shared panel is included. */
export const NavigationMenu = React.forwardRef<React.ComponentRef<typeof Primitive.Root>, NavigationMenuProps>(
  ({ size = 'default', align = 'start', panelWidth, className = '', style, children, 'aria-label': ariaLabel = 'Main navigation', ...props }, ref) => {
    const rootStyle = panelWidth === undefined
      ? style
      : { ...style, '--panel-width': typeof panelWidth === 'number' ? `${panelWidth}px` : panelWidth } as React.CSSProperties;
    return (
      <SizeContext.Provider value={size}>
        <Primitive.Root
          {...props}
          ref={ref}
          aria-label={ariaLabel}
          style={rootStyle}
          className={`${styles.root} ${styles[size]} ${align === 'end' ? styles.alignEnd : ''} ${className}`}
        >
          {children}
          <div className={styles.viewportPosition}>
            <Primitive.Viewport className={styles.viewport} />
          </div>
        </Primitive.Root>
      </SizeContext.Provider>
    );
  },
);
NavigationMenu.displayName = 'NavigationMenu';

export const NavigationMenuList = React.forwardRef<React.ComponentRef<typeof Primitive.List>, React.ComponentPropsWithoutRef<typeof Primitive.List>>(
  ({ className = '', ...props }, ref) => <Primitive.List {...props} ref={ref} className={`${styles.list} ${className}`} />,
);
NavigationMenuList.displayName = 'NavigationMenuList';

export const NavigationMenuItem = Primitive.Item;

type Icon = React.ReactElement<{ size?: string | number; color?: string }>;

function ControlIcon({ icon }: { icon?: Icon }) {
  const size = React.useContext(SizeContext);
  if (!icon) return null;
  return <span className={styles.icon} aria-hidden="true">{React.cloneElement(icon, { size: iconSize[size], color: 'currentColor' })}</span>;
}

export interface NavigationMenuTriggerProps extends Omit<React.ComponentPropsWithoutRef<typeof Primitive.Trigger>, 'asChild'> {
  icon?: Icon;
}

export const NavigationMenuTrigger = React.forwardRef<React.ComponentRef<typeof Primitive.Trigger>, NavigationMenuTriggerProps>(
  ({ className = '', icon, children, ...props }, ref) => {
    const size = React.useContext(SizeContext);
    return (
      <Primitive.Trigger {...props} ref={ref} className={`${styles.control} ${className}`}>
        <ControlIcon icon={icon} />
        {children}
        <span className={styles.caret} aria-hidden="true"><Chevron_down size={iconSize[size]} color="currentColor" /></span>
      </Primitive.Trigger>
    );
  },
);
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

export const NavigationMenuContent = React.forwardRef<React.ComponentRef<typeof Primitive.Content>, React.ComponentPropsWithoutRef<typeof Primitive.Content>>(
  ({ className = '', ...props }, ref) => <Primitive.Content {...props} ref={ref} className={`${styles.content} ${className}`} />,
);
NavigationMenuContent.displayName = 'NavigationMenuContent';

export interface NavigationMenuLinkProps extends React.ComponentPropsWithoutRef<typeof Primitive.Link> {
  /** Use navigation for a direct link in the top-level list. */
  variant?: 'navigation' | 'panel';
  /** Leading icon, rendered like a trigger's so a link and a trigger match side by side.
   * Applies to the navigation variant; a panel link lays out its own content. Not rendered
   * with asChild, since the child owns its children. */
  icon?: Icon;
}

/** Supports asChild for React Router and other link components. */
export const NavigationMenuLink = React.forwardRef<React.ComponentRef<typeof Primitive.Link>, NavigationMenuLinkProps>(
  ({ variant = 'panel', icon, className = '', children, ...props }, ref) => (
    <Primitive.Link {...props} ref={ref} className={`${variant === 'navigation' ? styles.control : styles.link} ${className}`}>
      {variant === 'navigation' && !props.asChild ? <><ControlIcon icon={icon} />{children}</> : children}
    </Primitive.Link>
  ),
);
NavigationMenuLink.displayName = 'NavigationMenuLink';
