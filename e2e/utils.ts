import { expect, type Locator } from "@playwright/test";

/**
 * ハイドレーション完了前に入力やクリックを発火すると、イベントが React に
 * 届かず hydration 後に controlled な値で上書きされて、操作が「実行され
 * なかった」ことになる(WebKit で顕著)。
 * action を condition が満たされるまでリトライする。軽量で副作用が冪等な
 * 操作(fill・button クリック等)向け。
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
 * 処理中(busy)フラグがある操作向け。busy の間は再実行せず待機し、
 * 空いていたら action を実行して done を確認する。
 * ファイル読み取りのように、実行を重ねると toast が重複する操作向け。
 */
export async function runUntilDone(opts: {
  busy: () => Promise<boolean>;
  action: () => Promise<unknown>;
  done: () => Promise<boolean>;
  timeout?: number;
}) {
  await expect
    .poll(
      async () => {
        if (await opts.busy()) return false;
        if (await opts.done()) return true;
        await opts.action();
        return false;
      },
      { timeout: opts.timeout ?? 15_000 }
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
