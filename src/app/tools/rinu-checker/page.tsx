"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardIcon,
  CircleCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ToolCard } from "@/components/tool-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  buildResultRows,
  buildResultText,
  buildUrlminApi,
  extractRinuCode,
  ipInfoUrl,
  parseUrlminResponse,
  type IpInfo,
  type RinuCheckResult,
  type UrlminResponse,
} from "./logic";

// 静的な値はレンダーの外へ
const URL_PLACEHOLDER = "https://rinu.jp/xxxxxx";
const INVALID_URL_MESSAGE = "rinu.cf または rinu.jp のURLを入力してください";
const FETCH_TIMEOUT_MS = 15_000;

const schema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URLを入力してください")
    .refine((url) => extractRinuCode(url) !== null, INVALID_URL_MESSAGE),
});

type Schema = z.infer<typeof schema>;

type CheckState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "done"; result: RinuCheckResult; ipInfo: IpInfo | null };

function DetailTable({
  result,
  ipInfo,
}: {
  result: RinuCheckResult;
  ipInfo: IpInfo | null;
}) {
  const rows = buildResultRows(result, ipInfo);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(
        buildResultText(result.tokutei, rows)
      );
      toast.success("結果をコピーしました");
    } catch {
      toast.error("結果のコピーに失敗しました", {
        description: "ブラウザの権限を確認してください",
      });
    }
  };

  return (
    <Card className="w-2xl max-w-full">
      <CardHeader>
        <CardTitle>結果</CardTitle>
        <CardDescription>APIの応答に基づく詳細情報です。</CardDescription>
        <CardAction>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyResult}
          >
            <ClipboardIcon data-icon="inline-start" />
            結果をコピー
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Alert variant={result.tokutei ? "destructive" : "default"}>
          {result.tokutei ? <TriangleAlertIcon /> : <CircleCheckIcon />}
          <AlertTitle>
            {result.tokutei ? "特定ツールあり" : "特定ツールなし"}
          </AlertTitle>
          <AlertDescription>
            {result.tokutei
              ? "このリンクは特定ツールへの遷移を含みます。"
              : "特定ツールは検出されませんでした。"}
          </AlertDescription>
        </Alert>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>項目</TableHead>
              <TableHead>値</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="align-top font-medium">
                  {row.label}
                </TableCell>
                <TableCell className="whitespace-normal break-all align-top">
                  {row.href !== undefined ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-3 hover:text-foreground"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>
            ※郵便番号・場所はIPからわかる情報であり、ほとんどの場合正確ではありません。参考程度にご利用ください。
          </TableCaption>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function RinuChecker() {
  const [state, setState] = useState<CheckState>({ phase: "idle" });
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { url: "" },
    mode: "onChange",
  });

  const check = async ({ url }: Schema) => {
    const code = extractRinuCode(url);
    if (code === null) return;

    setState({ phase: "loading" });

    try {
      const response = await fetch(buildUrlminApi(code), {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const outcome = parseUrlminResponse(
        (await response.json()) as UrlminResponse
      );

      if (outcome.kind === "error") {
        setState({ phase: "error", message: outcome.message });
        return;
      }

      // 郵便番号・ASNは追加照会。失敗しても本体の判定は表示する(旧版準拠)
      let ipInfo: IpInfo | null = null;
      if (outcome.result.creator.IPAddress !== "") {
        try {
          ipInfo = (await (
            await fetch(ipInfoUrl(outcome.result.creator.IPAddress), {
              signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            })
          ).json()) as IpInfo;
        } catch {
          ipInfo = null;
        }
      }

      setState({ phase: "done", result: outcome.result, ipInfo });
    } catch {
      setState({
        phase: "error",
        message:
          "チェック中にエラーが発生しました。時間をおいて、もう一度お試しください。",
      });
    }
  };

  const pasteAndCheck = async () => {
    if (state.phase === "loading") return;

    try {
      const text = (await navigator.clipboard.readText()).trim();
      form.setValue("url", text, { shouldValidate: false, shouldDirty: true });
      await form.handleSubmit(check)();
    } catch {
      toast.error("クリップボードの内容を取得できませんでした", {
        description: "ブラウザの権限を確認してください",
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-y-8 max-w-full">
      <ToolCard
        title="rinu.jp Checker 2"
        description={
          <>
            <p>
              特定ツールとして使われるrinu.jpのリンクを入力することで、実際に特定ツールが仕込まれているかチェックできます。
            </p>
          </>
        }
        formId="rinu-checker-form"
        actionLabel="チェック"
        loadingLabel="チェック中…"
        loading={state.phase === "loading"}
        onReset={() => {
          form.reset();
          setState({ phase: "idle" });
          toast.success("リセットしました");
        }}
      >
        <form
          id="rinu-checker-form"
          noValidate
          onSubmit={(e) => {
            form.handleSubmit(check)(e);
          }}
          className="md:min-w-96"
        >
          <FieldGroup>
            <Controller
              name="url"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>チェックするURL</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      {...field}
                      id={field.name}
                      type="url"
                      placeholder={URL_PLACEHOLDER}
                      spellCheck={false}
                      autoComplete="off"
                      aria-invalid={fieldState.invalid || undefined}
                    />
                    <InputGroupAddon align="inline-end">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <InputGroupButton
                              variant="outline"
                              aria-label="貼り付けてチェック"
                              onClick={pasteAndCheck}
                              disabled={state.phase === "loading"}
                            >
                              <ClipboardIcon />
                            </InputGroupButton>
                          }
                        />
                        <TooltipContent side="bottom">
                          貼り付けてチェック
                        </TooltipContent>
                      </Tooltip>
                    </InputGroupAddon>
                  </InputGroup>
                  <FieldDescription>
                    https:// は省略できます(rinu.jp/xxxxxx の形式も入力可能)。
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </ToolCard>

      <div className="flex flex-col items-center gap-y-8" aria-live="polite">
        {state.phase === "error" && (
          <Alert variant="destructive" className="w-2xl max-w-full">
            <TriangleAlertIcon />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
        {state.phase === "done" && (
          <DetailTable result={state.result} ipInfo={state.ipInfo} />
        )}
      </div>
    </div>
  );
}
