import PaletteBox from "./components/PaletteBox";
import styles from "./styles/Palette.module.css";

/* =======================================
   === Palette Component ===
   Renders draggable PaletteBoxes for each type.
======================================= */

export default function Palette() {
  return (
    <div className={styles.paletteWrapper}>
      <div className={styles.paletteContainer}>
        <h3 className={styles.paletteTitle}>Palette</h3>

        {/* Draggable Box Types */}
        <div className={styles.paletteBoxes}>
          {["function", "primitive", "list", "tuple", "set", "dict", "class"].map(
            (type) => (
              <PaletteBox key={type} boxType={type as any} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
