import { describe, expect, test } from "bun:test";
import { dominantEdgeColor, type PixelBuffer } from "@/lib/edge-color";

function createImage(
  width: number,
  height: number,
  channels: number,
  pixel: (x: number, y: number) => number[]
): PixelBuffer {
  const data = new Uint8Array(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const values = pixel(x, y);
      const start = (y * width + x) * channels;
      for (let channel = 0; channel < channels; channel++) {
        data[start + channel] = values[channel] ?? 0;
      }
    }
  }
  return { data, width, height, channels };
}

describe("dominantEdgeColor", () => {
  test("外周帯で最も多い色を返す", () => {
    // 外周 1px が赤、内側は白
    const image = createImage(10, 10, 4, (x, y) =>
      x === 0 || y === 0 || x === 9 || y === 9
        ? [255, 0, 0, 255]
        : [255, 255, 255, 255]
    );
    expect(dominantEdgeColor(image)).toBe("#ff0000");
  });

  test("内側の色は数えない", () => {
    // 外周は青、内側の大半は白
    const image = createImage(20, 20, 4, (x, y) =>
      x < 2 || y < 2 || x >= 18 || y >= 18
        ? [0, 0, 255, 255]
        : [255, 255, 255, 255]
    );
    expect(dominantEdgeColor(image)).toBe("#0000ff");
  });

  test("透明な画素は無視する", () => {
    const image = createImage(10, 10, 4, (x, y) =>
      x === 0 && y === 0 ? [0, 128, 0, 255] : [0, 0, 0, 0]
    );
    expect(dominantEdgeColor(image)).toBe("#008000");
  });

  test("近い色はまとめて平均する", () => {
    const image = createImage(10, 10, 4, (x) =>
      x % 2 === 0 ? [255, 0, 0, 255] : [248, 0, 0, 255]
    );
    expect(dominantEdgeColor(image)).toBe("#fc0000");
  });

  test("有効な画素がなければ null", () => {
    const image = createImage(10, 10, 4, () => [0, 0, 0, 0]);
    expect(dominantEdgeColor(image)).toBeNull();
  });

  test("アルファなしの RGB も扱える", () => {
    const image = createImage(10, 10, 3, () => [0, 0, 255]);
    expect(dominantEdgeColor(image)).toBe("#0000ff");
  });

  test("bandRatio を大きくすると内側まで対象になる", () => {
    // 外周 10px が赤、内側は青
    const image = createImage(100, 100, 4, (x, y) =>
      x < 10 || y < 10 || x >= 90 || y >= 90
        ? [255, 0, 0, 255]
        : [0, 0, 255, 255]
    );
    expect(dominantEdgeColor(image)).toBe("#ff0000");
    expect(dominantEdgeColor(image, 0.3)).toBe("#0000ff");
  });
});
