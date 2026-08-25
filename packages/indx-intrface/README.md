# @indxsearch/intrface

A powerful, flexible React search UI library for Indx Search with [IndxCloudApi](https://github.com/indxSearch/IndxCloudApi).

## Features

- 🔍 **Full-text search** with fuzzy matching and typo tolerance
- 🎯 **Faceted filtering** - Value filters (exact match) and range filters (numeric)
- 📊 **Real-time facet counts** - Dynamic aggregations that update with search
- 📱 **Mobile-responsive** - Built-in responsive design
- ⚡ **Debounced searches** - Optimized performance
- 🎨 **Customizable rendering** - Full control over result display
- 🔒 **Secure authentication** - Bearer-token authentication

## Compatibility

| Package | Version |
|---------|---------|
| **IndxCloudApi** | `2.0` |
| **React** | `^19.0.0` |
| **React DOM** | `^19.0.0` |
| **Node.js** | `^20.19.0 \|\| >=22.12.0` |

> **Note:** This library targets IndxCloudApi v2.0 (powered by IndxSearchLib v5 alpha). Different API versions may have incompatible changes.

## Installation

```bash
npm install @indxsearch/intrface@next @indxsearch/systm @indxsearch/pixl
```

> **Alpha:** this `3.x` line targets IndxCloudApi v2 (cloud v2) and is published under the
> **`next`** dist-tag while in alpha — hence `@next`. `@indxsearch/systm` is a stable release
> (`latest`), so it needs no tag. Drop `@next` once `intrface` graduates to `latest`.

> **Note:** TypeScript type definitions for IndxCloudApi are automatically included via the `@indxsearch/indx-types` dependency.

## Quick Start

### 1. Set Up Environment Variables

Create a `.env.local` file in your project root:

```bash
VITE_INDX_URL=https://your-indx-server.com
VITE_INDX_TOKEN=your-bearer-token-here
```

Create and monitor your bearer token on the IndxCloudApi website.

> Only the server URL and token come from the environment. Your **team** and **dataset** identify *what* you're searching, so they're passed directly as props on `SearchProvider` (shown below) — not as env vars.

**For local development:**
```bash
VITE_INDX_URL=https://localhost:5001
VITE_INDX_TOKEN=your-bearer-token-here
```

**Security Notes:**
- Never commit `.env.local` to version control
- The token is exposed in the browser — use a read-only / scoped search token
- Store the token in environment variables; never hardcode it

### 2. Import Styles

Import the CSS file in your app entry point:

```typescript
import '@indxsearch/intrface/styles.css';
```

### 3. Basic Implementation

```typescript
import { SearchProvider, SearchInput, SearchResults } from '@indxsearch/intrface';

export default function SearchPage() {
  return (
    <SearchProvider
      url={import.meta.env.VITE_INDX_URL}
      preAuthenticatedToken={import.meta.env.VITE_INDX_TOKEN}
      team="my-team"
      dataset="products"
    >
      <SearchInput />

      <SearchResults
        fields={['name', 'description', 'category']}
        resultsPerPage={10}
      >
        {(item) => (
          <div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
          </div>
        )}
      </SearchResults>
    </SearchProvider>
  );
}
```

**Using different datasets on different pages:**

```typescript
// products page
<SearchProvider url={url} preAuthenticatedToken={token} team="my-team" dataset="products">
  {/* ... */}
</SearchProvider>

// articles page
<SearchProvider url={url} preAuthenticatedToken={token} team="my-team" dataset="articles">
  {/* ... */}
</SearchProvider>
```

## Authentication

Authentication uses a **pre-issued bearer token**. Create and monitor tokens on the IndxCloudApi website, then provide the token to `SearchProvider`.

**Environment setup:**
```bash
VITE_INDX_URL=https://your-indx-server.com
VITE_INDX_TOKEN=your-bearer-token-here
```

**Usage:**
```typescript
<SearchProvider
  url={import.meta.env.VITE_INDX_URL}
  preAuthenticatedToken={import.meta.env.VITE_INDX_TOKEN}
  team="my-team"
  dataset="products"
>
  {/* Your search UI */}
</SearchProvider>
```

**Security best practices:**
- Create a read-only / scoped search token for client-side use
- Store the token in environment variables (`.env.local`); never commit it
- Use secure HTTPS connections in production
- The token is exposed in the browser, so scope it to search only

## Error Handling

The library includes comprehensive error handling with helpful console messages:

### Automatic Error Detection

The SearchProvider automatically validates:
- ✅ Authentication (bearer token)
- ✅ Dataset existence and status
- ✅ Dataset readiness (indexing complete)
- ✅ Empty dataset warnings
- ✅ Network connectivity

All errors include:
- Clear error messages
- Specific problem identification
- Actionable fix suggestions
- Example commands to resolve issues

### Error Boundary (Optional)

Wrap your search interface with `SearchErrorBoundary` for graceful error handling:

```typescript
import { SearchErrorBoundary, SearchProvider } from '@indxsearch/intrface';

<SearchErrorBoundary>
  <SearchProvider url={url} preAuthenticatedToken={token} team={team} dataset={dataset}>
    {/* Your search UI */}
  </SearchProvider>
</SearchErrorBoundary>
```

**Custom error UI:**
```typescript
<SearchErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h2>Search Error</h2>
      <p>{error.message}</p>
      <button onClick={reset}>Try Again</button>
    </div>
  )}
>
  <SearchProvider url={url} preAuthenticatedToken={token} team={team} dataset={dataset}>
    {children}
  </SearchProvider>
</SearchErrorBoundary>
```

### Console Error Messages

All errors show in the browser console with emoji indicators:
- ✅ = Success
- 🔍 = Checking something
- ⚠️ = Warning (non-critical)
- ❌ = Error (needs fixing)
- 💡 = Helpful suggestion

**Example:**
```
[Auth] ❌ Dataset "products" not found (404)
[Auth] 💡 Available datasets can be checked with: curl -X GET ...
[Auth] 💡 Make sure you spelled the dataset name correctly
```

## Adding Filters

### Value Filters (Exact Match)

```typescript
import { ValueFilterPanel } from '@indxsearch/intrface';

<SearchProvider {...authProps}>
  <SearchInput />

  {/* Simple checkbox list */}
  <ValueFilterPanel
    field="category"
    label="Category"
  />

  {/* Button-style filters */}
  <ValueFilterPanel
    field="brand"
    label="Brand"
    displayType="button"
    layout="grid"
  />

  <SearchResults {...resultsProps}>
    {renderItem}
  </SearchResults>
</SearchProvider>
```

### Range Filters (Numeric)

```typescript
import { RangeFilterPanel } from '@indxsearch/intrface';

<RangeFilterPanel
  field="price"
  label="Price Range"
  expectedMin={0}
  expectedMax={1000}
/>
```

### Active Filters Display

```typescript
import { ActiveFiltersPanel } from '@indxsearch/intrface';

<ActiveFiltersPanel />
```

## Full Example with Filters

```typescript
import {
  SearchProvider,
  SearchInput,
  SearchResults,
  ValueFilterPanel,
  RangeFilterPanel,
  ActiveFiltersPanel,
  SortByPanel,
} from '@indxsearch/intrface';

export default function AdvancedSearch() {
  return (
    <SearchProvider
      url={import.meta.env.VITE_INDX_URL}
      preAuthenticatedToken={import.meta.env.VITE_INDX_TOKEN}
      team="my-team"
      dataset="products"
      allowEmptySearch={true}
      enableFacets={true}
      maxResults={20}
    >
      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Sidebar with filters */}
        <aside style={{ width: '250px' }}>
          <ActiveFiltersPanel />
          <SortByPanel displayType="radio" />
          <ValueFilterPanel field="category" label="Category" />
          <ValueFilterPanel field="brand" label="Brand" displayType="button" />
          <RangeFilterPanel field="price" label="Price" />
        </aside>

        {/* Main content */}
        <main style={{ flex: 1 }}>
          <SearchInput showFocus={true} />

          <SearchResults
            fields={['name', 'description', 'price', 'category', 'brand']}
            resultsPerPage={20}
          >
            {(item) => (
              <div style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div>
                  <strong>${item.price}</strong> • {item.category}
                </div>
              </div>
            )}
          </SearchResults>
        </main>
      </div>
    </SearchProvider>
  );
}
```

## API Reference

### SearchProvider Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `url` | `string` | ✅ | - | INDX server URL |
| `preAuthenticatedToken` | `string` | ✅ | - | Bearer token created on the IndxCloudApi website |
| `team` | `string` | ✅ | - | Team that owns the dataset — scopes requests to `/api/teams/{team}/datasets/{dataset}/…` |
| `dataset` | `string` | ✅ | - | Dataset name |
| `allowEmptySearch` | `boolean` | ❌ | `false` | Show results without query |
| `enableFacets` | `boolean` | ❌ | `true` | Enable faceted search |
| `enableCoverage` | `boolean` | ❌ | `true` | Enable coverage-based fuzzy matching |
| `maxResults` | `number` | ❌ | `10` | Max results per search |
| `facetDebounceDelayMillis` | `number` | ❌ | `500` | Debounce delay for facet updates (ms) |
| `coverageDepth` | `number` | ❌ | `500` | Search depth for fuzzy matching |
| `removeDuplicates` | `boolean` | ❌ | `true` | Remove duplicate results |
| `initialCoverageSetup` | `Partial<CoverageSetup>` | ❌ | `{}` | Override default coverage settings |
| `enableDebugLogs` | `boolean` | ❌ | `false` | Enable detailed console logging |

### SearchInput Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showClear` | `boolean` | `true` | Show clear button |
| `showFocus` | `boolean` | `false` | Show focus ring |
| `inputSize` | `'micro' \| 'default'` | `'default'` | Input size |

> The placeholder text is configured on the provider via `searchSettings.placeholderText` (default `'Type to search'`), not as a prop on `SearchInput`.

### SearchResults Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `fields` | `string[]` | ✅ | Document fields to fetch |
| `resultsPerPage` | `number` | ✅ | Results per page |
| `children` | `(item: any) => ReactNode` | ✅ | Render function for each result |

### ValueFilterPanel Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `field` | `string` | ✅ | Field name to filter on |
| `label` | `string` | ❌ | Display label |
| `displayType` | `'checkbox' \| 'button' \| 'toggle'` | `'checkbox'` | Filter UI style |
| `layout` | `'list' \| 'grid'` | `'list'` | Layout style |
| `limit` | `number` | `undefined` | Max filters to show |
| `startCollapsed` | `boolean` | `false` | Start collapsed |
| `showCount` | `boolean` | `true` | Show facet counts |

### RangeFilterPanel Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `field` | `string` | ✅ | Field name to filter on |
| `label` | `string` | ❌ | Display label |
| `displayType` | `'slider' \| 'input'` | ❌ | Filter UI style (default `'input'`) |
| `expectedMin` | `number` | ❌ | Expected lower bound (default `0`) |
| `expectedMax` | `number` | ❌ | Expected upper bound (default `1000`) |
| `showHistogram` | `boolean` | ❌ | Show a histogram above the slider (requires the field to be facetable; default `false`) |
| `resolution` | `number` | ❌ | Value-range per histogram bucket (e.g. `200` → 5 bars over 0–1000). Auto-derived (~20 bars) if omitted |
| `collapsible` | `boolean` | ❌ | Whether the panel can collapse (default `true`) |
| `startCollapsed` | `boolean` | ❌ | Start collapsed (default `false`) |

### SortByPanel Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `displayType` | `'dropdown' \| 'radio'` | `'dropdown'` | Sort UI style |
| `collapsible` | `boolean` | `true` | Allow the panel to collapse |
| `startCollapsed` | `boolean` | `false` | Start collapsed |

## Hooks

All hooks must be used within a `SearchProvider`.

### useSearch / useSearchContext

Access the search state and actions (query, filters, results, facets, etc.) from anywhere in the tree. `useSearch` is an alias for `useSearchContext`.

```typescript
import { useSearch } from '@indxsearch/intrface';

const { state, setQuery } = useSearch();
// state.query, state.filters, state.facets, state.searchSettings, ...
```

### useVectorSearch

Embedding-based vector search against the `search/vector` endpoint. You supply an `embeddingFn` that turns query text into a vector; the hook posts it and resolves the matching documents.

```typescript
import { useVectorSearch } from '@indxsearch/intrface';

const { results, isLoading, error, search } = useVectorSearch(embeddingFn, {
  fieldName: 'embedding', // embedding field
  maxResults: 10,         // optional, default 10
  filter,                 // optional FilterProxy
  timeoutMs,              // optional
});

await search('comfortable running shoes');
// results: Array<{ document, documentKey, score }> | null
```

### useHybridSearch

Combines full-text and vector scoring via the `search/hybrid` endpoint. Same shape as `useVectorSearch`, plus an `alpha` blend factor.

```typescript
import { useHybridSearch } from '@indxsearch/intrface';

const { results, isLoading, error, search } = useHybridSearch(embeddingFn, {
  fieldName: 'embedding',
  alpha: 0.5,       // optional, default 0.5 — blend of text vs. vector score
  maxResults: 10,   // optional, default 10
  filter,           // optional FilterProxy
  timeoutMs,        // optional
});

await search('comfortable running shoes');
// results: Array<{ document, documentKey, score }> | null
```

## Additional Components

These components are also exported and can be used for custom layouts:

- `SearchResult` — a single result row; renders `children`, an optional index/score, and a skeleton state.
- `SearchResultRow` — a lightweight row wrapper with `'title' | 'default'` variants for laying out result fields.
- `SearchResultsSkeleton` — placeholder rows shown while results load (`rows` prop).
- `FilterPanelSkeleton` — placeholder for a filter panel while facets load (`list` or `slider` variant).
- `SearchSettingsPanel` — a ready-made panel for editing `searchSettings` (max results, coverage depth, placeholder text, coverage setup, etc.).

## Troubleshooting

### "401 Unauthorized" errors

**Problem:** Authentication failed or token is invalid

**Solutions:**
1. Verify the token is valid and not expired; create a fresh one on the IndxCloudApi website if needed
2. Check that `VITE_INDX_TOKEN` is correctly set in your environment variables
3. Verify the server is running and accessible
4. Check server logs for authentication issues

### "Failed to fetch" errors

**Problem:** Cannot connect to INDX server

**Solutions:**
1. Verify the server URL is correct
2. Check if the server is running (for local: `https://localhost:5001`)
3. Ensure CORS is configured on the server
4. Check browser console for detailed error

### Results not showing

**Problem:** Empty results even with data

**Solutions:**
1. Verify dataset name is correct
2. Check if dataset is indexed (`GET /api/teams/{team}/datasets/{dataset}/status`)
3. Ensure fields are configured as indexable/facetable
4. Try `allowEmptySearch={true}` to see all results

### Filters not working

**Problem:** Filters don't update results

**Solutions:**
1. Ensure fields are configured as filterable/facetable in your dataset
2. Check browser console for errors
3. Verify field names match your dataset

## Examples

### Example 1: E-commerce Search

```typescript
<SearchProvider url={url} preAuthenticatedToken={token} team="my-team" dataset="products">
  <div className="search-page">
    <SearchInput />

    <div className="filters">
      <ValueFilterPanel field="category" label="Category" />
      <ValueFilterPanel field="brand" label="Brand" displayType="button" />
      <RangeFilterPanel field="price" label="Price" expectedMin={0} expectedMax={1000} />
      <ValueFilterPanel field="inStock" label="In Stock" />
    </div>

    <SearchResults fields={['name', 'price', 'image']} resultsPerPage={24}>
      {(product) => (
        <ProductCard
          name={product.name}
          price={product.price}
          image={product.image}
        />
      )}
    </SearchResults>
  </div>
</SearchProvider>
```

### Example 2: Document Search

```typescript
<SearchProvider url={url} preAuthenticatedToken={token} team="my-team" dataset="documents">
  <SearchInput />

  <ValueFilterPanel field="docType" label="Type" />
  <ValueFilterPanel field="author" label="Author" />

  <SearchResults fields={['title', 'content', 'date']} resultsPerPage={10}>
    {(doc) => (
      <article>
        <h2>{doc.title}</h2>
        <p>{doc.content.substring(0, 200)}...</p>
        <small>{new Date(doc.date).toLocaleDateString()}</small>
      </article>
    )}
  </SearchResults>
</SearchProvider>
```

## Support

- **Documentation:** [docs.indx.co](https://docs.indx.co)
