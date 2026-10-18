import { expect, test, type Page } from "@playwright/test";
import { runUntilDone } from "./utils";

const QR_URL = "https://e6nlaq.vercel.app/";

/** 非表示の file input(hidden だが setInputFiles は可能) */
function fileInput(page: Page) {
  return page.locator('input[type="file"]');
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tools/qr-reader");
  await expect(
    page.getByText("「QRコード」は株式会社デンソーウェーブの登録商標です。")
  ).toBeVisible();
});

test("QRコードを含む画像からデータを読み取れる", async ({ page }) => {
  // onChange はハイドレーション後に有効になるため、結果が出るまでリトライ
  await runUntilDone({
    busy: () => page.getByText("読み取り中…").isVisible(),
    action: () => fileInput(page).setInputFiles("e2e/fixtures/qr-url.png"),
    done: () => page.getByText("読み取り結果").isVisible(),
  });

  await expect(page.getByLabel("読み取ったデータ")).toHaveValue(QR_URL);
  await expect(
    page.getByRole("img", { name: "読み取るQRコードを含む画像" })
  ).toBeVisible();
  // URL なので「リンクを開く」が出る
  await expect(page.getByRole("link", { name: "リンクを開く" })).toBeVisible();
  // リトライで成功トーストが重複し得るため first()
  await expect(
    page.getByText("QRコードを読み取りました").first()
  ).toBeVisible();
});

test("QRコードが無い画像は読み取れない", async ({ page }) => {
  await runUntilDone({
    busy: () => page.getByText("読み取り中…").isVisible(),
    action: () => fileInput(page).setInputFiles("e2e/fixtures/no-qr.png"),
    done: () =>
      page.getByText("この画像からQRコードを読み取れませんでした").isVisible(),
  });

  await expect(page.getByText("読み取り結果")).toHaveCount(0);
  await expect(
    page.getByText("QRコードが見つかりませんでした").first()
  ).toBeVisible();
});

test("画像以外のファイルは読み取れない", async ({ page }) => {
  await runUntilDone({
    busy: () => page.getByText("読み取り中…").isVisible(),
    action: async () => {
      await fileInput(page).setInputFiles({
        name: "not-image.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("hello"),
      });
    },
    done: () =>
      page.getByText("画像以外のデータは読み取れません").first().isVisible(),
  });

  // プレビューには出ていない
  await expect(
    page.getByRole("img", { name: "読み取るQRコードを含む画像" })
  ).toHaveCount(0);
});

test("リセットで初期状態に戻る", async ({ page }) => {
  await runUntilDone({
    busy: () => page.getByText("読み取り中…").isVisible(),
    action: () => fileInput(page).setInputFiles("e2e/fixtures/qr-url.png"),
    done: () => page.getByText("読み取り結果").isVisible(),
  });

  await page.getByRole("button", { name: "リセット" }).click();

  await expect(page.getByText("読み取り結果")).toHaveCount(0);
  await expect(page.getByText("クリックして画像を選択")).toBeVisible();
  await expect(page.getByText("リセットしました").first()).toBeVisible();
});
