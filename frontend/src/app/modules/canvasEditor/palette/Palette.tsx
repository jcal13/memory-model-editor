import PaletteBox from "./components/PaletteBox";
import styles from "./styles/Palette.module.css";

export default function Palette() {
  return (
    <div className={styles.paletteWrapper}>
      <div className={styles.paletteContainer}>
        <h3 className={styles.paletteTitle}>Palette</h3>
        <div className={styles.paletteBoxes}>
          {["function", "primitive", "list", "tuple", "set", "dict"].map(
            (type) => (
              <PaletteBox key={type} boxType={type as any} />
            )
          )}
        </div>
      </div>
    </div>
  );
}
