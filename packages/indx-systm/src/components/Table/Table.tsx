import React from 'react'
import styles from './Table.module.css'

interface TableProps {
  children: React.ReactNode
  caption?: string
  'aria-label'?: string
  /**
   * Put the table in a frame that scrolls sideways when the table is wider than the space it has,
   * so a wide table never makes the page scroll. The frame is focusable, so it can be scrolled
   * from the keyboard.
   */
  scrollable?: boolean
  /**
   * With `scrollable`: keep the first column in place while the rest scrolls under it, so the
   * reader always knows which row they are on. Give that column a sensible width, since it takes
   * its share of a narrow screen for good.
   */
  stickyFirstColumn?: boolean
}

export function Table({ children, caption, 'aria-label': ariaLabel, scrollable = false, stickyFirstColumn = false }: TableProps) {
  // Warn in development if there's no caption or aria-label
  if (import.meta.env.DEV) {
    if (!caption && !ariaLabel) {
      console.warn('Table: Component should have either a caption or aria-label for accessibility.');
    }
  }

  const table = (
    <table className={`${styles.table} ${scrollable && stickyFirstColumn ? styles.stickyFirst : ''}`} aria-label={ariaLabel}>
      {caption && <caption className={styles.caption}>{caption}</caption>}
      {children}
    </table>
  )

  return scrollable
    ? <div className={styles.scroll} role="region" aria-label={ariaLabel ?? caption} tabIndex={0}>{table}</div>
    : table
}
