import fs from "fs";
import path from "path";
import { contrastRatio, readThemeVars } from "./contrast";

/**
 * Ids and type labels on the canvas must stay readable (WCAG AA, 4.5:1) in
 * both themes. Light theme draws MemoryViz's own colours (dark theme
 * overrides them with the --text-*-color tokens), so those are listed here.
 */
const MEMORYVIZ_ID = "rgb(150, 100, 28)";
const MEMORYVIZ_TYPE = "rgb(27, 14, 139)";
const AA = 4.5;

const css = fs.readFileSync(path.join(__dirname, "../../styles/theme.css"), "utf8");
const light = readThemeVars(css, "light");
const dark = readThemeVars(css, "dark");

describe("contrast of ids and type labels", () => {
  it("computes known ratios", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#fff", "#fff")).toBeCloseTo(1, 5);
  });

  it("reads the theme tokens", () => {
    expect(light["--canvas-bg"]).toBeTruthy();
    expect(dark["--text-id-color"]).toBeTruthy();
  });

  const cases: [string, string, string][] = [
    ["light: MemoryViz id on box", MEMORYVIZ_ID, light["--box-fill"]],
    ["light: MemoryViz id on id cell (#f7f7f7)", MEMORYVIZ_ID, "rgb(247, 247, 247)"],
    ["light: MemoryViz type on box", MEMORYVIZ_TYPE, light["--box-fill"]],
    ["light: id chip text", light["--text-id-color"], light["--bg-secondary"]],
    ["light: chip hint", light["--text-tertiary"], light["--bg-secondary"]],
    ["light: Python Tutor header", light["--python-tutor-header-text"], light["--python-tutor-box-bg"]],
    ["light: Python Tutor reference", light["--python-tutor-reference-text"], light["--python-tutor-box-bg"]],
    ["dark: id on box", dark["--text-id-color"], dark["--box-fill"]],
    ["dark: id on canvas", dark["--text-id-color"], dark["--canvas-bg"]],
    ["dark: type on box", dark["--text-type-color"], dark["--box-fill"]],
    ["dark: value on box", dark["--text-value-color"], dark["--box-fill"]],
    ["dark: chip hint", dark["--text-tertiary"], dark["--bg-secondary"]],
    ["dark: Python Tutor header", dark["--python-tutor-header-text"], dark["--python-tutor-box-bg"]],
    ["dark: Python Tutor reference", dark["--python-tutor-reference-text"], dark["--python-tutor-box-bg"]],
  ];
  it.each(cases)("%s meets 4.5:1", (_label, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(AA);
  });
});
