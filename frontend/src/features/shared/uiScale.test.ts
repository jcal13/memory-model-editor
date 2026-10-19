import { BASE_UI_SCALE, getBrowserZoom, screenToCanvas } from './uiScale';

// Explicit expected compensation factors keep this independent of the clamp formula.
const zoomCases = [
  [0.25, 2], [1 / 3, 1.5], [0.5, 1], [2 / 3, 1], [0.75, 1],
  [0.8, 1], [0.9, 1], [1, 1], [1.1, 1], [1.25, 1],
  [1.5, 5 / 6], [1.75, 5 / 7], [2, 0.625], [2.5, 0.5],
];

it.each(zoomCases)('detects Chrome zoom %s with compensation %s', (z, compensation) => {
  for (const screenScale of [1, 1.25, 1.5, 1.75, 2, 2.5, 3]) {
    for (const windowWidth of [1024, 1440, 1920]) {
      const result = getBrowserZoom({ devicePixelRatio: screenScale * z,
        outerWidth: windowWidth, innerWidth: Math.round(windowWidth / z), outerHeight: 900, innerHeight: Math.round(820 / z) });
      expect(result.screenScale).toBe(screenScale);
      expect(result.z).toBe(z);
      expect(result.appliedZoom / BASE_UI_SCALE).toBeCloseTo(compensation);
      expect(result.appliedZoom * z).toBeCloseTo(BASE_UI_SCALE * compensation * z);
    }
  }
});

it.each([1.75, 1/3, 1.1])('detects a fresh load at %s, regardless of previous calls', z => {
  getBrowserZoom({ devicePixelRatio: 10, outerWidth: 1512, innerWidth: 302, outerHeight: 900, innerHeight: 164 });
  expect(getBrowserZoom({ devicePixelRatio: 2*z, outerWidth: 1512, innerWidth: 1512/z, outerHeight: 900, innerHeight: 820/z }).z).toBe(z);
});

it('tolerates small window-width discrepancies on Retina', () => {
  expect(getBrowserZoom({ devicePixelRatio: 3.5, outerWidth: 1512, innerWidth: (1512-40)/1.75, outerHeight: 900, innerHeight: 820/1.75 }).z).toBe(1.75);
});

// The vertical measurement disambiguates the previously failing sidebar case.
it('detects 175% on Retina with a 300px docked side panel', () => {
  const result = getBrowserZoom({
    devicePixelRatio: 3.5, outerWidth: 1512, innerWidth: (1512 - 300) / 1.75, outerHeight: 900, innerHeight: 820 / 1.75,
  });
  expect(result.z).toBe(1.75);
  expect(result.appliedZoom / BASE_UI_SCALE).toBeCloseTo(1.25 / 1.75);
});

it.each([0.625, 1, 1.5])('converts a drop through the SVG transform at applied zoom %s', appliedZoom => {
  // Include a translated canvas and separate canvas zoom to catch double-scaling.
  const canvasZoom = 0.8;
  const scale = appliedZoom * canvasZoom;
  const offset = { x: 190, y: 35 };
  const canvasPoint = { x: 120, y: 230 };
  const inverse = { a: 1 / scale, d: 1 / scale, e: -offset.x / scale, f: -offset.y / scale };
  const svg = {
    getScreenCTM: () => ({ inverse: () => inverse }),
    createSVGPoint: () => ({
      x: 0, y: 0,
      matrixTransform(matrix: typeof inverse) {
        return { x: this.x * matrix.a + matrix.e, y: this.y * matrix.d + matrix.f };
      },
    }),
  } as unknown as SVGSVGElement;
  const result = screenToCanvas(svg, offset.x + canvasPoint.x * scale, offset.y + canvasPoint.y * scale);
  expect(result?.x).toBeCloseTo(canvasPoint.x);
  expect(result?.y).toBeCloseTo(canvasPoint.y);
});

it('does not place a drop when the SVG is detached', () => {
  expect(screenToCanvas({ getScreenCTM: () => null } as unknown as SVGSVGElement, 10, 20)).toBeNull();
});

// Exercise both docking directions at every requested zoom and display scale.
it.each(zoomCases)('keeps compensation %s stable with docked panels', (z, compensation) => {
  for (const screenScale of [1, 1.25, 1.5, 1.75, 2, 2.5, 3]) {
    for (const sidePanel of [0, 300, 600]) {
      for (const bottomPanel of [0, 300]) {
        // Simultaneous large docks remain ambiguous; test one obstructed axis at a time.
        if (sidePanel && bottomPanel) continue;
        const result = getBrowserZoom({ devicePixelRatio: screenScale * z,
          outerWidth: 1440, innerWidth: Math.round((1440 - sidePanel) / z),
          outerHeight: 900, innerHeight: Math.round((820 - bottomPanel) / z) });
        expect(result.detected).toBe(true);
        expect(result.z).toBe(z);
        expect(result.appliedZoom / BASE_UI_SCALE).toBeCloseTo(compensation);
      }
    }
  }
});

it('does not guess a correction for unsupported display metrics', () => {
  const result = getBrowserZoom({ devicePixelRatio: 1.37, outerWidth: 1440,
    innerWidth: 1440, outerHeight: 900, innerHeight: 820 });
  expect(result.detected).toBe(false);
  expect(result.appliedZoom).toBe(BASE_UI_SCALE);
});
