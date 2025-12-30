import type { ToolMeta } from "@/types/meta";

export const toolMeta = {
    "": {
        title: "Home",
        description: "いろんなツールを公開するよ",
        keywords: ["e6nlaq", "e6nlaq's Lab", "ツール"],
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
    "tools/mod": {
        title: "Reverse Mod",
        description: "有理数modをいい感じに元に戻す",
        logo: "/icon/mod.png",
        keywords: [
            "e6nlaq",
            "有理数mod",
            "確率mod",
            "逆元",
            "mod",
            "復元",
            "競プロ",
            "競技プログラミング",
        ],
    },
} satisfies Record<string, ToolMeta>;

export const siteUrl = "https://e6nlaq.vercel.app";
