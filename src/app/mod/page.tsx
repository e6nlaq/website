"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Source_Code_Pro } from "next/font/google";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { solve } from "wasm";
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
			limit: 1000,
		},
	});

	const onSubmit = (data: z.infer<typeof schema>) => {
		setVal(data.val);
		setMod(data.mod);
		setAns(solve(data.val, data.mod, data.limit));
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
									<Input placeholder="831870305" {...field} />
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
									<Input placeholder="998244353" {...field} />
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
									<Input placeholder="1000" {...field} />
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
				<p className={cn(sourceCodePro.className, "text-5xl font-bold")}>
					{ans !== undefined ? ((val * ans) % mod) / ans : "なし"}
				</p>
			</div>
		</div>
	);
}
