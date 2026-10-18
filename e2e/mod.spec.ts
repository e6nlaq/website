import { expect, test } from "@playwright/test";
import { fillStable } from "./utils";

// 例値(有理数 mod)に対する再構成結果は solve() の動作から不変に定まる。
// `bun run` で solve() を実行して算出した期待値をハードコードしている。
const expectedResults = ["65 / 6", "10 / 3"];

test.beforeEach(async ({ page }) => {
  await page.goto("/tools/mod");
  await expect(
    page.getByText(
      "有理数modから元の有理数として考えられるものを1つ復元します。"
    )
  ).toBeVisible();
});

test("例の値から元の有理数を復元できる", async ({ page }) => {
  const valbox = page.getByLabel("val");
  await expect
    .poll(async () => {
      await page.getByRole("button", { name: "例を入力" }).click();
      return valbox.inputValue();
    })
    .toBe("831870305\n332748121");

  await page.getByRole("button", { name: "計算", exact: true }).click();

  for (const result of expectedResults) {
    await expect(page.getByText(result)).toBeVisible();
  }
  await expect(page.getByText("No.1 831870305")).toBeVisible();
  await expect(page.getByText("No.2 332748121")).toBeVisible();
  await expect(page.getByText("計算が全て完了しました")).toBeVisible();
  await expect(page.getByRole("button", { name: "計算中…" })).toBeHidden();
  await expect(
    page.getByRole("button", { name: "計算", exact: true })
  ).toBeEnabled();
});

test("未入力のままで計算しようとするとエラーが表示される", async ({ page }) => {
  await page.getByRole("button", { name: "計算", exact: true }).click();

  await expect(page.getByText("値を入力してください")).toBeVisible();
  await expect(page.getByText("計算結果")).toHaveCount(0);
});

test("数値以外の入力はエラーになる", async ({ page }) => {
  await fillStable(page.getByLabel("val"), "3.14");
  await page.getByRole("button", { name: "計算", exact: true }).click();

  await expect(
    page.getByText("数値を入力してください", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("計算結果")).toHaveCount(0);
});

test("mod 以上の val はエラーになる", async ({ page }) => {
  await fillStable(page.getByLabel("val"), "998244354");
  await page.getByRole("button", { name: "計算", exact: true }).click();

  await expect(page.getByText("val < modである必要があります")).toBeVisible();
  await expect(page.getByText("計算結果")).toHaveCount(0);
});

test("31 桁以上の limit はエラーになる", async ({ page }) => {
  await fillStable(page.getByLabel("val"), "1");
  await fillStable(page.getByLabel("limit"), "1234567890123456789012345678901");
  await page.getByRole("button", { name: "計算", exact: true }).click();

  await expect(
    page.getByText("30桁以内で入力してください", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("計算結果")).toHaveCount(0);
});
