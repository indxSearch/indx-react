import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Chevron_down, Check } from '@indxsearch/pixl';
import styles from './Select.module.css';

export interface SelectOption {
  label: string;
  value: string;
  /** Optional leading icon, rendered in the trigger and the menu item. */
  icon?: React.ReactNode;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  size?: 'micro' | 'default' | 'large';
  'aria-label'?: string;
  id?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select...',
  className = '',
  disabled = false,
  label,
  size = 'default',
  'aria-label': ariaLabel,
  id,
}) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const labelId = `${selectId}-label`;
  const selectedOption = options.find((o) => o.value === value);

  const selectComponent = (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        id={selectId}
        className={`${styles.trigger} ${styles[size]} ${className} cursor-pointer`}
        {...(label ? { 'aria-labelledby': labelId } : ariaLabel ? { 'aria-label': ariaLabel } : {})}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {selectedOption?.icon}
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon className={styles.icon} aria-hidden="true">
          <Chevron_down size={size === 'large' ? 21 : 14} color="currentColor" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          className={styles.content}
          position="popper"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <RadixSelect.Viewport className={styles.viewport}>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                className={styles.item}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {option.icon}
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </span>
                <RadixSelect.ItemIndicator className={styles.itemIndicator}>
                  <Check size={12} color="currentColor" />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );

  // Only wrap with div if there's a label
  if (label) {
    return (
      <div className={styles.wrapper}>
        <label id={labelId} htmlFor={selectId} className={styles.label}>
          {label}
        </label>
        {selectComponent}
      </div>
    );
  }

  return selectComponent;
};
