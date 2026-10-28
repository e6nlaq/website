import jsQR from "jsqr";
import { getScaledSize } from "@/lib/image";

/**
 * 連続スキャンに使うフレームの最大辺(px)。
 * 画面内で小さいQRコードでもモジュールが潰れないよう、映像の解像度に近い値で走査する
 */
const SCAN_MAX_DIM = 1280;
/** 連続スキャンの間隔(ms) */
export const SCAN_INTERVAL_MS = 200;

interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

/** BarcodeDetector(対応ブラウザのみ)を準備する */
function createBarcodeDetector(): BarcodeDetectorLike | null {
  const Detector = (
    globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }
  ).BarcodeDetector;
  if (!Detector) return null;
  try {
    return new Detector({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

export interface FrameScanner {
  /** 映像の現在のフレームからQRコードを探す */
  scan(video: HTMLVideoElement): Promise<string | null>;
}

/**
 * カメラ映像を読み取るスキャナを作る。
 *
 * BarcodeDetector があれば優先し、読み取れない場合は縮小したフレームを
 * jsQR で解析する(連続実行するため等倍・二値化などの多段処理は行わない)。
 */
export function createFrameScanner(): FrameScanner {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const detector = createBarcodeDetector();

  return {
    async scan(video) {
      if (video.readyState < 2 || video.videoWidth === 0) return null;

      if (detector) {
        try {
          const [code] = await detector.detect(video);
          if (code?.rawValue) return code.rawValue;
        } catch {
          // 検出できなくても jsQR で読み取れるため、そのまま続行する
        }
      }

      if (!context) return null;
      const size = getScaledSize(
        video.videoWidth,
        video.videoHeight,
        SCAN_MAX_DIM
      );
      if (canvas.width !== size.width || canvas.height !== size.height) {
        canvas.width = size.width;
        canvas.height = size.height;
      }
      context.drawImage(video, 0, 0, size.width, size.height);
      const frame = context.getImageData(0, 0, size.width, size.height);
      const decoded = jsQR(frame.data, frame.width, frame.height, {
        inversionAttempts: "dontInvert",
      });
      return decoded?.data ?? null;
    },
  };
}
