import PrimitiveBox from "./boxes/primitveBox";
import FunctionBox from "./boxes/functionBox";
import ListBox from "./boxes/listBox";
import SetBox from "./boxes/setBox";
import DictBox from "./boxes/dictBox";
import MemoryViz from "memory-viz";
// import type { MemoryModel } from "memory-viz";

export default function Palette() {
  // const { MemoryModel } = MemoryViz;
  // const model = new MemoryModel({
  //   obj_min_width: 150,
  //   obj_min_height: 90,
  //   prop_min_width: 50,
  //   prop_min_height: 40,
  //   double_rect_sep: 10,
  //   font_size: 18,
  //   browser: true,
  //   roughjs_config: {
  //     options: {
  //       fillStyle: "solid",
  //     },
  //   },
  // });

  return (
    <div style={{ padding: "8px", border: "1px solid #ccc" }}>
      <h3>Palette</h3>
      {/* <PrimitiveBox model={model} /> */}
      <PrimitiveBox />
      <FunctionBox />
      <ListBox />
      <SetBox />
      <DictBox />
    </div>
  );
}
