import { BoostStrength, BuryStrength, SearchMode } from './enums.js';
import { CandidateSetup, MatchSetup, RankingProxy } from './query.js';
import { Tolerance } from './enums.js';

/** A condition of a saved boost or bury rule: a value, or a range on a number field. */
export interface RuleCondition {
  field?: string | null;
  /** The value form; ignored when `min` or `max` is set. */
  value?: string | null;
  /** The range form, inclusive; null is open. */
  min?: number | null;
  max?: number | null;
  /** Read only: whether this is the range form. */
  readonly isRange?: boolean;
}

/** A saved boost rule (GET/PUT boosts), applied to every search of the dataset while it is
 * enabled and inside its dates. */
export interface BoostRule {
  name?: string | null;
  enabled: boolean;
  conditions?: RuleCondition[] | null;
  join: 'And' | 'Or';
  strength: BoostStrength;
  /** ISO dates; null is open. */
  activeFrom?: string | null;
  activeUntil?: string | null;
}

/** A saved bury rule (GET/PUT buries): the documents it holds are scored lower; nothing else moves. */
export interface BuryRule extends Omit<BoostRule, 'strength'> {
  strength: BuryStrength;
}

/** A dataset's query parameters: what its searches take where they send none, member by member. */
export interface DatasetQueryParameters {
  mode?: SearchMode | null;
  match?: MatchSetup | null;
  candidates?: CandidateSetup | null;
  ranking?: RankingProxy | null;
}

/** GET query-parameters: what the dataset sets (null elsewhere), and what a search that sends
 * none of these values runs with, every value filled in. */
export interface QueryParametersResponse {
  parameters: DatasetQueryParameters;
  effective: DatasetQueryParameters;
}

/** A field profile: a searched field's tolerance, rerank weight and pattern setup under one name. */
export interface FieldProfile {
  id: string;
  name: string;
  about?: string | null;
  builtIn?: boolean;
  tolerance: Tolerance;
  rerankWeight: number;
  indexSizes: number[];
  numberOfStartCharacters: number;
  numberOfStopCharacters: number;
  typingPrefixFrom?: number | null;
}

/** A profile as GET fields/profiles shows it: whether this dataset changed a built-in, and the
 * fields that have it. */
export interface FieldProfileView extends FieldProfile {
  edited: boolean;
  fields: string[];
}

/** GET fields/profiles. */
export interface FieldProfilesResponse {
  profiles: FieldProfileView[];
  /** Field name to profile id. */
  assignments: { [field: string]: string };
  /** Searched fields with settings of their own, no profile. */
  custom: string[];
  /** The profile a field gets when it becomes searched. */
  defaultProfileId: string;
}

/** PUT fields/profiles. A part left out (null) is left as it is: `profiles` is the dataset's own
 * list, whole; `assignments` gives fields a profile by id, or null for none. */
export interface FieldProfilesRequest {
  profiles?: FieldProfile[] | null;
  assignments?: { [field: string]: string | null } | null;
  defaultProfileId?: string | null;
}
