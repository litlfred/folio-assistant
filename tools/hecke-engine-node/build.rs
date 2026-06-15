// napi-rs build script: emits the bindgen glue + type declarations.
// Required for `napi build` (in package.json scripts) to wire the
// Rust cdylib into Node's native-module loader.
extern crate napi_build;

fn main() {
    napi_build::setup();
}
