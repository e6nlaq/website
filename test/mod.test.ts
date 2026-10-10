import { describe, test, expect } from "bun:test";
import { gcd, solve } from "@/app/tools/mod/solve";
import { modint998244353 as mint } from "ac-library-js";

describe("gcd", () => {
  describe("basic tests", () => {
    test("gcd(12, 8) = 4", () => {
      expect(gcd(12n, 8n)).toBe(4n);
    });
    test("gcd(a,10a) = a", () => {
      const a = 12345678901234567890n;
      expect(gcd(a, 10n * a)).toBe(a);
    });
    test("gcd(0, a) = a", () => {
      const a = 98765432109876543210n;
      expect(gcd(0n, a)).toBe(a);
    });
    test("gcd(a,a+1) = 1", () => {
      const a = 12345678901234567890n;
      expect(gcd(a, a + 1n)).toBe(1n);
    });
  });
});

const mod = 998244353n as const;

describe("solve", () => {
  describe.each(["bunshi", "sum"])("mode = '%s'", (mode) => {
    test("small numbers", () => {
      for (let i = 1n; i < 50n; ++i) {
        for (let j = 2n; j < 50n; ++j) {
          if (i % j === 0n) continue;
          const m = mint(i).div(j);
          const ans = solve(BigInt(m.val()), mod, 10000n, mode);
          const l = i / gcd(i, j);
          const r = j / gcd(i, j);

          expect(ans).toBeDefined();
          if (ans === undefined) continue;

          expect(ans).toBe(r);
          expect((BigInt(m.val()) * ans) % mod).toBe(l % mod);
        }
      }
    });
  });

  describe("mode = 'bunshi'", () => {
    describe("const test", () => {
      test.each([
        [1n, 10000n, 10000n, 3n],
        [2n, 10n, 100n, 11n],
      ])("(%p, %p, %p) = %p", (a, b, c, d) => {
        expect(solve(a, b, c, "bunshi")).toBe(d);
      });
    });
  });
});
