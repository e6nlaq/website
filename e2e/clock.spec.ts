import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // プレースホルダー(SSR)が表示されること
  await page.goto("/tools/clock");
  await expect(page.getByRole("timer")).toHaveText("--:--:--");
});

test("HH:MM:SSが表示され、時刻が動く", async ({ page }) => {
  // hydration 後の実時刻への切替を待つ(最大で数秒かかり得る)
  const timer = page.getByRole("timer");
  await expect(timer).toHaveText(/^\d{2}:\d{2}:\d{2}$/, { timeout: 15_000 });

  const first = await timer.textContent();
  await page.waitForTimeout(1_200);
  // 少なくとも秒が進んで表示が変化する
  await expect(timer).not.toHaveText(first ?? "");
});

test("日付とUNIX秒が正しい形式で表示される", async ({ page }) => {
  const timer = page.getByRole("timer");
  await expect(timer).toHaveText(/^\d{2}:\d{2}:\d{2}$/, { timeout: 15_000 });

  const dateText = await page
    .getByText(/^\d{4}-\d{2}-\d{2} \(\S\)$/)
    .textContent();
  expect(dateText).toBeTruthy();

  // UNIX秒が現在時刻の±5秒以内であることを確認
  await expect
    .poll(async () => {
      const text = await page.getByTestId("unix-time").textContent();
      const unix = Number(text);
      return Math.abs(unix - Math.floor(Date.now() / 1000)) <= 5;
    })
    .toBe(true);

  // 数字にホバーするとUNIX秒という説明がtooltipで出る
  await page.getByTestId("unix-time").hover();
  await expect(page.getByText("UNIX秒", { exact: true })).toBeVisible();
});
