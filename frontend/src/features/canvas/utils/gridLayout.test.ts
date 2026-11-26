import { GRID_GAP, assignCells, cellCenter, gridGeometry, nearestCell, stepCell } from "./gridLayout";

// Every column 172 wide (cells 200 x 100 with the gap), 3 of them in 1000 - 200.
const g = gridGeometry(
  [0, 1, 2].map((cell) => ({ width: 172, height: 72, cell })),
  860,
  200
);
const at = (i: number) => cellCenter(g, i);

describe("grid layout", () => {
  it("lays cells out row by row right of the call stack", () => {
    expect(g.cols).toBe(3);
    expect(at(0)).toEqual({ x: 324, y: 74 });
    expect(at(4)).toEqual({ x: 524, y: 168 }); // empty row 1: minimum height (60)
    expect(nearestCell(g, 530, 180)).toBe(4);
    expect(stepCell(g, 4, 0, -1)).toBe(1);
    expect(stepCell(g, 0, -1, 0)).toBeNull();
  });

  it("sizes each column to its widest box and each row to its tallest", () => {
    // 3 columns fit; a long name in cell 1 widens only column 1, a tall
    // object in cell 3 makes only row 1 tall.
    const boxes = [
      { width: 150, height: 60, cell: 0 },
      { width: 260, height: 60, cell: 1 },
      { width: 150, height: 60, cell: 2 },
      { width: 150, height: 200, cell: 3 },
      { width: 150, height: 60, cell: 6 },
    ];
    const v = gridGeometry(boxes, 900, 100);
    expect(v.cols).toBe(3);
    expect(v.colW).toEqual([150, 260, 150]);
    expect(v.rowH).toEqual([60, 200, 60]);
    const x = (c: number) => cellCenter(v, c).x;
    const y = (c: number) => cellCenter(v, c).y;
    expect(x(1) - x(0)).toBe((150 + 260) / 2 + GRID_GAP);
    expect(x(2) - x(1)).toBe((260 + 150) / 2 + GRID_GAP);
    expect(y(3) - y(0)).toBe((60 + 200) / 2 + GRID_GAP);
    expect(y(6) - y(3)).toBe((200 + 60) / 2 + GRID_GAP);
    expect(nearestCell(v, x(1) + 120, y(3) + 90)).toBe(4);
  });

  it("drops a column when the boxes' widths don't fit", () => {
    const wide = [0, 1, 2].map((cell) => ({ width: 300, height: 60, cell }));
    expect(gridGeometry(wide, 1000, 100).cols).toBe(2);
    expect(gridGeometry([{ width: 2000, height: 60, cell: 0 }], 1000, 100).cols).toBe(1);
  });

  it("stops at the grid's edges instead of wrapping or leaving the canvas", () => {
    // 3 columns (see above); 2 visible rows.
    expect(stepCell(g, 2, 1, 0, 2)).toBeNull(); // right edge: no wrap
    expect(stepCell(g, 3, -1, 0, 2)).toBeNull(); // left edge
    expect(stepCell(g, 4, 0, 1, 2)).toBeNull(); // last visible row
    expect(stepCell(g, 1, 0, 1, 2)).toBe(4);
    expect(stepCell(g, 7, 0, 1, 2)).toBeNull(); // overflow row: not further down
    expect(stepCell(g, 7, 0, -1, 2)).toBe(4); // ...but up is fine
  });

  it("packs boxes in reading order when first turned on", () => {
    const cells = assignCells(
      [
        { boxId: 1, x: 900, y: 50, moved: false, hasCell: false },
        { boxId: 2, x: 300, y: 60, moved: false, hasCell: false },
        { boxId: 3, x: 300, y: 500, moved: false, hasCell: false },
      ],
      new Map(),
      g
    );
    expect(Object.fromEntries(cells)).toEqual({ 2: 0, 1: 1, 3: 2 });
  });

  it("swaps a dragged box with the box in the cell it lands on", () => {
    const prev = new Map([[1, 0], [2, 1]]);
    const cells = assignCells(
      [
        { boxId: 1, ...at(1), moved: true, hasCell: true },
        { boxId: 2, ...at(1), moved: false, hasCell: true },
      ],
      prev,
      g
    );
    expect(Object.fromEntries(cells)).toEqual({ 1: 1, 2: 0 });
  });

  it("puts a new box in the cell under it if free, else the first free cell", () => {
    const prev = new Map([[1, 0]]);
    const boxes = [{ boxId: 1, ...at(0), moved: false, hasCell: true }];
    expect(assignCells([...boxes, { boxId: 2, ...at(5), moved: false, hasCell: false }], prev, g).get(2)).toBe(5);
    expect(assignCells([...boxes, { boxId: 2, ...at(0), moved: false, hasCell: false }], prev, g).get(2)).toBe(1);
  });
});
