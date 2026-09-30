// Hibernated = -1 was removed Sep 2026 together with the server's: hibernation is a position in
// the pipeline, not a state. A hibernated dataset reports Created with recordsOnDisk > 0 in its
// status; the library's Hibernate() lands in Loaded.
export enum SystemState {
  Created = 0,
  Loading = 1,
  Loaded = 2,
  Indexing = 3,
  Ready = 4,
  Error = 255
}

export enum BoostStrength {
  Low = 1,
  Medium = 2,
  High = 3
}

/**
 * How a SynonymEntry expands. Multidirectional: every term in the entry triggers the whole
 * group. OneWay: only `source` expands, into `terms` (acronyms).
 * Numeric on the wire, like every enum in this API.
 */
export enum SynonymDirection {
  Multidirectional = 0,
  OneWay = 1
}
