import MemoryViz from "memory-viz";
import { CanvasElement } from "../../shared/types";
import { BoxConfigs } from "./BoxConfigs";

/* ==============================================
   === SVG Renderer for Memory Model Elements ===
============================================== */

export function createBoxRenderer(element: CanvasElement): SVGSVGElement {
  const { MemoryModel } = MemoryViz;
  const kind = element.kind;
  const kindName = kind.name;

  // === Retrieve draw + sizing handlers for this element type
  const handler = BoxConfigs[kindName];

  // === Configure MemoryViz rendering options
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

  // === Create the MemoryViz model and draw the element
  const model = new MemoryModel(config);
  handler?.draw?.(model, kind, element.id);

  // === Return the generated SVG node
  return model.svg;
}
