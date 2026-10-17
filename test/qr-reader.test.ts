import { describe, expect, test } from "bun:test";
import { getScaledSize } from "@/app/tools/qr-reader/decode";

describe("getScaledSize", () => {
  describe("basic tests", () => {
    test("小さい画像は等倍のまま", () => {
      expect(getScaledSize(800, 600, 1600)).toEqual({
        width: 800,
        height: 600,
      });
    });
    test("大きい画像は最大辺がmaxDimに収まる", () => {
      expect(getScaledSize(3200, 2400, 1600)).toEqual({
        width: 1600,
        height: 1200,
      });
    });
    test("縦長の画像も縦横比を維持する", () => {
      expect(getScaledSize(1000, 4000, 2000)).toEqual({
        width: 500,
        height: 2000,
      });
    });
    test("極端なmaxDimでも1px以上のサイズを返す", () => {
      expect(getScaledSize(3, 2, 1)).toEqual({ width: 1, height: 1 });
    });
  });
});
