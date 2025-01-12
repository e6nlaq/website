import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center *:my-8">
			<h1 className="text-6xl font-black inline-block text-transparent bg-clip-text bg-gradient-to-br from-sky-400 from-0% via-fuchsia-500 via-100%">
				404
			</h1>
			<p>Not Foundってやつ</p>
			<Button>
				<Link href="/">Home</Link>
			</Button>
		</div>
	);
}
