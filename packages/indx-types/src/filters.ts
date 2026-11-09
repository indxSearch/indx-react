export interface FilterProxy {
  hashString?: string | null;
}

export interface RangeFilterProxy {
  fieldName: string;
  lowerLimit: number;
  upperLimit: number;
}

export interface ValueFilterProxy {
  fieldName: string;
  value?: any | null;
  /** Match the value's casing exactly; off by default, so "fire" also matches Fire and FIRE. */
  isCaseSensitive?: boolean;
}

/** The body of POST filters/in: documents whose field holds one of the values, as one filter.
 * Numbers compare as numbers on a numeric field. */
export interface InFilterProxy {
  fieldName: string;
  values: Array<string | number | boolean>;
  isCaseSensitive?: boolean;
}

/** The body of POST filters/position: documents within `withinMeter` metres of a position. The
 * field is an object `{ latitude, longitude }` whose two numbers are Filterable. */
export interface PositionFilterProxy {
  fieldName: string;
  latitude: number;
  longitude: number;
  withinMeter: number;
}

/** The body of POST filters/expression: `brand IN ["nike", "puma"] AND price BETWEEN 100 AND 2000`;
 * `parameters` gives the filter token for each `$name` placeholder. */
export interface FilterExpressionProxy {
  expression: string;
  parameters?: { [name: string]: FilterProxy } | null;
}

/** The answer of POST filters/expression: the filter's token, and the expression as the engine
 * reads it (values case-folded as compared); null `canonical` when a placeholder has no expression. */
export interface FilterExpressionResultProxy {
  hashString: string;
  canonical?: string | null;
}

/** One error of an expression that makes no filter, in a 400 `invalidFilterExpression`'s `errors`. */
export interface FilterExpressionErrorDetail {
  kind: 'syntax' | 'unknownField' | 'fieldNotFilterable' | 'typeMismatch' | 'invalidNumber' | 'emptyRange'
    | 'limitExceeded' | 'unknownParameter' | 'invalidValue' | 'notInitialized' | (string & {});
  message: string;
  /** Where in the expression, in characters. */
  start: number;
  length: number;
  /** A correction, when one is likely (a field name close to the one typed). */
  suggestion?: string | null;
}

/**
 * The body of POST filters/combine: two or more filters combined with AND or OR into one
 * filter. One request for the whole list; the same set in any order gives the same token, and
 * one filter gives its own.
 */
export interface CombinedFilterProxy {
  filters: FilterProxy[];
  useAndOperation: boolean;
}

export interface UpdateFieldProxy {
  fieldName?: string | null;
  value?: any | null;
}

export interface FilterFieldUpdateProxy {
  filter?: FilterProxy | null;
  fieldName?: string | null;
  value?: any | null;
}
