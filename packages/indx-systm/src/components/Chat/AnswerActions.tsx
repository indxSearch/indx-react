import { Check, Chevron_right, Copy } from '@indxsearch/pixl';
import { Button } from '../Button/Button';
import styles from './Chat.module.css';

export interface AnswerActionsProps {
  onCopy?: () => void;
  /** Flip briefly after `onCopy` to acknowledge the copy. */
  copied?: boolean;
  onFollowUp?: () => void;
  followUpLabel?: string;
  className?: string;
}

/** The row under a finished answer: Copy on the left, the follow-up prompt on the right. */
export function AnswerActions({ onCopy, copied = false, onFollowUp, followUpLabel = 'Ask a follow-up', className = '' }: AnswerActionsProps) {
  return (
    <div className={`${styles.actions} ${className}`}>
      {onCopy && (
        <Button variant="ghost" size="micro" iconLeft={copied ? <Check /> : <Copy />} onClick={onCopy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      )}
      <span className={styles.actionsSpacer} />
      {onFollowUp && <Button variant="ghost" size="micro" iconRight={<Chevron_right />} onClick={onFollowUp}>{followUpLabel}</Button>}
    </div>
  );
}
