"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Source_Code_Pro } from "next/font/google";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { solve } from "wasm/wasm";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

const schema = z
	.object({
		val: z.string().regex(/[0-9]+/, "数値を入力してください"),
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
			const vals = data.val
				.split("\n")
				.filter((val) => val !== "")
				.map((val) => BigInt(val));
			return vals.every((val) => val < BigInt(data.mod));
		},
		{
			message: "val < modである必要があります",
			path: ["val"],
		}
	)
	.refine(
		(data) => {
			const vals = data.val.split("\n").filter((val) => val !== "");
			return vals.every((val) => val.length <= 30);
		},
		{
			message: "valは30桁以内で入力してください",
			path: ["val"],
		}
	);

const sourceCodePro = Source_Code_Pro({
	subsets: ["latin"],
});



export default function Mod() {
	const [val, setVal] = useState<bigint[]>([]);
	const [mod, setMod] = useState<bigint>(998244353n);
	const [ans, setAns] = useState<(bigint | undefined)[]>([]);
	const [loading, setLoading] = useState(false);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			val: "332748121",
			mod: "998244353",
			limit: "10000",
			type: "bunshi",
		},
	});
	const modListId = useId();

	const onSubmit = (data: z.infer<typeof schema>) => {
		if (BigInt(data.limit) >= 1e8) {
			if (
				!confirm(
					"limitが10^8を超えると計算時間が長くなる可能性があります。本当に続けますか?"
				)
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
					const new_ans_arr = prev;
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
				} else {
				}
			});
		}
		setLoading(false);
	};

	return (
		<div className="flex flex-col items-center justify-center *:py-4 p-4">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-8 md:min-w-96"
				>
					<FormField
						control={form.control}
						name="val"
						render={({ field }) => (
							<FormItem>
								<FormLabel>val</FormLabel>
								<FormControl>
									<Textarea placeholder="831870305" {...field} />
								</FormControl>
								<FormDescription>
									有理数mod後の値、改行区切りで複数入力できます
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="mod"
						render={({ field }) => (
							<FormItem>
								<FormLabel>mod</FormLabel>
								<FormControl>
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
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="limit"
						render={({ field }) => (
							<FormItem>
								<FormLabel>limit</FormLabel>
								<FormControl>
									<Input placeholder="1000" type="number" min={1} {...field} />
								</FormControl>
								<FormDescription>分母の探索範囲</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="type"
						render={({ field }) => (
							<FormItem>
								<FormLabel>計算方法</FormLabel>
								<Select
									onValueChange={field.onChange}
									defaultValue={field.value}
								>
									<FormControl>
										<SelectTrigger>
											<SelectValue placeholder="計算方法を選択してください" />
										</SelectTrigger>
									</FormControl>
									<SelectContent>
										<SelectItem value="bunshi">分子が最小となるもの</SelectItem>
										<SelectItem value="sum">
											分子と分母の和が最小となるもの
										</SelectItem>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormItem>
						<Button type="submit" disabled={loading}>
							{loading ? "計算中..." : "計算"}
						</Button>
						<FormDescription className="text-xs">
							計算量はO(√mod + limit log
							mod)です。また、解は正の非整数になると仮定して計算します。
						</FormDescription>
					</FormItem>
				</form>
			</Form>

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
							<p className={cn(sourceCodePro.className, "md:text-sm text-xs")}>
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
										≈ {Number(bunsi) / Number(dat)}
									</TooltipContent>
								)}
							</Tooltip>
						</div>
					);
				})}
			</div>
		</div>
	);
}
