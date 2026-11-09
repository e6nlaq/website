import { describe, expect, test } from "bun:test";
import { formatExportFileName } from "@/app/tools/red-sheet/export";
import {
  DEFAULT_SETTINGS,
  normalizeSettings,
} from "@/app/tools/red-sheet/settings";
import {
  DEFAULT_SHEET_RECT,
  MIN_SHEET_SIZE,
  clampSheetRect,
  moveSheetRect,
  resizeSheetRect,
  scaleSheetRect,
} from "@/app/tools/red-sheet/sheet";

describe("clampSheetRect", () => {
  test("写真の中に収まっているシートはそのまま", () => {
    expect(clampSheetRect(DEFAULT_SHEET_RECT)).toEqual(DEFAULT_SHEET_RECT);
  });
  test("左・上の外にはみ出した分は 0 に寄せる", () => {
    expect(
      clampSheetRect({ x: -0.2, y: -0.3, width: 0.5, height: 0.4 })
    ).toEqual({ x: 0, y: 0, width: 0.5, height: 0.4 });
  });
  test("右・下の外にはみ出さないよう位置を戻す", () => {
    expect(clampSheetRect({ x: 0.8, y: 0.9, width: 0.5, height: 0.4 })).toEqual(
      { x: 0.5, y: 0.6, width: 0.5, height: 0.4 }
    );
  });
  test("小さすぎるシートは最小サイズまで広げる", () => {
    expect(clampSheetRect({ x: 0, y: 0, width: 0, height: -1 })).toEqual({
      x: 0,
      y: 0,
      width: MIN_SHEET_SIZE,
      height: MIN_SHEET_SIZE,
    });
  });
  test("写真より大きいシートは写真いっぱいに収める", () => {
    expect(clampSheetRect({ x: 0.2, y: 0.2, width: 2, height: 3 })).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });
});

describe("moveSheetRect", () => {
  test("差分だけ移動する", () => {
    const moved = moveSheetRect(DEFAULT_SHEET_RECT, 0.05, -0.1);
    expect(moved.x).toBeCloseTo(0.15);
    expect(moved.y).toBeCloseTo(0.15);
    expect(moved.width).toBe(DEFAULT_SHEET_RECT.width);
    expect(moved.height).toBe(DEFAULT_SHEET_RECT.height);
  });
  test("写真の端を越える移動は端で止まる", () => {
    const moved = moveSheetRect(DEFAULT_SHEET_RECT, 1, 1);
    expect(moved.x).toBeCloseTo(0.2);
    expect(moved.y).toBeCloseTo(0.5);
    expect(moved.width).toBe(DEFAULT_SHEET_RECT.width);
    expect(moved.height).toBe(DEFAULT_SHEET_RECT.height);
  });
});

describe("resizeSheetRect", () => {
  test("右下へ動かすと大きくなる", () => {
    expect(resizeSheetRect(DEFAULT_SHEET_RECT, 0.1, 0.2)).toEqual({
      x: 0.1,
      y: 0.25,
      width: 0.9,
      height: 0.7,
    });
  });
  test("写真の端を越えて大きくはならない", () => {
    expect(resizeSheetRect(DEFAULT_SHEET_RECT, 1, 1)).toEqual({
      x: 0.1,
      y: 0.25,
      width: 0.9,
      height: 0.75,
    });
  });
  test("小さくしすぎても最小サイズを下回らない", () => {
    const resized = resizeSheetRect(DEFAULT_SHEET_RECT, -1, -1);
    expect(resized.width).toBe(MIN_SHEET_SIZE);
    expect(resized.height).toBe(MIN_SHEET_SIZE);
  });
});

describe("scaleSheetRect", () => {
  test("中心を保ったまま拡大する", () => {
    expect(
      scaleSheetRect({ x: 0.25, y: 0.25, width: 0.5, height: 0.5 }, 2)
    ).toEqual({ x: 0, y: 0, width: 1, height: 1 });
  });
  test("縮小しても中心は動かない", () => {
    const scaled = scaleSheetRect(DEFAULT_SHEET_RECT, 0.5);
    expect(scaled.width).toBeCloseTo(0.4);
    expect(scaled.height).toBeCloseTo(0.25);
    expect(scaled.x + scaled.width / 2).toBeCloseTo(
      DEFAULT_SHEET_RECT.x + DEFAULT_SHEET_RECT.width / 2
    );
    expect(scaled.y + scaled.height / 2).toBeCloseTo(
      DEFAULT_SHEET_RECT.y + DEFAULT_SHEET_RECT.height / 2
    );
  });
  test("写真より大きくはならず、最小サイズも保つ", () => {
    expect(scaleSheetRect(DEFAULT_SHEET_RECT, 10)).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
    expect(scaleSheetRect(DEFAULT_SHEET_RECT, 0).width).toBe(MIN_SHEET_SIZE);
  });
});

describe("formatExportFileName", () => {
  test("日時からファイル名を作る", () => {
    expect(formatExportFileName(new Date(2026, 9, 28, 13, 5, 9))).toBe(
      "red-sheet-20261028-130509.png"
    );
  });
  test("1桁の月日・時刻は0埋めする", () => {
    expect(formatExportFileName(new Date(2026, 0, 2, 3, 4, 5))).toBe(
      "red-sheet-20260102-030405.png"
    );
  });
});

describe("normalizeSettings", () => {
  test("正しい設定はそのまま使う", () => {
    expect(normalizeSettings({ color: "#00FF00", opacity: 0.5 })).toEqual({
      color: "#00ff00",
      opacity: 0.5,
    });
  });
  test("色の形式が違う場合は既定色", () => {
    expect(normalizeSettings({ color: "red", opacity: 1 }).color).toBe(
      DEFAULT_SETTINGS.color
    );
    expect(normalizeSettings({ color: "#fff", opacity: 1 }).color).toBe(
      DEFAULT_SETTINGS.color
    );
  });
  test("不透明度は0〜1に収める", () => {
    expect(normalizeSettings({ color: "#ff0000", opacity: 3 }).opacity).toBe(1);
    expect(normalizeSettings({ color: "#ff0000", opacity: -1 }).opacity).toBe(
      0
    );
    expect(
      normalizeSettings({ color: "#ff0000", opacity: Number.NaN }).opacity
    ).toBe(DEFAULT_SETTINGS.opacity);
  });
  test("設定として読めない値は既定値", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings("settings")).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({})).toEqual(DEFAULT_SETTINGS);
  });
});
