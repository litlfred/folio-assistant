---
# folio-assistant-snjh
title: 'INSTANCE VERSIONING §3.1/3.2/3.4/4: publishability declared, dependsOn emitted, bump computed — §4.1''s falsifier ran first and did not fire'
status: in-progress
type: feature
parent: folio-assistant-vke6
created_at: 2026-09-23T08:05:42Z
updated_at: 2026-09-23T08:05:42Z
---


Issue [#1017](https://github.com/litlfred/folio-assistant/issues/1017),
PR [#1018](https://github.com/litlfred/folio-assistant/pull/1018). Implements
the remaining sections of `cat-harness/docs/proposals/instance-versioning.md`.
Sibling of `dhvf`, which settled the DEPENDENCY half (§3.3) and is completed.

## §4.1's falsifier ran first, and the first run was wrong

The proposal refused to have §4 built on trust: *"Measure the surface diff
across the last twenty commits on `main` before committing to this."*

Measured 2026-09-23 along `--first-parent`: **18 patch, 1 minor, 1 major**.
Both non-patch calls correct on inspection — `cd014bfe` added the SWOT process,
two skills and a schema while removing three `Directory` nodes; `10e42ec1`
added a call activity and a gateway. The surface does not churn, so §4 exists.

**Recorded because the first run said the opposite.** `git log -21 origin/main`
without `--first-parent` interleaves sibling branch tips, so consecutive
entries are not parent→child. It read **3 major / 5 minor / 12 patch** — 40 %
non-patch, a clear fail — and every bit of that signal was one branch's five
nodes oscillating in and out of the comparison. **Anyone re-running this must
walk the mainline.** A methodology error that kills a feature looks exactly
like a result.

Both runs kept side by side in the session scratch as
`surface-measurement.txt` and `surface-measurement-INTERLEAVED.txt`.

## What landed

| § | what | where |
|---|---|---|
| 3.1 | `publishable`, three-state — absent is *undecided*, never *false* | `schemas/cat-harness.ts`, `check:publishable` |
| 3.2 | `id` + `version` + `canonicalUrl`, required under `true` and **refused** otherwise | the same `superRefine` |
| 3.4 | `{packageId, version, uri}` per dependency, with four-reason gaps | `schemas/depends-on.ts`, `kg-export` |
| 4 | the bump computed from the exported-surface diff | `schemas/version-bump.ts`, `check:version-bump` |

`ExactVersionSchema` moved down into `cat-harness.ts` and is re-exported from
`harness-config.ts` — two fields in two modules carry the no-ranges rule, and
defining it twice would make it hold on whichever half somebody remembered.

## Three judgement calls, flagged rather than slipped in

1. **`canonicalUrl` became an obligation** under `publishable: true`. §3.2
   states it as *"already exists and plays the `uri` role"*, not as a
   requirement — but §3.4's record is `{packageId, version, uri}`, so a
   publishable instance without one cannot be *expressed* as a dependency.
   Flagged on the issue as reversible.
2. **The surface is keyed on `{type, id}`**, not the id. A node keeping its id
   while changing its type is a different thing under the same name, and an
   id-only key scores that `patch`.
3. **The differ reads every node with an `@id`**, not a hand-picked subset of
   types. §4 lists examples of the declared surface rather than its definition,
   and a list maintained in the differ would silently stop covering a type
   added to the exporter.

## One known characteristic, reported rather than hidden

**A rename reads as major** — the old id removed, a new one added. Conservative
and honest (a consumer resolving the old id does break), but it means a major
does not imply capability was withdrawn. `SurfaceDiff` carries `added` and
`removed` separately so a reader can see a rename for what it is rather than
inferring it from the verdict.

## Three ratchets caught me, which is them working

An undeclared schema module (`kg-export`'s schema audit), two unclassified
modules (`check:partition`), and two check scripts in no workflow
(`gates.test.ts`, the `ot9a` ratchet). All three are the `v8gh` property.

## Done when

- [x] §4.1's falsifier run, result reported **whichever way it went**
- [x] §3.1 `publishable` three-state + `check:publishable` census
- [x] §3.2 `id` / `version` / `canonicalUrl`, both directions refused
- [x] §3.4 `dependsOn` emitted, with four-reason gaps for what it cannot express
- [x] §4 `check:version-bump`, `surfaceAtRef` verified end-to-end against a real tag
- [x] `bun run gates` green (130)
- [ ] PR #1018 merged — **owner's call, not mine**

## Deliberately NOT done

**§6 Q1 — which instances are publishable.** *"The rest are unclear and should
be declared rather than inferred."* So nothing declares it: all 19 instances
report *undecided*, and both new gates report a **stated nothing** rather than
a pass. Inferring the answer is the one thing the third state exists to
prevent. §6 Q2 (where released packages live) and Q3 (whether `package.json`'s
`0.1.0` is cat-harness's version) are likewise untouched.
