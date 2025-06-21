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
pub fn solve(val: u32, m: u32, limit: u32) -> Option<u32> {
    if val >= m {
        return None;
    }

    for i in 1..limit {
        if (val * i) % m <= limit {
            return Some(i);
        }
    }
    None
}
