import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import styles from './TreeCanvas.module.css';

// A hierarchy as a horizontal tree: a pill a node with its name and a count, children fanned out
// to the right on soft connectors, the chosen node and the path to it lit, the rest collapsed
// until opened. For a catalogue's categories, "Shoes > Running > Trail", where the picture of
// the hierarchy is the point and the products are not in it. Nodes are real buttons placed
// over the connectors, so they focus and read; arrows move between them, right opens, left
// closes. A node with many children shows the first so many by count and a step to the rest.
// The list view is the same tree as nested rows, for a phone and for a screen reader.

export interface TreeNode {
  id: string;
  label: string;
  /** Shown in a chip beside the name: products in the category. */
  count?: number;
  children?: TreeNode[];
  /** Marks after the count: a boost, a note. 14px pixl icons, each with a title. */
  marks?: { icon: ReactNode; title: string }[];
  /** Drawn dim: hidden from search, empty. */
  muted?: boolean;
}

export interface TreeCanvasProps {
  roots: TreeNode[];
  /** The chosen node's id. */
  selected?: string;
  onSelect?: (id: string) => void;
  /** The ids open at first; the roots when left out. Opening is kept inside after that. */
  defaultExpanded?: string[];
  /** 'tree' draws the canvas; 'list' the same as nested rows. */
  view?: 'tree' | 'list';
  /** Children shown before the step to the rest; 50 by default. */
  maxChildren?: number;
  /** The count as shown; the number by default. */
  format?: (count: number) => string;
  /** A filter: only nodes it accepts stay, with the path down to each; an ancestor kept only as
   *  the way down is drawn muted, and a branch holding a match is opened. "Only boosted." */
  visible?: (node: TreeNode) => boolean;
  /** The canvas drawn at this scale, 1 by default: 0.5 shows twice the tree in the same room. */
  zoom?: number;
  /** When set or changed, the tree is opened to this many levels and closed below: 1 shows the
   *  roots, 2 their children. Left out, the opening is the component's own. */
  openDepth?: number;
  /** A name for assistive technology: "Categories of shop". */
  'aria-label'?: string;
  className?: string;
}

const ROW = 44;
const COLUMN_GAP = 56;
const PILL_PAD = 24;
const CHAR = 7;
const CHIP = 10;

interface Placed {
  node: TreeNode;
  depth: number;
  x: number;
  y: number;
  width: number;
  parent?: Placed;
  open: boolean;
  more: number;
}

// A guess at a pill's width before it is measured: the first frame only, the measure after.
function pillWidth(n: TreeNode, format?: (c: number) => string): number {
  const text = n.label.length * CHAR;
  const count = n.count != null ? (format ? format(n.count) : n.count.toLocaleString()).length * 6 + CHIP + 8 : 0;
  const marks = (n.marks?.length ?? 0) * 20;
  const toggle = n.children?.length ? 18 : 0;
  return PILL_PAD + text + count + marks + toggle;
}

export function TreeCanvas({
  roots,
  selected,
  onSelect,
  defaultExpanded,
  view = 'tree',
  maxChildren = 50,
  format,
  visible,
  zoom = 1,
  openDepth,
  'aria-label': ariaLabel,
  className = '',
}: TreeCanvasProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(defaultExpanded ?? roots.map((r) => r.id)));
  const [showAll, setShowAll] = useState<Set<string>>(() => new Set());
  // Opened to a depth on request: every node above it open, the rest closed.
  useEffect(() => {
    if (openDepth == null) return;
    const open = new Set<string>();
    const walk = (n: TreeNode, depth: number) => {
      if (depth < openDepth - 1 && n.children?.length) { open.add(n.id); n.children.forEach((c) => walk(c, depth + 1)); }
    };
    roots.forEach((r) => walk(r, 0));
    setExpanded(open);
  }, [openDepth, roots]);

  // The pills' real widths, read off the DOM after a render; the layout uses these over the guess.
  const [measured, setMeasured] = useState<Map<string, number>>(() => new Map());
  const sheetRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    let changed = false;
    const next = new Map(measured);
    sheet.querySelectorAll<HTMLElement>('[data-node]').forEach((el) => {
      const w = Math.ceil(el.getBoundingClientRect().width / zoom);
      const id = el.dataset.node!;
      if (w > 0 && next.get(id) !== w) { next.set(id, w); changed = true; }
    });
    if (changed) setMeasured(next);
  });
  const toggle = (id: string) =>
    setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  // The path to the chosen node, for lighting it; by id, walked once a render.
  const pathIds = useMemo(() => {
    const path = new Set<string>();
    const walk = (n: TreeNode, trail: string[]): boolean => {
      if (n.id === selected) { trail.forEach((t) => path.add(t)); path.add(n.id); return true; }
      return !!n.children?.some((c) => walk(c, [...trail, n.id]));
    };
    roots.forEach((r) => walk(r, []));
    return path;
  }, [roots, selected]);

  // The tree after the filter: a node stays when it matches or a descendant does; one that stays
  // only as the way down is muted. Without a filter the tree is as given.
  const { tree, opened } = useMemo(() => {
    if (!visible) return { tree: roots, opened: null as Set<string> | null };
    const opened = new Set<string>();
    const prune = (n: TreeNode): TreeNode | null => {
      const kids = n.children?.map(prune).filter((c): c is TreeNode => !!c) ?? [];
      const match = visible(n);
      if (!match && kids.length === 0) return null;
      if (kids.length) opened.add(n.id);
      return { ...n, children: kids.length ? kids : undefined, muted: n.muted || !match };
    };
    return { tree: roots.map(prune).filter((r): r is TreeNode => !!r), opened };
  }, [roots, visible]);
  const isOpen = (id: string) => expanded.has(id) || (opened?.has(id) ?? false);

  // The tidy layout: each open leaf takes a row, a parent sits at the middle of its children,
  // and a column is as wide as its widest pill. Only what is open is placed.
  const { placed, columns, height } = useMemo(() => {
    const placed: Placed[] = [];
    const widths: number[] = [];
    let row = 0;
    const place = (n: TreeNode, depth: number, parent?: Placed): Placed => {
      const open = !!n.children?.length && isOpen(n.id);
      const kids = open ? (showAll.has(n.id) ? n.children! : n.children!.slice(0, maxChildren)) : [];
      const more = open ? n.children!.length - kids.length : 0;
      const self: Placed = { node: n, depth, x: 0, y: 0, width: measured.get(n.id) ?? pillWidth(n, format), parent, open, more };
      widths[depth] = Math.max(widths[depth] ?? 0, self.width);
      placed.push(self);
      if (kids.length) {
        const placedKids = kids.map((k) => place(k, depth + 1, self));
        self.y = (placedKids[0].y + placedKids[placedKids.length - 1].y) / 2;
        if (more > 0) row += 1; // the "and N more" step takes a row under the children
      } else {
        self.y = row * ROW + ROW / 2;
        row += 1;
      }
      return self;
    };
    tree.forEach((r) => place(r, 0));
    const columns: number[] = [];
    let x = 0;
    widths.forEach((w, d) => { columns[d] = x; x += w + COLUMN_GAP; });
    placed.forEach((p) => { p.x = columns[p.depth]; });
    return { placed, columns, height: Math.max(row, 1) * ROW };
  }, [tree, opened, expanded, showAll, maxChildren, format, measured]);

  const width = columns.length ? columns[columns.length - 1] + Math.max(...placed.filter((p) => p.depth === columns.length - 1).map((p) => p.width)) : 0;
  const order = placed.map((p) => p.node.id);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, p: Placed) => {
    const i = order.indexOf(p.node.id);
    let to: string | undefined;
    if (e.key === 'ArrowDown') to = order[Math.min(order.length - 1, i + 1)];
    else if (e.key === 'ArrowUp') to = order[Math.max(0, i - 1)];
    else if (e.key === 'ArrowRight') { if (p.node.children?.length && !p.open) { toggle(p.node.id); e.preventDefault(); return; } to = placed.find((q) => q.parent === p)?.node.id; }
    else if (e.key === 'ArrowLeft') { if (p.open) { toggle(p.node.id); e.preventDefault(); return; } to = p.parent?.node.id; }
    else if (e.key === 'Home') to = order[0];
    else if (e.key === 'End') to = order[order.length - 1];
    if (!to) return;
    e.preventDefault();
    (e.currentTarget.parentElement?.querySelector(`[data-node="${CSS.escape(to)}"]`) as HTMLElement | null)?.focus();
  };

  if (view === 'list') {
    const List = ({ nodes, depth }: { nodes: TreeNode[]; depth: number }) => (
      <ul className={styles.list} role={depth === 0 ? 'tree' : 'group'} aria-label={depth === 0 ? ariaLabel : undefined}>
        {nodes.map((n) => {
          const open = isOpen(n.id);
          const isSelected = n.id === selected;
          return (
            <li key={n.id} role="treeitem" aria-expanded={n.children?.length ? open : undefined} aria-selected={isSelected}>
              <div className={`${styles.row} ${isSelected ? styles.rowSelected : ''} ${n.muted ? styles.muted : ''}`} style={{ paddingLeft: 8 + depth * 18 }}>
                {n.children?.length ? (
                  <button type="button" className={styles.disclosure} aria-label={open ? 'Close' : 'Open'} onClick={() => toggle(n.id)}>{open ? '−' : '+'}</button>
                ) : <span className={styles.disclosureSpace} />}
                <button type="button" className={styles.rowName} onClick={() => onSelect?.(n.id)}>{n.label}</button>
                {n.count != null && <span className={styles.chip}>{format ? format(n.count) : n.count.toLocaleString()}</span>}
                {n.marks?.map((m, i) => <span key={i} className={styles.mark} title={m.title}>{m.icon}</span>)}
              </div>
              {n.children?.length && open ? <List nodes={n.children} depth={depth + 1} /> : null}
            </li>
          );
        })}
      </ul>
    );
    return <div className={`${styles.listWrap} ${className}`}><List nodes={tree} depth={0} /></div>;
  }

  return (
    <div className={`${styles.canvas} ${className}`} role="tree" aria-label={ariaLabel}>
      {placed.length === 0 && <div className={styles.empty}>Nothing matches</div>}
      <div ref={sheetRef} className={styles.sheet} style={{ width, height, transform: zoom === 1 ? undefined : `scale(${zoom})`, marginRight: zoom === 1 ? undefined : -(width + 32) * (1 - zoom), marginBottom: zoom === 1 ? undefined : -(height + 32) * (1 - zoom) } as CSSProperties}>
        <svg className={styles.edges} width={width} height={height} aria-hidden="true">
          {placed.filter((p) => p.parent).map((p) => {
            const a = p.parent!;
            const x1 = a.x + a.width, y1 = a.y, x2 = p.x, y2 = p.y;
            const c = (x2 - x1) / 2;
            const lit = pathIds.has(p.node.id) && pathIds.has(a.node.id);
            return <path key={p.node.id} className={lit ? styles.edgeLit : styles.edge} d={`M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`} />;
          })}
        </svg>
        {placed.map((p) => {
          const n = p.node;
          const isSelected = n.id === selected;
          const onPath = pathIds.has(n.id) && !isSelected;
          return (
            <div key={n.id} className={styles.slot} style={{ left: p.x, top: p.y - 15 }}>
              <button
                type="button"
                role="treeitem"
                aria-selected={isSelected}
                aria-expanded={n.children?.length ? p.open : undefined}
                aria-level={p.depth + 1}
                data-node={n.id}
                className={`${styles.pill} ${isSelected ? styles.pillSelected : ''} ${onPath ? styles.pillPath : ''} ${n.muted ? styles.muted : ''}`}
                onClick={() => onSelect?.(n.id)}
                onKeyDown={(e) => onKey(e, p)}
              >
                <span className={styles.name}>{n.label}</span>
                {n.count != null && <span className={styles.chip}>{format ? format(n.count) : n.count.toLocaleString()}</span>}
                {n.marks?.map((m, i) => <span key={i} className={styles.mark} title={m.title}>{m.icon}</span>)}
                {n.children?.length ? (
                  <span
                    role="button"
                    tabIndex={-1}
                    className={styles.toggle}
                    aria-label={p.open ? 'Close' : 'Open'}
                    onClick={(e) => { e.stopPropagation(); toggle(n.id); }}
                  >
                    {p.open ? '−' : '+'}
                  </span>
                ) : null}
              </button>
              {p.more > 0 && (
                <button
                  type="button"
                  className={styles.more}
                  style={{ left: (columns[p.depth + 1] ?? p.x + p.width + COLUMN_GAP) - p.x, top: (row(placed, p) + 1) * ROW - (p.y - 15) }}
                  onClick={() => setShowAll((s) => new Set(s).add(n.id))}
                >
                  and {p.more} more
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The row the last shown child of a node sits on, for the "and N more" step under it.
function row(placed: Placed[], p: Placed): number {
  const kids = placed.filter((q) => q.parent === p);
  const last = kids[kids.length - 1];
  return last ? Math.round((last.y - ROW / 2) / ROW) : Math.round((p.y - ROW / 2) / ROW);
}
