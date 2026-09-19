---
# folio-assistant-wlqd
title: skills/remote-packages/ is declared but nothing syncs, serves or registers a remote package
status: in-progress
type: bug
priority: normal
created_at: 2026-09-19T05:47:28Z
updated_at: 2026-09-19T06:07:28Z
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

## Worked 2026-09-19 — option chosen: make the declaration honest

Owner picked "make the declaration honest" over implementing the sync, from four
options with their costs.

### A claim I made and had to retract

I reported to the owner that `scripts/generate-docs.ts:660` put

> "Agents can sync and update these automatically based on the sync configuration."

**on the published docs site.** It does not. Measured: `schemas/generated/` is
gitignored (`.gitignore:21`) and untracked, `docs-site.yml` publishes `docs/**`
and does not touch it, and `git grep` finds the sentence in no tracked file. The
`docs/` pages that mention remote packages at all are two architecture notes that
make no sync claim.

So the accurate severity is **a false statement in generated developer
documentation** — read by whoever runs the generator, and public only if
`schemas/generated/` is ever published — not a false claim on the site. Recorded
here because the overstatement reached the owner before the measurement did,
which is the failure mode `AGENTS.md` names about quoting numbers from prose.

Still worth fixing: this is the same reading that had
`manifest-skill-exists` accept a remote declaration as resolution, where it cost
two hours of two checkers disagreeing about three real entries (`nup0`).

### What changed

- **`scripts/generate-docs.ts`** — the sentence replaced with what the wrappers
  actually are; a `> **Declared, not integrated.**` block stating that
  `skill_fetch` and the registry do not read the directory, that the five skills
  cannot be fetched here, and that a manifest claiming one fails
  `manifest-skill-exists`; table columns renamed **Intended strategy** /
  **Intended frequency**; the per-package line reads *"declared; no code performs
  it"*; and `**Skills:**` became *"Skills in the external package … not fetchable
  from this instance"* — a bare list reads as things a reader can ask for here.
- **`schemas/skill-package.ts`** — `sync` is now **optional**, so a wrapper whose
  only job is Docker requirements need not claim a strategy to be valid.
  `RemoteSyncConfigSchema` documents the measurement, why the intent is kept
  rather than deleted (a maintainer chose `shallow-clone` over `subtree`; losing
  that costs the next reader the same decision), and the two things that are
  decisions if somebody implements it: both wrappers pin `ref: "main"` with
  `autoUpdate: true`, which would auto-ingest whatever upstream pushes — prefer a
  pinned commit — and `manifest-skill-exists` should get its allowance back, with
  `manifest-remote-resolution.test.ts` holding the argument for closing it.
- **`scripts/tests/remote-packages-honest-docs.test.ts`** — 6 tests pinning the
  property, not the wording, so an honest rewrite passes and re-adding the claim
  does not. Probe: restoring the sentence takes it 6 pass → 5 pass / 1 fail.

**Both wrappers keep their `sync`.** The intent is real information about two
real external dependencies; it is the present tense that was wrong, not the
field.

### The test caught my own mistake on its first run

Scanning the generator's source flagged the fix as the defect, because the new
comment quotes the old sentence as the record. Exactly the failure
`manifest-remote-resolution.test.ts` hit grepping for `shallow-clone`: a string
search cannot tell an implementation from a note about one. It now extracts the
`L.push(...)` arguments and asserts on what is EMITTED.

### Still open — this bean stays

Neither "Done when" box is ticked. The five skills remain unfetchable and the
sync remains unimplemented; what is fixed is that nothing now says otherwise.
Implementing it is a platform capability change, so per `AGENTS.md` it is a
feature request needing an issue and the CRDM workflow, not a direct
implementation — recorded here rather than started.
