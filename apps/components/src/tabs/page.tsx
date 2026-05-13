import { useState } from 'react';
import { Tabs } from '@indxsearch/systm';
import styles from './page.module.css';

const ITEMS = [
  { label: 'Overview', value: 'overview' },
  { label: 'Settings', value: 'settings' },
  { label: 'Activity', value: 'activity' },
];

export default function TabsPage() {
  const [activeDefault, setActiveDefault] = useState('overview');
  const [activeMicro, setActiveMicro] = useState('overview');
  const [activeLarge, setActiveLarge] = useState('overview');

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Tabs</h1>
        <p className={styles.desc}>Tab navigation with border-bottom active indicator and three sizes</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Default</h2>
        <Tabs items={ITEMS} value={activeDefault} onValueChange={setActiveDefault} />
        <p className={styles.active}>Active: {activeDefault}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Micro</h2>
        <Tabs items={ITEMS} value={activeMicro} onValueChange={setActiveMicro} size="micro" />
        <p className={styles.active}>Active: {activeMicro}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Large</h2>
        <Tabs items={ITEMS} value={activeLarge} onValueChange={setActiveLarge} size="large" />
        <p className={styles.active}>Active: {activeLarge}</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>All Sizes</h2>
        <div className={styles.stack}>
          <Tabs items={ITEMS} value="overview" onValueChange={() => {}} size="micro" />
          <Tabs items={ITEMS} value="overview" onValueChange={() => {}} size="default" />
          <Tabs items={ITEMS} value="overview" onValueChange={() => {}} size="large" />
        </div>
      </div>
    </main>
  );
}
