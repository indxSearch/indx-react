import { Fragment, useMemo, useState } from 'react';
import { Button, Checkbox, Chip, InputField, Popover, PopoverDivider, SearchField, Select, SegmentedControl, Table, TableHeader, Tabs, Tooltip } from '@indxsearch/systm';
import { Chevron_down, Chevron_right, Filter as FilterIcon, Scissors, Sort_ascending, Sort_descending, Table as TableIcon, Warning, X_or_error } from '@indxsearch/pixl';
import { FIELDS, TOTAL, fieldOf, isFilterable, isSearched, isSortable, labelOf, missing, nf, search, show, type Condition, type FieldDef, type Rec, type Value } from './data';
import { DataCheckModal, ago, lacksSearched, useDataCheck, type DataReport } from './check';
import { CapNote, RecordFields, RecordJson, clip } from './parts';
import styles from './page.module.css';

// Variant D: the console's Records section as it is (toolbar, filter chips, the cap note, a
// systm Table, the record grouped by field role), with what the other three did best:
// rows that open in place and a page size (A), the whole row to hover and click (B), and what
// the data lacks (C). A searched field missing in a row on the page is marked, which costs nothing:
// the page's records are read anyway. What needs every record read (how many lack each field, the
// lists of records a search treats badly) comes from a check the owner starts, in a modal, and
// not after every Index(): on 2M records it keeps a core busy for a while (check.tsx).

type List = 'all' | 'missing' | 'cut';
/** How many values the filter menu lists at once: a field with thousands is searched, not scrolled. */
const SHOWN_VALUES = 50;
/** Longer than this, a cell is cut and its tooltip shows more. */
const CELL_CHARS = 60;

export function CombinedVariant() {
  const [text, setText] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [list, setList] = useState<List>('all');
  const [sort, setSort] = useState('');
  const [ascending, setAscending] = useState(true);
  const [columns, setColumns] = useState<string[]>(['name', 'description', 'brand', 'category', 'price']);
  const [perPage, setPerPage] = useState('50');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [jsonRows, setJsonRows] = useState<Set<number>>(() => new Set());
  // The filter being made in the menu.
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftField, setDraftField] = useState('designers');
  const [valueQuery, setValueQuery] = useState('');
  const [report, setReport] = useState<DataReport | null>(null);
  const [checkOpen, setCheckOpen] = useState(false);
  const check = useDataCheck(setReport);
  const [draftMin, setDraftMin] = useState('');
  const [draftMax, setDraftMax] = useState('');

  const where = list === 'missing' ? lacksSearched : list === 'cut' ? (r: Rec) => r.cut : undefined;
  const answer = useMemo(() => search({ text, conditions, where, sort, ascending }),
    [text, conditions, list, sort, ascending]); // eslint-disable-line react-hooks/exhaustive-deps
  const size = Number(perPage);
  const pages = Math.max(1, Math.ceil(answer.listed.length / size));
  const at = Math.min(page, pages - 1);
  const shown = answer.listed.slice(at * size, at * size + size);

  const draft = fieldOf(draftField);
  const values = answer.facets[draftField] ?? [];
  const matching = useMemo(() => narrow(values, valueQuery), [values, valueQuery]);

  const toggle = (set: Set<number>, key: number) => { const n = new Set(set); if (n.has(key)) n.delete(key); else n.add(key); return n; };
  const add = (c: Condition) => {
    setConditions(cs => [...cs.filter(x => labelOf(x) !== labelOf(c)), c]);
    setMenuOpen(false); setValueQuery(''); setDraftMin(''); setDraftMax(''); setPage(0);
  };
  const addRange = () => {
    const min = draftMin ? Number(draftMin) : undefined, max = draftMax ? Number(draftMax) : undefined;
    if (min !== undefined || max !== undefined) add({ field: draftField, kind: 'range', min, max });
  };
  const sortBy = (field: string, asc: boolean) => { setSort(field); setAscending(asc); setPage(0); };

  const header = (f: FieldDef) => {
    // With a report, what the check counted; without one, what the search's facets give for free.
    const s = report?.stats[f.name];
    const without = s ? TOTAL - s.present : 0;
    const issue = without > 0 && isSearched(f);
    const facetValues = answer.facets[f.name]?.length;
    const values = s ? s.distinct : facetValues;
    return (
      <th key={f.name} className={`${styles.hHead} ${f.type === 'Number' ? styles.dNum : ''}`}>
        <Popover align="start" className={styles.menu} trigger={
          <button type="button" className={styles.dHeadButton}>
            <span className={styles.hHeadName}>
              {f.name}
              {sort === f.name && (ascending ? <Sort_ascending /> : <Sort_descending />)}
            </span>
            {(s || values !== undefined) && (
              <span className={issue ? styles.dIssue : styles.dHeadNote}>
                {issue && <Warning size={14} />}
                {[s ? (without === 0 ? 'in all' : `${nf.format(without)} without`) : null,
                  values !== undefined ? `${nf.format(values)} ${values === 1 ? 'value' : 'values'}` : null].filter(Boolean).join(' · ')}
              </span>
            )}
          </button>
        }>
          <div className={styles.fieldPopHead}>{f.name}<span className={styles.faint}>{f.type}{isSearched(f) ? ', searched' : ''}</span></div>
          {issue && <p className={styles.faint}>A search cannot find the {nf.format(without)} records without it by their {f.name}.</p>}
          {isSortable(f) && (
            <>
              <Button variant="ghost" size="micro" iconLeft={<Sort_ascending />} onClick={() => sortBy(f.name, true)}>Lowest first</Button>
              <Button variant="ghost" size="micro" iconLeft={<Sort_descending />} onClick={() => sortBy(f.name, false)}>Highest first</Button>
              <PopoverDivider />
            </>
          )}
          {isFilterable(f) && f.type !== 'Number' && (answer.facets[f.name] ?? s?.top ?? []).slice(0, 5).map(([v, n]) => (
            <Button key={v} variant="ghost" size="micro" onClick={() => add({ field: f.name, kind: 'value', value: v })}>
              Only {clip(v, 24)} <span className={styles.faint}>{nf.format(n)}</span>
            </Button>
          ))}
          {s
            ? <Button variant="ghost" size="micro" disabled={without === 0} onClick={() => add({ field: f.name, kind: 'missing' })}>Records without it ({nf.format(without)})</Button>
            : <Button variant="ghost" size="micro" onClick={() => setCheckOpen(true)}>Records without it: check the data</Button>}
          <PopoverDivider />
          <Button variant="ghost" size="micro" onClick={() => setColumns(cs => cs.filter(c => c !== f.name))}>Hide the column</Button>
        </Popover>
      </th>
    );
  };

  const cell = (r: Rec, f: FieldDef) => {
    const v = r[f.name] as Value;
    if (missing(v))
      return isSearched(f)
        ? <td key={f.name}><span className={styles.dIssue} title={`A search cannot find this record by its ${f.name}`}><Warning size={14} />missing</span></td>
        : <td key={f.name} className={styles.cellEmpty}>missing</td>;
    const full = show(v);
    const value = <span className={styles.dCell}>{clip(full, CELL_CHARS)}</span>;
    return (
      <td key={f.name} className={f.type === 'Number' ? styles.dNum : undefined}>
        {full.length > CELL_CHARS ? <Tooltip content={clip(full, 400)} className={styles.cellTip}>{value}</Tooltip> : value}
      </td>
    );
  };

  return (
    <div className={styles.health}>
      <div className={styles.dToolbar}>
        <Popover open={menuOpen} onOpenChange={setMenuOpen} align="start" className={styles.menu} trigger={
          <Button variant="ghost" size="micro" iconLeft={<FilterIcon />}>Add filter</Button>
        }>
          <Select size="micro" label="Field" value={draftField} onValueChange={v => { setDraftField(v); setValueQuery(''); }}
            options={FIELDS.filter(isFilterable).map(f => ({ label: f.name, value: f.name }))} />
          {draft.type === 'Number' ? (
            <>
              <div className={styles.pair}>
                <InputField label="From" value={draftMin} onChange={e => setDraftMin(e.target.value)} inputMode="decimal" />
                <InputField label="To" value={draftMax} onChange={e => setDraftMax(e.target.value)} inputMode="decimal" />
              </div>
              <div><Button variant="primary" size="micro" onClick={addRange}>Add</Button></div>
            </>
          ) : (
            <>
              <SearchField inputSize="micro" placeholder={`Search ${nf.format(values.length)} values`} value={valueQuery}
                onChange={e => setValueQuery(e.target.value)} aria-label="Search the values" />
              <div className={styles.dValueList}>
                {matching.slice(0, SHOWN_VALUES).map(([v, n]) => (
                  <Button key={v} variant="ghost" size="micro" className={styles.dValue} onClick={() => add({ field: draftField, kind: 'value', value: v })}>
                    <span className={styles.topValueText}>{v}</span><span className={styles.faint}>{nf.format(n)}</span>
                  </Button>
                ))}
              </div>
              <p className={styles.faint}>
                {matching.length === 0 ? 'No value holds that.'
                  : matching.length > SHOWN_VALUES ? `The ${SHOWN_VALUES} commonest of ${nf.format(matching.length)}. Type to narrow.`
                  : `${nf.format(matching.length)} ${matching.length === 1 ? 'value' : 'values'}.`}
              </p>
            </>
          )}
        </Popover>
        <span className={styles.dOrder}>
          <Select size="micro" variant="ghost" aria-label="Order" value={sort || 'none'} onValueChange={v => sortBy(v === 'none' ? '' : v, ascending)}
            options={[{ label: text ? 'Best match' : 'Stored order', value: 'none' }, ...FIELDS.filter(isSortable).map(f => ({ label: `By ${f.name}`, value: f.name }))]} />
          {sort && (
            <SegmentedControl size="micro" aria-label="Direction" value={ascending ? 'asc' : 'desc'} onChange={v => sortBy(sort, v === 'asc')}
              items={[{ value: 'asc', icon: <Sort_ascending />, 'aria-label': 'Ascending' }, { value: 'desc', icon: <Sort_descending />, 'aria-label': 'Descending' }]} />
          )}
        </span>
        <Popover align="start" className={styles.menu} trigger={<Button variant="ghost" size="micro" iconLeft={<TableIcon />}>Columns</Button>}>
          {FIELDS.map(f => (
            <Checkbox key={f.name} label={f.name} checked={columns.includes(f.name)}
              onChange={e => setColumns(cs => e.target.checked ? FIELDS.map(x => x.name).filter(n => n === f.name || cs.includes(n)) : cs.filter(n => n !== f.name))} />
          ))}
        </Popover>
        <SearchField className={styles.dSearch} inputSize="micro" placeholder="Search the records" value={text}
          onChange={e => { setText(e.target.value); setPage(0); }} aria-label="Search the records" />
        <span className={styles.dCount}>{answer.count === 1 ? '1 record' : `${nf.format(answer.count)} records`}</span>
        <Button variant="ghost" size="micro" iconLeft={<Warning size={14} />} onClick={() => setCheckOpen(true)}>
          {check.state.phase === 'running' ? `Checking, ${Math.floor((100 * check.state.read) / TOTAL)}%` : 'Check the data'}
        </Button>
      </div>
      <DataCheckModal open={checkOpen} onOpenChange={setCheckOpen} state={check.state} report={report}
        onStart={check.start} onCancel={check.cancel}
        onShow={l => { setList(l); setPage(0); setCheckOpen(false); }} />

      {report && <div className={styles.healthBar}>
        <Tabs size="micro" value={list} onValueChange={v => { setList(v as List); setPage(0); }} items={[
          { label: 'All records', value: 'all', badge: nf.format(TOTAL), badgeTone: 'info' },
          { label: 'Missing a searched field', value: 'missing', badge: nf.format(report.lacking), badgeTone: 'info', title: 'A record without a searched field cannot be found by it' },
          { label: 'Text cut', value: 'cut', badge: nf.format(report.cut), badgeTone: 'info', title: 'Text longer than the index takes: a search reads the first 100,000 characters' },
        ]} />
        <span className={styles.faint}>From the check {ago(report.at)}</span>
      </div>}

      {conditions.length > 0 && (
        <div className={styles.chips}>
          {conditions.map(c => (
            <Chip key={labelOf(c)} icon={<X_or_error />} title="Remove this filter" onClick={() => { setConditions(cs => cs.filter(x => x !== c)); setPage(0); }}>{labelOf(c)}</Chip>
          ))}
          <Button variant="ghost" size="micro" onClick={() => { setConditions([]); setPage(0); }}>Clear all</Button>
        </div>
      )}
      <CapNote count={answer.count} listed={answer.listed.length} />

      <Table scrollable stickyFirstColumn aria-label="Records">
        <TableHeader>
          <th className={styles.hKeyHead}>Key</th>
          {columns.map(c => header(fieldOf(c)))}
        </TableHeader>
        <tbody>
          {shown.map(r => {
            const isOpen = open.has(r.key);
            const flip = () => setOpen(s => toggle(s, r.key));
            return (
              <Fragment key={r.key}>
                <tr className={`${styles.dRow} ${isOpen ? styles.dRowOpen : ''}`} tabIndex={0} aria-expanded={isOpen}
                  onClick={flip} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } }}>
                  <td>
                    <span className={styles.dKey}>
                      {isOpen ? <Chevron_down size={14} /> : <Chevron_right size={14} />}{r.key}
                      {r.cut && <span title="Its text is cut at indexing"><Scissors size={14} /></span>}
                    </span>
                  </td>
                  {columns.map(c => cell(r, fieldOf(c)))}
                </tr>
                {isOpen && (
                  <tr className={styles.dExpanded}>
                    <td colSpan={columns.length + 1}>
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

      {answer.listed.length > 0 && (
        <div className={styles.pager}>
          <Select size="micro" variant="ghost" aria-label="Records per page" value={perPage} onValueChange={v => { setPerPage(v); setPage(0); }}
            options={['20', '50', '100'].map(n => ({ label: `${n} per page`, value: n }))} />
          <span className={styles.spacer} />
          <span className={styles.faint}>{nf.format(at * size + 1)} to {nf.format(Math.min(answer.listed.length, (at + 1) * size))} of {nf.format(answer.listed.length)}</span>
          <Button variant="ghost" size="micro" disabled={at === 0} onClick={() => setPage(at - 1)}>Previous</Button>
          <Button variant="ghost" size="micro" disabled={at >= pages - 1} onClick={() => setPage(at + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

/** The values that start with what was typed, then those that hold it, each kept in count order. */
function narrow(values: [string, number][], query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return values;
  const starts = values.filter(([v]) => v.toLowerCase().startsWith(q));
  const holds = values.filter(([v]) => !v.toLowerCase().startsWith(q) && v.toLowerCase().includes(q));
  return [...starts, ...holds];
}
