import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, Chevron_right, Dropdown, Plus } from '@indxsearch/pixl';
import type { SelectOption } from '../Select/Select';
import selectStyles from '../Select/Select.module.css';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  /** Leading icon; icon components receive Button-compatible size and color props. */
  icon?: React.ReactNode;
  /** Supply a switcher to show an independent dropdown beside the page link. */
  switcher?: {
    label: string;
    value: string;
    options: SelectOption[];
    onValueChange: (value: string) => void;
    disabled?: boolean;
    /** Optional entry below the options — typically "New …" — that runs instead of selecting. */
    action?: { label: string; onSelect: () => void };
  };
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  size?: 'micro' | 'default';
  className?: string;
  separator?: React.ReactNode;
  /** Return a router link, forwarding these anchor props to preserve styling and accessibility. */
  renderLink?: (item: BreadcrumbItem, props: React.ComponentPropsWithoutRef<'a'>) => React.ReactNode;
  'aria-label'?: string;
}

function renderStepIcon(icon: React.ReactNode) {
  return React.isValidElement<{ size?: string | number; color?: string }>(icon)
    ? React.cloneElement(icon, { size: '14px', color: 'currentColor' })
    : icon;
}

/** Sentinel value for the switcher's action item; never reaches onValueChange. */
const ACTION_VALUE = '\u0000action';

/** Page navigation with independently controlled context switchers. */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  size = 'default',
  className = '',
  separator = <Chevron_right size={14} color="currentColor" />,
  renderLink,
  'aria-label': ariaLabel = 'Breadcrumb',
}) => (
  <nav aria-label={ariaLabel} className={`${styles.root} ${styles[size]} ${className}`}>
    <ol className={styles.list}>
      {items.map((item, index) => (
        <li key={item.id} className={styles.item}>
          {index > 0 && <span className={styles.separator} aria-hidden="true">{separator}</span>}
          <div className={`${styles.step} ${item.switcher ? styles.switchable : ''}`}>
            {item.href ? (
              (() => {
                const props: React.ComponentPropsWithoutRef<'a'> = {
                  className: styles.label,
                  href: item.href,
                  onClick: item.onClick,
                  'aria-current': index === items.length - 1 ? 'page' : undefined,
                  children: <>
                    {item.icon && <span className={styles.icon} aria-hidden="true">{renderStepIcon(item.icon)}</span>}
                    <span className={styles.text}>{item.label}</span>
                  </>,
                };
                return renderLink ? renderLink(item, props) : <a {...props} />;
              })()
            ) : (
              <span className={styles.label} aria-current={index === items.length - 1 ? 'page' : undefined}>
                {item.icon && <span className={styles.icon} aria-hidden="true">{renderStepIcon(item.icon)}</span>}
                <span className={styles.text}>{item.label}</span>
              </span>
            )}
            {item.switcher && (
              <RadixSelect.Root value={item.switcher.value}
                onValueChange={value => value === ACTION_VALUE ? item.switcher!.action?.onSelect() : item.switcher!.onValueChange(value)}
                disabled={item.switcher.disabled || (item.switcher.options.length === 0 && !item.switcher.action)}>
                <RadixSelect.Trigger className={styles.trigger}
                  aria-label={`${item.switcher.label}: ${item.label}`}>
                  <RadixSelect.Icon aria-hidden="true" className={styles.icon}>
                    <Dropdown size={14} color="currentColor" />
                  </RadixSelect.Icon>
                </RadixSelect.Trigger>
                <RadixSelect.Portal>
                  <RadixSelect.Content className={`${selectStyles.content} ${styles.menu}`}
                    position="popper" align="end" sideOffset={4} collisionPadding={8}>
                    <RadixSelect.Viewport className={selectStyles.viewport}>
                      {item.switcher.options.map((option) => (
                        <RadixSelect.Item key={option.value} value={option.value}
                          className={selectStyles.item} textValue={option.label}>
                          <span className={styles.option}>
                            {option.icon && <span className={styles.icon} aria-hidden="true">{option.icon}</span>}
                            <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                          </span>
                          <RadixSelect.ItemIndicator className={selectStyles.itemIndicator}>
                            <Check size={12} color="currentColor" />
                          </RadixSelect.ItemIndicator>
                        </RadixSelect.Item>
                      ))}
                      {item.switcher.action && (
                        <>
                          <RadixSelect.Separator className={styles.menuDivider} />
                          <RadixSelect.Item value={ACTION_VALUE} className={selectStyles.item} textValue={item.switcher.action.label}>
                            <span className={styles.option}>
                              <span className={styles.icon} aria-hidden="true"><Plus size={14} color="currentColor" /></span>
                              <RadixSelect.ItemText>{item.switcher.action.label}</RadixSelect.ItemText>
                            </span>
                          </RadixSelect.Item>
                        </>
                      )}
                    </RadixSelect.Viewport>
                  </RadixSelect.Content>
                </RadixSelect.Portal>
              </RadixSelect.Root>
            )}
          </div>
        </li>
      ))}
    </ol>
  </nav>
);
