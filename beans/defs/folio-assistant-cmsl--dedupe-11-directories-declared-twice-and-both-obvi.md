---
# folio-assistant-cmsl
title: 'DEDUPE: 11 directories declared twice — and both obvious fixes are measurably wrong'
status: todo
type: task
priority: normal
created_at: 2026-09-21T19:18:36Z
updated_at: 2026-10-01T01:54:43Z
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
