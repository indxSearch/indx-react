import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { buildFilterProxy } from '../context/buildFilterProxy';
import { server } from './mocks/server';

const URL = 'http://localhost';
const fetchPlain = (url: string, options?: RequestInit) => fetch(url, options);
const build = (
  filters: Record<string, string[]>,
  ranges: Record<string, { min: number; max: number }> = {},
  match: Record<string, 'all' | 'any'> = {}
) => buildFilterProxy(filters, ranges, URL, 'team', 'test', fetchPlain, match);

describe('buildFilterProxy', () => {
  it('returns null when nothing is selected', async () => {
    expect(await build({})).toBeNull();
  });

  it('passes a single value filter through without combining', async () => {
    const proxy = await build({ category: ['running'] });
    expect(proxy.hashString).toBe('category=running');
  });

  it('ANDs several values on the same field by default', async () => {
    // Multi-valued fields (genres, tags): each extra tick narrows to documents
    // carrying every selected value.
    const proxy = await build({ genre: ['horror', 'comedy'] });
    expect(proxy.hashString).toBe('(genre=horror AND genre=comedy)');
  });

  it("ORs values on a field registered with match 'any'", async () => {
    // Scalar fields: a document can only equal one value, so AND would return nothing.
    const proxy = await build({ category: ['running', 'trail'] }, {}, { category: 'any' });
    expect(proxy.hashString).toBe('(category=running OR category=trail)');
  });

  it('ANDs across fields and with range filters', async () => {
    const proxy = await build(
      { category: ['running', 'trail'], brand: ['acme'] },
      { price: { min: 10, max: 50 } },
      { category: 'any' }
    );
    expect(proxy.hashString).toBe('(((category=running OR category=trail) AND brand=acme) AND range:price)');
  });

  it('rejects when a filter call fails instead of dropping it', async () => {
    server.use(
      http.post(`${URL}/api/teams/team/datasets/test/filters/range`, () =>
        HttpResponse.json({ title: 'Invalid argument', detail: "Field 'speed' is not filterable" }, { status: 400 })),
    );
    await expect(build({}, { speed: { min: 1, max: 2 } }))
      .rejects.toThrow(/Range filter 'speed' failed: HTTP 400 — Field 'speed' is not filterable/);
  });
});
