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

### 3.1 ~~Publishability is declared~~ — SUPERSEDED 2026-09-23

> **This section's rule was reversed by the owner and now lives in a skill:**
> [`skills/folio-core/instance-publication.md`](../../skills/folio-core/instance-publication.md).
> It is not restated here — a rule in two places is a rule free to drift, and
> `kn0t` drifted from its skill in four places within a day.

What this section originally proposed, kept because the reversal is only
legible against it: *"Every instance does **not** get a version"* — an instance
declared `publishable: true` and **only then** owed an `id` and a `version`,
which were **refused** otherwise.

The owner, 2026-09-23:

> all assets get a version and are in "draft" publication. formal publication
> process needs to be deinfed/neeeds tools/depends on instance

So both are universal, and publication is a **state** rather than a boolean.
`"published"` is refused by the schema, because the process that would back it
does not exist.

**Why the original was wrong is worth keeping**, because its reasoning was
good and its model still could not say what was true. §3.1 argued correctly
that "we decided this is internal" and "nobody looked" are different facts and
a boolean defaulting to `false` erases the second. It then shipped a third
state that could express neither: all 17 instances reported *undecided* while
the answer was known for every one of them. **A third state that cannot say
what is the case is a missing value, not a third state.**

### 3.2 A publishable instance declares `id` and `version`

- **`id`** — reverse-DNS, stable forever, never reused. It is the identity.
- **`version`** — a semver triple. No range syntax anywhere, ever (rule 2).
- **`canonicalUrl`** already exists and plays the `uri` role (rule 6).

**Implemented 2026-09-23**, as a `superRefine` on the declaration rather than a
discriminated union — a union on a two-valued discriminant cannot express
*undecided*, which is the state every instance is in. All three are **required**
under `publishable: true` and **refused** otherwise: an `id` on something
nothing outside may depend on reads, to any consumer of the export, exactly like
a published package.

`canonicalUrl` became an obligation rather than a remark, which is an
interpretation of this section and is flagged as one. The argument is §3.4's:
its record is `{packageId, version, uri}`, so a publishable instance without one
cannot be *expressed* as a dependency by anything that depends on it.

`ExactVersionSchema` moved down into `schemas/cat-harness.ts` and is re-exported
from `harness-config.ts`. Two fields in two modules carry the no-ranges rule;
defining it twice would make it hold on whichever half somebody remembered.

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

**Implemented 2026-09-23** — `schemas/depends-on.ts`, emitted by `kg-export` and
checked by `check:published-refs`'s third carrier, which carried this as a
declared gap until now.

**The part worth stating is what it emits INSTEAD.** Most instances here are not
publishable and §3.1 says that is correct, so most edges out of a publishable
instance go to something with no `id` and no `version`. `dependsOn: []` would
state that the instance depends on nothing, which is false; a partial record
with an empty `version` would be worse, since a consumer resolves it and fails.
So each such edge becomes a gap carrying **which of four reasons** applies —
`undecided`, `internal`, `unresolved`, `unreadable` — because the remedy differs
for each, and `undecided` and `internal` are precisely the distinction §3.1
spent a third state on.

An instance that is not publishable emits no block at all and says why, in
`dependsOnUnavailable`. Today every export carries that field, which is the
honest reading of the repository rather than a silence over it.

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

#### The falsifier was run, 2026-09-23. It does not fire.

Over the last 20 commits on `main`, following `--first-parent`:
**18 patch, 1 minor, 1 major.** Both non-patch calls are correct on inspection:

| commit | Δ | bump | what it was |
|---|---|---|---|
| `cd014bfe` | +28 −3 | major | added the SWOT process, two skills and a schema; removed three `Directory` nodes |
| `10e42ec1` | +5 −0 | minor | added a call activity and a gateway to `Process_Ingestion` |

So §4 was built: `schemas/version-bump.ts` and `bun run check:version-bump`.

**The FIRST run of this measurement said the opposite, and that is recorded
because it would have killed the section.** `git log -21 origin/main` without
`--first-parent` interleaves sibling branch tips, so consecutive entries are
not parent→child. It read **3 major / 5 minor / 12 patch** — 40 % non-patch, a
clear fail — and every bit of that signal was one branch's five nodes
oscillating in and out of the comparison. Anyone re-running this must walk the
mainline.

**One known characteristic, reported rather than hidden.** A *rename* reads as
major: the old id is removed and a new one added. That is the conservative
direction and it is honest — a consumer resolving the old id does break — but it
means a major does not imply that capability was withdrawn. The diff carries
`added` and `removed` separately so a reader can see a rename for what it is.

**Four states, and only one is a pass**: `ok`, `under`, `unreleased` (publishable
but never tagged — no baseline exists), and `undetermined` (the baseline could
not be exported, or a version is a pseudo-version with no triple). `--strict`
fails on `undetermined` as well as `under`: a comparison that could not be made
is the state a strict gate most needs to stop.

## 5. What this depends on, and what it does not

**Depends on:** `kg-export` being stable enough to diff (§4.1's falsifier).
**Does not depend on:** `release-please`, whose config is missing (§1.1);
the tarball release path, never exercised; any registry existing. The
submodule path keeps working unchanged throughout — it is the staging tier,
and §3.3 leaves it alone.

## 6. Open questions

1. ~~**Which instances are publishable?**~~ — **ANSWERED 2026-09-23.** All of
   them carry an id and a version, and all of them are in `draft`. The question
   was malformed rather than open: it asked which instances had crossed a line
   that nothing was able to draw.

   The remaining question is **not** which instances, it is *what publishing
   is*: the owner's *"formal publication process needs to be deinfed/neeeds
   tools/depends on instance"*. That is design work with a per-instance answer,
   not a field somebody fills in.

   Two things this section got wrong are worth recording rather than quietly
   fixing. It said **19 instances**; there are **17** — a count in prose,
   falsified, which is the failure `directory-conventions` and `ylj7` have both
   already paid for. And it named `cat-harness`, `who-iris` and
   `who-style-guide` as *"plainly"* or *"probably"* publishable, which under
   the ruling is not a head start: they are draft like everything else, and
   guessing at them was the inference the third state existed to prevent.
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
