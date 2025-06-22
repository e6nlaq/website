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
    for i in 1..limit {
        if mode == "bunshi" {
            if val > (n * i) % m {
                val = (n * i) % m;
                ans = i;
            }
            if val == 1 {
                break;
            }
        }
        if mode == "sum" {
            if val > (n* i) % m + i {
                val = (n * i) % m + i;
                ans = i;
            }
        }
       
    }

    if ans == std::u128::MAX {
        return None;
    }
    Some(ans)
}

#[cfg(test)]
fn gcd(a: u128, b: u128) -> u128 {
    if b == 0 {
        return a;
    }
    gcd(b, a % b)
}

#[test]
fn min_test_solve() {
    for i in 1..100u128 {
        for j in 1..100u128 {
            let m = Mint::new(i) / Mint::new(j);
            let ans = solve(m.val().into(), 998244353, 100000, "bunshi");
            let l = i / gcd(i, j);
            let r = j / gcd(i, j);
            assert_eq!(ans.unwrap(), r);
            assert_eq!(((m.val() as u128) * ans.unwrap()) % 998244353, l);
        }
    }
}
