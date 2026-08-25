# @indxsearch/indx-types

TypeScript type definitions for **IndxCloudApi v2.0**. This package provides complete, strongly-typed interfaces for search queries, filters, boosts, results, and system status.

## Installation

```bash
npm install @indxsearch/indx-types
```

## Features

- Complete TypeScript type definitions for IndxCloudApi v2.0
- Zero runtime dependencies (types-only package)
- Matches official Swagger API specification exactly
- Full IntelliSense support in VS Code and other IDEs
- Supports both ESM and CommonJS

## Version Compatibility

This package (`@indxsearch/indx-types` 2.x) provides types for **IndxCloudApi v2.0** (IndxSearchLib v5). The shapes are generated from and verified against the live v5 OpenAPI spec.

## Usage

### Basic Query

```typescript
import type { CloudQuery, Result } from '@indxsearch/indx-types';

const query: CloudQuery = {
  text: 'search term',
  maxNumberOfRecordsToReturn: 10,
};

// Use with your API client
const result: Result = await apiClient.search(query);
```

### Filters

```typescript
import type {
  RangeFilterProxy,
  ValueFilterProxy,
  CombinedFilterProxy
} from '@indxsearch/indx-types';

// Range filter
const rangeFilter: RangeFilterProxy = {
  fieldName: 'price',
  lowerLimit: 10,
  upperLimit: 100
};

// Value filter
const valueFilter: ValueFilterProxy = {
  fieldName: 'category',
  value: 'electronics'
};

// Combined filter
const combinedFilter: CombinedFilterProxy = {
  a: rangeFilter,
  b: valueFilter,
  useAndOperation: true
};
```

### Boosts

```typescript
import type { BoostProxy, BoostStrength } from '@indxsearch/indx-types';

const boost: BoostProxy = {
  boostStrength: BoostStrength.High,
  filterProxy: {
    hashString: 'filter-hash'
  }
};

const query: CloudQuery = {
  text: 'search term',
  enableBoost: true,
  boosts: [boost]
};
```

### Coverage Setup

```typescript
import type { CoverageSetup, CloudQuery } from '@indxsearch/indx-types';

const coverageSetup: CoverageSetup = {
  coverWholeQuery: true,
  coverWholeWords: true,
  coverFuzzyWords: true,
  minWordSize: 2,
  levenshteinMaxWordSize: 20,
  truncate: true,
  truncationScore: 255
};

const query: CloudQuery = {
  text: 'search term',
  enableCoverage: true,
  coverageSetup
};
```

### System Status

```typescript
import type { SystemStatus, SystemState } from '@indxsearch/indx-types';

const status: SystemStatus = await apiClient.getStatus();

if (status.systemState === SystemState.Ready) {
  console.log('System is ready');
  console.log(`Documents indexed: ${status.documentCount}`);
}
```

## API Reference

### Types

#### Query Types
- `CloudQuery` - Main search query interface
- `CoverageSetup` - Coverage configuration options

#### Filter Types
- `FilterProxy` - Base filter interface
- `RangeFilterProxy` - Numeric range filter
- `ValueFilterProxy` - Value-based filter
- `CombinedFilterProxy` - Combined filter with AND/OR operations
- `UpdateFieldProxy` - Field value update payload (`fieldName`, `value`)
- `FilterFieldUpdateProxy` - Field update applied to documents matching a filter

#### Result Types
- `Result` - Search result interface
- `ScoreEntry` - Individual result entry with score

#### Field Types
- `FieldProxy` - Field metadata and indexing flags (searchable, filterable, weight, BM25 params)

#### Boost Types
- `BoostProxy` - Search result boost configuration
- `CloudQuery.fieldBoosts` - Per-field boost map (`Record<string, number>`) on `CloudQuery`

#### Vector / Hybrid Types
- `VectorQueryProxy` - Embedding vector search query (field, vector, max results, filter)
- `HybridQueryProxy` - Combined text + vector search query with `alpha` blend
- `EmbeddingResultEntry` - Single vector match (`documentKey`, `score`)

#### Status Types
- `SystemStatus` - System status and health information
- `LicenseInfo` - License validation details

#### Authentication

Auth is **bearer-token only** — create a token on the IndxCloudApi website and pass it as `preAuthenticatedToken`. The email/password login flow is deprecated and being removed.

- `ChangePasswordRequest` - Password change payload (`currentPassword`, `newPassword`)
- `LoginInfo` / `LoginResponse` - _Deprecated_ — legacy email/password login types, being removed in favour of token-only auth.

#### Error Types
- `ParseResult` - JSON parse outcome for a token (progress, record index, error info)
- `ProcessError` - A processing error (`source`, `message`, optional `parseError`)
- `ProcessErrorCount` - A `ProcessError` paired with its occurrence `count`

#### Dataset Types
- `DataSetListDto` - A dataset from `GET /api/me/datasets`: its `name`, the owning `teamName`, and the caller's `role` ("Admin" | "Editor" | "Viewer")

#### Common Types
- `StringInt32KeyValuePair` - `{ key: string; value: number }` pair
- `StringSingleValueTuple` - `{ Item1: string; Item2: number }` tuple

### Enums

#### SystemState
- `Hibernated = -1`
- `Created = 0`
- `Loading = 1`
- `Loaded = 2`
- `Indexing = 3`
- `Ready = 4`
- `Error = 255`

#### BoostStrength
- `Low = 1`
- `Medium = 2`
- `High = 3`

#### JsonErrorType
- `None = 0`
- `ControlCharacters = 1`
- `TrailingComma = 2`
- `UnescapedQuotes = 3`
- `UnescapedBackslash = 4`
- `StructuralError = 5`
- `UnknownError = 6`

## TypeScript Configuration

This package is designed to work seamlessly with TypeScript. Add it to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@indxsearch/indx-types"]
  }
}
```

For monorepo development with path mapping:

```json
{
  "compilerOptions": {
    "paths": {
      "@indxsearch/indx-types": ["../indx-types/src"]
    }
  }
}
```

## Related Packages

- [@indxsearch/intrface](https://www.npmjs.com/package/@indxsearch/intrface) - React search UI components
- [@indxsearch/systm](https://www.npmjs.com/package/@indxsearch/systm) - Core search system
- [@indxsearch/pixl](https://www.npmjs.com/package/@indxsearch/pixl) - UI component library

## Documentation

- [Swagger API Specification](https://cloud.indx.co/swagger/v1/swagger.json)
- [IndxCloudApi Documentation](https://cloud.indx.co/swagger)

## License

Apache-2.0

## Contributing

This package is part of the [indx-react](https://github.com/indxSearch/indx-react) monorepo. See the main repository for contribution guidelines.
