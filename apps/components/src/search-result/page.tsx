import { SearchResult, SearchResultRow, SearchResultsSkeleton } from '@indxsearch/intrface';
import { Chip, Base } from '@indxsearch/systm';
import { Spark } from '@indxsearch/pixl';
import styles from './page.module.css';

const results = [
  { name: 'Charizard', is_legendary: false, type1: 'fire', type2: 'flying', abilities: ['blaze', 'solar-power'], hp: 78, speed: 100, attack: 84, description: 'Spits fire that is hot enough to melt boulders.' },
  { name: 'Bulbasaur', is_legendary: false, type1: 'grass', type2: 'poison', abilities: ['overgrow', 'chlorophyll'], hp: 45, speed: 45, attack: 49, description: 'A strange seed was planted on its back at birth.' },
  { name: 'Mewtwo', is_legendary: true, type1: 'psychic', type2: '', abilities: ['pressure', 'unnerve'], hp: 106, speed: 130, attack: 110, description: 'A Pokémon created by recombinating Mew\'s genes.' },
];

function ResultCard({ item }: { item: typeof results[0] }) {
  return (
    <>
      <SearchResultRow variant="title">
        {item.name}
        {item.is_legendary && <Spark color="gold" size={14} />}
        {item.type1 && <Chip>{item.type1}</Chip>}
        {item.type2 && <Chip>{item.type2}</Chip>}
      </SearchResultRow>
      {item.abilities.length > 0 && (
        <SearchResultRow>
          Abilities: {item.abilities.map((a) => <Chip key={a}>{a}</Chip>)}
        </SearchResultRow>
      )}
      <SearchResultRow>
        <Chip>HP: {item.hp}</Chip>
        <Chip>Speed: {item.speed}</Chip>
        <Chip>Attack: {item.attack}</Chip>
      </SearchResultRow>
      <SearchResultRow>{item.description}</SearchResultRow>
    </>
  );
}

export default function SearchResultPage() {
  return (
    <main className={styles.main}>
      <div className={styles.section}>
        <h1 className={styles.title}>SearchResult</h1>
        <p className={styles.desc}>
          Row wrapper with padding, border, index, score, and skeleton support.
          Use <code>SearchResultRow</code> inside to compose title, tags, and body rows.
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
          <h2 className={styles.heading}>SearchResultRow variants</h2>
          <Base>
            <SearchResult>
              <SearchResultRow variant="title">Title row — text-base, lv8</SearchResultRow>
              <SearchResultRow>Default row — text-xs, lv5 — tags fit here: <Chip>one</Chip><Chip>two</Chip></SearchResultRow>
              <SearchResultRow>Description row — plain text, same default style</SearchResultRow>
            </SearchResult>
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
