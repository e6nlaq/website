import { isPrime } from "@/lib/millerRabin";

export type Mode = "bunshi" | "sum";

/**
 * Rust版 gcd の移植
 */
export function gcd(a: bigint, b: bigint): bigint {
  if (b === 0n) {
    return a;
  }
  return gcd(b, a % b);
}

/**
 * Rust版 solve の移植
 * None -> null
 * Some(ans) -> ans
 */
export function solve(
  n: bigint,
  m: bigint,
  limit: bigint,
  mode: Mode
): bigint | undefined {
  if (n >= m) {
    return undefined;
  }

  let val: bigint | undefined = undefined;
  let ans: bigint | undefined = undefined;
  const prime = isPrime(m);

  for (let i = 2n; i < limit; i++) {
    let l = (n * i) % m;

    if (prime) {
      if (i % m === 0n) {
        continue;
      }
    } else {
      if (gcd(m, i) !== 1n) {
        continue;
      }
    }

    if (l % i === 0n) {
      if (m % i !== 0n) {
        l += m;
      } else {
        continue;
      }
    }

    if (mode === "bunshi") {
      if (val === undefined || val > l) {
        val = l;
        ans = i;
      }

      if (val === 1n) {
        break;
      }
    }

    if (mode === "sum") {
      if (val === undefined || val > l + i) {
        val = l + i;
        ans = i;
      }

      if (val !== undefined && val <= i) {
        break;
      }
    }
  }

  return ans;
}
