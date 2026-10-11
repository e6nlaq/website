/**
 * ミラー・ラビン素数判定法 (TypeScript / BigInt)
 *
 * - n < 3,317,044,064,679,887,385,961,981 (約3.3×10^24) では
 *   先頭13個の素数(2〜41)を底にすることで「決定的」(確実)に判定できる。
 * - それより大きい n では、ランダムな底による確率的判定になる
 *   (誤判定確率は 1 ラウンドあたり最大 1/4 → rounds 回で (1/4)^rounds 以下)。
 */

/** 繰り返し二乗法による (base^exp) mod mod */
export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === 1n) return 0n;
  let result = 1n;
  base %= mod;
  if (base < 0n) base += mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    base = (base * base) % mod;
    exp >>= 1n;
  }
  return result;
}

const SMALL_PRIMES: readonly bigint[] = [
  2n,
  3n,
  5n,
  7n,
  11n,
  13n,
  17n,
  19n,
  23n,
  29n,
  31n,
  37n,
  41n,
];

/** この値未満なら SMALL_PRIMES(2〜41) だけで決定的に判定できる */
const DETERMINISTIC_LIMIT = 3_317_044_064_679_887_385_961_981n;

/** [min, max] の範囲のランダムな BigInt を返す */
function randomBigInt(min: bigint, max: bigint): bigint {
  const range = max - min + 1n;
  const bytes = Math.ceil(range.toString(2).length / 8) + 8; // 偏りを減らすため余分に取る
  const buf = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(buf);
  let r = 0n;
  for (const b of buf) r = (r << 8n) | BigInt(b);
  return min + (r % range);
}

/**
 * a が n の「合成数の証拠(witness)」なら true を返す。
 * n - 1 = d * 2^s (d は奇数) と分解済みであること。
 */
function isWitness(a: bigint, n: bigint, d: bigint, s: number): boolean {
  let x = modPow(a, d, n);
  if (x === 1n || x === n - 1n) return false;
  for (let i = 1; i < s; i++) {
    x = (x * x) % n;
    if (x === n - 1n) return false;
  }
  return true; // 合成数確定
}

/**
 * n が素数かどうかを判定する。
 *
 * @param n      判定する整数
 * @param rounds 確率的判定になる場合(n が非常に大きいとき)のランダム底の個数
 * @returns      素数(の可能性が極めて高い)なら true、合成数なら false
 */
export function isPrime(n: bigint, rounds = 20): boolean {
  if (n < 2n) return false;

  // 小さい素数での試し割り(高速化 & 底 a が n 以上になる事故の防止)
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }

  // n - 1 = d * 2^s
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }

  if (n < DETERMINISTIC_LIMIT) {
    // 決定的判定
    for (const a of SMALL_PRIMES) {
      if (isWitness(a, n, d, s)) return false;
    }
    return true;
  }

  // 確率的判定(ランダムな底)
  for (let i = 0; i < rounds; i++) {
    const a = randomBigInt(2n, n - 2n);
    if (isWitness(a, n, d, s)) return false;
  }
  return true;
}
