import { describe, expect, test } from "bun:test";
import { isPrime, modPow } from "@/lib/millerRabin";

/** 比較用: 試し割りによる素数判定 (小さい n 専用) */
function isPrimeNaive(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

describe("modPow", () => {
  test("基本的な値", () => {
    expect(modPow(2n, 10n, 1000n)).toBe(24n); // 1024 mod 1000
    expect(modPow(3n, 0n, 7n)).toBe(1n);
    expect(modPow(0n, 5n, 7n)).toBe(0n);
    expect(modPow(5n, 3n, 1n)).toBe(0n);
  });

  test("フェルマーの小定理", () => {
    const p = 1_000_000_007n;
    for (const a of [2n, 3n, 5n, 123456789n]) {
      expect(modPow(a, p - 1n, p)).toBe(1n);
    }
  });

  test("base が mod より大きい場合や負の場合", () => {
    expect(modPow(1002n, 2n, 1000n)).toBe(4n);
    expect(modPow(-2n, 3n, 7n)).toBe(6n); // (-8) mod 7 = 6
  });

  test("巨大な指数でも計算できる", () => {
    const m = 2n ** 127n - 1n;
    expect(modPow(2n, 127n, m)).toBe(1n); // 2^127 ≡ 1 (mod 2^127 - 1)
  });
});

describe("isPrime", () => {
  describe("境界値・小さい数", () => {
    test("0, 1, 負数は素数ではない", () => {
      expect(isPrime(0n)).toBe(false);
      expect(isPrime(1n)).toBe(false);
      expect(isPrime(-1n)).toBe(false);
      expect(isPrime(-7n)).toBe(false);
    });

    test("2, 3 は素数、4 は合成数", () => {
      expect(isPrime(2n)).toBe(true);
      expect(isPrime(3n)).toBe(true);
      expect(isPrime(4n)).toBe(false);
    });

    test("0〜20000 の全ての値が試し割りと一致する", () => {
      for (let n = 0; n <= 20000; n++) {
        expect(isPrime(BigInt(n))).toBe(isPrimeNaive(n));
      }
    });

    test("小さい素数そのもの・その平方を正しく扱う", () => {
      for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 37n, 41n]) {
        expect(isPrime(p)).toBe(true);
        expect(isPrime(p * p)).toBe(false);
      }
    });
  });

  describe("難しい合成数", () => {
    test("カーマイケル数", () => {
      const carmichael = [
        561n,
        1105n,
        1729n,
        2465n,
        2821n,
        6601n,
        8911n,
        41041n,
        825265n,
      ];
      for (const n of carmichael) {
        expect(isPrime(n)).toBe(false);
      }
    });

    test("底2の強擬素数", () => {
      for (const n of [2047n, 3277n, 4033n, 4681n, 8321n]) {
        expect(isPrime(n)).toBe(false);
      }
    });

    test("複数の底に対する強擬素数 (底の数が足りないと見逃す)", () => {
      expect(isPrime(3215031751n)).toBe(false); // 底 2,3,5,7 の強擬素数
      expect(isPrime(3825123056546413051n)).toBe(false); // 底 2〜23 の強擬素数
      expect(isPrime(318665857834031151167461n)).toBe(false); // 底 2〜37 の強擬素数
    });

    test("決定的判定の上限値そのもの (底 2〜41 の強擬素数) も合成数と判定", () => {
      expect(isPrime(3_317_044_064_679_887_385_961_981n)).toBe(false);
    });

    test("大きな素数同士の積は合成数", () => {
      expect(isPrime(1_000_000_007n * 998_244_353n)).toBe(false);
      expect(isPrime((2n ** 61n - 1n) * (2n ** 89n - 1n))).toBe(false);
    });
  });

  describe("大きな素数", () => {
    test("よく知られた素数", () => {
      expect(isPrime(998_244_353n)).toBe(true);
      expect(isPrime(1_000_000_007n)).toBe(true);
      expect(isPrime(2n ** 64n - 59n)).toBe(true); // 2^64 未満で最大の素数
    });

    test("メルセンヌ素数 2^p - 1 (p = 31, 61, 89, 107, 127)", () => {
      for (const p of [31n, 61n, 89n, 107n, 127n]) {
        expect(isPrime(2n ** p - 1n)).toBe(true);
      }
    });

    test("素数でない指数のメルセンヌ数は合成数 (2^67 - 1 はコールの有名な例)", () => {
      expect(isPrime(2n ** 67n - 1n)).toBe(false);
      expect(isPrime(2n ** 128n - 1n)).toBe(false);
    });

    test("巨大な素数 (確率的判定の領域): 2^521 - 1", () => {
      expect(isPrime(2n ** 521n - 1n)).toBe(true);
      expect(isPrime(2n ** 521n + 1n)).toBe(false);
    });
  });

  describe("rounds", () => {
    test("rounds を変えても結果は変わらない (決定的領域では無視される)", () => {
      expect(isPrime(1_000_000_007n, 1)).toBe(true);
      expect(isPrime(1_000_000_007n, 100)).toBe(true);
      expect(isPrime(561n, 1)).toBe(false);
    });

    test("確率的領域でも rounds=1 の素数判定は常に true (素数は誤って弾かれない)", () => {
      const p = 2n ** 127n - 1n;
      for (let i = 0; i < 20; i++) {
        expect(isPrime(p, 1)).toBe(true);
      }
    });
  });
});
