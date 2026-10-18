# AGENTS.md - e6nlaq's Lab

このリポジトリで作業する AI エージェント用のガイドです。**GEMINI.md の一部の記載(Biome、Rust/WASM 等)は古いため、このファイルを正としてください。**

## プロジェクト概要

**e6nlaq's Lab**(https://e6nlaq.vercel.app)— 個人サイト兼ツール集。数学・競技プログラミング・便利ツールを公開している。UI はすべて**日本語**(ツール名など個別の固有名詞は英語も可)。

## 技術スタック

| 分類           | 技術                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| フレームワーク | **Next.js 16(App Router)** + React 19.3 / Turbopack                                                                                        |
| 言語           | TypeScript(strict、エイリアス `@/*` → `./src/*`)                                                                                           |
| スタイリング   | **Tailwind CSS v4**(設定は `src/app/globals.css` の CSS 変数。tailwind.config なし)                                                        |
| UI ライブラリ  | **shadcn/ui(スタイル: `base-maia`)** = **Base UI(`@base-ui/react`)** 系。Radix ではないため `asChild` でなく**`render` prop** で置き換える |
| アイコン       | `lucide-react`(Button 内では `data-icon="inline-start"` / `"inline-end"` を付ける)                                                         |
| フォーム       | zod + react-hook-form + `@hookform/resolvers`(例: `tools/mod`, `tools/ajl-simulator`)                                                      |
| トースト       | sonner(`toast.success/error/info`)                                                                                                         |
| テーマ         | next-themes(3 状態切替)                                                                                                                    |
| e2e テスト     | **Playwright**(`test:e2e`。ローカルは Chromium、CI(`CI=true`)では Firefox / WebKit も実行)                                                 |
| その他         | recharts(グラフ)、motion、、jsqr / zxing-wasm(QR Reader)                                                                                   |

## パッケージ管理・実行環境

- **Bun**(mise でバージョン固定)。npm/yarn/pnpm は使わない。

## コマンド(CI と同じ)

| コマンド                                          | 内容                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------- |
| `bun run dev` / `bun run build` / `bun run start` | Next.js(dev は Turbopack)                                             |
| `bun run lint`                                    | **oxlint**(`.oxlintrc.json`。correctness = error)                     |
| `bun run format` / `bun run format:check`         | **oxfmt**(`.oxfmtrc.json`: 2 スペース、ダブルクォート、printWidth 80) |
| `bun check`                                       | 高速な型チェック(`tsc --noEmit` 相当)                                 |
| `bun test`                                        | Bun 組込みテストランナー                                              |
| `bun run test:e2e`                                | Playwright(`e2e/*.spec.ts`)。dev サーバを自動起動して実行             |

- コード検証はすべて **Bun で行う**。型チェックは **`tsc` でなく `bun check` を使う**。
- **Biome は使用していない**(oxlint + oxfmt)。Husky ではなく **lefthook**。コミットは commitlint(conventional commits)準拠。

## ディレクトリ構成

- `src/app/` — ページ(`tools/*`、`about` 等)、`route.ts`(API。`teapot` は Elysia)、`sitemap.ts`(toolMeta から自動生成)
- `src/components/ui/` — shadcn コンポーネント(生成物に近い。改変には注意)
- `src/components/tool-card.tsx` — ツール入力カード(`ToolCard`)
- `src/hooks/useConfirm.tsx` — Promise 型の確認ダイアログ `useConfirm()`
- `src/lib/` — `metadata.ts`(`convertMetadata`)、`layout.ts`(`NoneStyle`)、`utils.ts`(`cn`)
- `src/text/meta.ts` — **全ページのメタデータ登録の唯一の窓口**(`toolMeta`)。nav のタイトル・SEO・sitemap はここから派生
- `src/types/meta.ts` — `ToolMeta` 型(`title/description/logo?/index?/keywords?`)
- `public/` — `icon/<tool>.png`(一覧アイコン)、`zxing_reader.wasm`(自己ホストする wasm)
- `test/` — **ユニットテストは純粋なロジックのみ**(bun:test + `@/` エイリアス可)。ページコンポーネントはテストしない
- `e2e/` + `playwright.config.ts` — **e2e テスト**(Playwright)。サーバ起動は設定の `webServer`(`bun run dev --port 3000`)に任せる。失敗時のレポートは `test-results/`・`playwright-report/`(gitignore 済み)

## 新しいツールを追加する手順

1. `src/app/tools/<id>/layout.tsx` を作る(定型):

   ```tsx
   import NoneStyle from "@/lib/layout";
   import { convertMetadata } from "@/lib/metadata";
   import { toolMeta } from "@/text/meta";

   export const metadata = convertMetadata(toolMeta["tools/<id>"]);
   export default NoneStyle;
   ```

2. `src/app/tools/<id>/page.tsx` — `ToolCard` が入力部の外殻
3. **`src/text/meta.ts` に登録**(title/description/logo/keywords)。sitemap・SEO・ツール一覧の名前は自動反映
4. **`src/app/tools/page.tsx` の分類(Math / Competitive Programming / Utility / Maker)に追加**
5. アイコンは任意 → `public/icon/<id>.png` に置き meta の `logo` に指定(省略時は favicon 扱い)

## 重要な慣習

- **`ToolCard` はツールへの「入力」カード専用。** 入力クリア(reset)などの操作を持つ。**結果表示などの後段カードでは `Card`(shadcn)を直接**使用する
- リンクをボタン風にする場合は `buttonVariants()` を `<a>` に付与する。**`<Button render={<a>} nativeButton={false} />` は禁止**(Base UI の Button は常に `role="button"` を付け、リンク意味論が失われる。ui.shadcn.com の Button「As Link」参照)
- フォーム構成は `FieldGroup` / `Field` / `FieldLabel`(`htmlFor` とコントロールの id を必ず対応)+ `FieldDescription` / `FieldError`。検証状態は `data-invalid`(Field)と `aria-invalid`(コントロール)
- 読み込み中のテキストは省略記号 `…` で終える(例: 「読み取り中…」)
- `clipboard.read()` はファイル非対応。ファイルとしてコピーされた画像はペーストイベントの `clipboardData.files`(+`items`)で受ける
- `onPaste` で `preventDefault` はしない(Web Interface Guidelines のアンチパターン)
- グローバルイベントリスナは `useEffect` で cleanup、ハンドラは ref で安定化
- 静的な JSX や RegExp はレンダーの外へ hoist する
- 大きな計算は Web Worker(`tools/mod` の `solve.worker.ts` が例)
- 結果やデータのコピーは `navigator.clipboard` + sonner トーストで成功/失敗を必ず通知。エラーには次の手順を示す文言を添える
- 画像は `next/image` を使い、`width` / `height` を必ず渡す。CSS で片方だけリサイズするとアスペクト比が壊れるので、もう片方に `auto`(`w-auto` 等)を付ける

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
