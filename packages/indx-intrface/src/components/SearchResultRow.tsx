import React from 'react';
import styles from './SearchResultRow.module.css';

export interface SearchResultRowProps {
  variant?: 'title' | 'default';
  children: React.ReactNode;
}

export const SearchResultRow: React.FC<SearchResultRowProps> = ({ variant = 'default', children }) => (
  <div className={[styles.row, variant === 'title' ? styles.title : ''].filter(Boolean).join(' ')}>
    {children}
  </div>
);
