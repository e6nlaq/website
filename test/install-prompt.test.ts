import { describe, expect, test } from "bun:test";
import { isIosDevice } from "@/lib/install-prompt";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IPAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const MAC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15";
const WINDOWS_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

describe("isIosDevice", () => {
  test("iPhone / iPad / iPod を判定する", () => {
    expect(isIosDevice(IPHONE_UA, "iPhone", 5)).toBe(true);
    expect(isIosDevice(IPAD_UA, "iPad", 5)).toBe(true);
    expect(
      isIosDevice(
        "Mozilla/5.0 (iPod touch; CPU iPhone OS 15_7 like Mac OS X)",
        "iPod",
        5
      )
    ).toBe(true);
  });

  test("iPadOS は MacIntel かつタッチ対応で判定する", () => {
    expect(isIosDevice(MAC_UA, "MacIntel", 5)).toBe(true);
    expect(isIosDevice(MAC_UA, "MacIntel", 0)).toBe(false);
  });

  test("デスクトップは iOS ではない", () => {
    expect(isIosDevice(WINDOWS_UA, "Win32", 0)).toBe(false);
  });
});
