// UniFFI build script: parses the .udl interface file and generates
// the Rust scaffolding (`uniffi::include_scaffolding!("hecke_engine_jvm");`
// in lib.rs).
fn main() {
    uniffi::generate_scaffolding("./src/hecke_engine_jvm.udl").unwrap();
}
