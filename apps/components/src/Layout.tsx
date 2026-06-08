import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@indxsearch/systm';
import { Menu } from '@indxsearch/pixl';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer and scroll to top whenever the route changes
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <Button
        variant="ghost"
        size="micro"
        iconLeft={<Menu />}
        aria-label="Toggle navigation"
        className={styles.menuButton}
        onClick={() => setOpen((o) => !o)}
      />

      <Sidebar open={open} onClose={() => setOpen(false)} />

      <div className={styles.content}>{children}</div>
    </>
  );
}
