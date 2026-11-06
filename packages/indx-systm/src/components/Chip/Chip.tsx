import React from 'react';
import styles from './Chip.module.css';

interface IconProps {
  size?: string | number;
  color?: string;
}

export interface ChipProps {
  children: React.ReactNode;
  color?: string;
  textColor?: string;
  className?: string;
  title?: string;
  /** Optional leading icon. Sized and coloured to match the chip text. */
  icon?: React.ReactElement<IconProps>;
  /** `large` is a taller, more-padded badge that suits a leading icon. */
  size?: 'default' | 'large';
  /** Makes the chip a toggle button. Without it the chip is a label. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** A toggle's state: ink on the ground, as a picked value reads. */
  selected?: boolean;
  disabled?: boolean;
}

/** `indx-chip` is a stable class beside the hashed one, as the Blazor Chip has, so a container can
 *  style the chips inside it (intrface's result rows set their background). With `onClick` it is a
 *  toggle, a button that says whether it is `selected` (aria-pressed), for values that can be
 *  picked, as a facet's are in the console's search preview. */
export function Chip({ children, color, textColor, className, title, icon, size = 'default', onClick, selected = false, disabled = false }: ChipProps) {
  const style: React.CSSProperties = {};
  if (color) style.backgroundColor = color;
  if (textColor) style.color = textColor;
  const classes = [styles.chip, 'indx-chip', size === 'large' && styles.large, className];
  const content = (
    <>
      {icon && React.cloneElement(icon, { size: 14, color: 'currentColor' })}
      {children}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={[...classes, styles.toggle, selected && styles.selected].filter(Boolean).join(' ')}
        style={style}
        title={title}
        aria-pressed={selected}
        disabled={disabled}
        onClick={onClick}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes.filter(Boolean).join(' ')} style={style} title={title}>
      {content}
    </span>
  );
}
