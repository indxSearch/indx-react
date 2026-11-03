import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check } from '@indxsearch/pixl';
import { Button } from '../Button/Button';
import styles from './CodeCopy.module.css';

export interface CodeCopyProps {
  /** The command or snippet, shown on one line and copied as is. */
  code: string;
  className?: string;
  /** Called after the code is on the clipboard. */
  onCopy?: () => void;
}

/** Writes to the clipboard, falling back to a hidden textarea where the Clipboard API is missing
 *  or refused (an insecure context such as a self-hosted server on plain http). */
async function writeClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to the textarea
    }
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.left = '-9999px';
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

/** A one-line command with a copy button, like the install line on a package page. The icon turns
 *  into a check for two seconds after a copy. As tall as a default Button, so it sits in a row of them. */
export function CodeCopy({ code, className, onCopy }: CodeCopyProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    if (!(await writeClipboard(code))) return;
    setCopied(true);
    onCopy?.();
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <code className={styles.code}>{code}</code>
      <Button
        size="micro"
        variant="ghost"
        iconLeft={copied ? <Check /> : <Copy />}
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy'}
        title={copied ? 'Copied' : 'Copy'}
      />
      <span className={styles.status} role="status">{copied ? 'Copied' : ''}</span>
    </div>
  );
}
