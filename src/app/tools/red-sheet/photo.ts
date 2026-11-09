import { getScaledSize } from "@/lib/image";
import { EXPORT_MAX_DIM } from "./export";

export interface LoadedPhoto {
  /** 書き出しに使う元画像(最大辺 EXPORT_MAX_DIM) */
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

/**
 * 撮影した画像や選択した画像を、向きをそろえた canvas にする。
 *
 * EXIF の向きは createImageBitmap の時点で反映されるため、
 * 表示と書き出しで同じ向きになる。
 */
export async function loadPhotoFromBlob(blob: Blob): Promise<LoadedPhoto> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    bitmap = await createImageBitmap(blob);
  }
  try {
    const size = getScaledSize(bitmap.width, bitmap.height, EXPORT_MAX_DIM);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Canvas 2D context is unavailable");
    }
    // 透過 PNG でも表示と書き出しで同じ見た目になるよう、下地を白にする
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size.width, size.height);
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    return { canvas, width: size.width, height: size.height };
  } finally {
    bitmap.close();
  }
}

/** canvas を表示用の URL にする(呼び出し側で revoke する) */
export function createPhotoObjectUrl(
  canvas: HTMLCanvasElement
): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob));
      } else {
        reject(new Error("Failed to create a photo preview"));
      }
    }, "image/jpeg");
  });
}
