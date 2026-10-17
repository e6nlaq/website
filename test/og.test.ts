import { describe, expect, test } from "bun:test";
import { isOgImageTarget, ogImageUrl } from "@/lib/og";
import { siteUrl, toolMeta, type ToolKeys } from "@/text/meta";

describe("isOgImageTarget", () => {
  test("Home と wind は対象外", () => {
    expect(isOgImageTarget("")).toBe(false);
    expect(isOgImageTarget("wind")).toBe(false);
  });

  test("その他のページは対象", () => {
    expect(isOgImageTarget("tools")).toBe(true);
    expect(isOgImageTarget("about")).toBe(true);
    expect(isOgImageTarget("tools/qr-reader")).toBe(true);
  });

  test("toolMeta の未対応キーは OG画像対象外", () => {
    const keys = Object.keys(toolMeta) as ToolKeys[];
    const excluded = keys.filter((key) => isOgImageTarget(key));
    expect(excluded).toEqual([
      "tools/ajl-simulator",
      "tools/mod",
      "tools/qr-reader",
      "tools",
      "about",
    ]);
  });
});

describe("ogImageUrl", () => {
  test("meta キーをそのままパスにする", () => {
    expect(ogImageUrl("tools/qr-reader")).toBe(`${siteUrl}/og/tools/qr-reader`);
    expect(ogImageUrl("about")).toBe(`${siteUrl}/og/about`);
  });
});
