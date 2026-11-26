/**
 * Inline (in-SVG) editing replaces the floating editor dialog (Practice and
 * Test modes, MemoryViz and Python Tutor styles). Opt out for comparison with
 * localStorage.setItem("memorylab_inline_editing", "off").
 */
export function inlineEditingEnabled() {
  try {
    return localStorage.getItem("memorylab_inline_editing") !== "off";
  } catch {
    return true;
  }
}
