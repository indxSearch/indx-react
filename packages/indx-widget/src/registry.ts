type Convert = (documentKey: number, type: string, options?: { queryId?: string; quantity?: number }) => Promise<void>;

/** The search of each <indx-search> on the page, newest last: IndxSearch.convert() reports to the
 *  first one, which on a page with one element is the only one. */
const converters: Convert[] = [];

export function registerConverter(convert: Convert): () => void {
  converters.push(convert);
  return () => {
    const i = converters.indexOf(convert);
    if (i >= 0) converters.splice(i, 1);
  };
}

/** Reports a conversion (an order, an add to cart) on a document: credited to the search it was
 *  chosen from. Does nothing when no element is on the page; never throws. */
export async function convert(documentKey: number, type: string, options?: { queryId?: string; quantity?: number }) {
  await converters[0]?.(documentKey, type, options);
}
