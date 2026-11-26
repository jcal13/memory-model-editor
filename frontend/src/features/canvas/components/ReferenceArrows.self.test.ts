import { selfArrowPath, sideArrowPath } from "./ReferenceArrows";

const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);

describe("self-reference arrows", () => {
  const box = { x: 100, y: 200, width: 120, height: 80 };
  const slot = { x: 170, y: 240, width: 30, height: 20 };

  it("routes a slot pointing at its own box around the outside", () => {
    expect(sideArrowPath(slot, box)).toBe(selfArrowPath(slot, box));
  });

  it("loops over the top and ends on the top edge when there is room", () => {
    const n = nums(selfArrowPath(slot, box));
    expect(n.slice(0, 2)).toEqual([200, 250]); // leaves the slot's right side
    expect(n[n.length - 1]).toBe(200); // ends on the top edge
    expect(Math.max(...n.filter((_, i) => i % 2 === 0))).toBeGreaterThan(220); // goes past the right edge
  });

  it("loops under the bottom for a box at the top of the canvas", () => {
    const top = { ...box, y: 10 };
    const n = nums(selfArrowPath({ ...slot, y: 50 }, top));
    expect(n[n.length - 1]).toBe(90); // bottom edge
    expect(Math.min(...n.filter((_, i) => i % 2 === 1))).toBeGreaterThanOrEqual(0);
  });

  it("leaves arrows to other boxes unchanged", () => {
    const other = { x: 400, y: 200, width: 100, height: 60 };
    expect(sideArrowPath(slot, other).startsWith("M 200 250 C")).toBe(true);
  });
});
