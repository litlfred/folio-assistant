---
# folio-assistant-wlqd
title: skills/remote-packages/ is declared but nothing syncs, serves or registers a remote package
status: in-progress
type: bug
priority: normal
created_at: 2026-09-19T05:47:28Z
updated_at: 2026-09-20T17:19:50Z
parent: folio-assistant-zzmr
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

### Released back to `todo`, 2026-09-19

The honesty half shipped in #339 (merged `6b54cdfa`). **Nobody is working the
rest**, so the status goes back to `todo` rather than staying `in-progress` —
`in-progress` tells a sibling session that someone is on it, and claiming
without working is the failure the claim protocol exists to prevent.

What is left is the decision in `## Done when`, unchanged: implement the sync
(a platform capability change, so a GitHub issue and the CRDM workflow first),
or declare these files a docs input and drop `sync`. Nothing in the tree now
overstates the position, so this is not urgent.

## 2026-09-19 — the owner asked for a third thing, and it was better than my four options

I put the remaining decision as four options: rename `sync` → `intendedSync`,
drop `sync`, implement the sync, or leave it. The answer was none of them:

> **want it as a todo that fails QA**

That is better than all four, and the reason is worth keeping. Every option I
offered resolved to *prose* — a renamed field, a deleted field, a doc block —
and the honesty pass had already shown where that leads: the generated docs now
say "declared, not integrated", which made the overstatement **accurate and
invisible at the same time**. Nothing tripped. A failing check keeps the
pressure on until it is either implemented or removed.

### What now fails

`remote-skill-is-servable`, a new `graph`-scoped criterion in `KG_CRITERIA`
(`schemas/kg-qa.ts`, now 34). It reports **5** findings, one per declared and
unservable skill, each naming the wrapper that declares it:

| wrapper | skills |
|---|---|
| `claude-scientific-skills.json` | `scientific-visualization`, `scientific-critical-thinking`, `hypothesis-generation` |
| `smarter-fhir.json` | `smart-launch`, `fhir-client-operations` |

So `bun run kg:audit` reports `Worst severity: major`, the committed sidecar
`test/results/kg-qa/scenarios/kg.kg-qa.json` records `fail`, and
`bun run kg:audit:strict` exits non-zero.

### What deliberately does NOT fail, and the argument for it

**`kg:audit:check` — the CI gate — still passes**, because it fires on
`critical` only. Making this `critical` would turn every unrelated pull request
red until somebody implements a remote-package sync, which is exactly the defect
`AGENTS.md` documents at length: `docs-site.yml` failed all 30 runs over two
months and the failure became invisible *because* it was constant (bean `xom7`).
A permanently-red required check is not a stronger signal, it is a disabled one.

`major` also follows the established precedent: `activity-names-skill` is
enforced by a dedicated test rather than by switching CI to `kg:audit:strict`,
which would promote all 34 criteria at once.

**Escalating is a one-line change** — the severity in `schemas/kg-qa.ts` — and
the argument above is recorded in
`scripts/tests/remote-skill-servable.test.ts` so whoever overrides it is
overriding something stated, not rediscovering it.

### The test pins the set in BOTH directions

- It cannot silently **grow**: a sixth declared-but-unservable name fails, which
  is the regression that matters, because adding such a name is currently free.
  Probed — added `probe-sixth-unservable` to a wrapper: 4 pass → 3 pass / 1 fail,
  and the criterion moved 5 → 6.
- It cannot silently **vanish**: implementing the sync or dropping a declaration
  fails the test and names what to do, so closing this bean is a deliberate act
  with the expectation updated rather than a green run nobody reads.

The five names are written out rather than counted — a bare `toBe(5)` passes when
one name is swapped for another, and *which* skills are unfetchable is the
finding.

### One consolidation on the way

`remotePackageSkills` now derives from a new `remotePackageDeclarations`, which
is the single reader of `skills/remote-packages/`. Two readers of one directory
is how they come to disagree, and a finding needs the wrapper as well as the
name: the two files have different maintainers and different remedies.

### Status: stays `todo`

Deliberately. Neither `## Done when` box is ticked — the five skills are still
unfetchable and the sync is still unimplemented. What changed is that QA now
says so on every run instead of a doc block saying it once. Implementing the
sync remains a platform capability change, so a GitHub issue and the CRDM
workflow come first.

---

## Re-measured 2026-09-20 — three of the four claims have moved

Checked against the code, not the checkboxes.

| the bean's claim | now |
|---|---|
| `shallow-clone` is only a schema value, no code acts on it | **still true** |
| `skill-fetch.ts` has no mention of `remote-packages/` | **stale** — it mentions it, but only in an EXCLUSION list, so the substance holds: it still does not serve them |
| the registry does not carry them | **still true** |
| `autoUpdate` / `frequency` are read by nothing | **still true** — the only hit is a test asserting the docs SAY "Intended frequency" |

**And two real things were built since.** A `kg-qa` criterion,
`remote-skill-is-servable` (`major`), which the summary records the owner asking
for *"a todo that FAILS rather than prose explaining itself"*. And five **stub
bodies** under `skills/remote-stubs/`.

### The stubs are honest, and they still trip

`remote-skill-is-servable` now **passes** — the names resolve, so the instance
can serve them. That would be gaming the criterion if the stubs were empty.
They are not. `smart-launch.md` opens *"This skill is declared, not implemented
here. Do not follow it as guidance; there is none to follow"*, names the
upstream repository, and restates the remedy and this bean.

More to the point, **they still fail a different criterion**: `skill-is-a-stub`
fires on all five, `major`. So the gap did not go quiet — it moved to the
criterion that describes it accurately. That is the right outcome, not a
silenced one.

## What remains is blocked on the author, by the criterion's own text

> Remedy: implement the sync (**a platform capability change, so a GitHub issue
> and the CRDM workflow first**), or drop the declaration.

Both branches need the author:

- **Implement the sync** — a capability change. The CRDM process requires a
  linked GitHub issue, and an agent never opens one without permission.
- **Drop the declaration** — removing two wrappers about real external
  dependencies, which
  [`deletion-requires-confirmation`](../../cat-harness/skills/folio-core/deletion-requires-confirmation.md)
  puts with the author too. `skill-package.ts:353` records that *"a maintainer
  chose `shallow-clone` over"* the alternatives, so the declaration carries a
  decision somebody made.

Nothing here is an agent's call. Brought back as a question rather than
actioned.


## OWNER: **"wlqd OK"**, 2026-09-20

Approved to proceed. The remaining half is implementing the sync so
`skill_fetch` can serve a declared remote package's skills — a **platform
capability change**, so per `AGENTS.md` it takes a GitHub issue and the CRDM
workflow before implementation, not a direct edit.

Read as permission for that first step: scan for an existing issue, and open
one only if none covers it. `AGENTS.md` §CRDM is explicit that an agent never
creates an issue without permission, and this is it.

**What must not be lost when it lands:** the `remote-skill-is-servable`
criterion currently reports **5** findings, one per declared-and-unservable
skill, and `scripts/tests/remote-skill-servable.test.ts` pins that set in BOTH
directions — it cannot silently grow or silently vanish. Implementing the sync
makes those five servable, which fails that test **by design**, and the test
says so. Closing this bean means updating the expectation deliberately, not
watching a green run.

Also recorded there: both wrappers pin `ref: "main"` with `autoUpdate: true`,
which would auto-ingest whatever upstream pushes. Prefer a pinned commit.
---

## Issue opened 2026-09-20 — CRDM entry

Author authorised it. <https://github.com/litlfred/folio-assistant/issues/556>
carries the context, the re-measurement, what is already done (so the
requirements conversation does not re-litigate it) and the two branches with
their costs. **No code was written**: CRDM Phase 1 starts from the issue, and
the branch — implement, or retire the declaration — is the author's.

Status stays `in-progress`; neither `## Done when` box has moved.

--------

## Owner, 2026-09-24 — implement it, via #556

Three answers, in order:

1. **"Implement via #556"** — not retire, not leave.
2. Where synced skills live: **"Commit, pinned, read-only"**. That is the
   repository's materialized-content rule: the bytes are committed at a
   pinned upstream commit, with sha256 fixity, and are read-only. Updating
   them is a deliberate re-sync, not `autoUpdate`.
3. The two FHIR skills: **"Author them here"**. Measured 2026-09-24:
   TopologyHealth/SMARTerFHIR @ 506463af is a TypeScript library with **zero**
   SKILL.md files, so no sync can serve `smart-launch` or
   `fhir-client-operations`. They are written in `fhir-harness/`, against
   the library's real API.

Also measured 2026-09-24: K-Dense-AI/claude-scientific-skills @ 49c6e977 is
MIT-licensed and holds all three declared skills at `skills/<name>/SKILL.md`
(166 skills upstream), about 680 KB with their scripts and references.
