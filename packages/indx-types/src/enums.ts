// Every enum is written by name on the wire since 6.0 (the server's JsonStringEnumConverter); a
// number in a request is still read, but these types say the names.

// Hibernated was removed Sep 2026 together with the server's: hibernation is a position in the
// pipeline, not a state. A hibernated dataset reports Created with recordsOnDisk > 0 in its
// status; the library's Hibernate() lands in Loaded.
export enum SystemState {
  Created = 'Created',
  Loading = 'Loading',
  Loaded = 'Loaded',
  Indexing = 'Indexing',
  Ready = 'Ready',
  Error = 'Error'
}

export enum BoostStrength {
  Low = 'Low',
  Med = 'Med',
  High = 'High'
}

/** The counterpart of {@link BoostStrength}: how far a bury lowers the documents its filter holds. */
export enum BuryStrength {
  Low = 'Low',
  Med = 'Med',
  High = 'High'
}

/**
 * How a SynonymEntry expands. Multidirectional: every term in the entry triggers the whole
 * group. OneWay: only `source` expands, into `terms` (acronyms).
 */
export enum SynonymDirection {
  Multidirectional = 'Multidirectional',
  OneWay = 'OneWay'
}

/** How a search finds and orders its documents (QueryProxy.mode). */
export enum SearchMode {
  /** Pattern recognition (BM25F) alone: no word lookup, no count. */
  Bm25f = 'Bm25f',
  /** The records holding every query word, within the tolerance, ordered by rung and BM25F. */
  EditDistance = 'EditDistance',
  /** The same records, ordered by rung and the blend of Coverage and BM25F. The default. */
  Coverage = 'Coverage'
}

/** The rungs a query word is met on: as typed, within one edit, within two. */
export enum Tolerance {
  Exact = 'Exact',
  OneEdit = 'OneEdit',
  TwoEdits = 'TwoEdits'
}

/** Which rungs a search counts (MatchSetup.rungs). */
export enum Rungs {
  /** The first rung that gives hits. The default. */
  Fewest = 'Fewest',
  /** Every rung up to the tolerance, the nearer ranked first. */
  All = 'All'
}

/** Which of the index's terms BM25F scores with (CandidateSetup.indexTerms). */
export enum IndexTerms {
  Both = 'Both',
  Words = 'Words',
  Patterns = 'Patterns'
}

/** What a field may confirm in Coverage (FieldProxy.coverageStrictness). */
export enum CoverageStrictness {
  None = 'None',
  Ldd0 = 'Ldd0',
  Ldd1 = 'Ldd1',
  Ldd2 = 'Ldd2'
}
