import { Button } from '../Button/Button';
import styles from './Chat.module.css';

export interface SuggestionsProps {
  items: string[];
  onPick: (text: string) => void;
  /** Heading over the row. */
  label?: string;
  className?: string;
}

/** Questions to start from, shown while the thread is empty. */
export function Suggestions({ items, onPick, label = 'Try asking', className = '' }: SuggestionsProps) {
  return (
    <div className={`${styles.suggestions} ${className}`}>
      <div className={styles.label}>{label}</div>
      <div className={styles.wrap}>
        {items.map(s => <Button key={s} variant="secondary" size="micro" onClick={() => onPick(s)}>{s}</Button>)}
      </div>
    </div>
  );
}
