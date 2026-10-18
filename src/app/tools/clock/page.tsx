"use client";

import { useSyncExternalStore } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatClockDate, formatClockTime, formatUnixTime } from "./format";

// 静的なプレースホルダーはレンダーの外へ(rendering-hoist-jsx)
const PLACEHOLDER_TIME = "--:--:--";
const PLACEHOLDER_DATE = "----";
const PLACEHOLDER_UNIX = "--";

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

export default function Clock() {
  const seconds = useClockSeconds();
  const now = seconds === 0 ? null : new Date(seconds * 1000);

  return (
    <Card className="w-2xl max-w-full">
      <CardHeader>
        <CardTitle>Clock</CardTitle>
        <CardDescription>シンプルなデジタル時計です。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-y-3 py-10">
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
      </CardContent>
    </Card>
  );
}
