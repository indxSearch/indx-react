// Generated, deterministic data for the analytics mockup. Nothing here comes from a server:
// the numbers are made up, but shaped like a real film catalogue's search traffic (weekday
// rhythm, a long tail of terms, clicks concentrated on the first positions).

export type PeriodKey = '7' | '30' | '90';

export interface TermRow {
  term: string;
  searches: number;
  clickRate: number;      // 0..1
  avgPosition: number;    // 1-based, of the clicks
  change: number;         // vs previous period, -1..+inf
}

export interface UncoveredRow {
  term: string;
  searches: number;
  nearest: string;        // what the engine returned on top anyway
  coverage: number;       // best coverage score, 0..100
  hint: 'synonym' | 'spelling' | 'not in catalogue';
}

export interface Kpi { value: number; previous: number; }

export interface PeriodData {
  labels: string[];
  bucket: 'day' | 'week';
  searches: number[];
  clicks: number[];
  uncovered: number[];
  positions: number[];      // clicks at position 1..10, then 11+
  kpis: {
    searches: Kpi; unique: Kpi; uncoveredShare: Kpi; uncoveredCount: Kpi; avgPosition: Kpi; clickRate: Kpi;
  };
  popular: TermRow[];
  uncoveredTerms: UncoveredRow[];
  lowestClickRate: TermRow[];
  trendingUp: TermRow[];
  trendingDown: TermRow[];
}

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEEKDAY = [0.86, 0.92, 0.95, 1.0, 1.12, 1.38, 1.31]; // Mon..Sun: a film catalogue peaks at the weekend
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const POPULAR: [string, number, number, number][] = [
  // term, weight, click rate, avg position
  ['batman', 100, 0.71, 1.6], ['star wars', 94, 0.74, 1.4], ['harry potter', 88, 0.78, 1.3],
  ['the godfather', 61, 0.69, 1.2], ['christopher nolan', 57, 0.52, 3.1], ['spider man', 55, 0.66, 2.2],
  ['lord of the rings', 52, 0.73, 1.5], ['tarantino', 44, 0.49, 3.4], ['alien', 41, 0.58, 2.7],
  ['studio ghibli', 38, 0.61, 2.4], ['james bond', 36, 0.55, 3.0], ['horror 2023', 29, 0.31, 5.2],
];

const UNCOVERED: [string, number, string, number, UncoveredRow['hint']][] = [
  ['lotr', 46, 'Lottery Ticket', 38, 'synonym'],
  ['mcu', 41, 'McQ', 44, 'synonym'],
  ['hp and the philosophers stone', 33, 'The Philosophers', 52, 'synonym'],
  ['scifi', 31, 'Sci-Fighter', 47, 'synonym'],
  ['dune part three', 27, 'Dune: Part Two', 61, 'not in catalogue'],
  ['shawshenk redemtion', 22, 'The Shawshank Redemption', 58, 'spelling'],
  ['romcom', 19, 'Romeo + Juliet', 35, 'synonym'],
  ['oppenhiemer', 17, 'Oppenheimer', 63, 'spelling'],
  ['succession', 15, 'Success', 41, 'not in catalogue'],
  ['4k remaster', 12, 'Remastered', 33, 'not in catalogue'],
];

export function buildPeriod(period: PeriodKey): PeriodData {
  const days = Number(period);
  const rnd = mulberry32(days * 7919);
  const end = new Date(2026, 8, 20); // fixed, so the mockup looks the same every day

  const daily: { date: Date; searches: number; clicks: number; uncovered: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(end); date.setDate(end.getDate() - i);
    const weekday = (date.getDay() + 6) % 7;
    const growth = 1 + (days - i) / days * 0.18;                      // traffic creeping up over the period
    const spike = i === Math.floor(days * 0.3) ? 1.55 : 1;             // one campaign day
    const searches = Math.round(2150 * WEEKDAY[weekday] * growth * spike * (0.93 + rnd() * 0.14));
    const clicks = Math.round(searches * (0.57 + rnd() * 0.07));
    const uncovered = Math.round(searches * (0.058 + rnd() * 0.022));
    daily.push({ date, searches, clicks, uncovered });
  }

  let labels: string[], searches: number[], clicks: number[], uncovered: number[];
  let bucket: 'day' | 'week' = 'day';
  if (days === 90) {
    bucket = 'week';
    labels = []; searches = []; clicks = []; uncovered = [];
    for (let i = 0; i < daily.length; i += 7) {
      const chunk = daily.slice(i, i + 7);
      const d = chunk[0].date;
      labels.push(`${d.getDate()} ${MONTHS[d.getMonth()]}`);
      searches.push(chunk.reduce((a, c) => a + c.searches, 0));
      clicks.push(chunk.reduce((a, c) => a + c.clicks, 0));
      uncovered.push(chunk.reduce((a, c) => a + c.uncovered, 0));
    }
  } else {
    labels = daily.map(d => days === 7 ? `${DAYS[d.date.getDay()]} ${d.date.getDate()}` : String(d.date.getDate()));
    searches = daily.map(d => d.searches);
    clicks = daily.map(d => d.clicks);
    uncovered = daily.map(d => d.uncovered);
  }

  const totalSearches = daily.reduce((a, c) => a + c.searches, 0);
  const totalClicks = daily.reduce((a, c) => a + c.clicks, 0);
  const totalUncovered = daily.reduce((a, c) => a + c.uncovered, 0);

  // Clicks by result position: steep at the top, a tail, and a bump at 11+ for people who scrolled.
  const shape = [0.412, 0.187, 0.109, 0.071, 0.049, 0.036, 0.028, 0.022, 0.018, 0.015, 0.053];
  const positions = shape.map(s => Math.round(totalClicks * s * (0.97 + rnd() * 0.06)));
  const positionSum = positions.reduce((a, c) => a + c, 0);
  const avgPosition = positions.reduce((a, c, i) => a + c * (i === 10 ? 14 : i + 1), 0) / positionSum;

  const scale = totalSearches / 2600;
  const term = ([t, w, cr, pos]: [string, number, number, number], change: number): TermRow => ({
    term: t, searches: Math.round(w * scale * (0.94 + rnd() * 0.12)), clickRate: cr, avgPosition: pos, change,
  });

  const popular = POPULAR.map(p => term(p, (rnd() - 0.42) * 0.5)).sort((a, b) => b.searches - a.searches);

  return {
    labels, bucket, searches, clicks, uncovered, positions,
    kpis: {
      searches: { value: totalSearches, previous: Math.round(totalSearches / 1.124) },
      unique: { value: Math.round(totalSearches * 0.412), previous: Math.round(totalSearches * 0.412 / 1.087) },
      uncoveredShare: { value: totalUncovered / totalSearches, previous: totalUncovered / totalSearches + 0.009 },
      uncoveredCount: { value: totalUncovered, previous: Math.round(totalUncovered * 1.041) },
      avgPosition: { value: avgPosition, previous: avgPosition + 0.31 },
      clickRate: { value: totalClicks / totalSearches, previous: totalClicks / totalSearches - 0.021 },
    },
    popular,
    uncoveredTerms: UNCOVERED.map(([t, w, nearest, coverage, hint]) => ({
      term: t, searches: Math.round(w * scale * 0.3 * (0.9 + rnd() * 0.2)), nearest, coverage, hint,
    })).sort((a, b) => b.searches - a.searches),
    lowestClickRate: [
      term(['horror 2023', 29, 0.31, 5.2], -0.04), term(['best movies', 24, 0.27, 6.8], 0.11),
      term(['new', 22, 0.19, 7.4], 0.02), term(['christmas', 20, 0.34, 4.9], 0.63),
      term(['tarantino', 44, 0.49, 3.4], 0.07), term(['action', 18, 0.29, 6.1], -0.09),
    ].sort((a, b) => a.clickRate - b.clickRate),
    trendingUp: [
      term(['christmas', 20, 0.34, 4.9], 0.63), term(['dune', 34, 0.72, 1.5], 0.48),
      term(['oppenheimer', 27, 0.77, 1.2], 0.41), term(['studio ghibli', 38, 0.61, 2.4], 0.29),
      term(['wes anderson', 16, 0.59, 2.6], 0.24),
    ].sort((a, b) => b.change - a.change),
    trendingDown: [
      term(['barbie', 23, 0.75, 1.3], -0.52), term(['summer', 11, 0.28, 6.0], -0.44),
      term(['top gun', 19, 0.7, 1.6], -0.31), term(['avatar', 26, 0.68, 1.8], -0.22),
      term(['james bond', 36, 0.55, 3.0], -0.15),
    ].sort((a, b) => a.change - b.change),
  };
}
