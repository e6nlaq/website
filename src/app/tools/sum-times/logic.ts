/** 全角の数字・コロン・空白を半角に正規化する */
export function normalizeSumTimesInput(value: string): string {
  return value
    .replace(/[０-９]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0xfee0)
    )
    .replace(/：/g, ":")
    .replace(/\u3000/g, " ");
}

export interface SumTimesError {
  lineNumber: number;
  message: string;
}

export type SumTimesResult =
  | { kind: "empty" }
  | { kind: "invalid"; errors: SumTimesError[] }
  | {
      kind: "ok";
      count: number;
      totalMinutes: number;
      formatted: string;
    };

const LINE_PATTERN = /^(\d+):([0-5]\d)$/;
const MAX_ERROR_INPUT_LENGTH = 24;

function describeLine(line: string): string {
  return line.length > MAX_ERROR_INPUT_LENGTH
    ? `${line.slice(0, MAX_ERROR_INPUT_LENGTH)}…`
    : line;
}

/** 合計分数を HH:MM 形式(時間は2桁以上)にする */
export function formatTotalMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * 入力全体を評価する。空行は無視し、1行でも不正な行があれば invalid を返す
 * (不正な行を黙って除外すると合計を読み違えるため)。
 */
export function evaluateSumTimes(value: string): SumTimesResult {
  const lines = normalizeSumTimesInput(value).split("\n");
  const errors: SumTimesError[] = [];
  let count = 0;
  let totalMinutes = 0;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (line === "") return;

    const lineNumber = index + 1;
    const match = LINE_PATTERN.exec(line);
    if (match === null) {
      errors.push({
        lineNumber,
        message: `${lineNumber}行目「${describeLine(line)}」は HH:MM 形式ではありません`,
      });
      return;
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const lineMinutes = hours * 60 + minutes;
    if (!Number.isSafeInteger(lineMinutes)) {
      errors.push({
        lineNumber,
        message: `${lineNumber}行目の値が大きすぎます`,
      });
      return;
    }

    totalMinutes += lineMinutes;
    count += 1;
  });

  if (errors.length > 0) return { kind: "invalid", errors };
  if (count === 0) return { kind: "empty" };
  return {
    kind: "ok",
    count,
    totalMinutes,
    formatted: formatTotalMinutes(totalMinutes),
  };
}
