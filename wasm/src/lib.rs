mod utils;

use wasm_bindgen::prelude::*;

#[cfg(test)]
use ac_library::ModInt998244353 as Mint;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, wasm!");
}

#[wasm_bindgen]
pub fn solve(n: u128, m: u128, limit: u128, mode: &str) -> Option<u128> {
    if n >= m {
        return None;
    }

    let mut val = std::u128::MAX;
    let mut ans = std::u128::MAX;
    let prime = is_prime(m);
    for i in 2..limit {
        let mut l = (n * i) % m;
        if prime {
            if i % m == 0 {
                continue;
            }
        } else {
            if gcd(m, i) != 1 {
                continue;
            }
        }

        if l % i == 0 {
            // continue;
            if m % i != 0 {
                l += m;
            } else {
                continue;
            }
        }

        if mode == "bunshi" {
            if val > l {
                val = l;
                ans = i;
            }
            if val == 1 {
                break;
            }
        }
        if mode == "sum" {
            if val > l + i {
                val = l + i;
                ans = i;
            }
            if val <= i {
                break;
            }
        }
    }

    if ans == std::u128::MAX {
        return None;
    }
    Some(ans)
}

fn gcd(a: u128, b: u128) -> u128 {
    if b == 0 {
        return a;
    }
    gcd(b, a % b)
}

// ある程度で打ち切り
fn is_prime(n: u128) -> bool {
    if n < 2 {
        false
    } else if n == 2 {
        true
    } else if n % 2 == 0 {
        false
    } else {
        let mut i = 3;
        while i * i <= n && i <= 100000 {
            if n % i == 0 {
                return false;
            }
            i += 2;
        }
        true
    }
}

#[test]
fn min_test_solve_bunshi() {
    for i in 1..100u128 {
        for j in 2..100u128 {
            if i % j == 0 {
                continue;
            }
            let m = Mint::new(i) / Mint::new(j);
            let ans = solve(m.val().into(), 998244353, 10000, "bunshi");
            let l = i / gcd(i, j);
            let r = j / gcd(i, j);
            assert_eq!(ans.unwrap(), r);
            assert_eq!(((m.val() as u128) * ans.unwrap()) % 998244353, l);
        }
    }
}

#[test]
fn min_test_solve_sum() {
    for i in 1..100u128 {
        for j in 2..100u128 {
            if i % j == 0 {
                continue;
            }
            let m = Mint::new(i) / Mint::new(j);
            let ans = solve(m.val().into(), 998244353, 10000, "sum");
            let l = i / gcd(i, j);
            let r = j / gcd(i, j);
            assert_eq!(ans.unwrap(), r);
            assert_eq!(((m.val() as u128) * ans.unwrap()) % 998244353, l);
        }
    }
}

#[test]
fn test_solve_const() {
    assert_eq!(solve(1, 10000, 10000, "bunshi"), Some(3));
    assert_eq!(solve(2, 10, 100, "bunshi"), Some(11));
    let an = 117288381359406970983270u128;
    assert_eq!(gcd(an, 3), 3);
    assert!(!is_prime(an));
}
