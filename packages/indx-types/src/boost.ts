import { BoostStrength, BuryStrength } from './enums.js';
import { FilterProxy } from './filters.js';

export interface BoostProxy {
  boostStrength: BoostStrength;
  filterProxy: FilterProxy;
}

/** A bury, the counterpart of a boost: from `buries/from-filter`, sent in `ranking.buries`. */
export interface BuryProxy {
  buryStrength: BuryStrength;
  filterProxy: FilterProxy;
}
