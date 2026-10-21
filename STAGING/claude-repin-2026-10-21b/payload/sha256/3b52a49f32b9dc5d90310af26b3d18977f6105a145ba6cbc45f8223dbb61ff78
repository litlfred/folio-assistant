---
# folio-assistant-rnfl
$schema: bean/1.0.0
title: Phase I.3 — rename `content/` → `folio/` (2,408 occurrences, 429 files) (#223)
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-10-12T16:05:00Z
parent: folio-assistant-vke6
---

Mechanical but wide: **2,408** literal `content/` occurrences across **429**
files (measured 2026-09-18). `content/` holds no content — it is 431 files /
46,401 lines of *pipeline*.

**NOT blocked on bean `fsch`.** It was scrapped 2026-09-20 and the block is
void.

**But the deliverable as written is IMPOSSIBLE, and the sentence that stood
here on 2026-09-22 argued the opposite. See §"FALSIFIED" below — it is kept
because it was published and acted on.** It read: *"under that model `folio/`
is a declared directory holding a `folio` graph, so the directory currently
called `content/` … is misnamed on the shipped model rather than on a proposed
one. This work therefore stands and is unblocked."*

Stage by consumer — pipeline,
scripts, docs, workflows, CI — with wiring moving in the same commit as its
targets (`AGENTS.md`: move wiring and script together).

Gate: no `content/` path literal outside intentional content-instance paths;
full suite green **and** a synthetic-folio run proving each moved tool still
reads a non-empty corpus (the `dh4f` gate — a green check is the symptom, not
the reassurance).


---

## FALSIFIED 2026-09-22 — `folio/` is already taken, and every number here is wrong

Re-measured before starting, because the counts were four days old. Nothing in
this bean survived the measurement.

### 1. The target name is ALREADY IN USE

`cat-harness/cat-harness.json` declares:

| id | path | graphKinds |
|---|---|---|
| `folio` | `folio/` | `['folio']` |

`cat-harness/folio/` **exists on disk** and holds the three instance
declarations — `bootstrap.json`, `cat-harness.json`, `folio-assist-core.json`.
It has its own history (`494bbbb6f9`, `8b9aa5dae7`, `fd57e83cf5`).

So `content/` → `folio/` is not a rename waiting to happen. It is a
**collision** with a different, already-declared directory holding a different
graph.

### 2. My own unblock note had it exactly backwards

That note argued the scrapping of `fsch` *supplies* the motive, because under
the settled model `folio/` is a declared directory holding a `folio` graph.
Both halves are true and the conclusion does not follow: it is **because**
`folio/` is that directory that `content/` cannot become it. The fact I cited
as the reason to proceed is the reason not to.

The error is the one this session has been cataloguing all day — reasoning
from a model to a conclusion without checking the model against the tree. One
`ls` settled it.

### 3. The subject moved, and is not what the title says

`content/` is no longer at the repository root. It is **`cat-harness/content/`**,
and it holds exactly two things:

| directory | files |
|---|---|
| `cat-harness/content/docs/` | 451 |
| `cat-harness/content/pipeline/` | 221 |

672 files against the bean's **431**. Neither subdirectory is folio content:
one is documentation, one is pipeline code. Whatever the right name is, it is
not `folio/` — the honest candidates are splitting the two out to where docs
and pipeline already live.

### 4. The scope is 6.7× the stated figure, and mostly not source

| measure | bean | today |
|---|---|---|
| occurrences | 2,408 | **16,129** |
| files | 429 | **2,316** |

And the distribution says the raw number is the wrong instrument:
**11,721 of 16,129 (73 %) are under `cat-harness/test/`**, with 1,139 of the
2,316 files being generated `.jsonld` siblings. The source-side figures are
`scripts/` 513, `workflows/` 145, `schemas/` 102, `adapters/` 55 — an order of
magnitude below the headline, and only some of those are path literals at all
rather than the word "content" before a slash.

### What this bean needs

Not execution. A decision about what `cat-harness/content/` should be called
now that `folio/` is taken and the directory holds docs + pipeline rather than
content — which is a design question with the owner, not a rename. **No files
were renamed and no code was changed**, per the standing rule against
speculative changes without the author's consent.

## Owner ruling (2026-10-10, drain session ml9h)

**Split.** cat-harness/content/ does not become folio/: its docs move to docs/ and its pipeline code to pipeline/, beside their siblings. Now workable.

## Split plan 2026-10-12 (lane C proposal, under the owner's ruling "split")
Measured: cat-harness no longer has `content/`. What remains is cat-harness-tools `content/pipeline/` (163 files) → `pipeline/`, plus every reference to it. Consumers import it by relative path, so a package `exports` alias would not cover them.

One PR per line, in this order:
1. tools: the move (`git mv`, internal refs, `cat-harness-tools.json`, package.json scripts), plus a transitional undeclared symlink `content/pipeline -> ../pipeline`.
2. tools: scripts/tests and test/coordinator.
3. tools: the rest of scripts/, src, adapters, schemas, templates.
4. cat-harness: skills, translations, tools/index.ts, schemas; then regenerate test/results.
5. core.
6. sci.
7. smart-ra.
8. folio-assistant (lane A).
9. tools: remove the symlink, and add a guard that fails on any `content/pipeline` literal. This includes the dh4f gate: a synthetic-folio run proving each moved tool still reads a non-empty corpus.

Risk to check in PR 1: whether check:declared-paths and check:undeclared-files accept the undeclared symlink, and whether realpath discovery double-counts it. If either breaks, the fallback is to land PRs 1–8 together in one window with a single re-pin.

## Progress 2026-10-12 15:3x (lane C)
PR 1 of 9 is merged: cat-harness-tools#146 (c4efa71). `content/pipeline` became `pipeline/`, together with all tools-internal references (planned PRs 2 and 3 folded in, because tsc does not follow a symlinked directory for relative imports), plus the transitional symlink. Next: cat-harness, core, sci and smart-ra (lane C); folio-assistant (lane A).

## Progress 2026-10-12 16:0x (lane C)
- Merged: cat-harness#170 (71 files), core#69 (dfeb2b4), sci#17 (62c4b29). All now name `cat-harness-tools/pipeline/` and must be pinned together with tools ≥ c4efa71.
- smart-ra#46 is a draft. It waits for smart-ra's own tools pin to reach ≥ c4efa71.
- Left on `content/pipeline` on purpose, until the final symlink-removal PR: input-site globs, translations and translation-workflow.bpmn (which feed the .pot templates), generated pages, and init-folio templates.
- folio-assistant (lane A): the root references are rewritten to `cat-harness-tools/…` by the re-pin (#2529). The `content/pipeline` → `pipeline` step follows #2529, and the symlink covers the gap.
