import { useEffect, useRef, useState } from 'react';
import { Button, Modal, ProgressBar, Table, TableHeader } from '@indxsearch/systm';
import { FIELDS, RECORDS, TOTAL, isSearched, missing, nf, statsOf, type FieldStats, type Rec, type Value } from './data';
import styles from './page.module.css';

// The data check (variant D): what the Records section knows only by reading every record, made
// when someone asks for it rather than after every Index(), since on 2M records it costs a core
// for a while. The owner starts it, watches it count, and gets a report: the records a search
// treats badly, and what each field holds. The same check could run for Observr.

export interface DataReport {
  at: Date;
  stats: Record<string, FieldStats>;
  /** Records without a value in at least one searched field, and per field. */
  lacking: number;
  lackingBy: [string, number][];
  cut: number;
}

const searched = FIELDS.filter(isSearched);
export const lacksSearched = (r: Rec) => searched.some(f => missing(r[f.name] as Value));

/** How long the mock takes to read the 2,400 records, so the progress can be seen. */
const DURATION_MS = 3000;
const TICK_MS = 50;

function makeReport(): DataReport {
  const stats = Object.fromEntries(FIELDS.map(f => [f.name, statsOf(f)]));
  return {
    at: new Date(),
    stats,
    lacking: RECORDS.filter(lacksSearched).length,
    lackingBy: searched.map(f => [f.name, TOTAL - stats[f.name].present] as [string, number]).filter(([, n]) => n > 0),
    cut: RECORDS.filter(r => r.cut).length,
  };
}

export type CheckState = { phase: 'idle' } | { phase: 'running'; read: number } | { phase: 'done' };

/** Runs the check: `read` climbs to TOTAL over DURATION_MS, then the report is handed over. It goes
 *  on with the modal closed, as the real one would on the server. */
export function useDataCheck(onReport: (r: DataReport) => void) {
  const [state, setState] = useState<CheckState>({ phase: 'idle' });
  const timer = useRef<number | undefined>(undefined);
  const stop = () => { window.clearInterval(timer.current); timer.current = undefined; };
  useEffect(() => stop, []);

  const start = () => {
    stop();
    const began = performance.now();
    setState({ phase: 'running', read: 0 });
    timer.current = window.setInterval(() => {
      const share = Math.min(1, (performance.now() - began) / DURATION_MS);
      if (share < 1) { setState({ phase: 'running', read: Math.round(share * TOTAL) }); return; }
      stop();
      onReport(makeReport());
      setState({ phase: 'done' });
    }, TICK_MS);
  };
  const cancel = () => { stop(); setState({ phase: 'idle' }); };
  return { state, start, cancel };
}

interface DataCheckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: CheckState;
  report: DataReport | null;
  onStart: () => void;
  onCancel: () => void;
  /** Lists the records the report found, and closes the modal. */
  onShow: (list: 'missing' | 'cut') => void;
}

export function DataCheckModal({ open, onOpenChange, state, report, onStart, onCancel, onShow }: DataCheckModalProps) {
  const running = state.phase === 'running';
  const pct = running ? (100 * state.read) / TOTAL : 0;
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Check the data" className={styles.checkModal}
      description={report && !running ? `Checked ${ago(report.at)}.` : undefined}>
      {running ? (
        <div className={styles.checkProgress}>
          <ProgressBar value={pct} />
          <div className={styles.checkProgressLine}>
            <span>{nf.format(state.read)} of {nf.format(TOTAL)} records</span>
            <span className={styles.checkPct}>{Math.floor(pct)}%</span>
          </div>
          <p className={styles.faint}>You can close this window: the check goes on, and the report waits here.</p>
          <div className={styles.checkActions}>
            <Button variant="secondary" onClick={onCancel}>Stop</Button>
          </div>
        </div>
      ) : report ? (
        <>
          <div className={styles.checkFinding}>
            <div className={styles.checkFindingText}>
              <span className={styles.checkFindingHead}>{nf.format(report.lacking)} records miss a searched field</span>
              <span className={styles.faint}>A search cannot find them by it. {report.lackingBy.map(([f, n]) => `${f} ${nf.format(n)}`).join(', ')}.</span>
            </div>
            <Button variant="ghost" size="micro" disabled={report.lacking === 0} onClick={() => onShow('missing')}>Show them</Button>
          </div>
          <div className={styles.checkFinding}>
            <div className={styles.checkFindingText}>
              <span className={styles.checkFindingHead}>{nf.format(report.cut)} records have text cut at indexing</span>
              <span className={styles.faint}>A search reads the first 100,000 characters of each. The records are stored whole.</span>
            </div>
            <Button variant="ghost" size="micro" disabled={report.cut === 0} onClick={() => onShow('cut')}>Show them</Button>
          </div>
          <Table aria-label="What each field holds">
            <TableHeader>
              <th>Field</th>
              <th className={styles.dNum}>Without it</th>
              <th className={styles.dNum}>Values</th>
            </TableHeader>
            <tbody>
              {FIELDS.map(f => {
                const s = report.stats[f.name];
                const without = TOTAL - s.present;
                return (
                  <tr key={f.name}>
                    <td>{f.name}{isSearched(f) && <span className={styles.faint}> searched</span>}</td>
                    <td className={styles.dNum}>{without === 0 ? '0' : nf.format(without)}</td>
                    <td className={styles.dNum}>{nf.format(s.distinct)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <div className={styles.checkActions}>
            <Button variant="primary" onClick={() => onOpenChange(false)}>Done</Button>
            <Button variant="secondary" onClick={onStart}>Check again</Button>
          </div>
        </>
      ) : (
        <>
          <p className={styles.checkText}>
            Reads all {nf.format(TOTAL)} records once to find what a search treats badly: records missing a searched
            field, and text cut at indexing. It also counts, for each field, how many records lack it and how many
            values it has.
          </p>
          <p className={styles.faint}>On a dataset of millions this takes a while and keeps one processor core busy. Searches go on as usual.</p>
          <div className={styles.checkActions}>
            <Button variant="primary" onClick={onStart}>Start</Button>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

/** "just now", "3 minutes ago": the mock's TimeAgo. */
export function ago(at: Date) {
  const minutes = Math.floor((Date.now() - at.getTime()) / 60000);
  return minutes < 1 ? 'just now' : minutes === 1 ? '1 minute ago' : minutes < 60 ? `${minutes} minutes ago` : `${Math.floor(minutes / 60)} hours ago`;
}
