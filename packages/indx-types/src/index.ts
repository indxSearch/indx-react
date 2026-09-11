// Enums
export { SystemState, BoostStrength, SynonymDirection } from './enums';
export { JsonErrorType } from './errors';

// Auth
export { LoginInfo, LoginResponse, ChangePasswordRequest } from './auth';

// Query
export { CloudQuery, CoverageSetup } from './query';

// Filters
export {
  FilterProxy,
  RangeFilterProxy,
  ValueFilterProxy,
  CombinedFilterProxy,
  UpdateFieldProxy,
  FilterFieldUpdateProxy
} from './filters';

// Boost
export { BoostProxy } from './boost';

// Synonyms
export { SynonymList, SynonymEntry } from './synonyms';

// Vector / Hybrid search
export { VectorQueryProxy, HybridQueryProxy, EmbeddingResultEntry } from './vector';

// Result
export { Result, ScoreEntry } from './result';

// Status
export { SystemStatus, LicenseInfo } from './status';

// Errors
export { ParseResult, ProcessError, ProcessErrorCount } from './errors';
export { IndxProblem, IndxProblemCode } from './problem';

// Fields
export { FieldProxy } from './fields';

// Datasets
export { DataSetListDto } from './datasets';

// Common
export { StringInt32KeyValuePair, StringSingleValueTuple } from './common';
