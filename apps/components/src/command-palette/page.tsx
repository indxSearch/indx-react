import { useMemo, useState } from 'react';
import { Button, CommandPalette, type CommandPaletteItem } from '@indxsearch/systm';
import { Database, Synonym, Boost, Sliders_horizontal, User, Search } from '@indxsearch/pixl';
import styles from './page.module.css';

// A stand-in for the console's catalog. The console searches it with Indx itself; this page
// filters by a plain substring, which is all a demo needs.
const ALL: CommandPaletteItem[] = [
  ...['furniture', 'lighting', 'outdoor'].map((d) => ({ id: d, label: d, group: 'Datasets', icon: <Database size={14} color="currentColor" />, hint: 'shop' })),
  ...['furniture', 'lighting'].flatMap((d) => [
    { id: `${d}/synonyms`, label: `${d} › Synonyms`, group: 'Dataset sections', icon: <Synonym size={14} color="currentColor" /> },
    { id: `${d}/boosts`, label: `${d} › Boost rules`, group: 'Dataset sections', icon: <Boost size={14} color="currentColor" /> },
    { id: `${d}/search`, label: `${d} › Search preview`, group: 'Dataset sections', icon: <Search size={14} color="currentColor" /> },
  ]),
  { id: 'account', label: 'Account', group: 'Account', icon: <User size={14} color="currentColor" /> },
  { id: 'settings', label: 'Settings: Websites', group: 'Admin', icon: <Sliders_horizontal size={14} color="currentColor" /> },
];

export default function CommandPalettePage() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? ALL.filter((i) => i.label.toLowerCase().includes(q)) : ALL.filter((i) => i.group !== 'Dataset sections');
  }, [query]);

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>CommandPalette</h1>
        <p className={styles.desc}>
          A jump menu over the page. Cmd or Ctrl and K opens it anywhere, typing narrows it, the arrows move the
          highlight, Enter goes and Escape closes. It shows what it is given: the host searches and hands back the items,
          grouped and in order. The Indx console searches its datasets, sections and settings with Indx itself; this page
          filters by a plain substring.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Jump to</h2>
        <p className={styles.desc}>Press ⌘K, or the button. Chosen: {chosen ?? 'nothing yet'}</p>
        <Button variant="secondary" size="micro" iconLeft={<Search />} onClick={() => setOpen(true)}>Jump to (⌘K)</Button>
        <CommandPalette
          items={items}
          query={query}
          onQueryChange={setQuery}
          open={open}
          onOpenChange={setOpen}
          onChoose={(i) => setChosen(i.label)}
          placeholder="Jump to a dataset, a section or a page"
          aria-label="Jump to"
        />
      </div>
    </main>
  );
}
