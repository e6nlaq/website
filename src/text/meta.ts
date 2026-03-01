import type { ToolMeta } from "@/types/meta";

export const toolMeta = {
  "": {
    title: "Home",
    description: "e6nlaqのホームページ・ツール公開場所",
    keywords: ["e6nlaq", "e6nlaq's Lab", "ツール"],
  },
  "tools/ajl-simulator": {
    title: "AJL Simulator",
    description:
      "次回のパフォーマンスからAJLスコアの推移をシミュレーションする",
    logo: "/icon/ajl.png",
    keywords: ["AJL", "AtCoder", "シミュレーター", "スコア", "推移"],
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
  tools: {
    title: "Tools",
    description: "いろんなツールを公開するよ",
    keywords: ["e6nlaq", "e6nlaq's Lab", "ツール"],
  },
} satisfies Record<string, ToolMeta>;

export const siteUrl = "https://e6nlaq.vercel.app";
export type ToolKeys = keyof typeof toolMeta;
