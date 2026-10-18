const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** 現在時刻を HH:MM:SS 形式(ローカル時刻)で返す */
export function formatClockTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
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
