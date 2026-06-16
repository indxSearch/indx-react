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
  /** Optional leading icon. Sized and coloured to match the chip text. */
  icon?: React.ReactElement<IconProps>;
  /** `large` is a taller, more-padded badge that suits a leading icon. */
  size?: 'default' | 'large';
}

export function Chip({ children, color, textColor, className, icon, size = 'default' }: ChipProps) {
  const style: React.CSSProperties = {};
  if (color) style.backgroundColor = color;
  if (textColor) style.color = textColor;

  return (
    <span
      className={[styles.chip, size === 'large' && styles.large, className].filter(Boolean).join(' ')}
      style={style}
    >
      {icon && React.cloneElement(icon, { size: 14, color: 'currentColor' })}
      {children}
    </span>
  );
}
