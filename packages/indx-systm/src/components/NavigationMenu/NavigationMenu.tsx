import React from 'react';
import * as Primitive from '@radix-ui/react-navigation-menu';
import { Chevron_down } from '@indxsearch/pixl';
import styles from './NavigationMenu.module.css';

type Size = 'micro' | 'default' | 'large';

/** Icon sizes per control size, matching Button. */
const iconSize: Record<Size, number> = { micro: 14, default: 14, large: 21 };

const SizeContext = React.createContext<Size>('default');

/** useLayoutEffect on the client, useEffect on the server, where layout effects do not run. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

export interface NavigationMenuProps extends React.ComponentPropsWithoutRef<typeof Primitive.Root> {
  /** Control height, padding and font. `large` matches Button size="large". */
  size?: Size;
  /** Which edge the list and the shared panel hug. Use `end` for a menu at the right edge of a
   * header, so the panel stays on screen. In vertical orientation it also aligns the items. */
  align?: 'start' | 'end';
  /** Width of the shared panel. Any CSS length; defaults to 560px, capped at the menu's width. */
  panelWidth?: string | number;
  /**
   * Where the shared panel sits under the list. `trigger`, the default, puts it under the trigger
   * that opened it, clamped so it never leaves the menu. `start` and `end` hug an edge of the
   * menu instead, which is what a dropdown does when it is the edge-most item and nothing else.
   * Ignored in vertical orientation, where the panel is full width.
   */
  panelAlign?: 'trigger' | 'start' | 'end';
}

/** Compose with List, Item, Trigger, Content and Link. The shared panel is included. */
export const NavigationMenu = React.forwardRef<React.ComponentRef<typeof Primitive.Root>, NavigationMenuProps>(
  ({ size = 'default', align = 'start', panelAlign = 'trigger', panelWidth, className = '', style, children, 'aria-label': ariaLabel = 'Main navigation', ...props }, ref) => {
    // Where the panel starts, in pixels from the menu's start edge. Only used by panelAlign
    // "trigger": the offset of the trigger that is open. CSS clamps it to the menu's width.
    // The offset is written straight to the DOM rather than kept in state, so it lands in the
    // same frame the panel appears; a state update would arrive a render later, and the panel
    // would be seen at the start edge first and slide across to its trigger.
    const rootRef = React.useRef<HTMLElement | null>(null);
    const wasOpen = React.useRef(false);

    // The open trigger is the one Radix marks data-state="open". Measured rather than taken from
    // Radix's indicator variables, which only exist while an Indicator is rendered, and read on
    // every open, on a change of trigger and on a resize, because the header reflows.
    useIsomorphicLayoutEffect(() => {
      const root = rootRef.current;
      if (!root || panelAlign !== 'trigger') return;

      const measure = () => {
        const open = root.querySelector<HTMLElement>('[data-state="open"][aria-expanded="true"]');
        if (!open) { wasOpen.current = false; return; }       // closing: keep the last offset so the panel does not jump as it fades
        const left = open.getBoundingClientRect().left - root.getBoundingClientRect().left;
        // Moving between triggers slides; opening onto a trigger, or a reflow while open, does
        // not, so the panel is never seen travelling from a position it was never meant to have.
        if (!wasOpen.current) root.setAttribute('data-panel-jump', '');
        root.style.setProperty('--panel-offset', `${Math.round(left)}px`);
        if (!wasOpen.current) {
          void root.offsetWidth;                             // commit the jump before the transition comes back
          root.removeAttribute('data-panel-jump');
          wasOpen.current = true;
        }
      };

      measure();
      const observer = new MutationObserver(measure);
      observer.observe(root, { subtree: true, attributes: true, attributeFilter: ['data-state'] });
      const resize = new ResizeObserver(() => {
        wasOpen.current = false;                             // a reflow repositions without animating
        measure();
      });
      resize.observe(root);
      return () => { observer.disconnect(); resize.disconnect(); };
    }, [panelAlign, children]);

    const rootStyle = {
      ...style,
      ...(panelWidth === undefined ? {} : { '--panel-width': typeof panelWidth === 'number' ? `${panelWidth}px` : panelWidth }),
    } as React.CSSProperties;

    const panelClass = panelAlign === 'trigger' ? styles.panelTrigger : panelAlign === 'end' ? styles.alignEnd : '';

    return (
      <SizeContext.Provider value={size}>
        <Primitive.Root
          {...props}
          ref={node => {
            rootRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) (ref as React.MutableRefObject<typeof node>).current = node;
          }}
          aria-label={ariaLabel}
          style={rootStyle}
          className={`${styles.root} ${styles[size]} ${align === 'end' ? styles.alignList : ''} ${panelClass} ${className}`}
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
