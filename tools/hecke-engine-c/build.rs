// cbindgen build script: regenerates `include/hecke_engine.h` from
// the `#[no_mangle] extern "C"` functions in src/lib.rs on every
// cargo build, so the C header always tracks the Rust ABI.
use std::env;

fn main() {
    let crate_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let config = cbindgen::Config::from_file(format!("{}/cbindgen.toml", crate_dir))
        .unwrap_or_else(|_| cbindgen::Config::default());

    cbindgen::Builder::new()
        .with_crate(&crate_dir)
        .with_config(config)
        .generate()
        .expect("cbindgen header generation failed")
        .write_to_file(format!("{}/include/hecke_engine.h", crate_dir));
}
