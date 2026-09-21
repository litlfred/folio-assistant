---
# folio-assistant-rfev
title: 'C: built-ins self-register at the outermost layer — wire the ContributionRegistry for the first time'
status: in-progress
type: task
created_at: 2026-09-21T13:21:31Z
updated_at: 2026-09-21T15:05:00Z
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
`cat-bootstrap`, `agent-skills` and the rest. So this is not blocked on the
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
