"use client";

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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { formatClockDate, formatClockTime, formatUnixTime } from "./format";

// 静的な定数・プレースホルダーはレンダーの外へ(rendering-hoist-jsx)
const PLACEHOLDER_TIME = "--:--:--";
const PLACEHOLDER_DATE = "----";
const PLACEHOLDER_UNIX = "--";

const STORAGE_KEY = "clock-settings:v1";
const WAKELOCK_SWITCH_ID = "clock-wakelock-switch";

// 対応判定はブラウザ名でなくAPIの有無で直接行う(HTTPSでない等の
// 環境ではAPI自体が生えていない)。SSRではfalseなので、Drawerが開いた
// 時点(クライアントのみ)で確定した値が使われる
const WAKE_LOCK_SUPPORTED =
  typeof navigator !== "undefined" && "wakeLock" in navigator;

/**
 * localStorage(clock-settings:v1)を外部ストアとして扱う。
 * 刻々変わる外部状態なのでsetStateでなくuseSyncExternalStoreで購読する
 */
const settingsStore = (() => {
  const listeners = new Set<() => void>();
  const readWakelock = (): boolean => {
    if (typeof window === "undefined") return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === null) return false;
      const parsed = JSON.parse(saved) as Partial<{ wakelock: boolean }>;
      return parsed.wakelock === true;
    } catch {
      // 壊れた保存データは無視する
      return false;
    }
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
    getWakelock: readWakelock,
    getServerWakelock: (): boolean => false,
    setWakelock(value: boolean) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ wakelock: value }));
      } catch {
        // プライベートブラウジング等で書き込めない場合は無視
      }
      for (const listener of listeners) listener();
    },
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
  const wakelockOn = useSyncExternalStore(
    settingsStore.subscribe,
    settingsStore.getWakelock,
    settingsStore.getServerWakelock
  );
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  // ユーザー操作(Switch)に続く失敗だけを通知するための印
  const announceFailureRef = useRef(false);

  const handleWakelockChange = (checked: boolean) => {
    announceFailureRef.current = checked;
    settingsStore.setWakelock(checked);
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

  return (
    <Drawer
      open={settingsOpen}
      onOpenChange={setSettingsOpen}
      // モバイルは下から、それ以外は右から(swipeDirectionが配置も決める)
      swipeDirection={isDesktop ? "right" : "down"}
      showSwipeHandle={!isDesktop}
    >
      <div className="flex flex-col items-center gap-y-3 py-10">
        <p className="text-sm font-medium font-code text-muted-foreground tabular-nums">
          {now === null ? PLACEHOLDER_DATE : formatClockDate(now)}
        </p>
        <p
          className="text-6xl font-bold font-code tabular-nums tracking-widest"
          role="timer"
        >
          {now === null ? PLACEHOLDER_TIME : formatClockTime(now)}
        </p>
        <Tooltip>
          <TooltipTrigger
            render={
              <p
                className="text-sm font-medium font-code text-muted-foreground tabular-nums"
                data-testid="unix-time"
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
            時計の動作に関する設定です。
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
          </FieldGroup>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
