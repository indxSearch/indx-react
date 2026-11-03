import React, { useId, useRef, useState } from 'react';
import { X_or_error } from '@indxsearch/pixl';
import styles from './TagsInput.module.css';

// A list of short values edited as chips in one field: synonym terms, allowed websites, a rule's
// values. Typing a separator or Enter makes the text so far a chip; a paste with separators in it
// makes one per part; leaving the field keeps what was typed. Backspace in the empty box takes the
// last chip back into it, so a typo is mended rather than retyped, and each chip has its own
// remove step. A value already there (ignoring case) is not added twice. The separators are the
// caller's: a synonym term may hold a comma or a space, so there only ";" and Enter divide.
// The Blazor TagsInput in Indx.Systm.Blazor is its port.

export interface TagsInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  /** A line under the field: what divides the values, what a value may hold. */
  hint?: string;
  /** The characters that end a value as it is typed or pasted, besides Enter; ";" and "," by default. */
  separators?: string;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

export function TagsInput({
  value,
  onChange,
  label,
  placeholder,
  hint,
  separators = ';,',
  disabled = false,
  'aria-label': ariaLabel,
  className = '',
}: TagsInputProps) {
  const id = useId();
  const box = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');

  // The values with these added, trimmed, skipping blanks and any already there (ignoring case).
  const withAdded = (current: string[], parts: string[]) => {
    const next = [...current];
    for (const part of parts) {
      const v = part.trim();
      if (v && !next.some((x) => x.toLowerCase() === v.toLowerCase())) next.push(v);
    }
    return next;
  };
  const commit = (parts: string[]) => {
    const next = withAdded(value, parts);
    if (next.length !== value.length) onChange(next);
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    const parts = t.split(new RegExp(`[${separators.replace(/[\]\\^-]/g, '\\$&')}]`));
    if (parts.length === 1) { setText(t); return; }
    // A separator typed or pasted: every part before the last is a value; the last is still being typed.
    commit(parts.slice(0, -1));
    setText(parts[parts.length - 1].trimStart());
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && text.trim()) {
      e.preventDefault();
      commit([text]);
      setText('');
    } else if (e.key === 'Backspace' && !text && value.length) {
      // The last chip back into the box, to be mended rather than retyped.
      e.preventDefault();
      setText(value[value.length - 1]);
      onChange(value.slice(0, -1));
    }
  };

  const onBlur = () => {
    if (!text.trim()) return;
    commit([text]);
    setText('');
  };

  const removeAt = (i: number) => {
    onChange(value.filter((_, j) => j !== i));
    box.current?.focus();
  };

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <div className={`${styles.field} ${disabled ? styles.disabled : ''}`} onClick={() => box.current?.focus()}>
        {value.map((v, i) => (
          <span key={v} className={styles.chip}>
            <span className={styles.text}>{v}</span>
            {!disabled && (
              <button
                type="button"
                className={styles.remove}
                aria-label={`Remove ${v}`}
                title="Remove"
                onClick={(e) => { e.stopPropagation(); removeAt(i); }}
              >
                <X_or_error size={7} color="currentColor" />
              </button>
            )}
          </span>
        ))}
        <input
          id={id}
          ref={box}
          className={styles.input}
          value={text}
          placeholder={value.length === 0 ? placeholder : undefined}
          aria-label={ariaLabel ?? label}
          disabled={disabled}
          onChange={onInput}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
      </div>
      {hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
}
