import { useState, useEffect } from 'react';
import { SystemState } from '@indxsearch/indx-types';

export interface IndxAuthResult {
  token: string | null;
  isFetchingInitial: boolean;
  initialFacetStats: Record<string, { min: number; max: number }>;
  initialFacetKeys: Record<string, string[]>;
  filterableFields: string[];
  facetableFields: string[];
  sortableFields: string[];
  totalDocumentCount: number;
}

interface UseIndxAuthOptions {
  url: string;
  team: string;
  dataset: string;
  preAuthenticatedToken?: string;
  enableDebugLogs?: boolean;
}

export function useIndxAuth({
  url,
  team,
  dataset,
  preAuthenticatedToken,
  enableDebugLogs = false,
}: UseIndxAuthOptions): IndxAuthResult {
  const [token, setToken] = useState<string | null>(null);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [filterableFields, setFilterableFields] = useState<string[]>([]);
  const [facetableFields, setFacetableFields] = useState<string[]>([]);
  const [sortableFields, setSortableFields] = useState<string[]>([]);
  const [initialFacetStats, setInitialFacetStats] = useState<Record<string, { min: number; max: number }>>({});
  const [initialFacetKeys, setInitialFacetKeys] = useState<Record<string, string[]>>({});
  const [totalDocumentCount, setTotalDocumentCount] = useState(0);

  useEffect(() => {
    const authenticate = async () => {
      try {
        if (!preAuthenticatedToken) {
          console.error('[Auth] ❌ Missing bearer token');
          console.error('[Auth] 💡 Pass preAuthenticatedToken to SearchProvider (create a token on the IndxCloudApi website)');
          throw new Error('A bearer token is required. Check console for instructions.');
        }
        if (!url) {
          console.error('[Auth] ❌ Missing INDX server URL');
          console.error('[Auth] 💡 Pass a url to SearchProvider');
          throw new Error('INDX server URL is required. Check console for instructions.');
        }
        if (!dataset) {
          console.error('[Auth] ❌ Missing dataset name');
          console.error('[Auth] 💡 Pass dataset="your-dataset-name" to SearchProvider');
          throw new Error('Dataset name is required. Check console for instructions.');
        }

        if (enableDebugLogs) console.log('[Auth] ✅ Using bearer token');
        const sessionToken = preAuthenticatedToken;

        // Establish dataset session
        if (enableDebugLogs) console.log('[Auth] 🔓 Opening dataset session...');
        const createOrOpenRes = await fetch(`${url}/api/teams/${team}/datasets/${dataset}/CreateOrOpen/400`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`,
          },
          body: '""',
        });

        if (!createOrOpenRes.ok) {
          console.error('[Auth] ❌ CreateOrOpen failed:', createOrOpenRes.status, await createOrOpenRes.text());
          throw new Error('Failed to open dataset session.');
        }

        setToken(sessionToken);
        if (enableDebugLogs) console.log('[Auth] ✅ Dataset session established');

        const authFetch = (fetchUrl: string) =>
          fetch(fetchUrl, {
            method: 'GET',
            headers: { accept: 'text/plain', 'Authorization': `Bearer ${sessionToken}` },
            credentials: 'include',
          });

        // Check dataset status
        if (enableDebugLogs) console.log('[Auth] 🔍 Checking dataset status...');
        const statusRes = await authFetch(`${url}/api/teams/${team}/datasets/${dataset}/GetStatus`);

        if (!statusRes.ok) {
          if (statusRes.status === 401) {
            console.error('[Auth] ❌ Authentication failed (401 Unauthorized)');
            console.error('[Auth] 💡 Your token may be expired or invalid');
            console.error('[Auth] 💡 Create or refresh your token on the IndxCloudApi website');
            throw new Error('Authentication failed (401). Token may be expired. Check console for instructions.');
          } else if (statusRes.status === 404) {
            console.error('[Auth] ❌ Dataset "' + dataset + '" not found (404)');
            console.error('[Auth] 💡 Available datasets can be checked with: curl -X GET "' + url + '/api/GetUserDataSets" -H "Authorization: Bearer YOUR_TOKEN"');
            console.error('[Auth] 💡 Make sure you spelled the dataset name correctly');
            throw new Error('Dataset "' + dataset + '" not found. Check console for instructions.');
          } else {
            const errorText = await statusRes.text();
            console.error('[Auth] ❌ Failed to get dataset status:', statusRes.status, errorText);
            console.error('[Auth] 💡 Check if your INDX server is running at:', url);
            throw new Error('Failed to connect to INDX server. Check console for details.');
          }
        }

        const statusData = await statusRes.json();
        if (enableDebugLogs) console.log('[Auth] 📊 Dataset status:', statusData);

        if (statusData.systemState !== undefined && statusData.systemState !== SystemState.Ready) {
          console.warn('[Auth] ⚠️ Dataset is not ready yet. Current state:', SystemState[statusData.systemState]);
          console.warn('[Auth] 💡 Wait for indexing to complete before searching');
        }

        const recordCount = statusData.documentCount ?? statusData.numberOfRecords ?? 0;
        if (recordCount === 0) {
          console.warn('[Auth] ⚠️ Dataset "' + dataset + '" is empty (0 records)');
          console.warn('[Auth] 💡 Add documents to your dataset before searching');
          console.warn('[Auth] 💡 Search will work but return no results');
        } else if (enableDebugLogs) {
          console.log('[Auth] ✅ Dataset has', recordCount, 'records');
        }

        // Fetch field metadata in parallel
        const [filterableRes, facetableRes, sortableRes] = await Promise.all([
          authFetch(`${url}/api/teams/${team}/datasets/${dataset}/GetFilterableFields`),
          authFetch(`${url}/api/teams/${team}/datasets/${dataset}/GetFacetableFields`),
          authFetch(`${url}/api/teams/${team}/datasets/${dataset}/GetSortableFields`),
        ]);

        if (!filterableRes.ok) {
          console.error('[Auth] ❌ GetFilterableFields failed:', filterableRes.status, await filterableRes.text());
          throw new Error('Failed to get filterable fields. Check console for details.');
        }
        if (!facetableRes.ok) {
          console.error('[Auth] ❌ GetFacetableFields failed:', facetableRes.status, await facetableRes.text());
          throw new Error('Failed to get facetable fields. Check console for details.');
        }
        if (!sortableRes.ok) {
          console.error('[Auth] ❌ GetSortableFields failed:', sortableRes.status, await sortableRes.text());
          throw new Error('Failed to get sortable fields. Check console for details.');
        }

        const [filterable, facetable, sortable] = await Promise.all([
          filterableRes.json().catch(err => { console.error('Failed to parse GetFilterableFields response:', err); return []; }),
          facetableRes.json().catch(err => { console.error('Failed to parse GetFacetableFields response:', err); return []; }),
          sortableRes.json().catch(err => { console.error('Failed to parse GetSortableFields response:', err); return []; }),
        ]);
        setFilterableFields(filterable || []);
        setFacetableFields(facetable || []);
        setSortableFields(sortable || []);
        setTotalDocumentCount(recordCount);

        // Initial blank search to get global facet bounds
        let blankSearchData: any = { facets: {} };
        try {
          const blankSearchResponse = await fetch(`${url}/api/teams/${team}/datasets/${dataset}/Search`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${sessionToken}`,
            },
            credentials: 'include',
            body: JSON.stringify({ text: '', maxNumberOfRecordsToReturn: 0, enableFacets: true }),
          });

          if (blankSearchResponse.ok) {
            blankSearchData = await blankSearchResponse.json().catch(err => {
              console.warn('Failed to parse blank search response:', err);
              return { facets: {} };
            });
          } else {
            console.warn('Blank search failed:', blankSearchResponse.status, blankSearchResponse.statusText);
            console.warn('Continuing without initial facet data - facets will be populated after first search');
          }
        } catch (err) {
          console.warn('Blank search error:', err);
          console.warn('Continuing without initial facet data - facets will be populated after first search');
        }

        const newFacetStats: Record<string, { min: number; max: number }> = {};
        if (blankSearchData.facets) {
          for (const [field, values] of Object.entries(blankSearchData.facets)) {
            if (Array.isArray(values) && values.length > 0) {
              const numericValues = (values as any[])
                .map(v => Number(v.key))
                .filter((v: number) => !isNaN(v));
              if (numericValues.length > 0) {
                newFacetStats[field] = {
                  min: Math.min(...numericValues),
                  max: Math.max(...numericValues),
                };
              }
            }
          }
        }

        const extractedFacetKeys: Record<string, string[]> = {};
        if (blankSearchData.facets) {
          for (const [field, values] of Object.entries(blankSearchData.facets)) {
            if (Array.isArray(values)) {
              extractedFacetKeys[field] = (values as any[]).map(v => v.key);
            }
          }
        }

        setInitialFacetStats(newFacetStats);
        setInitialFacetKeys(extractedFacetKeys);

        if (enableDebugLogs) console.log('[Auth] ✅ Initialization complete');
      } catch (err) {
        console.error('[Auth] ❌ Initialization failed:', err);

        if (err instanceof Error) {
          console.error('[Auth] 💡 Error:', err.message);
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
          console.error('[Auth] 💡 Error:', (err as any).message);
        }

        if (err instanceof TypeError && err.message.includes('fetch')) {
          console.error('[Auth] ❌ Network error - cannot connect to INDX server');
          console.error('[Auth] 💡 Check if the server is running at:', url);
          console.error('[Auth] 💡 Check the url you passed to SearchProvider');
          console.error('[Auth] 💡 For local development, it should be: http://localhost:5001');
        }

        throw err;
      } finally {
        setIsFetchingInitial(false);
      }
    };

    authenticate();
  }, [url, team, dataset]); // preAuthenticatedToken and enableDebugLogs intentionally omitted — runtime-only

  return {
    token,
    isFetchingInitial,
    initialFacetStats,
    initialFacetKeys,
    filterableFields,
    facetableFields,
    sortableFields,
    totalDocumentCount,
  };
}
