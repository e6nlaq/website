/** シートの位置と大きさ(写真の幅・高さに対する 0〜1 の割合) */
export interface SheetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** シートの最小サイズ(写真に対する割合) */
export const MIN_SHEET_SIZE = 0.06;

/** 撮影直後・リセット時のシートの位置と大きさ */
export const DEFAULT_SHEET_RECT: SheetRect = {
  x: 0.1,
  y: 0.25,
  width: 0.8,
  height: 0.5,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** シートが写真の外にはみ出さないように収める */
export function clampSheetRect(rect: SheetRect): SheetRect {
  const width = clamp(rect.width, MIN_SHEET_SIZE, 1);
  const height = clamp(rect.height, MIN_SHEET_SIZE, 1);
  return {
    x: clamp(rect.x, 0, 1 - width),
    y: clamp(rect.y, 0, 1 - height),
    width,
    height,
  };
}

/** ドラッグで移動したときのシートを返す(dx, dy は写真に対する割合) */
export function moveSheetRect(
  start: SheetRect,
  dx: number,
  dy: number
): SheetRect {
  return clampSheetRect({ ...start, x: start.x + dx, y: start.y + dy });
}

/** 右下のハンドルで大きさを変えたときのシートを返す */
export function resizeSheetRect(
  start: SheetRect,
  dx: number,
  dy: number
): SheetRect {
  return {
    x: start.x,
    y: start.y,
    width: clamp(
      start.width + dx,
      MIN_SHEET_SIZE,
      Math.max(MIN_SHEET_SIZE, 1 - start.x)
    ),
    height: clamp(
      start.height + dy,
      MIN_SHEET_SIZE,
      Math.max(MIN_SHEET_SIZE, 1 - start.y)
    ),
  };
}

/** ピンチで大きさを変えたときのシートを返す(中心を固定して拡大縮小する) */
export function scaleSheetRect(start: SheetRect, scale: number): SheetRect {
  const width = clamp(start.width * scale, MIN_SHEET_SIZE, 1);
  const height = clamp(start.height * scale, MIN_SHEET_SIZE, 1);
  const centerX = start.x + start.width / 2;
  const centerY = start.y + start.height / 2;
  return clampSheetRect({
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  });
}
