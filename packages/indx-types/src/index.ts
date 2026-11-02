// Enums
export {
  SystemState, BoostStrength, BuryStrength, SynonymDirection,
  SearchMode, Tolerance, Rungs, IndexTerms
} from './enums';
export { JsonErrorType } from './errors';

// Auth
export { LoginInfo, LoginResponse, ChangePasswordRequest } from './auth';

// Query
export { QueryProxy, MatchSetup, CandidateSetup, RankingProxy } from './query';

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
export { BoostProxy, BuryProxy } from './boost';

// Synonyms
export { SynonymList, SynonymEntry } from './synonyms';

// Vector / Hybrid search
export { VectorQueryProxy, HybridQueryProxy, EmbeddingResultEntry } from './vector';

// Result
export { Result, QueryFitResult, ScoreEntry, ToleranceCounts } from './result';

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
