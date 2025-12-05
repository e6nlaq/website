"use client";

import { Source_Code_Pro } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toolMeta } from "@/text/meta";
import { ModeToggle } from "./mode-toggle";

const sourceCodePro = Source_Code_Pro({
    subsets: ["latin"],
});

export function Nav() {
    const pathname = usePathname();
    const path = pathname.split("/")[1] as keyof typeof toolMeta;
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
                    {toolMeta[path] === undefined
                        ? "404"
                        : toolMeta[path].title}
                </span>
            </p>

            <div className="ml-auto">
                <ModeToggle />
            </div>
        </div>
    );
}
