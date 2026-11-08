// Resizable columns for Table (Nov 2026). Each header cell gets a handle at its right edge that the
// reader drags, or moves with the arrow keys once focused; a double click (or Delete) gives the
// column its own width back. Every column has a fixed width from the start, so what a page shows
// never moves the columns: a search that brings longer values cuts them instead. The widths are
// kept per viewer under storageKey. The Blazor Table runs the same routine (Table.razor.js).
//
// A column is named by its header's data-column, or its place; its first width is the header's
// data-width (px), or what it measured before the widths were fixed, or 160 for one that came later.
// The column whose header says data-fill (else the last) takes what the frame has left.
// Headers that change (a column shown, hidden or renamed) are picked up as they change.

const MIN = 48;            // the narrowest a column goes, px
const STEP = 16, BIG = 64; // px per arrow, per arrow with Shift
const LATE = 160;          // a column that arrives after the first layout, with no data-width

export interface ColumnResizeClasses {
  table: string;
  handle: string;
}

export function enableColumnResize(table: HTMLTableElement, classes: ColumnResizeClasses, storageKey?: string): () => void {
  const key = storageKey ? `indx-table-columns:${storageKey}` : null;
  let saved: Record<string, number> = {};
  if (key) { try { saved = JSON.parse(localStorage.getItem(key) ?? '{}') ?? {}; } catch { saved = {}; } }
  const defaults = new Map<string, number>();

  const headers = (): HTMLTableCellElement[] => {
    const rows = table.tHead?.rows;
    return rows && rows.length > 0 ? Array.from(rows[rows.length - 1].cells) : [];
  };
  const idOf = (th: HTMLTableCellElement, i: number) => th.dataset.column ?? String(i);
  const nameOf = (th: HTMLTableCellElement) => (th.dataset.column ?? th.textContent ?? '').trim() || 'column';

  // Measured while the layout is still the browser's own, before any width is fixed.
  headers().forEach((th, i) => {
    if (!(Number(th.dataset.width) > 0)) defaults.set(idOf(th, i), Math.max(MIN, Math.round(th.getBoundingClientRect().width)));
  });
  table.classList.add(classes.table);

  // The reader's width, else the page's (data-width, read each time: the page may change it),
  // else what the column measured at the start.
  const widthOf = (id: string, th: HTMLTableCellElement) => {
    if (saved[id] > 0) return Math.max(MIN, saved[id]);
    const asked = Number(th.dataset.width);
    if (asked > 0) return asked;
    if (!defaults.has(id)) defaults.set(id, LATE);
    return defaults.get(id)!;
  };

  const save = () => { if (key) { try { localStorage.setItem(key, JSON.stringify(saved)); } catch { /* refused */ } } };

  // Every width set at once but the filling column's (the header that says data-fill, else the
  // last): that one takes what the frame has left, never narrower than its own width, so the table is
  // as wide as its frame, or as wide as the widths add up to and scrolls. It has no handle: its width
  // is what the others leave.
  const apply = () => {
    const cells = headers();
    const marked = cells.findIndex(th => th.dataset.fill !== undefined);
    const fill = marked >= 0 ? marked : cells.length - 1;
    let total = 0;
    cells.forEach((th, i) => {
      const id = idOf(th, i);
      if (i === 0) th.querySelector(`:scope > .${classes.handle}[data-lead]`)?.remove(); // was second, before a column went
      const w = widthOf(id, th);
      total += w;
      const own = th.querySelector<HTMLElement>(`:scope > .${classes.handle}:not([data-lead])`);
      if (i === fill) { th.style.width = ''; own?.remove(); th.nextElementSibling?.querySelector(`:scope > .${classes.handle}[data-lead]`)?.remove(); return; }
      th.style.width = `${w}px`;
      const handle = own ?? addHandle(th);
      // The next header's left edge grabs this column too, so the border is a target from both sides.
      const next = th.nextElementSibling as HTMLTableCellElement | null;
      if (next) (next.querySelector<HTMLElement>(`:scope > .${classes.handle}[data-lead]`) ?? addLead(next)).dataset.column = id;
      handle.dataset.column = id;
      handle.setAttribute('aria-label', `Resize ${nameOf(th)}`);
      handle.setAttribute('aria-valuenow', String(Math.round(w)));
    });
    table.style.minWidth = `${total}px`;
  };

  const set = (id: string, w: number) => { saved[id] = Math.max(MIN, Math.round(w)); apply(); };
  const reset = (id: string) => { delete saved[id]; apply(); save(); };
  // A lead sits in the next header and sizes the one before it.
  const thOf = (handle: HTMLElement) => (handle.hasAttribute('data-lead') ? handle.parentElement!.previousElementSibling : handle.parentElement) as HTMLTableCellElement;
  const mainOf = (handle: HTMLElement) => handle.hasAttribute('data-lead') ? thOf(handle).querySelector<HTMLElement>(`:scope > .${classes.handle}:not([data-lead])`) ?? handle : handle;

  function addHandle(th: HTMLTableCellElement) {
    const handle = document.createElement('span');
    handle.className = classes.handle;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', 'vertical');
    handle.setAttribute('aria-valuemin', String(MIN));
    handle.tabIndex = 0;
    handle.addEventListener('pointerdown', onDown);
    handle.addEventListener('keydown', onKey);
    handle.addEventListener('dblclick', () => reset(handle.dataset.column!));
    // The header may be a menu's trigger or sort the column: a handle's click is the handle's.
    handle.addEventListener('click', e => e.stopPropagation());
    th.appendChild(handle);
    return handle;
  }

  // The other half of the target: not a stop of its own for the keyboard, the handle is that.
  function addLead(th: HTMLTableCellElement) {
    const lead = document.createElement('span');
    lead.className = classes.handle;
    lead.setAttribute('data-lead', '');
    lead.setAttribute('aria-hidden', 'true');
    lead.addEventListener('pointerdown', onDown);
    lead.addEventListener('pointerenter', () => mainOf(lead).setAttribute('data-hot', ''));
    lead.addEventListener('pointerleave', () => mainOf(lead).removeAttribute('data-hot'));
    lead.addEventListener('dblclick', () => reset(lead.dataset.column!));
    lead.addEventListener('click', e => e.stopPropagation());
    th.appendChild(lead);
    return lead;
  }

  function onDown(e: PointerEvent) {
    if (e.button !== 0) return;
    const handle = e.currentTarget as HTMLElement;
    e.preventDefault();
    e.stopPropagation();
    handle.setPointerCapture(e.pointerId);
    mainOf(handle).setAttribute('data-dragging', '');
    table.setAttribute('data-resizing', '');
    const id = handle.dataset.column!;
    const startX = e.clientX, startW = thOf(handle).getBoundingClientRect().width;
    const onMove = (m: PointerEvent) => set(id, startW + m.clientX - startX);
    const onUp = () => {
      mainOf(handle).removeAttribute('data-dragging');
      table.removeAttribute('data-resizing');
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', onUp);
      handle.removeEventListener('pointercancel', onUp);
      save();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', onUp);
    handle.addEventListener('pointercancel', onUp);
  }

  function onKey(e: KeyboardEvent) {
    const handle = e.currentTarget as HTMLElement;
    const id = handle.dataset.column!;
    const now = thOf(handle).getBoundingClientRect().width;
    const step = e.shiftKey ? BIG : STEP;
    if (e.key === 'ArrowRight') set(id, now + step);
    else if (e.key === 'ArrowLeft') set(id, now - step);
    else if (e.key === 'Home') set(id, MIN);
    else if (e.key === 'Delete' || e.key === 'Backspace') { reset(id); e.preventDefault(); return; }
    else return;
    e.preventDefault();
    save();
  }

  apply();

  // A header shown, hidden, renamed or replaced: apply again. Our own writes (widths, handles)
  // are left out, or the observer would answer itself.
  const inHeader = (n: Node) => n === table || (n instanceof Element && n.closest('thead') !== null);
  const observer = new MutationObserver(records => {
    const theirs = records.some(r => inHeader(r.target) && (
      r.type === 'childList'
        ? [...Array.from(r.addedNodes), ...Array.from(r.removedNodes)].some(n => !(n instanceof HTMLElement && n.classList.contains(classes.handle)))
        : r.attributeName !== 'style' && !(r.target instanceof HTMLElement && r.target.classList.contains(classes.handle))));
    if (theirs) apply();
  });
  observer.observe(table, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-column', 'data-width', 'data-fill'] });

  return () => {
    observer.disconnect();
    table.classList.remove(classes.table);
    table.style.minWidth = '';
    headers().forEach(th => { th.style.width = ''; th.querySelectorAll(`:scope > .${classes.handle}`).forEach(h => h.remove()); });
  };
}
