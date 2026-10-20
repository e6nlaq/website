"use client";

import {
  CameraIcon,
  CameraOffIcon,
  ClipboardIcon,
  CopyIcon,
  FileImageIcon,
  ScanLineIcon,
  SquareArrowOutUpRightIcon,
  SwitchCameraIcon,
} from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { ToolCard } from "@/components/tool-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { QrReadResult } from "./decode";
import { readQrFromBlob } from "./decode";
import {
  CAMERA_ERROR_MESSAGES,
  SCAN_INTERVAL_MS,
  captureFrame,
  classifyCameraError,
  createFrameScanner,
  isCameraSupported,
  listVideoInputs,
  nextCameraIndex,
  startCameraStream,
} from "./camera";

const imageInputId = "qr-reader-image-input";
const resultInputId = "qr-reader-result-input";
const URL_PATTERN = /^https?:\/\//i;

// カメラの対応状況はサーバーでは分からないため、ハイドレーション後にだけ実際の値を返す
const subscribeCameraSupport = () => () => {};
const getCameraSupport = () => isCameraSupported();
const getCameraSupportOnServer = () => true;

type CameraStatus = "starting" | "running" | "stopped" | "error";

interface Preview {
  src: string;
  width: number;
  height: number;
}

// 静的なコンテンツはレンダーの外へ(rendering-hoist-jsx)
const EMPTY_STATE = (
  <>
    <ScanLineIcon className="size-10 text-muted-foreground" />
    <span className="text-sm">クリックして画像を選択</span>
    <span className="text-center text-xs text-muted-foreground">
      コピーした画像を「Ctrl+V」で直接貼り付けることもできます
    </span>
  </>
);

const TRADEMARK_NOTICE = (
  <p className="text-center text-xs text-muted-foreground">
    「QRコード」は株式会社デンソーウェーブの登録商標です。
  </p>
);

export default function QrReader() {
  const [preview, setPreview] = useState<Preview | null>(null);
  const [result, setResult] = useState<QrReadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("starting");
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [cameraCount, setCameraCount] = useState(0);
  const [mirror, setMirror] = useState(false);
  const cameraSupported = useSyncExternalStore(
    subscribeCameraSupport,
    getCameraSupport,
    getCameraSupportOnServer
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);
  const activeDeviceIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);

  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      for (const track of stream.getTracks()) track.stop();
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  const closeCamera = useCallback(() => {
    requestIdRef.current += 1;
    stopStream();
    setCameraOpen(false);
    setCameraMessage(null);
  }, [stopStream]);

  const openCamera = useCallback(
    async (deviceId?: string) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setCameraOpen(true);
      setCameraStatus("starting");
      setCameraMessage(null);
      stopStream();
      try {
        const stream = await startCameraStream(deviceId);
        if (requestId !== requestIdRef.current) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        const settings = stream.getVideoTracks()[0]?.getSettings();
        activeDeviceIdRef.current = settings?.deviceId ?? null;
        setMirror(settings?.facingMode === "user");
        const devices = await listVideoInputs();
        if (requestId !== requestIdRef.current) return;
        devicesRef.current = devices;
        setCameraCount(devices.length);
        setCameraStatus("running");
      } catch (error) {
        if (requestId !== requestIdRef.current) return;
        stopStream();
        setCameraStatus("error");
        setCameraMessage(CAMERA_ERROR_MESSAGES[classifyCameraError(error)]);
      }
    },
    [stopStream]
  );

  const pauseCamera = useCallback(() => {
    if (!cameraOpen) return;
    requestIdRef.current += 1;
    stopStream();
    setCameraStatus("stopped");
    setCameraMessage("カメラを停止しました");
  }, [cameraOpen, stopStream]);

  const resumeCamera = useCallback(() => {
    void openCamera(activeDeviceIdRef.current ?? undefined);
  }, [openCamera]);

  const switchCamera = useCallback(() => {
    const devices = devicesRef.current;
    if (devices.length < 2) return;
    const current = devices.findIndex(
      (device) => device.deviceId === activeDeviceIdRef.current
    );
    const next = devices[nextCameraIndex(devices.length, current)];
    if (next) void openCamera(next.deviceId);
  }, [openCamera]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      const stream = streamRef.current;
      streamRef.current = null;
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
    };
  }, []);

  // カメラのストリームは、映像要素が描画されてから割り当てる
  useEffect(() => {
    if (!cameraOpen) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => {});
  }, [cameraOpen, cameraStatus]);

  const applyRead = useCallback((read: QrReadResult, fallbackData?: string) => {
    setPreview({
      src: read.preview,
      width: read.previewWidth,
      height: read.previewHeight,
    });
    if (read.found || fallbackData !== undefined) {
      setResult(
        read.found ? read : { ...read, found: true, data: fallbackData ?? "" }
      );
      toast.success("QRコードを読み取りました");
      return;
    }
    setResult(null);
    toast.error("QRコードが見つかりませんでした", {
      description: "別の画像でお試しください",
    });
  }, []);

  const handleBlob = useCallback(
    async (blob: Blob, fallbackData?: string) => {
      if (loadingRef.current) return;
      if (!blob.type.startsWith("image/")) {
        toast.error("画像以外のデータは読み取れません");
        return;
      }
      closeCamera();
      loadingRef.current = true;
      setLoading(true);
      try {
        applyRead(await readQrFromBlob(blob), fallbackData);
      } catch {
        toast.error("画像を読み込めませんでした");
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [applyRead, closeCamera]
  );

  // 連続スキャンで見つけたフレームを切り出し、通常の画像と同じ手順で読み取る
  const handleCameraHit = useCallback(
    async (video: HTMLVideoElement, data: string) => {
      try {
        await handleBlob(await captureFrame(video), data);
        return true;
      } catch {
        toast.error("カメラの映像を取得できませんでした", {
          description:
            "読み取りは自動で続きます。QRコードをカメラに向けたままお待ちください",
        });
        return false;
      }
    },
    [handleBlob]
  );

  useEffect(() => {
    if (!cameraOpen || cameraStatus !== "running") return;
    const scanner = createFrameScanner();
    let cancelled = false;
    let timer = 0;
    const tick = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const data = await scanner.scan(video);
        if (cancelled) return;
        if (data) {
          const handled = await handleCameraHit(video, data);
          if (handled) return;
        }
      }
      if (!cancelled) {
        timer = window.setTimeout(() => void tick(), SCAN_INTERVAL_MS);
      }
    };
    timer = window.setTimeout(() => void tick(), SCAN_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cameraOpen, cameraStatus, handleCameraHit]);

  // タブが隠れたらカメラを止め、戻ったときは利用者の操作で再開してもらう
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") pauseCamera();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [pauseCamera]);

  useEffect(() => {
    if (!cameraOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") pauseCamera();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cameraOpen, pauseCamera]);

  const reset = useCallback(() => {
    closeCamera();
    setPreview(null);
    setResult(null);
    toast.success("リセットしました");
  }, [closeCamera]);

  // ペースト(Ctrl+V)でクリップボードの画像を直接読み取る
  const handleBlobRef = useRef(handleBlob);
  useEffect(() => {
    handleBlobRef.current = handleBlob;
  }, [handleBlob]);
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const data = event.clipboardData;
      if (!data) return;
      // ファイルとしてコピーされた画像(エクスプローラ等)はclipboardData.filesで受け取る
      const imageFile = Array.from(data.files).find((candidate) =>
        candidate.type.startsWith("image/")
      );
      if (imageFile) {
        void handleBlobRef.current(imageFile);
        return;
      }
      // 画像データの直接ペースト(スクリーンショット等)はitemsで受け取る
      const item = Array.from(data.items).find((candidate) =>
        candidate.type.startsWith("image/")
      );
      if (!item) return;
      const file = item.getAsFile();
      if (file) void handleBlobRef.current(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const readFromClipboard = useCallback(() => {
    navigator.clipboard
      .read()
      .then((items) => {
        const item = items.find((candidate) =>
          candidate.types.some((type) => type.startsWith("image/"))
        );
        if (!item) {
          toast.error("クリップボードに画像がありません", {
            description:
              "画像ファイルをコピーした場合は「Ctrl+V」、ドラッグ&ドロップ、ファイル選択を利用してください",
          });
          return undefined;
        }
        const type = item.types.find((candidate) =>
          candidate.startsWith("image/")
        );
        if (!type) return undefined;
        return item.getType(type).then((blob) => handleBlob(blob));
      })
      .catch(() => {
        toast.error("クリップボードの内容を取得できませんでした", {
          description: "ブラウザの権限を確認してください",
        });
      });
  }, [handleBlob]);

  const copyResult = useCallback(() => {
    if (!result) return;
    navigator.clipboard
      .writeText(result.data)
      .then(() => toast.success("コピーしました"))
      .catch(() => {
        toast.error("コピーできませんでした", {
          description: "ブラウザの権限を確認してください",
        });
      });
  }, [result]);

  const isUrl = result ? URL_PATTERN.test(result.data) : false;
  const notFound = preview !== null && result === null && !loading;
  const cameraActive =
    cameraStatus === "running" || cameraStatus === "starting";
  const cameraButtonLabel = !cameraOpen
    ? "カメラで読み取る"
    : cameraActive
      ? "カメラを停止"
      : cameraStatus === "error"
        ? "再試行"
        : "カメラを再開";
  const cameraStatusText =
    cameraStatus === "running"
      ? "QRコードをカメラに向けてください"
      : cameraStatus === "starting"
        ? "カメラを起動中…"
        : (cameraMessage ?? "");

  return (
    <div className="flex max-w-full flex-col items-center justify-center gap-y-8">
      <ToolCard
        title="QR Reader"
        description={
          <>
            <p>画像やカメラからQRコードを読み取ります。</p>
            <p>画像はサーバーに送信されず、すべてブラウザ内で処理されます。</p>
          </>
        }
        onReset={reset}
        footer={
          <div className="flex flex-col gap-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
              >
                <FileImageIcon data-icon="inline-start" />
                ファイルを選択
              </Button>
              <Button
                variant="outline"
                onClick={readFromClipboard}
                disabled={loading}
              >
                <ClipboardIcon data-icon="inline-start" />
                クリップボードから読み取り
              </Button>
              <Button
                variant="outline"
                onClick={
                  cameraOpen && cameraActive ? pauseCamera : resumeCamera
                }
                disabled={loading || !cameraSupported}
                aria-describedby={
                  cameraSupported ? undefined : "qr-reader-camera-unsupported"
                }
              >
                {cameraOpen && cameraActive ? (
                  <CameraOffIcon data-icon="inline-start" />
                ) : (
                  <CameraIcon data-icon="inline-start" />
                )}
                {cameraButtonLabel}
              </Button>
              {loading && (
                <span
                  className="flex items-center gap-x-2 text-sm text-muted-foreground"
                  aria-live="polite"
                >
                  <Spinner />
                  読み取り中…
                </span>
              )}
            </div>
            {!cameraSupported && (
              <p
                id="qr-reader-camera-unsupported"
                className="text-sm text-muted-foreground"
              >
                このブラウザではカメラを利用できません。HTTPS
                のページで開いてください。
              </p>
            )}
          </div>
        }
      >
        <FieldGroup>
          <Field data-invalid={notFound}>
            {cameraOpen ? (
              <FieldTitle>カメラで読み取り</FieldTitle>
            ) : (
              <FieldLabel htmlFor={imageInputId}>読み取りたい画像</FieldLabel>
            )}
            {cameraOpen ? (
              <div className="flex w-full flex-col gap-y-3">
                <div className="relative overflow-hidden rounded-4xl border-2 border-dashed bg-black">
                  <video
                    ref={videoRef}
                    aria-label="カメラの映像"
                    autoPlay
                    muted
                    playsInline
                    className={cn(
                      "max-h-80 w-full bg-black object-contain",
                      mirror && "-scale-x-100"
                    )}
                  />
                  {cameraStatus === "starting" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Spinner className="size-6 text-white" />
                    </div>
                  ) : null}
                  {cameraStatus === "stopped" || cameraStatus === "error" ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                      <CameraOffIcon
                        className="size-8 text-white"
                        aria-hidden="true"
                      />
                    </div>
                  ) : null}
                </div>
                {cameraCount > 1 && cameraStatus === "running" ? (
                  <div>
                    <Button variant="outline" onClick={switchCamera}>
                      <SwitchCameraIcon data-icon="inline-start" />
                      カメラを切り替え
                    </Button>
                  </div>
                ) : null}
                <FieldDescription
                  aria-live="polite"
                  className={cn(cameraStatus === "error" && "text-destructive")}
                >
                  {cameraStatusText}
                </FieldDescription>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  id={imageInputId}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDragging(false);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) void handleBlob(file);
                  }}
                  className={cn(
                    "flex w-full flex-col items-center justify-center gap-y-4 rounded-4xl border-2 border-dashed p-8 outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    dragging ? "border-ring bg-muted" : "hover:bg-muted"
                  )}
                >
                  {preview ? (
                    <Image
                      src={preview.src}
                      alt="読み取るQRコードを含む画像"
                      width={preview.width}
                      height={preview.height}
                      unoptimized
                      className="max-h-48 w-auto rounded-2xl"
                    />
                  ) : (
                    EMPTY_STATE
                  )}
                </button>
                <FieldDescription>
                  ドラッグ&ドロップにも対応しています
                </FieldDescription>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleBlob(file);
                event.target.value = "";
              }}
            />
            {notFound && !cameraOpen && (
              <p className="text-sm text-destructive" aria-live="polite">
                この画像からQRコードを読み取れませんでした。鮮明な画像でお試しください。
              </p>
            )}
          </Field>
        </FieldGroup>
      </ToolCard>

      {result && (
        <Card className="w-2xl max-w-full">
          <CardHeader>
            <CardTitle>読み取り結果</CardTitle>
            {result.version > 0 && (
              <CardDescription>{`QRコード バージョン ${result.version}`}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={resultInputId}>
                  読み取ったデータ
                </FieldLabel>
                <Input id={resultInputId} value={result.data} readOnly />
              </Field>
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex-col items-start gap-y-4">
            <Field orientation="horizontal">
              <Button variant="outline" onClick={copyResult}>
                <CopyIcon data-icon="inline-start" />
                コピー
              </Button>
              {isUrl && (
                <a
                  className={cn(buttonVariants({ variant: "outline" }))}
                  href={result.data}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <SquareArrowOutUpRightIcon data-icon="inline-start" />
                  リンクを開く
                </a>
              )}
            </Field>
          </CardFooter>
        </Card>
      )}

      {TRADEMARK_NOTICE}
    </div>
  );
}
