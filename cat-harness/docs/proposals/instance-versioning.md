---
title: "Instance versioning and dependency resolution, aligned to FHIR/SUSHI"
kind: proposal
movedFrom: fsh-guts/proposals/
movedOn: 2026-09-23
issue: 592
summary: >-
  Downstream alignment to FHIR/SUSHI is a hard constraint, which settles exact-version pinning over npm-style ranges. Proposes id + version on publishable instances, a dependsOn-shaped published record, and a version bump COMPUTED by diffing the exported graph rather than asserted by a commit message.
---

# Instance versioning and dependency resolution

> **Editorial correction, 2026-09-23.** This proposal was written while the
> instance declaration was a fixed `harness.json`; it is `<name>.json` since
> the 2026-09-21 split (`<name>.config.json` is the config beside it). The
> references below were updated so a reader is not sent to a file that does not
> exist — the proposal's argument is untouched, and only the filename moved.
> The occurrences were invisible while this lived under `fsh-guts/`, which the
> filename gate counts as retired material; publishing it is what surfaced them.


Asked 2026-09-20, in three messages:

> following sushi/fhir depndency rules (make sure documented)... this may need
> too, but IG publisher is heavy... sushi maybe has a bit we can extract for
> calculation of version? or maybe we do node versision + semver.

> \[are instances consumed outside this monorepo?\] **Yes — some are consumed
> externally.**

> downstream we need to align to fhir, sushi. **hard constraint.**

> sha is for staging, regernecing in published SEMVER

**The hard constraint settles the question this proposal was going to argue.**
npm-style semver *ranges* are out. FHIR pins exact versions, and a downstream
that must align to FHIR cannot be handed a dependency set expressed as ranges.
What remains to design is narrower and more interesting: what an instance's
version *means*, and what makes it go up.

## 1. Measured, 2026-09-20 on `main` at `0206e908`

| | |
|---|---|
| where a dependency is declared | `harness.config.json` → `dependencies.folioAssistant` |
| its shape | `{name, path?, git?, ref?, provides?}` — `cat-harness/schemas/harness-config.ts:52-80` |
| **version field** | **none** |
| `ref` | a git ref that **defaults to the default branch** |
| instances declaring their own version | **0 of 11** |
| the default external link | **git submodule**, written by `folio_init` |
| release machinery | `release-folio-assistant.yml` (tarball via GitHub Releases), `release-please.yml` (semver from conventional commits) |
| git tags in this repository | **0** |
| `release-please` config it names | `.github/release-please-config.json`, `.github/release-please-manifest.json` — **neither exists** |
| `release-please`'s stated scope | *"the 7 published packages under `tools/`"* — inherited from another repository's history |
| `package.json` version | `0.1.0`, one for the whole monorepo |

### 1.1 Three defects of one shape, found while establishing the above

Each is the `xom7` shape — machinery that exists and whose failure is
invisible from a checkout:

1. **`release-please.yml` runs on every push to `main` against config files
   that are not in the repository.** Its own header documents them by path.
2. **Its stated scope is another repository's.** "7 published packages under
   `tools/`", naming `pyhecke` and `qou-substrate`, is text that travelled
   with the file. A reader takes it as a description of this repository.
3. **Zero tags.** The release path has never been exercised, so nothing about
   it is known to work — including the tarball consumers are told to install.

**None of these is this proposal's to fix**, but a versioning scheme designed
on top of them would inherit all three. They are listed so the scheme below
can say which it depends on.

### 1.2 What already works, and the tier it belongs to

`folio_init`'s **default link mode is a git submodule**, "because it makes the
folio reproducible: a clone with `--recurse-submodules`…". **A submodule is a
SHA pin** — exact, verifiable and reproducible.

**It is not a substitute for a version, and the owner drew that line
explicitly:**

> sha is for staging, regernecing in published SEMVER

So the SHA is right where it is and must not travel further. §3.3 makes that
a rule with a gate rather than a convention.

## 2. The FHIR/SUSHI rules to align to

Stated as rules rather than as an implementation, because the constraint is
alignment downstream, not adoption of a registry here. Confidence is high on
each except where marked.

1. **A package has an `id` and a `version`.** The id is the identity and never
   changes; the version distinguishes snapshots of it.
2. **A dependency names an EXACT version, never a range.** This is the single
   largest divergence from npm and the one that matters most here.
3. **`current` and `dev` are pseudo-versions** meaning "the latest CI build",
   deliberately outside semver, for pre-release consumption.
4. **The published record is `dependsOn`**: `packageId`, `version`, `uri` —
   identity, pin, and canonical location, together.
5. **Resolution is a lookup, not a derivation.** A registry of tarballs plus a
   local cache; nothing recomputes a version at resolve time.
6. **The canonical URL is stable across versions.** The version does not
   appear in the identity.

**SUSHI calculates no version.** It reads `version:` from `sushi-config.yaml`
and writes it into the IG. *(High confidence.)* The heavy lifting — validation,
snapshot generation, rendering — is the IG Publisher's, which is the weight the
owner flagged. What is separable in SUSHI is its **package resolver and cache**,
not a version calculator. *(Medium confidence: would need reading the source,
and `build.fhir.org` is blocked from this sandbox — bean `267x` recorded the
same limit.)*

**So the question "can we extract SUSHI's version calculation" is closed with
a no**, and §4 gives the answer it was reaching for from somewhere better.

## 3. Proposal

### 3.1 Publishability is declared, and most instances are not publishable

Every instance does **not** get a version. An instance declares
`publishable: true` in its `<name>.json`, and only then owes an `id` and a
`version`.

The reason is the measurement in §1: eleven instances, and the ones with
external consumers are few. Minting a version for `detangle` — a directory in
this repository that nothing outside resolves — is ceremony with no reader,
and a version nobody consumes is a version nobody checks.

**Absence is a third state, not a default.** An instance that has not declared
`publishable` is *undecided*, never *false*, and a gate reports it — the same
rule `publication.host` already follows.

### 3.2 A publishable instance declares `id` and `version`

- **`id`** — reverse-DNS, stable forever, never reused. It is the identity.
- **`version`** — a semver triple. No range syntax anywhere, ever (rule 2).
- **`canonicalUrl`** already exists and plays the `uri` role (rule 6).

### 3.3 Two tiers: a SHA stages, a version publishes

**The rule, in one line: a SHA may appear in a working checkout and never in
a published artefact.**

| tier | what a reference may be | why |
|---|---|---|
| **staging** — a working checkout, a preview build, a branch under review | a submodule SHA, a git `ref`, or a pinned version | the consumer can resolve a SHA: they have the repository |
| **published** — anything an external consumer reads | **semver only** | they cannot resolve a SHA, and FHIR has no way to express one |

A SHA is a perfectly good pin and a **useless published reference**: it names
a commit in a repository the downstream consumer may not have, may not be able
to fetch, and in FHIR's vocabulary cannot state at all — `dependsOn` has
`packageId` and `version`, and no field a SHA belongs in. A published artefact
carrying one is not a stricter pin; it is an unresolvable one.

So `FolioAssistantDependency` gains `id` and `version`. `ref` and `git` stay,
and their status changes: they are **how to fetch while staging**, not **what
is depended on**. The submodule keeps working exactly as it does now.

**`current` is a staging pseudo-version too.** FHIR permits it (rule 3), and
under this rule it is permitted in the same tier as a SHA and barred from the
same one. Today's floating `ref` is `current` **by accident**, which is the
defect: the pre-release choice is being made by a default rather than written
down.

**Gate — `check:published-refs`, implemented 2026-09-20.** Every reference in a published
artefact resolves to a semver version. A SHA, a branch name, or `current`
reaching the published tier fails it. This is the narrowest possible
expression of the owner's rule, and it is the one gate this proposal would
ask for first — before `id`, before `publishable`, before anything in §4 —
because it is the one that can be written against today's data. It is
`bun run check:published-refs`; advisory by default, `--strict` to fail.

### 3.4 The published graph carries a `dependsOn`-shaped record

`kg-export` emits, per publishable instance, `{packageId, version, uri}` per
dependency. An external consumer then reads this instance's dependency set the
same way it reads a FHIR IG's, which is what "align downstream" means in
practice.

## 4. What a version MEANS, and what makes it go up

This is the part the owner asked to be worked out, and it is where the scheme
earns its keep.

**A version governs a surface.** For a code library that is the exported API.
For an instance it is the **declared** surface, and this repository already
knows how to enumerate it: graph kinds, skill ids, tool ids, block kinds,
asset roles, declared directories — everything `kg-export` walks.

| bump | when |
|---|---|
| **major** | a consumer must change something: a graph kind, skill id, tool id, block kind or asset role **removed or renamed**; a schema field made required; a declared directory withdrawn |
| **minor** | something **added** that a consumer may use: a new skill, graph kind, tool, block kind |
| **patch** | everything else, prose included |

### 4.1 The bump is COMPUTED, not asserted

**`kg-export` already produces the surface, so the diff between two refs
determines the bump mechanically.** A removal is major; an addition is minor;
neither is patch. This is the answer to *"sushi maybe has a bit we can extract
for calculation of version?"* — not from SUSHI, which calculates nothing, but
from this repository's own exporter.

It is strictly better than the conventional-commit heuristic `release-please`
implements, and for a reason worth stating: **a commit message is a claim about
a change; an exported-graph diff is the change.** A `feat:` prefix on a commit
that removed a skill id yields a minor bump and a broken consumer. The diff
cannot make that mistake.

**Proposed gate.** `check:version-bump` compares the exported surface at
`HEAD` against the last released tag for that instance and fails when the
declared `version` is lower than the computed one. It never *writes* the
version — the author may always bump further than computed (a prose rewrite
released as minor is their call), but never less.

**The falsifier, and it should be tested before this is built:** if the
exported surface churns on changes that are not consumer-visible — ids that
are positional, or generated nodes whose count varies — then the computed bump
is noise and every release reads as major. Measure the surface diff across the
last twenty commits on `main` before committing to this.

## 5. What this depends on, and what it does not

**Depends on:** `kg-export` being stable enough to diff (§4.1's falsifier).
**Does not depend on:** `release-please`, whose config is missing (§1.1);
the tarball release path, never exercised; any registry existing. The
submodule path keeps working unchanged throughout — it is the staging tier,
and §3.3 leaves it alone.

## 6. Open questions

1. **Which instances are publishable?** The answer decides the size of
   everything above. `cat-harness` plainly is. `who-iris` and
   `who-style-guide` probably are, given WHO consumers. The rest are unclear
   and should be declared rather than inferred.
2. **Where do released packages live?** FHIR's answer is `packages.fhir.org`.
   This repository's nearest existing thing is GitHub Releases, which is
   tarball-shaped rather than FHIR-package-shaped. Aligning the *rules*
   (§2) does not require aligning the *registry*, and this proposal
   deliberately does not decide it.
3. **Is `0.1.0` in `package.json` the same version as `cat-harness`'s?**
   Today one number stands for the whole monorepo. Under this scheme they are
   different objects and should not share a field.
4. ~~**What does a staging preview publish?**~~ **SETTLED 2026-09-20** —
   owner: *"preview is staging, not published"*. A preview is externally
   reachable and provisional, which is what made it ambiguous; the tier is
   decided by whether a consumer may DEPEND on it, not by whether they can
   reach it. So a SHA in a preview is correct, and `check:published-refs`
   excludes `/STAGING/` by design rather than by omission.
