import { Link, NavLink } from 'react-router-dom';
import { FilterPanelBase } from '@indxsearch/systm';
import { Indx } from '@indxsearch/pixl';
import styles from './Sidebar.module.css';

interface NavItem {
  label: string;
  path: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    title: 'Pixl Icons',
    items: [{ label: 'Icon Gallery', path: '/icons' }],
  },
  {
    title: 'Systm Components',
    items: [
      { label: 'Button', path: '/button' },
      { label: 'Checkbox', path: '/checkbox' },
      { label: 'InputField', path: '/input-field' },
      { label: 'RadioButton', path: '/radio-button' },
      { label: 'SearchField', path: '/search-field' },
      { label: 'Select', path: '/select' },
      { label: 'Slider', path: '/slider' },
      { label: 'ToggleSwitch', path: '/toggle-switch' },
      { label: 'Popover', path: '/popover' },
      { label: 'Table', path: '/table' },
      { label: 'Base', path: '/base' },
      { label: 'Tabs', path: '/tabs' },
      { label: 'ProgressBar', path: '/progress-bar' },
      { label: 'Chart', path: '/chart' },
      { label: 'FilterPanelBase', path: '/filter-panel-base' },
      { label: 'Chip', path: '/chip' },
      { label: 'Tooltip', path: '/tooltip' },
    ],
  },
  {
    title: 'Systm Assets',
    items: [
      { label: 'Custom Cursors', path: '/cursors' },
      { label: 'Patterns', path: '/patterns' },
    ],
  },
  {
    title: 'Intrface Components',
    items: [
      { label: 'SearchInput', path: '/search-input' },
      { label: 'ValueFilterPanel', path: '/value-filter-panel' },
      { label: 'RangeFilterPanel', path: '/range-filter-panel' },
      { label: 'SortByPanel', path: '/sort-by-panel' },
      { label: 'ActiveFiltersPanel', path: '/active-filters-panel' },
      { label: 'SearchResult', path: '/search-result' },
      { label: 'FilterPanelSkeleton', path: '/filter-panel-skeleton' },
    ],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`${styles.overlay} ${open ? styles.overlayVisible : ''}`}
        onClick={onClose}
      />

      <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}>
        <Link to="/" className={styles.logo} onClick={onClose}>
          <span className={styles.logoIcon}><Indx color="currentColor" /></span>
          <span className={styles.logoBrand}>indx</span>
          <span className={styles.logoSub}>ui components</span>
        </Link>

        {navGroups.map((group) => (
          <FilterPanelBase key={group.title} title={group.title}>
            <ul className={styles.list}>
              {group.items.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </FilterPanelBase>
        ))}
      </aside>
    </>
  );
}
