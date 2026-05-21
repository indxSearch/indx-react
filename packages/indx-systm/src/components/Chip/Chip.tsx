import React from 'react';
import styles from './Chip.module.css';

export interface ChipProps {
  children: React.ReactNode;
  color?: string;
  textColor?: string;
  className?: string;
}

export function Chip({ children, color, textColor, className }: ChipProps) {
  const style: React.CSSProperties = {};
  if (color) style.backgroundColor = color;
  if (textColor) style.color = textColor;

  return (
    <span className={[styles.chip, className].filter(Boolean).join(' ')} style={style}>
      {children}
    </span>
  );
}
