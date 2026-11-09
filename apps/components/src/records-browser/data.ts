// The mock behind the Records browser variants: a furniture catalogue, its field configuration,
// and the one search every variant makes. Nothing talks to a server.
//
// What a real search can do decides what the mock does: filters only on Filterable fields (the
// index answers them), order only by a Sortable field, text only through the searched fields,
// and at most CAP records listed, since the engine returns the top N and has no offset yet
// (Notes/Jens/skip-for-browsing-2026-11-06.md). Only the page's records are read.

export type Role = 'word' | 'pattern' | 'filter' | 'facet' | 'sort';
export type FieldType = 'String' | 'Number' | 'Boolean' | 'Array';

export interface FieldDef {
  name: string;
  type: FieldType;
  roles: Role[];
}

export const FIELDS: FieldDef[] = [
  { name: 'name', type: 'String', roles: ['word', 'pattern'] },
  { name: 'description', type: 'String', roles: ['word', 'pattern'] },
  { name: 'brand', type: 'String', roles: ['word', 'pattern', 'filter', 'facet'] },
  { name: 'category', type: 'String', roles: ['filter', 'facet'] },
  { name: 'tags', type: 'Array', roles: ['filter', 'facet'] },
  { name: 'price', type: 'Number', roles: ['filter', 'sort'] },
  { name: 'in_stock', type: 'Boolean', roles: ['filter', 'facet'] },
  { name: 'updated', type: 'String', roles: ['sort'] },
  { name: 'sku', type: 'String', roles: [] },
  { name: 'image_url', type: 'String', roles: [] },
  // Thousands of values, as an actors field: a value filter has to search them, not list them.
  { name: 'designers', type: 'Array', roles: ['filter', 'facet'] },
];

export const isSearched = (f: FieldDef) => f.roles.includes('word') || f.roles.includes('pattern');
export const isFilterable = (f: FieldDef) => f.roles.includes('filter');
export const isSortable = (f: FieldDef) => f.roles.includes('sort');
export const fieldOf = (name: string) => FIELDS.find(f => f.name === name)!;

export type Value = string | number | boolean | string[] | undefined;
export interface Rec { key: number; cut: boolean; [field: string]: Value | number | boolean }

const CATS = ['Sofas', 'Chairs', 'Tables', 'Lamps', 'Rugs', 'Shelving'];
const BRANDS = ['Nordform', 'Hus & Hem', 'Lysverk', 'Tre', 'Oslo Living', 'Fjordlys'];
const NOUN: Record<string, string> = { Sofas: 'sofa', Chairs: 'chair', Tables: 'table', Lamps: 'lamp', Rugs: 'rug', Shelving: 'shelf' };
const ADJ = ['Oslo', 'Bergen', 'Fjord', 'Linn', 'Vik', 'Ask', 'Bris', 'Sol', 'Hav', 'Lun'];
const TAGS = ['oak', 'linen', 'outdoor', 'kids', 'sale', 'new', 'recycled', 'wool'];
const FIRST = ['Ada', 'Bo', 'Cato', 'Dina', 'Eli', 'Frida', 'Gard', 'Hedda', 'Iver', 'Juni', 'Kai', 'Liv', 'Mads', 'Nora', 'Odd', 'Pia',
  'Rune', 'Siri', 'Tor', 'Una', 'Vilde', 'Walter', 'Ylva', 'Åse', 'Arne', 'Berit', 'Conrad', 'Dag', 'Ebba', 'Finn', 'Grete', 'Hans',
  'Ingrid', 'Jon', 'Kari', 'Leif', 'Marit', 'Nils', 'Olga', 'Per', 'Ragna', 'Sverre', 'Tove', 'Ulf', 'Vera', 'Wenche', 'Yngve', 'Øystein'];
const LAST = ['Aas', 'Berg', 'Dahl', 'Eide', 'Foss', 'Gran', 'Haug', 'Holm', 'Iversen', 'Johansen', 'Krog', 'Lie', 'Moe', 'Nygaard',
  'Ødegaard', 'Pettersen', 'Rød', 'Strand', 'Sæther', 'Tangen', 'Ulvik', 'Vik', 'Wold', 'Aune', 'Bakke', 'Brekke', 'Dale', 'Engen',
  'Fjeld', 'Glad', 'Hagen', 'Hauge', 'Jensen', 'Karlsen', 'Lund', 'Myhre', 'Næss', 'Olsen', 'Paulsen', 'Ruud', 'Sand', 'Solberg',
  'Thoresen', 'Ueland', 'Vold', 'Wang', 'Aasen', 'Bjerke', 'Dybdahl', 'Ekeberg'];
/** 2,400 names; a few of them on many records, most on one or two. */
const designer = (n: number) => `${FIRST[n % FIRST.length]} ${LAST[Math.floor(n / FIRST.length) % LAST.length]}`;

/** Records in a dataset of this many; the mock holds them all, a real page reads 50. */
export const TOTAL = 2400;
export const CAP = 1000;
export const PAGE = 50;

/** Stable between renders: a few without a name or a brand, a few with text cut at indexing. */
export const RECORDS: Rec[] = Array.from({ length: TOTAL }, (_, i) => {
  const category = CATS[i % CATS.length];
  const brand = i % 41 === 9 ? undefined : BRANDS[(i * 7) % BRANDS.length];
  const cut = i % 97 === 3;
  return {
    key: 100000 + i * 3,
    cut,
    name: i % 53 === 7 ? undefined : `${ADJ[i % ADJ.length]} ${NOUN[category]}${i % 4 === 0 ? ' XL' : ''}`,
    description: i % 37 === 5 ? undefined
      : `A ${NOUN[category]} from ${brand ?? 'our own workshop'}, made to last.${cut ? ' Care, materials and dimensions in full. '.repeat(60) : ''}`,
    brand,
    category,
    tags: TAGS.filter((_, t) => (i + t * 3) % 5 === 0),
    price: 290 + ((i * 397) % 14000),
    in_stock: i % 6 !== 0,
    updated: `2026-${String(1 + (i % 10)).padStart(2, '0')}-${String(1 + (i % 27)).padStart(2, '0')}`,
    sku: i % 61 === 11 ? undefined : `SKU-${80000 + i}`,
    image_url: i % 29 === 4 ? undefined : `https://cdn.example.com/p/${100000 + i * 3}.jpg`,
    designers: i % 23 === 2 ? [] : [designer(i % 7), designer((i * 131 + 17) % 2400), ...(i % 3 === 0 ? [designer((i * 977 + 5) % 2400)] : [])]
      .filter((d, k, all) => all.indexOf(d) === k),
  };
});

export const missing = (v: Value | number | boolean | undefined) =>
  v === undefined || v === '' || (Array.isArray(v) && v.length === 0);

export const show = (v: Value | number | boolean | undefined): string =>
  missing(v) ? '' : Array.isArray(v) ? v.join(', ') : typeof v === 'number' ? nf.format(v) : String(v);

export const nf = new Intl.NumberFormat('en-US');

/** A filter: a value of a field, a range of a number field, or (the scan variant) present/missing. */
export type Condition =
  | { field: string; kind: 'value'; value: string }
  | { field: string; kind: 'range'; min?: number; max?: number }
  | { field: string; kind: 'missing' }
  | { field: string; kind: 'present' };

export function labelOf(c: Condition): string {
  switch (c.kind) {
    case 'value': return `${c.field}: ${c.value}`;
    case 'missing': return `${c.field} is missing`;
    case 'present': return `${c.field} has a value`;
    case 'range':
      return c.min !== undefined && c.max !== undefined ? `${c.field}: ${nf.format(c.min)} to ${nf.format(c.max)}`
        : c.min !== undefined ? `${c.field}: from ${nf.format(c.min)}` : `${c.field}: up to ${nf.format(c.max!)}`;
  }
}

const holds = (r: Rec, c: Condition) => {
  const v = r[c.field] as Value;
  switch (c.kind) {
    case 'value': return Array.isArray(v) ? v.includes(c.value) : String(v) === c.value;
    case 'range': return typeof v === 'number' && (c.min === undefined || v >= c.min) && (c.max === undefined || v <= c.max);
    case 'missing': return missing(v);
    case 'present': return !missing(v);
  }
};

export interface Ask {
  text?: string;
  conditions?: Condition[];
  sort?: string;
  ascending?: boolean;
  /** A test the index cannot answer, read from every record (the health variant's lists). */
  where?: (r: Rec) => boolean;
}

export interface Answer {
  /** How many match: the count the engine gives. */
  count: number;
  /** The records listed, at most CAP. */
  listed: Rec[];
  /** The values of each facetable field among what matches, with counts, most first. */
  facets: Record<string, [string, number][]>;
}

/** The one search: filters, then the text through the searched fields, then the order, then the cap. */
export function search(ask: Ask): Answer {
  const words = (ask.text ?? '').trim().toLowerCase().split(/\s+/).filter(Boolean);
  const searched = FIELDS.filter(isSearched).map(f => f.name);
  let rows = RECORDS.filter(r => (ask.conditions ?? []).every(c => holds(r, c)) && (!ask.where || ask.where(r)));
  if (words.length > 0)
    rows = rows.filter(r => words.every(w => searched.some(f => String(r[f] ?? '').toLowerCase().includes(w))));
  if (ask.sort) {
    const s = ask.sort, dir = ask.ascending === false ? -1 : 1;
    rows = [...rows].sort((a, b) => {
      const x = a[s], y = b[s];
      if (missing(x as Value)) return 1;
      if (missing(y as Value)) return -1;
      return (x! < y! ? -1 : x! > y! ? 1 : 0) * dir;
    });
  }
  const facets: Record<string, [string, number][]> = {};
  for (const f of FIELDS.filter(f => f.roles.includes('facet'))) {
    const counts = new Map<string, number>();
    for (const r of rows) {
      const v = r[f.name] as Value;
      for (const one of Array.isArray(v) ? v : missing(v) ? [] : [String(v)]) counts.set(one, (counts.get(one) ?? 0) + 1);
    }
    facets[f.name] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }
  return { count: rows.length, listed: rows.slice(0, CAP), facets };
}

/** A field across the whole dataset: how many records hold it, how many values it has, the commonest. */
export interface FieldStats { field: FieldDef; present: number; distinct: number; top: [string, number][] }

export function statsOf(field: FieldDef, rows: Rec[] = RECORDS): FieldStats {
  const counts = new Map<string, number>();
  let present = 0;
  for (const r of rows) {
    const v = r[field.name] as Value;
    if (missing(v)) continue;
    present++;
    for (const one of Array.isArray(v) ? v : [show(v)]) counts.set(one, (counts.get(one) ?? 0) + 1);
  }
  return { field, present, distinct: counts.size, top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5) };
}

export const pagesOf = (listed: number) => Math.max(1, Math.ceil(listed / PAGE));
