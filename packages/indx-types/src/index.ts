// Enums
export {
  SystemState, BoostStrength, BuryStrength, SynonymDirection,
  SearchMode, Tolerance, Rungs, IndexTerms
} from './enums.js';
export { JsonErrorType } from './errors.js';

// Auth
export { LoginInfo, LoginResponse, ChangePasswordRequest } from './auth.js';

// Query
export { QueryProxy, MatchSetup, CandidateSetup, RankingProxy } from './query.js';

// Filters
export {
  FilterProxy,
  RangeFilterProxy,
  ValueFilterProxy,
  CombinedFilterProxy,
  InFilterProxy,
  PositionFilterProxy,
  FilterExpressionProxy,
  FilterExpressionResultProxy,
  FilterExpressionErrorDetail,
  UpdateFieldProxy,
  FilterFieldUpdateProxy
} from './filters.js';

// Saved rules, query parameters and field profiles
export {
  RuleCondition, BoostRule, BuryRule, DatasetQueryParameters, QueryParametersResponse,
  FieldProfile, FieldProfileView, FieldProfilesResponse, FieldProfilesRequest
} from './rules.js';

// Boost
export { BoostProxy, BuryProxy } from './boost.js';

// Synonyms
export { SynonymList, SynonymEntry } from './synonyms.js';

// Vector / Hybrid search
export { VectorQueryProxy, HybridQueryProxy, EmbeddingResultEntry } from './vector.js';

// Result
export {
  Result, QueryFitResult, ScoreEntry, ToleranceCounts, PageFill, MatchReport, RecordMatch, QueryWordMatch, WordMatch,
  FacetStats, MultiSearchAnswer, MultiSearchFailure, MAX_SEARCHES_PER_MULTI
} from './result.js';

// Cold storage
export { ColdVisibility, ColdWrite, ColdBatchItem, ColdBatchOutcome, ColdView } from './cold.js';

// Status
export { SystemStatus, LicenseInfo } from './status.js';

// Errors
export { ParseResult, ProcessError, ProcessErrorCount } from './errors.js';
export { IndxProblem, IndxProblemCode } from './problem.js';

// Fields
export { FieldProxy } from './fields.js';

// Datasets
export { DataSetListDto } from './datasets.js';

// Common
export { StringInt32KeyValuePair, StringSingleValueTuple } from './common.js';
