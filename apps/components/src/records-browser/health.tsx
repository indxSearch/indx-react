import { useMemo, useState } from 'react';
import { Button, Chip, Popover, PopoverDivider, Table, TableHeader, TableRow, Tabs } from '@indxsearch/systm';
import { Download, Scissors, Sort_ascending, Sort_descending, X_or_error } from '@indxsearch/pixl';
import { FIELDS, PAGE, TOTAL, isFilterable, isSearched, isSortable, labelOf, missing, nf, search, show, statsOf, type Condition, type FieldDef, type Rec, type Value } from './data';
import { CapNote, Pager, RecordFields, RecordJson, clip } from './parts';
import styles from './page.module.css';

// Variant C: what the Search preview cannot show. A search lists what it finds; this lists what
// the data holds and lacks. Every column says how many records hold its field, a column's menu
// sorts, filters and finds the records without it, and the lists above the table are the records
// a search would treat badly: a searched field missing, or text longer than the index takes.
// Those lists and "without it" read every record (the index cannot answer them), so they say so.

type List = 'all' | 'missing' | 'cut';
const searched = FIELDS.filter(isSearched);
const lacksSearched = (r: Rec) => searched.some(f => missing(r[f.name] as Value));

export function HealthVariant() {
  const [list, setList] = useState<List>('all');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [sort, setSort] = useState('');
  const [columns, setColumns] = useState<string[]>(FIELDS.slice(0, 7).map(f => f.name));
  const [page, setPage] = useState(0);
  const [openRec, setOpenRec] = useState<Rec | null>(null);
  const [json, setJson] = useState(false);

  const where = list === 'missing' ? lacksSearched : list === 'cut' ? (r: Rec) => r.cut : undefined;
  const answer = useMemo(() => search({ conditions, where, sort: sort.replace(/^-/, ''), ascending: !sort.startsWith('-') }),
    [conditions, list, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const at = Math.min(page, Math.max(0, Math.ceil(answer.listed.length / PAGE) - 1));
  const shown = answer.listed.slice(at * PAGE, at * PAGE + PAGE);
  const stats = useMemo(() => Object.fromEntries(FIELDS.map(f => [f.name, statsOf(f)])), []);
  const missingCount = useMemo(() => search({ where: lacksSearched }).count, []);
  const cutCount = useMemo(() => search({ where: r => r.cut }).count, []);
  const add = (c: Condition) => { setConditions(cs => [...cs.filter(x => labelOf(x) !== labelOf(c)), c]); setPage(0); };

  const header = (f: FieldDef) => {
    const s = stats[f.name];
    const share = s.present / TOTAL;
    return (
      <th key={f.name} className={styles.hHead}>
        <Popover align="start" className={styles.menu} trigger={
          <button type="button" className={styles.hHeadButton} title={`${f.name}: sort, filter, find the records without it`}>
            <span className={styles.hHeadName}>
              {f.name}
              {sort === f.name && <Sort_ascending />}{sort === `-${f.name}` && <Sort_descending />}
            </span>
            <span className={styles.fillBar}><span style={{ width: `${share * 100}%` }} /></span>
            <span className={share < 1 && isSearched(f) ? styles.pvWarn : styles.faint}>
              {share === 1 ? 'all' : `${(share * 100).toFixed(share > 0.99 ? 1 : 0)}%`} · {nf.format(s.distinct)} values
            </span>
          </button>
        }>
          <div className={styles.fieldPopHead}>{f.name}<span className={styles.faint}>{f.type}{isSearched(f) ? ', searched' : ''}</span></div>
          {isSortable(f) && (
            <>
              <Button variant="ghost" size="micro" iconLeft={<Sort_ascending />} onClick={() => { setSort(f.name); setPage(0); }}>Lowest first</Button>
              <Button variant="ghost" size="micro" iconLeft={<Sort_descending />} onClick={() => { setSort(`-${f.name}`); setPage(0); }}>Highest first</Button>
              <PopoverDivider />
            </>
          )}
          {isFilterable(f) && f.type !== 'Number' && s.top.map(([v, n]) => (
            <Button key={v} variant="ghost" size="micro" onClick={() => add({ field: f.name, kind: 'value', value: v })}>
              Only {clip(v, 24)} <span className={styles.faint}>{nf.format(n)}</span>
            </Button>
          ))}
          {!isFilterable(f) && <p className={styles.faint}>Not Filterable, so no value filter. Mark it in Field configuration.</p>}
          <PopoverDivider />
          <Button variant="ghost" size="micro" disabled={s.present === TOTAL} onClick={() => add({ field: f.name, kind: 'missing' })}>
            Records without it ({nf.format(TOTAL - s.present)})
          </Button>
          <p className={styles.faint}>Reads every record: slower on a large dataset.</p>
          <PopoverDivider />
          <Button variant="ghost" size="micro" onClick={() => setColumns(cs => cs.filter(c => c !== f.name))}>Hide the column</Button>
        </Popover>
      </th>
    );
  };

  return (
    <div className={styles.health}>
      <div className={styles.healthBar}>
        <Tabs size="micro" value={list} onValueChange={v => { setList(v as List); setPage(0); }} items={[
          { label: 'All records', value: 'all', badge: nf.format(TOTAL), badgeTone: 'info' },
          { label: 'Missing a searched field', value: 'missing', badge: nf.format(missingCount), badgeTone: 'info', title: `A record without ${searched.map(f => f.name).join(', ')} cannot be found by it` },
          { label: 'Text cut', value: 'cut', badge: nf.format(cutCount), badgeTone: 'info', title: 'Text longer than the index takes: a search reads the first 100,000 characters' },
        ]} />
        <span className={styles.spacer} />
        <Popover align="end" className={styles.menu} trigger={<Button variant="ghost" size="micro">Columns</Button>}>
          {FIELDS.filter(f => !columns.includes(f.name)).map(f => (
            <Button key={f.name} variant="ghost" size="micro" onClick={() => setColumns(cs => FIELDS.map(x => x.name).filter(n => n === f.name || cs.includes(n)))}>Show {f.name}</Button>
          ))}
          {columns.length === FIELDS.length && <p className={styles.faint}>Every field is shown.</p>}
        </Popover>
        <Button variant="ghost" size="micro" iconLeft={<Download />} title="The records listed, as JSON, the way they are stored">
          Download {nf.format(answer.listed.length)}
        </Button>
      </div>

      {conditions.length > 0 && (
        <div className={styles.chips}>
          {conditions.map(c => (
            <Chip key={labelOf(c)} icon={<X_or_error />} title="Remove this filter" onClick={() => { setConditions(cs => cs.filter(x => x !== c)); setPage(0); }}>{labelOf(c)}</Chip>
          ))}
          <Button variant="ghost" size="micro" onClick={() => setConditions([])}>Clear all</Button>
        </div>
      )}
      <CapNote count={answer.count} listed={answer.listed.length} />

      <div className={`${styles.split} ${openRec ? styles.withDetail : ''}`}>
        <div className={styles.listCol}>
          <Table scrollable stickyFirstColumn aria-label="Records">
            <TableHeader>
              <th className={styles.hKeyHead}>Key</th>
              {columns.map(c => header(FIELDS.find(f => f.name === c)!))}
            </TableHeader>
            <tbody>
              {shown.map(r => (
                <TableRow key={r.key}>
                  <td>
                    <Button variant="ghost" size="micro" className={`${styles.keyButton} ${openRec?.key === r.key ? styles.keyOpen : ''}`}
                      aria-pressed={openRec?.key === r.key} iconLeft={r.cut ? <Scissors /> : undefined} title={r.cut ? 'Its text is cut at indexing' : undefined}
                      onClick={() => setOpenRec(o => o?.key === r.key ? null : r)}>{r.key}</Button>
                  </td>
                  {columns.map(c => {
                    const v = r[c] as Value;
                    return <td key={c} className={missing(v) ? styles.cellEmpty : undefined}>{missing(v) ? 'missing' : clip(show(v), 50)}</td>;
                  })}
                </TableRow>
              ))}
            </tbody>
          </Table>
          <Pager page={at} listed={answer.listed.length} onPage={setPage} />
        </div>
        {openRec && (
          <section className={styles.detail} aria-label={`Record ${openRec.key}`}>
            <div className={styles.detailHead}>
              <span className={styles.mono}>{openRec.key}</span>
              <span className={styles.spacer} />
              <Button variant="ghost" size="micro" onClick={() => setJson(j => !j)}>{json ? 'Fields' : 'JSON'}</Button>
              <Button variant="ghost" size="micro" onClick={() => setOpenRec(null)}>Close</Button>
            </div>
            {json ? <RecordJson rec={openRec} /> : <RecordFields rec={openRec} />}
          </section>
        )}
      </div>
    </div>
  );
}
