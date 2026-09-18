---
# folio-assistant-ge58
title: Provision Lean toolchain + lean-atlas require from folio-assistant
status: completed
type: task
priority: normal
created_at: 2026-08-07T09:44:49Z
updated_at: 2026-08-07T09:46:18Z
---


## Landed

`scripts/install-lean-atlas.sh` — folio-assistant now provisions what Atlas
needs instead of documenting it and leaving it to the operator.

Atlas is a Lake require in the CONTENT repo, not an image binary, so the
split is: folio-assistant supplies the toolchain floor + this provisioning
step; the content repo owns the pin.

What the script does:
1. Verifies the Lean floor (>= 4.17.0), preferring the content repo's own
   `lean-toolchain` pin over the ambient version — building Atlas against a
   different toolchain than the project is exactly the version-skew failure
   mode to avoid. Fails closed with the `--scan` fallback named.
2. Appends the `[[require]]` to the content repo's lakefile.toml if absent —
   appended, never rewritten, since lakefile.toml is authored content.
   `LEAN_ATLAS_REV` pins a commit for reproducible graphs.
3. `lake update lean-atlas` (github.com egress at RUN time), then verifies
   `lake exe atlas --help`.
4. `--check` probes without writing, for the capability detection path.

Referenced from `.claude/skills/capabilities/lean-atlas.json` via a new
`install` field.

Toolchain floor itself was raised in the previous commit (v4.16.0 ->
v4.24.0, matching qou) across Dockerfile, .github/docker/Dockerfile,
lean_ci.yml, authoring-math manifest.

Verified: bash -n clean; fails closed on missing lake; version-floor parser
checked across v4.16.0 (reject) / v4.17.0 (accept) / v4.24.0 (accept) /
v5.1.0 (accept). The full install path needs a Lean toolchain, which this
environment lacks.
