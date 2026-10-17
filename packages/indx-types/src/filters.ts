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
