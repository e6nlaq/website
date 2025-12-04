"use client";

import { Source_Code_Pro } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toolmetas } from "@/text/meta";
import { ModeToggle } from "./mode-toggle";

const sourceCodePro = Source_Code_Pro({
    subsets: ["latin"],
});

export function Nav() {
    const pathname = usePathname();
    const path = pathname.split("/")[1] as keyof typeof toolmetas;
    return (
        <div className="flex items-center justify-center w-screen pt-4 px-4">
            <p className={`${sourceCodePro.className} text-lg`}>
                <Link href="/">
                    <span className="font-bold">e6nlaq's Lab</span>
                </Link>
                {/* <span>{` - ${pages[pathname.split("/")[1]]}`}</span> */}
                <span>{" - "}</span>
                <wbr />
                <span>
                    {toolmetas[path] === undefined
                        ? "404"
                        : toolmetas[path].title}
                </span>
            </p>

            <div className="ml-auto">
                <ModeToggle />
            </div>
        </div>
    );
}
