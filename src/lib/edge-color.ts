/** 画像の生ピクセル(sharp の raw 出力など) */
export interface PixelBuffer {
  data: Uint8Array;
  width: number;
  height: number;
  /** 1: グレースケール, 2: グレースケール+α, 3: RGB, 4: RGBA */
  channels: number;
}

/** 外周とみなす帯の幅(短辺に対する比率) */
export const EDGE_BAND_RATIO = 0.1;

const ALPHA_THRESHOLD = 128;
const QUANTIZE_SHIFT = 4;

const toHex = (value: number) =>
  Math.round(value).toString(16).padStart(2, "0");

/**
 * 画像の外周帯で最も多い色を #rrggbb で返す。
 * 透明(alpha < 128)の画素は無視し、近い色は 4bit に量子化してまとめる。
 * 有効な画素が 1 つもなければ null を返す。
 */
export function dominantEdgeColor(
  { data, width, height, channels }: PixelBuffer,
  bandRatio = EDGE_BAND_RATIO
): string | null {
  if (width <= 0 || height <= 0 || channels <= 0) return null;

  const shortSide = Math.min(width, height);
  const band = Math.max(
    1,
    Math.min(Math.round(shortSide * bandRatio), Math.floor((shortSide - 1) / 2))
  );
  const innerWidth = width - band * 2;
  const innerHeight = height - band * 2;

  const buckets = new Map<
    number,
    { count: number; r: number; g: number; b: number }
  >();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (
        x >= band &&
        x < band + innerWidth &&
        y >= band &&
        y < band + innerHeight
      ) {
        continue;
      }

      const index = (y * width + x) * channels;
      const alpha =
        channels === 2 || channels === 4 ? data[index + channels - 1]! : 255;
      if (alpha < ALPHA_THRESHOLD) continue;

      const r = data[index]!;
      const g = channels === 1 || channels === 2 ? r : data[index + 1]!;
      const b = channels === 1 || channels === 2 ? r : data[index + 2]!;
      const key =
        ((r >> QUANTIZE_SHIFT) << 8) |
        ((g >> QUANTIZE_SHIFT) << 4) |
        (b >> QUANTIZE_SHIFT);

      const bucket = buckets.get(key);
      if (bucket) {
        bucket.count += 1;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
      } else {
        buckets.set(key, { count: 1, r, g, b });
      }
    }
  }

  let best: { count: number; r: number; g: number; b: number } | undefined;
  for (const bucket of buckets.values()) {
    if (!best || bucket.count > best.count) best = bucket;
  }
  if (!best) return null;

  return `#${toHex(best.r / best.count)}${toHex(best.g / best.count)}${toHex(
    best.b / best.count
  )}`;
}
