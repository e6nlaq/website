const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** 時刻の形式。"hh" は時間を0詰め(HH:MM:SS)、"h" は0詰めなし(H:MM:SS) */
export type ClockTimeFormat = "hh" | "h";

/** 現在時刻を指定した形式(ローカル時刻)で返す */
export function formatClockTime(
  date: Date,
  timeFormat: ClockTimeFormat = "hh"
): string {
  const hour =
    timeFormat === "h" ? String(date.getHours()) : pad2(date.getHours());
  return `${hour}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** 現在日付を YYYY-MM-DD (曜日) 形式(ローカル時刻)で返す */
export function formatClockDate(date: Date): string {
  const datePart = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  return `${datePart} (${WEEKDAYS[date.getDay()]})`;
}

/** UNIXエポック秒(小数切り捨て)を返す */
export function formatUnixTime(date: Date): string {
  return String(Math.floor(date.getTime() / 1000));
}

/** ミリ秒を小数点付き3桁(.SSS)で返す */
export function formatMilliseconds(date: Date): string {
  return `.${String(date.getMilliseconds()).padStart(3, "0")}`;
}
