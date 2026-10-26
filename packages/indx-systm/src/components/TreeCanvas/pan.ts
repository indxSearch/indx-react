// Drag to pan: a mouse or pen held down on the canvas moves the tree under it, as a design canvas
// does; touch keeps the browser's own scrolling, and the wheel still scrolls. A press that moves
// less than four pixels is a click, so a pill is still chosen by clicking it. The buttons in the
// tree (open, close, "and N more") never start a drag. Returns the cleanup.
export function pan(canvas: HTMLElement): () => void {
  let start: { x: number; y: number; left: number; top: number; id: number } | null = null;
  let moved = false;
  const down = (e: PointerEvent) => {
    moved = false;
    if (e.button !== 0 || e.pointerType === 'touch') return;
    if ((e.target as Element).closest('button, a, input, select, textarea')) return;
    start = { x: e.clientX, y: e.clientY, left: canvas.scrollLeft, top: canvas.scrollTop, id: e.pointerId };
  };
  const move = (e: PointerEvent) => {
    if (!start || e.pointerId !== start.id) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!moved) {
      if (Math.hypot(dx, dy) < 4) return;
      moved = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.dataset.panning = '';
    }
    canvas.scrollLeft = start.left - dx;
    canvas.scrollTop = start.top - dy;
  };
  const end = (e: PointerEvent) => {
    if (!start || e.pointerId !== start.id) return;
    start = null;
    delete canvas.dataset.panning;
  };
  // The click that ends a drag is not a choice: stopped before it reaches the pill's handler.
  const click = (e: MouseEvent) => {
    if (!moved) return;
    moved = false;
    e.stopPropagation();
    e.preventDefault();
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('click', click, true);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', end);
    canvas.removeEventListener('pointercancel', end);
    canvas.removeEventListener('click', click, true);
  };
}
