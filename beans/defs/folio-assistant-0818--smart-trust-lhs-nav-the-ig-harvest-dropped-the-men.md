---
# folio-assistant-0818
title: 'SMART-TRUST LHS NAV: the IG harvest dropped the menu AND the narrative pages — 0 of 12 menu labels resolve against 674 artefacts'
status: completed
type: feature
parent: folio-assistant-yj32
created_at: 2026-09-23T10:59:25Z
updated_at: 2026-09-23T10:59:25Z
---


Owner, 2026-09-23, with a screenshot of the published IG's top bar open on
*Data Models and Exchange*:

> https://litlfred.github.io/folio-assistant/smart-trust/ shoukd mirror stylin
> of https://worldhealthorganization.github.io/smart-trust/ except navar menu
> is now on LHS. … smart-guideline/base need harness

## What the harvest kept, and what it dropped — MEASURED

`smart-trust/fhir-artifact-index/index.json` carries
`source: {kind: "gh-pages", of: "…/smart-trust", readAt: "2026-09-21"}` and
**674 artefacts in 8 categories**. It carries **no `menu`**, and no raw HTML
was retained (`find smart-trust -name '*.html'` → 0).

The twelve labels visible in the owner's screenshot — Home, Business
Requirements, Data Models and Exchange, Deployment, Indices, System Actors,
Transactions, Sequence Diagrams, Trust Domains, Trust Network Gateway
Architecture, DID Trustlist Specification, HCERT Specification — were matched
against every artefact title in the index:

> **0 of 12 resolve.**

So the harvest kept the IG's FHIR **artefacts** and dropped both its
**navigation** and the **narrative pages** that navigation points at. This is
not a rendering gap; it is a gap in what was ingested.

## Why the menu was NOT transcribed from the screenshot

Three reasons, and the first alone settles it:

1. **The hrefs are not in the picture.** Writing them would mean guessing URLs
   into a published artefact. A guessed link is worse than an absent one: it
   resolves for a reader and lands somewhere nobody chose.
2. **Three of the five dropdowns are closed**, so the label set is partial too.
   A menu captured this way could not tell "this item has no children" from
   "the dropdown was shut when the picture was taken" — the `dh4f` distinction,
   at the point of capture.
3. `wjfu` already set the rule for this corpus: *"Generated from the KG, never
   transcribed."*

`SushiConfigLogicalModel` (in `smart-base/fhir-artifact-index/dak/`) already
models the shape — `menu: array`, *"Navigation menu structure for the IG"*,
with `subItems` — so the SCHEMA is not what is missing. The DATA is.

**What unblocks it:** `sushi-config.yaml`'s `menu:` block (labels *and*
hrefs), or a re-harvest that keeps the IG's HTML. Both need either the WHO
source repository — out of bounds under the owner's standing *"leave
who/smart-* alone for now"* — or network access to a host this environment
denies: `litlfred.github.io:443` and `worldhealthorganization.github.io:443`
both answered **403 CONNECT (policy denial)** when tested on 2026-09-23.
`wjfu` recorded the same denial on 2026-09-21.

## What WAS fixed — one number carrying two facts

`shell()` in `gen-smart-trust-pages.ts` took `depth = 0 | 1`. A **category**
page and an **artefact** page both passed `1`, so the `nav_exclude` written for
the 674 leaves swept the category pages out with them. The left-hand nav showed
exactly **one** smart-trust row — the index — and the structure the index is
grouped by was invisible in the one place a reader navigates from.

The comment justifying it was right about the leaves and wrong about the
sections: *"674 artefacts would bury the sidebar's real structure"* — the
categories ARE that structure.

Replaced by an explicit `NavRole`: `index` (`has_children`), `section`
(`parent` + `nav_order`), `leaf` (`nav_exclude`). `INDEX_TITLE` is one
constant referenced twice, because just-the-docs matches a child to its parent
**by title string** — written independently, a re-titled index silently orphans
every section and the sidebar quietly flattens.

## The effect is ONE row, not eight, and that is reported rather than dressed up

Only categories over `INLINE_LIMIT` (100) get their own page; 7 of the 8 are
inlined on the index. So today this adds exactly **one** child to the sidebar
(`Other`, 604 artefacts). The conflation is fixed and the structure is correct
for however many sections exist — but anyone reading "left-hand nav" in the
title should not expect eight.

Giving all 8 categories pages would change `INLINE_LIMIT`'s recorded design
decision, so it was NOT done unasked.

## Done when

- [x] measure what the harvest kept and dropped, with a number
- [x] `NavRole` replaces `depth`; sections are listed, leaves excluded
- [x] 4 tests on the RENDERED front matter, falsified both ways (2 fail when reverted)
- [x] `smart-trust:pages:check` green; 4060 tests pass
- [x] the IG's own `menu` captured as data — **UNBLOCKED**, see below
- [ ] `smart-base.config.json` — offered, not yet authorised by the owner


## UNBLOCKED — the owner named the right source

2026-09-23: *"tried to open network policy for worldhealthorganization.github.io,
but source is in github.com under WHO's smart-base, smart-trust etc"*.

That is the correction that mattered. The Pages host is the IG's **output**;
`sushi-config.yaml` is its **source**, and it is in an ordinary public GitHub
repository the session's git proxy already serves anonymously. No policy change
was needed — I had been asking for the wrong door.

Cloned `WorldHealthOrganization/smart-trust` read-only at `26635f7b` and read
its `menu:` block. It carries **5 groups and 29 items, with hrefs** — the thing
a screenshot could never supply:

| group | items |
|---|---|
| Home | 4 |
| Business Requirements | 6 |
| Data Models and Exchange | **7** |
| Deployment | 7 |
| Indices | 5 |

Seven under *Data Models and Exchange* — exactly the seven visible in the
owner's screenshot, which is the cheap check that the right file was read.
`Indices → DAK API: dak-api.html` is also there, which is what
`update_sushi_config.py` registers, matching `dak-preprocessing.md`.

## What was built

| piece | what it is |
|---|---|
| `schemas/ig-menu.ts` | `folio-ig-menu/v1` — groups, items, and a `source` block that REQUIRES a commit |
| `scripts/ingest-ig-menu.ts` | reads `sushi-config.yaml`; `--check` compares; no `--source` exits **2** |
| `gen-smart-trust-pages.ts` | 5 section pages, `nav_order` 1–5 in the config's own order |
| graph-kind registry | `folio-ig-menu/v1` mapped to its validator — `1/1 parse` |
| `gates.ts` | an exemption, with the reason CI cannot obtain the input |

The hrefs are **verbatim** from the config, resolved against `canonical` by one
function, so they are right by construction rather than by testing — which
matters, because nothing here can fetch them to check.

`menu.json` is a SECOND document in `fhir-artifact-index/`, not a field added
to `index.json`. Two sources — the IG's published output, and its source config
at a commit — so two provenance blocks. Folding them would give one file two
answers to "where did this come from".

## Three states, kept

`ingest-ig-menu --check` with no `--source` prints `could not determine` and
exits **2** — not 0, and not 1. In CI the upstream is absent, which is normal;
a gate that silently passed there would be asserting a comparison it never
made. What IS gated without the network is the menu's EFFECT:
`smart-trust:pages:check` regenerates the 5 sections from `menu.json` and
compares byte for byte.

The generator also reports `0 menu section(s) — COULD NOT DETERMINE` when the
file is absent, rather than rendering a site with no navigation and calling it
complete.

## Ratchets that caught this on the way

Five, all of them the `v8gh` property working: an unclassified module
(`check:partition`), a new artefact check with no verification declaration, a
stale docs-auto index, an unmapped `$schema` family, and an unrun check script.
The verification declaration names the real gap — **nothing resolves the 29
hrefs**, because the pages they point at are published upstream and both hosts
answer 403 here.


## Summary of Changes

Merged as [#1064](https://github.com/litlfred/folio-assistant/pull/1064) →
`5a71d8e`, closing
[#1063](https://github.com/litlfred/folio-assistant/issues/1063).

The IG's top bar is the left-hand nav, built from the IG's own
`sushi-config.yaml` at commit `26635f7b` — 5 groups, 29 items, in the config's
own order.

| file | what |
|---|---|
| `cat-harness/schemas/ig-menu.ts` | `folio-ig-menu/v1`; its `source` block requires a commit |
| `cat-harness/scripts/ingest-ig-menu.ts` | both SUSHI menu shapes; no `--source` exits 2 |
| `smart-trust/scripts/gen-smart-trust-pages.ts` | `NavRole` replaces `depth`; one section page per group |
| `cat-harness/schemas/graph-kind-registry.ts` | the family mapped — `1/1 parse` |
| `cat-harness/scripts/gates.ts` | the exemption, with why CI cannot obtain the input |

## What merged it, and what did NOT

**Code-quality gates never returned a verdict on any of the four heads.**
`get_status` read `total_count: 0` on `f5a1e1f`, `50bf8c7`, `cdb7e33` and
`8e6eb44`. It was merged on `bun run gates` — 135/135, run on four separate
merged trees — plus the JSON-LD drift job, which is real CI and passed on the
exact head, plus `smart-trust:pages:check`, `ingest:ig-menu:check --source`
and `check:kind-validators`.

Same checks, since `gates.ts` derives its list from that very workflow file.
**Not the same evidence**, and the distinction is recorded rather than
smoothed over.

**A claim made in chat and then falsified: I said the `pull_request` trigger
was systematically stalled.** It is not. Measured afterwards: Code-quality
gates ran on `pull_request` and completed for #1085, #1074 and #1086 inside
the same window. The cause is at least partly my own push cadence — see bean
`mc8h`.

## Left open, deliberately

- **`smart-base.config.json`** — offered three times, never authorised. smart-base
  holds 2575 library files, 139 artefact-index entries, tools, skills and
  methodologies here and carries no root config, so it is absent from the
  navbar's harness tiles. `smart-ig` is excluded on purpose: it declares no
  directories and holds 5 boilerplate files, so instantiating it would assert
  something false.
- **The WHO visual styling** — blue bar, DRAFT watermark, yellow publish
  banner. A different question from the menu, and probably smart-base's theme
  rather than smart-trust's.
- **Nothing resolves the 29 hrefs.** Declared in `artefact-verification.json`,
  not assumed away.
