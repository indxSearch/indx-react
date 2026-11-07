import { Tolerance } from './enums';

export interface FieldProxy {
  fieldName: string;
  /** Read-only on GET; ignored on SET. */
  fieldType?: string | null;
  /** Read-only on GET; ignored on SET. */
  isArray?: boolean | null;
  /** Read-only on GET: some records lack the field. */
  optional?: boolean | null;
  /** Read-only on GET: a value of the field from the analysed records. */
  sampleValue?: string | null;
  /** Searched by its words, and in the word lookup. A field with neither this nor patternMatching is not searched. */
  wordMatching?: boolean | null;
  filterable?: boolean | null;
  facetable?: boolean | null;
  sortable?: boolean | null;
  /** Matched inside its words (true) or by whole words only (false, the default). */
  patternMatching?: boolean | null;
  /** With pattern matching on: the index sizes, e.g. [3] or [2, 3]. */
  indexSizes?: number[] | null;
  numberOfStartCharacters?: number | null;
  numberOfStopCharacters?: number | null;
  embeddable?: boolean | null;
  preloadFilters?: boolean | null;
  /** Score weight multiplier (typical 1.0–3.0). Only meaningful when searchable. */
  weight?: number | null;
  /** Per-field length-normalisation parameter b. Range [0,1]. */
  bM25b?: number | null;
  /** Per-field term-frequency saturation parameter k1. Typical 1.0–2.0. */
  bM25k1?: number | null;
  /** The most a word may differ by in the field: Exact, OneEdit (the default), TwoEdits, ThreeEdits; a search's match.tolerance caps it. Until 6.0 coverageStrictness. */
  tolerance?: Tolerance | null;
  /** The field's weight in Coverage against the heaviest field; 0 leaves it out of Coverage (until 6.0 coverageStrictness None). */
  rerankWeight?: number | null;
  caseSensitive?: boolean | null;
}
