import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchContext } from '../context/SearchContext';
import type { FilterProxy } from '@indxsearch/indx-types';
import { IndxApiError } from '../context/IndxApiError';

export interface EmbeddingResult {
  document: any;
  documentKey: number;
  score: number;
}

export interface UseVectorSearchOptions {
  fieldName: string;
  maxResults?: number;
  filter?: FilterProxy | null;
  timeoutMs?: number;
}

export function useVectorSearch(
  embeddingFn: (text: string) => Promise<number[]>,
  options: UseVectorSearchOptions
) {
  const { url, team, dataset, authenticatedFetch } = useSearchContext();
  const [results, setResults] = useState<EmbeddingResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  // Each search takes the next generation; only the latest writes results, errors or the loading
  // flag. Without it an older search finishing last (a slow embedding) overwrote the newer
  // results, an older failure cleared them, and the first to finish turned loading off.
  const generation = useRef(0);
  // Unmounted, or pointed at another dataset: what is in flight belongs to neither.
  useEffect(() => () => { generation.current++; }, [url, team, dataset]);

  const search = useCallback(async (text: string) => {
    const mine = ++generation.current;
    const current = () => mine === generation.current;
    setIsLoading(true);
    setError(undefined);
    try {
      const vector = await embeddingFn(text);

      const body: Record<string, unknown> = {
        fieldName: options.fieldName,
        vector,
        maxResults: options.maxResults ?? 10,
      };
      if (options.filter) body.filter = options.filter;

      const response = await authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/search/vector`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw await IndxApiError.fromResponse('VectorSearch', response);

      const entries: Array<{ documentKey: number; score: number }> = await response.json();
      if (!current()) return;
      if (entries.length === 0) {
        setResults([]);
        return;
      }

      const keys = entries.map(e => e.documentKey);
      const jsonResponse = await authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/documents/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keys),
      });

      if (!jsonResponse.ok) throw await IndxApiError.fromResponse('GetJson', jsonResponse);
      const documents: any[] = await jsonResponse.json();
      if (!current()) return;

      setResults(documents.map((doc, idx) => ({
        document: doc,
        documentKey: keys[idx],
        score: entries[idx].score,
      })));
    } catch (err) {
      if (!current()) return;
      setError(err instanceof Error ? err.message : 'Vector search failed');
      setResults(null);
    } finally {
      if (current()) setIsLoading(false);
    }
  }, [embeddingFn, options.fieldName, options.maxResults, options.filter, url, team, dataset, authenticatedFetch]);

  return { results, isLoading, error, search };
}
