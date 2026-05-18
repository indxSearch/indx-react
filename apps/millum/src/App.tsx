import '@indxsearch/intrface/styles.css';
import './globals.css';
import React, { useState } from 'react';
import { SearchClient } from './SearchClient';
import {
  ActiveFiltersPanel,
  ValueFilterPanel,
  RangeFilterPanel,
  SortByPanel,
  SearchSettingsPanel
} from '@indxsearch/intrface';

type DatasetKey = 'millum' | 'millum2025';

type DatasetSchema = {
  label: string;
  fields: string[];
  filters: React.ReactNode;
  renderResult: (item: any) => React.ReactNode;
};

// ── millum (original / Norwegian schema) ─────────────────────────────────────
const millumFilters = (
  <>
    <ActiveFiltersPanel />
    <SortByPanel displayType="radio" />
    <ValueFilterPanel
      label="Leverandør"
      field="Leverandør"
      displayType="checkbox"
      preserveBlankFacetState={true}
      sortFacetsBy="alphabetical"
      limit={20}
    />
    <ValueFilterPanel
      label="Produsent/Importør"
      field="Produsent/Importør"
      displayType="checkbox"
      sortFacetsBy="histogram"
      limit={20}
    />
    <SearchSettingsPanel />
  </>
);

const millumRender = (item: any) => (
  <div>
    <div style={{ font: 'var(--text-base)', color: 'var(--lv8)', marginBottom: '0.25rem' }}>
      {item['Navn']}
    </div>
    <div style={{ font: 'var(--text-xs)', color: 'var(--lv5)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {item['Produsent/Importør'] && <span>Produsent: {item['Produsent/Importør']}</span>}
      {item['Leverandør'] && <span>Leverandør: {item['Leverandør']}</span>}
    </div>
  </div>
);

// ── millum2025 (newer English schema with Price) ─────────────────────────────
const millum2025Filters = (
  <>
    <ActiveFiltersPanel />
    <SortByPanel displayType="radio" />
    <RangeFilterPanel
      label="Price"
      field="Price"
      displayType="slider"
      showHistogram
    />
    <ValueFilterPanel
      label="Producer"
      field="ProducerName"
      displayType="checkbox"
      sortFacetsBy="histogram"
      limit={20}
    />
    <ValueFilterPanel
      label="Category"
      field="CatalogCategories"
      displayType="checkbox"
      sortFacetsBy="histogram"
      limit={20}
    />
    <ValueFilterPanel
      label="Preferred product"
      field="PreferredProduct"
      displayType="toggle"
      preserveBlankFacetState={true}
    />
    <SearchSettingsPanel />
  </>
);

const millum2025Render = (item: any) => (
  <div>
    <div style={{ font: 'var(--text-base)', color: 'var(--lv8)', marginBottom: '0.25rem' }}>
      {item['IndexData']}
    </div>
    <div style={{ font: 'var(--text-xs)', color: 'var(--lv5)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      {item['ProducerName'] && <span>Producer: {item['ProducerName']}</span>}
      {item['ContractNumber'] && <span>Contract: {item['ContractNumber']}</span>}
      {item['Price'] != null && <span>Price: {item['Price']}</span>}
      {item['CatalogCategories'] && <span>Category: {item['CatalogCategories']}</span>}
    </div>
  </div>
);

const schemas: Record<DatasetKey, DatasetSchema> = {
  millum: {
    label: 'Millum',
    fields: ['Navn', 'Produsent/Importør', 'Leverandør'],
    filters: millumFilters,
    renderResult: millumRender,
  },
  millum2025: {
    label: 'Millum 2025',
    fields: ['IndexData', 'ProducerName', 'ContractNumber', 'Price', 'PreferredProduct', 'CatalogCategories'],
    filters: millum2025Filters,
    renderResult: millum2025Render,
  },
};

const datasetOrder: DatasetKey[] = ['millum', 'millum2025'];

export default function App() {
  const [dataset, setDataset] = useState<DatasetKey>('millum');
  const schema = schemas[dataset];

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
        {datasetOrder.map(key => (
          <button
            key={key}
            style={tabStyle(dataset === key)}
            onClick={() => setDataset(key)}
          >
            {schemas[key].label}
          </button>
        ))}
      </div>

      {/* key forces SearchClient (and its SearchProvider) to remount on dataset change
          so auth + field-metadata fetch happens cleanly against the new dataset */}
      <SearchClient
        key={dataset}
        dataset={dataset}
        fields={schema.fields}
        filters={schema.filters}
        renderResult={schema.renderResult}
      />
    </div>
  );
}
