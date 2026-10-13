/** Convert pointer/viewport measurements to the scaled UI's layout coordinates. */
export function uiScale(): number {
  return Number(getComputedStyle(document.documentElement).getPropertyValue("--ui-scale")) || 1;
}

/** Uniformly shrink the desktop design to fit either viewport dimension. */
export function workspaceScale(width: number, height: number): number {
  return Math.min(1, width / 1440, height / 900);
}
