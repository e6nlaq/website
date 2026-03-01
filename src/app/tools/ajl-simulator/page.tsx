"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
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
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const schema = z.object({
    currentScore: z.string().regex(/^\d+$/, "数値を入力してください"),
    lowestPerf: z
        .string()
        .regex(/^\d*$/, "数値を入力してください")
        .optional()
        .or(z.literal("")),
    minPerf: z
        .string()
        .regex(/^\d+$/, "数値を入力してください")
        .max(4, "4桁以下の数値を入力してください"),
    maxPerf: z
        .string()
        .regex(/^\d+$/, "数値を入力してください")
        .max(4, "4桁以下の数値を入力してください"),
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
        mode: "onChange",
    });

    const watchAll = form.watch();

    const chartData = useMemo(() => {
        const min = Number.parseInt(watchAll.minPerf ?? "0", 10) || 0;
        const max = Number.parseInt(watchAll.maxPerf ?? "4000", 10) || 4000;
        const currentScore =
            Number.parseFloat(watchAll.currentScore ?? "0") || 0;
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
                score: Math.floor(
                    calculateScore(max, currentScore, lowestPerf)
                ),
            });
        }
        return data;
    }, [watchAll]);

    const lowestPerfNum =
        watchAll.lowestPerf === "" || watchAll.lowestPerf === undefined
            ? null
            : Number.parseInt(watchAll.lowestPerf, 10);

    return (
        <div className="flex flex-col items-center justify-center gap-y-8 w-full max-w-4xl mx-auto p-4">
            <ToolCard
                title="AJL Simulator"
                description="次回のパフォーマンスに応じたAJLスコアの推移をシミュレーションします。"
                onReset={() => form.reset(defaultValues)}
            >
                <form className="space-y-6">
                    <FieldGroup>
                        <Controller
                            name="currentScore"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid}>
                                    <FieldLabel htmlFor={field.name}>
                                        現在の合計スコア
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        type="number"
                                        step="any"
                                    />
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
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
                                        対象内の最低パフォーマンス (任意)
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        id={field.name}
                                        type="number"
                                        placeholder="空欄なら参加数D個未満"
                                    />
                                    <FieldDescription>
                                        上位D個の中で最も低いperf。空欄の場合は単純加算されます。
                                    </FieldDescription>
                                    {fieldState.invalid && (
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
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
                                        <FieldLabel htmlFor={field.name}>
                                            最小perf
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            type="number"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                name="maxPerf"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            最大perf
                                        </FieldLabel>
                                        <Input
                                            {...field}
                                            id={field.name}
                                            type="number"
                                        />
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
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
                        className="min-h-[400px] w-full"
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
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="perf"
                                type="number"
                                domain={[
                                    Number.parseInt(
                                        watchAll.minPerf ?? "0",
                                        10
                                    ),
                                    Number.parseInt(
                                        watchAll.maxPerf ?? "4000",
                                        10
                                    ),
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
                                    offset: -10,
                                }}
                            />
                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        nameKey="score"
                                        labelFormatter={(_label, payload) => {
                                            const perf =
                                                payload?.[0]?.payload?.perf;
                                            return `Perf: ${perf}`;
                                        }}
                                    />
                                }
                            />

                            {/* Rate Backgrounds */}
                            {RATE_COLORS.map((color, index) => {
                                const nextColor = RATE_COLORS[index + 1];
                                const x1 = color.threshold;
                                const x2 = nextColor
                                    ? nextColor.threshold
                                    : 10000;
                                return (
                                    <ReferenceArea
                                        key={color.label}
                                        x1={Math.max(
                                            x1,
                                            Number.parseInt(
                                                watchAll.minPerf ?? "0",
                                                10
                                            )
                                        )}
                                        x2={Math.min(
                                            x2,
                                            Number.parseInt(
                                                watchAll.maxPerf ?? "4000",
                                                10
                                            )
                                        )}
                                        fill={color.color}
                                        fillOpacity={0.05}
                                    />
                                );
                            })}

                            <ReferenceLine
                                y={Number.parseFloat(
                                    watchAll.currentScore ?? "0"
                                )}
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
