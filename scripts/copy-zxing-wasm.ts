// zxing-wasm が配信する wasm を public にそろえる(zxing-wasm 更新時の差し替え忘れを防ぐ)
// 実行: bun scripts/copy-zxing-wasm.ts(postinstall から自動で実行される)
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const source = path.join(
  import.meta.dir,
  "../node_modules/zxing-wasm/dist/reader/zxing_reader.wasm"
);
const destination = path.join(import.meta.dir, "../public/zxing_reader.wasm");

if (!existsSync(source)) {
  console.error(
    "zxing-wasm の wasm が見つかりません。bun install を実行してください。"
  );
  process.exit(1);
}

const sourceBytes = readFileSync(source);
const currentBytes = existsSync(destination)
  ? readFileSync(destination)
  : undefined;

if (currentBytes?.equals(sourceBytes)) {
  console.log("public/zxing_reader.wasm は最新です");
} else {
  writeFileSync(destination, sourceBytes);
  console.log("public/zxing_reader.wasm を zxing-wasm のものに更新しました");
}
