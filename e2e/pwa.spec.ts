import { expect, test } from "@playwright/test";
import { retryUntil } from "./utils";

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

function pngSize(png: Buffer) {
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

test("manifest が PWA の要件を満たす", async ({ request }) => {
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain(
    "application/manifest+json"
  );

  const manifest = await response.json();
  expect(manifest.name).toBe("e6nlaq's Lab");
  expect(manifest.short_name).toBe("e6nlaq's Lab");
  expect(manifest.id).toBe("/");
  expect(manifest.start_url).toBe("/");
  expect(manifest.scope).toBe("/");
  expect(manifest.display).toBe("standalone");
  expect(manifest.lang).toBe("ja");
  expect(manifest.background_color).toBe("#f1f1f1");
  expect(manifest.theme_color).toBe("#ffffff");
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      }),
      expect.objectContaining({
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      }),
      expect.objectContaining({
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      }),
    ])
  );
  expect(manifest.shortcuts).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: "Tools", url: "/tools" }),
      expect.objectContaining({ name: "QR Reader", url: "/tools/qr-reader" }),
    ])
  );
});

test("PWA アイコンが正しいサイズで配信される", async ({ request }) => {
  const icons = [
    ["/icon-192.png", 192],
    ["/icon-512.png", 512],
    ["/icon-maskable-512.png", 512],
    ["/favicon.png", 500],
  ] as const;

  for (const [path, size] of icons) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");

    const { width, height } = pngSize(await response.body());
    expect({ width, height }).toEqual({ width: size, height: size });
  }

  const favicon = await request.get("/favicon.svg");
  expect(favicon.ok()).toBe(true);
  expect(favicon.headers()["content-type"]).toContain("image/svg+xml");
});

test("トップページが manifest とアイコンを参照する", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest"
  );
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/favicon.svg"
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/favicon.png"
  );
});

test("ツールページでも apple-touch-icon は favicon.png を使う", async ({
  page,
}) => {
  await page.goto("/tools/qr-reader");

  await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
    "href",
    "/icon/qr-reader.png"
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/favicon.png"
  );
});

test("Service Worker とオフラインページが配信される", async ({ request }) => {
  const serviceWorker = await request.get("/sw.js");
  expect(serviceWorker.ok()).toBe(true);
  expect(serviceWorker.headers()["content-type"]).toContain("javascript");
  expect(serviceWorker.headers()["cache-control"]).toContain("max-age=0");
  expect(serviceWorker.headers()["service-worker-allowed"]).toBe("/");
  expect(await serviceWorker.text()).toContain("/offline.html");

  const offline = await request.get("/offline.html");
  expect(offline.ok()).toBe(true);
  expect(offline.headers()["content-type"]).toContain("text/html");
  expect(await offline.text()).toContain("オフラインです");
});

test("オフライン時はオフラインページを表示する", async ({ page, context }) => {
  await page.goto("/");

  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.goto("/tools/sum-times");

  await expect(
    page.getByRole("heading", { name: "オフラインです" })
  ).toBeVisible();
});

test.describe("iOS", () => {
  test.use({ userAgent: IPHONE_UA });

  test("Install ボタンからホーム画面への追加手順を表示する", async ({
    page,
  }) => {
    await page.goto("/");

    const installButton = page.getByRole("button", { name: "Install" });
    await expect(installButton).toBeVisible();

    await retryUntil(
      () => installButton.click(),
      async () => page.getByRole("alertdialog").isVisible()
    );

    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toContainText("ホーム画面に追加");
    await expect(dialog).toContainText("共有ボタン");

    await dialog.getByRole("button", { name: "閉じる" }).click();
    await expect(dialog).toBeHidden();
  });
});
