import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteUrl } from "@/text/meta";
import type { ToolMeta } from "@/types/meta";

const ogImageKeys = new Set([""]);

/** OG画像を生成する対象かどうか(Home "/" は対象外) */
export function isOgImageTarget(key: string): boolean {
  return !ogImageKeys.has(key);
}

export function ogImageUrl(key: string): string {
  return `${siteUrl}/og/${key}`;
}

async function fileDataUri(file: string): Promise<string> {
  const buffer = await readFile(path.join(process.cwd(), "public", file));
  const mime = file.endsWith(".svg") ? "image/svg+xml" : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

let fontsCache: { extraBold: Buffer; bold: Buffer } | undefined;

async function loadFonts() {
  fontsCache ??= {
    extraBold: await readFile(
      path.join(process.cwd(), "src/font/og/LINESeedJP_OTF_ExtraBold.ttf")
    ),
    bold: await readFile(
      path.join(process.cwd(), "src/font/og/LINESeedJP_OTF_Bold.ttf")
    ),
  };
  return fontsCache;
}

/** toolMeta の内容から OGP 画像(1200×630)をレンダリングする */
export async function renderOgImage(meta: ToolMeta): Promise<ImageResponse> {
  const fonts = await loadFonts();
  const iconFile = meta.logo ?? "/favicon.png";
  const isDefaultIcon = iconFile === "/favicon.png";
  const iconDataUri = await fileDataUri(iconFile);
  const logoDataUri = await fileDataUri("/favicon.svg");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#18181b",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexGrow: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: "80px",
        }}
      >
        <div
          style={{
            width: "300px",
            height: "300px",
            backgroundColor: isDefaultIcon ? "#f1f1f1" : "#ffffff",
            borderRadius: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={iconDataUri} width={250} height={250} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "24px",
            maxWidth: "680px",
            minHeight: "0",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              fontWeight: 800,
              lineHeight: 1.2,
              color: "#fafafa",
              fontFamily: "LINESeedJP-Eb",
              wordBreak: "keep-all",
            }}
          >
            {meta.title}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "34px",
              fontWeight: 700,
              lineHeight: 1.6,
              color: "#a1a1aa",
              fontFamily: "LINESeedJP-Bd",
              overflow: "hidden",
              wordBreak: "auto-phrase",
            }}
          >
            {meta.description}
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoDataUri} width={52} height={52} />
        <div
          style={{
            display: "flex",
            fontSize: "40px",
            fontWeight: 800,
            color: "#fafafa",
            fontFamily: "LINESeedJP-Eb",
          }}
        >
          e6nlaq's Lab
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "LINESeedJP-Eb",
          data: fonts.extraBold,
          weight: 800,
          style: "normal",
        },
        {
          name: "LINESeedJP-Bd",
          data: fonts.bold,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}
