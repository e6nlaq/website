"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Source_Code_Pro } from "next/font/google";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { solve } from "wasm/wasm";
import { z } from "zod";
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
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfirm } from "@/hooks/useConfirm";
import { cn } from "@/lib/utils";

const schema = z
    .object({
        val: z
            .string()
            .nonempty("値を入力してください")
            .refine((vals) => {
                return vals.split("\n").every((val) => /^\d*$/.test(val));
            }, "数値を入力してください")
            .refine((data) => {
                try {
                    const vals = data.split("\n").filter((val) => val !== "");
                    return vals.every((val) => val.length <= 30);
                } catch {
                    return false;
                }
            }, "valは30桁以内で入力してください"),
        mod: z
            .string()
            .regex(/^[0-9]+$/, "数値を入力してください")
            .max(30, "30桁以内で入力してください"),
        limit: z
            .string()
            .regex(/^[0-9]+$/, "数値を入力してください")
            .max(30, "30桁以内で入力してください"),
        type: z.enum(["bunshi", "sum"]),
    })

    .refine(
        (data) => {
            try {
                const vals = data.val
                    .split("\n")
                    .filter((val) => val !== "")
                    .map((val) => BigInt(val));
                return vals.every((val) => val < BigInt(data.mod));
            } catch {
                return false;
            }
        },
        {
            message: "val < modである必要があります",
            path: ["val"],
        }
    );

const sourceCodePro = Source_Code_Pro({
    subsets: ["latin"],
});

function Result({
    ans,
    val,
    mod,
}: {
    ans: (bigint | undefined)[];
    val: bigint[];
    mod: bigint;
}) {
    console.log(ans);
    return (
        <div className="flex flex-col items-center justify-center gap-y-16">
            {ans.length > 0 && <p>計算結果</p>}

            {ans.map((dat, i) => {
                let ret: string;
                let bunsi = 0n;
                if (dat === undefined) {
                    ret = "N/A";
                } else {
                    bunsi =
                        ((val[i] * dat) % mod) % dat === 0n
                            ? ((val[i] * dat) % mod) + mod
                            : (val[i] * dat) % mod;
                    ret = `${bunsi} / ${dat}`;
                }
                return (
                    <div key={`no-${i}-${val[i]}`}>
                        <p
                            className={cn(
                                sourceCodePro.className,
                                "md:text-sm text-xs"
                            )}
                        >
                            No.{i + 1} {val[i]}
                        </p>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <p
                                    className={cn(
                                        sourceCodePro.className,
                                        "text-2xl md:text-5xl font-bold"
                                    )}
                                >
                                    {ret}
                                </p>
                            </TooltipTrigger>
                            {dat !== undefined && (
                                <TooltipContent>
                                    ≈{" "}
                                    {(Number(bunsi) / Number(dat)).toFixed(10)}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                );
            })}
        </div>
    );
}

export default function Mod() {
    const [val, setVal] = useState<bigint[]>([]);
    const [mod, setMod] = useState<bigint>(998244353n);
    const [ans, setAns] = useState<(bigint | undefined)[]>([]);
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            val: "",
            mod: "998244353",
            limit: "10000",
            type: "bunshi",
        },
        mode: "onChange",
    });
    const modListId = useId();
    const confirm = useConfirm();

    const onSubmit = async (data: z.infer<typeof schema>) => {
        if (BigInt(data.limit) >= 1e8) {
            if (
                !(await confirm({
                    title: "警告",
                    description: (
                        <span>
                            limitが10<sup>8</sup>
                            を超えると計算時間が長くなる可能性があります。本当に続けますか?
                        </span>
                    ),
                    ok: "続行",
                }))
            ) {
                toast.info("計算を中止しました");
                return;
            }
        }

        const new_val = data.val
            .split("\n")
            .filter((val) => val !== "")
            .map((val) => BigInt(val));
        setVal(new_val);
        setMod(BigInt(data.mod));
        setAns(new Array<bigint | undefined>(val.length).fill(undefined));

        let ok = 0;
        setLoading(true);
        for (let i = 0; i < new_val.length; i++) {
            new Promise<bigint | undefined>((resolve) => {
                const new_ans = solve(
                    new_val[i],
                    BigInt(data.mod),
                    BigInt(data.limit),
                    data.type
                );
                console.log(new_ans, i, new_val[i]);
                resolve(new_ans);
            }).then((new_ans) => {
                setAns((prev) => {
                    const new_ans_arr = [...prev];
                    new_ans_arr[i] = new_ans;
                    return new_ans_arr;
                });
                ok++;

                if (new_ans === undefined) {
                    toast.error(
                        `No. ${i + 1}の解が見つかりませんでした (${ok}/${new_val.length})`
                    );
                } else {
                    toast.success(
                        `No. ${i + 1}の計算が完了しました (${ok}/${new_val.length})`
                    );
                }
                if (ok === new_val.length) {
                    toast.success("計算が全て完了しました");
                    setLoading(false);
                } else {
                }
            });
        }
        console.log(ans);
    };

    return (
        <div className="flex flex-col items-center justify-center gap-y-8 max-w-full">
            <Card className="w-2xl max-w-full">
                <CardHeader>
                    <CardTitle>Reverse Mod</CardTitle>
                    <CardDescription>
                        <p>有理数modから、元の有理数を復元します。</p>
                        <p>
                            計算量はO(√mod + limit{" "}
                            <span className="italic">log</span>{" "}
                            mod)です。また、解は正の非整数になると仮定して計算します。
                        </p>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-8 md:min-w-96"
                        id="mod-form"
                    >
                        <FieldGroup>
                            <Controller
                                name="val"
                                control={form.control}
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            val
                                        </FieldLabel>
                                        <Textarea
                                            {...field}
                                            id={field.name}
                                            placeholder={"831870305\n332748121"}
                                            aria-invalid={fieldState.invalid}
                                        />
                                        <FieldDescription>
                                            有理数mod後の値、改行区切りで複数入力できます
                                        </FieldDescription>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="mod"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            mod
                                        </FieldLabel>
                                        <div>
                                            <Input
                                                placeholder="998244353"
                                                type="number"
                                                min={1}
                                                list={modListId}
                                                {...field}
                                            />
                                            <datalist id={modListId}>
                                                <option value="998244353" />
                                                <option value="1000000007" />
                                            </datalist>
                                        </div>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="limit"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            limit
                                        </FieldLabel>
                                        <Input
                                            placeholder="1000"
                                            type="number"
                                            min={1}
                                            {...field}
                                        />
                                        <FieldDescription>
                                            分母の探索範囲
                                        </FieldDescription>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="type"
                                render={({ field, fieldState }) => (
                                    <Field data-invalid={fieldState.invalid}>
                                        <FieldLabel htmlFor={field.name}>
                                            計算方法
                                        </FieldLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="計算方法を選択してください" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bunshi">
                                                    分子が最小となるもの
                                                </SelectItem>
                                                <SelectItem value="sum">
                                                    分子と分母の和が最小となるもの
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {fieldState.invalid && (
                                            <FieldError
                                                errors={[fieldState.error]}
                                            />
                                        )}
                                    </Field>
                                )}
                            />
                        </FieldGroup>
                    </form>
                </CardContent>
                <CardFooter>
                    <Field orientation="horizontal">
                        <Button
                            type="submit"
                            form="mod-form"
                            disabled={loading}
                        >
                            {loading && <Spinner />}
                            {loading ? "計算中..." : "計算"}
                        </Button>
                        <Button
                            form="mod-form"
                            type="reset"
                            onClick={() => {
                                form.reset();
                                setAns([]);
                                setVal([]);
                                setMod(998244353n);
                            }}
                            variant="outline"
                        >
                            リセット
                        </Button>
                    </Field>
                </CardFooter>
            </Card>

            <Result ans={ans} val={val} mod={mod} />
        </div>
    );
}
