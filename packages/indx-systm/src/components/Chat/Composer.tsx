import React, { useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { Ai_agent, ArrowUp, Stop } from '@indxsearch/pixl';
import { Button } from '../Button/Button';
import styles from './Chat.module.css';

export interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  /** Called with the trimmed text on Enter or the send button. Not called while `streaming`. */
  onSend: (text: string) => void;
  /** Called by the Stop button, which replaces Send while `streaming`. */
  onStop?: () => void;
  /** An answer is in flight: the send button becomes Stop and Enter does nothing. */
  streaming?: boolean;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Leading icon; defaults to the pixl AI agent. `null` hides it. */
  icon?: React.ReactNode;
  /** Tallest the field grows before it scrolls, in lines. */
  maxLines?: number;
  className?: string;
  'aria-label'?: string;
}

export interface ComposerHandle {
  focus: () => void;
}

const LINE = 18;

/** The message field. Enter sends, Shift+Enter breaks the line; the field grows with its text up
 *  to `maxLines`. Send becomes Stop while an answer streams. */
export const Composer = React.forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { value, onChange, onSend, onStop, streaming = false, placeholder = 'Ask a question…', disabled = false, autoFocus = false, icon, maxLines = 6, className = '', 'aria-label': ariaLabel = 'Message' },
  ref,
) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  // Grow with the text: reset, then take the scroll height up to the cap.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const cap = LINE * maxLines + 12;
    el.style.height = `${Math.min(el.scrollHeight, cap)}px`;
  }, [value, maxLines]);

  const canSend = !streaming && !disabled && value.trim().length > 0;

  const send = useCallback(() => {
    if (!canSend) return;
    onSend(value.trim());
  }, [canSend, onSend, value]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={`${styles.composer} ${className}`}>
      <div className={styles.composerField}>
        {icon !== null && (
          <span className={styles.composerIcon} aria-hidden="true">
            {icon === undefined ? <Ai_agent color="currentColor" size={21} /> : icon}
          </span>
        )}
        <textarea
          ref={inputRef}
          className={styles.composerInput}
          rows={1}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label={ariaLabel}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className={styles.composerButton}>
        {streaming
          ? <Button variant="secondary" size="micro" aria-label="Stop" iconLeft={<Stop />} onClick={onStop} />
          : <Button variant="primary" size="micro" aria-label="Send" iconLeft={<ArrowUp />} disabled={!canSend} onClick={send} />}
      </div>
    </div>
  );
});
