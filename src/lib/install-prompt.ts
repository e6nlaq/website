export type InstallPromptState = {
  canInstall: boolean;
  isInstalled: boolean;
  isIos: boolean;
};

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const SERVER_STATE: InstallPromptState = {
  canInstall: false,
  isInstalled: false,
  isIos: false,
};

const LISTENERS_KEY = "__e6nlaqInstallPromptListeners";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedByEvent = false;
let state: InstallPromptState = SERVER_STATE;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: InstallPromptState) {
  if (
    next.canInstall === state.canInstall &&
    next.isInstalled === state.isInstalled &&
    next.isIos === state.isIos
  ) {
    return;
  }
  state = next;
  emit();
}

/**
 * iPadOS 13 以降は MacIntel を名乗るため、タッチ対応かどうかでも判定する。
 */
export function isIosDevice(
  userAgent: string,
  platform: string,
  maxTouchPoints: number
) {
  if (/iPad|iPhone|iPod/.test(userAgent)) return true;
  return platform === "MacIntel" && maxTouchPoints > 1;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const displayMode = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  return displayMode || iosStandalone || installedByEvent;
}

function refresh() {
  if (typeof window === "undefined") return;
  setState({
    canInstall: deferredPrompt !== null,
    isInstalled: isStandalone(),
    isIos: isIosDevice(
      window.navigator.userAgent,
      window.navigator.platform,
      window.navigator.maxTouchPoints
    ),
  });
}

function attachInstallPromptListeners() {
  if (typeof window === "undefined") return;
  const markedWindow = window as unknown as Record<string, unknown>;
  if (markedWindow[LISTENERS_KEY]) {
    refresh();
    return;
  }
  markedWindow[LISTENERS_KEY] = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    // 独自の Install ボタンから表示するため、ブラウザ既定のバナーは出さない
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    refresh();
  });

  window.addEventListener("appinstalled", () => {
    installedByEvent = true;
    deferredPrompt = null;
    refresh();
  });

  window
    .matchMedia("(display-mode: standalone)")
    .addEventListener("change", refresh);

  refresh();
}

// ハイドレーション前に beforeinstallprompt が発火しても取りこぼさないよう、
// モジュールの読み込み時点で購読する。
if (typeof window !== "undefined") {
  attachInstallPromptListeners();
}

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getInstallPromptState() {
  return state;
}

export function getServerInstallPromptState() {
  return SERVER_STATE;
}

export async function promptInstall(): Promise<InstallOutcome> {
  const promptEvent = deferredPrompt;
  if (!promptEvent) return "unavailable";

  deferredPrompt = null;
  refresh();

  try {
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    return outcome;
  } catch {
    return "unavailable";
  }
}
