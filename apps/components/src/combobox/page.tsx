import { useState } from 'react';
import { Combobox } from '@indxsearch/systm';
import { Database, Users } from '@indxsearch/pixl';
import styles from './page.module.css';

// The pokedex dataset's 42 fields: the length of list a Select stops being good at.
const FIELDS = ['id', 'abilities', 'against_bug', 'against_dark', 'against_dragon', 'against_electric', 'against_fairy', 'against_fight',
  'against_fire', 'against_flying', 'against_ghost', 'against_grass', 'against_ground', 'against_ice', 'against_normal', 'against_poison',
  'against_psychic', 'against_rock', 'against_steel', 'against_water', 'attack', 'base_egg_steps', 'base_happiness', 'base_total',
  'capture_rate', 'classfication', 'defense', 'experience_growth', 'height_m', 'hp', 'japanese_name', 'name', 'percentage_male',
  'pokedex_number', 'sp_attack', 'sp_defense', 'speed', 'type1', 'type2', 'weight_kg', 'generation', 'is_legendary'];

const datasets = ['pokedex', 'ecom', 'millum', 'bellgmappa', 'IndxDocsChunks', 'IndxDocs500', 'gyldendal-agency', 'gyldendal-sanity', 'tmdb23k', 'norsk skoleregister', 'esci', 'IndxDocsCloud'];

export default function ComboboxPage() {
  const [field, setField] = useState('type1');
  const [dataset, setDataset] = useState('');
  const [team, setTeam] = useState('indx-intern');
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>Combobox</h1>
        <p className={styles.desc}>
          A Select you can type into, for a list too long to scroll: a field, a dataset, a team. Closed it is a Select;
          open, a search box sits over the options. Typing narrows them, labels that start with it first; the arrows move
          the highlight, Enter chooses and Escape closes. A host with a better search passes search, as the console does with Indx.
        </p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>A long list</h2>
        <div className={styles.field}>
          <Combobox label="Field" value={field} onValueChange={setField} options={FIELDS.map(f => ({ label: f, value: f }))} searchPlaceholder="Search the fields" />
        </div>
        <p className={styles.note}>Chosen: <code>{field}</code></p>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Placeholder and icons</h2>
        <div className={styles.field}>
          <Combobox label="Dataset" value={dataset} onValueChange={setDataset} placeholder="Choose a dataset"
                    options={datasets.map(d => ({ label: d, value: d, icon: <Database /> }))} />
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.heading}>Micro</h2>
        <div className={styles.fieldNarrow}>
          <Combobox size="micro" aria-label="Team" value={team} onValueChange={setTeam}
                    options={['indx-intern', 'gyldendal', 'millum', 'demo'].map(t => ({ label: t, value: t, icon: <Users /> }))} />
        </div>
      </div>
    </main>
  );
}
