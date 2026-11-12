import { FilterProxy } from './filters.js';
import { BoostProxy, BuryProxy } from './boost.js';
import { IndexTerms, Rungs, SearchMode, Tolerance } from './enums.js';

/** What counts as a hit. Every member optional: a member left out is the server's default. */
export interface MatchSetup {
  /** The most a word may differ by; caps each field's own (FieldProxy.tolerance). Default TwoEdits. */
  tolerance?: Tolerance;
  /** Fewest (the default): the first rung with hits. All: every rung up to the tolerance. */
  rungs?: Rungs;
  /** The shortest word given one edit (3), two (6) and three (9, where the tolerance is ThreeEdits); 0 is never. */
  oneEditFrom?: number;
  twoEditsFrom?: number;
  threeEditsFrom?: number;
  /** Where the cursor is in the text: the word it is in is the one being typed. Null: the last word. */
  cursorAt?: number | null;
  /** The word being typed also as the start of a longer word from this many letters (3), and within one edit from (6). */
  typingPrefixFrom?: number;
  typingPrefixOneEditFrom?: number;
  /** Words written together or apart count as the word. Default true. */
  joinedWords?: boolean;
}

/** Who comes in. */
export interface CandidateSetup {
  /** The candidates per row asked for (4): the bound is the rows times this, at most 5 000. */
  candidatesPerRow?: number;
  /** The bound itself, when set. */
  maxCandidates?: number | null;
  /** Which terms BM25F scores with. Default Both. */
  indexTerms?: IndexTerms;
  /** When no record holds every word: the most words, then pattern matches (isFallback). Default true. */
  fallback?: boolean;
  /** In EditDistance, BM25F's best not counted below the counted set, counted (toleranceCounts.rest)
   * and in the facets. Default false. */
  rest?: boolean;
  /** A page short of the rows filled, below the counted and not counted, with the records holding
   * the most of the words (result.fill.mostWords). Default false. */
  fillWithMostWords?: boolean;
  /** How many typo levels past the counted one fill a short page, below it and not counted: 0 no
   * fill (default), 1 the next level, 2 up to two typos. */
  fillReach?: number;
}

/** The order inside the rungs, with the boosts and buries as the tokens their endpoints give. */
export interface RankingProxy {
  /** Whether the reranker orders the candidates by how their words were met, in either mode. Default true. */
  rerank?: boolean;
  /** The reranker's share of the score, 0 to 1. Default 0.2. */
  share?: number;
  /** How far the share moves towards the reranker while the last word is typed. Default 0.5. */
  typingShift?: number;
  longFieldFrom?: number;
  longFieldWeightFloor?: number;
  /** The whole query in a field floors the score. Default true. */
  wholeQueryFloor?: boolean;
  /** Per field, its reranker weight in this search. */
  fieldWeights?: Record<string, number> | null;
  /** Per field, a boost inside BM25F's saturation. */
  fieldBoosts?: Record<string, number> | null;
  /** A list that is not empty is on; the dataset's boost rules apply to every search beside them. */
  boosts?: BoostProxy[] | null;
  buries?: BuryProxy[] | null;
}

/** A search, as `POST .../search` takes it (6.0). */
export interface QueryProxy {
  text?: string | null;
  maxNumberOfRecordsToReturn?: number;
  /** How many ranked records to pass over before the first returned: page while `offset` is below
   * the result's `ranked`. Default 0. */
  offset?: number;
  /** EditDistance or Bm25f. Left out: the dataset's mode, else EditDistance. */
  mode?: SearchMode;
  /** Null or left out: the defaults. */
  match?: MatchSetup | null;
  candidates?: CandidateSetup | null;
  ranking?: RankingProxy | null;
  /** Return `matchReport`, in any mode: how each query word was met in each record. */
  enableMatchReport?: boolean;
  enableFacets?: boolean;
  /** The facetable fields to count; empty or left out counts every one. */
  facetFields?: string[] | null;
  /** The most values per facet field, the commonest first; 0 or left out returns them all.
   * `facetStats` is of every value counted either way. */
  facetValueLimit?: number;
  /** The records' JSON comes with the result, in `documents`, in the order of `records`: one call
   * instead of a search and a lookup. Default false. */
  includeDocuments?: boolean;
  /** With includeDocuments: only these top-level fields of each record. Null or empty: the whole record. */
  includeFields?: string[] | null;
  removeDuplicates?: boolean;
  sortAscending?: boolean;
  sortBy?: string | null;
  timeOutLimitMilliseconds?: number;
  filter?: FilterProxy | null;
  /** A filter expression, ANDed with `filter` when both are given. */
  filterExpression?: string | null;
  filterParameters?: Record<string, FilterProxy> | null;
  logPrefix?: string | null;
  /** The result then also says how well it explains the text: a {@link QueryFitResult}. */
  measureFit?: boolean;
}

/** One search of `POST .../search/multi`: a search that may say for itself how it goes into the
 * statistics, over the query string's `?count=`, `?source=` and `?session=`. */
export interface MultiSearchQuery extends QueryProxy {
  /** Whether this search is a visitor's; left out: the query string's. */
  count?: boolean | null;
  source?: string | null;
  session?: string | null;
}

/** One section of a {@link GroupedSearchRequest}. */
export interface SearchGroup {
  /** The section's key in the answer's `groups`; unique in the request. */
  name: string;
  /** A filter expression for the section, ANDed with the search's own `filterExpression`. */
  filter?: string | null;
  /** How many records the section lists; 0 lists none and still counts. */
  rows: number;
  /** Count by this filter instead of `filter`: list the upcoming events, count them all. */
  countFilter?: string | null;
  /** The section's own candidates, ranking and match, each replacing the search's whole. */
  candidates?: CandidateSetup | null;
  ranking?: RankingProxy | null;
  match?: MatchSetup | null;
  /** The section that is the visitor's search, the one recorded in the statistics; none marked: the first. */
  primary?: boolean;
}

/** The body of `POST .../search/groups`: one text answered in named sections. Everything but
 * `groups` is every section's. At most 20 groups. */
export interface GroupedSearchRequest extends QueryProxy {
  groups: SearchGroup[];
}
