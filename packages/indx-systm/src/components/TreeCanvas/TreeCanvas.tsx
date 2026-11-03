import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { Plus, Minus, Marquee, Maximize } from '@indxsearch/pixl';
import { Button } from '../Button/Button';
import { Tooltip } from '../Tooltip/Tooltip';
import { createViewport, type Viewport } from './viewport';
import styles from './TreeCanvas.module.css';

// A hierarchy as a horizontal tree: a pill a node with its name and a count, children fanned out
// to the right on soft connectors, the chosen node and the path to it lit, the rest collapsed
// until opened. For a catalogue's categories, "Shoes > Running > Trail", where the picture of
// the hierarchy is the point and the products are not in it. Nodes are focusable tree items
// placed over the connectors, with a ghost Button to open and close each, so the step has a
// hover of its own; arrows move between them, right opens, left closes, Enter chooses. A node with many children shows the first so many by count and a step to the rest.
// The list view is the same tree as nested rows, for a phone and for a screen reader.
// The tree lies on a board that pans and zooms as a design canvas does (viewport.ts): drag it,
// scroll it with two fingers, pinch or Ctrl/Cmd and the wheel to zoom at the pointer, the controls
// in its corner to zoom or fit; it opens fitted to the tree. A systm pattern behind it follows the
// view. Handles mark where the edges leave and arrive.

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
  /** The zoom the tree opens at, from the left; left out, it opens fitted in view when that leaves
   *  it readable, and at 100% from the left when not. */
  zoom?: number;
  /** When set or changed, the tree is opened to this many levels and closed below: 1 shows the
   *  roots, 2 their children. Left out, the opening is the component's own. */
  openDepth?: number;
  /** The board: drag to pan, two-finger scroll to pan, pinch or Ctrl/Cmd and the wheel to zoom, the
   *  arrows, + - and 0 on it, and the zoom controls in its corner; on by default. Off, the tree is a
   *  still picture at `zoom` or fitted, for an example inside a page that scrolls. */
  pan?: boolean;
  /** A control to fill the screen with the board: the nearest element the page marks
   *  `data-tree-fullscreen` (so a panel beside the board goes along), else the board; Esc leaves.
   *  On by default where the board pans. */
  fullscreen?: boolean;
  /** A systm pattern behind the tree, faint, moving with it. None by default. */
  pattern?: TreeCanvasPattern;
  /** A name for assistive technology: "Categories of shop". */
  'aria-label'?: string;
  className?: string;
}

/** The patterns `pattern` takes: the systm set in globals/patterns.css. */
export type TreeCanvasPattern =
  | 'grid-12' | 'grid-24' | 'grid-6' | 'checkerboard'
  | 'checkerboard-spaced-4' | 'checkerboard-spaced-6' | 'checkerboard-spaced-8' | 'checkerboard-spaced-10';

const ROW = 44;
const HANDLE = 5;
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
  zoom,
  openDepth,
  pan: pannable = true,
  fullscreen = true,
  pattern,
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
  const canvasRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const viewport = useRef<Viewport | null>(null);
  // The board is wired once per drawing of the canvas (it is drawn anew after the list view),
  // before the measuring below, so the first view can be set as soon as the layout is final.
  useLayoutEffect(() => {
    const canvas = canvasRef.current, viewEl = viewRef.current;
    if (!canvas || !viewEl) return;
    const vp = createViewport(canvas, viewEl, gridRef.current, pannable);
    viewport.current = vp;
    return () => { vp.destroy(); viewport.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, pattern]);
  useEffect(() => { viewport.current?.setPan(pannable); }, [pannable]);
  // A new tree, or the board drawn again, opens at its first view; opening and closing nodes, a
  // new selection or a filter keep the view where the reader left it.
  const viewPending = useRef(true);
  useLayoutEffect(() => { viewPending.current = true; }, [roots, view]);
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    let changed = false;
    const next = new Map(measured);
    sheet.querySelectorAll<HTMLElement>('[data-node]').forEach((el) => {
      const w = el.offsetWidth;
      const id = el.dataset.node!;
      if (w > 0 && next.get(id) !== w) { next.set(id, w); changed = true; }
    });
    if (changed) setMeasured(next);
    else if (viewPending.current && viewport.current) {
      // The pills are measured and the layout is final: now the first view can be fitted.
      viewPending.current = false;
      viewport.current.initial(zoom);
    }
  });
  const toggle = (id: string) =>
    setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  // Choosing a node opens it as well, when it has children and is closed: the one click a
  // reader makes should show what is under it. The step closes it again.
  const choose = (n: TreeNode) => {
    onSelect?.(n.id);
    if (n.children?.length && !isOpen(n.id)) setExpanded((s) => new Set(s).add(n.id));
  };

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

  const onKey = (e: KeyboardEvent<HTMLElement>, p: Placed) => {
    const i = order.indexOf(p.node.id);
    let to: string | undefined;
    if (e.key === 'ArrowDown') to = order[Math.min(order.length - 1, i + 1)];
    else if (e.key === 'ArrowUp') to = order[Math.max(0, i - 1)];
    else if (e.key === 'ArrowRight') { if (p.node.children?.length && !p.open) { toggle(p.node.id); e.preventDefault(); return; } to = placed.find((q) => q.parent === p)?.node.id; }
    else if (e.key === 'ArrowLeft') { if (p.open) { toggle(p.node.id); e.preventDefault(); return; } to = p.parent?.node.id; }
    else if (e.key === 'Enter' || e.key === ' ') { choose(p.node); e.preventDefault(); return; }
    else if (e.key === 'Home') to = order[0];
    else if (e.key === 'End') to = order[order.length - 1];
    if (!to) return;
    e.preventDefault();
    // Focus without the browser's own scroll, and pan just enough to bring the node into view.
    const el = sheetRef.current?.querySelector<HTMLElement>(`[data-node="${CSS.escape(to)}"]`);
    if (!el) return;
    el.focus({ preventScroll: true });
    viewport.current?.bringIntoView(el);
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
                  <span className={styles.disclosure}>
                    <Button variant="secondary" size="micro" aria-label={open ? 'Close' : 'Open'} iconLeft={open ? <Minus /> : <Plus />} onClick={() => toggle(n.id)} />
                  </span>
                ) : <span className={styles.disclosureSpace} />}
                <button type="button" className={styles.rowName} onClick={() => choose(n)}>{n.label}</button>
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
    // The board: the grid layer behind, the view (moved and scaled by viewport.ts, never by React,
    // so a render keeps the pan and zoom) holding the sheet, and the controls over it.
    <div
      ref={canvasRef}
      className={`${styles.canvas} ${pannable ? styles.pannable : ''} ${className}`}
      role="tree"
      aria-label={ariaLabel}
      tabIndex={pannable ? 0 : undefined}
    >
      {pattern && (
        <div
          ref={gridRef}
          className={styles.grid}
          aria-hidden="true"
          style={{ '--tree-pattern': `var(--pattern-${pattern}-light)`, '--tree-pattern-dark': `var(--pattern-${pattern}-dark)`, '--tree-tile': `${tileOf(pattern)}px` } as CSSProperties}
        />
      )}
      {placed.length === 0 && <div className={styles.empty}>Nothing matches</div>}
      <div ref={viewRef} className={styles.view}>
      <div ref={sheetRef} className={styles.sheet} style={{ width, height }}>
        <svg className={styles.edges} width={width} height={height} aria-hidden="true">
          {placed.filter((p) => p.parent).map((p) => {
            const a = p.parent!;
            const x1 = a.x + a.width, y1 = a.y, x2 = p.x, y2 = p.y;
            const c = (x2 - x1) / 2;
            const lit = pathIds.has(p.node.id) && pathIds.has(a.node.id);
            // A dashed line to a node kept only as the way down to a match.
            return <path key={p.node.id} className={`${styles.edge} ${lit ? styles.edgeLit : ''} ${p.node.muted ? styles.edgeMuted : ''}`} d={`M ${x1} ${y1} C ${x1 + c} ${y1}, ${x2 - c} ${y2}, ${x2} ${y2}`} />;
          })}
        </svg>
        {placed.map((p) => {
          const n = p.node;
          const isSelected = n.id === selected;
          const onPath = pathIds.has(n.id) && !isSelected;
          return (
            <div key={n.id} className={styles.slot} style={{ left: p.x, top: p.y - 15 }}>
              <div
                role="treeitem"
                tabIndex={0}
                aria-selected={isSelected}
                aria-expanded={n.children?.length ? p.open : undefined}
                aria-level={p.depth + 1}
                data-node={n.id}
                className={`${styles.pill} ${isSelected ? styles.pillSelected : ''} ${onPath ? styles.pillPath : ''} ${n.muted ? styles.muted : ''}`}
                onClick={() => choose(n)}
                onKeyDown={(e) => onKey(e, p)}
              >
                <span className={styles.name}>{n.label}</span>
                {n.count != null && <span className={styles.chip}>{format ? format(n.count) : n.count.toLocaleString()}</span>}
                {n.marks?.map((m, i) => <span key={i} className={styles.mark} title={m.title}>{m.icon}</span>)}
                {n.children?.length ? (
                  <span className={styles.toggle} onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="micro" tabIndex={-1} aria-label={p.open ? 'Close' : 'Open'} iconLeft={p.open ? <Minus /> : <Plus />} onClick={() => toggle(n.id)} />
                  </span>
                ) : null}
              </div>
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
        {/* The handles: a square where an edge leaves a node and where it arrives, over the
            pills' borders, lit along the path. */}
        <svg className={styles.handles} width={width} height={height} aria-hidden="true">
          {placed.map((p) => {
            const lit = pathIds.has(p.node.id);
            return (
              <g key={p.node.id}>
                {p.parent && <rect className={`${styles.handle} ${lit ? styles.handleLit : ''}`} x={p.x - HANDLE / 2} y={p.y - HANDLE / 2} width={HANDLE} height={HANDLE} />}
                {p.open && <rect className={`${styles.handle} ${lit && p.node.id !== selected ? styles.handleLit : ''}`} x={p.x + p.width - HANDLE / 2} y={p.y - HANDLE / 2} width={HANDLE} height={HANDLE} />}
              </g>
            );
          })}
        </svg>
      </div>
      </div>
      {pannable && (
        <div className={styles.controls} role="toolbar" aria-label="Zoom" data-tree-controls="">
          {/* Each named in a systm Tooltip to its right, the board being to the right of them. */}
          <Tooltip content="Zoom in (+)" position="right"><Button variant="ghost" size="micro" iconLeft={<Plus />} aria-label="Zoom in" data-tree-action="in" /></Tooltip>
          <Tooltip content="Zoom out (-)" position="right"><Button variant="ghost" size="micro" iconLeft={<Minus />} aria-label="Zoom out" data-tree-action="out" /></Tooltip>
          <Tooltip content="Fit in view (0)" position="right"><Button variant="ghost" size="micro" iconLeft={<Marquee />} aria-label="Fit the tree in view" data-tree-action="fit" /></Tooltip>
          {fullscreen && <Tooltip content="Full screen (Esc to leave)" position="right"><Button variant="ghost" size="micro" iconLeft={<Maximize />} aria-label="Full screen" data-tree-action="fullscreen" /></Tooltip>}
          <Tooltip content="Zoom to 100%" position="right">
            <Button variant="ghost" size="micro" aria-label="Zoom to 100%" data-tree-action="reset">
              <span className={styles.zoomLabel} data-tree-zoom-label="" />
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

// A pattern's tile, which the grid scales with the zoom: the number in its name, 2 for the checkerboard.
function tileOf(pattern: TreeCanvasPattern): number {
  const n = Number(pattern.slice(pattern.lastIndexOf('-') + 1));
  return Number.isFinite(n) ? n : 2;
}

// The row the last shown child of a node sits on, for the "and N more" step under it.
function row(placed: Placed[], p: Placed): number {
  const kids = placed.filter((q) => q.parent === p);
  const last = kids[kids.length - 1];
  return last ? Math.round((last.y - ROW / 2) / ROW) : Math.round((p.y - ROW / 2) / ROW);
}
