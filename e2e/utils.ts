import { expect, type Locator } from "@playwright/test";

/**
 * ハイドレーション完了前に入力やクリックを発火すると、イベントが React に
 * 届かず hydration 後に controlled な値で上書きされて、操作が「実行され
 * なかった」ことになる(WebKit で顕著)。
 * action を condition が満たされるまでリトライする。
 */
export async function retryUntil(
  action: () => Promise<unknown>,
  condition: () => Promise<boolean>,
  timeout = 15_000
) {
  await expect
    .poll(
      async () => {
        await action();
        return condition();
      },
      { timeout }
    )
    .toBe(true);
}

/**
 * ハイドレーションを考慮した fill。値が入力欄に固定されるまでリトライする。
 */
export async function fillStable(locator: Locator, value: string) {
  return retryUntil(
    () => locator.fill(value),
    async () => (await locator.inputValue()) === value
  );
}
