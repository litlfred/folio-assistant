---
# folio-assistant-gn4l
title: kg-export is written for THIS instance's shape, not just hardcoded to its root
status: todo
type: task
priority: normal
created_at: 2026-09-19T15:06:44Z
updated_at: 2026-09-19T15:07:03Z
parent: folio-assistant-vke6
---

## The measurement, 2026-09-19

Opened while building `x3bd`, after twice estimating this wrong out loud.

**`kg-export.ts` cannot export any instance but this one**, and the reason is
not the one it looks like. `const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")`
reads as a hardcoded path — the `bgle` shape — so the obvious fix is a
`--root` flag beside the `--out` and `--base-url` it already takes.

That is wrong twice over:

1. **27 references** to `ROOT`, consumed by ~20 functions that take no root
   parameter. A flag means changing every one of their signatures.
2. **It would not work.** Those references include `.claude/skills/`,
   `skills/`, `package.json`, `SKILL_IO_DIR`, `auditSchemaNodes(ROOT)` and
   `git`. None of them is something a minimal instance has. Adding `--root`
   would make the exporter try to export bootstrap **as if bootstrap were
   folio-assistant**.

So the exporter is not root-hardcoded; it is **written for this instance's
shape**. The generic half (read a declaration, walk its declared graphs, emit
nodes) and the folio-assistant-specific half (skill I/O schemas, `.claude/`
actors, package manifests, the schema-node audit) are not separated, and only
the first is what another instance needs.

## Why this blocks bootstrap

`bootstrap/README.md` step 2 says *"Load `bootstrap/bootstrap.jsonld`"*. That
file should be GENERATED — `.jsonld` is generated everywhere else here and CI
gates the siblings — but nothing can generate it for an instance that is not
this repository.

The fallback the proposal permits (§4, "hardcoded JSON/JSON-LD in bootstrap is
acceptable but not preferred") is **also** bigger than it looks: bootstrap's
vocabulary carries 8 classes (`Actor`, `Role`, `Skill`, `Process`,
`ProcessNode`, `SequenceFlow`, `Directory`, `GraphKind`) and **zero
properties**, so relating a process to its steps needs terms minted into
`schemas/vocabulary.ts` first, gated by `ns:check` and the undeclared-terms
pass in `kg-export` itself.

## Done when

- [ ] the generic half of `kg-export` is separated from the
      folio-assistant-specific half, with the boundary stated rather than
      implied
- [ ] the generic half takes an instance root and is exercised against one
      that is NOT this repository — a test fixture instance is enough
- [ ] whatever a minimal instance genuinely lacks is a THIRD STATE in the
      output, not an empty section that reads as "audited and clean"
- [ ] `bootstrap.jsonld` is generated rather than authored, or this bean
      records why that was refused
