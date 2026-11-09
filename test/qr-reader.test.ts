import { describe, expect, test } from "bun:test";
import { classifyCameraError, nextCameraIndex } from "@/lib/camera";
import { getScaledSize } from "@/lib/image";

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

describe("classifyCameraError", () => {
  test("権限の拒否", () => {
    expect(classifyCameraError({ name: "NotAllowedError" })).toBe("denied");
    expect(classifyCameraError({ name: "SecurityError" })).toBe("denied");
  });
  test("カメラが見つからない", () => {
    expect(classifyCameraError({ name: "NotFoundError" })).toBe("not-found");
    expect(classifyCameraError({ name: "OverconstrainedError" })).toBe(
      "not-found"
    );
  });
  test("カメラが使用中", () => {
    expect(classifyCameraError({ name: "NotReadableError" })).toBe("in-use");
    expect(classifyCameraError({ name: "AbortError" })).toBe("in-use");
  });
  test("名前が取れない場合はunknown", () => {
    expect(classifyCameraError(null)).toBe("unknown");
    expect(classifyCameraError("error")).toBe("unknown");
    expect(classifyCameraError(new Error("boom"))).toBe("unknown");
  });
});

describe("nextCameraIndex", () => {
  test("次のカメラへ進む", () => {
    expect(nextCameraIndex(3, 0)).toBe(1);
    expect(nextCameraIndex(3, 1)).toBe(2);
  });
  test("最後のカメラの次は先頭に戻る", () => {
    expect(nextCameraIndex(2, 1)).toBe(0);
  });
  test("現在位置が見つからない場合は先頭を選ぶ", () => {
    expect(nextCameraIndex(3, -1)).toBe(0);
  });
  test("カメラがない場合は-1", () => {
    expect(nextCameraIndex(0, 0)).toBe(-1);
  });
});
