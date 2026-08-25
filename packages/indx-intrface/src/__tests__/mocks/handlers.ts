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

  // Filter proxy builders
  http.post(`${DS_BASE}/filters/value`, () =>
    HttpResponse.json({ hashString: 'vf-1' })),

  http.post(`${DS_BASE}/filters/range`, () =>
    HttpResponse.json({ hashString: 'rf-1' })),

  http.post(`${DS_BASE}/filters/combine`, () =>
    HttpResponse.json({ hashString: 'combined-1' })),
];
