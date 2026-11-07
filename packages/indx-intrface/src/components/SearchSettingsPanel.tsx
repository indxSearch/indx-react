import React, { useEffect, useState } from "react";
import styles from './SearchSettingsPanel.module.css';
import { useSearchContext } from '../context/SearchContext';
import { FilterPanelBase } from '@indxsearch/systm';
import { InputField, ToggleSwitch, Button, Slider, Select } from '@indxsearch/systm';
import { ArrowRight, ArrowDown } from "@indxsearch/pixl";
import { SearchMode, Tolerance, Rungs } from '@indxsearch/indx-types';
import type { MatchSetup, CandidateSetup, RankingProxy } from '@indxsearch/indx-types';

/** The server's defaults, shown where a part leaves a member out (6.0). */
const MATCH_DEFAULTS: Required<Omit<MatchSetup, 'cursorAt'>> = {
  tolerance: Tolerance.TwoEdits,
  rungs: Rungs.Fewest,
  oneEditFrom: 3,
  twoEditsFrom: 6,
  threeEditsFrom: 9,
  typingPrefixFrom: 3,
  typingPrefixOneEditFrom: 6,
  joinedWords: true,
};
const CANDIDATE_DEFAULTS = { candidatesPerRow: 4, fallback: true, rest: false };
const RANKING_DEFAULTS = { rerank: true, share: 0.2, typingShift: 0.5, wholeQueryFloor: true };

// What a search that leaves a value out gets on this dataset: GET query-parameters' effective.
interface QueryParameters {
  mode?: SearchMode | null;
  match?: MatchSetup | null;
  candidates?: CandidateSetup | null;
  ranking?: RankingProxy | null;
}

export function SearchSettingsPanel() {
  const {
    state: { searchSettings },
    setSearchSettings,
    url,
    team,
    dataset,
    authenticatedFetch,
  } = useSearchContext();

  const [showParts, setShowParts] = useState(false);
  const { match, candidates, ranking } = searchSettings;

  // What a search that leaves a value out gets on this dataset. Shown for every value this
  // page does not set itself. Best effort: an older server, or a key that may not read it, leaves
  // the engine defaults showing.
  const [datasetValues, setDatasetValues] = useState<QueryParameters | null>(null);
  useEffect(() => {
    let live = true;
    try {
      authenticatedFetch(`${url}/api/teams/${team}/datasets/${dataset}/query-parameters`)
        .then(r => (r.ok ? r.json() : null))
        .then(j => { if (live && j?.effective) setDatasetValues(j.effective); })
        .catch(() => {});
    } catch {
      // No token yet: the defaults keep showing.
    }
    return () => { live = false; };
  }, [url, team, dataset, authenticatedFetch]);

  // A member this page leaves out shows the dataset's value, else the server's default.
  const defined = <T extends object>(o: T | null | undefined) =>
    Object.fromEntries(Object.entries(o ?? {}).filter(([, v]) => v !== undefined && v !== null)) as Partial<T>;
  const MATCH_SHOWN = { ...MATCH_DEFAULTS, ...defined(datasetValues?.match) };
  const CANDIDATE_SHOWN = { ...CANDIDATE_DEFAULTS, ...defined(datasetValues?.candidates) };
  const RANKING_SHOWN = { ...RANKING_DEFAULTS, ...defined(datasetValues?.ranking) };
  const modeShown = searchSettings.mode ?? datasetValues?.mode ?? SearchMode.EditDistance;
  const isBm25f = modeShown === SearchMode.Bm25f;
  // The reranker (ranking.rerank) in either mode; the bound wherever there are candidates to rank.
  const reranked = ranking.rerank ?? RANKING_SHOWN.rerank;
  const unbounded = isBm25f && !reranked;
  const anyOwn = searchSettings.mode !== undefined
    || [match, candidates, ranking].some(part => Object.values(part ?? {}).some(v => v !== undefined && v !== null));

  // Number field handler for top-level searchSettings fields
  const handleNumberChange = (field: keyof typeof searchSettings, value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      setSearchSettings({
        [field]: parsed
      });
    }
  };

  // Toggle handler for top-level boolean searchSettings fields
  const handleToggle = (field: keyof typeof searchSettings, value: boolean) => {
    setSearchSettings({
      [field]: value
    });
  };

  // A member of one of the three parts: merged into the part by setSearchSettings.
  const setMatch = (change: Partial<MatchSetup>) => setSearchSettings({ match: change });
  const setCandidates = (change: Partial<CandidateSetup>) => setSearchSettings({ candidates: change });
  const setRanking = (change: Partial<RankingProxy>) => setSearchSettings({ ranking: change });
  const parseIntOr = (value: string, apply: (n: number) => void) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) apply(parsed);
  };
  const parsePercent = (value: string, apply: (n: number) => void) => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) apply(Math.max(0, Math.min(100, parsed)) / 100);
  };

  return (
    <FilterPanelBase collapsed={true} title="Settings">
      <ul className={styles.list}>
        <li>
          <Select
            label="Mode"
            size="micro"
            value={modeShown}
            onValueChange={(value: string) => setSearchSettings({ mode: value as SearchMode })}
            options={[
              { label: 'Edit distance', value: SearchMode.EditDistance },
              { label: 'BM25F', value: SearchMode.Bm25f },
            ]}
          />
        </li>
        <li>
          <ToggleSwitch
            label="Rerank (Coverage)"
            checked={reranked}
            onChange={(value: boolean) => setRanking({ rerank: value })}
          />
        </li>
        <li>
          <InputField
            label="Max Results"
            type="number"
            value={searchSettings.maxNumberOfRecordsToReturn.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNumberChange('maxNumberOfRecordsToReturn', e.target.value)}
          />
        </li>
        <li>
            <InputField
                label="Minimum Score (16 bit)"
                type="number"
                value={searchSettings.minimumScore.toString()}
                min="0"
                max="65535"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const parsed = parseFloat(e.target.value);
                if (!isNaN(parsed)) {
                    setSearchSettings({ minimumScore: parsed });
                }
                }}
            />
            <div style={{ padding: '10px 10px 20px 10px' }}>
                <Slider
                    min={0}
                    max={65535}
                    step={1}
                    value={Math.max(0, Math.min(65535, Math.round(searchSettings.minimumScore)))}
                    onChange={(val: number | number[]) => {
                    setSearchSettings({ minimumScore: val as number });
                    }}
                    aria-label="Minimum score"
                />
            </div>
        </li>
        <li>
        <InputField
            label="Placeholder text"
            type="text"
            value={searchSettings.placeholderText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchSettings({ placeholderText: e.target.value });
            }}
        />
        </li>
        <li>
          <ToggleSwitch
            label="Show score"
            checked={searchSettings.showScore}
            onChange={(value: boolean) => handleToggle('showScore', value)}
          />
        </li>
        <li>
          <ToggleSwitch
            label="Remove Duplicates"
            checked={searchSettings.removeDuplicates}
            onChange={(value: boolean) => handleToggle('removeDuplicates', value)}
          />
        </li>

        <li>
          <Button variant="ghost" size="micro" iconRight={ showParts ? <ArrowDown/> : <ArrowRight/>} onClick={() => setShowParts(prev => !prev)}>
            {showParts ? 'Hide Match, Candidates and Ranking' : 'Show Match, Candidates and Ranking'}
          </Button>
        </li>

        {showParts && (
          <>
            {/* Match: what counts as a hit. Read by every mode but Bm25f. */}
            <li>
              <Select
                label="Tolerance"
                size="micro"
                disabled={isBm25f}
                value={match.tolerance ?? MATCH_SHOWN.tolerance}
                onValueChange={(value: string) => setMatch({ tolerance: value as Tolerance })}
                options={[
                  { label: 'Exact', value: Tolerance.Exact },
                  { label: 'One edit', value: Tolerance.OneEdit },
                  { label: 'Two edits', value: Tolerance.TwoEdits },
                  { label: 'Three edits', value: Tolerance.ThreeEdits },
                ]}
              />
            </li>
            <li>
              <ToggleSwitch
                label="Every rung"
                disabled={isBm25f}
                checked={(match.rungs ?? MATCH_SHOWN.rungs) === Rungs.All}
                onChange={(value: boolean) => setMatch({ rungs: value ? Rungs.All : Rungs.Fewest })}
              />
            </li>
            <li>
              <InputField
                label="One edit from"
                type="number"
                disabled={isBm25f}
                value={(match.oneEditFrom ?? MATCH_SHOWN.oneEditFrom).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parseIntOr(e.target.value, n => setMatch({ oneEditFrom: n }))}
              />
            </li>
            <li>
              <InputField
                label="Two edits from"
                type="number"
                disabled={isBm25f}
                value={(match.twoEditsFrom ?? MATCH_SHOWN.twoEditsFrom).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parseIntOr(e.target.value, n => setMatch({ twoEditsFrom: n }))}
              />
            </li>
            <li>
              <InputField
                label="Three edits from"
                type="number"
                disabled={isBm25f}
                value={(match.threeEditsFrom ?? MATCH_SHOWN.threeEditsFrom).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parseIntOr(e.target.value, n => setMatch({ threeEditsFrom: n }))}
              />
            </li>
            <li>
              <InputField
                label="Typing prefix from"
                type="number"
                disabled={isBm25f}
                value={(match.typingPrefixFrom ?? MATCH_SHOWN.typingPrefixFrom).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parseIntOr(e.target.value, n => setMatch({ typingPrefixFrom: n }))}
              />
            </li>
            <li>
              <ToggleSwitch
                label="Joined words"
                disabled={isBm25f}
                checked={match.joinedWords ?? MATCH_SHOWN.joinedWords}
                onChange={(value: boolean) => setMatch({ joinedWords: value })}
              />
            </li>

            {/* Candidates: who comes in. */}
            <li>
              <InputField
                label="Candidates per row"
                type="number"
                disabled={unbounded}
                value={(candidates.candidatesPerRow ?? CANDIDATE_SHOWN.candidatesPerRow).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parseIntOr(e.target.value, n => setCandidates({ candidatesPerRow: n }))}
              />
            </li>
            <li>
              <InputField
                label="Max candidates (0: per row)"
                type="number"
                disabled={unbounded}
                value={(candidates.maxCandidates ?? 0).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  parseIntOr(e.target.value, n => setCandidates({ maxCandidates: n > 0 ? n : null }))}
              />
            </li>
            <li>
              <ToggleSwitch
                label="Fallback (most words when none holds every word)"
                disabled={isBm25f}
                checked={candidates.fallback ?? CANDIDATE_SHOWN.fallback}
                onChange={(value: boolean) => setCandidates({ fallback: value })}
              />
            </li>
            <li>
              <ToggleSwitch
                label="Rest (BM25F below the counted set)"
                disabled={isBm25f}
                checked={candidates.rest ?? CANDIDATE_SHOWN.rest}
                onChange={(value: boolean) => setCandidates({ rest: value })}
              />
            </li>

            {/* Ranking: the blend is Coverage's. */}
            <li>
              <InputField
                label="Coverage share %"
                type="number"
                disabled={!reranked}
                value={Math.round((ranking.share ?? RANKING_SHOWN.share) * 100).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parsePercent(e.target.value, n => setRanking({ share: n }))}
              />
            </li>
            <li>
              <InputField
                label="Typing shift %"
                type="number"
                disabled={!reranked}
                value={Math.round((ranking.typingShift ?? RANKING_SHOWN.typingShift) * 100).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parsePercent(e.target.value, n => setRanking({ typingShift: n }))}
              />
            </li>
            <li>
              <ToggleSwitch
                label="Whole query floor"
                disabled={!reranked}
                checked={ranking.wholeQueryFloor ?? RANKING_SHOWN.wholeQueryFloor}
                onChange={(value: boolean) => setRanking({ wholeQueryFloor: value })}
              />
            </li>
            {anyOwn && (
              <li>
                <Button variant="ghost" size="micro" onClick={() => setSearchSettings({ mode: undefined, match: undefined, candidates: undefined, ranking: undefined })}>
                  Use the dataset's values
                </Button>
              </li>
            )}
          </>
        )}
      </ul>
    </FilterPanelBase>
  );
}
