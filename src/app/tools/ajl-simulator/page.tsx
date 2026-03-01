"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftToLine } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfirm } from "@/hooks/useConfirm";

const schema = z
  .object({
    currentScore: z.string().regex(/^\d+$/, "数値を入力してください"),
    lowestPerf: z
      .string()
      .regex(/^\d+$/, "数値を入力してください")
      .max(4, "4桁以下の数値を入力してください")
      .or(z.literal("")),
    minPerf: z
      .string()
      .regex(/^\d+$/, "数値を入力してください")
      .max(4, "4桁以下の数値を入力してください"),
    maxPerf: z
      .string()
      .regex(/^\d+$/, "数値を入力してください")
      .max(4, "4桁以下の数値を入力してください"),
  })
  .superRefine((data, ctx) => {
    const min = Number.parseInt(data.minPerf, 10);
    const max = Number.parseInt(data.maxPerf, 10);
    if (min > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "最小perfは最大perf以下にしてください",
        path: ["minPerf"],
      });
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "最大perfは最小perf以上にしてください",
        path: ["maxPerf"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

const RATE_COLORS = [
  { threshold: 0, color: "#808080", label: "灰" },
  { threshold: 400, color: "#804000", label: "茶" },
  { threshold: 800, color: "#008000", label: "緑" },
  { threshold: 1200, color: "#00C0C0", label: "水" },
  { threshold: 1600, color: "#0000FF", label: "青" },
  { threshold: 2000, color: "#C0C000", label: "黄" },
  { threshold: 2400, color: "#FF8000", label: "橙" },
  { threshold: 2800, color: "#FF0000", label: "赤" },
];

const chartConfig = {
  score: {
    label: "Score",
    color: "var(--chart-1)",
  },
  perf: {
    label: "Perf",
  },
} satisfies ChartConfig;

function calculateScore(
  perf: number,
  currentScore: number,
  lowestPerf: number | null
) {
  const perfScore = 1000 * 2 ** (perf / 400);
  if (lowestPerf === null) {
    return currentScore + perfScore;
  }
  const lowestPerfScore = 1000 * 2 ** (lowestPerf / 400);
  return currentScore + Math.max(0, perfScore - lowestPerfScore);
}

const STORAGE_KEY = "ajl-simulator-form";

export default function AjlSimulator() {
  const defaultValues: FormValues = {
    currentScore: "0",
    lowestPerf: "",
    minPerf: "0",
    maxPerf: "4000",
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "all",
  });

  const watchAll = form.watch();

  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        form.reset(parsed);
        form.trigger();
      } catch (e) {
        console.error("Failed to parse saved form state", e);
      }
    }
    setIsLoaded(true);
  }, [form]);

  // Save data to localStorage on changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchAll));
  }, [watchAll, isLoaded]);

  const chartData = useMemo(() => {
    const min = Number.parseInt(watchAll.minPerf ?? "0", 10) || 0;
    const max = Number.parseInt(watchAll.maxPerf ?? "4000", 10) || 4000;
    const currentScore = Number.parseFloat(watchAll.currentScore ?? "0") || 0;
    const lowestPerf =
      watchAll.lowestPerf === "" || watchAll.lowestPerf === undefined
        ? null
        : Number.parseInt(watchAll.lowestPerf, 10);

    if (min >= max) return [];

    const data = [];
    const step = Math.max(1, Math.floor((max - min) / 100));
    for (let x = min; x <= max; x += step) {
      data.push({
        perf: x,
        score: Math.floor(calculateScore(x, currentScore, lowestPerf)),
      });
    }
    // Ensure max is included
    if (data[data.length - 1].perf !== max) {
      data.push({
        perf: max,
        score: Math.floor(calculateScore(max, currentScore, lowestPerf)),
      });
    }
    return data;
  }, [watchAll]);

  const lowestPerfNum =
    watchAll.lowestPerf === "" || watchAll.lowestPerf === undefined
      ? null
      : Number.parseInt(watchAll.lowestPerf, 10);

  const confirm = useConfirm();

  return (
    <div className="flex flex-col items-center justify-center gap-y-8 w-full max-w-4xl mx-auto p-4">
      <ToolCard
        title="AJL Simulator"
        description="次回のパフォーマンスに応じたAJLスコアの推移をシミュレーションします。PCでの閲覧を推奨します。"
        className="w-full"
        footer={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                form.setValue("minPerf", defaultValues.minPerf, {
                  shouldValidate: true,
                });
                form.setValue("maxPerf", defaultValues.maxPerf, {
                  shouldValidate: true,
                });
              }}
            >
              最小/最大のみリセット
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (
                  await confirm({
                    title: "確認",
                    description:
                      "本当にリセットしますか? この操作は取り消しできません。",
                  })
                ) {
                  form.reset(defaultValues);
                }
              }}
            >
              すべてリセット
            </Button>
          </div>
        }
      >
        <form className="space-y-6">
          <FieldGroup>
            <Controller
              name="currentScore"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>現在の合計スコア</FieldLabel>
                  <Input {...field} id={field.name} type="number" step="any" />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="lowestPerf"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    スコア対象内の最低パフォーマンス
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    placeholder="参加回数がD回未満なら空欄にしてください"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="minPerf"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>グラフ最小perf</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          form.trigger("maxPerf");
                        }}
                        id={field.name}
                        type="number"
                      />
                      <InputGroupAddon align="inline-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InputGroupButton
                              onClick={() => {
                                const val = form.getValues("lowestPerf");
                                if (val) {
                                  form.setValue("minPerf", val, {
                                    shouldValidate: true,
                                  });
                                }
                              }}
                              disabled={!form.getValues("lowestPerf")}
                              size="icon-xs"
                            >
                              <ArrowLeftToLine />
                            </InputGroupButton>
                          </TooltipTrigger>
                          <TooltipContent>
                            対象内の最低パフォーマンスにセット
                          </TooltipContent>
                        </Tooltip>
                      </InputGroupAddon>
                    </InputGroup>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="maxPerf"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>グラフ最大perf</FieldLabel>
                    <Input
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        form.trigger("minPerf");
                      }}
                      id={field.name}
                      type="number"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </form>
      </ToolCard>

      {chartData.length > 0 && form.formState.isValid && (
        <ToolCard title="スコア推移グラフ" className="w-full">
          <ChartContainer
            config={chartConfig}
            className="min-h-[400px] w-full font-code"
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 20,
                right: 30,
                left: 40,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="perf"
                type="number"
                domain={[
                  Number.parseInt(watchAll.minPerf ?? "0", 10),
                  Number.parseInt(watchAll.maxPerf ?? "4000", 10),
                ]}
                tickCount={10}
                label={{
                  value: "Performance",
                  position: "bottom",
                  offset: 0,
                }}
              />
              <YAxis
                domain={["auto", "auto"]}
                label={{
                  value: "Score",
                  angle: -90,
                  position: "insideLeft",
                  offset: -20,
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="score"
                    labelFormatter={(_label, payload) => {
                      const perf = payload?.[0]?.payload?.perf;
                      return `Perf: ${perf}`;
                    }}
                  />
                }
              />

              {/* Rate Backgrounds */}
              {RATE_COLORS.map((color, index) => {
                const nextColor = RATE_COLORS[index + 1];
                const x1 = color.threshold;
                const x2 = nextColor ? nextColor.threshold : 10000;
                return (
                  <ReferenceArea
                    key={color.label}
                    x1={Math.max(
                      x1,
                      Number.parseInt(watchAll.minPerf ?? "0", 10)
                    )}
                    x2={Math.min(
                      x2,
                      Number.parseInt(watchAll.maxPerf ?? "4000", 10)
                    )}
                    fill={color.color}
                    fillOpacity={0.05}
                  />
                );
              })}

              <ReferenceLine
                y={Number.parseFloat(watchAll.currentScore ?? "0")}
                stroke="var(--muted-foreground)"
                strokeDasharray="3 3"
                label={{
                  value: "Current",
                  position: "insideBottomRight",
                  fill: "var(--muted-foreground)",
                  fontSize: 12,
                }}
              />
              {lowestPerfNum !== null && (
                <ReferenceLine
                  x={lowestPerfNum}
                  stroke="var(--destructive)"
                  strokeDasharray="3 3"
                  label={{
                    value: "Boundary",
                    position: "insideTopLeft",
                    fill: "var(--destructive)",
                    fontSize: 12,
                  }}
                />
              )}

              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-score)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </ToolCard>
      )}
    </div>
  );
}
