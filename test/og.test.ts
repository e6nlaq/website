import { describe, expect, test } from "bun:test";
import {
  fitTitleStyle,
  isOgImageTarget,
  ogImageUrl,
  textWidth,
  wrapDescription,
} from "@/lib/og";
import { siteUrl } from "@/text/meta";

describe("isOgImageTarget", () => {
  test("Home のみ対象外", () => {
    expect(isOgImageTarget("")).toBe(false);
    expect(isOgImageTarget("wind")).toBe(true);
  });

  test("その他のページは対象", () => {
    expect(isOgImageTarget("tools")).toBe(true);
    expect(isOgImageTarget("about")).toBe(true);
    expect(isOgImageTarget("tools/qr-reader")).toBe(true);
  });
});

describe("ogImageUrl", () => {
  test("meta キーをそのままパスにする", () => {
    expect(ogImageUrl("tools/qr-reader")).toBe(`${siteUrl}/og/tools/qr-reader`);
    expect(ogImageUrl("about")).toBe(`${siteUrl}/og/about`);
  });
});

describe("fitTitleStyle", () => {
  const maxWidth = 680;

  test("十分短いタイトルは最大サイズで1行", () => {
    expect(fitTitleStyle("Reverse Mod", maxWidth)).toEqual({
      fontSize: 76,
      whiteSpace: "nowrap",
    });
  });

  test("長いタイトルは1行に収まるサイズまで縮小する", () => {
    const { fontSize, whiteSpace } = fitTitleStyle(
      "rinu.jp Checker 2",
      maxWidth
    );
    expect(whiteSpace).toBe("nowrap");
    // 縮小されたフォントサイズでの推定幅は描画領域内に収まる
    expect(fontSize).toBeLessThan(76);
    expect(fontSize * textWidth("rinu.jp Checker 2")).toBeLessThanOrEqual(
      maxWidth * 0.95
    );
  });

  test("縮小しても下限に届かないほど長い場合は折り返しにフォールバック", () => {
    const longTitle = "かなしい程長いタイトルがここに入れられているとしますね";
    const { fontSize, whiteSpace } = fitTitleStyle(longTitle, maxWidth);
    expect(whiteSpace).toBe("normal");
    expect(fontSize).toBe(40);
  });

  test("空文字は最大サイズの1行", () => {
    expect(fitTitleStyle("", maxWidth)).toEqual({
      fontSize: 76,
      whiteSpace: "nowrap",
    });
  });
});

describe("wrapDescription", () => {
  const text =
    "次回のパフォーマンスからAJLスコアの推移をシミュレーションするツール";

  test("BudouX の文節区切りで折り返す", () => {
    const lines = wrapDescription(text, 19).split("\n");
    // 文節の途中で切らない
    expect(lines.join("")).toBe(text);
    // 十分長い文なので必ず折り返す
    expect(lines.length).toBeGreaterThan(1);
    // 各行は maxUnits 以内
    for (const line of lines) {
      expect(textWidth(line)).toBeLessThanOrEqual(19);
    }
  });
});
