---
# folio-assistant-x4a6
title: Declare docs/ as the instance's renderable graph — core's folio registration reaches 31 of 31 readers, so the blocker is withdrawn
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T08:00:02Z
updated_at: 2026-09-22T18:18:15Z
parent: folio-assistant-vke6
---


Found and measured while doing bean `lgwe` (PR #351).

## The gap

`docs/` is this instance's Jekyll site — 150+ pages, `_config.yml`, the whole
published documentation — and **nothing declares it**. `cat-harness.json`
declares `docs/assets/qa/` (the witnesses) and nothing else under it. So a
consumer asking "which directories does this instance scan" is not told about
the one a reader actually sees.

That leaves `content/pipeline/translation-index.ts` resolving the site root as
the literal `docs`, confirmed by finding `_config.yml` there. A checked
literal, but a literal — and the fifth spelling of a fact that already has
four (`gen-docs-pages.ts`'s `OUT_DIR`, `docs-site.yml`'s `source: ./docs`,
`docs/_data/`, `docs/_config.yml`).

## Why it was not fixed in #351

`docs/` holds a renderable graph, so the entry would be
`{"id": "folio", "path": "docs/", "graphs": ["folio"]}`. **`folio` is
registered by CORE**, not the harness — `schemas/folio-graph-kind.ts`
registers on import, and `readDeclaration` throws on a kind the registry does
not know.

Measured 2026-09-19 on `claude/translated-locales-navbar` with that entry
added:

| | result |
|---|---|
| `bun test` | **9 fail, 1 error** (2166 pass) |
| `bun run harness:dirs` | exit 1 |
| `bun run kg:schema:check` | exit 1 |
| `bun run docs:harness:check` | exit 1 |
| `bun run check:harness-dirs` | exit 0 |
| `bun run kg:export` | exit 0 |

The two that pass import core; the three that fail do not. So this is not a
one-line declaration — it is "every reader of `cat-harness.json` must have
core's registration loaded", which is issue #223's five-repo split arriving
early.

## Options, with what each costs

1. **Import `folio-graph-kind` into each failing reader.** Smallest diff.
   Cost: the harness layer's scripts now depend on core, which is the
   dependency direction #223 exists to reverse — and the harness is the layer
   that is meant to work without core.
2. **Have `readDeclaration` tolerate an unknown kind** with a warning rather
   than a throw. Cost: reintroduces exactly the silent-scan-of-nothing the
   throw exists to prevent (`dh4f`), for every kind, to fix one.
3. **Wait for the split**, where core declares `docs/` in its own layer and
   the harness never reads a kind it does not own.

Recommendation: **3**, and until then leave `SITE_DIR` as the checked literal
it is. The cost of 1 is a dependency edge pointing the wrong way, which is
harder to undo than a literal in one module.

## Done when
`docs/` appears in `cat-harness.json`, every reader of the declaration still
runs, and `translation-index.ts` takes its root from the declaration instead
of `SITE_DIR`.

_2026-09-19T09:54:35Z_ — Packaged docs/ under the instance stub — docs/folio-assistant/ — per the owner: 'use docs/<stub> convention to package in preparation for repo separation'.

The declaration half stays BLOCKED and that is unchanged. Re-measured this session by adding the entry and reverting it: harness:dirs, kg:schema:check and docs:harness:check all throw 'unknown graph kind folio', 5 tests fail. folio is registered by folio-assist-core. So this delivers the packaging, not the declaration.

What it did fix is the bean's OTHER defect — the site root was five literals. It is now one: siteDir(d) / siteDirFor(root) in schemas/cat-harness.ts, composed from the stub the declaration already carries. siteDirFor THROWS when it cannot determine a stub rather than defaulting to docs/, because a wrong site root writes 278 pages where nothing serves them.

No published URL moves: docs-site.yml and feature-staging.yml point Jekyll at ./docs/folio-assistant as source root, so the site's internal layout is untouched.

A guard test (scripts/tests/site-dir-single-answer.test.ts) fails on any NEW literal in a path-resolving position. It found 154 on its first run — including the whole Playwright e2e suite, which bun test never executes and which would have gone red in CI.

Verified: 2256 unit tests, 133 e2e, tsc, eslint, and 10 gates all green. kg:audit sidecars show no verdict change, only hashes.

_2026-09-19T10:09:09Z_ — Merged as #383. The bean stays OPEN: two of its three 'Done when' boxes are blocked, not done.

Done: the site is packaged at docs/folio-assistant/, and the site root is one answer (siteDir/siteDirFor) instead of five literals.

NOT done, and blocked on issue #223's split:
- docs/ does not appear in harness.json. Re-measured 2026-09-19: adding it makes harness:dirs, kg:schema:check and docs:harness:check throw 'unknown graph kind folio' and 5 tests fail, because folio is registered by folio-assist-core.
- translation-index.ts still composes its root rather than reading a declared directory. It now composes it from the declaration's stub, which is one line away from reading the directory once core's registration reaches every reader.

Waiting on: core's folio registration reaching the harness-layer declaration readers (#223 Phase 0.x). No expiry set — this is a real dependency, not a stall. Handoff: whoever lands the split should flip siteDirFor to read the declared directory and delete the composition.

Setting back to todo so a sibling can see it is unclaimed.

_2026-09-19T10:19:49Z_ — Follow-up: the convention shipped in #383 lived only in code. No skill mentioned docs/<stub> — directory-conventions.md documented stub-named ARTEFACTS (<stub>.jsonld) but not the site directory. That is the failure AGENTS.md's own banner names: a rule with no home is not in the generated reference, not in the published skill docs, and not found by an agent that went looking for the skill first.

Added a docs/<stub> section to skills/folio-core/directory-conventions.md with the split rationale, the source-root mechanism that preserves URLs, the measured folio-graph-kind blocker, the throw-rather-than-default rule, and the guard.

Deliberately NOT done: creating an empty docs/<other-stub>/ to 'exercise the convention'. A declared-but-absent directory is the dh4f defect — every consumer scans nothing and reports a clean run over it. The convention is exercised for a second stub by site-dir-single-answer.test.ts, which asserts siteDir({stub:'y'}) === 'docs/y'.

Note on the skill's own QA: skill-is-brief and skill-not-a-document were ALREADY failing on main at 448 lines. My first draft took it to 493; trimmed to 462. Both are minor/coverage so they do not gate, but widening a criterion that says 'at this length it is a document' by 46 lines while adding to it is the wrong instinct. Splitting the skill is its own piece of work.

---

## Re-measured 2026-09-21 — the block is STILL REAL, and `docs/` is already declared

Two things had changed and one had not.

**`docs/` IS declared now**, which this bean's first Done-when asks for. It
arrived 2026-09-20 as the `docs` kind rather than as `folio`, with a second
`root-docs` entry for the repository-root overlay (owner's ruling,
2026-09-21). So the bean's title — *"declare docs/ as the instance's
renderable graph"* — describes finished work, reached by a different route
than the one it assumed.

**The blocker it names has not moved.** Measured today:

```
directoryForGraph(cat-harness, "docs") threw:
  cat-harness/cat-harness.json: directory "folio" declares unknown graph kind
directoryForGraph(cat-harness, "folio") threw:  (the same)
```

Reading this instance's declaration through `directoryForGraph` **throws**,
because the `folio` DIRECTORY ENTRY declares graph kind `folio` and that kind
is registered by CORE. Every consumer that works today does so by importing
`schemas/folio-graph-kind.js` first — `folio-optional-axes.test.ts` is the
worked example. A consumer that does not is one `unknown graph kind` away
from a throw, and the throw names the `folio` entry rather than the caller.

*Recorded because this session twice found a stated blocker had silently
dissolved (`zq3f`'s resolver, `hrv2`'s filename). This one had not, and a
block confirmed current is worth as much as a block found stale — the next
agent should not have to re-derive either.*

## What is actually left

- [ ] The registration reaching every declaration reader, which is the real
      subject and is architectural rather than a declaration edit.
- [ ] `translation-index.ts` taking its root from the declaration:
      `SITE_DIR = siteDirFor(REPO_ROOT)` resolves to `docs`, and so does
      `siteDirFor(cat-harness)`. It is already declaration-DERIVED, through
      `stub` rather than through the `docs` entry — so this item is narrower
      than it reads, and wants restating rather than doing as written.

---

## Measured 2026-09-21 — it is LATENT, not live, and the falsifier landed

The brief named the falsifier in advance: *if every real consumer already
imports the registration transitively, this is a latent hazard rather than a
live defect, and the fix is a guard plus a better error, not a
re-architecture.* That is what the measurement says.

**31 of 31 real call sites reach the registration. Zero are exposed.**

### Getting that number took four attempts, and three were wrong

Worth recording, because the wrong ones all *looked* like answers:

| attempt | said | why it was wrong |
|---|---|---|
| `grep -l` for the functions | 57 readers | counted **comment mentions**; the real figure is 31 call sites |
| static walk, `[^;\n]*?` | 7 unreached | `[^\n]` forbids newlines, so every MULTI-LINE import was invisible |
| static walk, `[\s\S]*?` | 35 unreached | unbounded scan ran past statement ends and mis-attributed specifiers |
| **`bun build`** | **0 unreached** | the bundler IS the resolver; nothing to disagree with |

The third attempt used the same pattern as `scripts/partition/engine.ts`. It
reported `translation.ts` as not reaching a module it imports **on line 28** —
which is how bean `q2wn` was found.

**The rule: do not hand-roll a module-graph walker when the toolchain will
resolve the graph for you.** A regex over import syntax has now been wrong
here in three different directions, and each failure produced a plausible
number rather than an error.

### What was done

The throw already said *"A kind contributed by a dependency must be registered
before the declaration is read"*, which is true and leaves the reader to grep.
It now names the import — `import "schemas/folio-graph-kind.js";` — and says
it is for its SIDE EFFECT so it takes no binding and must not be elided.

**The message pointed at the wrong file.** It names the declaration ENTRY, so
it accuses `cat-harness.json`, which is correct, while the mistake is a
missing import in whichever module read it first.

### What was NOT done, and why

No re-architecture. `folio-graph-kind.ts` states the boundary it defends — *"a
layer that cannot render must not own the renderable kind"* — so moving the
kind into the harness would break the thing this bean would be serving.

No new gate. `q2wn` has to be settled first: a gate proving "every reader
reaches the registration" needs edges that `check:partition` currently cannot
see, so it would be built on a blind resolver.

## Still open

- [ ] `q2wn` — the bare side-effect import the partition regex misses.
- [ ] Whether a reachability gate is worth having once `q2wn` is settled.
      **Not red on arrival**: 31 of 31 pass today, so this one could be turned
      on the day the edges are visible.


## RE-VERIFIED 2026-09-22 — the blocker in this bean's own TITLE is complete

_Stream 1/3 (`upgd`), re-measured on `main` at `b7f8945b`._ The claim that
opened that stream says to re-verify a critical path against the store before
acting on it (`k59d`). This bean is the first one that measurement contradicts.

**The title advertises a blocker this bean's own body already measured away.**
It reads *"blocked on core's folio registration reaching every declaration
reader"*. §"Worth recording" records the answer: **31 of 31 readers reach it**,
established with `bun build` — the bundler IS the resolver — after three
hand-rolled regex walkers each produced a different plausible wrong number.
A bean whose title states a blocker its body has disproved reads as blocked to
every sibling that does not open it.

**The one item under "Still open" is also closed.** It names `q2wn` — the bare
side-effect import `check:partition`'s regex could not see. `q2wn` is
`completed`, `updated_at: 2026-09-22T10:28:50Z`, and
`cat-harness/scripts/partition/engine.ts` now documents the bare form at lines
172 and 189, naming **`folio-graph-kind`** as the worked case:

> The bare side-effect form — `import "./x.js";`, no binding and no `from` —
> … side-effect-importing core's `folio-graph-kind` to get the `folio` kind

So the precondition this bean set for a reachability gate — *"`q2wn` has to be
settled first: a gate proving 'every reader reaches the registration' needs
edges that `check:partition` currently cannot see, so it would be built on a
blind resolver"* — is satisfied. The edges are visible.

**What is actually left is a DECISION, not a blocker**, and this bean already
framed it: is the reachability gate worth having, given it is *not red on
arrival* (31 of 31 pass today)? That is the owner's call, so it is put to them
rather than taken here.

Withdrawing the blocker rather than closing the bean: the declaration work this
bean names is real and unfinished. What is withdrawn is the claim that it
cannot start.
