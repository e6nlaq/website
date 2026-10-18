import { expect, type Locator } from "@playwright/test";

/**
 * ハイドレーション完了前に input イベントを発火すると React に onChange が
 * 届かず、hydration 後に controlled な値で上書きされ、入力が消えることが
 * ある(WebKit で顕著)。値が固定されるまで fill をリトライする。
 */
export async function fillStable(locator: Locator, value: string) {
  await expect
    .poll(
      async () => {
        await locator.fill(value);
        return locator.inputValue();
      },
      { timeout: 15_000 }
    )
    .toBe(value);
}
