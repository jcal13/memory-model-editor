import PrimitiveBox from "./boxes/primitveBox";
import FunctionBox from "./boxes/functionBox";
import ListBox from "./boxes/listBox";  
import SetBox from "./boxes/setBox";
import DictBox from "./boxes/dictBox";

export default function Palette() {
  return (
    <div style={{ padding: "8px", border: "1px solid #ccc"}}>
      <h3>Palette</h3>
      <PrimitiveBox />
      <FunctionBox />
      <ListBox />
      <SetBox />
      <DictBox />
    </div>
  );
}
