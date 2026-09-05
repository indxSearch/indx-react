import { http, HttpResponse } from 'msw';
import { DOCUMENTS, FACETS, SEARCH_RESPONSE } from './fixtures';

const BASE = 'http://localhost';
const TEAM = 'team';
const DS = 'test';
const DS_BASE = `${BASE}/api/teams/${TEAM}/datasets/${DS}`;

// Modern API surface (route modernization aug 2026): PUT on the dataset route
// itself is CreateOrOpen (201/200), reads live under status / fields/* /
// documents/*, filter tokens are POSTed under filters/*.
export const handlers = [
  http.put(DS_BASE, () =>
    HttpResponse.json({}, { status: 201 })),

  http.get(`${DS_BASE}/status`, () =>
    HttpResponse.json({ systemState: 4 /* Ready */, documentCount: 100 })),

  // Field metadata
  http.get(`${DS_BASE}/fields/filterable`, () =>
    HttpResponse.json(['price', 'category'])),

  http.get(`${DS_BASE}/fields/facetable`, () =>
    HttpResponse.json(['price', 'category'])),

  http.get(`${DS_BASE}/fields/sortable`, () =>
    HttpResponse.json(['price', 'title'])),

  // Search — returns facets always so rangeBounds / facetStats tests work
  http.post(`${DS_BASE}/search`, () =>
    HttpResponse.json(SEARCH_RESPONSE)),

  // Document fetch
  http.post(`${DS_BASE}/documents/lookup`, () =>
    HttpResponse.json(DOCUMENTS)),

  // Filter proxy builders. The returned hashString encodes the request so tests
  // can assert the AND/OR shape of the combined filter, e.g.
  //   ((category=running OR category=trail) AND range:price)
  http.post(`${DS_BASE}/filters/value`, async ({ request }) => {
    const { fieldName, value } = await request.json() as { fieldName: string; value: string };
    return HttpResponse.json({ hashString: `${fieldName}=${value}` });
  }),

  http.post(`${DS_BASE}/filters/range`, async ({ request }) => {
    const { fieldName } = await request.json() as { fieldName: string };
    return HttpResponse.json({ hashString: `range:${fieldName}` });
  }),

  http.post(`${DS_BASE}/filters/combine`, async ({ request }) => {
    const { a, b, useAndOperation } = await request.json() as {
      a: { hashString: string }; b: { hashString: string }; useAndOperation: boolean;
    };
    return HttpResponse.json({ hashString: `(${a.hashString} ${useAndOperation ? 'AND' : 'OR'} ${b.hashString})` });
  }),
];
