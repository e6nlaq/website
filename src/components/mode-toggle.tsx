"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
	const { setTheme, theme } = useTheme();
	const [show_theme, setShow] = React.useState("");
	React.useEffect(() => {
		if (theme !== undefined) setShow(theme);
	}, [theme]);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon">
					{show_theme === "" ? null : show_theme === "light" ? (
						<Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
					) : show_theme === "dark" ? (
						<Moon className=" h-[1.2rem] w-[1.2rem] transition-all" />
					) : (
						<Monitor className="h-[1.2rem] w-[1.2rem] transition-all" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem onClick={() => setTheme("light")}>
					ライト
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("dark")}>
					ダーク
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => setTheme("system")}>
					システムの既定
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
