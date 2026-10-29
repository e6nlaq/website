import type { SheetRect } from "./sheet";

/** 書き出す画像の最大辺(px) */
export const EXPORT_MAX_DIM = 4096;

/** 保存するファイル名を作る(端末のローカル時刻) */
export function formatExportFileName(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `red-sheet-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate()
  )}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(
    date.getSeconds()
  )}.png`;
}

/**
 * 写真にシートを重ねた画像を作る。
 *
 * 本物の赤シートと同じく、下の色を吸収する「乗算」で合成する。
 * rect が null のときはシートを描かない。
 */
export function drawSheetOnCanvas(
  source: CanvasImageSource,
  width: number,
  height: number,
  rect: SheetRect | null,
  color: string,
  opacity: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is unavailable");
  }
  context.drawImage(source, 0, 0, width, height);
  if (!rect) return canvas;
  context.globalCompositeOperation = "multiply";
  context.globalAlpha = Math.min(1, Math.max(0, opacity));
  context.fillStyle = color;
  context.fillRect(
    rect.x * width,
    rect.y * height,
    rect.width * width,
    rect.height * height
  );
  return canvas;
}

/** canvas を PNG の Blob に変換する */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to export the composited image"));
      }
    }, "image/png");
  });
}
