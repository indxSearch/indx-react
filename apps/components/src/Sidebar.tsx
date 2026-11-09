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
      { label: 'Alert', path: '/alert' },
      { label: 'BarMeter', path: '/bar-meter' },
      { label: 'BarSlider', path: '/bar-slider' },
      { label: 'Base', path: '/base' },
      { label: 'Breadcrumbs', path: '/breadcrumbs' },
      { label: 'Button', path: '/button' },
      { label: 'Chart', path: '/chart' },
      { label: 'Chat', path: '/chat' },
      { label: 'Checkbox', path: '/checkbox' },
      { label: 'Chip', path: '/chip' },
      { label: 'CodeCopy', path: '/code-copy' },
      { label: 'Combobox', path: '/combobox' },
      { label: 'CommandPalette', path: '/command-palette' },
      { label: 'DatePicker', path: '/date-picker' },
      { label: 'Disclosure', path: '/disclosure' },
      { label: 'EmptyState', path: '/empty-state' },
      { label: 'FilterPanelBase', path: '/filter-panel-base' },
      { label: 'GroupedBars', path: '/grouped-bars' },
      { label: 'Heatmap', path: '/heatmap' },
      { label: 'Icicle', path: '/icicle' },
      { label: 'InputField', path: '/input-field' },
      { label: 'Kbd', path: '/kbd' },
      { label: 'Modal', path: '/modal' },
      { label: 'NavigationMenu', path: '/navigation-menu' },
      { label: 'Popover', path: '/popover' },
      { label: 'Portal container', path: '/portal-container' },
      { label: 'ProgressBar', path: '/progress-bar' },
      { label: 'RadarChart', path: '/radar-chart' },
      { label: 'RadialChart', path: '/radial-chart' },
      { label: 'RadioButton', path: '/radio-button' },
      { label: 'Resizable', path: '/resizable' },
      { label: 'SaveBar', path: '/save-bar' },
      { label: 'ScoreMeter', path: '/score-meter' },
      { label: 'StepProgress', path: '/step-progress' },
      { label: 'ScrubSlider', path: '/scrub-slider' },
      { label: 'SliderField', path: '/slider-field' },
      { label: 'HistogramRange', path: '/histogram-range' },
      { label: 'SearchField', path: '/search-field' },
      { label: 'SegmentedControl', path: '/segmented-control' },
      { label: 'Select', path: '/select' },
      { label: 'Sheet', path: '/sheet' },
      { label: 'ShimmerText', path: '/shimmer-text' },
      { label: 'Sidebar', path: '/sidebar' },
      { label: 'Skeleton', path: '/skeleton' },
      { label: 'Slider', path: '/slider' },
      { label: 'Sparkline', path: '/sparkline' },
      { label: 'Stat', path: '/stat' },
      { label: 'Table', path: '/table' },
      { label: 'Tabs', path: '/tabs' },
      { label: 'TagsInput', path: '/tags-input' },
      { label: 'Textarea', path: '/textarea' },
      { label: 'Toast', path: '/toast' },
      { label: 'ToggleSwitch', path: '/toggle-switch' },
      { label: 'Tooltip', path: '/tooltip' },
      { label: 'TreeCanvas', path: '/tree-canvas' },
      { label: 'Truncate', path: '/truncate' },
      { label: 'Waffle', path: '/waffle' },
    ],
  },
  {
    title: 'Systm Assets',
    items: [
      { label: 'Spinners', path: '/spinners' },
      { label: 'Custom Cursors', path: '/cursors' },
      { label: 'Patterns', path: '/patterns' },
      { label: 'Colours', path: '/colors' },
    ],
  },
  {
    title: 'Intrface Components',
    items: [
      { label: 'SearchInput', path: '/search-input' },
      { label: 'AskPanel', path: '/ask-panel' },
      { label: 'ValueFilterPanel', path: '/value-filter-panel' },
      { label: 'RangeFilterPanel', path: '/range-filter-panel' },
      { label: 'BucketFilterPanel', path: '/bucket-filter-panel' },
      { label: 'SortByPanel', path: '/sort-by-panel' },
      { label: 'ActiveFiltersPanel', path: '/active-filters-panel' },
      { label: 'SearchResult', path: '/search-result' },
      { label: 'SearchResults states', path: '/search-results-states' },
      { label: 'SearchResultsMessage', path: '/search-results-message' },
      { label: 'SearchSettingsPanel', path: '/search-settings-panel' },
      { label: 'SearchErrorBoundary', path: '/search-error-boundary' },
      { label: 'FilterPanelSkeleton', path: '/filter-panel-skeleton' },
      { label: 'Filter panel states', path: '/filter-panel-states' },
    ],
  },
  {
    title: 'Intrface Compositions',
    items: [
      { label: 'Search or ask', path: '/search-or-ask' },
    ],
  },
  {
    title: 'Mockups',
    items: [
      { label: 'Dataset page', path: '/dataset-page' },
      { label: 'Records browser', path: '/records-browser' },
      { label: 'Admin teams', path: '/admin-teams' },
      { label: 'Portal onboarding', path: '/portal-onboarding' },
      { label: 'Portal support', path: '/portal-support' },
      { label: 'Field profiles', path: '/field-profiles' },
      { label: 'Preview number filters', path: '/preview-ranges' },
      { label: 'Console shell', path: '/console-shell' },
      { label: 'Console with Sidebar', path: '/console-sidebar' },
      { label: 'Get started', path: '/get-started' },
      { label: 'Analytics dashboard', path: '/analytics-dashboard' },
      { label: 'Dataset card', path: '/dataset-card' },
      { label: 'Question suggestions', path: '/question-suggestions' },
      { label: 'Support', path: '/support' },
      { label: 'Observr Agent', path: '/observr-agent' },
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
