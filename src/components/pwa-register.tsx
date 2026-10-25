"use client";

import { useEffect } from "react";
// すべてのページで beforeinstallprompt を取りこぼさないよう、
// ストアのリスナーをレイアウト側でも読み込む
import "@/lib/install-prompt";

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

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
