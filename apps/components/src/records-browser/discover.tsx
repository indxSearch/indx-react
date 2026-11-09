import { Fragment, useMemo, useState } from 'react';
import { Button, InputField, Popover, SearchField, Select, SegmentedControl, Table, TableHeader, TableRow } from '@indxsearch/systm';
import { Array as ArrayIcon, Bool, Check, Chevron_down, Chevron_right, Number as NumberIcon, Plus, String as StringIcon } from '@indxsearch/pixl';
import { FIELDS, PAGE, TOTAL, isFilterable, isSearched, isSortable, nf, search, show, statsOf, type Condition, type FieldDef } from './data';
import { CapNote, RecordFields, RecordJson, clip } from './parts';
import styles from './page.module.css';

// Variant A: the way the hosted engines and Kibana do it. A query bar on top (search and a filter
// expression), the fields down the left with what each holds, the hits as a table whose rows open
// in place. Algolia's Browse, Meilisearch's Documents and Kibana's Discover all have this shape.

const typeIcon = (f: FieldDef) =>
  f.type === 'Number' ? <NumberIcon /> : f.type === 'Boolean' ? <Bool /> : f.type === 'Array' ? <ArrayIcon /> : <StringIcon />;

/** `category = "Lamps" AND price > 2000`: the filter expression Indx takes (QueryProxy.FilterExpression),
 *  read here only as far as the mock needs: conditions joined by AND, = on a value, < and > on a number. */
function parse(expression: string): { conditions: Condition[]; error?: string } {
  const conditions: Condition[] = [];
  for (const part of expression.split(/\s+AND\s+/i).map(p => p.trim()).filter(Boolean)) {
    const m = part.match(/^([a-z_]+)\s*(=|>=|<=|>|<)\s*"?([^"]*)"?$/i);
    if (!m) return { conditions, error: `Not understood: ${part}` };
    const [, name, op, raw] = m;
    const field = FIELDS.find(f => f.name === name);
    if (!field) return { conditions, error: `No field named ${name}` };
    if (!isFilterable(field)) return { conditions, error: `${name} is not Filterable` };
    if (op === '=') conditions.push({ field: name, kind: 'value', value: raw });
    else {
      const n = Number(raw);
      if (field.type !== 'Number' || Number.isNaN(n)) return { conditions, error: `${name} ${op} needs a number field and a number` };
      conditions.push(op.startsWith('>') ? { field: name, kind: 'range', min: n } : { field: name, kind: 'range', max: n });
    }
  }
  return { conditions };
}

export function DiscoverVariant() {
  const [text, setText] = useState('');
  const [expression, setExpression] = useState('');
  const [applied, setApplied] = useState('');
  const [columns, setColumns] = useState<string[]>(['name', 'brand', 'price']);
  const [sort, setSort] = useState('');
  const [perPage, setPerPage] = useState(String(PAGE));
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [jsonRows, setJsonRows] = useState<Set<number>>(() => new Set());

  const parsed = parse(applied);
  const answer = useMemo(() => search({ text, conditions: parsed.conditions, sort: sort.replace(/^-/, ''), ascending: !sort.startsWith('-') }),
    [text, applied, sort]); // eslint-disable-line react-hooks/exhaustive-deps
  const size = Number(perPage);
  const pages = Math.max(1, Math.ceil(answer.listed.length / size));
  const at = Math.min(page, pages - 1);
  const shown = answer.listed.slice(at * size, at * size + size);
  const toggle = (set: Set<number>, key: number) => { const n = new Set(set); if (n.has(key)) n.delete(key); else n.add(key); return n; };
  const addCondition = (c: string) => { const next = applied ? `${applied} AND ${c}` : c; setExpression(next); setApplied(next); setPage(0); };

  return (
    <div className={styles.discover}>
      <div className={styles.queryBar}>
        <SearchField className={styles.queryText} placeholder={`Search ${FIELDS.filter(isSearched).map(f => f.name).join(', ')}`}
          value={text} onChange={e => { setText(e.target.value); setPage(0); }} aria-label="Search" />
        <form className={styles.queryFilter} onSubmit={e => { e.preventDefault(); setApplied(expression); setPage(0); }}>
          <InputField className={styles.mono} placeholder='Filter: category = "Lamps" AND price > 2000' value={expression}
            onChange={e => setExpression(e.target.value)} aria-label="Filter expression" error={parsed.error} />
          <Button type="submit" variant="secondary" size="micro">Apply</Button>
        </form>
      </div>

      <div className={styles.discoverBody}>
        <aside className={styles.fieldList} aria-label="Fields">
          <div className={styles.fieldListTitle}>Fields</div>
          {FIELDS.map(f => {
            const s = statsOf(f);
            const on = columns.includes(f.name);
            return (
              <div key={f.name} className={styles.fieldItem}>
                <Popover side="right" align="start" className={styles.fieldPop} trigger={
                  <button type="button" className={styles.fieldItemName} title={`What ${f.name} holds`}>
                    <span className={styles.fieldType}>{typeIcon(f)}</span>{f.name}
                  </button>
                }>
                  <div className={styles.fieldPopHead}>{f.name}<span className={styles.faint}>{f.type}</span></div>
                  <p className={styles.faint}>In {nf.format(s.present)} of {nf.format(TOTAL)} records, {nf.format(s.distinct)} distinct values</p>
                  <div className={styles.fillBar}><span style={{ width: `${(100 * s.present) / TOTAL}%` }} /></div>
                  {s.top.map(([v, n]) => (
                    <div key={v} className={styles.topValue}>
                      <span className={styles.topValueText} title={v}>{clip(v, 40)}</span>
                      <span className={styles.faint}>{nf.format(n)}</span>
                      {isFilterable(f) && f.type !== 'Number' && (
                        <Button variant="ghost" size="micro" aria-label={`Filter ${f.name} = ${v}`} onClick={() => addCondition(`${f.name} = "${v}"`)}>Filter</Button>
                      )}
                    </div>
                  ))}
                  {!isFilterable(f) && <p className={styles.faint}>Not Filterable: mark it in Field configuration to filter by it.</p>}
                </Popover>
                <Button variant="ghost" size="micro" aria-pressed={on} aria-label={on ? `Remove the ${f.name} column` : `Add ${f.name} as a column`}
                  iconLeft={on ? <Check /> : <Plus />} onClick={() => setColumns(c => on ? c.filter(x => x !== f.name) : [...c, f.name])} />
              </div>
            );
          })}
        </aside>

        <div className={styles.hits}>
          <div className={styles.hitsHead}>
            <span className={styles.hitsCount}>{nf.format(answer.count)} hits</span>
            <span className={styles.spacer} />
            <Select size="micro" variant="ghost" aria-label="Sort" value={sort || 'none'} onValueChange={v => { setSort(v === 'none' ? '' : v); setPage(0); }}
              options={[{ label: text ? 'Relevance' : 'Stored order', value: 'none' },
                ...FIELDS.filter(isSortable).flatMap(f => [{ label: `${f.name} ascending`, value: f.name }, { label: `${f.name} descending`, value: `-${f.name}` }])]} />
            <Select size="micro" variant="ghost" aria-label="Hits per page" value={perPage} onValueChange={v => { setPerPage(v); setPage(0); }}
              options={['20', '50', '100'].map(n => ({ label: `${n} per page`, value: n }))} />
          </div>
          <CapNote count={answer.count} listed={answer.listed.length} />

          <Table scrollable aria-label="Hits">
            <TableHeader>
              <th className={styles.expandCol} aria-label="Open" />
              <th>Key</th>
              {columns.map(c => <th key={c}>{c}</th>)}
            </TableHeader>
            <tbody>
              {shown.map(r => {
                const isOpen = open.has(r.key);
                return (
                  <Fragment key={r.key}>
                    <TableRow>
                      <td className={styles.expandCol}>
                        <Button variant="ghost" size="micro" aria-expanded={isOpen} aria-label={isOpen ? 'Close the record' : 'Open the record'}
                          iconLeft={isOpen ? <Chevron_down /> : <Chevron_right />} onClick={() => setOpen(s => toggle(s, r.key))} />
                      </td>
                      <td className={styles.mono}>{r.key}</td>
                      {columns.map(c => <td key={c} className={show(r[c] as never) ? undefined : styles.cellEmpty}>{clip(show(r[c] as never), 60) || 'missing'}</td>)}
                    </TableRow>
                    {isOpen && (
                      <tr className={styles.expanded}>
                        <td colSpan={columns.length + 2}>
                          <div className={styles.expandedBody}>
                            <SegmentedControl size="micro" aria-label="View" value={jsonRows.has(r.key) ? 'json' : 'fields'}
                              onChange={v => setJsonRows(s => (v === 'json') === s.has(r.key) ? s : toggle(s, r.key))}
                              items={[{ value: 'fields', label: 'Fields' }, { value: 'json', label: 'JSON' }]} />
                            {jsonRows.has(r.key) ? <RecordJson rec={r} /> : <div className={styles.expandedFields}><RecordFields rec={r} /></div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </Table>
          <div className={styles.pager}>
            <Button variant="ghost" size="micro" disabled={at === 0} onClick={() => setPage(0)}>First</Button>
            <Button variant="ghost" size="micro" disabled={at === 0} onClick={() => setPage(at - 1)}>Previous</Button>
            <span className={styles.faint}>Page {at + 1} of {pages}</span>
            <Button variant="ghost" size="micro" disabled={at >= pages - 1} onClick={() => setPage(at + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
