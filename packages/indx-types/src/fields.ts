export interface FieldProxy {
  fieldName: string;
  /** Read-only on GET; ignored on SET. */
  fieldType?: string | null;
  /** Read-only on GET; ignored on SET. */
  isArray?: boolean | null;
  searchable?: boolean | null;
  filterable?: boolean | null;
  facetable?: boolean | null;
  sortable?: boolean | null;
  wordIndexing?: boolean | null;
  embeddable?: boolean | null;
  preloadFilters?: boolean | null;
  /** Score weight multiplier (typical 1.0–3.0). Only meaningful when searchable. */
  weight?: number | null;
  /** Per-field length-normalisation parameter b. Range [0,1]. */
  bM25b?: number | null;
  /** Per-field term-frequency saturation parameter k1. Typical 1.0–2.0. */
  bM25k1?: number | null;
  /** High-resolution indexing: also index/query N-grams with all delimiters removed, so a
   *  run-together or split query matches across them. Only meaningful when searchable. */
  highResolution?: boolean | null;
}
