import React from 'react';
import styles from './Textarea.module.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
  isValid?: boolean;
}

export function Textarea({
  label,
  error,
  className = '',
  isValid = true,
  id: providedId,
  rows = 4,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const textareaId = providedId || generatedId;
  const errorId = `${textareaId}-error`;
  const hasError = error || !isValid;

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label}
          {props.required && <span aria-label="required"> *</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`${styles.textarea} ${hasError ? styles.error : ''}`}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error && (
        <span id={errorId} className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
