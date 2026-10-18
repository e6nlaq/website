import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { loadDefaultJapaneseParser, type Parser } from "budoux";
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

let parserCache: Parser | undefined;
const getParser = () => (parserCache ??= loadDefaultJapaneseParser());

/** 文字列の推定描画幅(全角を 1、半角を 0.6 とする) */
export function textWidth(text: string): number {
  let width = 0;
  for (const char of text) {
    width += char.charCodeAt(0) < 0x2e80 ? 0.6 : 1;
  }
  return width;
}

/** タイトルを1行に収めるスタイル(fontSize と whiteSpace)を返す。
 * 最大 maxPx で、推定幅が maxWidth を超える場合は縮小する。
 * 文字幅は近似値のため、余裕を見て 95% 相当までしか使わない。
 * 縮小しても minPx 未満にしかならない場合は折り返しでフォールバックする。
 */
export function fitTitleStyle(
  title: string,
  maxWidth: number,
  maxPx = 76,
  minPx = 40
): { fontSize: number; whiteSpace: "nowrap" | "normal" } {
  const units = textWidth(title);
  if (units === 0) return { fontSize: maxPx, whiteSpace: "nowrap" };
  const fitted = Math.floor((maxWidth * 0.95) / units);
  if (fitted < minPx) return { fontSize: minPx, whiteSpace: "normal" };
  return { fontSize: Math.min(maxPx, fitted), whiteSpace: "nowrap" };
}

/** BudouX で文節区切りし、1 行あたり maxUnits 以内になるよう改行を挿入する */
export function wrapDescription(text: string, maxUnits: number): string {
  const chunks = getParser().parse(text);
  const lines: string[] = [];
  let line = "";
  for (let chunk of chunks) {
    if (line && textWidth(line + chunk) > maxUnits) {
      lines.push(line);
      line = chunk;
    } else {
      line += chunk;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
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
              ...fitTitleStyle(meta.title, 680),
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
              whiteSpace: "pre",
              overflow: "hidden",
              wordBreak: "auto-phrase",
            }}
          >
            {wrapDescription(meta.description, 20)}
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
