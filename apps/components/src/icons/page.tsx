
import { useState } from 'react';
import * as Pixl from '@indxsearch/pixl';
import { Slider } from '@indxsearch/systm';
import styles from './page.module.css';

// Every export of @indxsearch/pixl is an icon, so the gallery lists the package itself:
// a new pixl release shows up here without editing this file.
export const ICON_NAMES = Object.keys(Pixl)
  .filter((name) => /^[A-Z]/.test(name))
  .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }));

export default function IconsPage() {
  const [iconSize, setIconSize] = useState(35);

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pixl Icons</h1>
          <p className={styles.subtitle}>
            {ICON_NAMES.length} icons from @indxsearch/pixl
          </p>
        </div>

        <div className={styles.controls}>
          <label className={styles.controlLabel}>
            Icon Size: {iconSize}px
          </label>
          <div className={styles.slider}>
            <Slider
              min={14}
              max={56}
              step={7}
              value={iconSize}
              onChange={(val) => setIconSize(val as number)}
            />
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        {ICON_NAMES.map((iconName) => {
          const IconComponent = (Pixl as any)[iconName];

          if (!IconComponent) return null;

          return (
            <div key={iconName} className={styles.iconCard}>
              <div className={styles.iconPreview}>
                <IconComponent size={iconSize} color="var(--lv8)" />
              </div>
              <div className={styles.iconName}>{iconName}</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
