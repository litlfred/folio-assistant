---
# folio-assistant-yunp
title: 'VIEWERS FOR THE REST: 16 declared graph kinds have no visualiser — fsh-guts among them — so the navbar lists them disabled'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T21:59:34Z
updated_at: 2026-09-22T01:16:15Z
parent: folio-assistant-p5wm
---

## What — owner, 2026-09-21

> i eant to see beans/ todos/ fsh-guts/
>
> catalogue = libraru?   move?
>
> yes need viewer made for rest. bean up.. add links but disabled to LHS
> navbar on the "harneesd" dirs/sub-graphs

The last clause is **already done** (`sjic`, PR #802): every declared graph
reaches the navbar, and one with no published viewer renders as a non-link.
This bean is the other half — building the viewers those disabled entries are
waiting for.

## Measured: 6 kinds have a declared visualiser, 16 do not

Read from `cat-harness.json`, 2026-09-21. **Re-measure rather than quote this.**

| | kinds |
|---|---|
| **with** a viewer | `schemas`, `cat-harness`, `beans`, `todos`, `uploads`, `library` |
| **without** | `tools`, `skills`, `scenarios`, `workflows`, `methodology`, `qa`, **`fsh-guts`**, `health`, `memory`, `waiver`, `interaction`, `issue-marks`, `voices`, `translation-sources`, `folio`, `docs` |

So of the three the owner named: `beans` and `todos` already have viewers and
will render as LINKS the moment the main site's navbar uses the renderer;
`fsh-guts` has none and will render DISABLED. Nothing is missing for the first
two — they are waiting on the sidebar switch (`sjic`, after #791), not on a
viewer.

who-iris's own four disabled entries — `catalogue`, `skills`, `themes`,
`uploads` — are the same question one instance down.

## Prioritise by who is standing in front of it

Not all sixteen are worth the same. A viewer earns its place when a PERSON
reaches for that graph:

- **`fsh-guts`** — named by the owner, so it leads
- **`catalogue`** — who-iris's largest graph (12 nodes against 1,057,223 files
  known) and the one the instance exists to show
- **`workflows`** — the BPMN diagrams already render to SVG; a viewer is
  mostly an index over work already done
- **`qa`, `health`** — already produce committed JSON sidecars, so the data
  exists and only the rendering is missing
- **`memory`, `waiver`, `interaction`, `issue-marks`** — agent-facing state; a
  person rarely opens these, and a viewer each would be work spent on an
  audience of one agent

## `catalogue` is NOT `library`, and it should not move

The owner asked. Answering here because the answer is a fact about the
instance rather than a preference:

| | holds | scale |
|---|---|---|
| `catalogue/` | `folio-catalogue-node/v1` — what EXISTS in IRIS, by reference | 12 nodes against 1,057,223 files upstream; 9 `referenced` |
| `library/` | the L1 corpus — the bytes actually HELD, with sections and sidecars | 3 materialized items |

`who-iris/AGENTS.md`: *"the gap between twelve modelled nodes and a million
upstream files is the POINT rather than a backlog."* Folding `catalogue` into
`library` makes "we know this exists" indistinguishable from "we hold this",
which is the one distinction the catalogue exists to draw. **Not moved.** If
the owner still wants it moved, that is a ruling and this paragraph is the
argument it overrides.

## Done when

- [ ] The 6-of-22 split is RE-MEASURED, not quoted from here
- [ ] `fsh-guts` has a viewer, or a recorded reason it should not
- [ ] Every remaining disabled entry either has a viewer or a bean saying why
      it does not — a disabled entry with no explanation is a gap that looks
      like neglect
- [ ] The prioritisation above is the owner's, not mine: a kind I called
      agent-facing may be one they open weekly



---

## RE-MEASURED 2026-09-21 — the split is 7 / 24, not 6 / 16

Claimed by `claude/determined-euler-gqhkk0`. The first `Done when` said to
re-measure rather than quote, and it was right to: **both halves of 6/16 were
wrong**, because the original scan read `cat-harness/cat-harness.json` alone.
There are **16 declarations** in this checkout, and an instance declares its own
graph kinds.

| | kinds |
|---|---|
| **with** a declared visualiser (7) | `beans`, `cat-harness`, `library`, `schemas`, `todos`, `uploads`, `voices` |
| **without** (24) | `bean-defs`, `board-positions`, `boards`, `catalogue`, `docs`, `fhir-artifact-index`, `folio`, `fsh-guts`, `health`, `interaction`, `issue-marks`, `memory`, `methodology`, `qa`, `scenarios`, `skills`, `themes`, `todo-feedback`, `todo-items`, `tools`, `translation-sources`, `waiver`, `workflow-state`, `workflows` |

`voices` moved from "without" to "with" — it is declared with a visualiser in
`folio-assistant-core` and `who-style-guide`, neither of which the first scan
opened. Eight kinds are new to the list entirely, all from instance
declarations: `bean-defs`, `workflow-state`, `todo-items`, `todo-feedback`,
`boards`, `board-positions`, `catalogue`, `themes`, `fhir-artifact-index`.

**The "beans and todos already have viewers" line needs one qualification.**
True of the KINDS so named, declared by `cat-harness.json` over `beans/` and
`todos/`. But `beans/beans.json` declares `bean-defs` and `workflow-state`
beneath it, and `todos/todos.json` declares `todo-items`, `todo-feedback`,
`boards` and `board-positions` — six nested kinds, none with a viewer. The
parent directory is covered; its inner graphs are not.

**Declared IS published here, checked rather than assumed:** all 16 distinct
visualiser refs resolve to a file on disk. No `pb04` dead declarations. That is
a separate question from the split and it came back clean, so the 24 are
genuinely unbuilt rather than built-and-mislinked.

## `fsh-guts` is deliberately unpublished — this needs the owner, not a viewer

The owner named it first (*"i eant to see beans/ todos/ fsh-guts/"*). Its own
declaration in `cat-harness.json` says the opposite, and says it as a design
decision rather than as a gap:

> addressable, exported as `<base>/fsh-guts.jsonld`, and **DELIBERATELY absent
> from the rendered site**. Every other declared kind here is non-renderable
> because it is a graph a tool reads and there was never a page to make of it;
> **this one's contents could be rendered and are not, so that something can be
> kept without being published.**

That is the `Done when` clause "or a recorded reason it should not" — already
satisfied, in the declaration, before this bean was written. So building the
viewer would not be filling a gap; it would be **reversing a decision**, and
publishing content somebody chose to keep unpublished is not a thing to do on
an agent's reading of a one-line request.

Put to the owner rather than guessed. Three shapes, and they are genuinely
different products:

1. **Publish it** — the trashcan becomes a page like any other. Simplest, and
   it discards the "kept without being published" property on purpose.
2. **Render it, exclude it from the published site** — visible in a local build
   and in a STAGING preview, absent from the canonical deploy. Keeps the
   property; costs a rendering path that is conditional on the deploy, which
   nothing here does yet.
3. **Leave it** — it is already addressable as `<base>/fsh-guts.jsonld`, so
   "seeing" it may already be served by that export plus a link, with no viewer
   at all. Cheapest, and it may be what the ask actually wanted.

**29 files, 3 directories** (`proposals/`, `retired/`, `scripts/`) — small
enough that none of the three is expensive. The choice is about the property,
not the work.

## Proceeding meanwhile on `catalogue`

Not blocking on the answer. `catalogue` is the bean's next priority, is
who-iris's largest graph, is the one that instance exists to show, and carries
no such contradiction.



---

## OWNER, 2026-09-21: *"keep tools and skills separate!"*

A design constraint on this bean and a defect found by applying it. Recorded
because the instruction is general and this bean is where viewers get built:
**`tools` and `skills` are two declared graph kinds and get two viewers, never
one.** A combined "KG viewer" over the 24 would fold them together at exactly
the layer a reader browses, which is the layer the distinction is for.

**The conflation is already in the declaration.** `cat-harness.json`, entry
`tools`:

```json
"coverage": { "docs": "cat-harness/docs/skills.md", "skill": "skills-and-tools" }
```

`cat-harness/docs/skills.md` is titled **"Skills & roles"**. Its headings are
Skills, Roles, Capabilities & requirements — **there is no tools section**;
"tool" appears 7 times, incidentally. So the tools graph has no documentation
of its own and its `docs` coverage points at a page about something else.

That is worse than an absent page, and for this repo's usual reason: absent is
a legible gap, whereas a `docs` ref that resolves reports coverage. The
existing check only asks whether the ref RESOLVES TO A FILE — it does — so
nothing has ever flagged it. Same shape as `pb04` one level up: the link works
and points at the wrong thing.

**And that page is stale as well.** §"Agent/platform skills (`src/skills`)"
documents a directory that does not exist — `src/skills/` was removed in #760,
per root AGENTS.md. Verified: neither `src/skills` nor `cat-harness/src/skills`
is present.

### What this changes here

- `tools` and `skills` get separate viewers, with separate `docs` coverage.
- `tools` needs a page of its own; `skills.md` stays about skills and roles.
- The 3 files under `cat-harness/tools/` (`index.ts`, `mcp.ts`, `sessions.ts`)
  are the corpus for the tools viewer, and `defineTool` calls are its nodes.

### Worth a check rather than a fix-and-forget

A `coverage.docs` ref that resolves but documents a different subject is
invisible to every check here. Whether that is checkable at all is a real
question — "is this page about this graph" is not mechanically decidable — but
the WEAKER form is: **a `docs` page shared by two entries whose graph kinds are
disjoint** is at least suspicious, and that is computable. Not built in this
round; recorded so it is not rediscovered.



---

## CORRECTION 2026-09-22 — "16 declarations" was the wrong corpus

The re-measure above used a probe that matched **any JSON carrying `name` and
`directories`**. That is not what an instance declaration is:
`findDeclarationFile` requires the file's stem to EQUAL the declared `name`,
and `declarationPathIn` returns nothing for `beans/` or `todos/` — verified by
calling it.

So `beans/beans.json` and `todos/todos.json` were swept in. They are
**bean-graph declarations**, a different kind of file that also declares
directories and graph kinds.

| | said | correct |
|---|---|---|
| declarations | 16 | **14 instance** + 2 bean-graph |
| kinds with a viewer | 7 | **8** — `fsh-guts` now has one |
| kinds without | 24 | **17** instance + **6** bean-graph = 23 |

The six that moved are exactly the nested ones: `bean-defs`, `workflow-state`,
`todo-items`, `todo-feedback`, `boards`, `board-positions`. They are still real
declared graphs with no viewer — the correction is about **which kind of file
declares them**, not about whether they exist. The 24 → 23 is `fsh-guts`
gaining a viewer in this PR, not a miscount.

**The committed code was never wrong.** `declarationsIn()` in
`compose-docs.ts` calls `declarationPathIn`, so the withholding scan always had
the right corpus. Only the throwaway measurement script, and the prose it fed,
used the heuristic.

### Why this is worth more than the numbers

A sibling session landed `w4tq` on main the same evening, and its single real
error is **this exact one**: *"of fifteen declarations only `cat-harness` sets
`stub`"* — there were 13, because its probe *"matched any JSON carrying `name`
and `directories`, which swept in `beans/beans.json` and `todos/todos.json`"*.

Two sessions, independently, the same day, same wrong probe. That is not two
careless agents; it is a **missing affordance**. Writing the heuristic takes
one line and looks right, while the correct answer needs knowing that
`declarationPathIn` exists and that stem-equals-name is the contract. The
heuristic is also *nearly* right, so it returns a plausible corpus rather than
an error — which is `w4tq`'s own diagnosis of why its four counting mistakes
survived into beans.

Worth a shared helper that answers "every instance declaration in this
checkout", since three call sites now want it: `declarationsIn` in
`compose-docs.ts` (which got it right), and the two probes that did not.
Not built here — recorded so the next session finds it rather than writing a
fourth heuristic.



---

## The `tools` viewer, and a hypothesis this bean recorded that turned out WRONG

`tools` now has a viewer (`cat-harness/docs/tools/index.md`, 69 Tool nodes) and
a documentation page of its own (`cat-harness/docs/tool-graph.md`), so
`coverage.docs` no longer names a page about skills.

Measured while building it: **69 Tool nodes, all 69 carrying `satisfies`,
naming 49 distinct skills, and all 49 resolve.** No dangling references and no
tool that satisfies nothing — the graph was in good order, it simply had no
surface.

### The hypothesis, and its falsification

This bean recorded, a few hours earlier:

> the WEAKER form is: **a `docs` page shared by two entries whose graph kinds
> are disjoint** is at least suspicious, and that is computable.

**Built, and the corpus falsified it on the first run.** Three hits, all
legitimate:

| page | shared by | why it is fine |
|---|---|---|
| `beans-and-todos.md` | `beans`, `todos` | one page about both, and its NAME says so |
| `document-ingestion.md` | `uploads`, `library` | the two ends of one process |
| `subgraph-viewers.md` | `schemas`, `library` | a page about the viewer mechanism itself |

Three of three false positives. Worse, **it would not have caught the defect it
was written for**: `skills.md` was never another entry's DECLARED docs —
`tools` pointed at a page that merely describes skills, which this check cannot
see.

So "disjoint graph kinds" does not imply "unrelated subjects". A check that
fires only on legitimate cases is worse than no check, because it teaches a
reader to skip it.

**Not built. Recorded here and in the test file so it is not attempted a third
time** — the note that proposed it is two sections up, and a reader finding
that without this would reasonably go and build it.

What does work is a vocabulary approximation — the docs page for a graph must
use that graph's own terms (`defineTool`, `satisfies`) — which is honest about
being an approximation and which DID fire when the original defect was planted
back. "Is this page about this graph" is not mechanisable, and pretending
otherwise produced the check above.



---

## A gap in the mounted rail, found while reading `jpjt` — recorded, not urgent

`declaredGraphs()` in `mount-instance-docs.ts` builds the mounted navbar from an
instance's declared `graphKinds` and **does not consult `publish`**. So a
visualisation declared `publish: "staging-only"` would appear in the rail on
every deploy, including the canonical one.

**Not live today, and the reason matters more than the fact.** Two things keep
it harmless:

1. `fsh-guts` is a `cat-harness` graph and no instance declares it, so nothing
   currently has a staging-only kind in a mounted rail.
2. The href comes from `linked`, which holds MOUNTED routes only. A withheld
   page is not mounted, so the entry renders as a **disabled label** rather than
   a link to a 404. That is the third state the rail already has, arrived at by
   accident rather than by design — but arrived at.

So the worst case is a name with no link, not `pb04`. Worth fixing when an
instance first declares a staging-only visualisation, and worth knowing before
then, because "it happens to be safe" is a different claim from "it is
handled" and only the first is true.

Where it would go: `declaredGraphs` reads entries already; skipping a kind
whose only visualisation is staging-only is a few lines. The question it has to
answer first is whether the rail should hide it or show it disabled on
canonical — and that is the same question `publish` vs `hidden` answers
elsewhere, so it should be answered the same way rather than invented again.

Found by reading `jpjt` (*"F8/F9 is structurally blocked on R25's glass"*),
which is about a different surface entirely — who-iris replica pages carry no
`head_custom.html` and therefore no `fa-staging` meta, which is what prompted
checking whether the rail had its own version of the problem. It does, one
degree weaker.
