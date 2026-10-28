import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { loadDefaultJapaneseParser, type Parser } from "budoux";
import { dominantEdgeColor } from "@/lib/edge-color";
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

const fileCache = new Map<string, Promise<Buffer>>();

/** public/ 配下の静的ファイルはビルド中に変わらないので、読み込みをキャッシュする */
function readPublicFile(file: string): Promise<Buffer> {
  const cached = fileCache.get(file);
  if (cached) return cached;

  const pending = readFile(path.join(process.cwd(), "public", file)).catch(
    (error: unknown) => {
      fileCache.delete(file);
      throw error;
    }
  );
  fileCache.set(file, pending);
  return pending;
}

function toDataUri(file: string, buffer: Buffer): string {
  const mime = file.endsWith(".svg") ? "image/svg+xml" : "image/png";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

let sharpModule: Promise<typeof import("sharp")> | undefined;
const loadSharp = () => (sharpModule ??= import("sharp"));

const edgeColorCache = new Map<string, Promise<string | null>>();

async function analyzeEdgeColor(buffer: Buffer): Promise<string | null> {
  try {
    const { default: sharp } = await loadSharp();
    const { data, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return dominantEdgeColor({
      data,
      width: info.width,
      height: info.height,
      channels: info.channels,
    });
  } catch (error) {
    console.warn("OG 画像用のアイコン色を解析できませんでした", error);
    return null;
  }
}

/** アイコンの外周色を返す(解析結果はファイルごとにキャッシュする) */
function iconEdgeColor(file: string, buffer: Buffer): Promise<string | null> {
  const cached = edgeColorCache.get(file);
  if (cached) return cached;

  const pending = analyzeEdgeColor(buffer);
  edgeColorCache.set(file, pending);
  return pending;
}

let fontsPromise: Promise<{ extraBold: Buffer; bold: Buffer }> | undefined;

/** フォントはビルド中に変わらないので、読み込みを 1 度だけにする */
function loadFonts() {
  fontsPromise ??= Promise.all([
    readFile(
      path.join(process.cwd(), "src/font/og/LINESeedJP_OTF_ExtraBold.ttf")
    ),
    readFile(path.join(process.cwd(), "src/font/og/LINESeedJP_OTF_Bold.ttf")),
  ]).then(([extraBold, bold]) => ({ extraBold, bold }));
  return fontsPromise;
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
  const iconFile = meta.logo ?? "/favicon.png";
  const isDefaultIcon = iconFile === "/favicon.png";
  const iconBufferPromise = readPublicFile(iconFile);

  const [fonts, iconBuffer, logoBuffer, edgeColor] = await Promise.all([
    loadFonts(),
    iconBufferPromise,
    readPublicFile("/favicon.svg"),
    iconBufferPromise.then((buffer) => iconEdgeColor(iconFile, buffer)),
  ]);

  const iconDataUri = toDataUri(iconFile, iconBuffer);
  const logoDataUri = toDataUri("/favicon.svg", logoBuffer);
  const labelColor = edgeColor ?? (isDefaultIcon ? "#f1f1f1" : "#ffffff");

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
            backgroundColor: labelColor,
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
