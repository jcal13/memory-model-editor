import PaletteBox from "./components/PaletteBox";
import styles from "./styles/Palette.module.css";
import { PaletteTab } from "../shared/types";

const BASIC_TYPES = ["primitive", "function", "class"] as const;
const COLLECTION_TYPES = ["list", "tuple", "set", "dict"] as const;

interface Props {
  activeTab: PaletteTab;
  setActive: (tab: PaletteTab) => void;
}

export default function Palette({ activeTab, setActive }: Props) {
  const renderTabButton = (tab: PaletteTab, label: string) => (
    <button
      type="button"
      className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ""}`}
      onClick={() => setActive(tab)}
    >
      {label}
    </button>
  );

  const boxes =
    activeTab === "basic" ? BASIC_TYPES : COLLECTION_TYPES;

  return (
    <div className={styles.containerWrapper}>
      <div className={styles.container}>
        <div className={styles.tabHeaders}>
          {renderTabButton("basic", "Basic")}
          {renderTabButton("collections", "Collections")}
        </div>

        <div className={styles.tabBody}>
          <div className={styles.paletteBoxes}>
            {boxes.map((t) => (
              <PaletteBox key={t} boxType={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
