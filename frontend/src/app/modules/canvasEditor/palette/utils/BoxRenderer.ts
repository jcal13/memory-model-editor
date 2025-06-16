import MemoryViz from "memory-viz";
import { BoxConfigs } from "./BoxConfigs";

/* =======================================
   === createBoxRenderer (Palette Only) ===
   Renders a box for a given kind name using
   its BoxConfig definition and returns an SVG.
======================================= */

export function createBoxRenderer(
  kindName: keyof typeof BoxConfigs
): SVGSVGElement {
  const { MemoryModel } = MemoryViz;
  const config = BoxConfigs[kindName];

  // Setup base config for MemoryModel
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

  // Render the box using the config's draw method
  config.draw(model);

  const svg = model.svg;

  // Resize SVG after layout is stable
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
