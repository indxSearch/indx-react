import React, { useEffect, useState } from "react";
import type { CoverageSetup } from '@indxsearch/indx-types';
import styles from './SearchSettingsPanel.module.css';
import { useSearchContext } from '../context/SearchContext';
import { FilterPanelBase } from '@indxsearch/systm';
import { InputField, ToggleSwitch, Button, Slider } from '@indxsearch/systm';
import { ArrowRight, ArrowDown } from "@indxsearch/pixl";

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

  const [showCoverageSetup, setShowCoverageSetup] = useState(false);

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

  // Number field handler for coverageSetup fields
  const handleCoverageSetupNumberChange = (field: CoverageKey, value: string) => {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) {
      setSearchSettings({
        coverageSetup: {
          ...searchSettings.coverageSetup,
          [field]: parsed
        }
      });
    }
  };

  // Toggle handler for coverageSetup boolean fields
  const handleCoverageSetupToggle = (field: CoverageKey, value: boolean) => {
    setSearchSettings({
      coverageSetup: {
        ...searchSettings.coverageSetup,
        [field]: value
      }
    });
  };

  return (
    <FilterPanelBase collapsed={true} title="Settings">
      <ul className={styles.list}>
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
            label={label("Coverage Depth", searchSettings.coverageDepth !== undefined)}
            type="number"
            value={shownDepth.toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNumberChange('coverageDepth', e.target.value)}
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
            label="Enable Coverage"
            checked={searchSettings.enableCoverage}
            onChange={(value: boolean) => handleToggle('enableCoverage', value)}
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
          <Button variant="ghost" size="micro" iconRight={ showCoverageSetup ? <ArrowDown/> : <ArrowRight/>} onClick={() => setShowCoverageSetup(prev => !prev)}>
            {showCoverageSetup ? 'Hide Coverage Setup' : 'Show Coverage Setup'}
          </Button>
        </li>

        {showCoverageSetup && (
          <>
            <li>
              <ToggleSwitch
                label={label("Cover Whole Query", isOwn('coverWholeQuery'))}
                checked={shownValue('coverWholeQuery')}
                onChange={(value: boolean) => handleCoverageSetupToggle('coverWholeQuery', value)}
              />
            </li>
            <li>
              <ToggleSwitch
                label={label("Cover Whole Words", isOwn('coverWholeWords'))}
                checked={shownValue('coverWholeWords')}
                onChange={(value: boolean) => handleCoverageSetupToggle('coverWholeWords', value)}
              />
            </li>
            <li>
              <ToggleSwitch
                label={label("Cover Fuzzy Words", isOwn('coverFuzzyWords'))}
                checked={shownValue('coverFuzzyWords')}
                onChange={(value: boolean) => handleCoverageSetupToggle('coverFuzzyWords', value)}
              />
            </li>
            <li>
              <ToggleSwitch
                label={label("Cover Joined Words", isOwn('coverJoinedWords'))}
                checked={shownValue('coverJoinedWords')}
                onChange={(value: boolean) => handleCoverageSetupToggle('coverJoinedWords', value)}
              />
            </li>
            <li>
              <ToggleSwitch
                label={label("Cover Prefix Suffix", isOwn('coverPrefixSuffix'))}
                checked={shownValue('coverPrefixSuffix')}
                onChange={(value: boolean) => handleCoverageSetupToggle('coverPrefixSuffix', value)}
              />
            </li>
            <li>
              <ToggleSwitch
                label={label("Truncate", isOwn('truncate'))}
                checked={shownValue('truncate')}
                onChange={(value: boolean) => handleCoverageSetupToggle('truncate', value)}
              />
            </li>
            <li>
              <ToggleSwitch
                label={label("Include Pattern Matches", isOwn('includePatternMatches'))}
                checked={shownValue('includePatternMatches')}
                onChange={(value: boolean) => handleCoverageSetupToggle('includePatternMatches', value)}
              />
            </li>
            <li>
              <InputField
                label={label("Levenshtein Max Word Size", isOwn('levenshteinMaxWordSize'))}
                type="number"
                value={shownValue('levenshteinMaxWordSize').toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCoverageSetupNumberChange('levenshteinMaxWordSize', e.target.value)}
              />
            </li>
            <li>
              <InputField
                label={label("Min Word Size", isOwn('minWordSize'))}
                type="number"
                value={shownValue('minWordSize').toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCoverageSetupNumberChange('minWordSize', e.target.value)}
              />
            </li>
            <li>
              <InputField
                label={label("Truncate Word Hit Limit", isOwn('truncateWordHitLimit'))}
                type="number"
                value={shownValue('truncateWordHitLimit').toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCoverageSetupNumberChange('truncateWordHitLimit', e.target.value)}
              />
            </li>
            <li>
              <InputField
                label={label("Truncate Word Hit Tolerance", isOwn('truncateWordHitTolerance'))}
                type="number"
                value={shownValue('truncateWordHitTolerance').toString()}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCoverageSetupNumberChange('truncateWordHitTolerance', e.target.value)}
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
