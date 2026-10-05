---
# folio-assistant-cmsl
title: 'DEDUPE: 11 directories declared twice — and both obvious fixes are measurably wrong'
status: completed
type: task
priority: normal
created_at: 2026-09-21T19:18:36Z
updated_at: 2026-10-01T17:41:20Z
parent: folio-assistant-zzmr
---

Owner asked 2026-09-21: *"we need to dediplicate. options? auto stub prefix?"*
Both options were put to them, both were chosen, and **both turned out to be
measurably wrong**. Recorded here so the next agent does not re-derive it.

## The measurement

**63 declared entries across 52 distinct directories; 11 declared twice.**
Every duplicate has one shape: `cat-harness` declares another instance's
directory with `scope: repository`, and that instance declares it itself.

```
large-datasets/skills
    cat-harness      id=large-datasets-skills   scope=repository
    large-datasets   id=large-datasets-skills   scope=-
```

They have already drifted, which is what a duplicate does:
`detangle-schemas` vs `detangle-schemas-local`, `kg-navigation` vs
`kg-navigation-skills`, and the `graphKinds` differ on some pairs.

## Option 1 — delete the mirrors. TRIED, REVERTED, 23 tests fail.

`kg-export` 2,157 -> 2,125 nodes; `kgDirectories(cat-harness)` 11 -> 7.
23 failures across schema-graph spanning, library reachability, BPMN skill-ref
resolution, package identity and self-URL publication.

**The reason, and it is the whole finding: `cat-harness` has NO
`cat-harness.config.json`, so it has no `dependencies` block at all.** The
`scope: repository` entries are the ONLY mechanism by which it reaches
`who-iris/skills/`, `large-datasets/schemas/`, `agent-skills/library/` and the
rest. They are not redundant copies of an ownership fact. They are an EDGE.

So the two entries are **two different facts wearing one shape**:

- `who-iris:skills/` — who-iris HOLDS this directory. Ownership.
- `cat-harness:who-iris/skills/ scope=repository` — cat-harness REACHES INTO
  it. An edge, in the `utilizes`/`references` sense of the owner's own
  repo-topology diagram.

Deleting the second deletes the edge. The fix is not deletion; it is giving
the edge its own spelling instead of overloading a directory declaration —
either a `dependencies` block on a `cat-harness.config.json`, or an explicit
relation field. That is the real work and it is not small.

## Option 2 — auto stub prefix. NOT NEEDED. Zero collisions today.

10 ids are used by more than one entry, of which 3 are genuinely different
directories sharing a short id (`library` in 4 instances, `voices` in 3,
`uploads` in 2).

**But the export already scopes every id by its instance's own document IRI**
— `<stub>.jsonld#directory/<id>`. Measured: **63 directory IRIs minted, 0
collide.** Prefixing would add a stub to identifiers that are already unique,
and those ids appear in `coverage` paths and committed QA sidecars, so it is
churn on data for no benefit.

What the duplicates DO produce is not a collision but a **disagreement**: one
physical directory carries two different ids in two different documents, so a
consumer merging both exports sees two Directory nodes for one directory. That
is worth fixing, and prefixing does not fix it — it is the same finding as
option 1, from the other end.

## Done when

- The `cat-harness` -> dependency edge has a spelling that is not a directory
  declaration, and the 11 mirrors are removed in the same change.
- A check refuses a new mirror, so this cannot regrow.
- NOT: an auto stub prefix. Reopen only if a real collision is measured.

## Status

todo. The measurement is done and reproducible
(`instanceRootsIn` + `readDeclaration`, resolving `scope: repository` against
the repo root). The design is not taken.

## 2026-09-30 — owner chose "dependencies block"; measured: it would create cycles
needs graph today: cat-harness→bootstrap; folio-assistant-core→cat-harness; fhir-harness→folio-assistant-core; smart-base→fhir-harness; who-iris, large-datasets, agent-skills, folio-assistant-sci need nothing.
Of cat-harness's 23 scope:repository mirrors, 7 reach into folio-assistant-core (skills, schemas, processes, methodologies, library), fhir-harness (skills) or smart-base (library, methodologies, processes) — every one a DEPENDENT of cat-harness. Declaring them as cat-harness dependencies closes a cycle (core needs cat-harness needs core).
The relation is the reverse of a dependency: the platform READS its dependents' graphs (to audit, render and index them). It needs its own spelling — a `reaches` / `reads` list naming <instance>#<directory id>, resolved through the owner's declaration — which is the bean's original "explicit relation field", not a dependencies block. Not built; back to the owner.


## 2026-09-30 — the analysis the owner asked for
Owner: 'analyze and characterize the 23 externals. why? options for relocation/changing arrow directions? schema issues/location issues?' — written up as cat-harness/docs/proposals/cmsl-external-directories-2026-09-30.md. In short: 24 entries in THREE groups — 7 checkout-level state graphs at the repo root that nothing else declares (a location issue, not duplication); 16 content graphs of instances that all depend on cat-harness (an arrow issue: the platform names its dependents; 5 ids and 4 dependents values already drifted); 1 directory only cat-harness declares (folio-assistant-sci/skills/lean/ — an ownership defect in folio-assistant-sci). Recommendation A: the CHECKOUT (root instance) aggregates — it needs every instance and declares the root state; corpus-wide tools resolve kinds over its dependency overlay; cat-harness declares only its own subtree. Awaiting the owner's pick.



## Owner, 2026-09-30 (round 3): option A — the checkout aggregates
In the three steps of the proposal: (1) folio-assistant-sci declares its own `skills/lean/`; (2) the root instance declares the checkout-level state (ids unchanged); (3) an overlay helper, the call-site switch, the mirrors removed, and a check against re-mirroring. The falsifier (a split checkout sees less) is to be confirmed before step 3.



## 2026-09-30 — step 1 reverted: it is a NESTING question, not only an ownership one
Declaring `skills/lean/` in folio-assistant-sci.json put a declared directory inside that instance's inherited `skills/`. `check:layout-norms` rejected it: "folio-assistant-sci: skills contains skills/lean". Its baseline only ever shrinks, so adding the pair to it is not a fix. The mirror in cat-harness.json does not trip the check, because there it is not inside that instance's own `skills/`. Under the owner's 2026-09-22 ruling, the correct shape is a declaration INSIDE sci's `skills/` naming `lean/`. That needs a `declarationFile` on the `skills` (kg) kind, the mechanism `voices` gained in this change (bean rkqp), whose reader now recurses. So step 1 becomes: give `skills` a from-within declaration file, then declare `lean/` there. The mirror stays until then.



## Owner, 2026-09-30 (round 4): step 1 = `skills/` inherited as `reproduce`, plus a from-within `skills.json`
The harness's `skills` entry becomes `dependents: reproduce`, so every instance inherits a declared `skills/` instead of the `(default)` convention. The `skills` kind gains `declarationFile: skills.json`, which names sub-graphs such as `voices/` and `lean/` (in folio-assistant-sci) from within. That sanctions the five baselined `skills contains skills/voices` pairs. The resolver and the checks must follow a declaration file under an inherited directory.


## Owner, 2026-09-30 (round 5): steps 2 and 3 accepted as proposed — issue #1694
- Step 2: the root instance declares the seven checkout-level state entries; **accepted** that their navbar tiles move from the C@T Harness tab to Folio Assistant (tiles come from the declaring instance — measured in `harness-tiles.ts`), and every lookup rooted at `cat-harness/` switches to the checkout root.
- Step 3: remove the 16 mirrors; **falsifier accepted** — a checkout that does not stage every instance shows corpus tools less, which is what that checkout contains.


## 2026-10-01 — step 2 done (PR #1704); step 3 measured, then parked on an owner decision
Step 2: the root instance declares the seven checkout-state entries; every reader that lost them was found by measurement and fixed (see #1694).
Step 3, tried and measured, not committed: there are **19** mirrors, not 16. Removing them, against the baseline:
- `LOCAL_PACKAGES` (what `skill_fetch` serves) lost 7 packages (fhir-client, fhir-ig-base, folio-assistant-core, large-datasets, lean, data, who-iris) — restored by having `resolveSkillDirs` include the checkout's other instances (identical map after).
- `folio-assistant-sci/skills/data/` was declared by NOBODY but the mirror — sci must declare it from within (`data-skills`).
- `skills:docs` (13 pages "produced by no source"), `translate-bpmn` (30 `.pot` templates "with no diagram"), `kg:audit`/`kg:audit:all` (6 sidecars of subjects cat-harness no longer declares) and `skill:register:check` all went red: SITE-level and corpus-level consumers enumerated the checkout through the mirrors.
- **The blocker:** those consumers key pages and categories by DIRECTORY ID, and the mirror ids differ from the owners' own: core `core-skills`/`core-library`/`core-schemas`/`core-processes`/`core-methodologies`, sci `sci-methodologies`/`lean-skills`/`data-skills` vs `folio-assistant-core-skills`, `folio-assist-core-schemas`, `folio-assistant-sci-lean-skills`, … Whichever ids win decides published URLs (e.g. `/docs-auto/index/skills/folio-assistant-core-skills/`). Asked of the owner.
- Second decision: the 6 kg-qa sidecars cat-harness wrote for other instances' subjects become orphans (each owner audits its own) — deleting them is the owner's call.
The authored diff (3 files) is preserved; regen also measured ~2x slower `resolveSkillDirs` (41 → 89 ms/call, measured under load).


## 2026-10-01 — consolidation (session session_01CVVoavPoCHMLA7AASxG8cH, PR #1769)
- Step 3's DATA is placement PR0's 0a (ejye). It merged, then was undone by two merge resolutions (aab80f35 from #1744; 16c02d33 from this bean's #1747 branch). #1769 restores it: 20 mirrors out of cat-harness.json, root needs all 17 staged instances; check:instance-graph green.
- 15 files on main held cmsl step 2's parallel reader while PR0's tests stayed; #1769 restores PR0's version of each (all were touched after PR0 ONLY by cmsl commits).
- Owner, 2026-10-01: close #1747 once #1769 merges.
## Remaining here
- [x] Owner's design question: overlay-and-warn along the dependency chain vs the <stub>/<dir> -> <dir>/<stub> rule (belongs with iirv) — RULED 2026-10-01 late as Q-A ("placement rule (a) + file-level overlay (b)"; per-instance `<instance>/docs/`, never `docs/<stub>/`), recorded below
- [x] ~~Delete the 6 cross-instance kg-qa sidecars (approved)~~ — NOT APPLICABLE after PR0, see 2026-10-01 below
- [x] Skill docs keyed by owner directory id — DONE by placement PR0 (`ejye`): gen-skill-docs.ts keys `core-skills`, `lean-skills`, `data-skills`, `large-datasets-skills`, `who-iris-skills` by the owners' own declarations; docs:auto:check green
- [x] Remove the duplicate checkoutDirectories in schemas/cat-harness.ts (cmsl's), keeping harness-config.ts's (PR0's)

_2026-10-01T12:25:43Z_ — Claimed by claude/fervent-brahmagupta-rbwhzm — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).


## 2026-10-01 (later) — two leftovers settled
- **The cross-instance kg-qa sidecars are not orphans.** Under PR0 the auditor files a subject owned by another instance under its own `test/results/kg-qa/_external/<owner>/`; there are 7 (smart-base 1, folio-assistant-core 1, large-datasets 5). `bun run kg:audit` rewrites them byte-identically and reports no orphan, `kg:audit:check` is green with them, and kg-audit.ts cites the smart-base one as evidence. The step-3 premise ("cat-harness wrote them for subjects it no longer declares") predates PR0. Nothing deleted.
- **Duplicate checkoutDirectories removed.** schemas/cat-harness.ts held checkoutResolvedDirectories / checkoutDirectories / checkoutDirectoriesForGraph (cmsl step 2's parallel version); all nine importers use schemas/harness-config.ts's (PR0's), and the three only called each other. 79 lines out; tsc, eslint clean; cat-harness, placement-pr0-mechanisms, subgraphs, instance-graph-isolation: 130 pass.


## Owner rulings 2026-10-01 late (~17:30) — Q-A, generator retargeting (epic 7x5n)

Recorded by the separation-arc lead's agent; source: owner, session_01ToWZR4RgTRCWeSsgxsSQfT. Plan: Q-A ("placement rule (a) + file-level overlay (b)").

- **Bootstrap outputs, split by kind.**
  - kg-qa verdicts (29), glossary ledgers (6 in cat-harness + 5 in core) and detangle (3) **stay in cat-harness** as the auditor's output. Owner: *"a harness may discuss its dependencies."*
  - UML renders of bootstrap and bootstrap-tools (50) are **rendered at build by bootstrap-tools** for bootstrap's site.
  - Translations of bootstrap's processes (25) **move INTO bootstrap**. bootstrap's index.html links all 6 languages; its README gets one language line linking to the index's translated pages — no translated README files.
  - Owner: *"bootstrap has no tools, but can use bootstrap-tools rendered content."*
- **Committed renderings** (UML pages and SVGs, viewer pages) become **deploy-time output**, rendered at build. Published URLs stay unchanged.
- **Delete the 37 duplicate sidecars** (8 `_external` + 29 tool kg-qa), keeping one copy per subject in its own instance. (This is the deletion confirmation Q-A PR 4 needed.)
- **`tools/index.ts` module-union:** a name collision THROWS, keeping the `contributions.ts` rule.
- **SKOS export URLs (X2):** left out of Q-A until ruled.

**Bearing on this bean (the Q-A `<stub>` question):** the per-instance layout is `<instance>/docs/` (`siteDir()`), never `docs/<stub>/`; outputs live in the instance they are about except the auditor's own verdicts (kg-qa, glossary ledgers, detangle), which stay with cat-harness. No published URL changes.


## Summary of Changes (closed 2026-10-02, session_01CVVoavPoCHMLA7AASxG8cH)
Closed on evidence, both remaining items being settled elsewhere:
- **Design question** — answered by the owner's Q-A ruling (2026-10-01 late, recorded above by the separation-arc lead): placement rule (a) plus file-level overlay (b); outputs live in the instance they are about, except the auditor's own verdicts.
- **Skill docs keyed by owner directory id** — true on main since placement PR0 (`ejye`, restored by #1769): `SKILLS_CATEGORIES` in gen-skill-docs.ts names the owners' ids; the published `docs-auto/index/skills/` directories are `core-skills`, `data-skills`, `fhir-ig-skills`, `large-datasets-skills`, `lean-skills`, `who-iris-skills`, plus the nested-subgraph roots `folio-assistant-sci-skills` and `smart-base-skills`. Measured 2026-10-02: `bun run docs:auto:check` → "4 type(s) up to date".
Steps 1–3 landed through #1704 (step 2) and #1769 (step 3's data, PR0); the duplicate `checkoutDirectories` was removed; the cross-instance kg-qa sidecars were found not to be orphans.
