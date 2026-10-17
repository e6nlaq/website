import { describe, expect, test } from "bun:test";
import { isOgImageTarget, ogImageUrl } from "@/lib/og";
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
