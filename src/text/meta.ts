import type { ToolMeta } from "@/types/toolmeta";

export const toolMeta = {
    "": {
        title: "The Home",
        description: "いろんなツールを公開するよ",
    },
    "ajl-binoculars": {
        title: "AJL Binoculars",
        description: "AJLで相手との差を確認する",
        logo: "/icon/ajl.png",
        index: false,
    },
    wind: {
        title: "wind, hidden",
        description: "?",
        index: false,
    },
    mod: {
        title: "Reverse Mod",
        description: "有理数modをいい感じに元に戻す",
        logo: "/icon/mod.png",
    },
} as const satisfies Record<string, ToolMeta>;

export const siteUrl = "https://e6nlaq.vercel.app";
