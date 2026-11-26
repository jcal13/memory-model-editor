/** WCAG 2 contrast ratio between two colours (#rgb, #rrggbb or rgb(r, g, b)). */
export function parseColor(c: string): [number, number, number] {
  const s = c.trim();
  const rgb = s.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  let h = s.replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  if (!/^[0-9a-f]{6}$/i.test(h)) throw new Error(`Unsupported colour: ${c}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}

const luminance = ([r, g, b]: [number, number, number]) => {
  const lin = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

export function contrastRatio(a: string, b: string): number {
  const la = luminance(parseColor(a));
  const lb = luminance(parseColor(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Read `--name: value;` custom properties from one `:root[data-theme="…"]` block. */
export function readThemeVars(css: string, theme: "light" | "dark"): Record<string, string> {
  const start = css.indexOf(`:root[data-theme="${theme}"]`);
  if (start < 0) return {};
  const body = css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start));
  const vars: Record<string, string> = {};
  body.replace(/(--[\w-]+)\s*:\s*([^;]+);/g, (_, k: string, v: string) => {
    vars[k] = v.trim();
    return "";
  });
  return vars;
}
