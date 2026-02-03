import MemoryViz from "memory-viz";
import { BoxConfigs } from "./BoxConfigs";
import { BoxType } from "../shared/types";

export function createBoxRenderer(boxType: BoxType): SVGSVGElement {
  const { MemoryModel } = MemoryViz;
  const config = BoxConfigs[boxType];

  if (!config) {
    throw new Error(`Unknown box type: ${boxType}`);
  }

  // Generate a consistent seed based on the box type string
  const seed = boxType
    .split("")
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 1);

  const model = new MemoryModel({
    obj_min_width: config.minWidth,
    obj_min_height: config.minHeight,
    prop_min_width: 54,
    prop_min_height: 36,
    double_rect_sep: 10,
    font_size: 17,
    browser: true,
    roughjs_config: {
      options: {
        fillStyle: "solid",
        seed: seed,
      },
    },
  });

  // Render the box using the config's draw method
  config.draw(model);

  const svg = model.svg;

  // Resize SVG after layout is stable
  requestAnimationFrame(() => {
    const padding = 5;
    try {
      const bbox = svg.getBBox();
      
      const finalWidth = bbox.width + padding;
      const finalHeight = bbox.height + padding;

      svg.setAttribute("width", `${finalWidth}`);
      svg.setAttribute("height", `${finalHeight}`);

      if (boxType === "none") {
        const shiftX = 10; 
        const shiftY = 10; 
        
        svg.setAttribute("viewBox", `${shiftX} ${shiftY} ${finalWidth} ${finalHeight}`);
      }
      
    } catch (error) {
      console.warn(`getBBox failed for ${boxType}:`, error);
    }
  });

  return svg;
}
