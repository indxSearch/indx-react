// TreeCanvas's board: the tree drawn on a view that pans and zooms by transform, as a design canvas
// does, with the grid layer following. The Blazor TreeCanvas has the same logic in
// TreeCanvas.razor.js; keep the two alike.
//
//   drag the board (mouse or pen)   pan; a press that moves under four pixels is a click
//   two-finger scroll, wheel        pan; Shift with the wheel pans sideways
//   pinch, Ctrl or Cmd with wheel   zoom at the pointer
//   arrows on the board             pan
//   + and -                         zoom at the middle; 0 fits the tree in view
//   the controls                    zoom in, zoom out, fit, and the zoom shown (click for 100%)

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const FIT_PAD = 24;     // room kept around the tree when it is fitted, and around a node brought into view
const STEP = 1.2;       // one press of zoom in or out
const KEY_PAN = 48;     // one arrow press, in screen pixels
const GRID_MIN = 8;     // the grid's tile on screen is kept at least this: zoomed out, its spacing doubles

export type ViewportAction = 'in' | 'out' | 'fit' | 'reset' | 'fullscreen';

export interface Viewport {
  setPan(pan: boolean): void;
  /** The first view of a tree: fitted when that leaves it readable; else at the given zoom (1 when
   *  none), from the left, with the first root a third of the way down. */
  initial(zoom?: number): void;
  command(action: ViewportAction): void;
  bringIntoView(el: HTMLElement): void;
  destroy(): void;
}

export function createViewport(canvas: HTMLElement, view: HTMLElement, grid: HTMLElement | null, pan: boolean): Viewport {
  const s = { x: 0, y: 0, z: 1, pan };
  let tile: number | undefined;
  const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const apply = () => {
    view.style.transform = `translate(${s.x}px, ${s.y}px) scale(${s.z})`;
    if (grid) {
      grid.style.setProperty('--tree-x', `${s.x}px`);
      grid.style.setProperty('--tree-y', `${s.y}px`);
      // The zoom, doubled until a tile is at least GRID_MIN on screen, so zoomed out the grid thins
      // as a design canvas's does rather than packing into a grey.
      tile ??= parseFloat(getComputedStyle(grid).getPropertyValue('--tree-tile')) || 12;
      let g = s.z;
      while (tile * g < GRID_MIN) g *= 2;
      grid.style.setProperty('--tree-zoom', `${g}`);
    }
    const label = canvas.querySelector<HTMLElement>('[data-tree-zoom-label]');
    if (label) label.textContent = `${Math.round(s.z * 100)}%`;
  };
  // The controls sit on the board's left edge; a fitted tree keeps clear of them (on a phone the
  // tree came under them).
  const sizes = () => {
    const sheet = view.firstElementChild as HTMLElement | null;
    const controls = canvas.querySelector<HTMLElement>('[data-tree-controls]');
    const cl = controls ? controls.offsetLeft + controls.offsetWidth : 0;
    return { cw: canvas.clientWidth, ch: canvas.clientHeight, sw: sheet?.offsetWidth ?? 0, sh: sheet?.offsetHeight ?? 0, cl };
  };
  const fitZoom = () => {
    const { cw, ch, sw, sh, cl } = sizes();
    if (!sw || !sh) return 1;
    return clamp(Math.min((cw - cl - FIT_PAD * 2) / sw, (ch - FIT_PAD * 2) / sh, 1));
  };
  const fitInto = (z: number) => {
    const { cw, ch, sw, sh, cl } = sizes();
    s.z = z;
    s.x = cl + (cw - cl - sw * z) / 2;
    s.y = (ch - sh * z) / 2;
    apply();
  };
  const zoomAt = (z: number, px: number, py: number) => {
    z = clamp(z);
    s.x = px - (px - s.x) * (z / s.z);
    s.y = py - (py - s.y) * (z / s.z);
    s.z = z;
    apply();
  };
  const command = (action: ViewportAction) => {
    const r = canvas.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    if (action === 'in') zoomAt(s.z * STEP, cx, cy);
    else if (action === 'out') zoomAt(s.z / STEP, cx, cy);
    else if (action === 'reset') zoomAt(1, cx, cy);
    else if (action === 'fullscreen') toggleFullscreen();
    else fitInto(fitZoom());
  };
  // The board fills the screen: the element the page marks data-tree-fullscreen (its panel goes
  // along), else the board. The view is fitted again once the size has changed, in and out.
  const toggleFullscreen = () => {
    if (document.fullscreenElement) { void document.exitFullscreen?.(); return; }
    const target = canvas.closest<HTMLElement>('[data-tree-fullscreen]') ?? canvas;
    const refit = () => {
      document.removeEventListener('fullscreenchange', refit);
      requestAnimationFrame(() => fitInto(fitZoom()));
      if (document.fullscreenElement) document.addEventListener('fullscreenchange', refit);
    };
    document.addEventListener('fullscreenchange', refit);
    target.requestFullscreen?.().catch(() => document.removeEventListener('fullscreenchange', refit));
  };

  let start: { px: number; py: number; x: number; y: number; id: number } | null = null;
  let moved = false;
  const down = (e: PointerEvent) => {
    moved = false;
    if (!s.pan || e.button !== 0 || e.pointerType === 'touch') return;
    if ((e.target as Element).closest('button, a, input, select, textarea, [data-tree-controls]')) return;
    start = { px: e.clientX, py: e.clientY, x: s.x, y: s.y, id: e.pointerId };
  };
  const move = (e: PointerEvent) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.px, dy = e.clientY - start.py;
    if (!moved) {
      if (Math.hypot(dx, dy) < 4) return;
      moved = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.dataset.panning = '';
    }
    s.x = start.x + dx;
    s.y = start.y + dy;
    apply();
  };
  const end = (e: PointerEvent) => {
    if (!start || e.pointerId !== start.id) return;
    start = null;
    delete canvas.dataset.panning;
  };
  // The click that ends a drag is not a choice: stopped before it reaches the pill's handler.
  const click = (e: MouseEvent) => {
    if (moved) { moved = false; e.stopPropagation(); e.preventDefault(); return; }
    const action = (e.target as Element).closest<HTMLElement>('[data-tree-action]');
    if (action && canvas.contains(action)) command(action.dataset.treeAction as ViewportAction);
  };
  const wheel = (e: WheelEvent) => {
    if (!s.pan) return;
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1;
    if (e.ctrlKey || e.metaKey) {
      // A pinch arrives as a wheel with Ctrl and small deltas; a mouse notch as about 100, held
            // to a quarter of that so one notch zooms by about 28%.
      const d = Math.max(-25, Math.min(25, e.deltaY * unit));
      const r = canvas.getBoundingClientRect();
      zoomAt(s.z * Math.exp(-d * 0.01), e.clientX - r.left, e.clientY - r.top);
    } else {
      const sideways = e.shiftKey && !e.deltaX;
      s.x -= (sideways ? e.deltaY : e.deltaX) * unit;
      s.y -= (sideways ? 0 : e.deltaY) * unit;
      apply();
    }
  };
  const key = (e: KeyboardEvent) => {
    if (!s.pan || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as Element).closest('input, select, textarea')) return;
    const r = canvas.getBoundingClientRect();
    if (e.key === '+' || e.key === '=') zoomAt(s.z * STEP, r.width / 2, r.height / 2);
    else if (e.key === '-' || e.key === '_') zoomAt(s.z / STEP, r.width / 2, r.height / 2);
    else if (e.key === '0') command('fit');
    else if (e.target === canvas && e.key.startsWith('Arrow')) {
      // On the board itself; on a node the arrows move between nodes.
      if (e.key === 'ArrowLeft') s.x += KEY_PAN;
      if (e.key === 'ArrowRight') s.x -= KEY_PAN;
      if (e.key === 'ArrowUp') s.y += KEY_PAN;
      if (e.key === 'ArrowDown') s.y -= KEY_PAN;
      apply();
    } else return;
    e.preventDefault();
  };
  // Tab moves focus to a node out of view, and the browser scrolls the canvas to it even though
  // it does not scroll: take the scroll as a pan, so the view and the focus agree.
  const scroll = () => {
    if (!canvas.scrollLeft && !canvas.scrollTop) return;
    s.x -= canvas.scrollLeft;
    s.y -= canvas.scrollTop;
    canvas.scrollLeft = 0;
    canvas.scrollTop = 0;
    apply();
  };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('click', click, true);
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.addEventListener('keydown', key);
  canvas.addEventListener('scroll', scroll);
  apply();

  return {
    setPan(pan) { s.pan = pan; },
    initial(zoom) {
      const { ch, sh, cl } = sizes();
      if (zoom == null) {
        const fit = fitZoom();
        if (fit >= 0.6) { fitInto(fit); return; }
      }
      s.z = clamp(zoom ?? 1);
      s.x = cl;
      const root = view.querySelector<HTMLElement>('[aria-level="1"]');
      const rootY = root ? ((root.parentElement?.offsetTop ?? 0) + root.offsetHeight / 2) * s.z : 0;
      s.y = Math.min(0, Math.max(ch - sh * s.z, ch / 3 - rootY));
      if (sh * s.z <= ch) s.y = (ch - sh * s.z) / 2;
      apply();
    },
    command,
    bringIntoView(el) {
      const c = canvas.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      if (r.left < c.left + FIT_PAD) s.x += c.left + FIT_PAD - r.left;
      else if (r.right > c.right - FIT_PAD) s.x -= r.right - (c.right - FIT_PAD);
      if (r.top < c.top + FIT_PAD) s.y += c.top + FIT_PAD - r.top;
      else if (r.bottom > c.bottom - FIT_PAD) s.y -= r.bottom - (c.bottom - FIT_PAD);
      apply();
    },
    destroy() {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointercancel', end);
      canvas.removeEventListener('click', click, true);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('keydown', key);
      canvas.removeEventListener('scroll', scroll);
    },
  };
}
