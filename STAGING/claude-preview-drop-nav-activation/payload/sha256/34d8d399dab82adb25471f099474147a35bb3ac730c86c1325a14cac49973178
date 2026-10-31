---
name: lean-toolchain-contract
description: >
  The contract the `lean-toolchain` role is held to: what a Lean toolchain
  must answer when a paper folio's formal half is built, and what it must not
  be asked. A mechanical role's skill is a contract to test against, not
  instructions to read.
tested-by:
  - schemas/lean-toolchain-contract.test.ts
---

# Lean toolchain — the role's contract

`lean-toolchain` in `scenarios/roles.json` is played by a **mechanical**
actor (`actorKinds: ["system"]`; today `scenarios/actors/lean-mcp.json`). A
role played by a machine is still a role, and its skills are its **contract**:
the responsibilities it must perform, which a test can hold it to (owner,
2026-10-16). This is that contract. Nothing here is new; each line is read
off what the repository already says.

## What it must do

1. **Elaborate and check the formal half of a paper folio**, and answer only
   what Lean can answer (the role's own description). A judgement about
   whether a proof is *good* belongs to `proof-review-agent`, not here.
2. **Build with `lake build` and exit 0 with no compilation errors** when the
   project is sound — `req:lean-verification#lean-compiles`, which the
   `lean-toolchain` capability (`scenarios/capabilities/lean-toolchain.json`)
   declares it satisfies.
3. **Be detectable**: `lean --version` answers on a machine that has it
   (the capability's `detection`). Where it does not, the `lean-mcp`
   capability is the declared fallback, with the Lean running server-side.
4. **Report what it ran, not only that it passed**: the `lean-build` Tool
   (`tools/lean-build/lean-build.ts`) writes a committable
   `lean-build-status.json` every run, so a green build is distinguishable
   from one nobody ran.

## What it is not asked

- To decide anything. Sorry tracking (`req:lean-verification#sorry-tracking`)
  is verified by inspection, by an actor that can judge; this role reports
  diagnostics and proof state.
- To run in this repository. This layer carries no folio and no Lean
  install, so the mechanism is exercised downstream, in a folio
  (`lean-build.ts`'s own header). The test in `tested-by:` holds lines 2–4 to
  what this repository declares — the capability, the requirement statement
  it satisfies, its detection and fallback, and the `lean-build` Tool's status
  output — and does not run `lake build`.
