/** シートの見た目の設定 */
export interface SheetSettings {
  /** シートの色(#rrggbb) */
  color: string;
  /** 不透明度(0〜1) */
  opacity: number;
}

/** ワンタップで選べるシートの色 */
export const SHEET_COLORS = [
  { value: "#ff0000", label: "赤" },
  { value: "#0000ff", label: "青" },
  { value: "#00c000", label: "緑" },
  { value: "#ffff00", label: "黄" },
] as const;

export const DEFAULT_SETTINGS: SheetSettings = {
  color: "#ff0000",
  opacity: 1,
};

export const SETTINGS_STORAGE_KEY = "red-sheet:settings:v1";

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/** 保存値や外部入力を、安全な設定値へ整える */
export function normalizeSettings(value: unknown): SheetSettings {
  if (typeof value !== "object" || value === null) return DEFAULT_SETTINGS;
  const record = value as { color?: unknown; opacity?: unknown };
  const color =
    typeof record.color === "string" && HEX_COLOR_PATTERN.test(record.color)
      ? record.color.toLowerCase()
      : DEFAULT_SETTINGS.color;
  const opacity =
    typeof record.opacity === "number" && Number.isFinite(record.opacity)
      ? Math.min(1, Math.max(0, record.opacity))
      : DEFAULT_SETTINGS.opacity;
  return { color, opacity };
}

/** 保存した設定を読み込む(読めない場合は既定値) */
export function readSettings(): SheetSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw === null) return DEFAULT_SETTINGS;
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** 設定を保存する(保存できない環境では何もしない) */
export function writeSettings(settings: SheetSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // 容量超過やプライベートブラウジングでは保存しない
  }
}
