import React from 'react';
import styles from './Tag.module.css';

export interface TagProps {
  children: React.ReactNode;
  className?: string;
}

export function Tag({ children, className }: TagProps) {
  return (
    <span className={[styles.tag, className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}
