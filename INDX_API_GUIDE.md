# INDX Search API - Implementation Guide

> **Target:** IndxCloudApi v2, powered by IndxSearchLib v5 alpha.

## Project Overview

This is a React/TypeScript search interface library (`@indxsearch/intrface`) that provides components for interacting with the INDX Search API. The library is built as a monorepo with workspace packages and a demo application.

### Repository Structure

```
indx-react/
├── apps/
│   ├── demo/              # Vite demo application (port 3000)
│   └── components/        # Vite component showcase (port 3001)
├── packages/
│   ├── indx-intrface/  # Main search components library
│   │   └── src/
│   │       └── context/
│   │           └── SearchContext.tsx  # Core API integration
│   ├── indx-systm/        # UI component system
│   └── indx-types/        # Shared TypeScript types (IndxCloudApi v2)
```

## INDX Search API

### Base Architecture

The INDX Search API is a .NET/C# backend service that provides full-text search with faceting, filtering, and advanced search features.

**API Base Route:** `/api` — all dataset operations are scoped under `/api/teams/{teamName}/datasets/{dataSetName}`

### Authentication Pattern

Authentication uses a **pre-issued bearer token**. Create and monitor tokens on the IndxCloudApi website, then send the token as an `Authorization: Bearer {token}` header on every request. There is no client-side login step.

#### TypeScript Pattern (Client)
```typescript
// 1. Bring a token created on the IndxCloudApi website
const token = import.meta.env.VITE_INDX_TOKEN;

// 2. Create an authenticated fetch wrapper
const authenticatedFetch = (url, options) => fetch(url, {
  ...options,
  headers: {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  }
});

// 3. Use for all subsequent API calls
```

**Key Insight:** Every endpoint requires a Bearer token. Tokens are created and managed on the IndxCloudApi website.

> **Note:** With the `@indxsearch/intrface` React library, pass the token to `SearchProvider` via `preAuthenticatedToken`.

## API Endpoints

### Authentication

Authentication is via a **pre-issued bearer token**, created and monitored on the IndxCloudApi website. There is no login endpoint — send the token as `Authorization: Bearer {token}` on every request.

### Dataset Management

#### Create or open a dataset
- **Endpoint:** `PUT /api/teams/{teamName}/datasets/{dataSetName}`
- **Auth Required:** Yes
- **Query:** Optional `?configuration=Production` (named profile) or `?configuration=400` (numeric)
- **Purpose:** Create a new dataset or open an existing one
- **Returns:** `201 Created` if the dataset was created, `200 OK` if it already existed

#### Delete a dataset
- **Endpoint:** `DELETE /api/teams/{teamName}/datasets/{dataSetName}`
- **Auth Required:** Yes
- **Purpose:** Permanently delete a dataset
- **Returns:** `204 No Content`

#### List my datasets
- **Endpoint:** `GET /api/me/datasets`
- **Auth Required:** Yes
- **Returns:** Array of datasets the authenticated user can access
- **Purpose:** List all datasets available to the authenticated user

#### Status
- **Endpoint:** `GET /api/teams/{teamName}/datasets/{dataSetName}/status`
- **Auth Required:** Yes
- **Returns:** `SystemStatus` object
- **Purpose:** Check dataset state (indexing progress, readiness, etc.)

### Data Loading & Analysis

All routes below are relative to `/api/teams/{teamName}/datasets/{dataSetName}`.

#### Analyze (stream)
- **Endpoint:** `POST …/analyze`
- **Auth Required:** Yes
- **Body:** JSON stream
- **Purpose:** Analyze JSON structure from a stream to discover fields

#### Analyze (text)
- **Endpoint:** `POST …/analyze/text`
- **Auth Required:** Yes
- **Body:** String (text/plain)
- **Purpose:** Analyze JSON structure from a string

#### Load (stream)
- **Endpoint:** `POST …/load`
- **Auth Required:** Yes
- **Body:** JSON stream
- **Purpose:** Load JSON documents from a stream
- **Returns:** `204 No Content`

#### Load (text)
- **Endpoint:** `POST …/load/text`
- **Auth Required:** Yes
- **Body:** String (text/plain)
- **Purpose:** Load JSON documents from a string
- **Returns:** `204 No Content`

### Field Configuration

All routes below are relative to `/api/teams/{teamName}/datasets/{dataSetName}`.

#### Get all fields
- **Endpoint:** `GET …/fields`
- **Auth Required:** Yes
- **Returns:** `string[]`

#### Get searchable fields
- **Endpoint:** `GET …/fields/searchable`
- **Auth Required:** Yes
- **Returns:** `string[]`

#### Set searchable fields
- **Endpoint:** `PUT …/fields/searchable`
- **Auth Required:** Yes
- **Body:** `Array<[fieldName: string, weight: number]>`
- **Example:** `[["name", 100], ["type1", 50]]`
- **Returns:** `204 No Content`

#### Get filterable fields
- **Endpoint:** `GET …/fields/filterable`
- **Auth Required:** Yes
- **Returns:** `string[]`

#### Set filterable fields
- **Endpoint:** `PUT …/fields/filterable`
- **Auth Required:** Yes
- **Body:** `string[]` - Array of field names
- **Returns:** `204 No Content`

#### Get facetable fields
- **Endpoint:** `GET …/fields/facetable`
- **Auth Required:** Yes
- **Returns:** `string[]`

#### Set facetable fields
- **Endpoint:** `PUT …/fields/facetable`
- **Auth Required:** Yes
- **Body:** `string[]` - Array of field names
- **Returns:** `204 No Content`

#### Get sortable fields
- **Endpoint:** `GET …/fields/sortable`
- **Auth Required:** Yes
- **Returns:** `string[]`

#### Set sortable fields
- **Endpoint:** `PUT …/fields/sortable`
- **Auth Required:** Yes
- **Body:** `string[]` - Array of field names
- **Returns:** `204 No Content`

### Indexing

#### Index
- **Endpoint:** `POST /api/teams/{teamName}/datasets/{dataSetName}/index`
- **Auth Required:** Yes
- **Purpose:** Start indexing process (runs asynchronously)
- **Returns:** `202 Accepted`
- **Note:** Poll `GET …/status` to monitor progress

### Search & Filtering

All routes below are relative to `/api/teams/{teamName}/datasets/{dataSetName}`.

#### Search
- **Endpoint:** `POST …/search`
- **Auth Required:** Yes
- **Body:** SearchQuery object
```typescript
{
  text: string;
  maxNumberOfRecordsToReturn: number;
  enableFacets: boolean;
  filter?: FilterProxy;
  sortBy?: string;
  sortAscending?: boolean;
  enableCoverage?: boolean;
  removeDuplicates?: boolean;
  coverageDepth?: number;
  coverageSetup?: CoverageSetup;
}
```
- **Returns:**
```typescript
{
  records: Array<{documentKey: number, score: number}>;
  facets?: Record<string, Array<{key: string, value: number}>>;
  truncationIndex?: number;
}
```

#### Document lookup
- **Endpoint:** `POST …/documents/lookup`
- **Auth Required:** Yes
- **Body:** `number[]` - Array of document keys
- **Returns:** `string[]` - Array of JSON document strings
- **Purpose:** Retrieve full documents by their keys

#### Create value filter
- **Endpoint:** `POST …/filters/value`
- **Auth Required:** Yes
- **Body:** `{ FieldName: string, Value: any }`
- **Returns:** `FilterProxy` object with `hashString`
- **Purpose:** Create a filter for exact value matching

#### Create range filter
- **Endpoint:** `POST …/filters/range`
- **Auth Required:** Yes
- **Body:** `{ FieldName: string, LowerLimit: number, UpperLimit: number }`
- **Returns:** `FilterProxy` object with `hashString`
- **Purpose:** Create a filter for numeric ranges

#### Combine filters
- **Endpoint:** `POST …/filters/combine`
- **Auth Required:** Yes
- **Body:** `{ A: FilterProxy, B: FilterProxy, useAndOperation: boolean }`
- **Returns:** Combined `FilterProxy` object
- **Purpose:** Combine two filters with AND/OR logic

#### Create boost from filter
- **Endpoint:** `POST …/boosts/from-filter`
- **Auth Required:** Yes
- **Body:** `{ FilterProxy: FilterProxy, BoostStrength: number }`
- **Returns:** `BoostProxy` object
- **Purpose:** Create a boost configuration to prioritize matching documents

## Common Workflows

### 1. Setup New Dataset

```typescript
// 1. Use a bearer token created on the IndxCloudApi website
const token = import.meta.env.VITE_INDX_TOKEN;

// All dataset routes are team-scoped
const base = `${url}/api/teams/${team}/datasets/${dataset}`;

// 2. Create/Open dataset (201 = created, 200 = already existed)
await authenticatedFetch(`${base}?configuration=400`, {
  method: 'PUT'
});

// 3. Analyze data structure
await authenticatedFetch(`${base}/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: fileStream
});

// 4. Configure fields (each returns 204 No Content)
await authenticatedFetch(`${base}/fields/searchable`, {
  method: 'PUT',
  body: JSON.stringify([["name", 100], ["description", 50]])
});

await authenticatedFetch(`${base}/fields/filterable`, {
  method: 'PUT',
  body: JSON.stringify(["category", "price"])
});

await authenticatedFetch(`${base}/fields/facetable`, {
  method: 'PUT',
  body: JSON.stringify(["category", "brand"])
});

// 5. Load data (204 No Content)
await authenticatedFetch(`${base}/load`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: dataStream
});

// 6. Index (202 Accepted — indexing runs asynchronously)
await authenticatedFetch(`${base}/index`, {
  method: 'POST'
});

// 7. Monitor progress
let status;
do {
  const res = await authenticatedFetch(`${base}/status`);
  status = await res.json();
  await delay(200);
} while (status.systemState !== 'Ready');
```

### 2. Search with Filters

```typescript
const base = `${url}/api/teams/${team}/datasets/${dataset}`;

// 1. Create filters
const filter1Res = await authenticatedFetch(`${base}/filters/value`, {
  method: 'POST',
  body: JSON.stringify({ FieldName: "category", Value: "electronics" })
});
const filter1 = await filter1Res.json();

const filter2Res = await authenticatedFetch(`${base}/filters/range`, {
  method: 'POST',
  body: JSON.stringify({ FieldName: "price", LowerLimit: 0, UpperLimit: 100 })
});
const filter2 = await filter2Res.json();

// 2. Combine filters
const combinedRes = await authenticatedFetch(`${base}/filters/combine`, {
  method: 'POST',
  body: JSON.stringify({ A: filter1, B: filter2, useAndOperation: true })
});
const combinedFilter = await combinedRes.json();

// 3. Search
const searchRes = await authenticatedFetch(`${base}/search`, {
  method: 'POST',
  body: JSON.stringify({
    text: "laptop",
    maxNumberOfRecordsToReturn: 20,
    enableFacets: true,
    filter: combinedFilter
  })
});
const searchData = await searchRes.json();

// 4. Get full documents
const keys = searchData.records.map(r => r.documentKey);
const docsRes = await authenticatedFetch(`${base}/documents/lookup`, {
  method: 'POST',
  body: JSON.stringify(keys)
});
const documents = await docsRes.json();
```

## Important Notes

### Authentication
- **CRITICAL:** All endpoints except Login require Bearer token
- Token is JWT-based and returned from Login endpoint
- Include token as `Authorization: Bearer {token}` header

### CORS
- API server must have CORS configured to allow requests from your frontend origin
- Common localhost ports: 3000 (demo app), 3001 (components app), 5001 (API server)

### Error Handling
- Initial blank search may fail (500) if dataset not fully ready - handle gracefully
- Field configuration endpoints may return empty arrays if dataset not analyzed
- Always check response.ok before parsing JSON

### Performance
- Faceted searches are debounced in the UI (default 500ms)
- Use coverage settings to control search depth vs. speed
- Consider disabling facets for large result sets if not needed

### Search Features
- **Coverage:** Advanced fuzzy matching, typo tolerance
- **Facets:** Aggregated counts/stats for filterable fields
- **Filters:** Value filters (exact match) and range filters (numeric)
- **Boosts:** Priority weighting for specific filter matches
- **Duplicates:** Can be removed based on content similarity

## SearchContext Implementation

The `SearchContext.tsx` file in `packages/indx-intrface/src/context/` implements this API as a React Context provider with the following pattern:

1. **Authenticate on mount** - Uses the supplied bearer token (`preAuthenticatedToken`)
2. **Fetch field configurations** - Gets filterable/facetable/sortable fields
3. **Create authenticatedFetch wrapper** - Automatically includes Bearer token
4. **Provide search state and methods** - Exposes search, filtering, sorting to components
5. **Handle loading and error states** - Graceful degradation for API failures

### Key Exports
- `SearchProvider` - Context provider component
- `useSearchContext` - Hook to access search state and methods
- `SearchInput` - Search input component
- `SearchResults` - Results display component
- Various filter panel components

## Environment Setup

### Required Environment Variables (.env.local)
```bash
# For the Vite apps (demo, components)
VITE_INDX_URL=https://localhost:5001
VITE_INDX_TOKEN=your-bearer-token-here
```

### Running the Project
```bash
# Install dependencies
npm install

# Run both demo and components apps (builds packages first, then starts apps)
npm run dev

# Or run apps individually:
npm run dev:demo        # Demo app on http://localhost:3000
npm run dev:components  # Components app on http://localhost:3001

# Build packages only
npm run build:packages
```

## Troubleshooting

### "Failed to fetch" errors
- Check API server is running on correct port
- Verify CORS is configured on server
- Ensure Bearer token is being sent in requests
- Check browser console for exact error details

### "401 Unauthorized"
- Token may be expired or invalid
- Create or check your token on the IndxCloudApi website
- Check token is being included in Authorization header

### "500 Internal Server Error"
- Dataset may not be fully indexed
- Check dataset exists with `GET /api/me/datasets`
- Verify field configurations are set correctly
- Check server logs for specific error

### Blank search fails
- This is expected behavior if dataset not ready
- Gracefully handled in SearchContext
- Facets will populate after first real search
