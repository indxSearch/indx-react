import { useMemo, useState } from 'react';
import { Button, Chip, InputField, Select, Table, TableHeader, TableRow, Tabs } from '@indxsearch/systm';
import styles from './records.module.css';

// The Records section's Browse view, read-only: the records as stored, paged by document key, and
// one record laid out against the field configuration. It reads the store, not the engine, so a
// sleeping dataset can be browsed without waking it. Mock data; nothing talks to a server.

type Role = 'search' | 'filter' | 'facet' | 'sort';
interface FieldDef { name: string; roles: Role[] }
const FIELDS: FieldDef[] = [
  { name: 'name', roles: ['search'] },
  { name: 'description', roles: ['search'] },
  { name: 'brand', roles: ['search', 'filter', 'facet'] },
  { name: 'category', roles: ['filter', 'facet'] },
  { name: 'price', roles: ['filter', 'sort'] },
  { name: 'sku', roles: [] },
  { name: 'image_url', roles: [] },
];
const SEARCHABLE = FIELDS.filter(f => f.roles.includes('search')).map(f => f.name);
const FILTERABLE = FIELDS.filter(f => f.roles.includes('filter') && f.name !== 'price').map(f => f.name);

type Rec = { key: string; cut?: boolean; [field: string]: string | number | boolean | undefined };

const CATS = ['Sofas', 'Chairs', 'Tables', 'Lamps', 'Rugs'];
const BRANDS = ['Nordform', 'Hus & Hem', 'Lysverk', 'Tre'];
const NOUN: Record<string, string> = { Sofas: 'sofa', Chairs: 'chair', Tables: 'table', Lamps: 'lamp', Rugs: 'rug' };
const ADJ = ['Oslo', 'Bergen', 'Fjord', 'Linn', 'Vik', 'Ask', 'Bris', 'Sol'];

/** 48 records, stable between renders: a few with their text cut at indexing, a few without a name. */
const RECORDS: Rec[] = Array.from({ length: 48 }, (_, i) => {
  const category = CATS[i % CATS.length];
  const brand = BRANDS[(i * 3) % BRANDS.length];
  const name = i % 13 === 7 ? undefined : `${ADJ[i % ADJ.length]} ${NOUN[category]}`;
  return {
    key: `P-${String(1001 + i * 7).padStart(5, '0')}`,
    name,
    description: i % 17 === 5 ? undefined : `A ${NOUN[category]} from ${brand}, made to last.${i % 11 === 3 ? ' ' + 'Care, materials and dimensions in full. '.repeat(40) : ''}`,
    brand,
    category,
    price: 490 + ((i * 397) % 9000),
    sku: `SKU-${80000 + i}`,
    image_url: `https://cdn.example.com/p/${1001 + i * 7}.jpg`,
    cut: i % 11 === 3,
  };
});

const missingSearchable = (r: Rec) => SEARCHABLE.some(f => r[f] === undefined || r[f] === '');
const PAGE = 10;
const nf = new Intl.NumberFormat('en-US');

function RecordDetail({ rec, onClose }: { rec: Rec; onClose: () => void }) {
  const [view, setView] = useState('fields');
  const roleLabel: Record<Role, string> = { search: 'Search', filter: 'Filter', facet: 'Facet', sort: 'Sort' };
  const json = Object.fromEntries(Object.entries(rec).filter(([k, v]) => k !== 'cut' && v !== undefined));
  const groups = [
    { title: 'Searched', fields: FIELDS.filter(f => f.roles.includes('search')) },
    { title: 'Filter, facet and sort', fields: FIELDS.filter(f => !f.roles.includes('search') && f.roles.length > 0) },
    { title: 'Stored only', fields: FIELDS.filter(f => f.roles.length === 0) },
  ];
  return (
    <section className={styles.detail} aria-label={`Record ${rec.key}`}>
      <div className={styles.detailHead}>
        <span className={styles.detailKey}>{rec.key}</span>
        <Chip>Read-only</Chip>
        <span className={styles.spacer} />
        <Button variant="ghost" size="micro" onClick={onClose}>Close</Button>
      </div>
      <Tabs items={[{ label: 'Fields', value: 'fields' }, { label: 'JSON', value: 'json' }]} value={view} onValueChange={setView} size="micro" variant="button" />
      {rec.cut && <p className={styles.notice}>Its text is longer than the index takes: what is searched stops at 100,000 characters. The record is stored whole.</p>}
      {view === 'json'
        ? <pre className={styles.json}>{JSON.stringify(json, null, 2)}</pre>
        : groups.map(g => (
          <div key={g.title} className={styles.group}>
            <div className={styles.groupTitle}>{g.title}</div>
            {g.fields.map(f => {
              const v = rec[f.name];
              return (
                <div key={f.name} className={styles.fieldRow}>
                  <div className={styles.fieldName}>
                    {f.name}
                    {f.roles.filter(r => r !== 'search').map(r => <span key={r} className={styles.role}>{roleLabel[r]}</span>)}
                  </div>
                  <div className={v === undefined ? styles.fieldEmpty : styles.fieldValue}>
                    {v === undefined ? (f.roles.includes('search') ? 'Missing: this record cannot be found by its ' + f.name : 'Missing') : String(v)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
    </section>
  );
}

export function RecordsBrowser() {
  const [list, setList] = useState('all');
  const [key, setKey] = useState('');
  const [field, setField] = useState('');
  const [value, setValue] = useState('');
  const [page, setPage] = useState(0);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const cutCount = RECORDS.filter(r => r.cut).length;
  const missingCount = RECORDS.filter(missingSearchable).length;
  const values = field ? [...new Set(RECORDS.map(r => String(r[field])))].sort() : [];

  const rows = useMemo(() => RECORDS
    .filter(r => list === 'all' || (list === 'cut' ? r.cut : missingSearchable(r)))
    .filter(r => !key.trim() || r.key.toLowerCase().startsWith(key.trim().toLowerCase()))
    .filter(r => !field || !value || String(r[field]) === value), [list, key, field, value]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const at = Math.min(page, pages - 1);
  const shown = rows.slice(at * PAGE, at * PAGE + PAGE);
  const open = RECORDS.find(r => r.key === openKey);
  const reset = () => setPage(0);

  return (
    <div className={styles.browser}>
      <div className={styles.toolbar}>
        <InputField className={styles.keyField} placeholder="Go to key or key prefix" value={key} aria-label="Document key"
          onChange={e => { setKey(e.target.value); reset(); }} />
        <Select size="micro" aria-label="Filter field" placeholder="Filter by field" value={field}
          onValueChange={v => { setField(v === 'none' ? '' : v); setValue(''); reset(); }}
          options={[{ label: 'No filter', value: 'none' }, ...FILTERABLE.map(f => ({ label: f, value: f }))]} />
        {field && (
          <Select size="micro" aria-label="Filter value" placeholder="Any value" value={value}
            onValueChange={v => { setValue(v); reset(); }} options={values.map(v => ({ label: v, value: v }))} />
        )}
      </div>

      <div className={styles.listRow}>
        <Tabs size="micro" variant="button" value={list} onValueChange={v => { setList(v); reset(); }} items={[
          { label: 'All records', value: 'all' },
          { label: 'Text cut', value: 'cut', badge: String(cutCount), badgeTone: 'info', title: 'Text longer than the index takes' },
          { label: 'Missing a searchable field', value: 'missing', badge: String(missingCount), badgeTone: 'info' },
        ]} />
        <span className={styles.count}>
          {rows.length === 0 ? 'No records' : `${at * PAGE + 1}–${at * PAGE + shown.length} of ${nf.format(rows.length)}`}
        </span>
      </div>

      <div className={`${styles.split} ${open ? styles.withDetail : ''}`}>
        <div className={styles.listCol}>
          <Table scrollable stickyFirstColumn aria-label="Records">
            <TableHeader>
              <th>Key</th>
              <th>name</th>
              <th>category</th>
              <th className={styles.num}>price</th>
            </TableHeader>
            <tbody>
              {shown.map(r => (
                <TableRow key={r.key}>
                  <td>
                    <Button variant="ghost" size="micro" className={`${styles.keyButton} ${r.key === openKey ? styles.keyOpen : ''}`}
                      aria-pressed={r.key === openKey} onClick={() => setOpenKey(k => (k === r.key ? null : r.key))}>
                      {r.key}
                    </Button>
                  </td>
                  <td className={r.name === undefined ? styles.cellEmpty : undefined}>{r.name ?? 'missing'}</td>
                  <td>{r.category}</td>
                  <td className={styles.num}>{nf.format(Number(r.price))}</td>
                </TableRow>
              ))}
            </tbody>
          </Table>
          <div className={styles.pager}>
            <Button variant="ghost" size="micro" disabled={at === 0} onClick={() => setPage(at - 1)}>Previous</Button>
            <Button variant="ghost" size="micro" disabled={at >= pages - 1} onClick={() => setPage(at + 1)}>Next</Button>
          </div>
        </div>
        {open && <RecordDetail rec={open} onClose={() => setOpenKey(null)} />}
      </div>
    </div>
  );
}
