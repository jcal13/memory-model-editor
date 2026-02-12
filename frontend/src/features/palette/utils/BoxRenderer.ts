import MemoryViz from "memory-viz";
import { BoxTypeName } from "../../shared/types";
import { getBoxConfig, DEFAULT_PALETTE_STYLE } from "../../shared/boxConfig";

export function createBoxRenderer(boxType: BoxTypeName): SVGSVGElement {
  const { MemoryModel } = MemoryViz;
  const config = getBoxConfig(boxType);

  // Generate a consistent seed based on the box type string
  const seed = boxType
    .split("")
    .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 1);

  const model = new MemoryModel({
    obj_min_width: config.paletteMinWidth + (boxType === "none" ? 20 : 0),
    obj_min_height: config.paletteMinHeight + (boxType === "none" ? 15 : 0),
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

  // Render the box using the palette-specific draw method
  config.drawPalette(model, DEFAULT_PALETTE_STYLE);

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
