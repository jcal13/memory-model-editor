import PaletteBox from "./components/PaletteBox";
import styles from "./styles/Palette.module.css";
import { PaletteTab } from "../shared/types";

/** Box categories */
export type BoxType =
  | "class"
  | "function"
  | "primitive"
  | "list"
  | "tuple"
  | "set"
  | "dict";

const ALL_TYPES = [
  "class",
  "function",
  "primitive",
  "list",
  "tuple",
  "set",
  "dict",
] as const;
const CLASS_FN_TYPES = ["class", "function"] as const;
const PRIMITIVE_TYPES = ["primitive"] as const;
const COLLECTION_TYPES = ["list", "tuple", "set", "dict"] as const;

interface Props {
  activeTab: PaletteTab;
  setActive: (tab: PaletteTab) => void;
}

export default function Palette({ activeTab, setActive }: Props) {
  const TabBtn = (tab: PaletteTab, label: string) => (
    <button
      key={tab}
      type="button"
      className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
      onClick={() => setActive(tab)}
    >
      {label}
    </button>
  );

  const boxes: readonly BoxType[] =
    activeTab === "all"
      ? ALL_TYPES
      : activeTab === "classesFns"
      ? CLASS_FN_TYPES
      : activeTab === "primitives"
      ? PRIMITIVE_TYPES
      : COLLECTION_TYPES;

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <div className={styles.tabBody}>
          <div className={styles.paletteBoxes}>
            {boxes.map((t) => (
              <PaletteBox key={t} boxType={t} />
            ))}
          </div>
        </div>

        <div className={styles.tabHeaders}>
          {TabBtn("all", "All")}
          {TabBtn("classesFns", "Classes & functions")}
          {TabBtn("primitives", "Primitives")}
          {TabBtn("collections", "Collections")}
        </div>
      </div>
    </div>
  );
}