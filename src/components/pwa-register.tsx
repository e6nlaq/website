"use client";

import { useEffect } from "react";
// すべてのページで beforeinstallprompt を取りこぼさないよう、
// ストアのリスナーをレイアウト側でも読み込む
import "@/lib/install-prompt";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      // 本番ビルドを localhost で動かしたときの SW が残っていると、
      // dev のチャンクが古いキャッシュで配信されて壊れる。
      // 登録はしないが、既存の SW は最新の sw.js に更新しておく。
      navigator.serviceWorker
        .getRegistration("/")
        .then((registration) => registration?.update())
        .catch(() => {
          // 更新に失敗してもページの動作には影響させない
        });
      return;
    }

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {
          // 登録に失敗してもページの動作には影響させない
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
