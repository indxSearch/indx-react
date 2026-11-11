import { useState, type ReactNode } from 'react';
import {
  Button, Checkbox, Chip, Disclosure, InputField, Modal, SaveBar, SegmentedControl, Select, Table, TableHeader, TableRow, ScrubSlider, Slider, ToggleSwitch, Tooltip,
} from '@indxsearch/systm';
import { Array as ArrayIcon, Compose, Delete, Field as FieldIcon, Number as NumberIcon, Warning, Plus, String as StringIcon } from '@indxsearch/pixl';
import { Field_profile_template as ProfileIcon } from './pixl-preview';
import styles from './page.module.css';

// A mockup: field profiles for IndxServer's Fields section, on the 6.0 field API (fastmaster,
// Nov 2026). The table is the field API as it reads in C#: WordMatching and PatternMatching say
// that and how a field is searched, then its roles and BM25F weight. A searched field takes a
// profile: its per-field search settings under a name many fields share (PatternMatchingSetup,
// Tolerance, RerankWeight and case). What 6.0 made query-wide (joined words, the
// whole query floor, how far typos widen, the typing prefix) stays in the dataset's query
// parameters, its own tab. Nothing talks to a server.

type Tolerance = 'Exact' | 'OneEdit' | 'TwoEdits';
/** PatternMatchingSetup, as the library names it: the piece lengths (IndexSizes), and how many
 *  anchor characters mark the start and the end of the text. [3] with two at the start is the
 *  default; [2, 3] the old IndexerSetup.Dense; [2, 3] with one at the end its SingleWord, for codes. */
interface PatternSetup { indexSizes: '3' | '2,3'; start: number; stop: number; }
const DEFAULT_PATTERN: PatternSetup = { indexSizes: '3', start: 2, stop: 0 };
/** Field.TextNormalizer's folding of accents and national letters ("grå" to "gra"): one-way, the
 *  library's default, keeps both forms searchable; two-way keeps the folded form only; none folds
 *  nothing. Set on a field before Load, and not saved with the field configuration yet. */
type Normalizer = 'oneWay' | 'twoWay' | 'none';

/** A searched field's settings under a name. */
interface Profile {
  id: string;
  name: string;
  about: string;
  /** PatternMatchingSetup, read where the field has PatternMatching on. */
  pattern: PatternSetup;
  tolerance: Tolerance;
  /** Field.RerankWeight: what a character confirmed in the field counts. 0 leaves it out. */
  rerankWeight: number;
  caseSensitive: boolean;
  normalizer: Normalizer;
  builtIn?: boolean;
}

interface FieldRow {
  name: string;
  /** The field's type as the engine reports it (FieldProxy.FieldType, IsArray). */
  type: 'String' | 'Array' | 'Number';
  /** Field.WordMatching: by its words, and in the word lookup. */
  wordMatching: boolean;
  /** Field.PatternMatching: inside words, by pieces of letters. */
  patternMatching: boolean;
  /** The profile's id, read while the field is searched. */
  profile: string;
  filterable: boolean;
  facetable: boolean;
  sortable: boolean;
  /** Field.Weight, BM25F's. */
  weight: number;
}

type View = 'fields' | 'profiles';
/** Four ways to reach the profiles, for comparing: A a table under its own tab, edited in a modal;
 *  B cards under its own tab, edited where they stand; C no tab, each field's profile edited from
 *  the button beside its Profile menu, a new one from New profile; D a table under its own tab,
 *  edited in its cells. */
type Variant = 'table' | 'cards' | 'inline' | 'grid';
const BLANK_PROFILE: Profile = { id: '', name: '', about: '', pattern: DEFAULT_PATTERN, tolerance: 'OneEdit', rerankWeight: 1, caseSensitive: false, normalizer: 'oneWay' };


const TOLERANCE: { value: Tolerance; label: string; about: string }[] = [
  { value: 'Exact', label: 'Exact', about: 'No typos: words must match as written. For codes, numbers and long text, where a typo confirms the wrong record.' },
  { value: 'OneEdit', label: 'OneEdit', about: 'One typo: a letter added, dropped or changed, or two neighbours swapped. From three letters.' },
  { value: 'TwoEdits', label: 'TwoEdits', about: 'Two typos, from six letters. For titles and names people misspell.' },
];

const BUILT_IN: Profile[] = [
  { id: 'title', name: 'Title', about: 'Titles and product names: the most forgiving.', pattern: { indexSizes: '2,3', start: 2, stop: 0 }, tolerance: 'TwoEdits', rerankWeight: 1, caseSensitive: false, normalizer: 'oneWay', builtIn: true },
  { id: 'name', name: 'Name', about: 'People and brands.', pattern: DEFAULT_PATTERN, tolerance: 'OneEdit', rerankWeight: 1, caseSensitive: false, normalizer: 'oneWay', builtIn: true },
  { id: 'category', name: 'Category', about: 'Categories, tags and other short labels.', pattern: DEFAULT_PATTERN, tolerance: 'OneEdit', rerankWeight: 0.8, caseSensitive: false, normalizer: 'oneWay', builtIn: true },
  { id: 'code', name: 'Code', about: 'ISBNs, SKUs and article numbers: exact, a whole code first.', pattern: { indexSizes: '2,3', start: 2, stop: 1 }, tolerance: 'Exact', rerankWeight: 1, caseSensitive: false, normalizer: 'oneWay', builtIn: true },
  { id: 'text', name: 'Text', about: 'Descriptions and other long text: its words, exactly.', pattern: DEFAULT_PATTERN, tolerance: 'Exact', rerankWeight: 0.5, caseSensitive: false, normalizer: 'oneWay', builtIn: true },
];

const FIELDS: FieldRow[] = [
  { name: 'title', type: 'String', wordMatching: true, patternMatching: true, profile: 'title', filterable: false, facetable: false, sortable: true, weight: 3 },
  { name: 'authors', type: 'Array', wordMatching: true, patternMatching: true, profile: 'name', filterable: true, facetable: true, sortable: false, weight: 2 },
  { name: 'series', type: 'String', wordMatching: true, patternMatching: true, profile: 'title', filterable: true, facetable: false, sortable: false, weight: 1.5 },
  { name: 'isbn', type: 'Array', wordMatching: true, patternMatching: true, profile: 'code', filterable: true, facetable: false, sortable: false, weight: 1.5 },
  { name: 'categories', type: 'Array', wordMatching: true, patternMatching: false, profile: 'category', filterable: true, facetable: true, sortable: false, weight: 1 },
  { name: 'description', type: 'String', wordMatching: true, patternMatching: false, profile: 'text', filterable: false, facetable: false, sortable: false, weight: 0.4 },
  { name: 'format', type: 'String', wordMatching: false, patternMatching: false, profile: 'category', filterable: true, facetable: true, sortable: false, weight: 1 },
  { name: 'publishedYear', type: 'Number', wordMatching: false, patternMatching: false, profile: 'code', filterable: true, facetable: true, sortable: true, weight: 1 },
];

const TYPE_ICON = { String: <StringIcon size={14} />, Array: <ArrayIcon size={14} />, Number: <NumberIcon size={14} /> };

const searched = (f: FieldRow) => f.wordMatching || f.patternMatching;
const toleranceLabel = (t: Tolerance) => TOLERANCE.find(x => x.value === t)!.label;
const NORMALIZER_LABEL: Record<Normalizer, string> = { oneWay: 'One-way', twoWay: 'Two-way', none: 'None' };
const patternLabel = (x: PatternSetup) => `[${x.indexSizes.replace(',', ', ')}] · start ${x.start} · stop ${x.stop}`;
const textLabel = (p: Profile) =>
  [p.caseSensitive && 'Case-sensitive', p.normalizer !== 'oneWay' && NORMALIZER_LABEL[p.normalizer]].filter(Boolean).join(', ') || 'Default';

/** What a field's search costs to change. How it is matched and its text read are built into the
 *  index; its tolerance and rerank weight are read at every search. Not searched, nothing of the
 *  profile is read. */
const rebuildKey = (f: FieldRow, p: Profile | undefined) => !searched(f) ? 'not searched'
  : JSON.stringify([f.wordMatching, f.patternMatching, f.patternMatching && p?.pattern, p?.caseSensitive, p?.normalizer]);

/** A setting's examples, in its label's tooltip: what it does, on searches people make. */
const HELP = {
  tolerance: 'Field.Tolerance: how far a typed word may be from the word in the field. Exact: "poter" does not match Potter. OneEdit: it does, one letter is missing. TwoEdits: "ashwaghanda" matches ashwagandha. One edit from three letters, two from six. A search may lower it, never raise it.',
  rerankWeight: 'Field.RerankWeight: how much a match here counts when the results are reordered, against the heaviest searched field, so only the ratios matter: title 1 and text 0.5 is the same as 4 and 2. With those, "dark knight" in a title ranks above the same words in a description. 0 leaves the fields out of the reranker and the word lookup.',
  patternSetup: 'How PatternMatching cuts the text into pieces. A field with PatternMatching on is scored by pieces of its words as well as whole words. That score orders the records inside each typo level, blended with Coverage, and brings records in for the fallback, Rest and Bm25f mode. In the default mode it does not decide on its own which records match.',
  indexSizes: 'The piece lengths. 3: "potter" gives pot, ott, tte, ter. 2 and 3 adds po, ot, tt, te, er, so short and partial values score better, at about twice the memory.',
  start: 'Anchor pieces at the start of the text, so text that begins with what was typed counts more: a name starting with "oslo" above one with "oslo" inside it. 2 is the default; 0 turns it off.',
  stop: 'The same at the end of the text. With both, a whole value outranks a longer one containing it: "1234" ranks 1234 above 91234 and 12345. For codes; 0 is the default.',
  normalizer: 'Field.TextNormalizer: how accents and national letters are folded before matching. One-way, the library\'s default: both forms are searchable, so "gra" finds grå and "grå" still means grå. Two-way: only the folded form is kept, so "grå" and "gra" are the same search, using less memory. None: as written, "gra" does not find grå.',
  caseSensitive: 'Field.CaseSensitive. Off: "us" finds US and us. On: "US" finds only US. For codes where the case means something, such as product variants.',
};

/** A label that explains itself: dotted underlined, its examples in a tooltip on the label, as the
 *  console's hinted labels (.indx-stat-label--hint, systm's Stat hint). */
function Hinted({ text, children }: { text: string; children: ReactNode }) {
  return (
    <Tooltip content={text}>
      <span className={styles.hinted} tabIndex={0}>{children}</span>
    </Tooltip>
  );
}

/** A profile's settings as controls: the editor, in the modal (A, C) and in an open card (B).
 *  <c>before</c> is the profile as saved, for saying what a change costs; none for a new one. */
function ProfileForm({ value, before, onChange, usedBy, usedByPattern }: {
  value: Profile;
  before?: Profile;
  onChange: (p: Profile) => void;
  usedBy: string[];
  /** The fields among them with PatternMatching on, the ones that read the pieces. */
  usedByPattern: string[];
}) {
  const set = <K extends keyof Profile>(key: K, v: Profile[K]) => onChange({ ...value, [key]: v });
  const setPattern = (change: Partial<PatternSetup>) => onChange({ ...value, pattern: { ...value.pattern, ...change } });
  const rebuilds = !!before && ((usedByPattern.length > 0 && JSON.stringify(value.pattern) !== JSON.stringify(before.pattern))
    || (usedBy.length > 0 && value.caseSensitive !== before.caseSensitive || value.normalizer !== before.normalizer));
  const instant = !!before && usedBy.length > 0 && !rebuilds && (value.tolerance !== before.tolerance || value.rerankWeight !== before.rerankWeight);

  return (
    <>
      <InputField label="Name" value={value.name} onChange={e => set('name', e.target.value)} disabled={value.builtIn} />
      <InputField label="Description" value={value.about} onChange={e => set('about', e.target.value)} />

      <fieldset className={styles.group}>
        <legend className={styles.legend}><Hinted text={HELP.tolerance}>Tolerance</Hinted></legend>
        {/* The edits as a step slider: 0, 1, 2, the names of the steps under them. */}
        <div className={styles.steps}>
          <Slider min={0} max={2} step={1} stepMarks="below" value={TOLERANCE.findIndex(t => t.value === value.tolerance)}
            label="Tolerance" onChange={v => set('tolerance', TOLERANCE[v as number].value)} />
          <div className={styles.stepLabels}>
            {TOLERANCE.map(t => <span key={t.value} className={t.value === value.tolerance ? styles.stepOn : undefined}>{t.label}</span>)}
          </div>
        </div>
        <p className={styles.hint}>{TOLERANCE.find(t => t.value === value.tolerance)!.about}</p>
      </fieldset>

      {/* No maximum, as in the library: the weight counts against the heaviest field's, so only the
          ratios matter, and the scrub slider has no end either. */}
      <div className={styles.steps}>
        <div>
          <div className={styles.toggleLabel}><Hinted text={HELP.rerankWeight}>RerankWeight</Hinted></div>
          <div className={styles.hint}>How much a match here counts when the results are reordered, against the heaviest field.</div>
        </div>
        <ScrubSlider aria-label="RerankWeight" min={0} step={0.1} value={value.rerankWeight}
          marks={[{ value: 0, tone: 'warning', label: 'these fields confirm no words' }]}
          onChange={v => set('rerankWeight', Math.max(0, Math.round(v * 10) / 10))} />
      </div>


      {value.rerankWeight === 0 && (
        <p className={styles.warning}>
          <Warning size={14} />
          At 0 these fields confirm no words: a word found only here is no match, and the fields count through BM25F alone.
        </p>
      )}

      {/* Everything a searched field has besides its typos and its weight, behind one disclosure:
          none of it is wrong to leave alone, and all of it rebuilds the index. */}
      <Disclosure summary="Advanced" defaultOpen={JSON.stringify(value.pattern) !== JSON.stringify(DEFAULT_PATTERN) || value.caseSensitive || value.normalizer !== 'oneWay'}>
        <div className={styles.advanced}>
          <fieldset className={styles.group}>
            <legend className={styles.legend}><Hinted text={HELP.patternSetup}>PatternMatchingSetup</Hinted></legend>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}><Hinted text={HELP.indexSizes}>IndexSizes</Hinted></div>
              <SegmentedControl aria-label="IndexSizes" value={value.pattern.indexSizes} onChange={v => setPattern({ indexSizes: v })}
                items={[{ value: '3', label: '3' }, { value: '2,3', label: '2 and 3' }]} />
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}><Hinted text={HELP.start}>NumberOfStartCharacters</Hinted></div>
              <SegmentedControl aria-label="NumberOfStartCharacters" value={String(value.pattern.start)} onChange={v => setPattern({ start: Number(v) })}
                items={['0', '1', '2'].map(n => ({ value: n, label: n }))} />
            </div>
            <div className={styles.toggleRow}>
              <div className={styles.toggleLabel}><Hinted text={HELP.stop}>NumberOfStopCharacters</Hinted></div>
              <SegmentedControl aria-label="NumberOfStopCharacters" value={String(value.pattern.stop)} onChange={v => setPattern({ stop: Number(v) })}
                items={['0', '1'].map(n => ({ value: n, label: n }))} />
            </div>
            <p className={styles.hint}>
              {usedByPattern.length > 0
                ? `Read by the fields with PatternMatching on: ${usedByPattern.join(', ')}.`
                : 'None of its fields has PatternMatching on, so this does nothing yet.'}
            </p>
          </fieldset>

          <fieldset className={styles.group}>
            <legend className={styles.legend}>Text</legend>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}><Hinted text={HELP.caseSensitive}>CaseSensitive</Hinted></div>
                <div className={styles.hint}>Capitals and small letters are different words.</div>
              </div>
              <ToggleSwitch checked={value.caseSensitive} onChange={v => set('caseSensitive', v)} aria-label="CaseSensitive" />
            </div>
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}><Hinted text={HELP.normalizer}>TextNormalizer</Hinted></div>
                <div className={styles.hint}>How accents and national letters are folded: "grå" to "gra".</div>
              </div>
              <SegmentedControl aria-label="TextNormalizer" value={value.normalizer} onChange={v => set('normalizer', v)}
                items={(['oneWay', 'twoWay', 'none'] as Normalizer[]).map(n => ({ value: n, label: NORMALIZER_LABEL[n] }))} />
            </div>
            {value.normalizer !== 'oneWay' && (
              <p className={styles.hint}>The library does not save a field's own TextNormalizer yet: after a restart the field folds one-way again.</p>
            )}
          </fieldset>
        </div>
      </Disclosure>

      {usedBy.length > 0 && (
        <p className={styles.hint}>
          Used by {usedBy.join(', ')}. {rebuilds ? 'Saving rebuilds the index in the background.' : instant ? 'Takes effect at the next search.' : 'A change applies to all of them.'}
        </p>
      )}
    </>
  );
}

/** The profile editor as a modal, for a new profile and an existing one (variants A and C). */
function ProfileModal({ profile, usedBy, usedByPattern, open, onOpenChange, onSave, onDelete }: {
  profile: Profile;
  usedBy: string[];
  usedByPattern: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (p: Profile) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState(profile);
  const isNew = !profile.name;

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isNew ? 'New profile' : `Edit ${profile.name}`}
      description="The search settings of the fields that use this profile.">
      <div className={styles.form}>
        <ProfileForm value={draft} before={isNew ? undefined : profile} onChange={setDraft} usedBy={usedBy} usedByPattern={usedByPattern} />
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
  // A long field list leaves the profiles far below it, so the two are views of one page.
  // ?view=fields|profiles opens one, so each can be linked to.
  const [view, setView] = useState<View>(() => {
    const asked = new URLSearchParams(window.location.search).get('view');
    return asked === 'profiles' ? asked : 'fields';
  });
  // ?variant=table|cards|inline picks the variant, so each can be linked to.
  const [variant, setVariant] = useState<Variant>(() => {
    const asked = new URLSearchParams(window.location.search).get('variant');
    return asked === 'cards' || asked === 'inline' || asked === 'grid' ? asked : 'table';
  });
  // Variant B: which cards are open. A new profile is added as a card, open.
  const [openCards, setOpenCards] = useState<Set<string>>(() => new Set());
  const setCardOpen = (id: string, open: boolean) => setOpenCards(s => { const n = new Set(s); if (open) n.add(id); else n.delete(id); return n; });
  const setProfile = (p: Profile) => setProfiles(ps => ps.map(x => x.id === p.id ? p : x));
  const addCard = () => {
    let n = 1;
    while (profiles.some(p => p.id === `profile-${n}`)) n++;
    const id = `profile-${n}`;
    setProfiles(ps => [...ps, { ...BLANK_PROFILE, id, name: 'New profile' }]);
    setCardOpen(id, true);
  };
  // ?edit=<profile id> opens its editor, so the modal can be linked to.
  const [editing, setEditing] = useState<Profile | null>(() => BUILT_IN.find(p => p.id === new URLSearchParams(window.location.search).get('edit')) ?? null);

  const profileOf = (list: Profile[], id: string) => list.find(p => p.id === id);
  const usedBy = (id: string) => fields.filter(f => searched(f) && f.profile === id).map(f => f.name);
  const usedByPattern = (id: string) => fields.filter(f => f.patternMatching && f.profile === id).map(f => f.name);
  const setField = (name: string, change: Partial<FieldRow>) => setFields(fs => fs.map(f => f.name === name ? { ...f, ...change } : f));
  const dirty = JSON.stringify({ fields, profiles }) !== JSON.stringify(saved);

  // What Save costs: a rebuild when how a field is matched or read changed, or a role or its BM25F
  // weight; otherwise the next search reads it.
  const rebuilds = fields.some(f => {
    const before = saved.fields.find(s => s.name === f.name)!;
    return rebuildKey(f, profileOf(profiles, f.profile)) !== rebuildKey(before, profileOf(saved.profiles, before.profile))
      || f.filterable !== before.filterable || f.facetable !== before.facetable || f.sortable !== before.sortable || f.weight !== before.weight;
  });

  const saveProfile = (p: Profile) => {
    const id = p.id || p.name.trim().toLowerCase().replace(/\s+/g, '-');
    setProfiles(ps => ps.some(x => x.id === id) ? ps.map(x => x.id === id ? { ...p, id } : x) : [...ps, { ...p, id }]);
    setEditing(null);
  };

  // A field's Profile menu lists the profiles by name; in variant C the button beside it edits.
  const profileOptions = profiles.map(p => ({ label: p.name, value: p.id }));
  const showFields = variant === 'inline' || view === 'fields';
  const showProfiles = variant !== 'inline' && view === 'profiles';

  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.pageTitle}>Field profiles</h1>
        <p className={styles.desc}>
          A mockup for the Fields section on the 6.0 field API. WordMatching and PatternMatching say how a field is
          searched, as in C#. A searched field takes a profile: its search settings under a name, so a catalogue with
          forty fields is tuned in five places. How the dataset searches as a whole stays in its query parameters.
        </p>
        <div className={styles.variantBar}>
          <span className={styles.faint}>Mockup variant</span>
          <SegmentedControl aria-label="Variant" value={variant} onChange={setVariant}
            items={[
              { value: 'table', label: 'A · Profiles table' },
              { value: 'cards', label: 'B · Profile cards' },
              { value: 'inline', label: 'C · In the field list' },
              { value: 'grid', label: 'D · Edit in the table' },
            ]} />
        </div>
        {variant !== 'inline' && (
          <SegmentedControl aria-label="View" value={view} onChange={setView}
            items={[
              { value: 'fields', label: 'Fields', icon: <FieldIcon size={14} color="currentColor" /> },
              { value: 'profiles', label: 'Profiles', icon: <ProfileIcon size={14} color="currentColor" /> },
            ]} />
        )}
      </div>

      {showFields && <section className={styles.section}>
        <div className={styles.toolbar}>
          <h2 className={styles.heading}><FieldIcon size={21} />Fields</h2>
          {variant === 'inline' && (
            <Button iconLeft={<Plus />} size="micro" onClick={() => setEditing(BLANK_PROFILE)}>New profile</Button>
          )}
        </div>
        <Table scrollable stickyFirstColumn aria-label="Field configuration">
          <TableHeader>
            <th>Field and type</th>
            <th className={styles.check} title="Field.WordMatching: by its words, fast and exact up to the profile's tolerance.">WordMatching</th>
            <th className={styles.check} title="Field.PatternMatching: inside words, by pieces of letters. Parts of words and compounds; costs memory.">PatternMatching</th>
            <th className={styles.profileCol} title={variant === 'inline' ? "The searched field's settings. The button beside the menu edits them." : "The searched field's settings. Edit them under Profiles."}>Profile</th>
            <th className={styles.check}>Filterable</th>
            <th className={styles.check}>Facetable</th>
            <th className={styles.check}>Sortable</th>
            <th className={styles.num} title="Field.Weight: BM25F's, typically 0.5 to 3.">Weight</th>
          </TableHeader>
          <tbody>
            {fields.map(f => (
              <TableRow key={f.name}>
                <td><span className={styles.fieldName}>{f.name}<span className={styles.type}>{f.type}{TYPE_ICON[f.type]}</span></span></td>
                <td className={styles.check}><Checkbox aria-label={`${f.name}: WordMatching`} checked={f.wordMatching} onChange={e => setField(f.name, { wordMatching: e.target.checked })} /></td>
                <td className={styles.check}><Checkbox aria-label={`${f.name}: PatternMatching`} checked={f.patternMatching} onChange={e => setField(f.name, { patternMatching: e.target.checked })} /></td>
                <td className={styles.profileCol}>
                  {searched(f)
                    ? <span className={styles.profileCell}>
                        <Select size="micro" variant="ghost" aria-label={`${f.name}: profile`} value={f.profile}
                          onValueChange={v => setField(f.name, { profile: v })} options={profileOptions} />
                        {/* Variant C: the profile is edited from the field that uses it. */}
                        {variant === 'inline' && (
                          <Button variant="ghost" size="micro" iconLeft={<Compose />}
                            aria-label={`Edit ${profileOf(profiles, f.profile)?.name ?? 'profile'}, the profile of ${f.name}`}
                            title={`Edit ${profileOf(profiles, f.profile)?.name ?? 'profile'}`}
                            onClick={() => setEditing(profileOf(profiles, f.profile) ?? null)} />
                        )}
                      </span>
                    : <span className={styles.groupNote}>Not searched</span>}
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
      </section>}

      {showProfiles && <section className={styles.section}>
        <div className={styles.toolbar}>
          <h2 className={styles.heading}><ProfileIcon size={21} />Profiles</h2>
          <Button iconLeft={<Plus />} size="micro"
            onClick={() => variant === 'cards' || variant === 'grid' ? addCard() : setEditing(BLANK_PROFILE)}>
            New profile
          </Button>
        </div>
        {variant === 'table' && (
          <Table aria-label="Profiles">
            <TableHeader>
              <th>Profile</th>
              <th>Tolerance</th>
              <th className={styles.num}>RerankWeight</th>
              <th>PatternMatchingSetup</th>
              <th>Text</th>
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
                    <td>{toleranceLabel(p.tolerance)}</td>
                    <td className={styles.num}>{p.rerankWeight === 0 ? <span className={styles.faint}>Left out</span> : p.rerankWeight}</td>
                    <td className={styles.faint}>{patternLabel(p.pattern)}</td>
                    <td className={styles.faint}>{textLabel(p)}</td>
                    <td>{used.length ? used.join(', ') : <span className={styles.faint}>No fields</span>}</td>
                    <td className={styles.editCol}>
                      <Button variant="ghost" size="micro" iconLeft={<Compose />} aria-label={`Edit ${p.name}`} onClick={() => setEditing(p)}>Edit</Button>
                    </td>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}
        {/* D: the table is the editor. Every cell is its control, the working copy changes as it is
            edited and is saved with the fields from the bar. */}
        {variant === 'grid' && (
          <Table scrollable stickyFirstColumn aria-label="Profiles">
            <TableHeader>
              <th>Profile</th>
              <th title="Field.Tolerance: the most a word may differ by in these fields.">Tolerance</th>
              <th className={styles.num} title="Field.RerankWeight: 0 leaves the fields out of the reranker.">RerankWeight</th>
              <th title="PatternMatchingSetup, read by the fields with PatternMatching on. Edited in the modal.">PatternMatchingSetup</th>
              <th className={styles.check} title="Field.CaseSensitive: built into the index.">CaseSensitive</th>
              <th>Used by</th>
              <th className={styles.editCol}><span className={styles.visuallyHidden}>Delete</span></th>
            </TableHeader>
            <tbody>
              {profiles.map(p => {
                const used = usedBy(p.id);
                const set = <K extends keyof Profile>(key: K, v: Profile[K]) => setProfile({ ...p, [key]: v });
                return (
                  <TableRow key={p.id}>
                    <td className={styles.gridName}>
                      {p.builtIn
                        ? <div className={styles.profileName}>{p.name}<Chip>Built in</Chip></div>
                        : <InputField variant="borderBottom" aria-label="Name" value={p.name} onChange={e => set('name', e.target.value)} />}
                      <InputField variant="borderBottom" aria-label={`${p.name}: description`} className={styles.gridAbout}
                        value={p.about} placeholder="What it is for" onChange={e => set('about', e.target.value)} />
                    </td>
                    <td>
                      <Select size="micro" variant="ghost" aria-label={`${p.name}: tolerance`} value={p.tolerance}
                        onValueChange={v => set('tolerance', v as Tolerance)} options={TOLERANCE.map(t => ({ label: t.label, value: t.value }))} />
                    </td>
                    <td className={styles.num}>
                      <input className={styles.numInput} type="number" min={0} max={5} step={0.1} value={p.rerankWeight}
                        aria-label={`${p.name}: rerank weight`} onChange={e => set('rerankWeight', Number(e.target.value))} />
                    </td>
                    <td>
                      <span className={styles.faint}>{patternLabel(p.pattern)}</span>
                    </td>
                    <td className={styles.check}>
                      <Checkbox aria-label={`${p.name}: case-sensitive`} checked={p.caseSensitive} onChange={e => set('caseSensitive', e.target.checked)} />
                    </td>
                    <td>{used.length ? used.join(', ') : <span className={styles.faint}>No fields</span>}</td>
                    <td className={styles.editCol}>
                      {!p.builtIn && (
                        <Button variant="ghost" size="micro" iconLeft={<Delete />} aria-label={`Delete ${p.name || 'profile'}`}
                          disabled={used.length > 0} title={used.length > 0 ? 'Move its fields to another profile first' : `Delete ${p.name}`}
                          onClick={() => setProfiles(ps => ps.filter(x => x.id !== p.id))} />
                      )}
                    </td>
                  </TableRow>
                );
              })}
            </tbody>
          </Table>
        )}
        {/* Not a second table: the profiles read as the field configuration does on a phone, a card
            each, its name and what it does on one line, opened for the settings. */}
        {variant === 'cards' && <div className={styles.cards}>
          {profiles.map(p => {
            const used = usedBy(p.id);
            const state = [toleranceLabel(p.tolerance),
              p.rerankWeight === 0 ? 'left out of the reranker' : `RerankWeight ${p.rerankWeight}`,
              `pattern ${patternLabel(p.pattern)}`].join(' · ');
            return (
              <div key={p.id} className={styles.card}>
                <Disclosure open={openCards.has(p.id)} onOpenChange={o => setCardOpen(p.id, o)} summary={
                  <span className={styles.cardSummary}>
                    <span className={styles.cardTitle}>
                      <ProfileIcon size={14} />{p.name || 'Unnamed'}{p.builtIn && <Chip>Built in</Chip>}
                    </span>
                    <span className={styles.cardState}>{state} · {used.length ? `used by ${used.join(', ')}` : 'no fields use it'}</span>
                  </span>
                }>
                  {/* Edited where it stands: the working copy, saved with the fields from the bar. */}
                  <div className={styles.cardForm}>
                    <ProfileForm value={p} before={profileOf(saved.profiles, p.id)} onChange={setProfile}
                      usedBy={used} usedByPattern={usedByPattern(p.id)} />
                    {!p.builtIn && (
                      <div className={styles.actions}>
                        <Button variant="ghost" size="micro" iconLeft={<Delete />} disabled={used.length > 0}
                          title={used.length > 0 ? 'Move its fields to another profile first' : undefined}
                          onClick={() => setProfiles(ps => ps.filter(x => x.id !== p.id))}>Delete {p.name || 'profile'}</Button>
                      </div>
                    )}
                  </div>
                </Disclosure>
              </div>
            );
          })}
        </div>}
        <p className={styles.note}>
          A profile is a searched field's settings in the library under a name: Tolerance, RerankWeight, the
          PatternMatchingSetup, and CaseSensitive. The PatternMatchingSetup and the case are built
          into the index; the tolerance and the rerank weight are read at every search. A field's own normalizer is
          left to the library: it is not saved with the field configuration yet.
        </p>
      </section>}


      {editing && (
        <ProfileModal key={editing.id || 'new'} profile={editing}
          usedBy={editing.id ? usedBy(editing.id) : []} usedByPattern={editing.id ? usedByPattern(editing.id) : []}
          open onOpenChange={o => { if (!o) setEditing(null); }}
          onSave={saveProfile}
          onDelete={editing.id ? () => { setProfiles(ps => ps.filter(x => x.id !== editing.id)); setEditing(null); } : undefined} />
      )}

      <SaveBar visible={dirty} message={rebuilds ? 'Saving rebuilds the index in the background.' : 'Saved changes take effect at the next search.'}>
        <Button onClick={() => setSaved({ fields, profiles })}>Save</Button>
        <Button variant="secondary" onClick={() => { setFields(saved.fields); setProfiles(saved.profiles); }}>Cancel</Button>
      </SaveBar>
    </main>
  );
}
