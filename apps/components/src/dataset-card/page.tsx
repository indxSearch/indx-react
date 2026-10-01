import { Chip, Sparkline } from '@indxsearch/systm';
import { Database } from '@indxsearch/pixl';
import styles from './page.module.css';

// A mockup of IndxServer's dataset card, for judging where a Sparkline belongs on it before any
// of it goes into the product. Everything here is dummy data and a copy of the card's layout --
// nothing is a component, and nothing here is imported by anything.
//
// The open question this exists to answer: a sparkline needs a SERIES, and the server currently
// keeps only a running search counter. Deciding it is worth seeing first is cheaper than building
// somewhere for the history to live and then deciding.

const rising = [3, 5, 4, 8, 6, 11, 9, 14, 12, 17, 15, 21, 24, 29];
// A dataset nobody has searched lately: the shape should say so at a glance.
const quiet = [9, 7, 8, 4, 5, 2, 3, 1, 1, 0, 0, 1, 0, 0];
const steady = [14, 12, 15, 13, 16, 14, 13, 15, 14, 16, 13, 15, 14, 15];

function Head({ name }: { name: string }) {
  return (
    <span className={styles.head}>
      <Database size={14} color="currentColor" />
      {name}
    </span>
  );
}

// The Fields row: its chips sit in the value column, on the label's own line, with no total.
// Each chip keeps its own count. Same four roles as the product card.
function Fields({ searchable, filterable, facetable, preloaded }:
  { searchable: number; filterable: number; facetable: number; preloaded: number }) {
  const chip = (label: string, n: number) => (
    <Chip color="var(--lv2)" textColor="var(--lv7)">{label}<span className={styles.count}>{n}</span></Chip>
  );
  return (
    <>
      <span className={styles.term}>Fields</span>
      <span className={styles.chips}>
        {chip('searchable', searchable)}
        {chip('filterable', filterable)}
        {chip('facetable', facetable)}
        {chip('preloaded', preloaded)}
      </span>
    </>
  );
}

function Foot({ state, color, count }: { state: string; color: string; count: string }) {
  return (
    <span className={styles.foot}>
      <Chip color={color} textColor="#080809">{state}</Chip>
      <span style={{ color: 'var(--lv6)', font: 'var(--text-sm)' }}>{count}</span>
    </span>
  );
}

export default function DatasetCardPage() {
  return (
    <main className={styles.main}>
      <div>
        <h1 className={styles.title}>Dataset card</h1>
        <p className={styles.desc}>
          IndxServer&rsquo;s dataset card, mocked here so a <strong>Sparkline</strong> can be judged
          on it before anything goes into the product. Dummy data throughout. The question is where
          &ldquo;Search activity&rdquo; belongs and which form reads better at this size.
        </p>
      </div>

      <h2 className={styles.heading}>A &mdash; above the state line</h2>
      <p className={styles.note}>
        Under its own label, directly above the state line, so the two close the card together.
        Gives the graph full width and leaves the detail list untouched, at the cost of making the
        card taller.
      </p>
      <div className={styles.grid}>
        <div className={styles.card}>
          <Head name="customer-records" />
          <span className={styles.detail}>
            <span className={styles.term}>Last indexed</span><span className={styles.value}>2 minutes ago</span>
            <span className={styles.term}>Last used</span><span className={styles.value}>just now</span>
            <span className={styles.term}>Keep-alive</span><span className={styles.value}>pinned</span>
            <Fields searchable={21} filterable={45} facetable={28} preloaded={0} />
          </span>
          <span className={styles.activity}>
            <span className={styles.activityLabel}>Search activity</span>
            <Sparkline values={rising} type="bar" height={22} color="var(--lv5)"
                       ariaLabel="Searches over the last fourteen days, rising" />
          </span>
          <Foot state="Ready" color="var(--CTeal)" count="6 218 documents" />
        </div>

        <div className={styles.card}>
          <Head name="product-catalog" />
          <span className={styles.detail}>
            <span className={styles.term}>Last indexed</span><span className={styles.value}>9 minutes ago</span>
            <span className={styles.term}>Last used</span><span className={styles.value}>8 minutes ago</span>
            <span className={styles.term}>Keep-alive</span><span className={styles.value}>pinned</span>
            <Fields searchable={1} filterable={9} facetable={5} preloaded={0} />
          </span>
          <span className={styles.activity}>
            <span className={styles.activityLabel}>Search activity</span>
            <Sparkline values={steady} type="bar" height={22} color="var(--lv5)"
                       ariaLabel="Searches over the last fourteen days, steady" />
          </span>
          <Foot state="Ready" color="var(--CTeal)" count="937 886 documents" />
        </div>

        <div className={styles.card}>
          <Head name="order-archive-2024" />
          <span className={styles.detail}>
            <span className={styles.term}>Last used</span><span className={styles.value}>3 hours ago</span>
            <span className={styles.term}>Keep-alive</span><span className={styles.value}>off (manual)</span>
          </span>
          <span className={styles.activity}>
            <span className={styles.activityLabel}>Search activity</span>
            <Sparkline values={quiet} type="bar" height={22} color="var(--lv4)"
                       ariaLabel="Searches over the last fourteen days, none recently" />
          </span>
          <Foot state="Hibernated" color="var(--CLightBlue)" count="41 562 records on disk" />
        </div>
      </div>

      <h2 className={styles.heading}>B &mdash; a row in the detail list</h2>
      <p className={styles.note}>
        Treats activity as one more fact about the dataset rather than as a feature of the card.
        Costs the card no height, but gives the graph a third of the width &mdash; which is why this
        one is a filled line rather than bars: at that size the bars have no room to read as
        separate, and the filled shape survives being small.
      </p>
      <div className={styles.grid}>
        <div className={styles.card}>
          <Head name="customer-records" />
          <span className={styles.detail}>
            <span className={styles.term}>Last indexed</span><span className={styles.value}>2 minutes ago</span>
            <span className={styles.term}>Last used</span><span className={styles.value}>just now</span>
            <span className={styles.term}>Keep-alive</span><span className={styles.value}>pinned</span>
            <Fields searchable={21} filterable={45} facetable={28} preloaded={0} />
            <span className={styles.term}>Activity</span>
            <span className={styles.value}>
              {/* Line with fill: at a third of the width and 16px tall there is no room for bars to
                  read as separate, and the filled area carries the shape where individual values
                  cannot. --lv7 makes the line itself near-white; the fill is the same colour at
                  0.12, so one setting gives a bright line over a faint wash. */}
              <Sparkline values={rising} height={16} fill color="var(--lv7)"
                         ariaLabel="Searches over the last fourteen days, rising" />
            </span>
          </span>
          <Foot state="Ready" color="var(--CTeal)" count="6 218 documents" />
        </div>
      </div>

      <h2 className={styles.heading}>C &mdash; line rather than bar</h2>
      <p className={styles.note}>
        A&rsquo;s placement, line form. A line reads as a trend and a bar as a count per period;
        searches per day is a count, which is the argument for bars, but the line is quieter across
        a page of nine cards.
      </p>
      <div className={styles.grid}>
        <div className={styles.card}>
          <Head name="customer-records" />
          <span className={styles.detail}>
            <span className={styles.term}>Last indexed</span><span className={styles.value}>2 minutes ago</span>
            <span className={styles.term}>Last used</span><span className={styles.value}>just now</span>
            <span className={styles.term}>Keep-alive</span><span className={styles.value}>pinned</span>
            <Fields searchable={21} filterable={45} facetable={28} preloaded={0} />
          </span>
          <span className={styles.activity}>
            {/* As built: today is the last point, dashed because the day is still running, and
                its count sits beside the label for following the day as it goes. */}
            <span className={styles.activityLabel}>Search activity <span style={{ color: 'var(--lv5)' }}>· 11 today</span></span>
            <Sparkline values={[...rising.slice(1), 11]} height={22} color="var(--lv5)" fill baseline lastIsPartial
                       ariaLabel="Searches over the last fourteen days, eleven of them today" />
          </span>
          <Foot state="Ready" color="var(--CTeal)" count="6 218 documents" />
        </div>
      </div>
    </main>
  );
}
