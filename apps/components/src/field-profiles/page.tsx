import { useState } from 'react';
import {
  Button, Checkbox, Chip, InputField, Modal, SaveBar, SegmentedControl, Select, Table, TableHeader, TableRow, ToggleSwitch,
} from '@indxsearch/systm';
import { Array as ArrayIcon, Compose, Delete, Number as NumberIcon, Plus, Type } from '@indxsearch/pixl';
import styles from './page.module.css';

// A mockup: field profiles for IndxServer's Fields section, on the field API of the dev branch.
// The matrix stays what it is (how a field is searched, by its words, by pattern, or both, and
// its other roles); a profile is how forgiving Coverage is with a field, so many fields share
// a few named settings instead of each carrying its own. A profile is the library's
// FieldCoverage under a name: strictness, weight and three steps. Nothing talks to a server.

type Strictness = 'ldd0' | 'ldd1' | 'ldd2' | 'none';

interface Profile {
  id: string;
  name: string;
  about: string;
  strictness: Strictness;
  /** FieldCoverage.Weight: what a character confirmed in the field counts. */
  weight: number;
  wholeQuery: boolean;
  joinedWords: boolean;
  prefixSuffix: boolean;
  builtIn?: boolean;
}

interface FieldRow {
  name: string;
  type: 'Text' | 'Array' | 'Number';
  words: boolean;
  pattern: boolean;
  filterable: boolean;
  facetable: boolean;
  sortable: boolean;
  weight: number;
  profile: string;
}

const STRICTNESS: { value: Strictness; label: string; short: string; about: string }[] = [
  { value: 'ldd0', label: 'Exact', short: 'Exact', about: 'Words must match as written. For codes, numbers and identifiers.' },
  { value: 'ldd1', label: '1 typo', short: '1 typo', about: 'A word may differ by one letter, or two neighbouring letters swapped.' },
  { value: 'ldd2', label: '2 typos', short: '2 typos', about: 'A word may differ by two edits. For titles and names people misspell.' },
  { value: 'none', label: 'Not judged', short: 'Not judged', about: 'Coverage leaves the field out; it counts through the ranking alone.' },
];

const BUILT_IN: Profile[] = [
  { id: 'title', name: 'Title', about: 'Titles and product names: the most forgiving.', strictness: 'ldd2', weight: 1, wholeQuery: true, joinedWords: true, prefixSuffix: true, builtIn: true },
  { id: 'name', name: 'Name', about: 'People and brands.', strictness: 'ldd1', weight: 1, wholeQuery: true, joinedWords: true, prefixSuffix: true, builtIn: true },
  { id: 'category', name: 'Category', about: 'Categories, tags and other short labels.', strictness: 'ldd1', weight: 0.8, wholeQuery: true, joinedWords: false, prefixSuffix: true, builtIn: true },
  { id: 'code', name: 'Code', about: 'ISBNs, SKUs and article numbers: exact.', strictness: 'ldd0', weight: 1, wholeQuery: true, joinedWords: false, prefixSuffix: true, builtIn: true },
  { id: 'text', name: 'Text', about: 'Descriptions and other long text.', strictness: 'ldd1', weight: 0.5, wholeQuery: false, joinedWords: true, prefixSuffix: false, builtIn: true },
];

const FIELDS: FieldRow[] = [
  { name: 'title', type: 'Text', words: true, pattern: true, filterable: false, facetable: false, sortable: true, weight: 3, profile: 'title' },
  { name: 'authors', type: 'Array', words: true, pattern: true, filterable: true, facetable: true, sortable: false, weight: 2, profile: 'name' },
  { name: 'series', type: 'Text', words: true, pattern: true, filterable: true, facetable: false, sortable: false, weight: 1.5, profile: 'title' },
  { name: 'isbn', type: 'Array', words: true, pattern: false, filterable: true, facetable: false, sortable: false, weight: 1.5, profile: 'code' },
  { name: 'categories', type: 'Array', words: true, pattern: true, filterable: true, facetable: true, sortable: false, weight: 1, profile: 'category' },
  { name: 'description', type: 'Text', words: true, pattern: false, filterable: false, facetable: false, sortable: false, weight: 0.4, profile: 'text' },
  { name: 'format', type: 'Text', words: false, pattern: false, filterable: true, facetable: true, sortable: false, weight: 1, profile: 'category' },
  { name: 'publishedYear', type: 'Number', words: false, pattern: false, filterable: true, facetable: true, sortable: true, weight: 1, profile: 'code' },
];

const TYPE_ICON = { Text: <Type size={14} />, Array: <ArrayIcon size={14} />, Number: <NumberIcon size={14} /> };

const searched = (f: FieldRow) => f.words || f.pattern;
const strictnessShort = (s: Strictness) => STRICTNESS.find(x => x.value === s)!.short;
const steps = (p: Profile) => [p.wholeQuery && 'Whole query', p.joinedWords && 'Joined words', p.prefixSuffix && 'Word parts'].filter(Boolean).join(', ') || 'None';

/** The profile editor: one modal for a new profile and for an existing one. */
function ProfileModal({ profile, usedBy, open, onOpenChange, onSave, onDelete }: {
  profile: Profile;
  usedBy: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (p: Profile) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState(profile);
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft(d => ({ ...d, [key]: value }));
  const judged = draft.strictness !== 'none';
  const isNew = !profile.name;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isNew ? 'New profile' : `Edit ${profile.name}`}
      description="How forgiving a search is with the fields that use this profile.">
      <div className={styles.form}>
        <div className={styles.row2}>
          <InputField label="Name" value={draft.name} onChange={e => set('name', e.target.value)} disabled={draft.builtIn} />
          <InputField label="Weight" type="number" min={0} max={5} step={0.1} value={draft.weight}
            onChange={e => set('weight', Number(e.target.value))} disabled={!judged} />
        </div>
        <InputField label="Description" value={draft.about} onChange={e => set('about', e.target.value)} />

        <fieldset className={styles.group}>
          <legend className={styles.legend}>Typos</legend>
          <SegmentedControl aria-label="Typos" stretch value={draft.strictness} onChange={v => set('strictness', v)}
            items={STRICTNESS.map(s => ({ value: s.value, label: s.label }))} />
          <p className={styles.hint}>{STRICTNESS.find(s => s.value === draft.strictness)!.about}</p>
        </fieldset>

        <fieldset className={styles.group} disabled={!judged}>
          <legend className={styles.legend}>Also count</legend>
          <div className={styles.toggleRow}>
            <div><div className={styles.toggleLabel}>The whole query</div><div className={styles.hint}>A record holding the query as typed is never cut from the list.</div></div>
            <ToggleSwitch checked={draft.wholeQuery} onChange={v => set('wholeQuery', v)} disabled={!judged} aria-label="The whole query" />
          </div>
          <div className={styles.toggleRow}>
            <div><div className={styles.toggleLabel}>Joined and split words</div><div className={styles.hint}>"blueberry" for "blue berry", and the other way round.</div></div>
            <ToggleSwitch checked={draft.joinedWords} onChange={v => set('joinedWords', v)} disabled={!judged} aria-label="Joined and split words" />
          </div>
          <div className={styles.toggleRow}>
            <div><div className={styles.toggleLabel}>Word parts</div><div className={styles.hint}>A query word as the start or end of a longer word: "ost" in "jarlsbergost".</div></div>
            <ToggleSwitch checked={draft.prefixSuffix} onChange={v => set('prefixSuffix', v)} disabled={!judged} aria-label="Word parts" />
          </div>
        </fieldset>

        {usedBy.length > 0 && <p className={styles.hint}>Used by {usedBy.join(', ')}. The change applies to all of them.</p>}

        <div className={styles.actions}>
          {onDelete && !draft.builtIn && (
            <Button variant="ghost" iconLeft={<Delete />} className={styles.actionsStart} disabled={usedBy.length > 0}
              title={usedBy.length > 0 ? 'Move its fields to another profile first' : undefined} onClick={onDelete}>Delete</Button>
          )}
          <Button disabled={!draft.name.trim()} onClick={() => onSave(draft)}>{isNew ? 'Create profile' : 'Save'}</Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function FieldProfilesMockup() {
  const [profiles, setProfiles] = useState<Profile[]>(BUILT_IN);
  const [fields, setFields] = useState<FieldRow[]>(FIELDS);
  // Fields and profiles are one working copy, saved together from the bar.
  const [saved, setSaved] = useState({ fields: FIELDS, profiles: BUILT_IN });
  // ?edit=<profile id> opens its editor, so the modal can be linked to.
  const [editing, setEditing] = useState<Profile | null>(() => BUILT_IN.find(p => p.id === new URLSearchParams(window.location.search).get('edit')) ?? null);

  const usedBy = (id: string) => fields.filter(f => searched(f) && f.profile === id).map(f => f.name);
  const setField = (name: string, change: Partial<FieldRow>) => setFields(fs => fs.map(f => f.name === name ? { ...f, ...change } : f));
  const dirty = JSON.stringify({ fields, profiles }) !== JSON.stringify(saved);

  const saveProfile = (p: Profile) => {
    const id = p.id || p.name.trim().toLowerCase().replace(/\s+/g, '-');
    setProfiles(ps => ps.some(x => x.id === id) ? ps.map(x => x.id === id ? { ...p, id } : x) : [...ps, { ...p, id }]);
    setEditing(null);
  };

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Field profiles</h1>
        <p className={styles.desc}>
          A mockup for the Fields section on the coming field API. The matrix says how a field is searched:
          by its words, by pattern, or both. A profile says how forgiving the search is with it: typos, its
          weight in Coverage, and what else counts as a match. Fields share profiles, so a catalogue with
          forty fields is tuned in four places.
        </p>
      </div>

      <section className={styles.section}>
        <h2 className={styles.heading}>Fields</h2>
        <Table scrollable stickyFirstColumn aria-label="Field configuration">
          <TableHeader>
            <th>Field and type</th>
            <th className={styles.check} title="The field's words: fast, exact and with the typos its profile allows.">Words</th>
            <th className={styles.check} title="Pattern matching: parts of words, compounds and large typos. Costs memory; use it on titles and names.">Pattern</th>
            <th className={styles.profileCol} title="How forgiving a search is with this field. Edit the profiles below.">Profile</th>
            <th className={styles.check}>Filterable</th>
            <th className={styles.check}>Facetable</th>
            <th className={styles.check}>Sortable</th>
            <th className={styles.num} title="Relevance weight, typically 0.5 to 3.">Weight</th>
          </TableHeader>
          <tbody>
            {fields.map(f => (
              <TableRow key={f.name}>
                <td><span className={styles.fieldName}>{f.name}<span className={styles.type}>{f.type}{TYPE_ICON[f.type]}</span></span></td>
                <td className={styles.check}><Checkbox aria-label={`${f.name}: words`} checked={f.words} onChange={e => setField(f.name, { words: e.target.checked })} /></td>
                <td className={styles.check}><Checkbox aria-label={`${f.name}: pattern`} checked={f.pattern} onChange={e => setField(f.name, { pattern: e.target.checked })} /></td>
                <td className={styles.profileCol}>
                  {searched(f)
                    ? <Select size="micro" variant="ghost" aria-label={`${f.name}: profile`} value={f.profile}
                        onValueChange={v => setField(f.name, { profile: v })}
                        options={profiles.map(p => ({ label: `${p.name} · ${strictnessShort(p.strictness)}`, value: p.id }))} />
                    : <span className={styles.faint}>Not searched</span>}
                </td>
                <td className={styles.check}><Checkbox aria-label={`${f.name}: filterable`} checked={f.filterable} onChange={e => setField(f.name, { filterable: e.target.checked })} /></td>
                <td className={styles.check}><Checkbox aria-label={`${f.name}: facetable`} checked={f.facetable} onChange={e => setField(f.name, { facetable: e.target.checked })} /></td>
                <td className={styles.check}><Checkbox aria-label={`${f.name}: sortable`} checked={f.sortable} onChange={e => setField(f.name, { sortable: e.target.checked })} /></td>
                <td className={styles.num}>
                  <input className={styles.numInput} type="number" min={0} step={0.1} value={f.weight} disabled={!searched(f)}
                    aria-label={`${f.name}: weight`} onChange={e => setField(f.name, { weight: Number(e.target.value) })} />
                </td>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </section>

      <section className={styles.section}>
        <div className={styles.toolbar}>
          <h2 className={styles.heading}>Profiles</h2>
          <Button iconLeft={<Plus />} size="micro"
            onClick={() => setEditing({ id: '', name: '', about: '', strictness: 'ldd1', weight: 1, wholeQuery: true, joinedWords: true, prefixSuffix: true })}>
            New profile
          </Button>
        </div>
        <Table aria-label="Profiles">
          <TableHeader>
            <th>Profile</th>
            <th>Typos</th>
            <th className={styles.num}>Weight</th>
            <th>Also counts</th>
            <th>Used by</th>
            <th className={styles.editCol}><span className={styles.visuallyHidden}>Edit</span></th>
          </TableHeader>
          <tbody>
            {profiles.map(p => {
              const used = usedBy(p.id);
              return (
                <TableRow key={p.id}>
                  <td>
                    <div className={styles.profileName}>{p.name}{p.builtIn && <Chip>Built in</Chip>}</div>
                    <div className={styles.faint}>{p.about}</div>
                  </td>
                  <td>{strictnessShort(p.strictness)}</td>
                  <td className={styles.num}>{p.strictness === 'none' ? '' : p.weight}</td>
                  <td className={styles.faint}>{p.strictness === 'none' ? '' : steps(p)}</td>
                  <td>{used.length ? used.join(', ') : <span className={styles.faint}>No fields</span>}</td>
                  <td className={styles.editCol}>
                    <Button variant="ghost" size="micro" iconLeft={<Compose />} aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>Edit</Button>
                  </td>
                </TableRow>
              );
            })}
          </tbody>
        </Table>
        <p className={styles.note}>
          Each profile is the library's FieldCoverage for its fields. How long the result list is, and how deep
          Coverage reads, stay dataset settings (automatic depth to come).
        </p>
      </section>

      {editing && (
        <ProfileModal key={editing.id || 'new'} profile={editing} usedBy={editing.id ? usedBy(editing.id) : []}
          open onOpenChange={o => { if (!o) setEditing(null); }}
          onSave={saveProfile}
          onDelete={editing.id ? () => { setProfiles(ps => ps.filter(x => x.id !== editing.id)); setEditing(null); } : undefined} />
      )}

      <SaveBar visible={dirty} message="Fields or profiles changed. Saving rebuilds the index in the background.">
        <Button onClick={() => setSaved({ fields, profiles })}>Save</Button>
        <Button variant="secondary" onClick={() => { setFields(saved.fields); setProfiles(saved.profiles); }}>Cancel</Button>
      </SaveBar>
    </main>
  );
}
