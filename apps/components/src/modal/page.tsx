import { useState } from 'react';
import { Modal, Button, InputField } from '@indxsearch/systm';
import styles from './page.module.css';

const actions = { display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' } as const;

export default function ModalPage() {
  const [open, setOpen] = useState(false);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Modal</h1>
        <p className={styles.desc}>Accessible dialog built on Radix — overlay, title, description, and close button</p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>With Trigger</h2>
        <div className={styles.column}>
          <Modal
            trigger={<Button>Open modal</Button>}
            title="Delete dataset"
            description="This permanently removes the dataset and all its documents. This cannot be undone."
          >
            <div style={actions}>
              <Button variant="secondary">Cancel</Button>
              <Button>Delete</Button>
            </div>
          </Modal>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Controlled</h2>
        <div className={styles.column}>
          <Button variant="secondary" onClick={() => setOpen(true)}>Open controlled modal</Button>
          <Modal
            open={open}
            onOpenChange={setOpen}
            title="Edit name"
            description="Update the display name for this dataset."
          >
            <InputField label="Name" defaultValue="pokedex" />
            <div style={actions}>
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </div>
          </Modal>
        </div>
      </div>
    </main>
  );
}
