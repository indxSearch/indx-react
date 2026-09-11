import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumbs, type BreadcrumbItem } from '@indxsearch/systm';
import { Database, Users } from '@indxsearch/pixl';
import styles from './page.module.css';

const teams = ['Acme', 'Design', 'Engineering'].map(label => ({ label, value: label }));
const datasets = ['Products', 'Customers', 'Orders'].map(label => ({ label, value: label }));

export default function BreadcrumbsPage() {
  const [team, setTeam] = useState('Acme');
  const [dataset, setDataset] = useState('Products');
  const [visited, setVisited] = useState('');
  const pageLink = (label: string): Pick<BreadcrumbItem, 'href' | 'onClick'> => ({
    href: `#${encodeURIComponent(label)}`,
    onClick: event => { event.preventDefault(); setVisited(label); },
  });
  const items: BreadcrumbItem[] = [
    { id: 'team', label: team, icon: <Users />, ...pageLink(`Team: ${team}`),
      switcher: { label: 'Switch team', value: team, options: teams, onValueChange: setTeam } },
    { id: 'dataset', label: dataset, icon: <Database />, ...pageLink(`Dataset: ${dataset}`),
      switcher: { label: 'Switch dataset', value: dataset, options: datasets, onValueChange: setDataset } },
  ];

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Breadcrumbs</h1>
        <p className={styles.desc}>Open a page from its label, or switch context using its dropdown.</p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Team → Dataset</h2>
        <Breadcrumbs items={items} />
        <p className={styles.active} role="status">{visited ? `Page clicked: ${visited}` : 'Click a label to preview navigation. Dropdowns use mock options.'}</p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Without icons</h2>
        <Breadcrumbs items={items.map(item => ({ ...item, icon: undefined }))} />
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Sizes</h2>
        <div className={styles.stack}>
          <Breadcrumbs items={items} size="micro" aria-label="Micro breadcrumbs" />
          <Breadcrumbs items={items} size="default" aria-label="Default breadcrumbs" />
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>With a current page</h2>
        <Breadcrumbs items={[...items, { id: 'settings', label: 'Settings' }]} />
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Disabled switcher</h2>
        <Breadcrumbs items={items.map(item => ({ ...item, switcher: { ...item.switcher!, disabled: true } }))} />
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Custom separator and router links</h2>
        <Breadcrumbs separator="/"
          items={[{ id: 'home', label: 'Components', href: '/' }, { id: 'current', label: 'Breadcrumbs' }]}
          renderLink={(_item, { href, ...props }) => <Link to={href!} {...props} />} />
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Usage</h2>
        <p className={styles.desc}>Provide each step’s label and href, with an optional controlled switcher.
          Pass an icon on any step to display it before the label.
          Use onClick to integrate a client-side router. Steps without an href render as text.
          The component leaves team and dataset relationships to the consuming application.</p>
      </div>
    </main>
  );
}
