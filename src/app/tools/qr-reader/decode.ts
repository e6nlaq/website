import jsQR, { type QRCode } from "jsqr";

/** 読み取りに使う画像の最大辺(px)。これを超える画像は縮小される */
const DECODE_MAX_DIM = 1600;
/** プレビュー画像の最大辺(px) */
const PREVIEW_MAX_DIM = 480;
/** 1辺がこの値(px)未満の画像は拡大して読み取りを試す */
const UPSCALE_THRESHOLD = 200;
/** 読み取りに失敗したときに追加で試す拡大率 */
const UPSCALE_FACTORS = [2, 3, 4] as const;

export interface QrReadResult {
  /** QRコードが読み取れたかどうか */
  found: boolean;
  /** QRコードのデータ */
  data: string;
  /** QRコードのバージョン */
  version: number;
  /** プレビュー用のDataURL */
  preview: string;
  /** プレビュー画像の幅(px) */
  previewWidth: number;
  /** プレビュー画像の高さ(px) */
  previewHeight: number;
}

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

function drawCanvas(
  source: CanvasImageSource,
  width: number,
  height: number
): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas 2D context is unavailable");
  }
  // 透過画像でも読み取れるよう、白背景を塗ってから描画する
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(source, 0, 0, width, height);
  return { canvas, context };
}

/**
 * 画像(Blob)からQRコードを読み取る。
 *
 * - 画像はすべてブラウザ内(canvas)で処理され、送信はされない
 * - 大きい画像は縮小し、小さい画像は拡大して、複数パターンで読み取りを試す
 * - 透過画像は白背景に合成したうえで読み取る
 */
export async function readQrFromBlob(blob: Blob): Promise<QrReadResult> {
  const bitmap = await createImageBitmap(blob);
  try {
    const base = getScaledSize(bitmap.width, bitmap.height, DECODE_MAX_DIM);
    const attempts: Array<{ width: number; height: number }> = [base];
    if (Math.min(base.width, base.height) < UPSCALE_THRESHOLD) {
      for (const factor of UPSCALE_FACTORS) {
        attempts.push({
          width: base.width * factor,
          height: base.height * factor,
        });
      }
    }

    let decoded: QRCode | null = null;
    for (const { width, height } of attempts) {
      const { context } = drawCanvas(bitmap, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      decoded = jsQR(imageData.data, width, height, {
        inversionAttempts: "attemptBoth",
      });
      if (decoded) {
        break;
      }
    }

    const previewSize = getScaledSize(
      bitmap.width,
      bitmap.height,
      PREVIEW_MAX_DIM
    );
    const { canvas: previewCanvas } = drawCanvas(
      bitmap,
      previewSize.width,
      previewSize.height
    );
    return {
      found: decoded !== null,
      data: decoded?.data ?? "",
      version: decoded?.version ?? 0,
      preview: previewCanvas.toDataURL("image/png"),
      previewWidth: previewSize.width,
      previewHeight: previewSize.height,
    };
  } finally {
    bitmap.close();
  }
}
