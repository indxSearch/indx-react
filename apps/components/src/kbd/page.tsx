import { Kbd } from '@indxsearch/systm';
import styles from './page.module.css';

export default function KbdPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Kbd</h1>
        <p className={styles.desc}>
          A key, as the keyboard has it: after shadcn's Kbd, a filled cap with no outline, the page's font small and
          medium, the muted surface and text. For a
          shortcut beside the thing it opens and the hints under a field. CommandPalette, the chat hints and the
          console's Jump to button all draw their keys with it.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Keys</h2>
        <div className={styles.row}><Kbd>esc</Kbd><Kbd>⌘K</Kbd><Kbd>Ctrl K</Kbd><Kbd>↵</Kbd><Kbd>⇧↵</Kbd><Kbd>⌘B</Kbd><Kbd>⌥⌫</Kbd><Kbd>⌃C</Kbd></div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>In a hint</h2>
        <p className={styles.hint}><span><Kbd>↵</Kbd> send</span><span><Kbd>⇧↵</Kbd> new line</span><span><Kbd>esc</Kbd> close</span></p>
      </div>
    </main>
  );
}
