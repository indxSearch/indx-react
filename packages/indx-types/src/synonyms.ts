import { SynonymDirection } from './enums';

/**
 * One synonym rule: a set of terms plus the direction they expand in. Multi-word terms are
 * matched as whole phrases.
 */
export interface SynonymEntry {
  direction: SynonymDirection;
  /** The trigger term for OneWay entries; null/omitted for Multidirectional ones. */
  source?: string | null;
  /** Terms appended to the query when the entry matches. */
  terms: string[];
}

/**
 * A dataset's synonym list. GET/PUT api/teams/{team}/datasets/{dataset}/synonyms —
 * GET returns the list or a literal null; PUT replaces it (a null body removes it, editor
 * role required). Expansion happens at search time, so a PUT applies on the next search
 * with no re-indexing.
 */
export interface SynonymList {
  name?: string;
  description?: string | null;
  updatedUtc?: string;
  entries: SynonymEntry[];
}
