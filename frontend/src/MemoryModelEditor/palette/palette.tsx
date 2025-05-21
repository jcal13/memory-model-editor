import PrimitiveBox from "./boxes/primitveBox";
import FunctionBox from "./boxes/functionBox";

export default function Palette() {
  return (
    <div style={{ padding: "8px", border: "1px solid #ccc" }}>
      <h3>Palette</h3>
      <PrimitiveBox />
      <FunctionBox />
    </div>
  );
}
