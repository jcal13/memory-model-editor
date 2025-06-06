import PrimitiveBox from "./boxes/primitveBox";
import FunctionBox from "./boxes/functionBox";
import ListBox from "./boxes/listBox";
import SetBox from "./boxes/setBox";
import DictBox from "./boxes/dictBox";
import TupleBox from "./boxes/tupleBox";
import "./palette.css";

export default function Palette() {
  return (
    <div className="palette-container">
      <h3 className="palette-title">Palette</h3>
      <div className="palette-boxes">
        <FunctionBox />
        <PrimitiveBox />
        <ListBox />
        <TupleBox />
        <SetBox />
        <DictBox />
      </div>
    </div>
  );
}
