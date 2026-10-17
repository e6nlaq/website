// src/font/seed の woff2 を satori で使える TTF に変換し、src/font/og に出力する
// 実行: bun scripts/generate-og-fonts.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { decompress } from "wawoff2";

const weights: Array<[src: string, out: string]> = [
  ["Eb", "ExtraBold"],
  ["Bd", "Bold"],
];

const outDir = path.join(import.meta.dir, "../src/font/og");
await mkdir(outDir, { recursive: true });

for (const [src, out] of weights) {
  const input = await readFile(
    path.join(import.meta.dir, `../src/font/seed/LINESeedJP_OTF_${src}.woff2`)
  );
  const ttf = await decompress(input);
  await writeFile(
    path.join(outDir, `LINESeedJP_OTF_${out}.ttf`),
    Buffer.from(ttf)
  );
  console.log(`generated LINESeedJP_OTF_${out}.ttf`);
}
