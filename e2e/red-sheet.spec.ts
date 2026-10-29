import { expect, test, type Page } from "@playwright/test";
import { runUntilDone } from "./utils";

/** 非表示の file input(hidden だが setInputFiles は可能) */
function fileInput(page: Page) {
  return page.locator('input[type="file"]');
}

function sheet(page: Page) {
  return page.getByRole("group", { name: "赤シート" });
}

async function uploadPhoto(page: Page) {
  await runUntilDone({
    busy: () => page.getByText("読み込み中…").isVisible(),
    action: () =>
      fileInput(page).setInputFiles("e2e/fixtures/red-sheet-photo.png"),
    done: () => page.getByText("ビューア", { exact: true }).isVisible(),
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tools/red-sheet");
  await expect(
    page.getByText("撮った写真に、動かせる赤シートを重ねます。")
  ).toBeVisible();
});

test("画像を選ぶとシートが表示され、ドラッグで動かせる", async ({ page }) => {
  await uploadPhoto(page);
  await expect(sheet(page)).toBeVisible();

  const before = await sheet(page).boundingBox();
  expect(before).not.toBeNull();
  if (!before) return;

  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    before.x + before.width / 2 + 40,
    before.y + before.height / 2 + 20,
    { steps: 5 }
  );
  await page.mouse.up();

  await expect
    .poll(async () => (await sheet(page).boundingBox())?.x ?? 0)
    .toBeGreaterThan(before.x + 20);
});

test("シートの表示を切り替えられる", async ({ page }) => {
  await uploadPhoto(page);
  await page.getByRole("button", { name: "シートを隠す" }).click();
  await expect(sheet(page)).toHaveCount(0);
  await page.getByRole("button", { name: "シートを表示" }).click();
  await expect(sheet(page)).toBeVisible();
});

test("設定から色を変えられる", async ({ page }) => {
  await uploadPhoto(page);
  await page.getByRole("button", { name: "シートの設定" }).click();
  await expect(page.getByText("シートの設定")).toBeVisible();

  const blue = page.getByRole("button", { name: "青" });
  await blue.click();
  await expect(blue).toHaveAttribute("aria-pressed", "true");
});

test("不透明度を変えられる", async ({ page }) => {
  await uploadPhoto(page);
  await page.getByRole("button", { name: "シートの設定" }).click();
  const slider = page.getByRole("slider", { name: "不透明度" });
  await expect(slider).toHaveAttribute("aria-valuenow", "100");

  await slider.focus();
  await slider.press("ArrowLeft");
  await expect(slider).toHaveAttribute("aria-valuenow", "99");
  await expect(page.getByText(/^99%/)).toBeVisible();
});

test("色の設定は再読み込み後も残る", async ({ page }) => {
  await uploadPhoto(page);
  await page.getByRole("button", { name: "シートの設定" }).click();
  await page.getByRole("button", { name: "青" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByText("シートの設定")).toBeHidden();

  await page.reload();
  await uploadPhoto(page);
  await page.getByRole("button", { name: "シートの設定" }).click();
  await expect(page.getByRole("button", { name: "青" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("撮り直すと最初の画面に戻る", async ({ page }) => {
  await uploadPhoto(page);
  await page.getByRole("button", { name: "撮り直す" }).click();
  await expect(page.getByText("ビューア", { exact: true })).toHaveCount(0);
  await expect(page.getByText("クリックして画像を選択")).toBeVisible();
});

test("全画面の表示を切り替えられる", async ({ page }) => {
  await uploadPhoto(page);
  await page.getByRole("button", { name: "全画面で表示" }).click();
  const exit = page.getByRole("button", { name: "全画面を解除" });
  await expect(exit).toBeVisible();
  await exit.click();
  await expect(
    page.getByRole("button", { name: "全画面で表示" })
  ).toBeVisible();
});

test("シートを重ねたPNGを保存できる", async ({ page }) => {
  await uploadPhoto(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNGで保存" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^red-sheet-\d{8}-\d{6}\.png$/);
  await expect(page.getByText("PNGを保存しました")).toBeVisible();
});
