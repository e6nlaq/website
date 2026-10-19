"use client";

import { Inter } from "next/font/google";
import { SettingsIcon } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription as DrawerPanelDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import {
  formatClockDate,
  formatClockTime,
  formatUnixTime,
  type ClockTimeFormat,
} from "./format";

// 静的な定数・プレースホルダーはレンダーの外へ(rendering-hoist-jsx)
const PLACEHOLDER_TIME = "--:--:--";
const PLACEHOLDER_DATE = "----";
const PLACEHOLDER_UNIX = "--";

const STORAGE_KEY = "clock-settings:v1";
const WAKELOCK_SWITCH_ID = "clock-wakelock-switch";
const FONT_SELECT_ID = "clock-font-select";
const TIME_FORMAT_SELECT_ID = "clock-time-format-select";

// このページでだけ読み込むWebフォント(他ルートにはpreloadされない)。
// CSS変数は時計のコンテナにだけ付与する
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

/** 選べるフォント。保存値・グループ分けともにこの値を使う */
type ClockFont =
  | "line-seed"
  | "source-code-pro"
  | "inter"
  | "system-ui"
  | "monospace"
  | "serif"
  | "sans-serif";

const CLOCK_FONT_VALUES: readonly ClockFont[] = [
  "line-seed",
  "source-code-pro",
  "inter",
  "system-ui",
  "monospace",
  "serif",
  "sans-serif",
];

const FONT_ITEMS: readonly { value: ClockFont; label: string }[] = [
  { value: "line-seed", label: "LINE Seed" },
  { value: "source-code-pro", label: "Source Code Pro" },
  { value: "inter", label: "Inter" },
  { value: "system-ui", label: "system-ui" },
  { value: "monospace", label: "monospace" },
  { value: "serif", label: "serif" },
  { value: "sans-serif", label: "sans-serif" },
];

// ラベルはグループごとに分けて表示する(コンテンツ側だけを使う)
const WEB_FONT_ITEMS = FONT_ITEMS.slice(0, 3);
const SYSTEM_FONT_ITEMS = FONT_ITEMS.slice(3);

const TIME_FORMAT_ITEMS: readonly { value: ClockTimeFormat; label: string }[] =
  [
    { value: "hh", label: "HH:MM:SS" },
    { value: "h", label: "H:MM:SS" },
  ];

/** フォントの選択値 → CSSのfont-family */
const FONT_FAMILIES: Record<ClockFont, string> = {
  "line-seed": "var(--font-line-seed, sans-serif)",
  "source-code-pro": "var(--font-code)",
  inter: "var(--font-inter)",
  "system-ui": "system-ui",
  monospace: "monospace",
  serif: "serif",
  "sans-serif": "sans-serif",
};

type ClockSettings = {
  wakelock: boolean;
  font: ClockFont;
  timeFormat: ClockTimeFormat;
};

const DEFAULT_SETTINGS: ClockSettings = {
  wakelock: false,
  font: "source-code-pro",
  timeFormat: "hh",
};

// 対応判定はブラウザ名でなくAPIの有無で直接行う(HTTPSでない等の
// 環境ではAPI自体が生えていない)。SSRではfalseなので、Drawerが開いた
// 時点(クライアントのみ)で確定した値が使われる
const WAKE_LOCK_SUPPORTED =
  typeof navigator !== "undefined" && "wakeLock" in navigator;

/**
 * localStorage(clock-settings:v1)を外部ストアとして扱う。
 * 刻々変わる外部状態なのでsetStateでなくuseSyncExternalStoreで購読する。
 * スナップショットの同一性のため、生文字列が変わらない限り解析結果を再利用する
 */
const settingsStore = (() => {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cached = DEFAULT_SETTINGS;

  const parse = (raw: string): ClockSettings => {
    try {
      const saved = JSON.parse(raw) as Partial<ClockSettings>;
      return {
        wakelock: saved.wakelock === true,
        font:
          saved.font !== undefined && CLOCK_FONT_VALUES.includes(saved.font)
            ? saved.font
            : DEFAULT_SETTINGS.font,
        timeFormat: saved.timeFormat === "h" ? "h" : "hh",
      };
    } catch {
      // 壊れた保存データは無視する
      return DEFAULT_SETTINGS;
    }
  };

  const read = (): ClockSettings => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cached = raw === null ? DEFAULT_SETTINGS : parse(raw);
    }
    return cached;
  };

  /** 他の設定を壊さないよう、既存値とマージして書き込む */
  const update = (patch: Partial<ClockSettings>) => {
    const next = { ...read(), ...patch };
    const raw = JSON.stringify(next);
    try {
      localStorage.setItem(STORAGE_KEY, raw);
    } catch {
      // プライベートブラウジング等で書き込めない場合は無視
    }
    cachedRaw = raw;
    cached = next;
    for (const listener of listeners) listener();
  };

  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      // 別タブでの変更も反映する(localStorageのstorageイベント)
      const onStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== STORAGE_KEY) return;
        listener();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    get: read,
    getServer: (): ClockSettings => DEFAULT_SETTINGS,
    update,
  };
})();

// クライアントのみで確定する値のため、SSRではプレースホルダーを描画する
function subscribeToClock(onStoreChange: () => void): () => void {
  let interval: ReturnType<typeof setInterval> | undefined;
  // 次の秒境界に合わせて初回刻みし、以降は1秒毎に更新
  const timeout = setTimeout(
    () => {
      onStoreChange();
      interval = setInterval(onStoreChange, 1000);
    },
    1000 - (Date.now() % 1000)
  );
  // バックグラウンド中のタイマー抑制対策として、復帰時に即時同期
  const onVisible = () => {
    if (document.visibilityState === "visible") onStoreChange();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearTimeout(timeout);
    if (interval !== undefined) clearInterval(interval);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/** 秒単位のUNIX時刻を購読する */
function useClockSeconds(): number {
  return useSyncExternalStore(
    subscribeToClock,
    () => Math.floor(Date.now() / 1000),
    // 0 は実在しない表示上のプレースホルダー扱い(SSR・hydration直後)
    () => 0
  );
}

/** md以上のブレークポイントかどうか。Drawerの向き(下 or 右)の切替に使う */
function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export default function Clock() {
  const seconds = useClockSeconds();
  const now = seconds === 0 ? null : new Date(seconds * 1000);

  const isDesktop = useIsDesktop();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settings = useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.get,
    settingsStore.getServer
  );
  const wakelockOn = settings.wakelock;
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  // ユーザー操作(Switch)に続く失敗だけを通知するための印
  const announceFailureRef = useRef(false);

  const handleWakelockChange = (checked: boolean) => {
    announceFailureRef.current = checked;
    settingsStore.update({ wakelock: checked });
  };

  // 設定がONの間、ロックを取得して維持する。タブの非表示でブラウザが
  // 自動解除するため、再表示時に再取得する(MDNの標準パターン)
  useEffect(() => {
    if (!WAKE_LOCK_SUPPORTED || !wakelockOn) return;
    let cancelled = false;
    let announceFailure = announceFailureRef.current;
    announceFailureRef.current = false;

    const acquire = async (announce: boolean) => {
      const sentinel = sentinelRef.current;
      if (sentinel !== null && !sentinel.released) return;
      try {
        const obtained = await navigator.wakeLock.request("screen");
        if (cancelled) {
          obtained.release().catch(() => {});
          return;
        }
        sentinelRef.current = obtained;
      } catch {
        if (cancelled || !announce) return;
        toast.error("スリープ防止を有効にできませんでした", {
          description: "しばらく待ってからもう一度お試しください",
        });
      }
    };

    void acquire(announceFailure);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void acquire(false);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [wakelockOn]);

  const fontFamily = FONT_FAMILIES[settings.font];

  return (
    <Drawer
      open={settingsOpen}
      onOpenChange={setSettingsOpen}
      // モバイルは下から、それ以外は右から(swipeDirectionが配置も決める)
      swipeDirection={isDesktop ? "right" : "down"}
      showSwipeHandle={!isDesktop}
    >
      <div
        className={`${inter.variable} flex flex-col items-center gap-y-3 py-10`}
      >
        <p
          className="text-sm font-medium text-muted-foreground tabular-nums"
          style={{ fontFamily }}
        >
          {now === null ? PLACEHOLDER_DATE : formatClockDate(now)}
        </p>
        <p
          className="text-6xl font-bold tabular-nums tracking-widest"
          role="timer"
          style={{ fontFamily }}
        >
          {now === null
            ? PLACEHOLDER_TIME
            : formatClockTime(now, settings.timeFormat)}
        </p>
        <Tooltip>
          <TooltipTrigger
            render={
              <p
                className="text-sm font-medium text-muted-foreground tabular-nums"
                data-testid="unix-time"
                style={{ fontFamily }}
              >
                {now === null ? PLACEHOLDER_UNIX : formatUnixTime(now)}
              </p>
            }
          />
          <TooltipContent side="bottom">UNIX秒</TooltipContent>
        </Tooltip>
        <div className="flex w-full items-center justify-end">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label="設定"
                  onClick={() => setSettingsOpen(true)}
                />
              }
            >
              <SettingsIcon aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>設定</TooltipContent>
          </Tooltip>
        </div>
      </div>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>設定</DrawerTitle>
          <DrawerPanelDescription>
            時計の表示と動作に関する設定です。
          </DrawerPanelDescription>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <FieldGroup>
            <FieldSet>
              <FieldLegend>画面</FieldLegend>

              <FieldLabel htmlFor={WAKELOCK_SWITCH_ID}>
                <Field
                  orientation="horizontal"
                  data-disabled={!WAKE_LOCK_SUPPORTED}
                >
                  <FieldContent>
                    <FieldTitle>スリープを防止する</FieldTitle>
                    <FieldDescription>
                      {WAKE_LOCK_SUPPORTED
                        ? "このタブを開いている間、画面が自動でスリープしなくなります。バッテリーを多く消費します。"
                        : "お使いのブラウザはスリープ防止に対応していません"}
                    </FieldDescription>
                  </FieldContent>
                  <Switch
                    id={WAKELOCK_SWITCH_ID}
                    checked={wakelockOn}
                    onCheckedChange={handleWakelockChange}
                    disabled={!WAKE_LOCK_SUPPORTED}
                  />
                </Field>
              </FieldLabel>
            </FieldSet>

            <FieldSet>
              <FieldLegend>外観</FieldLegend>

              <Field>
                <FieldLabel htmlFor={FONT_SELECT_ID}>フォント</FieldLabel>
                <Select
                  id={FONT_SELECT_ID}
                  items={FONT_ITEMS}
                  value={settings.font}
                  onValueChange={(value) => {
                    if (value !== null) {
                      settingsStore.update({ font: value });
                    }
                  }}
                >
                  <SelectTrigger id={FONT_SELECT_ID}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Webフォント</SelectLabel>
                      {WEB_FONT_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>システム</SelectLabel>
                      {SYSTEM_FONT_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  時計のフォントを変更できます。時計以外のフォントは変更されません。
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor={TIME_FORMAT_SELECT_ID}>
                  時間形式
                </FieldLabel>
                <Select
                  id={TIME_FORMAT_SELECT_ID}
                  items={TIME_FORMAT_ITEMS}
                  value={settings.timeFormat}
                  onValueChange={(value) => {
                    if (value !== null) {
                      settingsStore.update({ timeFormat: value });
                    }
                  }}
                >
                  <SelectTrigger id={TIME_FORMAT_SELECT_ID}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {TIME_FORMAT_ITEMS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldSet>
          </FieldGroup>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
