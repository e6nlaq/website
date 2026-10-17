import jsQR, { type QRCode } from "jsqr";

/** 読み取りに使う画像の最大辺(px)。これを超える画像は縮小される */
const DECODE_MAX_DIM = 1600;
/** プレビュー画像の最大辺(px) */
const PREVIEW_MAX_DIM = 480;
/** 1辺がこの値(px)未満の画像は拡大して読み取りを試す */
const UPSCALE_THRESHOLD = 200;
/** さらに試す拡大率 */
const UPSCALE_FACTORS = [2, 3, 4] as const;
/** スクリーンショットなどの再サンプリングされた画像に備えて試す相対サイズ */
const RELATIVE_SIZES = [1, 0.5, 0.25] as const;
/** jsQRが失敗したときに試す二値化のしきい値 */
const THRESHOLD_VALUES = [160, 128, 192] as const;

export interface QrReadResult {
  /** QRコードが読み取れたかどうか */
  found: boolean;
  /** QRコードのデータ */
  data: string;
  /** QRコードのバージョン(読み取れない場合は0) */
  version: number;
  /** プレビュー用のDataURL */
  preview: string;
  /** プレビュー画像の幅(px) */
  previewWidth: number;
  /** プレビュー画像の高さ(px) */
  previewHeight: number;
}

interface Decoded {
  data: string;
  version: number;
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
): { canvas: HTMLCanvasElement; imageData: ImageData } {
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
  return { canvas, imageData: context.getImageData(0, 0, width, height) };
}

/** 指定した輝度しきい値で画像を二値化する */
function binarizeImageData(imageData: ImageData, threshold: number): ImageData {
  const { width, height, data } = imageData;
  const binarized = new Uint8ClampedArray(data.length);
  for (let index = 0; index < data.length; index += 4) {
    const luma =
      0.299 * data[index]! +
      0.587 * data[index + 1]! +
      0.114 * data[index + 2]!;
    const value = luma < threshold ? 0 : 255;
    binarized[index] = value;
    binarized[index + 1] = value;
    binarized[index + 2] = value;
    binarized[index + 3] = 255;
  }
  return new ImageData(binarized, width, height);
}

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}

/** BarcodeDetector(一部のブラウザのみ)でQRコードを読み取る */
async function decodeWithBarcodeDetector(
  source: CanvasImageSource
): Promise<string | null> {
  const Detector = (
    globalThis as {
      BarcodeDetector?: new (options?: {
        formats?: string[];
      }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
  if (!Detector) return null;
  try {
    const detector = new Detector({ formats: ["qr_code"] });
    const codes = await detector.detect(source);
    return codes[0]?.rawValue ?? null;
  } catch {
    return null;
  }
}

/** zxing-wasm(遅延読み込み)でQRコードを読み取る。最も頑健な最後の手段 */
async function decodeWithZXing(imageData: ImageData): Promise<Decoded | null> {
  try {
    const { readBarcodes, prepareZXingModule } =
      await import("zxing-wasm/reader");
    // wasmはpublicディレクトリに置いて自己ホストする(既定ではCDNへfetchされる)
    prepareZXingModule({
      overrides: {
        locateFile: (path: string, prefix = "") =>
          path.endsWith(".wasm") ? `/${path}` : `${prefix}${path}`,
      },
    });
    const results = await readBarcodes(imageData, {
      tryHarder: true,
      tryRotate: true,
      tryInvert: true,
      formats: ["QRCode"],
    });
    const text = results[0]?.text;
    return text ? { data: text, version: 0 } : null;
  } catch {
    return null;
  }
}

/**
 * 画像(Blob)からQRコードを読み取る。
 *
 * - 画像はすべてブラウザ内(canvas)で処理され、送信はされない
 * - jsQRを等倍・縮小・拡大・二値化のパターンで試し、
 *   それでも読み取れない場合はBarcodeDetectorやzxing-wasmにフォールバックする
 * - 透過画像は白背景に合成したうえで読み取る
 */
export async function readQrFromBlob(blob: Blob): Promise<QrReadResult> {
  const bitmap = await createImageBitmap(blob);
  try {
    const base = getScaledSize(bitmap.width, bitmap.height, DECODE_MAX_DIM);
    const sizes = new Map<string, { width: number; height: number }>();
    const addSize = (width: number, height: number) => {
      if (width < 40 || height < 40) return;
      sizes.set(`${width}x${height}`, { width, height });
    };
    for (const relative of RELATIVE_SIZES) {
      addSize(
        Math.round(base.width * relative),
        Math.round(base.height * relative)
      );
    }
    if (Math.min(base.width, base.height) < UPSCALE_THRESHOLD) {
      for (const factor of UPSCALE_FACTORS) {
        addSize(base.width * factor, base.height * factor);
      }
    }

    let decoded: QRCode | null = null;
    let baseImageData: ImageData | null = null;
    for (const { width, height } of sizes.values()) {
      const { imageData } = drawCanvas(bitmap, width, height);
      if (!baseImageData) {
        baseImageData = imageData;
      }
      decoded = jsQR(imageData.data, width, height, {
        inversionAttempts: "attemptBoth",
      });
      if (decoded) {
        break;
      }
    }

    // jsQRのブロック二値化が苦手な画像のため、全体二値化でも試す
    if (!decoded && baseImageData) {
      for (const threshold of THRESHOLD_VALUES) {
        const binarized = binarizeImageData(baseImageData, threshold);
        decoded = jsQR(binarized.data, binarized.width, binarized.height, {
          inversionAttempts: "attemptBoth",
        });
        if (decoded) {
          break;
        }
      }
    }

    let result: Decoded | null = decoded
      ? { data: decoded.data, version: decoded.version }
      : null;

    if (!result) {
      const detected = await decodeWithBarcodeDetector(bitmap);
      if (detected) {
        result = { data: detected, version: 0 };
      }
    }

    if (!result && baseImageData) {
      result = await decodeWithZXing(baseImageData);
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
      found: result !== null,
      data: result?.data ?? "",
      version: result?.version ?? 0,
      preview: previewCanvas.toDataURL("image/png"),
      previewWidth: previewSize.width,
      previewHeight: previewSize.height,
    };
  } finally {
    bitmap.close();
  }
}
