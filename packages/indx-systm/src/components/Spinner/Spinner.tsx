import styles from './Spinner.module.css';
import './spinners.generated.css';
import { spinners, spinnerNames, type SpinnerName } from './spinners.generated';

export interface SpinnerProps {
  /** Which spinner to play; defaults to the first generated one. */
  name?: SpinnerName;
  /** Width in px (or any CSS length); height follows the pixl 7x5 ratio. Ideally a multiple of 7. */
  size?: number | string;
  /** Any CSS color; defaults to currentColor. */
  color?: string;
  /** Ms per frame, overriding the spinner's authored delay. */
  delay?: number;
  className?: string;
  'aria-label'?: string;
}

export function Spinner({
  name = spinnerNames[0],
  size = 21,
  color = 'currentColor',
  delay,
  className = '',
  'aria-label': ariaLabel = 'Loading',
}: SpinnerProps) {
  const def = spinners[name];
  const [, , vbWidth, vbHeight] = def.viewBox.split(' ').map(Number);
  const ratio = vbHeight / vbWidth;
  const height = typeof size === 'number' ? size * ratio : `calc(${size} * ${ratio})`;
  const frameDelay = delay ?? def.delay;
  const frameCount = def.frames.length;
  const cycle = frameCount * frameDelay;

  return (
    <svg
      className={`${styles.spinner} ${className}`}
      width={size}
      height={height}
      viewBox={def.viewBox}
      fill="none"
      role="status"
      aria-label={ariaLabel}
      xmlns="http://www.w3.org/2000/svg"
    >
      {def.frames.map((d, i) =>
        d ? (
          <path
            key={i}
            className={styles.frame}
            d={d}
            fill={color}
            style={{
              animation: `indx-spinner-${frameCount} ${cycle}ms step-end infinite`,
              animationDelay: `${i * frameDelay - cycle}ms`,
            }}
          />
        ) : null,
      )}
    </svg>
  );
}
