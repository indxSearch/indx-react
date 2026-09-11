import { Link } from 'react-router-dom';
import { Database, Users } from '@indxsearch/pixl';
import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem,
  NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink,
} from '@indxsearch/systm';
import styles from './page.module.css';

const components = [
  { title: 'Breadcrumbs', description: 'Navigate between teams and datasets.', href: '/breadcrumbs' },
  { title: 'Table', description: 'Explore structured data in rows and columns.', href: '/table' },
  { title: 'SearchField', description: 'Find what you need with a focused search input.', href: '/search-field' },
  { title: 'Chart', description: 'Turn your data into a clear picture.', href: '/chart' },
];

function Example({ size = 'default', icons = true }: { size?: 'micro' | 'default'; icons?: boolean }) {
  return (
    <NavigationMenu size={size} aria-label={`${size} ${icons ? 'with icons' : 'text only'} example`}>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger icon={icons ? <Database /> : undefined}>Components</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className={styles.grid}>
              {components.map(item => (
                <li key={item.href}>
                  <NavigationMenuLink asChild>
                    <Link to={item.href}>
                      <span className={styles.linkTitle}>{item.title}</span>
                      <span className={styles.description}>{item.description}</span>
                    </Link>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger icon={icons ? <Users /> : undefined}>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <NavigationMenuLink asChild><Link to="/icons">Pixl icons</Link></NavigationMenuLink>
            <NavigationMenuLink asChild><Link to="/patterns">Patterns</Link></NavigationMenuLink>
            <NavigationMenuLink asChild><Link to="/spinners">Spinners</Link></NavigationMenuLink>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink variant="navigation" asChild><Link to="/">Overview</Link></NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger disabled>Coming soon</NavigationMenuTrigger>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default function NavigationMenuPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>NavigationMenu</h1>
      <p className={styles.intro}>Direct links and dropdown panels for site navigation. Hover or click a menu to explore.</p>
      <section className={styles.section}>
        <h2 className={styles.heading}>Default</h2>
        <Example />
      </section>
      <section className={styles.section}>
        <h2 className={styles.heading}>Micro</h2>
        <Example size="micro" />
      </section>
      <section className={styles.section}>
        <h2 className={styles.heading}>Without icons</h2>
        <Example icons={false} />
      </section>
      <section className={styles.section}>
        <h2 className={styles.heading}>Direct links and active page</h2>
        <NavigationMenu aria-label="Direct links example">
          <NavigationMenuList>
            <NavigationMenuItem><NavigationMenuLink variant="navigation" asChild><Link to="/">Overview</Link></NavigationMenuLink></NavigationMenuItem>
            <NavigationMenuItem><NavigationMenuLink variant="navigation" active asChild><Link to="/navigation-menu">NavigationMenu</Link></NavigationMenuLink></NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </section>
    </main>
  );
}
