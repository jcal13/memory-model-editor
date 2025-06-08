import PrimitiveBox from "./boxes/PrimitveBox";
import FunctionBox from "./boxes/FunctionBox";
import ListBox from "./boxes/ListBox";
import TupleBox from "./boxes/TupleBox";
import SetBox from "./boxes/SetBox";
import DictBox from "./boxes/DictBox";

import "./Palette.css";

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
