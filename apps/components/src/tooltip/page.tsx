import { Button, Tooltip } from '@indxsearch/systm';
import { Search, Options_menu, Filter, Plus, ArrowRight, Delete, Download, ArrowUp } from '@indxsearch/pixl';
import styles from './page.module.css';

export default function TooltipPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Tooltip</h1>
        <p className={styles.desc}>
          Lightweight label that appears on hover or focus. Designed for icon-only buttons and
          any control where a visible label would be too heavy. Built on Radix UI — viewport
          collision detection is automatic, so tooltips near screen edges flip rather than clip.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Icon-only buttons</h2>
        <p className={styles.subdesc}>The primary use case — wrapping buttons that carry no visible label.</p>
        <div className={styles.row}>
          <Tooltip content="Search">
            <Button size="micro" variant="secondary" iconLeft={<Search />} aria-label="Search" />
          </Tooltip>
          <Tooltip content="Filter">
            <Button size="micro" variant="secondary" iconLeft={<Filter />} aria-label="Filter" />
          </Tooltip>
          <Tooltip content="Options">
            <Button size="micro" variant="ghost" iconLeft={<Options_menu />} aria-label="Options" />
          </Tooltip>
          <Tooltip content="Add new">
            <Button size="micro" variant="primary" iconLeft={<Plus />} aria-label="Add new" />
          </Tooltip>
          <Tooltip content="Delete">
            <Button size="micro" variant="ghost" iconLeft={<Delete />} aria-label="Delete" />
          </Tooltip>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Default size buttons</h2>
        <div className={styles.row}>
          <Tooltip content="Download dataset">
            <Button size="default" variant="secondary" iconLeft={<Download />} aria-label="Download dataset" />
          </Tooltip>
          <Tooltip content="Upload file">
            <Button size="default" variant="secondary" iconLeft={<ArrowUp />} aria-label="Upload file" />
          </Tooltip>
          <Tooltip content="Continue to next step">
            <Button size="default" variant="primary" iconRight={<ArrowRight />} aria-label="Continue to next step" />
          </Tooltip>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Positions</h2>
        <p className={styles.subdesc}>Four directions — all default to top. Viewport collision detection is automatic — if the preferred side would clip, Radix flips it. This works in production but can't be demonstrated in a centred story layout.</p>
        <div className={styles.positionGrid}>
          <div className={styles.positionCell}>
            <Tooltip content="Tooltip top" position="top">
              <Button size="micro" variant="secondary">Top</Button>
            </Tooltip>
          </div>
          <div className={styles.positionCell}>
            <Tooltip content="Tooltip bottom" position="bottom">
              <Button size="micro" variant="secondary">Bottom</Button>
            </Tooltip>
          </div>
          <div className={styles.positionCell}>
            <Tooltip content="Tooltip left" position="left">
              <Button size="micro" variant="secondary">Left</Button>
            </Tooltip>
          </div>
          <div className={styles.positionCell}>
            <Tooltip content="Tooltip right" position="right">
              <Button size="micro" variant="secondary">Right</Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>On text buttons</h2>
        <p className={styles.subdesc}>Works on any element — useful for truncated labels or supplementary context.</p>
        <div className={styles.row}>
          <Tooltip content="Creates a new empty dataset" position="top">
            <Button size="default" variant="secondary">New dataset</Button>
          </Tooltip>
          <Tooltip content="Permanently removes this index" position="top">
            <Button size="default" variant="ghost">Remove</Button>
          </Tooltip>
          <Tooltip content="Re-indexes all documents with current field config" position="bottom">
            <Button size="micro" variant="secondary">Re-index</Button>
          </Tooltip>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Toolbar pattern</h2>
        <p className={styles.subdesc}>A tight row of icon buttons — the scenario tooltips are optimised for.</p>
        <div className={styles.toolbar}>
          <Tooltip content="Search documents">
            <Button size="micro" variant="ghost" iconLeft={<Search />} aria-label="Search documents" />
          </Tooltip>
          <Tooltip content="Filter results">
            <Button size="micro" variant="ghost" iconLeft={<Filter />} aria-label="Filter results" />
          </Tooltip>
          <Tooltip content="Download">
            <Button size="micro" variant="ghost" iconLeft={<Download />} aria-label="Download" />
          </Tooltip>
          <Tooltip content="Upload">
            <Button size="micro" variant="ghost" iconLeft={<ArrowUp />} aria-label="Upload" />
          </Tooltip>
          <div className={styles.toolbarDivider} />
          <Tooltip content="Options">
            <Button size="micro" variant="ghost" iconLeft={<Options_menu />} aria-label="Options" />
          </Tooltip>
          <Tooltip content="Delete dataset" position="top">
            <Button size="micro" variant="ghost" iconLeft={<Delete />} aria-label="Delete dataset" />
          </Tooltip>
        </div>
      </div>
    </main>
  );
}
