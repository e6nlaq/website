"use client";

import {
  CameraIcon,
  CameraOffIcon,
  FileImageIcon,
  RotateCcwIcon,
  SaveIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { toast } from "sonner";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  CAMERA_ERROR_MESSAGES,
  captureFrame,
  classifyCameraError,
  isCameraSupported,
  listVideoInputs,
  nextCameraIndex,
  startCameraStream,
  type CameraIdealSize,
} from "@/lib/camera";
import { cn } from "@/lib/utils";
import {
  EXPORT_MAX_DIM,
  canvasToPngBlob,
  drawSheetOnCanvas,
  formatExportFileName,
} from "./export";
import { createPhotoObjectUrl, loadPhotoFromBlob } from "./photo";
import {
  SHEET_COLORS,
  readSettings,
  writeSettings,
  type SheetSettings,
} from "./settings";
import { DEFAULT_SHEET_RECT, type SheetRect } from "./sheet";
import { SheetViewer } from "./sheet-viewer";

const imageInputId = "red-sheet-image-input";
const colorInputId = "red-sheet-color-input";

/** 文字を読む用途のため、QR Reader より高い解像度を要求する */
const CAMERA_IDEAL_SIZE: CameraIdealSize = { width: 1920, height: 1080 };

interface Photo {
  url: string;
  width: number;
  height: number;
}

type CameraStatus = "starting" | "running" | "error";

// カメラの対応状況はサーバーでは分からないため、ハイドレーション後にだけ実際の値を返す
const subscribeToNothing = () => () => {};
const getCameraSupport = () => isCameraSupported();
const getCameraSupportOnServer = () => true;

// 設定 Drawer の出方を決める(モバイルは下から、デスクトップは右から)
const DESKTOP_QUERY = "(min-width: 768px)";
const subscribeDesktop = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const getDesktop = () => window.matchMedia(DESKTOP_QUERY).matches;
const getDesktopOnServer = () => false;

// 静的なコンテンツはレンダーの外へ(rendering-hoist-jsx)
const EMPTY_STATE = (
  <>
    <FileImageIcon className="size-10 text-muted-foreground" />
    <span className="text-sm">クリックして画像を選択</span>
    <span className="text-center text-xs text-muted-foreground">
      カメラで撮影するか、端末の画像を選んでください
    </span>
  </>
);

export default function RedSheet() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [rect, setRect] = useState<SheetRect>(DEFAULT_SHEET_RECT);
  const [sheetVisible, setSheetVisible] = useState(true);
  const [settings, setSettings] = useState<SheetSettings>(readSettings);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("starting");
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [cameraCount, setCameraCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const cameraSupported = useSyncExternalStore(
    subscribeToNothing,
    getCameraSupport,
    getCameraSupportOnServer
  );
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktop,
    getDesktopOnServer
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const devicesRef = useRef<MediaDeviceInfo[]>([]);
  const activeDeviceIdRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);
  const photoRef = useRef<{ canvas: HTMLCanvasElement; url: string } | null>(
    null
  );

  useEffect(() => {
    writeSettings(settings);
  }, [settings]);

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
        const stream = await startCameraStream(deviceId, CAMERA_IDEAL_SIZE);
        if (requestId !== requestIdRef.current) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        const activeDeviceId =
          stream.getVideoTracks()[0]?.getSettings().deviceId ?? null;
        activeDeviceIdRef.current = activeDeviceId;
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

  const startCamera = useCallback(() => {
    void openCamera(activeDeviceIdRef.current ?? undefined);
  }, [openCamera]);

  const stopCamera = useCallback(() => {
    closeCamera();
    toast.info("カメラを停止しました");
  }, [closeCamera]);

  const switchCamera = useCallback(() => {
    const devices = devicesRef.current;
    if (devices.length < 2) return;
    const current = devices.findIndex(
      (device) => device.deviceId === activeDeviceIdRef.current
    );
    const next = devices[nextCameraIndex(devices.length, current)];
    if (next) void openCamera(next.deviceId);
  }, [openCamera]);

  const exitFullscreen = useCallback(async () => {
    setFullscreen(false);
    setSettingsOpen(false);
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // すでに解除されている場合は無視する
      }
    }
  }, []);

  // ブラウザ側の操作(Esc など)で全画面が終わったときも表示を合わせる
  useEffect(() => {
    const onChange = () => {
      setFullscreen(document.fullscreenElement === viewerRef.current);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // 全画面のあいだは背景のスクロールを止める
  useEffect(() => {
    if (!fullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [fullscreen]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") void exitFullscreen();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [fullscreen, exitFullscreen]);

  useEffect(() => {
    if (!cameraOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") stopCamera();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cameraOpen, stopCamera]);

  // タブが隠れたらカメラを止め、最初の画面に戻す
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") closeCamera();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [closeCamera]);

  useEffect(() => {
    return () => {
      requestIdRef.current += 1;
      const stream = streamRef.current;
      streamRef.current = null;
      if (stream) {
        for (const track of stream.getTracks()) track.stop();
      }
      const current = photoRef.current;
      photoRef.current = null;
      if (current) URL.revokeObjectURL(current.url);
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
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

  const adoptPhoto = useCallback(
    async (blob: Blob) => {
      if (!blob.type.startsWith("image/")) {
        toast.error("画像以外のデータは読み込めません");
        return;
      }
      setLoading(true);
      try {
        const loaded = await loadPhotoFromBlob(blob);
        const url = await createPhotoObjectUrl(loaded.canvas);
        const previous = photoRef.current;
        photoRef.current = { canvas: loaded.canvas, url };
        if (previous) URL.revokeObjectURL(previous.url);
        setPhoto({ url, width: loaded.width, height: loaded.height });
        setRect(DEFAULT_SHEET_RECT);
        setSheetVisible(true);
        closeCamera();
        await exitFullscreen();
      } catch {
        toast.error("画像を読み込めませんでした", {
          description: "別の画像で再試行してください",
        });
      } finally {
        setLoading(false);
      }
    },
    [closeCamera, exitFullscreen]
  );

  const takePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      toast.error("カメラの映像を取得できませんでした", {
        description: "カメラを起動し直してから再試行してください",
      });
      return;
    }
    try {
      await adoptPhoto(await captureFrame(video, EXPORT_MAX_DIM));
    } catch {
      toast.error("写真を撮影できませんでした", {
        description: "カメラを起動し直してから再試行してください",
      });
    }
  }, [adoptPhoto]);

  const retake = useCallback(() => {
    void exitFullscreen();
    const current = photoRef.current;
    photoRef.current = null;
    if (current) URL.revokeObjectURL(current.url);
    setPhoto(null);
    setRect(DEFAULT_SHEET_RECT);
    setSheetVisible(true);
  }, [exitFullscreen]);

  const toggleFullscreen = useCallback(async () => {
    if (fullscreen) {
      await exitFullscreen();
      return;
    }
    const element = viewerRef.current;
    if (element && typeof element.requestFullscreen === "function") {
      try {
        await element.requestFullscreen();
        setFullscreen(true);
        return;
      } catch {
        // 全画面が使えない環境ではオーバーレイで代用する
      }
    }
    setFullscreen(true);
  }, [fullscreen, exitFullscreen]);

  const savePhoto = useCallback(async () => {
    const current = photoRef.current;
    if (!current || saving) return;
    setSaving(true);
    try {
      const composited = drawSheetOnCanvas(
        current.canvas,
        current.canvas.width,
        current.canvas.height,
        sheetVisible ? rect : null,
        settings.color,
        settings.opacity
      );
      const blob = await canvasToPngBlob(composited);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = formatExportFileName(new Date());
      link.style.display = "none";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      toast.success("PNGを保存しました");
    } catch {
      toast.error("PNGを保存できませんでした", {
        description: "ブラウザのダウンロード設定を確認してください",
      });
    } finally {
      setSaving(false);
    }
  }, [rect, saving, settings, sheetVisible]);

  const resetSheet = useCallback(() => {
    setRect(DEFAULT_SHEET_RECT);
    toast.success("シートの位置と大きさを戻しました");
  }, []);

  const changeOpacity = useCallback((value: number | readonly number[]) => {
    const percent = Array.isArray(value) ? value[0] : value;
    setSettings((current) => ({
      ...current,
      opacity: Math.min(1, Math.max(0, percent / 100)),
    }));
  }, []);

  const cameraActive =
    cameraStatus === "running" || cameraStatus === "starting";
  const cameraButtonLabel = !cameraOpen
    ? "カメラで撮影"
    : cameraActive
      ? "カメラを停止"
      : "再試行";
  const cameraStatusText =
    cameraStatus === "running"
      ? "撮影したいものを画面に収めてください"
      : cameraStatus === "starting"
        ? "カメラを起動中…"
        : (cameraMessage ?? "");
  const opacityPercent = Math.round(settings.opacity * 100);

  return (
    <div className="flex max-w-full flex-col items-center justify-center gap-y-8">
      {photo ? (
        <Card className="w-2xl max-w-full">
          <CardHeader>
            <CardTitle>ビューア</CardTitle>
            <CardDescription>
              シートをドラッグで移動、角のハンドルかピンチで大きさを変えられます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SheetViewer
              photo={photo}
              rect={rect}
              onRectChange={setRect}
              color={settings.color}
              opacity={settings.opacity}
              visible={sheetVisible}
              onVisibleChange={setSheetVisible}
              fullscreen={fullscreen}
              onToggleFullscreen={() => void toggleFullscreen()}
              onOpenSettings={() => setSettingsOpen(true)}
              containerRef={viewerRef}
            />
          </CardContent>
          <CardFooter className="flex-col items-start gap-y-4">
            <Field orientation="horizontal">
              <Button type="button" variant="outline" onClick={retake}>
                <RotateCcwIcon data-icon="inline-start" />
                撮り直す
              </Button>
              <Button type="button" onClick={savePhoto} disabled={saving}>
                {saving ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <SaveIcon data-icon="inline-start" />
                )}
                {saving ? "保存中…" : "PNGで保存"}
              </Button>
            </Field>
            <FieldDescription>
              保存されるのは写真の範囲だけです(シートが隠れているときは写真のみ)。
            </FieldDescription>
          </CardFooter>
        </Card>
      ) : (
        <ToolCard
          title="Red Sheet"
          description={
            <>
              <p>撮った写真に、動かせる赤シートを重ねます。</p>
              <p>
                写真はサーバーに送信されず、すべてブラウザ内で処理されます。
              </p>
            </>
          }
          footer={
            <div className="flex flex-col gap-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={
                    cameraOpen && cameraActive ? stopCamera : startCamera
                  }
                  disabled={loading || !cameraSupported}
                  aria-describedby={
                    cameraSupported ? undefined : "red-sheet-camera-unsupported"
                  }
                >
                  {cameraOpen && cameraActive ? (
                    <CameraOffIcon data-icon="inline-start" />
                  ) : (
                    <CameraIcon data-icon="inline-start" />
                  )}
                  {cameraButtonLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <FileImageIcon data-icon="inline-start" />
                  画像を選ぶ
                </Button>
                {loading && (
                  <span
                    className="flex items-center gap-x-2 text-sm text-muted-foreground"
                    aria-live="polite"
                  >
                    <Spinner />
                    読み込み中…
                  </span>
                )}
              </div>
              {!cameraSupported && (
                <p
                  id="red-sheet-camera-unsupported"
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
            <Field data-invalid={cameraOpen && cameraStatus === "error"}>
              {cameraOpen ? (
                <>
                  <FieldTitle>カメラで撮影</FieldTitle>
                  <div className="relative overflow-hidden rounded-4xl border-2 border-dashed border-border">
                    <video
                      ref={videoRef}
                      aria-label="カメラの映像"
                      autoPlay
                      muted
                      playsInline
                      className="max-h-80 w-full bg-black object-contain"
                    />
                    {cameraStatus === "starting" ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Spinner className="size-6 text-white" />
                      </div>
                    ) : null}
                    {cameraStatus === "error" ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                        <CameraOffIcon
                          className="size-8 text-white"
                          aria-hidden="true"
                        />
                      </div>
                    ) : null}
                  </div>
                  {cameraStatus === "running" ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        onClick={() => void takePhoto()}
                        disabled={loading}
                      >
                        <CameraIcon data-icon="inline-start" />
                        撮影する
                      </Button>
                      {cameraCount > 1 ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={switchCamera}
                        >
                          カメラを切り替え
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                  <FieldDescription
                    aria-live="polite"
                    className={cn(
                      cameraStatus === "error" && "text-destructive"
                    )}
                  >
                    {cameraStatusText}
                  </FieldDescription>
                </>
              ) : (
                <>
                  <FieldLabel htmlFor={imageInputId}>撮影する写真</FieldLabel>
                  <button
                    type="button"
                    id={imageInputId}
                    disabled={loading}
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
                      if (file) void adoptPhoto(file);
                    }}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-y-4 rounded-4xl border-2 border-dashed border-border p-8 outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      dragging ? "border-ring bg-muted" : "hover:bg-muted"
                    )}
                  >
                    {EMPTY_STATE}
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
                  if (file) void adoptPhoto(file);
                  event.target.value = "";
                }}
              />
            </Field>
          </FieldGroup>
        </ToolCard>
      )}

      {!photo && (
        <p className="text-center text-xs text-muted-foreground">
          撮影した写真は端末内だけで処理され、どこにも送信されません。
        </p>
      )}

      <Drawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        // モバイルは下から、それ以外は右から(swipeDirectionが配置も決める)
        swipeDirection={isDesktop ? "right" : "down"}
        showSwipeHandle={!isDesktop}
      >
        <DrawerContent container={fullscreen ? viewerRef : undefined}>
          <DrawerHeader>
            <DrawerTitle>シートの設定</DrawerTitle>
            <DrawerDescription>
              シートの色と不透明度を変えられます。
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto p-4">
            <FieldGroup>
              <FieldSet>
                <FieldLegend>色</FieldLegend>
                <Field>
                  <FieldTitle>プリセット</FieldTitle>
                  <ToggleGroup
                    value={[settings.color]}
                    onValueChange={(values) => {
                      const color = values[0];
                      if (!color) return;
                      setSettings((current) => ({ ...current, color }));
                    }}
                    aria-label="シートの色"
                  >
                    {SHEET_COLORS.map((preset) => (
                      <ToggleGroupItem
                        key={preset.value}
                        value={preset.value}
                        aria-label={preset.label}
                        className="size-9 min-w-9 rounded-full p-0 aria-pressed:ring-2 aria-pressed:ring-ring"
                      >
                        <span
                          aria-hidden="true"
                          className="size-5 rounded-full ring-1 ring-foreground/20"
                          style={{ backgroundColor: preset.value }}
                        />
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldDescription>
                    よく使う色をワンタップで選べます。
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor={colorInputId}>色を指定</FieldLabel>
                  <div className="flex items-center gap-x-3">
                    <div className="w-24">
                      <Input
                        id={colorInputId}
                        type="color"
                        value={settings.color}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            color: event.target.value,
                          }))
                        }
                        className="h-10 w-full cursor-pointer p-1"
                      />
                    </div>
                    <span className="font-mono text-sm text-muted-foreground uppercase tabular-nums">
                      {settings.color}
                    </span>
                  </div>
                  <FieldDescription>
                    好きな色を選ぶと、プリセットの選択は外れます。
                  </FieldDescription>
                </Field>
              </FieldSet>

              <FieldSet>
                <FieldLegend>不透明度</FieldLegend>
                <Field>
                  <Slider
                    aria-label="不透明度"
                    min={0}
                    max={100}
                    step={1}
                    value={[opacityPercent]}
                    onValueChange={changeOpacity}
                  />
                  <FieldDescription>
                    {`${opacityPercent}%（下げると下の文字が透けます）`}
                  </FieldDescription>
                </Field>
              </FieldSet>

              <FieldSet>
                <FieldLegend>配置</FieldLegend>
                <Field>
                  <Button type="button" variant="outline" onClick={resetSheet}>
                    <RotateCcwIcon data-icon="inline-start" />
                    位置と大きさを戻す
                  </Button>
                </Field>
              </FieldSet>
            </FieldGroup>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
