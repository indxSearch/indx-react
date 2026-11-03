import React, { useEffect } from 'react';
import { Button } from '@indxsearch/systm';
import { Cloud, Key, Lock, Search, Hour_glass, Speedometer, Warning } from '@indxsearch/pixl';
import type { SearchErrorInfo, SearchErrorKind } from '../context/searchError';
import styles from './SearchResultsMessage.module.css';

type Copy = { icon: typeof Cloud; title: string; detail: string };

// For the visitor. The technical line under it is for whoever built the page.
const copy: Record<SearchErrorKind, Copy> = {
  unreachable: { icon: Cloud, title: 'Search is unavailable', detail: 'The search server can’t be reached right now.' },
  unauthorized: { icon: Key, title: 'Search is unavailable', detail: 'The search key was not accepted.' },
  forbidden: { icon: Lock, title: 'Search is unavailable', detail: 'This search key doesn’t have access to these results.' },
  notFound: { icon: Search, title: 'Nothing to search here', detail: 'The collection this page searches doesn’t exist.' },
  notReady: { icon: Hour_glass, title: 'Search is getting ready', detail: 'Results will appear in a moment.' },
  unavailable: { icon: Warning, title: 'Search is unavailable', detail: 'The collection can’t be searched right now.' },
  rateLimited: { icon: Speedometer, title: 'Too many searches', detail: 'Wait a moment, then try again.' },
  server: { icon: Warning, title: 'Something went wrong', detail: 'The search server ran into a problem.' },
  setup: { icon: Warning, title: 'Search isn’t set up', detail: 'This page is missing part of its search setup.' },
  unknown: { icon: Warning, title: 'Something went wrong', detail: 'The search couldn’t be completed.' },
};

export interface SearchResultsMessageProps {
  error: SearchErrorInfo;
  /** Tries again. Shown as a button where retrying can help; a dataset that is getting ready is retried by itself. */
  onRetry?: () => void;
  /** Hides the technical line, for a page whose visitors should not see it. */
  hideTechnical?: boolean;
}

/** What SearchResults shows in place of the list when a search fails: an icon, a line for the
 *  visitor, the technical reason, and Try again where that can help. */
export const SearchResultsMessage: React.FC<SearchResultsMessageProps> = ({ error, onRetry, hideTechnical = false }) => {
  const { icon: Icon, title, detail } = copy[error.kind];

  // Loading or indexing: the same request succeeds once the build is done, and the server says when
  // to ask again. Each failed retry is a new error object, so this keeps going until one succeeds.
  useEffect(() => {
    if (error.kind !== 'notReady' || !onRetry) return;
    const timer = setTimeout(onRetry, (error.retryAfterSeconds ?? 2) * 1000);
    return () => clearTimeout(timer);
  }, [error, onRetry]);

  const showButton = error.retryable && error.kind !== 'notReady' && onRetry;

  return (
    <div className={styles.message} role="alert">
      <span className={styles.icon}><Icon size={70} color="var(--lv4)" /></span>
      <div className={styles.title}>{title}</div>
      <div className={styles.detail}>{detail}</div>
      {!hideTechnical && <code className={styles.technical}>{error.technical}</code>}
      {showButton && (
        <Button variant="secondary" size="micro" className={styles.button} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
};
