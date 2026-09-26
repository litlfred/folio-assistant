---
# folio-assistant-rnfl
title: 'Phase I.3 — rename `content/` → `folio/` (2,408 occurrences, 429 files) (#223)'
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-18T15:00:27Z
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
