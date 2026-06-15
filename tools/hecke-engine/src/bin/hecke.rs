//! `hecke` — unified command-line entry for the H_n(q) engine.
//!
//! Subcommands:
//!
//!   `hecke gram`    — 6×6 Gram matrix for H_3(q) at a given `q` (native).
//!   `hecke schema`  — print a JSON Schema (`certificate`, `gram`, or
//!                     `witness`).
//!   `hecke mass`    — compute nuclear mass for an isotope. Execs the
//!                     canonical `hecke-mass` (v19_nuclear_mass) binary.
//!   `hecke atomic`  — exec `hecke-atomic` (v12).
//!   `hecke molecular` — exec `hecke-molecular` (v15).
//!   `hecke pergen`  — exec `hecke-pergen` (v18).
//!   `hecke qvalues` — exec `hecke-qvalues` (v-original).
//!
//! This is the M2e unification: one CLI, many implementations.
//! Subcommands with dedicated Rust library support call directly; the
//! rest dispatch via `std::process::Command` to preserve the legacy
//! per-binary behaviour without forcing a wholesale rewrite.

use std::process::Command;

use clap::{Parser, Subcommand, ValueEnum};
use hecke_engine::gram;

#[derive(Parser)]
#[command(name = "hecke", about = "Unified H_n(q) engine CLI", version)]
struct Cli {
    #[command(subcommand)]
    command: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Print the H_3(q) Gram matrix + inverse as JSON.
    Gram {
        /// Substrate parameter q (default: q_0 = 1.1099785955541805).
        #[arg(long)]
        q: Option<f64>,
        /// Pretty-print JSON.
        #[arg(long)]
        pretty: bool,
    },
    /// Print a JSON Schema bundled with the engine.
    Schema {
        /// Which schema to print.
        #[arg(value_enum)]
        kind: SchemaKind,
    },
    /// Compute nuclear mass — execs `hecke-mass` with positional (Z, N).
    Mass {
        /// Proton number.
        #[arg(long)]
        z: u32,
        /// Neutron number.
        #[arg(long)]
        n: u32,
        /// Extra args forwarded to `hecke-mass`.
        #[arg(trailing_var_arg = true)]
        extra: Vec<String>,
    },
    /// Atomic braid — execs `hecke-atomic`.
    Atomic {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },
    /// Molecular binding — execs `hecke-molecular`.
    Molecular {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },
    /// Per-generator Wedderburn vertex volumes — execs `hecke-pergen`.
    Pergen {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },
    /// Q-value float engine — execs `hecke-qvalues`.
    Qvalues {
        #[arg(trailing_var_arg = true, allow_hyphen_values = true)]
        args: Vec<String>,
    },
}

#[derive(ValueEnum, Clone, Copy)]
enum SchemaKind {
    Certificate,
    Gram,
    Witness,
}

fn exec_legacy(bin: &str, args: &[String]) -> ! {
    // Dispatch to a legacy binary living alongside this one.
    let me = std::env::current_exe().unwrap_or_else(|e| {
        eprintln!("cannot determine exe path: {e}");
        std::process::exit(2);
    });
    let dir = me.parent().unwrap_or_else(|| std::path::Path::new("."));
    let target = dir.join(bin);
    let status = Command::new(&target)
        .args(args)
        .status()
        .unwrap_or_else(|e| {
            eprintln!("failed to exec {}: {e}", target.display());
            std::process::exit(2);
        });
    std::process::exit(status.code().unwrap_or(1));
}

fn main() {
    let cli = Cli::parse();
    match cli.command {
        Cmd::Gram { q, pretty } => {
            let q = q.unwrap_or(gram::Q_0);
            let cert = gram::certificate_at(q);
            let out = if pretty {
                serde_json::to_string_pretty(&cert)
            } else {
                serde_json::to_string(&cert)
            };
            match out {
                Ok(s) => println!("{s}"),
                Err(e) => {
                    eprintln!("serialization error: {e}");
                    std::process::exit(1);
                }
            }
        }
        Cmd::Schema { kind } => {
            let s = match kind {
                SchemaKind::Certificate => {
                    include_str!("../../schemas/certificate.schema.json")
                }
                SchemaKind::Gram => {
                    include_str!("../../schemas/gram.schema.json")
                }
                SchemaKind::Witness => {
                    include_str!("../../schemas/witness.schema.json")
                }
            };
            println!("{s}");
        }
        Cmd::Mass { z, n, extra } => {
            // hecke-mass takes positional Z N followed by any extras.
            let mut args = vec![z.to_string(), n.to_string()];
            args.extend(extra);
            exec_legacy("hecke-mass", &args);
        }
        Cmd::Atomic { args } => exec_legacy("hecke-atomic", &args),
        Cmd::Molecular { args } => exec_legacy("hecke-molecular", &args),
        Cmd::Pergen { args } => exec_legacy("hecke-pergen", &args),
        Cmd::Qvalues { args } => exec_legacy("hecke-qvalues", &args),
    }
}
