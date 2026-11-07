import { FilterProxy } from './filters';
import { BoostProxy, BuryProxy } from './boost';
import { IndexTerms, Rungs, SearchMode, Tolerance } from './enums';

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
  /** Whether Coverage reranks the candidates, in either mode. Default true. */
  rerank?: boolean;
  /** Coverage's share of the score, 0 to 1. Default 0.2. */
  share?: number;
  /** How far the share moves towards Coverage while the last word is typed. Default 0.5. */
  typingShift?: number;
  longFieldFrom?: number;
  longFieldWeightFloor?: number;
  /** The whole query in a field floors the score. Default true. */
  wholeQueryFloor?: boolean;
  /** Per field, its Coverage weight in this search. */
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
  /** Default Coverage. */
  mode?: SearchMode;
  /** Null or left out: the defaults. */
  match?: MatchSetup | null;
  candidates?: CandidateSetup | null;
  ranking?: RankingProxy | null;
  /** Return `matchReport`, in any mode: how each query word was met in each record. */
  enableMatchReport?: boolean;
  enableFacets?: boolean;
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
