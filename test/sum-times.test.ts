import { describe, expect, test } from "bun:test";
import {
  evaluateSumTimes,
  formatTotalMinutes,
  normalizeSumTimesInput,
} from "@/app/tools/sum-times/logic";

describe("normalizeSumTimesInput", () => {
  test("全角の数字・コロン・空白を半角にする", () => {
    expect(normalizeSumTimesInput("１：３０")).toBe("1:30");
    expect(normalizeSumTimesInput("２４：００　")).toBe("24:00 ");
  });

  test("半角の入力は変えない", () => {
    expect(normalizeSumTimesInput("12:34")).toBe("12:34");
  });
});

describe("formatTotalMinutes", () => {
  test("時間は2桁以上、分は2桁で0詰めする", () => {
    expect(formatTotalMinutes(0)).toBe("00:00");
    expect(formatTotalMinutes(65)).toBe("01:05");
    expect(formatTotalMinutes(6000)).toBe("100:00");
  });
});

describe("evaluateSumTimes", () => {
  test("H:MM と HH:MM を合計する", () => {
    expect(evaluateSumTimes("1:30\n0:45\n2:15")).toEqual({
      kind: "ok",
      count: 3,
      totalMinutes: 270,
      formatted: "04:30",
    });
  });

  test("24時間を超えても折り返さない", () => {
    expect(evaluateSumTimes("23:30\n2:00")).toEqual({
      kind: "ok",
      count: 2,
      totalMinutes: 1530,
      formatted: "25:30",
    });
  });

  test("全角数字と全角コロンを受け付ける", () => {
    expect(evaluateSumTimes("１：３０\n０：４５")).toEqual({
      kind: "ok",
      count: 2,
      totalMinutes: 135,
      formatted: "02:15",
    });
  });

  test("空行と前後の空白は無視する", () => {
    expect(evaluateSumTimes(" 1:00 \n\n\t\n 2:00")).toEqual({
      kind: "ok",
      count: 2,
      totalMinutes: 180,
      formatted: "03:00",
    });
  });

  test("CRLF の改行を扱える", () => {
    expect(evaluateSumTimes("1:00\r\n2:00")).toEqual({
      kind: "ok",
      count: 2,
      totalMinutes: 180,
      formatted: "03:00",
    });
  });

  test("空文字と空行だけなら empty", () => {
    expect(evaluateSumTimes("")).toEqual({ kind: "empty" });
    expect(evaluateSumTimes("\n  \n")).toEqual({ kind: "empty" });
  });

  test("分が2桁でない行は不正", () => {
    const result = evaluateSumTimes("1:5");
    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toContain("1行目");
  });

  test("分が60以上・負の値・形式違いは不正", () => {
    for (const input of ["1:60", "-1:30", "1:2:3", "abc", "1.5"]) {
      expect(evaluateSumTimes(input).kind).toBe("invalid");
    }
  });

  test("不正な行があれば有効な行があっても合計しない", () => {
    const result = evaluateSumTimes("1:00\n1:5\n2:00");
    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.message).toBe(
      "2行目「1:5」は HH:MM 形式ではありません"
    );
  });

  test("空行を含めて行番号を数える", () => {
    const result = evaluateSumTimes("\n\nbad");
    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.errors[0]?.lineNumber).toBe(3);
  });

  test("複数の不正な行をすべて返す", () => {
    const result = evaluateSumTimes("bad\n1:00\nalso bad");
    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.errors.map((error) => error.lineNumber)).toEqual([1, 3]);
  });

  test("長すぎる不正な行は省略して表示する", () => {
    const longLine = "a".repeat(30);
    const result = evaluateSumTimes(longLine);
    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.errors[0]?.message).toContain(`${"a".repeat(24)}…`);
  });

  test("大きすぎる時間は不正", () => {
    const result = evaluateSumTimes(`${"9".repeat(400)}:00`);
    expect(result.kind).toBe("invalid");
    if (result.kind !== "invalid") return;
    expect(result.errors[0]?.message).toBe("1行目の値が大きすぎます");
  });
});
