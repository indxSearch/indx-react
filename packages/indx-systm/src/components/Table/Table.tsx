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
  /**
   * With `scrollable`: how far the frame reaches past its box on the end side, into the gutter
   * there, as a CSS length (a number is px). A table that has to scroll then runs to the edge of
   * the screen instead of stopping at the page margin, which gives it that width back and shows
   * there is more, and stops scrolling when its end meets that edge. The start side stays put, so the table lines up with the page and a pinned
   * first column stays where it is. Set it to the width of the gutter beside the table.
   */
  bleedEnd?: string | number
}

export function Table({ children, caption, 'aria-label': ariaLabel, scrollable = false, stickyFirstColumn = false, bleedEnd }: TableProps) {
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
    ? (
      <div
        className={`${styles.scroll} ${bleedEnd !== undefined ? styles.bleedEnd : ''}`}
        style={bleedEnd !== undefined ? { '--table-bleed': typeof bleedEnd === 'number' ? `${bleedEnd}px` : bleedEnd } as React.CSSProperties : undefined}
        role="region" aria-label={ariaLabel ?? caption} tabIndex={0}
      >{table}</div>
    )
    : table
}
