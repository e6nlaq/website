import { describe, expect, test } from "bun:test";
import {
  formatClockDate,
  formatClockTime,
  formatMilliseconds,
  formatUnixTime,
} from "@/app/tools/clock/format";

describe("formatClockTime", () => {
  test("HH:MM:SS形式で0詰めされる", () => {
    expect(formatClockTime(new Date(2026, 9, 18, 7, 5, 3))).toBe("07:05:03");
  });
  test("2桁の値はそのまま", () => {
    expect(formatClockTime(new Date(2026, 9, 18, 23, 59, 59))).toBe("23:59:59");
  });
  test("H:MM:SS形式では時だけ0詰めしない", () => {
    expect(formatClockTime(new Date(2026, 9, 18, 7, 5, 3), "h")).toBe(
      "7:05:03"
    );
  });
  test("H:MM:SS形式でも分と秒は0詰めする", () => {
    expect(formatClockTime(new Date(2026, 9, 18, 15, 0, 0), "h")).toBe(
      "15:00:00"
    );
  });
});

describe("formatClockDate", () => {
  test("YYYY-MM-DD (曜日) 形式で0詰めされる", () => {
    expect(formatClockDate(new Date(2026, 9, 18, 7, 5, 3))).toBe(
      "2026-10-18 (日)"
    );
  });
  test("月初や年末も正しく扱う", () => {
    expect(formatClockDate(new Date(2026, 11, 31, 23, 59, 59))).toBe(
      "2026-12-31 (木)"
    );
    expect(formatClockDate(new Date(2027, 0, 1, 0, 0, 0))).toBe(
      "2027-01-01 (金)"
    );
  });
});

describe("formatUnixTime", () => {
  test("UNIXエポック0は0", () => {
    expect(formatUnixTime(new Date(0))).toBe("0");
  });
  test("端数は切り捨てて秒単位になる", () => {
    expect(formatUnixTime(new Date(1760761200 * 1000 + 999))).toBe(
      "1760761200"
    );
  });
});

describe("formatMilliseconds", () => {
  test("1〜3桁を3桁に0詰めし、小数点を付ける", () => {
    expect(formatMilliseconds(new Date(0))).toBe(".000");
    expect(formatMilliseconds(new Date(5))).toBe(".005");
    expect(formatMilliseconds(new Date(999))).toBe(".999");
  });
  test("3桁の値はそのまま", () => {
    expect(formatMilliseconds(new Date(123))).toBe(".123");
  });
});
