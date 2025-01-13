"use client";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

export default function AjlBinoculars() {
	const [division, setDivision] = useState("a");

	return (
		<>
			<Select value={division} onValueChange={setDivision}>
				<SelectTrigger className="w-32">
					<SelectValue placeholder="部門" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>部門</SelectLabel>
						<SelectItem value="a">Algorithm</SelectItem>
						<SelectItem value="h">Heuristic</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		</>
	);
}
