import styles from './Tabs.module.css';

export interface TabItem {
  label: string;
  value: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  size?: 'micro' | 'default' | 'large';
}

export function Tabs({ items, value, onValueChange, size = 'default' }: TabsProps) {
  return (
    <div className={styles.tabs} role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          role="tab"
          type="button"
          aria-selected={value === item.value}
          className={`${styles.tab} ${styles[size]} ${value === item.value ? styles.active : ''}`}
          onClick={() => onValueChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
