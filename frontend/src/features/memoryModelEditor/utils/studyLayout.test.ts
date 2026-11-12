import { arrangeStudyObjects } from "./studyLayout";
import { CanvasElement } from "../../shared/types";
jest.mock("../../canvas/utils/box.renderer", () => ({createBoxRenderer: jest.fn()}));
const studies = require("../../../../../backend/src/database/studyQuestions.json");
it.each([700, 1100, 1600])("centers study objects without overlaps at width %s", width => {
  for (const study of studies.slice(1)) {
    const elements = study.canvasConfig.elements as CanvasElement[];
    const objects = elements.filter(e => e.kind.name !== "function");
    const sizes = new Map(objects.map(e => [e.boxId, {width: e.kind.name === "list" ? 280 : 220, height: e.kind.name === "list" ? 180 : 130}]));
    const placed = arrangeStudyObjects(elements, sizes, width, 1200, 225);
    expect(placed[0]).toBe(elements[0]);
    expect(elements).toEqual(study.canvasConfig.elements);
    const boxes = placed.filter(e => sizes.has(e.boxId)).map(e => ({x:e.x, y:e.y, ...sizes.get(e.boxId)!}));
    for (let i=0; i<boxes.length; i++) {
      const a=boxes[i];
      expect(a.x-a.width/2).toBeGreaterThanOrEqual(225+32);
      expect(a.x+a.width/2).toBeLessThanOrEqual(width-32);
      for (const b of boxes.slice(i+1)) expect(Math.abs(a.x-b.x) >= (a.width+b.width)/2+31 || Math.abs(a.y-b.y) >= (a.height+b.height)/2+31).toBe(true);
    }
    const top=Math.min(...boxes.map(b=>b.y-b.height/2));
    const bottom=Math.max(...boxes.map(b=>b.y+b.height/2));
    expect((top+bottom)/2).toBeCloseTo(600);
  }
});
