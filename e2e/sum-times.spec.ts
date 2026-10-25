import { expect, type Page, test } from "@playwright/test";
import { fillStable } from "./utils";

const INPUT_STORAGE_KEY = "sum-times:input:v1";

function input(page: Page) {
  return page.getByLabel("時間");
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tools/sum-times");
  await expect(
    page.getByText("HH:MM形式の時間を1行ずつ入力すると、合計を計算します。")
  ).toBeVisible();
});

test("複数行の時間を合計して表示する", async ({ page }) => {
  await fillStable(input(page), "1:30\n0:45\n2:15");

  await expect(page.getByText("04:30", { exact: true })).toBeVisible();
  await expect(page.getByText("3件の合計")).toBeVisible();
  await expect(page.getByText("合計 270 分")).toBeVisible();
});

test("全角数字と全角コロンも合計できる", async ({ page }) => {
  await fillStable(input(page), "１：３０\n０：４５");

  await expect(page.getByText("02:15", { exact: true })).toBeVisible();
  await expect(page.getByText("2件の合計")).toBeVisible();
});

test("不正な行があるときは合計を表示せず行番号を示す", async ({ page }) => {
  await fillStable(input(page), "1:30\n1:5");

  await expect(
    page.getByText("2行目「1:5」は HH:MM 形式ではありません")
  ).toBeVisible();
  await expect(page.getByText("--:--", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "コピー" })).toBeDisabled();
});

test("空のときはプレースホルダーを表示する", async ({ page }) => {
  await expect(page.getByText("--:--", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "コピー" })).toBeDisabled();
});

test("合計をコピーできる", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          (window as Window & { __copiedText?: string }).__copiedText = value;
        },
      },
    });
  });
  await page.reload();

  await fillStable(input(page), "1:30\n0:45");
  await expect(page.getByText("02:15", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "コピー" }).click();

  await expect(page.getByText("合計をコピーしました")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __copiedText?: string }).__copiedText
      )
    )
    .toBe("02:15");
});

test("リセットは確認ダイアログを経て実行される", async ({ page }) => {
  await fillStable(input(page), "1:30");
  await expect(page.getByText("01:30", { exact: true })).toBeVisible();

  const dialog = page.getByRole("alertdialog");

  await page.getByRole("button", { name: "リセット" }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("リセットしますか?")).toBeVisible();

  await dialog.getByRole("button", { name: "キャンセル" }).click();
  await expect(dialog).toBeHidden();
  await expect(input(page)).toHaveValue("1:30");

  await page.getByRole("button", { name: "リセット" }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "リセット" }).click();

  await expect(input(page)).toHaveValue("");
  await expect(page.getByText("--:--", { exact: true })).toBeVisible();
  await expect(page.getByText("リセットしました")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), INPUT_STORAGE_KEY)
    )
    .toBeNull();
});

test("保存スイッチの状態に応じて入力を復元する", async ({ page }) => {
  const saveSwitch = page.getByRole("switch");

  await expect(saveSwitch).toBeChecked();
  await fillStable(input(page), "1:30");
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), INPUT_STORAGE_KEY)
    )
    .toBe("1:30");

  await page.reload();
  await expect(input(page)).toHaveValue("1:30");

  await saveSwitch.click();
  await expect(saveSwitch).not.toBeChecked();
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), INPUT_STORAGE_KEY)
    )
    .toBeNull();

  await page.reload();
  await expect(input(page)).toHaveValue("");
  await expect(saveSwitch).not.toBeChecked();

  await fillStable(input(page), "2:00");
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), INPUT_STORAGE_KEY)
    )
    .toBeNull();

  await saveSwitch.click();
  await expect(saveSwitch).toBeChecked();
  await expect
    .poll(() =>
      page.evaluate((key) => localStorage.getItem(key), INPUT_STORAGE_KEY)
    )
    .toBe("2:00");

  await page.reload();
  await expect(input(page)).toHaveValue("2:00");
});
