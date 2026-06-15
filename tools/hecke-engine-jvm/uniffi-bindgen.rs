// uniffi-bindgen CLI entry point — generates the language-side
// bindings (Kotlin, Swift, Python, Ruby) from the .udl interface.
//
// Usage (after `cargo build --release`):
//   cargo run --bin uniffi-bindgen generate \
//     --library target/release/libhecke_engine_jvm.so \
//     --language kotlin --out-dir bindings/kotlin/
fn main() {
    uniffi::uniffi_bindgen_main()
}
