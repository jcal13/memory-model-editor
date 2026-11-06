import { maxInformationWidth } from './panelSizing';

test.each([640, 800, 1024, 1280, 1366, 1440, 1920])('keeps both columns within a %spx viewport with the palette open', viewport => {
  const available = viewport - 268;
  const panel = maxInformationWidth(available, viewport);
  expect(panel).toBeGreaterThan(0);
  expect(panel + 8).toBeLessThan(available);
  expect(available - panel - 8).toBeGreaterThanOrEqual(Math.min(780, available / 2));
});

test('retains a readable panel on a small laptop', () => {
  expect(maxInformationWidth(1024 - 268, 1024)).toBeGreaterThanOrEqual(320);
});
