import { describe, expect, test } from "bun:test";
import {
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
