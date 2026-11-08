import React, { useEffect, useRef } from 'react'
import styles from './Table.module.css'
import { enableColumnResize } from './columnResize'

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
  /**
   * Let the reader set each column's width by dragging a handle at its header's right edge, or
   * with the arrow keys once it has focus; a double click (or Delete) gives the width back. Every
   * column gets a fixed width from the start, so the rows a page shows never move the columns:
   * a longer value is cut instead. Name a column by its header's `data-column`, and give its first
   * width as `data-width` (px); without them a column is named by its place and keeps the width it
   * first had. Header cells must be plain `th`s, as TableHeader renders them.
   */
  resizableColumns?: boolean
  /** With `resizableColumns`: where the reader's widths are kept (localStorage). Left out, they last
   *  as long as the page. */
  columnStorageKey?: string
}

export function Table({ children, caption, 'aria-label': ariaLabel, scrollable = false, stickyFirstColumn = false, bleedEnd, resizableColumns = false, columnStorageKey }: TableProps) {
  const ref = useRef<HTMLTableElement>(null)
  useEffect(() => {
    if (!resizableColumns || !ref.current) return
    return enableColumnResize(ref.current, { table: styles.resizable, handle: styles.columnHandle }, columnStorageKey)
  }, [resizableColumns, columnStorageKey])

  // Warn in development if there's no caption or aria-label
  if (import.meta.env.DEV) {
    if (!caption && !ariaLabel) {
      console.warn('Table: Component should have either a caption or aria-label for accessibility.');
    }
  }

  const table = (
    <table ref={ref} className={`${styles.table} ${scrollable && stickyFirstColumn ? styles.stickyFirst : ''}`} aria-label={ariaLabel}>
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
