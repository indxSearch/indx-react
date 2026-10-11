import React, { useLayoutEffect, useRef, useState } from 'react';
import styles from './SearchField.module.css';
import { Search } from '@indxsearch/pixl';

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
  children,
  id: providedId,
  type = 'search',
  ...props
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  // What sits on the right (a Clear button, chips) is laid over the input, so the input is padded
  // by its width; otherwise typed text runs underneath it.
  const rightRef = useRef<HTMLDivElement>(null);
  const [rightWidth, setRightWidth] = useState(0);
  const hasChildren = React.Children.toArray(children).length > 0;
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
        />
        {hasChildren && <div ref={rightRef} className={styles.rightContent}>{children}</div>}
      </div>
      {error && (
        <span id={errorId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
