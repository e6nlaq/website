/** 縦横比を維持したまま、最大辺がmaxDim以下になるサイズを計算する */
export function getScaledSize(
  width: number,
  height: number,
  maxDim: number
): { width: number; height: number } {
  const scale = Math.min(1, maxDim / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** 0〜1に収める */
export function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}
