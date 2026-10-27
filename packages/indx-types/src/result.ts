import { StringInt32KeyValuePair } from './common';

export interface ScoreEntry {
  documentKey: number;
  score: number;
}

/** How Coverage met a query word in a record. */
export type WordMatch =
  | 'NotFound' | 'Whole' | 'Prefix' | 'Suffix' | 'Joined' | 'RunTogether' | 'OneEdit' | 'TwoEdits' | number;

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

/** What Coverage found in the returned records (query.enableCoverageReport). */
export interface CoverageReport {
  /** Per record, in the order of `records`. */
  matches?: RecordMatch[] | null;
  /** Per field: how many query words were met each way, over the returned records. */
  matchesByField?: { [field: string]: { [how: string]: number } } | null;
}

export interface Result {
  records?: ScoreEntry[] | null;
  facets?: { [key: string]: StringInt32KeyValuePair[] } | null;
  didTimeOut: boolean;
  truncationIndex: number;
  truncationScore: number;
  /** Null unless the query asked for it with Coverage on. */
  coverageReport?: CoverageReport | null;
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
