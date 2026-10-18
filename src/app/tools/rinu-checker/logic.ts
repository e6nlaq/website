/**
 * rinu.jp Checker 2 の判定ロジック。
 * 旧 https://e6nlaq.github.io/rinucf-checker の移植分。
 * ページコンポーネントに依存しない純粋関数群として切り出している。
 */

// 旧版と同じ入力ルール:rinu.cf / rinu.jp 直下のパスのみ
const RINU_URL_PATTERN = /^https?:\/\/rinu\.(?:cf|jp)\/[\w/:%#$&?()~.=+-]+$/;

// 特定ツール本体へのリンク
const TOKUTEI_URL_PATTERN =
  /^https?:\/\/(?:tokutei\.cf|tokutei\.end2end\.tech)\/\?url=/;

/** 作成者情報(activetk.jp API の CreatorInfo) */
export interface CreatorInfo {
  IPAddress: string;
  MoreInformation: string;
  TimeZone: string;
  Location: string;
}

/** api.activetk.jp/urlmin の応答。未定義フィールドはそのまま nullable 扱い */
export interface UrlminResponse {
  status?: string;
  type?: number;
  LinkURL?: string;
  CreatedDateTime?: string;
  UsedCount?: number;
  LastUsed?: string;
  CreatorInfo?: Partial<CreatorInfo>;
}

/** ipinfo.io の応答で使うフィールド */
export interface IpInfo {
  postal?: string;
  org?: string;
}

/** チェックが成功した場合の詳細 */
export interface RinuCheckResult {
  /** 特定ツール(tokutei.cf など)経由か */
  tokutei: boolean;
  /** 遷移先となるリンクの実URL */
  targetUrl: string;
  createdAt: string;
  usedCount: number;
  /** 最後に使用したユーザーのIPアドレス */
  lastUsedIp: string;
  creator: CreatorInfo;
}

export type CheckOutcome =
  | { kind: "error"; type: number | undefined; message: string }
  | { kind: "ok"; result: RinuCheckResult };

/** チェック結果テーブルの1行 */
export interface DetailRow {
  label: string;
  value: string;
  /** リンクとして表示する場合の href */
  href?: string;
}

/** rinu.cf / rinu.jp のURLから、リンク先コード(パス部分)を抜き出す。
 * スキーム(https:// / http://)は省略できる。その場合は https として扱う。
 */
export function extractRinuCode(url: string): string | null {
  const normalized = /^https?:\/\//.test(url) ? url : `https://${url}`;
  if (!RINU_URL_PATTERN.test(normalized)) return null;
  return normalized.replace(/^https?:\/\/rinu\.(?:cf|jp)\//, "");
}

/** 特定ツールへのリンクかどうか */
export function isTokuteiUrl(url: string): boolean {
  return TOKUTEI_URL_PATTERN.test(url);
}

/**
 * 特定ツールリンク内 `?url=` パラメータの値(デコード済み)を取り出す。
 * 旧版の getParam() 相当(searchParams は + を空白に展開する点も同じ)。
 */
export function extractTokuteiTarget(link: string): string {
  try {
    return new URL(link).searchParams.get("url") ?? "";
  } catch {
    return "";
  }
}

/** 表示用に可能な限りデコードする。無効なシーケンスはそのまま */
export function decodeDisplayUrl(url: string): string {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
}

/** API由来のURLをリンク化してよいか判定する。http(s)以外のスキーム(javascript: 等)はリンクにしない */
export function safeHttpHref(url: string): string | undefined {
  return /^https?:\/\//i.test(url) ? url : undefined;
}

export function buildUrlminApi(code: string): string {
  return `https://api.activetk.jp/urlmin/get&code=${encodeURIComponent(code)}`;
}

export function ipInfoUrl(ip: string): string {
  return `https://www.ipinfo.io/${ip}/json`;
}

/** activetk.jp API の応答を判定結果に変換する */
export function parseUrlminResponse(dat: UrlminResponse): CheckOutcome {
  if (dat.status !== "OK") {
    return {
      kind: "error",
      type: dat.type,
      message:
        dat.type === 404
          ? "URLが存在しません。もう一度お確かめの上、再試行してください。(404)"
          : `申し訳ございません。予期せぬエラーが発生しました。(${dat.type ?? "不明"})`,
    };
  }

  const link = dat.LinkURL ?? "";
  const tokutei = isTokuteiUrl(link);
  // LastUsed 内の空白区切りの最後のトークンがIP(旧版は substring(11) で決め打ちしていたが、
  // 曜日や時刻など部分フォーマットの差異に壊れにくい形で同等に取得する)
  const lastUsed = dat.LastUsed ?? "";
  const lastUsedIp = lastUsed.trim().split(/\s+/).pop() ?? "";

  return {
    kind: "ok",
    result: {
      tokutei,
      targetUrl: tokutei ? extractTokuteiTarget(link) : link,
      createdAt: dat.CreatedDateTime ?? "",
      usedCount: dat.UsedCount ?? 0,
      lastUsedIp,
      creator: {
        IPAddress: dat.CreatorInfo?.IPAddress ?? "",
        MoreInformation: dat.CreatorInfo?.MoreInformation ?? "",
        TimeZone: dat.CreatorInfo?.TimeZone ?? "",
        Location: dat.CreatorInfo?.Location ?? "",
      },
    },
  };
}

/**
 * 結果テーブルの行を組み立てる。
 * ipInfo は ipinfo.io の追加照会が成功した場合のみ渡す。
 */
export function buildResultRows(
  result: RinuCheckResult,
  ipInfo: IpInfo | null
): DetailRow[] {
  const unavailable = "取得できませんでした";
  return [
    {
      label: "作成者IPアドレス",
      value: result.creator.IPAddress || unavailable,
      href: safeHttpHref(result.creator.MoreInformation),
    },
    {
      label: "作成者タイムゾーン",
      value: result.creator.TimeZone || unavailable,
    },
    {
      label: "IPからわかる場所",
      value: result.creator.Location || unavailable,
    },
    { label: "郵便番号", value: ipInfo?.postal || unavailable },
    { label: "ASN", value: ipInfo?.org || unavailable },
    {
      label: "遷移先URL",
      value: decodeDisplayUrl(result.targetUrl) || unavailable,
      href: safeHttpHref(result.targetUrl),
    },
    { label: "作成日", value: result.createdAt || unavailable },
    { label: "使用回数", value: String(result.usedCount) },
    {
      label: "最後に使用したユーザーのIPアドレス",
      value: result.lastUsedIp || unavailable,
      href: result.lastUsedIp
        ? `https://ipinfo.io/${result.lastUsedIp}`
        : undefined,
    },
  ];
}

/** 結果一式をクリップボード用のテキストにする */
export function buildResultText(tokutei: boolean, rows: DetailRow[]): string {
  return [
    `判定: ${tokutei ? "特定ツールあり" : "特定ツールなし"}`,
    ...rows.map((row) => `${row.label}: ${row.value}`),
  ].join("\n");
}
