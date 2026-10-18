import { describe, expect, test } from "bun:test";
import {
  buildResultRows,
  buildResultText,
  buildUrlminApi,
  decodeDisplayUrl,
  extractRinuCode,
  extractTokuteiTarget,
  ipInfoUrl,
  isTokuteiUrl,
  parseUrlminResponse,
  type UrlminResponse,
} from "@/app/tools/rinu-checker/logic";

describe("extractRinuCode", () => {
  test("rinu.jp のURLからコードを抜き出す", () => {
    expect(extractRinuCode("https://rinu.jp/abc123")).toBe("abc123");
    expect(extractRinuCode("https://rinu.cf/abc123")).toBe("abc123");
    expect(extractRinuCode("http://rinu.jp/abc123")).toBe("abc123");
  });

  test("パス文字を含むコードもそのまま扱う", () => {
    expect(extractRinuCode("https://rinu.jp/abc/def?x=1")).toBe("abc/def?x=1");
  });

  test("rinu以外のURLやパスが無いURLはnull", () => {
    expect(extractRinuCode("https://example.com/abc123")).toBeNull();
    expect(extractRinuCode("https://rinu.jp/")).toBeNull();
    expect(extractRinuCode("https://rinu.jp")).toBeNull();
    expect(extractRinuCode("")).toBeNull();
  });

  test("スキーム省略(https://なし)でも判定できる", () => {
    expect(extractRinuCode("rinu.jp/abc123")).toBe("abc123");
    expect(extractRinuCode("rinu.cf/abc123")).toBe("abc123");
    expect(extractRinuCode("rinu.jp/abc/def?x=1")).toBe("abc/def?x=1");
  });

  test("他ドメインやパス無しは省略形式でもnull", () => {
    expect(extractRinuCode("example.com/abc123")).toBeNull();
    expect(extractRinuCode("www.rinu.jp/abc123")).toBeNull();
    expect(extractRinuCode("rinu.jp")).toBeNull();
  });
});

describe("isTokuteiUrl", () => {
  test("特定ツールのドメイン+?url=ならtrue", () => {
    expect(isTokuteiUrl("https://tokutei.cf/?url=https://example.com")).toBe(
      true
    );
    expect(
      isTokuteiUrl("https://tokutei.end2end.tech/?url=https://example.com")
    ).toBe(true);
  });

  test("それ以外はfalse", () => {
    expect(isTokuteiUrl("https://tokutei.cf/")).toBe(false);
    expect(isTokuteiUrl("https://tokutei.cf/other")).toBe(false);
    expect(isTokuteiUrl("https://rinu.jp/abc123")).toBe(false);
    expect(isTokuteiUrl("")).toBe(false);
  });
});

describe("extractTokuteiTarget", () => {
  test("?url= の値をデコードして取り出す", () => {
    expect(
      extractTokuteiTarget(
        "https://tokutei.cf/?url=https%3A%2F%2Fexample.com%2Ftarget"
      )
    ).toBe("https://example.com/target");
  });

  test("+ は空白に展開される(旧版 getParam と同じ)", () => {
    expect(extractTokuteiTarget("https://tokutei.cf/?url=a+b")).toBe("a b");
  });

  test("?url= が無ければ空文字", () => {
    expect(extractTokuteiTarget("https://tokutei.cf/other")).toBe("");
  });
});

describe("decodeDisplayUrl", () => {
  test("エンコードされたURLを可読にする", () => {
    expect(decodeDisplayUrl("https://example.com/?q=%E3%81%82")).toBe(
      "https://example.com/?q=あ"
    );
  });

  test("デコード不能な入力はそのまま返す", () => {
    expect(decodeDisplayUrl("https://example.com/%E3%81")).toBe(
      "https://example.com/%E3%81"
    );
  });
});

describe("parseUrlminResponse", () => {
  test("404はエラーメッセージを返す", () => {
    const outcome = parseUrlminResponse({ status: "NG", type: 404 });
    expect(outcome.kind).toBe("error");
    if (outcome.kind === "error") {
      expect(outcome.message).toContain("404");
    }
  });

  test("それ以外のエラーも型番号込みで返す", () => {
    const outcome = parseUrlminResponse({ status: "NG", type: 500 });
    expect(outcome.kind).toBe("error");
    if (outcome.kind === "error") {
      expect(outcome.message).toContain("500");
    }
  });

  test("特定ツールではないリンクは遷移先をそのまま返す", () => {
    const dat: UrlminResponse = {
      status: "OK",
      LinkURL: "https://example.com/foo",
      CreatedDateTime: "2024-01-01T00:00:00",
      UsedCount: 3,
      LastUsed: "2024-01-02 192.0.2.1",
      CreatorInfo: {
        IPAddress: "192.0.2.10",
        MoreInformation: "https://www.ipinfo.io/192.0.2.10",
        TimeZone: "Asia/Tokyo",
        Location: "Tokyo, Japan",
      },
    };
    const outcome = parseUrlminResponse(dat);
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.result.tokutei).toBe(false);
      expect(outcome.result.targetUrl).toBe("https://example.com/foo");
      expect(outcome.result.createdAt).toBe("2024-01-01T00:00:00");
      expect(outcome.result.usedCount).toBe(3);
      expect(outcome.result.lastUsedIp).toBe("192.0.2.1");
      expect(outcome.result.creator.Location).toBe("Tokyo, Japan");
    }
  });

  test("特定ツールリンクは遷移先を実URLへ展開する", () => {
    const outcome = parseUrlminResponse({
      status: "OK",
      LinkURL: "https://tokutei.cf/?url=https%3A%2F%2Fexample.com%2Ftarget",
      LastUsed: "2024-01-02 192.0.2.1",
    });
    expect(outcome.kind).toBe("ok");
    if (outcome.kind === "ok") {
      expect(outcome.result.tokutei).toBe(true);
      expect(outcome.result.targetUrl).toBe("https://example.com/target");
    }
  });
});

describe("buildResultRows", () => {
  test("ipinfoの追加照会が無くても全行が埋まる", () => {
    const outcome = parseUrlminResponse({
      status: "OK",
      LinkURL: "https://example.com/foo",
      CreatedDateTime: "2024-01-01T00:00:00",
      UsedCount: 3,
      LastUsed: "2024-01-02 192.0.2.1",
      CreatorInfo: {
        IPAddress: "192.0.2.10",
        MoreInformation: "https://www.ipinfo.io/192.0.2.10",
        TimeZone: "Asia/Tokyo",
        Location: "Tokyo, Japan",
      },
    });
    if (outcome.kind !== "ok") throw new Error("unreachable");
    const rows = buildResultRows(outcome.result, null);
    expect(rows.map((row) => row.label)).toEqual([
      "作成者IPアドレス",
      "作成者タイムゾーン",
      "IPからわかる場所",
      "郵便番号",
      "ASN",
      "遷移先URL",
      "作成日",
      "使用回数",
      "最後に使用したユーザーのIPアドレス",
    ]);
    expect(rows.find((row) => row.label === "郵便番号")?.value).toBe(
      "取得できませんでした"
    );
    expect(
      rows.find((row) => row.label === "最後に使用したユーザーのIPアドレス")
        ?.href
    ).toBe("https://ipinfo.io/192.0.2.1");
  });
});

describe("buildResultText", () => {
  test("判定行を含むテキストになる", () => {
    const text = buildResultText(true, [
      { label: "作成日", value: "2024-01-01T00:00:00" },
    ]);
    expect(text).toContain("判定: 特定ツールあり");
    expect(text).toContain("作成日: 2024-01-01T00:00:00");
  });
});

describe("API URL", () => {
  test("旧版と同じエンドポイントになる", () => {
    expect(buildUrlminApi("abc123")).toBe(
      "https://api.activetk.jp/urlmin/get&code=abc123"
    );
    expect(ipInfoUrl("192.0.2.1")).toBe("https://www.ipinfo.io/192.0.2.1/json");
  });
});
