import { useEffect, useRef, useState } from "react";
import styles from "./AddObjectPicker.module.css";

export type AddChoice = { boxType: string; label: string; key: string };

export const ADD_CHOICES: AddChoice[] = [
  { boxType: "int", label: "int", key: "i" },
  { boxType: "float", label: "float", key: "f" },
  { boxType: "str", label: "str", key: "s" },
  { boxType: "bool", label: "bool", key: "b" },
  { boxType: "none", label: "None", key: "n" },
  { boxType: "list", label: "list", key: "l" },
  { boxType: "tuple", label: "tuple", key: "t" },
  { boxType: "set", label: "set", key: "e" },
  { boxType: "dict", label: "dict", key: "d" },
  { boxType: "class", label: "object (class)", key: "o" },
  { boxType: "function", label: "frame", key: "r" },
];

/**
 * Keyboard way to add a box (the palette is drag-only): a listbox of box
 * types. Arrow keys + Enter, a type's letter, or a click; Esc closes.
 */
export default function AddObjectPicker({
  choices,
  onPick,
  onClose,
}: {
  choices: AddChoice[];
  onPick: (boxType: string) => void;
  onClose: () => void;
}) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const previousFocus = useRef<Element | null>(document.activeElement);

  useEffect(() => {
    listRef.current?.focus();
    const previous = previousFocus.current;
    return () => {
      // If nothing else took focus (e.g. a new box), go back where we were.
      if (document.activeElement === document.body && previous instanceof HTMLElement) previous.focus();
      else if (document.activeElement === document.body && previous instanceof SVGElement) previous.focus();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      setActive((i) => (i + 1) % choices.length);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((i) => (i - 1 + choices.length) % choices.length);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(choices.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (choices[active]) onPick(choices[active].boxType);
    } else if (e.key === "Tab") {
      onClose();
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const match = choices.find((c) => c.key === e.key.toLowerCase());
      if (match) {
        e.preventDefault();
        onPick(match.boxType);
      }
    }
  };

  return (
    <div className={styles.picker}>
      <div className={styles.title} id="add-object-title">
        Add object <span className={styles.hint}>↑↓ Enter · letter · Esc</span>
      </div>
      <ul
        ref={listRef}
        className={styles.list}
        role="listbox"
        tabIndex={0}
        aria-labelledby="add-object-title"
        aria-activedescendant={`add-object-${choices[active]?.boxType}`}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) onClose();
        }}
      >
        {choices.map((c, i) => (
          <li
            key={c.boxType}
            id={`add-object-${c.boxType}`}
            role="option"
            aria-selected={i === active}
            className={i === active ? styles.active : undefined}
            onMouseEnter={() => setActive(i)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(c.boxType)}
          >
            <span className={styles.label}>{c.label}</span>
            <kbd className={styles.key}>{c.key.toUpperCase()}</kbd>
          </li>
        ))}
      </ul>
    </div>
  );
}
