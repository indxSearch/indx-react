import React from 'react';
import { InputField } from '@indxsearch/systm';
import styles from './page.module.css';

const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
const labelStyle: React.CSSProperties = { font: 'var(--text-xs)', color: 'var(--lv6)', flexShrink: 0, width: 56 };

export default function InputFieldPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>InputField</h1>
        <p className={styles.desc}>Text input field with label, error states, and validation</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Basic</h2>
        <div className={styles.column}>
          <InputField placeholder="Enter text..." />
          <InputField label="With Label" placeholder="Enter text..." />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>With Values</h2>
        <div className={styles.column}>
          <InputField label="Username" defaultValue="johndoe" />
          <InputField label="Email" defaultValue="john@example.com" type="email" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Error State</h2>
        <div className={styles.column}>
          <InputField label="Email" error="Invalid email format" defaultValue="invalid-email" />
          <InputField label="Password" error="Password is required" type="password" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Invalid State</h2>
        <div className={styles.column}>
          <InputField label="Username" isValid={false} defaultValue="invalid" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Disabled State</h2>
        <div className={styles.column}>
          <InputField label="Disabled" disabled placeholder="Cannot edit..." />
          <InputField label="Disabled with Value" disabled defaultValue="Read only" />
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>In a narrow layout</h2>
        <p>An inspector panel with labelled rows, two of them side by side in a grid. Drag the panel's right edge narrower: the inputs shrink within their columns instead of forcing the layout wider.</p>
        <div style={{ resize: 'horizontal', overflow: 'auto', width: 360, minWidth: 160, maxWidth: 720, padding: 12, background: 'var(--lv1)', border: '1px solid var(--lv3)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Name</span>
            <InputField defaultValue="chevron_down" />
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Category</span>
            <InputField defaultValue="Arrows and chevrons" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div style={rowStyle}>
              <span style={labelStyle}>Width</span>
              <InputField type="number" defaultValue={24} />
            </div>
            <div style={rowStyle}>
              <span style={labelStyle}>Height</span>
              <InputField type="number" defaultValue={24} />
            </div>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Tags</span>
            <InputField placeholder="Comma separated" />
          </div>
        </div>
      </div>
    </main>
  );
}
