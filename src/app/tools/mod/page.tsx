"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardIcon, ClipboardPlusIcon } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ToolCard } from "@/components/tool-card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useConfirm } from "@/hooks/useConfirm";

const schema = z
  .object({
    val: z
      .string()
      .nonempty("値を入力してください")
      .refine((vals) => {
        return vals.split(/\r?\n/).every((val) => /^\d*$/.test(val));
      }, "数値を入力してください")
      .refine((data) => {
        try {
          const vals = data.split(/\r?\n/).filter((val) => val !== "");
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
          .split(/\r?\n/)
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

function Result({
  ans,
  val,
  mod,
}: {
  ans: (bigint | undefined)[];
  val: bigint[];
  mod: bigint;
}) {
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
          <div
            key={`no-${
              // biome-ignore lint/suspicious/noArrayIndexKey: off
              i
            }-${val[i]}`}
          >
            <p className="md:text-sm text-xs font-code">
              No.{i + 1} {val[i]}
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-2xl md:text-5xl font-bold font-code">
                  {ret}
                </p>
              </TooltipTrigger>
              {dat !== undefined && (
                <TooltipContent>
                  ≈ {(Number(bunsi) / Number(dat)).toFixed(10)}
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
  const defaultValues: z.infer<typeof schema> = {
    val: "",
    mod: "998244353",
    limit: "10000",
    type: "bunshi",
  };
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues,
    mode: "onChange",
  });
  const modListId = useId();
  const confirm = useConfirm();

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (BigInt(data.limit) >= 1e7) {
      if (
        !(await confirm({
          title: "警告",
          description: (
            <span>
              limitが10<sup>7</sup>
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
    setAns(
      Array.from<bigint | undefined>({ length: new_val.length }).fill(undefined)
    );
    setLoading(true);
    const worker = new Worker(new URL("./solve.worker.ts", import.meta.url));
    try {
      await new Promise<void>((resolve, reject) => {
        let completed = 0;
        worker.onmessage = ({ data: message }) => {
          if (message.type === "done") {
            toast.success("計算が全て完了しました");
            resolve();
            return;
          }

          setAns((prev) => {
            const updated = [...prev];
            updated[message.index] = message.result;
            return updated;
          });
          completed++;

          if (message.result === undefined) {
            toast.error(
              `No. ${message.index + 1}の解が見つかりませんでした (${completed}/${new_val.length})`
            );
          } else {
            toast.success(
              `No. ${message.index + 1}の計算が完了しました (${completed}/${new_val.length})`
            );
          }
        };
        worker.onerror = (event) => reject(event.error);
        worker.postMessage({
          values: new_val,
          mod: BigInt(data.mod),
          limit: BigInt(data.limit),
          mode: data.type,
        });
      });
    } catch {
      toast.error("計算中にエラーが発生しました");
    } finally {
      worker.terminate();
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-y-8 max-w-full">
      <ToolCard
        title="Reverse Mod"
        description={
          <>
            <p>有理数modから元の有理数として考えられるものを1つ復元します。</p>
            <p className="font-bold text-red-500 underline">
              計算中は一切の操作を受け付けません。
            </p>
            <p>
              計算量はO(√mod + limit <span className="italic">log</span>{" "}
              mod)です。また、解は正の非整数になると仮定して計算します。
            </p>
          </>
        }
        formId="mod-form"
        loading={loading}
        onReset={() => {
          form.reset();
          setAns([]);
          setVal(
            defaultValues.val
              .split("\n")
              .filter((val) => val !== "")
              .map((val) => BigInt(val))
          );
          setMod(BigInt(defaultValues.mod));
          toast.success("リセットしました");
        }}
      >
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
                  <FieldLabel htmlFor={field.name}>val</FieldLabel>
                  <InputGroup>
                    <InputGroupTextarea
                      {...field}
                      id={field.name}
                      placeholder={"831870305\n332748121"}
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon
                      align="inline-end"
                      className="pl-2 inline space-y-1"
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InputGroupButton
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard
                                .readText()
                                .then((text) => {
                                  field.onChange(text);
                                  toast.success(
                                    "クリップボードを貼り付けました"
                                  );
                                })
                                .catch(() => {
                                  toast.error(
                                    "クリップボードの内容を取得できませんでした",
                                    {
                                      description:
                                        "ブラウザの権限を確認してください",
                                    }
                                  );
                                });
                            }}
                          >
                            <ClipboardIcon />
                          </InputGroupButton>
                        </TooltipTrigger>
                        <TooltipContent>貼り付け</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InputGroupButton
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard
                                .readText()
                                .then((text) => {
                                  const val = field.value;
                                  if (val !== "")
                                    field.onChange(`${val}\n${text}`);
                                  else field.onChange(text);

                                  toast.success(
                                    "クリップボードを貼り付けました"
                                  );
                                })
                                .catch(() => {
                                  toast.error(
                                    "クリップボードの内容を取得できませんでした",
                                    {
                                      description:
                                        "ブラウザの権限を確認してください",
                                    }
                                  );
                                });
                            }}
                          >
                            <ClipboardPlusIcon />
                          </InputGroupButton>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          貼り付けして追加
                        </TooltipContent>
                      </Tooltip>
                    </InputGroupAddon>
                  </InputGroup>

                  <FieldDescription>
                    有理数mod後の値、改行区切りで複数入力できます
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="mod"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>mod</FieldLabel>
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
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="limit"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>limit</FieldLabel>
                  <Input placeholder="1000" type="number" min={1} {...field} />
                  <FieldDescription>分母の探索範囲</FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>計算方法</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </ToolCard>

      <Result ans={ans} val={val} mod={mod} />
    </div>
  );
}
