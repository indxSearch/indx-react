import React, { useLayoutEffect, useRef, useState } from 'react';
import styles from './SearchField.module.css';
import { Search } from '@indxsearch/pixl';
import { Button } from '../Button/Button';

interface IconProps {
  size?: string | number;
  color?: string;
}

export type InputSize = 'micro' | 'default';

const iconSizeMap: Record<InputSize, number> = {
  micro: 14,
  default: 21,
};

export interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
  showSearchIcon?: boolean;
  searchIcon?: React.ReactElement<IconProps>;
  searchIconColor?: string;
  inputSize?: InputSize;
  showFocusBorder?: boolean;
  /** A ghost "Clear" button at the end of the field while it holds text (default true), as the
   *  Blazor port's `Clearable`. Clearing fires `onChange` with an empty value and keeps the focus
   *  in the field. Turn it off where the page draws its own Clear (intrface's SearchInput, whose
   *  Clear also resets the filters). */
  clearable?: boolean;
  children?: React.ReactNode;
}

export function SearchField({
  label,
  error,
  className = '',
  showSearchIcon = true,
  searchIcon,
  searchIconColor,
  inputSize = 'default',
  showFocusBorder = false,
  clearable = true,
  children,
  id: providedId,
  type = 'search',
  onChange,
  ...props
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Whether there is text to clear: the parent's value when it controls the field, else what was typed.
  const controlled = props.value !== undefined;
  const [typed, setTyped] = useState(String(props.defaultValue ?? ''));
  const text = controlled ? String(props.value ?? '') : typed;
  const showClear = clearable && text.length > 0 && !props.disabled && !props.readOnly;
  const changed = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!controlled) setTyped(e.target.value);
    onChange?.(e);
  };
  // Through the input itself, so a controlled parent hears it as any other edit: React reports
  // an input event after a native value change as a change.
  const clear = () => {
    const el = inputRef.current;
    if (!el) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, '');
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.focus();
  };
  // What sits on the right (a Clear button, chips) is laid over the input, so the input is padded
  // by its width; otherwise typed text runs underneath it.
  const rightRef = useRef<HTMLDivElement>(null);
  const [rightWidth, setRightWidth] = useState(0);
  const hasChildren = React.Children.toArray(children).length > 0 || showClear;
  useLayoutEffect(() => {
    const el = rightRef.current;
    if (!el) { setRightWidth(0); return; }
    const measure = () => setRightWidth(el.offsetWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasChildren]);
  const generatedId = React.useId();
  const inputId = providedId || generatedId;
  const errorId = `${inputId}-error`;

  const iconSize = iconSizeMap[inputSize];
  const inlineStyles: React.CSSProperties & { [key: string]: string } = {};

  if (searchIconColor) {
    inlineStyles['--search-icon-color'] = searchIconColor;
  }
  if (rightWidth > 0) {
    inlineStyles.paddingRight = `${rightWidth + 10}px`;
  }

  const fallbackIconColor = 'var(--search-icon-color)';
  const iconToRender = searchIcon ?? <Search />;

  const sizeClass = inputSize === 'micro' ? styles.sizeMicro : styles.sizeDefault;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={`${styles.inputContainer} ${sizeClass}`}>
        {showSearchIcon && (
          <span className={styles.searchIcon} aria-hidden="true">
            {React.cloneElement(iconToRender, {
              size: iconSize,
              color: searchIconColor ?? fallbackIconColor,
            })}
          </span>
        )}
        <input
          ref={inputRef}
          id={inputId}
          type={type}
          className={`${styles.input} ${showFocusBorder ? styles.focus : ''} ${error ? styles.error : ''}`}
          style={inlineStyles}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          {...props}
          onChange={changed}
        />
        {hasChildren && (
          <div ref={rightRef} className={styles.rightContent}>
            {children}
            {showClear && <Button variant="ghost" size="micro" onClick={clear} aria-label="Clear search">Clear</Button>}
          </div>
        )}
      </div>
      {error && (
        <span id={errorId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
