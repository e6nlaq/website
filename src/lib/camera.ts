import { getScaledSize } from "@/lib/image";

/** カメラに要求する解像度(端末が対応していない場合は近い値になる) */
export interface CameraIdealSize {
  width: number;
  height: number;
}

export const DEFAULT_CAMERA_IDEAL_SIZE: CameraIdealSize = {
  width: 1280,
  height: 720,
};

/** 切り出す静止画の既定の最大辺(px) */
export const CAPTURE_MAX_DIM = 1600;

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
  deviceId?: string,
  ideal: CameraIdealSize = DEFAULT_CAMERA_IDEAL_SIZE
): Promise<MediaStream> {
  const request = (video: MediaTrackConstraints) =>
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        ...video,
        width: { ideal: ideal.width },
        height: { ideal: ideal.height },
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

/** 映像の現在のフレームを画像として切り出す */
export function captureFrame(
  video: HTMLVideoElement,
  maxDim = CAPTURE_MAX_DIM
): Promise<Blob> {
  const size = getScaledSize(video.videoWidth, video.videoHeight, maxDim);
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
