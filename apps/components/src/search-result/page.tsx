import { SearchResult, SearchResultsSkeleton } from '@indxsearch/intrface';
import { Tag, Base } from '@indxsearch/systm';
import { Spark } from '@indxsearch/pixl';
import styles from './page.module.css';

const results = [
  { name: 'Charizard', is_legendary: false, type1: 'fire', type2: 'flying', abilities: ['blaze', 'solar-power'], hp: 78, speed: 100, attack: 84 },
  { name: 'Bulbasaur', is_legendary: false, type1: 'grass', type2: 'poison', abilities: ['overgrow', 'chlorophyll'], hp: 45, speed: 45, attack: 49 },
  { name: 'Mewtwo', is_legendary: true, type1: 'psychic', type2: '', abilities: ['pressure', 'unnerve'], hp: 106, speed: 130, attack: 110 },
];

function ResultCard({ item }: { item: typeof results[0] }) {
  return (
    <div>
      <div className={styles.resultTitle}>
        {item.name}
        {item.is_legendary && <Spark color="gold" size={14} />}
        {item.type1 && <Tag>{item.type1}</Tag>}
        {item.type2 && <Tag>{item.type2}</Tag>}
      </div>
      {item.abilities.length > 0 && (
        <div>
          Abilities:{' '}
          {item.abilities.map((a) => <Tag key={a}>{a}</Tag>)}
        </div>
      )}
      <div>
        Stats: <Tag>HP: {item.hp}</Tag><Tag>Speed: {item.speed}</Tag><Tag>Attack: {item.attack}</Tag>
      </div>
    </div>
  );
}

export default function SearchResultPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SearchResult</h1>
        <p className={styles.desc}>
          Single result row. Use <code>skeleton</code> for the loading state.
          <code>SearchResultsSkeleton</code> renders multiple skeleton rows.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.demo}>
          <h2 className={styles.heading}>Loaded results</h2>
          <Base>
            {results.map((item, i) => (
              <SearchResult key={i} index={i}>
                <ResultCard item={item} />
              </SearchResult>
            ))}
          </Base>
        </div>

        <div className={styles.demo}>
          <h2 className={styles.heading}>Skeleton</h2>
          <Base>
            <SearchResultsSkeleton rows={3} />
          </Base>
        </div>
      </div>
    </main>
  );
}
