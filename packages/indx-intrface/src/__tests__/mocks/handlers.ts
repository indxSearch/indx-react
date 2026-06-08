import { http, HttpResponse } from 'msw';
import { DOCUMENTS, FACETS, SEARCH_RESPONSE } from './fixtures';

const BASE = 'http://localhost';
const TEAM = 'team';
const DS = 'test';
const DS_BASE = `${BASE}/api/teams/${TEAM}/datasets/${DS}`;

export const handlers = [
  http.put(`${DS_BASE}/CreateOrOpen/:timeout`, () =>
    HttpResponse.json({})),

  http.get(`${DS_BASE}/GetStatus`, () =>
    HttpResponse.json({ systemState: 4 /* Ready */, documentCount: 100 })),

  // Field metadata
  http.get(`${DS_BASE}/GetFilterableFields`, () =>
    HttpResponse.json(['price', 'category'])),

  http.get(`${DS_BASE}/GetFacetableFields`, () =>
    HttpResponse.json(['price', 'category'])),

  http.get(`${DS_BASE}/GetSortableFields`, () =>
    HttpResponse.json(['price', 'title'])),

  // Search — returns facets always so rangeBounds / facetStats tests work
  http.post(`${DS_BASE}/Search`, () =>
    HttpResponse.json(SEARCH_RESPONSE)),

  // Document fetch
  http.post(`${DS_BASE}/GetJson`, () =>
    HttpResponse.json(DOCUMENTS)),

  // Filter proxy builders
  http.put(`${DS_BASE}/CreateValueFilter`, () =>
    HttpResponse.json({ hashString: 'vf-1' })),

  http.put(`${DS_BASE}/CreateRangeFilter`, () =>
    HttpResponse.json({ hashString: 'rf-1' })),

  http.put(`${DS_BASE}/CombineFilters`, () =>
    HttpResponse.json({ hashString: 'combined-1' })),
];
