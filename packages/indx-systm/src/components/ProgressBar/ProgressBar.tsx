import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  value: number;
  showLabel?: boolean;
  fulfilledColor?: boolean;
  className?: string;
}

export function ProgressBar({ value, showLabel = false, fulfilledColor = false, className = '' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const label = `${Math.round(clamped)}%`;
  const fillColor = fulfilledColor && clamped >= 100 ? 'var(--CPureBlue)' : undefined;

  return (
    <div className={`${styles.wrapper} ${className}`} role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${clamped}%`, backgroundColor: fillColor }} />
      </div>
      {showLabel && (
        <span className={styles.label} aria-hidden="true">{label}</span>
      )}
    </div>
  );
}
