import { useMemo, useState } from 'react';
import {
  Alert, AlertDescription, Base, Chart, Chip, Select, Table, TableHeader, TableRow, Tabs, Tooltip, Truncate,
} from '@indxsearch/systm';
import { ArrowDown, ArrowUp, Database, Graph } from '@indxsearch/pixl';
import { buildPeriod, type Kpi, type PeriodKey, type TermRow } from './data';
import styles from './page.module.css';

// A mockup of what search analytics could look like in the Indx console. The model is
// Relewise's Search Analytics page (KPIs against the previous period, a timeline, term tables),
// with one change that matters for Indx: they count "searches without results". Indx is fuzzy
// and nearly always returns something, so an empty result page is the wrong signal. The signal
// here is COVERAGE: a search where no document covered the query. It is called "without
// coverage" throughout, never a failure, because the visitor still got the nearest matches.

const PERIODS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

const nf = new Intl.NumberFormat('en-US');
const pct = (v: number, digits = 1) => `${(v * 100).toFixed(digits)}%`;

type Direction = 'higherIsBetter' | 'lowerIsBetter';

function Delta({ kpi, direction, format }: { kpi: Kpi; direction: Direction; format: 'relative' | 'points' | 'absolute' }) {
  const diff = kpi.value - kpi.previous;
  const up = diff >= 0;
  const good = direction === 'higherIsBetter' ? up : !up;
  const text =
    format === 'points' ? `${Math.abs(diff * 100).toFixed(1)} pts`
    : format === 'absolute' ? Math.abs(diff).toFixed(2)
    : pct(Math.abs(diff) / kpi.previous);
  return (
    <span className={`${styles.delta} ${good ? styles.deltaGood : styles.deltaBad}`}>
      {up ? <ArrowUp size={12} color="currentColor" /> : <ArrowDown size={12} color="currentColor" />}
      {text}
    </span>
  );
}

function KpiTile({ label, value, hint, children }: { label: string; value: string; hint: string; children: React.ReactNode }) {
  return (
    <Base className={styles.tile}>
      <Tooltip content={hint}>
        <span className={styles.tileLabel}>{label}</span>
      </Tooltip>
      <span className={styles.tileValue}>{value}</span>
      <span className={styles.tileFoot}>{children}<span className={styles.tileVs}>vs previous period</span></span>
    </Base>
  );
}

function Change({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span className={`${styles.delta} ${styles.deltaNeutral}`}>
      {up ? <ArrowUp size={12} color="currentColor" /> : <ArrowDown size={12} color="currentColor" />}
      {pct(Math.abs(value), 0)}
    </span>
  );
}

function TermTable({ rows, label }: { rows: TermRow[]; label: string }) {
  return (
    <Table scrollable stickyFirstColumn aria-label={label}>
      <TableHeader>
        <th>Search term</th>
        <th className={styles.num}>Searches</th>
        <th className={styles.num}>Change</th>
        <th className={styles.num}>Click rate</th>
        <th className={styles.num}>Avg. click position</th>
      </TableHeader>
      <tbody>
        {rows.map(r => (
          <TableRow key={r.term}>
            <td className={styles.term}>{r.term}</td>
            <td className={styles.num}>{nf.format(r.searches)}</td>
            <td className={styles.num}><Change value={r.change} /></td>
            <td className={styles.num}>
              <span className={styles.meter}><span style={{ width: `${r.clickRate * 100}%` }} /></span>
              {pct(r.clickRate, 0)}
            </td>
            <td className={styles.num}>{r.avgPosition.toFixed(1)}</td>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
}

const HINT_LABEL = { synonym: 'Add a synonym', spelling: 'Spelling', 'not in catalogue': 'Not in the catalogue' } as const;

export default function AnalyticsDashboardPage() {
  const [period, setPeriod] = useState<PeriodKey>('30');
  const [timeline, setTimeline] = useState('searches');
  const [tab, setTab] = useState('popular');
  const data = useMemo(() => buildPeriod(period), [period]);
  const k = data.kpis;

  const timelineSeries =
    timeline === 'searches' ? [{ label: 'Searches', data: data.searches }]
    : timeline === 'uncovered' ? [{ label: 'Without coverage', data: data.uncovered, color: 'var(--CWarning)' }]
    : [
        { label: 'Searches', data: data.searches },
        { label: 'Clicks', data: data.clicks, color: 'var(--CTeal)' },
        { label: 'Without coverage', data: data.uncovered, color: 'var(--CWarning)' },
      ];

  const clicksTotal = data.positions.reduce((a, c) => a + c, 0);
  const topThree = (data.positions[0] + data.positions[1] + data.positions[2]) / clicksTotal;
  const firstShare = data.positions[0] / clicksTotal;

  return (
    <main className={styles.main}>
      <Alert variant="info">
        <AlertDescription>
          A mockup. The numbers are generated in the page; nothing here is recorded by IndxServer today.
        </AlertDescription>
      </Alert>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Search analytics</h1>
          <p className={styles.sub}>
            <Chip icon={<Database />}>tmdb23k</Chip>
            <span>23,236 documents · team indx-intern</span>
          </p>
        </div>
        <div className={styles.period}>
          <Select size="micro" aria-label="Period" value={period} onValueChange={v => setPeriod(v as PeriodKey)} options={PERIODS} />
        </div>
      </header>

      {/* ── KPIs, each against the previous period of the same length ── */}
      <section className={styles.tiles}>
        <KpiTile label="Searches" value={nf.format(k.searches.value)} hint="Every search request in the period.">
          <Delta kpi={k.searches} direction="higherIsBetter" format="relative" />
        </KpiTile>
        <KpiTile label="Unique searches" value={nf.format(k.unique.value)} hint="Distinct search terms, after lowercasing and trimming.">
          <Delta kpi={k.unique} direction="higherIsBetter" format="relative" />
        </KpiTile>
        <KpiTile label="Without coverage" value={pct(k.uncoveredShare.value)}
                 hint="Share of searches where no document covered the query. Indx still returned its nearest matches.">
          <Delta kpi={k.uncoveredShare} direction="lowerIsBetter" format="points" />
        </KpiTile>
        <KpiTile label="Without coverage, count" value={nf.format(k.uncoveredCount.value)}
                 hint="The same, as a number of searches.">
          <Delta kpi={k.uncoveredCount} direction="lowerIsBetter" format="relative" />
        </KpiTile>
        <KpiTile label="Avg. click position" value={k.avgPosition.value.toFixed(2)}
                 hint="The mean position of the result that was chosen. Lower means the right hit is nearer the top.">
          <Delta kpi={k.avgPosition} direction="lowerIsBetter" format="absolute" />
        </KpiTile>
        <KpiTile label="Click rate" value={pct(k.clickRate.value)} hint="Searches that ended in a chosen result.">
          <Delta kpi={k.clickRate} direction="higherIsBetter" format="points" />
        </KpiTile>
      </section>

      {/* ── Searches per day ── */}
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.heading}><Graph size={16} color="currentColor" /> Searches per {data.bucket}</h2>
          <Tabs size="micro" variant="button" aria-label="Timeline" value={timeline} onValueChange={setTimeline}
                items={[
                  { label: 'Searches', value: 'searches' },
                  { label: 'Without coverage', value: 'uncovered' },
                  { label: 'All', value: 'all' },
                ]} />
        </div>
        <Chart type={timeline === 'all' ? 'line' : 'bar'} labels={data.labels} series={timelineSeries} height={240} />
        {data.bucket === 'week' && <p className={styles.note}>Ninety days are shown per week; each bar starts on the date under it.</p>}
      </section>

      {/* ── Click position ── */}
      <section className={styles.split}>
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <h2 className={styles.heading}>Where users click</h2>
          </div>
          <Chart type="bar" labels={['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11+']}
                 series={[{ label: 'Clicks', data: data.positions, color: 'var(--CTeal)' }]} height={220} showLegend={false} />
          <p className={styles.note}>Position of the chosen result in the list the visitor saw.</p>
        </div>
        <Base className={styles.reading}>
          <h3 className={styles.readingTitle}>Reading it</h3>
          <dl className={styles.facts}>
            <div><dt>{pct(firstShare, 0)}</dt><dd>of clicks land on the first result</dd></div>
            <div><dt>{pct(topThree, 0)}</dt><dd>land in the top three</dd></div>
            <div><dt>{pct(data.positions[10] / clicksTotal, 0)}</dt><dd>come from position 11 or lower</dd></div>
          </dl>
          <p className={styles.readingText}>
            A high share far down the list is the thing to look for. It means the right document was found,
            and ranked too low: a case for a boost rule or a field weight, not for a synonym.
          </p>
        </Base>
      </section>

      {/* ── Terms ── */}
      <section className={styles.panel}>
        <Tabs size="micro" scrollable aria-label="Search terms" value={tab} onValueChange={setTab}
              items={[
                { label: 'Popular', value: 'popular' },
                { label: 'Without coverage', value: 'uncovered' },
                { label: 'Lowest click rate', value: 'lowclick' },
                { label: 'Trending up', value: 'up' },
                { label: 'Trending down', value: 'down' },
              ]} />
        <div className={styles.tabBody}>
          {tab === 'popular' && <TermTable rows={data.popular} label="Popular searches" />}
          {tab === 'lowclick' && <TermTable rows={data.lowestClickRate} label="Popular searches with the lowest click rate" />}
          {tab === 'up' && <TermTable rows={data.trendingUp} label="Searches trending up" />}
          {tab === 'down' && <TermTable rows={data.trendingDown} label="Searches trending down" />}
          {tab === 'uncovered' && (
            <>
              <p className={styles.note}>
                No document covered these queries, so the visitor got the nearest matches instead. Each row says what
                came out on top, which is usually enough to tell a missing synonym from a misspelling from something
                the catalogue does not hold.
              </p>
              <Table scrollable stickyFirstColumn aria-label="Searches without coverage">
                <TableHeader>
                  <th>Search term</th>
                  <th className={styles.num}>Searches</th>
                  <th>Nearest match shown</th>
                  <th className={styles.num}>Best coverage</th>
                  <th>Likely cause</th>
                </TableHeader>
                <tbody>
                  {data.uncoveredTerms.map(r => (
                    <TableRow key={r.term}>
                      <td className={styles.term}>{r.term}</td>
                      <td className={styles.num}>{nf.format(r.searches)}</td>
                      <td><Truncate>{r.nearest}</Truncate></td>
                      <td className={styles.num}>
                        <span className={styles.meter}><span className={styles.meterWarn} style={{ width: `${r.coverage}%` }} /></span>
                        {r.coverage}%
                      </td>
                      <td>
                        <Chip color={r.hint === 'synonym' ? 'var(--CTeal)' : 'var(--lv2)'}
                              textColor={r.hint === 'synonym' ? '#080809' : 'var(--lv6)'}>{HINT_LABEL[r.hint]}</Chip>
                      </td>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </div>
      </section>

      <footer className={styles.footer}>
        <p>
          <strong>What this would take.</strong> Searches, terms and coverage can be logged by the server on its own.
          Click position cannot: the client has to report which result was chosen, in one call carrying the term, the
          document key and the position.
        </p>
        <p>
          <strong>No visitor is identified.</strong> A term, a count, a position and a timestamp answer everything on
          this page. No user id is needed, so none is stored.
        </p>
      </footer>
    </main>
  );
}
