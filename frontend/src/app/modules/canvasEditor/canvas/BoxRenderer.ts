import MemoryViz from "memory-viz";
import { CanvasElement } from "../shared/types";
import { BoxConfigs } from "./BoxConfigs";

export function createBoxRenderer(element: CanvasElement): SVGSVGElement {
  const { MemoryModel } = MemoryViz;
  const kind = element.kind;
  const kindName = kind.name;

  const handler = BoxConfigs[kindName];
  const config = {
    obj_min_width: handler?.getMinWidth?.() ?? 190,
    obj_min_height: handler?.getHeight?.(kind) ?? 90,
    prop_min_width: 60,
    prop_min_height: 40,
    double_rect_sep: 10,
    font_size: 18,
    browser: true,
    roughjs_config: { options: { fillStyle: "solid" } },
  };

  const model = new MemoryModel(config);
  handler?.draw?.(model, kind, Number(element.id));
  return model.svg;
}
