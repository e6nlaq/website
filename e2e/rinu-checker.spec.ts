import { expect, test, type Page } from "@playwright/test";
import { fillStable } from "./utils";

// 外部APIは必ずモックする(テストから実APIを叩かない)
async function mockApis(
  page: Page,
  dat: Record<string, unknown>,
  ipInfo: Record<string, unknown> | null
) {
  await page.route(/api\.activetk\.jp\/urlmin\//, (route) =>
    route.fulfill({ json: dat })
  );
  if (ipInfo !== null) {
    await page.route(/ipinfo\.io\//, (route) =>
      route.fulfill({ json: ipInfo })
    );
  } else {
    // ipinfo をブロックして「追加照会が失敗した」ケースにも耐えることを確認
    await page.route(/ipinfo\.io\//, (route) => route.abort());
  }
}

const baseCreator = {
  IPAddress: "192.0.2.10",
  MoreInformation: "https://www.ipinfo.io/192.0.2.10",
  TimeZone: "Asia/Tokyo",
  Location: "Tokyo, Japan",
};

test.beforeEach(async ({ page }) => {
  await page.goto("/tools/rinu-checker");
  // ナビにも同名タイトルがあるため、ページ固有の説明文で可視チェックする(SSR待ち)
  await expect(
    page.getByText("特定ツールとして使われるrinu.jpのリンクを入力することで")
  ).toBeVisible();
});

test("特定ツールではないリンクの詳細を表で表示する", async ({ page }) => {
  await mockApis(
    page,
    {
      status: "OK",
      LinkURL: "https://example.com/foo",
      CreatedDateTime: "2024-01-01T00:00:00",
      UsedCount: 3,
      LastUsed: "2024-01-02 192.0.2.1",
      CreatorInfo: baseCreator,
    },
    { postal: "100-0001", org: "AS12345 Example ISP" }
  );

  await fillStable(
    page.getByLabel("チェックするURL"),
    "https://rinu.jp/abc123"
  );
  await page.getByRole("button", { name: "チェック", exact: true }).click();

  await expect(page.getByText("特定ツールなし")).toBeVisible();
  await expect(page.getByText("Tokyo, Japan")).toBeVisible();
  await expect(page.getByText("100-0001")).toBeVisible();
  await expect(page.getByText("AS12345 Example ISP")).toBeVisible();
  await expect(page.getByRole("cell", { name: "使用回数" })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "3", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "https://example.com/foo" })
  ).toBeVisible();
  // 追加の注意書きも表示される
  await expect(page.getByText("参考程度にご利用ください")).toBeVisible();
});

test("特定ツールが仕込まれたリンクは判定と遷移先を実URLで表示する", async ({
  page,
}) => {
  await mockApis(
    page,
    {
      status: "OK",
      LinkURL: "https://tokutei.cf/?url=https%3A%2F%2Fexample.com%2Ftarget",
      CreatedDateTime: "2024-01-01T00:00:00",
      UsedCount: 7,
      LastUsed: "2024-01-02 192.0.2.1",
      CreatorInfo: baseCreator,
    },
    { postal: "100-0001", org: "AS12345 Example ISP" }
  );

  await fillStable(
    page.getByLabel("チェックするURL"),
    "https://rinu.jp/abc123"
  );
  await page.getByRole("button", { name: "チェック", exact: true }).click();

  await expect(page.getByText("特定ツールあり")).toBeVisible();
  // デコードされた遷移先がテーブルに表示される
  await expect(
    page.getByRole("link", { name: "https://example.com/target" })
  ).toBeVisible();
});

test("存在しないコードは404のエラーを表示する", async ({ page }) => {
  await mockApis(page, { status: "NG", type: 404 }, null);

  await fillStable(page.getByLabel("チェックするURL"), "https://rinu.jp/none");
  await page.getByRole("button", { name: "チェック", exact: true }).click();

  await expect(page.getByText("URLが存在しません")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("rinu以外のURLは入力エラーになる", async ({ page }) => {
  await mockApis(page, { status: "OK", LinkURL: "https://example.com" }, null);

  await fillStable(page.getByLabel("チェックするURL"), "https://example.com");
  await page.getByRole("button", { name: "チェック", exact: true }).click();

  await expect(
    page.getByText("rinu.cf または rinu.jp のURLを入力してください")
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
