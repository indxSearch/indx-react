import '@indxsearch/systm/styles.css';
import '@indxsearch/intrface/styles.css';
import './globals.css';
import React, { useState } from 'react';
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
  const [tab, setTab] = useState<'text' | 'hybrid'>('text');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.4rem 1rem',
    cursor: 'pointer',
    color: active ? 'var(--lv8)' : 'var(--lv5)',
    background: 'none',
    border: 'none',
    borderBottom: active ? '2px solid var(--lv8)' : '2px solid transparent',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem 1.5rem 0', borderBottom: '1px solid var(--lv2)' }}>
        <button style={tabStyle(tab === 'text')} onClick={() => setTab('text')}>Text search</button>
        <button style={tabStyle(tab === 'hybrid')} onClick={() => setTab('hybrid')}>Hybrid / Vector</button>
      </div>

      <SearchClient
        dataset="pokedex"
        fields={fields}
        filters={filters}
        renderResult={renderResult}
        activeTab={tab}
      />
    </div>
  );
}
