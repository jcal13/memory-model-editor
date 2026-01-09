import React from "react";
import PaletteBox from "./components/PaletteBox";
import styles from "./Palette.module.css";
import { PaletteTab, BoxType } from "./shared/types";

// Move constants here for better organization
const ALL_TYPES: readonly BoxType[] = [
  "function",
  "class",
  "none",
  "int",
  "float",
  "str",
  "bool",
  "list",
  "tuple",
  "set",
  "dict",
] as const;

const CLASS_FN_TYPES: readonly BoxType[] = ["function", "class"] as const;
const PRIMITIVE_TYPES: readonly BoxType[] = [
  "none",
  "int",
  "float",
  "str",
  "bool",
] as const;
const COLLECTION_TYPES: readonly BoxType[] = [
  "list",
  "tuple",
  "set",
  "dict",
] as const;

const TAB_BOX_MAPPING = {
  all: ALL_TYPES,
  classesFns: CLASS_FN_TYPES,
  primitives: PRIMITIVE_TYPES,
  collections: COLLECTION_TYPES,
} as const;

const TAB_LABELS = {
  all: "All",
  classesFns: "Classes & Functions",
  primitives: "Primitives",
  collections: "Collections",
} as const;

interface PaletteProps {
  activeTab: PaletteTab;
  setActive: (tab: PaletteTab) => void;
  requiredBoxes?: BoxType[];
  isPracticeMode?: boolean;
}

// Extract TabButton component inline
const TabButton: React.FC<{
  tab: PaletteTab;
  label: string;
  isActive: boolean;
  onClick: (tab: PaletteTab) => void;
}> = ({ tab, label, isActive, onClick }) => (
  <button
    type="button"
    className={`${styles.tabBtn} ${isActive ? styles.active : ""}`}
    onClick={() => onClick(tab)}
    aria-pressed={isActive}
  >
    <span className={styles.tabLabel}>{label}</span>
  </button>
);

function filterBoxesByRequired(
  boxes: readonly BoxType[],
  requiredBoxes?: BoxType[]
): BoxType[] {
  if (!requiredBoxes || requiredBoxes.length === 0) {
    return [...boxes];
  }

  return boxes.filter((boxType) => requiredBoxes.includes(boxType));
}

export default function Palette({
  activeTab,
  setActive,
  requiredBoxes,
  isPracticeMode = false,
}: PaletteProps) {
  const allBoxes = TAB_BOX_MAPPING[activeTab];

  const boxes =
    isPracticeMode && requiredBoxes
      ? filterBoxesByRequired(allBoxes, requiredBoxes)
      : allBoxes;

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <nav className={styles.tabHeaders} role="tablist">
          {(Object.keys(TAB_LABELS) as PaletteTab[]).map((tab) => (
            <TabButton
              key={tab}
              tab={tab}
              label={TAB_LABELS[tab]}
              isActive={activeTab === tab}
              onClick={setActive}
            />
          ))}
        </nav>

        <div className={styles.tabBody} role="tabpanel">
          <h3 className={styles.paletteTitle}>Palette</h3>
          <div className={styles.paletteBoxes}>
            {boxes.map((boxType) => (
              <PaletteBox key={boxType} boxType={boxType} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
