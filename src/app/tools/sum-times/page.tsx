"use client";

import { ClipboardCopyIcon } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { evaluateSumTimes } from "./logic";

const INPUT_ID = "sum-times-input";
const SAVE_SWITCH_ID = "sum-times-save-switch";
const INPUT_STORAGE_KEY = "sum-times:input:v1";
const SAVE_STORAGE_KEY = "sum-times:save-enabled:v1";

// 静的な値はレンダーの外へ
const PLACEHOLDER = "1:30\n0:45\n2:15";
const PLACEHOLDER_TOTAL = "--:--";
const MAX_VISIBLE_ERRORS = 8;

// ハイドレーション完了前は保存値を使わず、SSRと同じ表示にする
const subscribeToNothing = () => () => {};
const getHydrated = () => true;
const getHydratedOnServer = () => false;

function readSaveEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SAVE_STORAGE_KEY) !== "false";
  } catch {
    return false;
  }
}

function readSavedText(): string {
  if (typeof window === "undefined") return "";
  try {
    if (!readSaveEnabled()) return "";
    return localStorage.getItem(INPUT_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function SumTimes() {
  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    getHydrated,
    getHydratedOnServer
  );
  const [text, setText] = useState(readSavedText);
  const [saveEnabled, setSaveEnabled] = useState(readSaveEnabled);

  // ハイドレーション前はサーバーと同じ空入力として扱う
  const activeText = hydrated ? text : "";
  const result = useMemo(() => evaluateSumTimes(activeText), [activeText]);
  const errors = result.kind === "invalid" ? result.errors : [];
  const visibleErrors = errors.slice(0, MAX_VISIBLE_ERRORS);
  const hasInvalidInput = errors.length > 0;

  // ハイドレーション後だけ、スイッチの状態と入力を保存する
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SAVE_STORAGE_KEY, String(saveEnabled));
      if (!saveEnabled || text === "") {
        localStorage.removeItem(INPUT_STORAGE_KEY);
      } else {
        localStorage.setItem(INPUT_STORAGE_KEY, text);
      }
    } catch {
      // 容量超過やプライベートブラウジングでは保存しない
    }
  }, [hydrated, saveEnabled, text]);

  const handleReset = () => {
    setText("");
    try {
      localStorage.removeItem(INPUT_STORAGE_KEY);
    } catch {
      // 保存できない環境では何もしない
    }
    toast.success("リセットしました");
  };

  const copyTotal = async () => {
    if (result.kind !== "ok") return;
    try {
      await navigator.clipboard.writeText(result.formatted);
      toast.success("合計をコピーしました");
    } catch {
      toast.error("合計をコピーできませんでした", {
        description: "ブラウザの権限を確認してください",
      });
    }
  };

  return (
    <div className="flex max-w-full flex-col items-center justify-center gap-y-8">
      <ToolCard
        title="Sum Times"
        description="HH:MM形式の時間を1行ずつ入力すると、合計を計算します。"
        onReset={handleReset}
      >
        <FieldGroup>
          <Field data-invalid={hasInvalidInput}>
            <FieldLabel htmlFor={INPUT_ID}>時間</FieldLabel>
            <Textarea
              id={INPUT_ID}
              value={hydrated ? text : ""}
              onChange={(event) => setText(event.target.value)}
              placeholder={PLACEHOLDER}
              className="min-h-40 font-code"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={hasInvalidInput || undefined}
            />
            <FieldDescription className="text-pretty">
              1行に1つ、H:MM または HH:MM
              で入力してください。空行は無視され、全角数字も使用できます。
            </FieldDescription>
            {hasInvalidInput && (
              <FieldError>
                <ul className="ml-4 flex list-disc flex-col gap-1">
                  {visibleErrors.map((error) => (
                    <li key={error.lineNumber}>{error.message}</li>
                  ))}
                  {errors.length > visibleErrors.length && (
                    <li>
                      ほか {errors.length - visibleErrors.length}{" "}
                      行に誤りがあります
                    </li>
                  )}
                </ul>
              </FieldError>
            )}
          </Field>

          <FieldLabel htmlFor={SAVE_SWITCH_ID}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>入力をこの端末に保存する</FieldTitle>
                <FieldDescription>
                  このブラウザにのみ保存されます。オフにすると保存済みの入力も削除されます。
                </FieldDescription>
              </FieldContent>
              <Switch
                id={SAVE_SWITCH_ID}
                checked={hydrated ? saveEnabled : true}
                onCheckedChange={setSaveEnabled}
              />
            </Field>
          </FieldLabel>
        </FieldGroup>
      </ToolCard>

      <Card className="w-2xl max-w-full">
        <CardHeader>
          <CardTitle>合計</CardTitle>
          <CardDescription>
            {result.kind === "ok"
              ? `${result.count}件の合計`
              : result.kind === "invalid"
                ? "入力に誤りがあるため計算できません"
                : "HH:MM形式で入力すると、ここに合計が表示されます"}
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyTotal}
              disabled={result.kind !== "ok"}
            >
              <ClipboardCopyIcon data-icon="inline-start" />
              コピー
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1" aria-live="polite">
            <p className="text-5xl font-bold tabular-nums tracking-wider">
              {result.kind === "ok" ? result.formatted : PLACEHOLDER_TOTAL}
            </p>
            {result.kind === "ok" && (
              <p className="text-sm text-muted-foreground">
                合計 {result.totalMinutes.toLocaleString("ja-JP")} 分
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
