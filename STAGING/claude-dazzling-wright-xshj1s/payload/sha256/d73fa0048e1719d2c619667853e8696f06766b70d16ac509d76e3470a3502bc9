---
# folio-assistant-rfev
title: 'C: built-ins self-register at the outermost layer — wire the ContributionRegistry for the first time'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T13:21:31Z
updated_at: 2026-09-21T15:35:10Z
parent: folio-assistant-vke6
---

**Owner's decision, 2026-09-21: C now, B as the destination.** Answering the
three-way question `zlmp` parked — who registers a BUILT-IN adapter's
contributions. C is built-ins self-registering at the outermost layer; B is no
built-ins at all, every adapter a real dependency with a `contributes` module.

## Why this is wiring, not extending

`schemas/contributions.ts` is 370 lines and complete — collision throws naming
both contributors, a diamond re-registration is a no-op, and there are lookups
for kinds, adapters, tools, checkers and renderers. **It has zero production
consumers.** Every reference outside the file is its own test. (`zlmp` records
`harness-config.ts:465` constructing one per call; that is stale — that file no
longer imports `contributions.ts` at all.)

Two consequences for C, both structural rather than matters of taste:

1. **`register()` refuses a built-in adapter or block kind outright** — by
   design, with the reason on the guard: silently shadowing `theorem` would
   change what every existing folio validates against, from a config file two
   repos away. So C is available for **checkers and renderers**, and kinds and
   adapters are B's business. Relaxing that guard to make C reach further would
   discard the protection B is supposed to end up with.
2. The layer order is `harness < core < sci < kg < base`, so the "outermost
   layer" is `sci` / `base` — the leaf packages, and ultimately the folio
   repository itself. C therefore means an entry point ABOVE core registers the
   built-ins and hands the registry down; it does not mean `qa-sweep.ts`
   registering them, because `qa-sweep.ts` is core.

## The gap that blocked step one

`QaCheckerContribution` carried `{ criterion, check }` and **no source file**.
The sweep skips a criterion whose verdict is still fresh, and freshness is
`script_hash`, which `computeCriterionScriptHashes(criterionId, sourceFile, …)`
computes by reading the bytes at `join(repoRoot, sourceFile)`. A checker handed
over as a bare function has no bytes, so its hash is `""` — and
`qa-criteria-registry.ts:2592` records exactly what that costs:

> a criterion pointed at a file that does not contain its checker NEVER
> INVALIDATES. Its verdicts stay "fresh" forever, and editing the real checker
> changes nothing.

Eleven criteria were measured in that state on 2026-09-18, found only because a
fix to `checkAuthorNotesPollution` changed no verdict. So **every contributed
checker would have landed there on arrival** — the seam would have looked wired
and quietly stopped invalidating.

### Landed

- `QaCheckerContribution.sourceFile` — **required**, relative to the
  contributor's own root. Optional would make "no source file" a state a
  contributor enters by omission, which is the same state reached more quietly.
- `FolioContribution.root` — pinned by `loadContributions` from the dependency
  entry, for the same reason `name` is pinned there: a contributor that could
  name its own root could point the sweep at bytes it does not own. The fixture
  module claims `/somewhere/else` and loses, which is the test.
- `ContributionRegistry.qaCheckerEntry()` — the checker plus where its bytes
  are plus the portable `<contributor>/<sourceFile>` label to record as
  `source_file`. Separate from `qaChecker()` rather than replacing it: a caller
  that only RUNS a checker should not have to know where it came from, and a
  caller that HASHES one must not be able to forget.
- `qaCheckers` without a root is refused at registration, naming the
  contributor — where it is still fixable, rather than later as a criterion
  that simply stopped invalidating.

Falsified: removing the root pin fails exactly the one test that asserts it.

## Still to do

- The first real registration: the 5 `dak-*` criteria (base) and 2 `proof-cost`
  criteria (sci) that `getCriterionSourceFile`'s cascade currently names from
  core, plus `render-latex.ts` (sci) named by `render-discovery`.
- A design fork inside that, not yet settled: discovery must not acquire a
  second answer to "where is this criterion's checker". The registry should
  COMPOSE `getCriterionSourceFile` rather than sit beside it as a `??` — the
  shape `qa-checker-discovery.ts`'s own header condemns.
- The server cluster: `src/server.ts` (harness) names three core routes and one
  core tool group. Those declarations already carry an explicit `layer:` field,
  which is the honest form the criterion and render-target declarations lack.

## Done when

- [ ] No core module names a `sci` or `base` path, in an import or a
      declaration
- [ ] Every contributed checker is freshness-hashed like a built-in one, pinned
      by a test that fails if it is not
- [ ] `bun run check:partition` still 0, and the five runtime edges `zlmp`
      measured are gone rather than relocated

## Where the next step actually stands — checked, not assumed

The instances C would contribute FROM already exist: `instanceRootsIn` lists
`folio-assistant-sci` and `folio-assistant-core` beside `cat-harness`,
`bootstrap`, `agent-skills` and the rest. So this is not blocked on the
instances being created.

It is blocked on the **files**. `folio-assistant-sci` declares exactly one
directory, `library/`, and its own config says why in so many words: *"DECLARE
ONLY WHAT EXISTS, per the dh4f rule: `library/` is the only entry, because it
is the only directory here."* The sci checkers it would contribute —
`qa-checkers-cost.ts`, and `render-latex.ts` for the renderer half — are still
inside `cat-harness/content/pipeline/`. The root also declares no
`dependencies.folioAssistant` entry for it, so `loadContributions` walks a tree
that does not include it.

So the first real registration is not a wiring change; it is a **move**:
relocate the module, declare a directory for it, add the `contributes` entry
and the dependency edge. That is `zmdo` / `wggr` territory and a visible
structural change, so it is the owner's call rather than something to do on the
way past.

**Two ways in, and they differ in kind rather than in size:**

- **A vertical slice** — move `qa-checkers-cost.ts` (2 criteria) to
  `folio-assistant-sci` and wire it end to end. Smallest thing that proves the
  mechanism *with a real contributor*, which is the one property the registry
  has never had. Also the smallest thing that can show the freshness path works
  across repositories, which is what this bean just made possible.
- **Wait for the split** — `zmdo` / `wggr` move the layers wholesale and the
  contributions follow. No interim state, at the cost of the registry staying
  unproven until then.

**Not doing either on my own initiative, and deliberately not building the
composition API in the meantime.** `composedCriterionSource` — the function
that would let discovery ask the registry for a criterion core does not know,
and throw if both claim one — is easy to write and would have no caller. An
unwired seam with a plausible shape is exactly what this bean exists to repair;
adding a second one while fixing the first is not progress.

## The vertical slice landed — the registry has a real contributor

Owner, 2026-09-21: *"Vertical slice now — move qa-checkers-cost.ts"*.

`qa-checkers-cost.ts` now lives in `folio-assistant-sci`, which contributes its
two checkers through a `contributes` module reached by the repository's **first
dependency edge**. Loaded for real, not in a fixture:

```
contributed checkers:
  proof-compile-cost        folio-assistant-sci  folio-assistant-sci/content/pipeline/qa-checkers-cost.ts
  proof-no-cost-regression  folio-assistant-sci  folio-assistant-sci/content/pipeline/qa-checkers-cost.ts
```

### The criterion stayed; the checker moved

A criterion is a rule about content and a checker is the tooling that answers
it — the owner's cut, *"f-a-core has high level processes only, no tooling"*.
So `proof-compile-cost` and `proof-no-cost-regression` are still declared in
core's `QA_CRITERIA_REGISTRY`; what moved is the file that implements them.

### One answer, not a `??`

`resolveCriterionSource(id, coreRoot, registry?)` is the single answer to
"where is this checker", used by discovery, by the sweep's hashing loop and by
the test that pins declared == actual. It is not the shape
`qa-checker-discovery`'s header condemns, because the two sources
**partition**: core declares criteria whose checkers core owns; a dependency
contributes checkers for criteria it owns. A criterion claimed by both is a
**collision and throws**, naming both claimants — the same discipline
`ContributionRegistry.register` already applies to two dependencies claiming
one criterion.

### The trap, and why it is now unreachable rather than avoided

`getCriterionSourceFile` ends in a **default**: an unrecognised id resolves to
`qa-checkers-extended.ts`. `script_hash` is computed over that path, so a
criterion pointed at a file not containing its checker **never invalidates** —
eleven criteria were measured in that state on 2026-09-18. Simply deleting the
cascade's cost branch would have dropped both criteria straight into it.

Three things stop that, and the third is the one that matters:

1. `QaCriterionDefinition.checker_contributed` — core declares that it does not
   own the checker. A flag rather than an absent `source_file`, because absence
   is indistinguishable from "never declared one".
2. `resolveCriterionSource` refuses the cascade for such a criterion and
   reports an unsupplied checker as **unresolved** — a third state, not a path.
   Verified: with no registry loaded, `proof-compile-cost` returns a miss whose
   reason says so, rather than `qa-checkers-extended.ts`.
3. **`getCriterionSourceFile` itself throws** for a `checker_contributed`
   criterion. Without it, `script-sweep.ts` calling the cascade directly was
   safe only *by accident* — its `SCRIPT_CHECKERS` table happens to contain no
   block criterion. Safe-by-accident is one refactor from unsafe, so the state
   is made unreachable.

### Freshness, end to end

The sweep's bundle for each criterion, computed through the resolver:

```
proof-compile-cost        source_file: folio-assistant-sci/content/pipeline/qa-checkers-cost.ts
                          script_hash: 3eb5d65c22b2
proof-no-cost-regression  source_file: folio-assistant-sci/content/pipeline/qa-checkers-cost.ts
                          script_hash: 96b9bdc29ac9
```

Two **different** hashes from one file — the per-criterion closure hash, so
each verdict tracks its own checker. `computeCriterionScriptHashes` gained an
optional `recordAs`, because the bytes are read from the contributor's root
while the recorded label must be contributor-qualified: two instances holding
the same relative path would otherwise write the same `source_file` and a
reader could not tell whose checker a verdict came from.

### Measured effect on `zlmp`'s table

The `core → sci` runtime edge is **gone** — `qa-checker-discovery` no longer
resolves any sci path, because a contributed checker arrives as a function and
the contributor imported its own module. Four of the five remain
(`qa-checkers-dak.ts` at 5 criteria, `render-latex.ts`, and the server's route
and tool groups). `bun run check:partition` still 0 wrong-direction, 0
unassigned; `bun run gates` 87 of 87.

### Falsified, in both directions

- Removing the dependency edge fails three tests, each naming the real problem:
  the two cost criteria stop resolving, are reported unimplemented, and the
  source-file test reports them unresolved. None passes vacuously.
- The source-file test's glob now walks **every instance** via
  `instanceRootsIn` rather than one hardcoded directory. Adding
  `folio-assistant-sci` as a second literal would have reproduced the exact
  defect that test's own header describes — an allow-list that falls through
  silently, which once hid three real mismatches.

### Still to do

- `qa-checkers-dak.ts` (base, 5 criteria) and `render-latex.ts` (sci) — the
  same move, now that the path is proven.
- The server cluster: `src/server.ts` (harness) names three core routes and one
  core tool group, with an explicit `layer:` field per entry.
- `script-sweep.ts`'s `SCRIPT_CHECKERS` is still a hardcoded dispatch table.
  Not reachable by a contributed criterion today, and the throw above makes a
  future one loud rather than silent — but it is the same shape discovery
  replaced.

### The next move is NOT another vertical slice — measured

`render-latex.ts` looked like the obvious repeat. It is not, and the numbers
say why rather than a hunch:

- It is **already classified `sci`**, and so are all four of its importers —
  `generate-block-tex.ts`, `generate-main-tex.ts`, `audit-tex-source.ts` and
  `build.ts`. (`zlmp` records `build.ts` as *core* calling into sci; that has
  since been reclassified, so the entry there is stale.)
- Moving it alone would leave four sci modules in `cat-harness` importing it
  across an instance boundary — four new cross-instance imports in exchange for
  one drained runtime edge. That is precisely the trap `zlmp` documents twice:
  *"inverting a dependency does not remove a cross-layer edge if the new holder
  sits in the same layer"*, and the feedback cluster that measured 10 → 11.
- The cluster is **39 modules** — every module the partition tool classifies
  `sci`, from `content/pipeline/` through `adapters/` to a dozen `scripts/`.

So the renderer half of the seam waits for `zmdo` / `wggr`, which is the
wholesale move and the owner's call. What changed today is that it now has a
destination and a proven mechanism: `folio-assistant-sci` carries a
`contributes` module, the root carries a dependency edge, and a contributed
checker is freshness-hashed across the instance boundary with its commit SHA
resolved in the contributing repository.

`qa-checkers-dak.ts` (base, 5 criteria) is blocked differently and for a
simpler reason: there is **no `smart-base` instance** in this checkout at all.
`instanceRootsIn` lists ten, and neither `smart-base` nor `smart-kg` is among
them. Creating one is a bigger decision than this bean's.
