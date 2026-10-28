import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  prepareZXingModule,
  readBarcodes,
  ZXING_WASM_SHA256,
} from "zxing-wasm/reader";

const root = path.join(import.meta.dir, "..");
/** postinstall(scripts/copy-zxing-wasm.ts)で zxing-wasm のものに同期される */
const wasm = readFileSync(path.join(root, "public/zxing_reader.wasm"));

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
}

describe("zxing の wasm", () => {
  test("zxing-wasm と同じバージョンの wasm を公開している", () => {
    expect(createHash("sha256").update(wasm).digest("hex")).toBe(
      ZXING_WASM_SHA256
    );
  });

  test("壊れていない wasm モジュールである", () => {
    expect(WebAssembly.validate(toArrayBuffer(wasm))).toBe(true);
  });

  test("公開している wasm でQRコードを読み取れる", async () => {
    // ネットワークを使わず、public の wasm をそのまま使わせる
    prepareZXingModule({
      overrides: { wasmBinary: toArrayBuffer(wasm) },
    });

    const png = readFileSync(path.join(root, "e2e/fixtures/qr-url.png"));
    const [result] = await readBarcodes(new Uint8Array(png), {
      formats: ["QRCode"],
      tryHarder: true,
    });

    expect(result?.text).toBe("https://e6nlaq.vercel.app/");
  });
});
