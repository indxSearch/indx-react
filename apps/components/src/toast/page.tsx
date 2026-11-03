import { Button, Toaster, toast } from '@indxsearch/systm';
import { Check } from '@indxsearch/pixl';
import styles from './page.module.css';

export default function ToastPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Toast</h1>
        <p className={styles.desc}>
          Brief notices for a thing done or failed, at the window's lower right, gone by themselves: four seconds, a
          failure eight. The pointer on one holds it. A notice is plain ink with an icon when it has one; a failure has the
          signal colour. No motion: it is simply there, and then not. Call toast() or toast.error() anywhere and place
          one Toaster in the app.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Kinds</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="micro" onClick={() => toast('Settings saved.', { icon: <Check size={14} color="currentColor" /> })}>A notice</Button>
          <Button
            variant="secondary"
            size="micro"
            onClick={() => toast('Synonym entry deleted.', { icon: <Check size={14} color="currentColor" />, action: { label: 'Undo', onClick: () => toast('Synonym entry restored.') } })}
          >
            With an action
          </Button>
          <Button variant="secondary" size="micro" onClick={() => toast.error('The list could not be saved. The current list is unchanged.')}>A failure</Button>
        </div>
      </div>
      <Toaster />
    </main>
  );
}
