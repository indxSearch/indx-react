import React from 'react'
import styles from './Table.module.css'

interface TableCellProps {
  label?: string
  children?: React.ReactNode
  isHeader?: boolean
  scope?: 'col' | 'row'
  /** Let the cell span columns, for a control that wants the full width of a two-column block. */
  colSpan?: number
}

export function TableCell({ label, children, isHeader = false, scope, colSpan }: TableCellProps) {
  const CellType = isHeader ? 'th' : 'td';
  const cellProps = { ...(isHeader && scope ? { scope } : {}), ...(colSpan ? { colSpan } : {}) };

  if (label || children) {
    return (
      <CellType {...cellProps}>
        <div className={styles.cellInner}>
          {label && <span className={styles.cellLabel}>{label}</span>}
          {children && <div className={styles.cellContent}>{children}</div>}
        </div>
      </CellType>
    )
  }
  return <CellType {...cellProps}>{children}</CellType>
}
