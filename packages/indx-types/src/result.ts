import { StringInt32KeyValuePair } from './common';

export interface ScoreEntry {
  documentKey: number;
  score: number;
}

export interface Result {
  records?: ScoreEntry[] | null;
  facets?: { [key: string]: StringInt32KeyValuePair[] } | null;
  didTimeOut: boolean;
  truncationIndex: number;
  truncationScore: number;
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
