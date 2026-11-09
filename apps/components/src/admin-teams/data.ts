// Mock data for the Admin > Teams mockup: what the server can read per team today. Members and
// roles (TeamMember), datasets and their documents (the registry, read from the store, so a
// sleeping one counts), keys (ApiKey: team or personal, level, expiry) and searches per day
// (StatisticsStore.TimeSeries, summed over the team's datasets). There is no last sign-in and
// no key last-used yet, so neither is shown.

export type Role = 'Admin' | 'Editor' | 'Viewer';
export interface Member { email: string; role: Role; joinedDays: number }
export interface Dataset { name: string; documents: number; state: 'Ready' | 'Sleeping' }
export interface Key { name: string; level: 'Search' | 'Read' | 'Full'; team: boolean; expiresInDays: number | null }
export interface Team {
  name: string;
  createdDays: number;
  members: Member[];
  datasets: Dataset[];
  keys: Key[];
  /** Searches per day, the last 30, today last. */
  searches: number[];
  /** The share of those searches that found nothing. */
  zeroHits: number;
}

export const nf = new Intl.NumberFormat('en-US');

// A small seeded generator, so the mockup looks the same on every load.
function rng(seed: number) {
  return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
}

function series(seed: number, level: number, shape: 'steady' | 'rising' | 'bursty' | 'quiet' | 'none'): number[] {
  const r = rng(seed);
  return Array.from({ length: 30 }, (_, i) => {
    if (shape === 'none') return 0;
    const weekend = (i + 3) % 7 >= 5 ? 0.55 : 1;
    const base = shape === 'rising' ? level * (0.3 + i / 30)
      : shape === 'bursty' ? (r() > 0.8 ? level * 3 : level * 0.3)
      : shape === 'quiet' ? (r() > 0.6 ? level : 0)
      : level;
    return Math.round(base * weekend * (0.75 + r() * 0.5));
  });
}

export const TEAMS: Team[] = [
  {
    name: 'acme-retail', createdDays: 212, zeroHits: 0.041,
    members: [
      { email: 'kari@acme.example', role: 'Admin', joinedDays: 212 },
      { email: 'ole@acme.example', role: 'Admin', joinedDays: 180 },
      { email: 'sofie@acme.example', role: 'Editor', joinedDays: 96 },
      { email: 'build@acme.example', role: 'Viewer', joinedDays: 40 },
    ],
    datasets: [
      { name: 'products', documents: 1_204_330, state: 'Ready' },
      { name: 'stores', documents: 812, state: 'Ready' },
      { name: 'help-articles', documents: 2_410, state: 'Sleeping' },
    ],
    keys: [
      { name: 'web shop', level: 'Search', team: true, expiresInDays: null },
      { name: 'feed import', level: 'Full', team: true, expiresInDays: 9 },
      { name: 'ole laptop', level: 'Read', team: false, expiresInDays: 60 },
    ],
    searches: series(1, 4200, 'steady'),
  },
  {
    name: 'nordic-books', createdDays: 140, zeroHits: 0.087,
    members: [
      { email: 'ingrid@nordicbooks.example', role: 'Admin', joinedDays: 140 },
      { email: 'mats@nordicbooks.example', role: 'Editor', joinedDays: 120 },
    ],
    datasets: [
      { name: 'catalogue', documents: 486_120, state: 'Ready' },
      { name: 'authors', documents: 31_904, state: 'Ready' },
    ],
    keys: [
      { name: 'website', level: 'Search', team: true, expiresInDays: null },
      { name: 'mats import', level: 'Full', team: false, expiresInDays: 20 },
    ],
    searches: series(2, 1300, 'rising'),
  },
  {
    name: 'docs-team', createdDays: 64, zeroHits: 0.152,
    members: [
      { email: 'anna@indx.example', role: 'Admin', joinedDays: 64 },
      { email: 'jonas@indx.example', role: 'Editor', joinedDays: 64 },
      { email: 'lea@indx.example', role: 'Editor', joinedDays: 30 },
    ],
    datasets: [
      { name: 'docs-chunks', documents: 18_220, state: 'Ready' },
    ],
    keys: [
      { name: 'docs site', level: 'Search', team: true, expiresInDays: null },
    ],
    searches: series(3, 260, 'bursty'),
  },
  {
    name: 'movie-night', createdDays: 33, zeroHits: 0.032,
    members: [
      { email: 'per@movienight.example', role: 'Admin', joinedDays: 33 },
    ],
    datasets: [
      { name: 'movies', documents: 9_742, state: 'Sleeping' },
      { name: 'people', documents: 52_118, state: 'Sleeping' },
    ],
    keys: [
      { name: 'per test', level: 'Full', team: false, expiresInDays: 3 },
    ],
    searches: series(4, 40, 'quiet'),
  },
  {
    name: 'trial-4821', createdDays: 21, zeroHits: 0,
    members: [
      { email: 'someone@trial.example', role: 'Admin', joinedDays: 21 },
    ],
    datasets: [],
    keys: [],
    searches: series(5, 0, 'none'),
  },
  {
    name: 'museum-archive', createdDays: 300, zeroHits: 0.118,
    members: [
      { email: 'hege@museum.example', role: 'Admin', joinedDays: 300 },
      { email: 'tor@museum.example', role: 'Viewer', joinedDays: 210 },
      { email: 'vilde@museum.example', role: 'Viewer', joinedDays: 12 },
    ],
    datasets: [
      { name: 'objects', documents: 241_006, state: 'Ready' },
      { name: 'photos', documents: 88_310, state: 'Sleeping' },
      { name: 'letters', documents: 6_090, state: 'Sleeping' },
      { name: 'exhibitions', documents: 412, state: 'Ready' },
    ],
    keys: [
      { name: 'collection site', level: 'Search', team: true, expiresInDays: null },
      { name: 'kiosk', level: 'Search', team: true, expiresInDays: 120 },
    ],
    searches: series(6, 520, 'steady'),
  },
];

/** Everyone with an account on the instance: the members, and two who are in no team. */
export const USERS = [...new Set([...TEAMS.flatMap(t => t.members.map(m => m.email)), 'nina@acme.example', 'support@indx.example'])].sort();

export const documentsOf = (t: Team) => t.datasets.reduce((s, d) => s + d.documents, 0);
export const searchesOf = (t: Team) => t.searches.reduce((s, v) => s + v, 0);
export const admins = (t: Team) => t.members.filter(m => m.role === 'Admin').length;

/** "3 days", "5 weeks", "7 months": how long ago, as the console's TimeAgo says it. */
export function ago(days: number): string {
  if (days < 1) return 'today';
  if (days < 14) return `${days} day${days === 1 ? '' : 's'} ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  return `${Math.round(days / 30)} months ago`;
}

export const plural = (n: number, one: string, many = `${one}s`) => `${nf.format(n)} ${n === 1 ? one : many}`;

/** What an instance admin may want to act on, per team: said as facts, with the team named. */
export interface Finding { team: string; kind: 'one-admin' | 'empty' | 'idle' | 'expiring' | 'personal-full'; text: string }

export function findings(teams: Team[]): Finding[] {
  const out: Finding[] = [];
  for (const t of teams) {
    const total = searchesOf(t);
    if (t.members.length === 0) out.push({ team: t.name, kind: 'empty', text: 'No members: nobody can open its datasets in the console' });
    else if (admins(t) === 0) out.push({ team: t.name, kind: 'one-admin', text: 'No admin: nobody can manage its members or keys' });
    if (t.datasets.length === 0 && t.createdDays > 14) out.push({ team: t.name, kind: 'empty', text: 'No datasets yet' });
    if (t.datasets.length > 0 && t.keys.length === 0) out.push({ team: t.name, kind: 'empty', text: 'Datasets but no keys: nothing outside the console can search them' });
    if (t.datasets.length > 0 && total === 0) out.push({ team: t.name, kind: 'idle', text: 'No searches in 30 days' });
    if (total >= 100 && t.zeroHits > 0.2) out.push({ team: t.name, kind: 'idle', text: `${Math.round(t.zeroHits * 100)}% of its searches found nothing` });
    for (const k of t.keys) if (k.expiresInDays != null && k.expiresInDays <= 14) out.push({ team: t.name, kind: 'expiring', text: `Key "${k.name}" expires in ${plural(k.expiresInDays, 'day')}` });
    for (const k of t.keys) if (k.level === 'Full') out.push({ team: t.name, kind: 'personal-full', text: k.team
      ? `Team key "${k.name}" is Full: it can write to every dataset in the team`
      : `Personal Full key "${k.name}" stops working if its owner leaves the team` });
  }
  return out;
}
