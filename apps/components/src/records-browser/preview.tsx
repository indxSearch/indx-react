import { useMemo, useState } from 'react';
import { Button, Checkbox, Chip, InputField, Popover, Select, SegmentedControl } from '@indxsearch/systm';
import { Document_fields, Filter as FilterIcon, Key, Table as TableIcon, X_or_error } from '@indxsearch/pixl';
import { FIELDS, PAGE, RECORDS, TOTAL, fieldOf, isFilterable, isSearched, isSortable, labelOf, missing, nf, search, show, statsOf, type Condition, type Rec, type Value } from './data';
import { CapNote, Pager, RecordFields, RecordJson, clip } from './parts';
import styles from './page.module.css';

// Variant B: the layout the console has now (toolbar, filter chips, the list, the record beside
// it), drawn the way the Search preview is: a hairline box on the page tone with a 40px borderless
// field at its top, hits as quiet rows, and a base on the raised tone beside it that shows the
// record a row opens, or the fields when none is open. There is no text search: that is the
// Search preview's job. The field at the top goes to a record by its key.

const roleTag: Record<string, string> = { filter: 'Filter', facet: 'Facet', sort: 'Sort' };

export function PreviewVariant() {
  const [keyText, setKeyText] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [sort, setSort] = useState('');
  const [columns, setColumns] = useState<string[]>(['name', 'brand', 'category', 'price']);
  const [page, setPage] = useState(0);
  const [openRec, setOpenRec] = useState<Rec | null>(null);
  const [view, setView] = useState<'fields' | 'json'>('fields');
  // The filter being made in the menu.
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftField, setDraftField] = useState('brand');
  const [draftValue, setDraftValue] = useState('');
  const [draftMin, setDraftMin] = useState('');
  const [draftMax, setDraftMax] = useState('');

  const answer = useMemo(() => search({ conditions, sort: sort.replace(/^-/, ''), ascending: !sort.startsWith('-') }), [conditions, sort]);
  const at = Math.min(page, Math.max(0, Math.ceil(answer.listed.length / PAGE) - 1));
  const shown = answer.listed.slice(at * PAGE, at * PAGE + PAGE);
  const draft = fieldOf(draftField);
  const values = answer.facets[draftField] ?? [];

  const goToKey = () => {
    const key = Number(keyText.trim());
    const rec = RECORDS.find(r => r.key === key) ?? null;
    if (rec) { setOpenRec(rec); setKeyError(null); } else setKeyError(keyText.trim() ? `No record has the key ${keyText.trim()}.` : null);
  };
  const addFilter = () => {
    const c: Condition = draft.type === 'Number'
      ? { field: draftField, kind: 'range', min: draftMin ? Number(draftMin) : undefined, max: draftMax ? Number(draftMax) : undefined }
      : { field: draftField, kind: 'value', value: draftValue };
    if (c.kind === 'value' && !c.value) return;
    if (c.kind === 'range' && c.min === undefined && c.max === undefined) return;
    setConditions(cs => [...cs.filter(x => labelOf(x) !== labelOf(c)), c]);
    setMenuOpen(false); setDraftValue(''); setDraftMin(''); setDraftMax(''); setPage(0);
  };

  return (
    <div className={styles.pvGrid}>
      <div className={styles.pvPanel}>
        <form className={styles.pvField} onSubmit={e => { e.preventDefault(); goToKey(); }}>
          <span className={styles.pvFieldIcon}><Key /></span>
          <input className={styles.pvFieldInput} placeholder="Go to a record by its key" value={keyText} inputMode="numeric"
            onChange={e => { setKeyText(e.target.value); setKeyError(null); }} aria-label="Record key" />
          <span className={styles.pvCount}>{nf.format(answer.count)} of {nf.format(TOTAL)} records</span>
        </form>
        {keyError && <p className={styles.pvEmpty}>{keyError}</p>}

        <div className={styles.pvTools}>
          <Popover open={menuOpen} onOpenChange={setMenuOpen} align="start" className={styles.menu} trigger={
            <Button variant="ghost" size="micro" iconLeft={<FilterIcon />}>Filter</Button>
          }>
            <Select size="micro" label="Field" value={draftField} onValueChange={v => { setDraftField(v); setDraftValue(''); }}
              options={FIELDS.filter(isFilterable).map(f => ({ label: f.name, value: f.name }))} />
            {draft.type === 'Number' ? (
              <div className={styles.pair}>
                <InputField label="From" value={draftMin} onChange={e => setDraftMin(e.target.value)} inputMode="decimal" />
                <InputField label="To" value={draftMax} onChange={e => setDraftMax(e.target.value)} inputMode="decimal" />
              </div>
            ) : (
              <Select size="micro" label="Value" placeholder="Choose a value" value={draftValue} onValueChange={setDraftValue}
                options={values.map(([v, n]) => ({ label: `${v} (${nf.format(n)})`, value: v }))} />
            )}
            <div><Button variant="primary" size="micro" onClick={addFilter}>Add</Button></div>
          </Popover>
          {conditions.map(c => (
            <Chip key={labelOf(c)} icon={<X_or_error />} title="Remove this filter"
              onClick={() => { setConditions(cs => cs.filter(x => x !== c)); setPage(0); }}>{labelOf(c)}</Chip>
          ))}
          <span className={styles.spacer} />
          <Select size="micro" variant="ghost" aria-label="Order" value={sort || 'none'} onValueChange={v => { setSort(v === 'none' ? '' : v); setPage(0); }}
            options={[{ label: 'Stored order', value: 'none' },
              ...FIELDS.filter(isSortable).flatMap(f => [{ label: `${f.name}, lowest first`, value: f.name }, { label: `${f.name}, highest first`, value: `-${f.name}` }])]} />
          <Popover align="end" className={styles.menu} trigger={<Button variant="ghost" size="micro" iconLeft={<TableIcon />}>Columns</Button>}>
            {FIELDS.map(f => (
              <Checkbox key={f.name} label={f.name} checked={columns.includes(f.name)}
                onChange={e => setColumns(cs => e.target.checked ? FIELDS.map(x => x.name).filter(n => n === f.name || cs.includes(n)) : cs.filter(n => n !== f.name))} />
            ))}
          </Popover>
        </div>
        <CapNote count={answer.count} listed={answer.listed.length} className={styles.pvNote} />

        <div className={styles.pvList} role="table" aria-label="Records">
          <div className={`${styles.pvRow} ${styles.pvHead}`} role="row" style={{ gridTemplateColumns: gridOf(columns) }}>
            <span role="columnheader">key</span>
            {columns.map(c => <span key={c} role="columnheader" className={fieldOf(c).type === 'Number' ? styles.num : undefined}>{c}</span>)}
          </div>
          {shown.map(r => (
            <div key={r.key} role="row" tabIndex={0} aria-selected={openRec?.key === r.key}
              className={`${styles.pvRow} ${openRec?.key === r.key ? styles.pvRowOpen : ''}`} style={{ gridTemplateColumns: gridOf(columns) }}
              onClick={() => setOpenRec(o => o?.key === r.key ? null : r)} onKeyDown={e => { if (e.key === 'Enter') setOpenRec(r); }}>
              <span role="cell" className={styles.pvKey}>{r.key}</span>
              {columns.map(c => {
                const v = r[c] as Value;
                return <span key={c} role="cell" className={missing(v) ? styles.cellEmpty : fieldOf(c).type === 'Number' ? styles.num : styles.pvCell}>{missing(v) ? 'missing' : clip(show(v), 70)}</span>;
              })}
            </div>
          ))}
        </div>
        <Pager page={at} listed={answer.listed.length} onPage={setPage} />
      </div>

      <aside className={styles.pvBase} aria-label={openRec ? `Record ${openRec.key}` : 'Fields'}>
        <div className={styles.pvCaption}>
          <span className={styles.pvFieldIcon}>{openRec ? <Key /> : <Document_fields />}</span>
          <span className={styles.pvCaptionText}>{openRec ? `Record ${openRec.key}` : 'Fields'}</span>
          {openRec && (
            <span className={styles.pvCaptionEnd}>
              <SegmentedControl size="micro" aria-label="View" value={view} onChange={setView} items={[{ value: 'fields', label: 'Fields' }, { value: 'json', label: 'JSON' }]} />
              <Button variant="ghost" size="micro" onClick={() => setOpenRec(null)}>Close</Button>
            </span>
          )}
        </div>
        <div className={styles.pvBaseBody}>
          {openRec ? (view === 'json' ? <RecordJson rec={openRec} /> : <RecordFields rec={openRec} tagClass={styles.docTag} />) : (
            <>
              <p className={styles.faint}>What each field holds across the {nf.format(TOTAL)} records. Choose one to show it as a column.</p>
              {FIELDS.map(f => {
                const s = statsOf(f);
                const share = s.present / TOTAL;
                return (
                  <button key={f.name} type="button" className={styles.pvFieldStat} aria-pressed={columns.includes(f.name)}
                    onClick={() => setColumns(cs => cs.includes(f.name) ? cs.filter(n => n !== f.name) : FIELDS.map(x => x.name).filter(n => n === f.name || cs.includes(n)))}>
                    <span className={styles.docFieldHead}>
                      <span className={styles.docFieldName}>{f.name}</span>
                      {isSearched(f) && <span className={styles.docTag}>Searched</span>}
                      {f.roles.filter(r => roleTag[r]).map(r => <span key={r} className={styles.docTag}>{roleTag[r]}</span>)}
                    </span>
                    <span className={styles.fillBar}><span style={{ width: `${share * 100}%` }} /></span>
                    <span className={share < 1 && isSearched(f) ? styles.pvWarn : styles.faint}>
                      {share === 1 ? 'Every record' : `${nf.format(TOTAL - s.present)} records without it`} · {nf.format(s.distinct)} values
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

/** The key, then a share of the width per column, numbers narrower. */
const gridOf = (columns: string[]) =>
  ['90px', ...columns.map(c => (fieldOf(c).type === 'Number' || fieldOf(c).type === 'Boolean' ? '90px' : 'minmax(0, 1fr)'))].join(' ');
