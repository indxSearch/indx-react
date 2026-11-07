import { StringInt32KeyValuePair } from './common';
import { SystemState, Tolerance } from './enums';
import { ProcessError } from './errors';

export interface ScoreEntry {
  documentKey: number;
  score: number;
}

/** How Coverage met a query word in a record. */
export type WordMatch =
  | 'NotFound' | 'Whole' | 'Prefix' | 'Suffix' | 'Joined' | 'RunTogether' | 'OneEdit' | 'TwoEdits' | 'ThreeEdits' | 'Synonym' | number;

export interface QueryWordMatch {
  word: string;
  /** The field that confirmed the word; null when none did. */
  field?: string | null;
  how: WordMatch;
}

export interface RecordMatch {
  documentKey: number;
  /** The query's words, in its order. */
  words: QueryWordMatch[];
}

/** How each query word was met in the returned records (query.enableMatchReport). */
export interface MatchReport {
  /** Per record, in the order of `records`. */
  matches?: RecordMatch[] | null;
  /** Per field: how many query words were met each way, over the returned records. */
  matchesByField?: { [field: string]: { [how: string]: number } } | null;
}

/** How many listed records fill a short page, and from where (result.fill). */
export interface PageFill {
  nextRungs: number;
  mostWords: number;
}

/** How many records hold every query word on each rung, each with those before it; a rung not
 * worked out is null. */
export interface ToleranceCounts {
  exact: number;
  oneEdit?: number | null;
  twoEdits?: number | null;
  threeEdits?: number | null;
  /** With candidates.rest: the counted rung and the rest taken below it, up to the bound. */
  rest?: number | null;
  /** Of the counted, those holding a run of words only through a synonym; null when none fired. */
  throughSynonym?: number | null;
}

export interface Result {
  records?: ScoreEntry[] | null;
  facets?: { [key: string]: StringInt32KeyValuePair[] } | null;
  didTimeOut: boolean;
  /** Set when the search was refused rather than finding nothing. */
  reason?: ProcessError | null;
  systemState?: SystemState;
  /** The count; null in Bm25f mode. Until 6.0 the result carried truncationIndex and truncationScore. */
  toleranceCounts?: ToleranceCounts | null;
  /** The rung the list was taken from; null when nothing was counted. */
  countedTolerance?: Tolerance | null;
  /** How many records answer, in every mode: the rung counted (with the rest), the fallback's most
   * words, every record BM25F scored, or every record the filter lets through in an empty search.
   * count > ranked: an overflow at the depth. Until 2 Nov 2026 `overflow`. */
  count?: number;
  /** How many were ranked, at most the candidate bound. ranked > records.length: an overflow at the rows. */
  ranked?: number;
  /** Nothing was counted: the records holding the most of the words, then pattern matches. */
  isFallback?: boolean;
  /** Null unless the query asked for it. */
  matchReport?: MatchReport | null;
  /** Whether the reranker ordered the list (ranking.rerank as the search ran it). */
  reranked?: boolean;
  /** How many listed records fill a short page, not counted: from the next typo levels (every
   * word), then holding the most of the words. In that order after the counted records. Null
   * without the word lookup (Bm25f mode). */
  fill?: PageFill | null;
}

/** A {@link Result} of a search with `measureFit`: how well the results explain the text. */
export interface QueryFitResult extends Result {
  /** Share of the query's weight (its words' IDF) the best explaining result explains, 0 to 1. */
  explainedShare: number;
  /** Share carried by informative words no result explains, 0 to 1. */
  unexplainedShare: number;
  explainedWords: string[];
  unexplainedWords: string[];
}
