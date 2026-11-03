import React, { useEffect } from 'react';
import { FilterPanelBase } from '@indxsearch/systm';
import styles from './FilterPanelNotice.module.css';

export interface FilterPanelNoticeProps {
  /** The panel's own title, so the notice sits where the panel would have been. */
  label?: string;
  field: string;
  /** The roles the field lacks, such as ['filterable', 'facetable']. */
  missing: string[];
}

/** A filter panel whose field cannot be used: the field is not marked for the role the panel needs.
 *  A setup mistake, so it is said quietly in the panel and fully in the console, not in red. */
export const FilterPanelNotice: React.FC<FilterPanelNoticeProps> = ({ label, field, missing }) => {
  const roles = missing.map(r => r[0].toUpperCase() + r.slice(1)).join(' and ');

  useEffect(() => {
    console.warn(
      `[intrface] The panel for "${field}" is hidden: the field is not ${roles}. ` +
      `Mark it ${roles} in the dataset's field configuration (web console → Fields).`
    );
  }, [field, roles]);

  return (
    <FilterPanelBase title={label ?? field} collapsible={false}>
      <div className={styles.notice}>
        <span>Not available</span>
        <code className={styles.technical}>{field}: not {roles}</code>
      </div>
    </FilterPanelBase>
  );
};
