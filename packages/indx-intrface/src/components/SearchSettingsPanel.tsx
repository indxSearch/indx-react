import React, { useEffect, useState } from "react";
import type { CoverageSetup } from '@indxsearch/indx-types';
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
  typingPrefixFrom: 3,
  typingPrefixOneEditFrom: 6,
  joinedWords: true,
};
const CANDIDATE_DEFAULTS = { candidatesPerRow: 4, fallback: true, rest: false };
const RANKING_DEFAULTS = { rerank: true, share: 0.2, typingShift: 0.5, wholeQueryFloor: true };

// The engine's own coverage values: what a value shows when neither this page nor the dataset
// sets it, and what the panel falls back to on a server without query parameters.
const ENGINE_DEFAULTS: Required<CoverageSetup> & { coverageDepth: number } = {
  coverageDepth: 500,
  coverWholeQuery: true,
  coverWholeWords: true,
  coverFuzzyWords: true,
  coverJoinedWords: true,
  coverPrefixSuffix: true,
  truncate: true,
  includePatternMatches: true,
  minWordSize: 2,
  levenshteinMaxWordSize: 20,
  truncateWordHitLimit: 1,
  truncateWordHitTolerance: 0,
  truncationScore: 65024,
};

interface QueryParameters {
  coverageDepth?: number | null;
  coverageSetup?: CoverageSetup | null;
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
  const isBm25f = searchSettings.mode === SearchMode.Bm25f;
  // The reranker (ranking.rerank) in either mode; the bound wherever there are candidates to rank.
  const reranked = ranking.rerank ?? RANKING_DEFAULTS.rerank;
  const unbounded = isBm25f && !reranked;

  // What a search that leaves a coverage value out gets on this dataset. Shown for every value this
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

  type CoverageKey = keyof CoverageSetup;
  const own = searchSettings.coverageSetup;
  const isOwn = (field: CoverageKey) => own[field] !== undefined && own[field] !== null;
  const shownValue = <K extends CoverageKey>(field: K) =>
    (own[field] ?? datasetValues?.coverageSetup?.[field] ?? ENGINE_DEFAULTS[field]) as Required<CoverageSetup>[K];
  const shownDepth = searchSettings.coverageDepth ?? datasetValues?.coverageDepth ?? ENGINE_DEFAULTS.coverageDepth;
  const from = datasetValues ? 'dataset' : 'default';
  // A value this page has not set says where it comes from.
  const label = (text: string, set: boolean) => (set ? text : `${text} (${from})`);
  const anyOwn = searchSettings.coverageDepth !== undefined || Object.keys(own).some(k => isOwn(k as CoverageKey));

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
            value={searchSettings.mode}
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
                value={match.tolerance ?? MATCH_DEFAULTS.tolerance}
                onValueChange={(value: string) => setMatch({ tolerance: value as Tolerance })}
                options={[
                  { label: 'Exact', value: Tolerance.Exact },
                  { label: 'One edit', value: Tolerance.OneEdit },
                  { label: 'Two edits', value: Tolerance.TwoEdits },
                ]}
              />
            </li>
            <li>
              <ToggleSwitch
                label="Every rung"
                disabled={isBm25f}
                checked={(match.rungs ?? MATCH_DEFAULTS.rungs) === Rungs.All}
                onChange={(value: boolean) => setMatch({ rungs: value ? Rungs.All : Rungs.Fewest })}
              />
            </li>
            <li>
              <InputField
                label="One edit from"
                type="number"
                disabled={isBm25f}
                value={(match.oneEditFrom ?? MATCH_DEFAULTS.oneEditFrom).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parseIntOr(e.target.value, n => setMatch({ oneEditFrom: n }))}
              />
            </li>
            <li>
              <InputField
                label="Two edits from"
                type="number"
                disabled={isBm25f}
                value={(match.twoEditsFrom ?? MATCH_DEFAULTS.twoEditsFrom).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parseIntOr(e.target.value, n => setMatch({ twoEditsFrom: n }))}
              />
            </li>
            <li>
              <InputField
                label="Typing prefix from"
                type="number"
                disabled={isBm25f}
                value={(match.typingPrefixFrom ?? MATCH_DEFAULTS.typingPrefixFrom).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parseIntOr(e.target.value, n => setMatch({ typingPrefixFrom: n }))}
              />
            </li>
            <li>
              <ToggleSwitch
                label="Joined words"
                disabled={isBm25f}
                checked={match.joinedWords ?? MATCH_DEFAULTS.joinedWords}
                onChange={(value: boolean) => setMatch({ joinedWords: value })}
              />
            </li>

            {/* Candidates: who comes in. */}
            <li>
              <InputField
                label="Candidates per row"
                type="number"
                disabled={unbounded}
                value={(candidates.candidatesPerRow ?? CANDIDATE_DEFAULTS.candidatesPerRow).toString()}
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
                checked={candidates.fallback ?? CANDIDATE_DEFAULTS.fallback}
                onChange={(value: boolean) => setCandidates({ fallback: value })}
              />
            </li>
            <li>
              <ToggleSwitch
                label="Rest (BM25F below the counted set)"
                disabled={isBm25f}
                checked={candidates.rest ?? CANDIDATE_DEFAULTS.rest}
                onChange={(value: boolean) => setCandidates({ rest: value })}
              />
            </li>

            {/* Ranking: the blend is Coverage's. */}
            <li>
              <InputField
                label="Coverage share %"
                type="number"
                disabled={!reranked}
                value={Math.round((ranking.share ?? RANKING_DEFAULTS.share) * 100).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parsePercent(e.target.value, n => setRanking({ share: n }))}
              />
            </li>
            <li>
              <InputField
                label="Typing shift %"
                type="number"
                disabled={!reranked}
                value={Math.round((ranking.typingShift ?? RANKING_DEFAULTS.typingShift) * 100).toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => parsePercent(e.target.value, n => setRanking({ typingShift: n }))}
              />
            </li>
            <li>
              <ToggleSwitch
                label="Whole query floor"
                disabled={!reranked}
                checked={ranking.wholeQueryFloor ?? RANKING_DEFAULTS.wholeQueryFloor}
                onChange={(value: boolean) => setRanking({ wholeQueryFloor: value })}
              />
            </li>
            {anyOwn && (
              <li>
                <Button variant="ghost" size="micro" onClick={() => setSearchSettings({ coverageSetup: undefined, coverageDepth: undefined })}>
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
