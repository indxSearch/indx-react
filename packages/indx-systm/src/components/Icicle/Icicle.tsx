import styles from './Icicle.module.css';

export interface IcicleNode {
  label: string;
  /** Itself and everything under it. */
  value: number;
  children?: IcicleNode[];
}

export interface IcicleProps {
  root: IcicleNode;
  /** The height of a row in pixels; 30 by default. */
  rowHeight?: number;
  /** The rows drawn, the root's included; deeper nodes are left out. 6 by default. */
  maxDepth?: number;
  /** A block's text on hover; its label and value by default. */
  title?: (node: IcicleNode) => string;
  'aria-label'?: string;
  className?: string;
}

const depthOf = (n: IcicleNode): number => 1 + (n.children?.length ? Math.max(...n.children.map(depthOf)) : 0);

// 0 where every one stopped, 4 where nearly all went on to the children.
const tone = (n: IcicleNode) => {
  if (n.value <= 0 || !n.children?.length) return 0;
  const on = Math.min(1, Math.max(0, n.children.reduce((s, c) => s + c.value, 0) / n.value));
  return Math.round(on * 4);
};

/** A tree as nested blocks, read top to bottom: the root across the top, each node's children in
 *  the row under it, a block as wide as its share of the root. A block is toned by how much of it
 *  goes on to its children, and the space a parent leaves under it is the part that stopped there.
 *  Made for browsing paths, and for any tree whose values add up. The Blazor Icicle is its port. */
export function Icicle({ root, rowHeight = 30, maxDepth = 6, title, className = '', ...rest }: IcicleProps) {
  const cells: { node: IcicleNode; depth: number; x: number; w: number }[] = [];
  const place = (n: IcicleNode, depth: number, x: number, w: number) => {
    if (depth >= maxDepth || w <= 0) return;
    cells.push({ node: n, depth, x, w });
    let at = x;
    for (const child of n.children ?? []) {
      const cw = root.value <= 0 ? 0 : child.value / root.value;
      place(child, depth + 1, at, cw);
      at += cw;
    }
  };
  place(root, 0, 0, root.value > 0 ? 1 : 0);
  const rows = Math.min(maxDepth, depthOf(root));
  return (
    <div className={`${styles.icicle} ${className}`} role="img" aria-label={rest['aria-label']} style={{ height: rows * rowHeight }}>
      {cells.map((c, i) => (
        <div key={i} className={styles.cell} title={title?.(c.node) ?? `${c.node.label}: ${c.node.value.toLocaleString()}`}
             style={{ left: `${c.x * 100}%`, width: `${c.w * 100}%`, top: c.depth * rowHeight, height: rowHeight - 2 }}>
          <span className={`${styles.block} ${styles[`tone${tone(c.node)}`]}`}><span className={styles.label}>{c.node.label}</span></span>
        </div>
      ))}
    </div>
  );
}
