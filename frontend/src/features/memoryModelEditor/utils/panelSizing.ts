/** Reserve useful canvas space without forcing the editor beyond the viewport. */
export function maxInformationWidth(containerWidth: number, viewportWidth: number) {
  const canvasWidth = Math.min(780, containerWidth * 0.5);
  return Math.max(0, Math.min(viewportWidth * 0.6667, containerWidth - canvasWidth - 8));
}
