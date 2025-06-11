import MemoryViz from "memory-viz";
import { BoxConfigs } from "./BoxConfigs";

export function createBoxRenderer(
  kindName: keyof typeof BoxConfigs
): SVGSVGElement {
  const { MemoryModel } = MemoryViz;
  const config = BoxConfigs[kindName];

  const model = new MemoryModel({
    obj_min_width: config.minWidth,
    obj_min_height: config.minHeight,
    prop_min_width: 60,
    prop_min_height: 40,
    double_rect_sep: 10,
    font_size: 18,
    browser: true,
    roughjs_config: { options: { fillStyle: "solid" } },
  });

  config.draw(model);

  const svg = model.svg;

  requestAnimationFrame(() => {
    const padding = 5;

    try {
      const bbox = svg.getBBox();
      svg.setAttribute("width", `${bbox.width + padding}`);
      svg.setAttribute("height", `${bbox.height + padding}`);
    } catch (e) {
      console.warn(`getBBox failed for ${kindName}`, e);
    }
  });

  return svg;
}
