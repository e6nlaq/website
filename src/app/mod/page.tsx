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
import { cn } from "@/lib/utils";

const schema = z
	.object({
		val: z.coerce.number().int().positive(),
		mod: z.coerce.number().int().positive(),
		limit: z.coerce.number().int().positive(),
	})
	.refine((data) => data.val < data.mod, {
		message: "val < modである必要があります",
		path: ["val"],
	});

const sourceCodePro = Source_Code_Pro({
	subsets: ["latin"],
});

export default function Mod() {
	const [val, setVal] = useState<number>(1);
	const [mod, setMod] = useState<number>(998244353);
	const [ans, setAns] = useState<number | undefined>(undefined);
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			val: 332748121,
			mod: 998244353,
			limit: 10000,
		},
	});
	const modListId = useId();

	const onSubmit = (data: z.infer<typeof schema>) => {
		setVal(data.val);
		setMod(data.mod);
		const new_ans = solve(
			BigInt(data.val),
			BigInt(data.mod),
			BigInt(data.limit)
		);
		setAns(new_ans === undefined ? undefined : Number(new_ans));
		if (new_ans === undefined) {
			toast.error("解が見つかりませんでした");
		} else {
			toast.success("計算が完了しました");
		}
	};

	return (
		<div className="flex flex-col items-center justify-center *:py-4">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
								<FormDescription>分母と分子の探索範囲</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button type="submit">計算</Button>
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
					{ans !== undefined ? `${(val * ans) % mod} / ${ans}` : "N/A"}
				</p>
			</div>
		</div>
	);
}
