import React from 'react';
import { Chip } from '../Chip/Chip';
import styles from './Chat.module.css';

interface IconProps {
  size?: string | number;
  color?: string;
}

export interface CitationRefProps {
  /** The number the source list shows for this citation. */
  n: number;
  /** Where the source lives; rendered as a link when given. */
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  className?: string;
}

/** Numbered inline mark that sits in the running text and points at an entry in `CitationList`. */
export function CitationRef({ n, href, onClick, title, className = '' }: CitationRefProps) {
  const cls = `${styles.ref} ${className}`;
  if (href) {
    return <a href={href} className={cls} onClick={onClick} title={title} aria-label={`Source ${n}${title ? `: ${title}` : ''}`}>{n}</a>;
  }
  return <button type="button" className={cls} onClick={onClick} title={title} aria-label={`Source ${n}${title ? `: ${title}` : ''}`}>{n}</button>;
}

export interface CitationItem {
  n: number;
  title: string;
  href?: string;
  /** Icon of the source type — a pixl icon element. */
  icon?: React.ReactElement<IconProps>;
  onClick?: (e: React.MouseEvent) => void;
}

export interface CitationListProps {
  items: CitationItem[];
  /** Heading over the list. */
  label?: string;
  className?: string;
}

/** The sources an answer drew on, as a row of numbered chips. */
export function CitationList({ items, label = 'Sources', className = '' }: CitationListProps) {
  if (items.length === 0) return null;
  return (
    <div className={`${styles.stack} ${className}`}>
      <div className={styles.label}>{label}</div>
      <div className={styles.wrap}>
        {items.map(item => {
          const chip = (
            <Chip icon={item.icon}>
              <span className={styles.citationNumber}>{item.n}</span> {item.title}
            </Chip>
          );
          return item.href
            ? <a key={item.n} href={item.href} className={styles.citationLink} onClick={item.onClick}>{chip}</a>
            : <button key={item.n} type="button" className={styles.citationLink} onClick={item.onClick}>{chip}</button>;
        })}
      </div>
    </div>
  );
}
