import PaletteBox from "./PaletteBox";
import "./Palette.css";

export default function Palette() {
  return (
    <div className="palette-container">
      <h3 className="palette-title">Palette</h3>
      <div className="palette-boxes">
        {["function", "primitive", "list", "tuple", "set", "dict"].map((type) => (
          <PaletteBox key={type} boxType={type as any} />
        ))}
      </div>
    </div>
  );
}
