---
# folio-assistant-dhvf
title: 'DEPENDENCY VERSIONS: instance deps float on a git branch, and nothing declares a version — SUSHI/FHIR vs semver options'
status: completed
type: task
priority: normal
created_at: 2026-09-20T20:03:30Z
updated_at: 2026-09-20T20:14:22Z
parent: folio-assistant-vke6
---


Owner, 2026-09-20:

> ....following sushi/fhir depndency rules (make sure documented)... this may
> need too, but IG publisher is heavy... sushi maybe has a bit we can extract
> for calculation of version?  or maybe we do node versision + semver.  give
> analsysi in discusion options/pros/cons...

## Measured on `main` at `0206e908`

| | |
|---|---|
| where a dependency is declared | `harness.config.json` → `dependencies.folioAssistant` |
| its shape | `{name, path?, git?, ref?, provides?}` — `schemas/harness-config.ts:52-80` |
| **version field** | **none** |
| `ref` | a git ref (branch, tag or SHA) that **defaults to the default branch** |
| instances declaring their own version | **0 of 11** — no `version` key in any `harness.json` |
| repo version | `package.json` 0.1.0, one for the whole monorepo |
| resolution | depth-first, listed order, later overlays earlier (`harness-config.ts:11-15`) |
| existing pin mechanism | `upstream-pins.json`, third-party only (one pin: just-the-docs) |

**The docblock already claims the SUSHI lineage** — `harness-config.ts:14`:
*"This is the same methodology as FHIR/SUSHI dependencies — declared upstream,
walked deterministically, later overlays earlier."* That is true of the WALK
and false of the PIN: SUSHI names `id@version` and this names a branch.

## The blocker that is prior to the options

**Semver resolution requires that something declare a version, and nothing
does.** A FHIR package carries `name` + `version` in its `package.json`; an npm
package likewise. Every one of the eleven instances here carries neither. So
option C is not a scheme that can be adopted — it is a scheme that would have
to be CREATED, starting with minting a version for each instance and deciding
what makes it go up.

**The live defect is not which scheme. It is that `ref` defaults to a branch.**
A dependency resolved at the default branch is a different dependency on
Tuesday, and no gate notices. That is `xom7`'s shape: a thing that changes
under you with nothing in the repository saying so.

## What SUSHI actually does, and what is extractable

Stated with confidence levels, because build.fhir.org is blocked from this
sandbox (bean `267x` recorded the same limit):

- **High confidence.** `sushi-config.yaml` carries `version:` for the IG itself
  and `dependencies:` as `packageId: version` pairs. Resolution is against the
  FHIR package registry — a flat npm-like store of tarballs — cached under
  `~/.fhir/packages`. `ImplementationGuide.dependsOn` carries `packageId`,
  `version` and `uri`. `current` and `dev` are special pseudo-versions meaning
  "latest CI build", outside semver.
- **High confidence.** SUSHI does **not** calculate a version. It READS
  `version:` from the config and writes it into the IG. The heavy lifting —
  validation, snapshot generation, rendering — is the IG Publisher's, which is
  the weight the owner names.
- **Medium confidence, would need checking against the source.** What is
  genuinely separable in SUSHI is not a version calculator but the **package
  resolver + cache** (id#version → tarball → parsed definitions). If anything
  is to be lifted, it is that.

**So "extract SUSHI's version bit" has no target.** There is no version
calculation in SUSHI to extract.

## Options

### A — adopt FHIR package rules wholesale
Each instance gets a package id and a version; dependencies name `id@version`;
a registry serves tarballs.
- **Pro.** Proven at scale; matches the WHO SMART Guidelines work this repo
  already does; `dependsOn` is a published, canonical record.
- **Con.** Needs a registry and a publish step that do not exist. Heavy for
  eleven instances that live in **one git repository** and are always checked
  out together. Pseudo-versions (`current`) reintroduce the floating pointer
  this would exist to remove.
- **Cost here.** `harness-config.ts`, a new publish pipeline, a cache, a
  resolver. Large.

### B — extract SUSHI's version calculation
- **There is nothing to extract** (above). Recording it so the option is closed
  with a reason rather than left open.

### C — npm-style semver ranges + lockfile
- **Pro.** Familiar; `bun`/`npm` already present; ranges express compatibility
  intent that a SHA cannot.
- **Con.** Requires minting and maintaining a version per instance, and a rule
  for when it goes up — for instances that are directories in one repo, that
  rule is ceremony with no reader. A lockfile over sibling directories records
  what git already records exactly.
- **Cost here.** Same as A minus the registry.

### D — pin the git ref, and version only what is published (RECOMMENDED)
Make `ref` **required**, treat a SHA as the canonical pin, and gate it — the
existing `upstream-pins.json` idiom one level in. Introduce a version only for
an instance actually consumed by someone who cannot see this git history.
- **Pro.** A SHA is already an exact, verifiable, tamper-evident version
  identifier — strictly stronger than semver for reproducibility. Fixes the
  real defect (floating refs) in one change. Consistent with the repo's own pin
  discipline, including its rule that a registry must not hold a second copy of
  the version.
- **Con.** A SHA carries no compatibility signal — nothing says whether moving
  from one to another is breaking. That is exactly what semver buys, and D does
  not buy it.
- **Cost here.** `FolioAssistantDependency` gains a required `ref`;
  a `check:instance-pins` gate; the skill entry below. Small.

## What "make sure documented" means

[`folio-core/directory-conventions`](../../cat-harness/skills/folio-core/directory-conventions.md)
owns the declaration and what an instance inherits from a dependency. The
version/pin rule belongs there, not in a new skill — a second skill about
declarations is a second answer to what a declaration says. The generated
reference then carries it, and the `harness-config.ts` docblock's SUSHI claim
gets corrected to say the walk is SUSHI-like and the pin is not.

## The one question

**Is any instance here consumed from outside this monorepo, by someone who
cannot see its git history?** If yes, published versions are needed (A or C).
If no, SHAs are strictly better and semver is ceremony. Nothing else about the
choice matters as much.

## Done when

[ ] The question above is answered
[ ] `ref` is required, or a version scheme is chosen with the reason recorded
[ ] A gate fails a dependency that floats
[ ] `directory-conventions` states the rule; the SUSHI claim in
    `harness-config.ts` is corrected to name the half that is true

## ANSWERED 2026-09-20, and the answers close two of the four options

Owner, in sequence:

> \[consumed outside the monorepo?\] **Yes — some are consumed externally.**
>
> downstream we need to align to fhir, sushi. **hard constraint.**
>
> sha is for staging, regernecing in published SEMVER

**Option D is dead and option C is dead.** D relied on a SHA being a
sufficient pin; the third message bars a SHA from a published reference. C is
npm-style ranges; FHIR pins exact versions and a downstream aligning to FHIR
cannot be handed ranges. **Option A, on the rules rather than the registry.**

Full scheme drafted: [`fsh-guts/proposals/instance-versioning.md`](../../fsh-guts/proposals/instance-versioning.md).

Three defects found while establishing the ground, all the `xom7` shape and
none of them this bean's to fix:

1. `release-please.yml` runs on every push to `main` against
   `.github/release-please-config.json` and `.github/release-please-manifest.json` —
   **neither is in the repository**.
2. Its stated scope is another repository's: *"the 7 published packages under
   `tools/`"*, naming `pyhecke` and `qou-substrate`.
3. **Zero tags.** The release path has never been exercised.

The proposal's own first ask is the narrowest one: a `check:published-refs`
gate failing a SHA, a branch name or `current` in a published artefact. It can
be written against today's data, before `id`, `version` or `publishable` exist.


## The last open box closed, 2026-09-21 — and the gate has one live finding

Three of the four remaining boxes were already done and unticked; verified
each against the tree rather than the prose:

| | |
|---|---|
| `check:published-refs` | registered in `package.json`, and **run by `code-quality-gates.yml:662`** — not merely present |
| `directory-conventions` | §"Pinning a reference — a SHA may stage, only a version may publish", with the two-tier table |
| the SUSHI claim | **still wrong** — the one thing left |

### The correction

`harness-config.ts:14` said the dependency model *"is the same methodology as
FHIR/SUSHI dependencies"*, unqualified. It is the same for the **walk** and
not for the **pin**: SUSHI names `packageId: version` against a registry,
while `FolioAssistantDependencySchema` names a git `ref` that DEFAULTS TO THE
DEFAULT BRANCH. Now says which half is true, names the `xom7` shape it creates
— a dependency that is a different dependency on Tuesday with nothing
noticing — and points at the skill section and the gate rather than restating
either.

### The gate reports one finding, and it is worth a second opinion

```
✗ . → agent-instructions (litlfred/folio-assistant/bootstrap/AGENTS.md)
  unpinned — no ref at all — `current` by omission
```

**Left alone, deliberately.** The source is `{instance:
"litlfred/folio-assistant", path: "bootstrap/AGENTS.md"}` — the SAME
repository. Source and descendant are committed together and move atomically,
so there is no floating window between them in the sense the gate exists to
catch.

It is not obviously a false positive either: the asset's own description says
the point of `source` is that *"is this still what it was copied from" is a
question that can be ASKED*, and without a ref you can ask whether it matches
HEAD, not whether it matches what was copied.

So the question is whether a SAME-REPO provenance source needs a ref, and of
which tier — a judgement belonging to whoever wrote the gate, not to be
settled by inventing a ref to silence it. The gate is advisory and reports it
as 0 major, which is the correct handling of a finding nobody has ruled on.
