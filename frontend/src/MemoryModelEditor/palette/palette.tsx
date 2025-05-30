import PrimitiveBox from "./boxes/primitveBox";
import FunctionBox from "./boxes/functionBox";
import ListBox from "./boxes/listBox";
import SetBox from "./boxes/setBox";
import DictBox from "./boxes/dictBox";
import TupleBox from "./boxes/tupleBox";

export default function Palette() {
  return (
    <div style={{ padding: "8px", border: "1px solid #ccc" }}>
      <h3>Palette</h3>
      <FunctionBox />
      <PrimitiveBox />
      <ListBox />
      <TupleBox />
      <SetBox />
      <DictBox />
    </div>
  );
}
