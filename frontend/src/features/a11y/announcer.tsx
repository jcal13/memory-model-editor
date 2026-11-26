import { useEffect, useState } from "react";
import styles from "./a11y.module.css";

/**
 * A polite live region for confirming edits and reading Submit feedback.
 * Call `announce(text)` from anywhere; <LiveAnnouncer /> (rendered once by
 * the editor) speaks it. Messages sent within a short window are joined, and
 * the region is cleared first so repeating the same text is read again.
 */

type Listener = (message: string) => void;
const listeners = new Set<Listener>();

export function announce(message: string): void {
  const text = message.trim();
  if (!text) return;
  listeners.forEach((l) => l(text));
}

/** For tests: how many regions are listening. */
export const announcerCount = () => listeners.size;

export const ANNOUNCE_DELAY_MS = 120;

export default function LiveAnnouncer() {
  const [text, setText] = useState("");

  useEffect(() => {
    let pending: string[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onMessage: Listener = (message) => {
      if (!pending.includes(message)) pending.push(message);
      if (timer) return;
      setText("");
      timer = setTimeout(() => {
        timer = null;
        setText(pending.join(". "));
        pending = [];
      }, ANNOUNCE_DELAY_MS);
    };
    listeners.add(onMessage);
    return () => {
      listeners.delete(onMessage);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly} data-testid="live-announcer">
      {text}
    </div>
  );
}
