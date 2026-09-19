---
# folio-assistant-wlqd
title: skills/remote-packages/ is declared but nothing syncs, serves or registers a remote package
status: todo
type: bug
priority: normal
created_at: 2026-09-19T05:47:28Z
updated_at: 2026-09-19T05:47:47Z
---

Found 2026-09-19 while working `nup0`. Two remote packages are declared and
**five skills** are named across them, none of which this instance can offer:

| file | `wrapper.skills` |
|---|---|
| `claude-scientific-skills.json` | `scientific-visualization`, `scientific-critical-thinking`, `hypothesis-generation` |
| `smarter-fhir.json` | `smart-launch`, `fhir-client-operations` |

Both carry `sync: { strategy: "shallow-clone", frequency: "weekly", autoUpdate:
true }`. **Nothing performs it.** Measured on `f098b530`:

- `shallow-clone` exists only as a value in `RemoteSyncStrategySchema`
  (`schemas/skill-package.ts`). No code acts on it.
- `src/tools/skill-fetch.ts` — no mention of `remote-packages/`. So
  `skill_fetch` answers "not found" for all five.
- `scripts/generate-registry.ts` — no mention. The published registry does not
  carry them.
- The only real consumer is `scripts/generate-docs.ts`, which reads them for
  **Docker requirements** — which is exactly what
  `schemas/skill-package.ts` documents the wrappers as providing.

So `autoUpdate: true` and `frequency: "weekly"` are fields nothing reads. A
declaration that looks like a live integration and is a docs input.

## Why it was worth a bean rather than a fix

It cost real corpus churn already. `kg-audit`'s `manifest-skill-exists`
(`critical`) accepted a remote declaration as resolution, on the correct
distinction that "is this a real skill somewhere" differs from "can this
instance serve it". With no implementation of the *somewhere*, that allowance
let a manifest publish a name `skill_fetch` cannot answer for. For two hours on
2026-09-18 the audit said keep and `skill-manifest-coverage.test.ts` said
delete, and the corpus followed whichever ran last — three entries deleted at
22:18, two hours after `m4zg` recorded at 20:12 that deleting them would be
wrong. Deleting them turned out to be right, for a reason neither side had
measured.

`nup0` closed the allowance. **That makes the two checkers agree and does not
make the integration real.**

## Done when

One of two, and it is a decision rather than a lookup:

- [ ] **Implement it** — something syncs a declared remote package and
      `skill_fetch` can serve its skills. Then `manifest-skill-exists` should
      accept a remote declaration again, and
      `scripts/tests/manifest-remote-resolution.test.ts` is where the argument
      for closing it is recorded, so revisit it there rather than rediscovering
      it. Its pinned reader list makes a sixth reader visible.
- [ ] **Or say it is a docs input** — drop `sync` from the wrappers, or move
      these files to a name that does not read as a package the instance has.
      Five skills nothing can fetch are five names a reader will try.

Not urgent: nothing regressed, and with the allowance closed nothing can claim
a remote skill without the audit failing. It is a declaration that overstates
what exists, with a known size.
