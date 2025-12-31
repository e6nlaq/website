"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { toolMeta } from "@/text/meta";
import { ModeToggle } from "./mode-toggle";

export function Nav({ fontClass }: { fontClass: string }) {
    const pathname = usePathname();
    const path = pathname
        .split("/")
        .slice(1)
        .join("/") as keyof typeof toolMeta;
    return (
        <div className="flex items-center justify-center w-screen pt-4 px-4">
            <p className={`${fontClass} text-lg`}>
                <Link href="/">
                    <span className="font-bold">e6nlaq's Lab</span>
                </Link>
                <span>{" - "}</span>
                <wbr />
                <span>
                    {toolMeta[path] === undefined
                        ? "404"
                        : toolMeta[path].title}
                </span>
            </p>

            <div className="flex items-center gap-x-3 ml-auto">
                <NavigationMenu className="hidden sm:flex">
                    <NavigationMenuList>
                        <NavigationMenuItem>
                            <NavigationMenuLink
                                asChild
                                className={navigationMenuTriggerStyle()}
                            >
                                <Link href="/">Home</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                        <NavigationMenuItem>
                            <NavigationMenuLink
                                asChild
                                className={navigationMenuTriggerStyle()}
                            >
                                <Link href="/tools">Tools</Link>
                            </NavigationMenuLink>
                        </NavigationMenuItem>
                    </NavigationMenuList>
                </NavigationMenu>
                <ModeToggle />
            </div>
        </div>
    );
}
