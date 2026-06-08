import '@indxsearch/systm/styles.css';
import '@indxsearch/intrface/styles.css';
import './globals.css';
import { SearchClient } from './SearchClient';
import {
  ActiveFiltersPanel,
  ValueFilterPanel,
  RangeFilterPanel,
  SortByPanel,
  SearchSettingsPanel,
  SearchResultRow,
} from '@indxsearch/intrface';
import { Chip } from '@indxsearch/systm';
import { Spark } from '@indxsearch/pixl';

const fields = ['name', 'is_legendary', 'type1', 'type2', 'hp', 'speed', 'attack', 'abilities'];

const filters = (
  <>
    <ActiveFiltersPanel />
    <SortByPanel displayType="radio" />
    <SortByPanel startCollapsed={true} />
    <ValueFilterPanel label="Primary type" layout="grid" field="type1" preserveBlankFacetState={true} preserveBlankFacetStateOrder={false} displayType="button" limit={30} />
    <ValueFilterPanel
      label="Secondary type"
      displayCondition={({ filters}) => {
        return (
          (filters.type1 || []).includes('water') ||
          (filters.type1 || []).includes('fire')
        );
      }}
      field="type2"
      startCollapsed={true}
      displayType="button"
      layout="grid"
    />
    <ValueFilterPanel label="Legendary" field="is_legendary" preserveBlankFacetState={true} displayType="toggle" />
    <RangeFilterPanel label="Speed" field="speed" displayType="slider" expectedMin={5} expectedMax={180} />
    <RangeFilterPanel label="Attack" field="attack" displayType="slider" startCollapsed={true} showHistogram />
    <RangeFilterPanel label="HP" field="hp" displayType="slider" startCollapsed={true} />
    <ValueFilterPanel label="Speed" field="speed" displayType="button" preserveBlankFacetStateOrder={false} sortFacetsBy="numeric" startCollapsed={true} />
    <ValueFilterPanel label="Attack" field="attack" layout="grid" startCollapsed={true} showCount={true} />
    <ValueFilterPanel label="HP" startCollapsed={true} field="hp" />
    <SearchSettingsPanel />
  </>
);

const renderResult = (item: any) => (
  <>
    <SearchResultRow variant="title">
      {item.name}
      {item.is_legendary && <Spark color="gold" size={14} />}
      {item.type1 && <Chip>{item.type1}</Chip>}
      {item.type2 && <Chip>{item.type2}</Chip>}
    </SearchResultRow>
    {Array.isArray(item.abilities) && item.abilities.length > 0 && (
      <SearchResultRow>
        Abilities:{' '}
        {item.abilities.map((ability: string, idx: number) => (
          <Chip key={`${ability}-${idx}`}>{ability}</Chip>
        ))}
      </SearchResultRow>
    )}
    <SearchResultRow>
      {typeof item.hp === 'number' && <Chip>HP: {item.hp}</Chip>}
      {typeof item.speed === 'number' && <Chip>Speed: {item.speed}</Chip>}
      {typeof item.attack === 'number' && <Chip>Attack: {item.attack}</Chip>}
    </SearchResultRow>
  </>
);

export default function App() {
  return (
    <SearchClient
      dataset="pokedex"
      fields={fields}
      filters={filters}
      renderResult={renderResult}
    />
  );
}
