import jsQR from "jsqr";
import { getScaledSize } from "./decode";

/** 連続スキャンに使うフレームの最大辺(px) */
const SCAN_MAX_DIM = 640;
/** 読み取り用に切り出すフレームの最大辺(px) */
const CAPTURE_MAX_DIM = 1600;
/** 連続スキャンの間隔(ms) */
export const SCAN_INTERVAL_MS = 200;

export type CameraErrorKind = "denied" | "not-found" | "in-use" | "unknown";

/** getUserMedia の失敗を、利用者に伝える種類へ分類する */
export function classifyCameraError(error: unknown): CameraErrorKind {
  const name =
    typeof error === "object" && error !== null && "name" in error
      ? String((error as { name: unknown }).name)
      : "";
  switch (name) {
    case "NotAllowedError":
    case "SecurityError":
      return "denied";
    case "NotFoundError":
    case "OverconstrainedError":
      return "not-found";
    case "NotReadableError":
    case "AbortError":
      return "in-use";
    default:
      return "unknown";
  }
}

export const CAMERA_ERROR_MESSAGES: Record<CameraErrorKind, string> = {
  denied:
    "カメラの使用が許可されていません。ブラウザの設定でカメラを許可してから、再試行してください。",
  "not-found":
    "利用できるカメラが見つかりませんでした。カメラを接続してから、再試行してください。",
  "in-use":
    "カメラを起動できませんでした。ほかのアプリがカメラを使用している場合は、そのアプリを終了してから再試行してください。",
  unknown:
    "カメラを起動できませんでした。ページを再読み込みしてから、再試行してください。",
};

/** カメラを利用できる環境か(HTTPS または localhost) */
export function isCameraSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices?.getUserMedia === "function"
  );
}

/** 次に使うカメラの位置を返す。カメラがない場合は -1 */
export function nextCameraIndex(count: number, current: number): number {
  if (count <= 0) return -1;
  return (current + 1) % count;
}

/** 利用できるカメラの一覧を返す */
export async function listVideoInputs(): Promise<MediaDeviceInfo[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

/**
 * カメラを起動する。
 *
 * - 指定がなければ背面カメラを優先する
 * - 指定したカメラが使えない場合は背面カメラで再試行する
 * - 音声は要求しない
 */
export async function startCameraStream(
  deviceId?: string
): Promise<MediaStream> {
  const request = (video: MediaTrackConstraints) =>
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...video,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
  try {
    return await request(
      deviceId
        ? { deviceId: { exact: deviceId } }
        : { facingMode: "environment" }
    );
  } catch (error) {
    if (deviceId && classifyCameraError(error) === "not-found") {
      return request({ facingMode: "environment" });
    }
    throw error;
  }
}

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

/** 映像の現在のフレームを画像として切り出す */
export function captureFrame(video: HTMLVideoElement): Promise<Blob> {
  const size = getScaledSize(
    video.videoWidth,
    video.videoHeight,
    CAPTURE_MAX_DIM
  );
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) {
    return Promise.reject(new Error("Canvas 2D context is unavailable"));
  }
  context.drawImage(video, 0, 0, size.width, size.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to capture the camera frame"));
      }
    }, "image/png");
  });
}
