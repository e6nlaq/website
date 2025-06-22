mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, wasm!");
}

#[wasm_bindgen]
pub fn solve(val: u128, m: u128, limit: u128) -> Option<u128> {
    if val >= m {
        return None;
    }

    let mut bunsi=std::u128::MAX;
    let mut ans=std::u128::MAX;
    for i in 1..limit {
        if bunsi>(val*i)%m {
            bunsi=(val*i)%m;
            ans=i;
        }
        if bunsi==1 {
            break;
        }
    }
    

    if ans == std::u128::MAX {
        return None;
    }
    Some(ans)
}
