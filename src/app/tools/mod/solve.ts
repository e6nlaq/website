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
 * Rust版 is_prime の移植
 * 元コードと同じく、最大100000までの奇数で試し割りする。
 */
export function isPrime(n: bigint): boolean {
  if (n < 2n) {
    return false;
  } else if (n === 2n) {
    return true;
  } else if (n % 2n === 0n) {
    return false;
  } else if (n === 998244353n || n === 1000000007n) {
    return true;
  } else {
    let i = 3n;

    while (i * i <= n && i <= 100000n) {
      if (n % i === 0n) {
        return false;
      }
      i += 2n;
    }

    return true;
  }
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
