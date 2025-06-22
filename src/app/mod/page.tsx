"use client";

import { Source_Code_Pro } from "next/font/google";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const schema = z
	.object({
		val: z.string().max(30),
		mod: z.string().max(30),
		limit: z.string().max(30),
		type: z.enum(["bunshi", "sum"]),
	})
	.refine((data) => BigInt(data.val) < BigInt(data.mod), {
		message: "val < modである必要があります",
		path: ["val"],
	});

const sourceCodePro = Source_Code_Pro({
	subsets: ["latin"],
});

export default function Mod() {
	const [val, setVal] = useState<bigint>(1n);
	const [mod, setMod] = useState<bigint>(998244353n);
	const [ans, setAns] = useState<bigint | undefined>(undefined);
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

		setVal(BigInt(data.val));
		setMod(BigInt(data.mod));
		const new_ans = solve(
			BigInt(data.val),
			BigInt(data.mod),
			BigInt(data.limit),
			data.type
		);
		setAns(new_ans === undefined ? undefined : new_ans);
		if (new_ans === undefined) {
			toast.error("解が見つかりませんでした");
		} else {
			toast.success("計算が完了しました");
		}
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
									<Input
										placeholder="831870305"
										type="number"
										min={1}
										{...field}
									/>
								</FormControl>
								<FormDescription>有理数mod後の値</FormDescription>
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
						<Button type="submit">計算</Button>
						<FormDescription className="text-xs">
							計算量はO(√mod + limit log
							mod)です。また、解は非整数になると仮定して計算します。
						</FormDescription>
					</FormItem>
				</form>
			</Form>

			<div className="flex flex-col items-center justify-center *:py-1">
				<p>計算結果</p>

				<p
					className={cn(
						sourceCodePro.className,
						"text-2xl md:text-5xl font-bold"
					)}
				>
					{ans !== undefined
						? `${((val * ans) % mod) % ans === 0n ? ((val * ans) % mod) + mod : (val * ans) % mod} / ${ans}`
						: "N/A"}
				</p>
			</div>
		</div>
	);
}
