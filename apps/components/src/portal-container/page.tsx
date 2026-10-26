import { useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Button, Modal, Select, Tooltip, PortalContainerProvider } from '@indxsearch/systm';
import shadowStyles from '@indxsearch/systm/styles.shadow.css?inline';
import styles from './page.module.css';

/** systm inside a shadow root, as the Indx widget renders it: the shadow stylesheet carries the
 *  tokens on :host, and the provider keeps the floating parts (modal, select, tooltip) inside. */
function ShadowDemo() {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState('relevance');
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '1rem', fontFamily: 'var(--font-family)' }}>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <div style={{ width: 180 }}>
        <Select value={sort} onValueChange={setSort} options={[
          { value: 'relevance', label: 'Relevance' },
          { value: 'price', label: 'Price' },
          { value: 'newest', label: 'Newest' },
        ]} />
      </div>
      <Tooltip content="Rendered in the shadow root"><Button variant="secondary">Hover me</Button></Tooltip>
      <Modal open={open} onOpenChange={setOpen} title="Inside the shadow root" description="Its styles come from the shadow stylesheet; the page's CSS does not reach it.">
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Modal>
    </div>
  );
}

export default function PortalContainerPage() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${shadowStyles}</style><div></div>`;
    const root: Root = createRoot(shadow.lastElementChild as HTMLElement);
    root.render(
      <PortalContainerProvider container={shadow}>
        <ShadowDemo />
      </PortalContainerProvider>,
    );
    return () => root.unmount();
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Portal container</h1>
        <p className={styles.desc}>
          systm inside a shadow root, as the Indx widget renders it. PortalContainerProvider keeps the floating
          parts (Modal, Select, Tooltip, Popover, DatePicker, the Breadcrumbs' switchers) inside the root it is given,
          and <code>@indxsearch/systm/styles.shadow.css</code> carries the tokens on <code>:host</code>.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>In a shadow root</h2>
        <div ref={hostRef} style={{ border: '1px dashed var(--lv3)' }} />
      </div>
    </main>
  );
}
