import type {
  CSSProperties,
  KeyboardEvent,
} from "react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import { copyToClipboard } from "~/data/Objects";

export interface CopyCellProps {
  value: string;
  /** Also hand off here after copying — e.g. a mailto: link. */
  href?: string | null;
  style?: CSSProperties;
  className?: string;
}

/******************************
 * CopyCell component
 * One table value that copies itself to the clipboard on click, Enter or
 * Space. The text swaps to "Copied" for 2s so the user gets feedback, and
 * `aria-live` reads that swap out to a screen reader.
 *
 * A `<p role="button">` rather than a `<button>`: the global `button` rule sets
 * button styling (weight, casing, padding), which would restyle every value in
 * the tables using this.
 * Drop it in any table cell: <CopyCell value={email} href={`mailto:${email}`} />
 */
export function CopyCell({
  value,
  href,
  style,
  className = "",
}: CopyCellProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current)
        clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      if (timeoutRef.current)
        clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(
        () => setCopied(false),
        2000,
      );
    }
    // Navigating away from the copy is deliberate: the clipboard write has
    // already resolved, so the mail/phone handoff can't clobber it.
    if (href) window.location.href = href;
  }

  function handleKeyDown(
    e: KeyboardEvent<HTMLParagraphElement>,
  ) {
    if (e.key !== "Enter" && e.key !== " ")
      return;
    // Space would otherwise scroll the page.
    e.preventDefault();
    handleCopy();
  }

  return (
    <p
      role="button"
      tabIndex={0}
      aria-live="polite"
      className={`clickable ${className}`}
      style={style}
      title={`Copy ${value}`}
      onClick={handleCopy}
      onKeyDown={handleKeyDown}
    >
      {copied ? "Copied" : value}
    </p>
  );
}
