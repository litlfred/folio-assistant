---
$schema: folio-fsh-guts/v1
title: "The bootstrap graph"
kind: proposal
movedOn: 2026-09-19
movedFrom: "docs/folio-assistant/proposals/bootstrap.md"
summary: >-
  Design for `bootstrap/` — the graph an agent reads before it knows whether the repository is an instance, what kind, or what for. NOTHING HERE IS BUILT. Arrived on main in docs/ the same day proposals left the rendered site; moved here by the same rule, since a design a folio's readers do not need is not a page. Bean `x3bd`.
---

# `bootstrap/` — the graph an agent can read before it knows anything
{: .no_toc }

Every other graph in this repository assumes a reader who already knows what a
folio is, what a lane is, and which tools are connected. **Bootstrap assumes
none of that.** It is the graph an agent loads when it has just been pointed at
a repository and does not yet know whether that repository is an instance, what
kind, or what it is for.

This sets out what bootstrap is, what it deliberately excludes, and the two
questions it has not answered. It is a proposal: **nothing here is built.** The
design was accumulated on bean `x3bd` over 2026-09-19 and is written down here
because a design that lives only in bean notes is a design the next session
reconstructs rather than reads.

1. TOC
{:toc}

---

## 0. What would decide this

A proposal that cannot say what would change its mind is an opinion wearing a
heading. Three things would:

- **A real `f-a-sci` declaration.** §5's central claim — that a named upstream
  instance's own declaration answers the harness type, the knowledge graph and
  the voice, so nothing else need be asked — is checkable against one file the
  moment `folio-asst-sci` exists. If that declaration turns out not to carry
  what §5 assumes, the intent skill needs a second question and the design
  gets worse in a specific, measurable way.
- **A bootstrap that cannot be read without MCP.** §4 forbids tool calls. If
  writing the two skills turns out to require one — to resolve a dependency, to
  read a remote declaration — then bootstrap is not standalone and the
  boundary is in the wrong place.
- **The size of the cached subset.** §6 assumes the named instance's
  declaration is itself the selector for what to replicate. If the honest
  answer is "most of cat-harness", bootstrap is not lean and the cache is a
  vendoring problem rather than a stub.

---

## 1. Bootstrap is a standalone graph

**`bootstrap/` is its own knowledge graph, not a directory inside the harness
one.** It declares itself, it is loadable on its own, and cat-harness is an
*instance loaded through it* rather than its parent.

That inversion is the whole point. The reader of bootstrap has not yet
established that cat-harness is present, let alone which version — so a
bootstrap that imported from cat-harness could not run in the one situation it
exists for. The direction rule the repository already enforces between core and
harness (core may import harness; harness may not import core) extends by one
link: **bootstrap may not import harness.**

It is also the one exception to the stub pattern. `tools/`, `skills/`,
`library/` and `docs/` subdivide by contributing instance —
`tools/<stub>/` — so a composed instance adds its own without colliding on a
filename. `beans/` and `todos/` do not, because they are never overlaid.
`bootstrap/` is neither: it is a top-level directory of its own, because it is
what runs *before* there is an instance to name a stub after.

## 2. `README.md` is the content, and it is brief

The bootstrap graph's documentation lives in `bootstrap/README.md`, so it is
**self-documenting on GitHub** — a person who lands on the directory in a
browser reads the thing itself rather than a pointer to a site.

Four rules, and the last is the one that makes it work:

1. **Brief.** The README gives the briefest functional flow that uses every
   term: actor, role, process, task, skill, reading markdown, navigating the
   KG, user input, and a tool overview. It does not explain any of them.
2. **One user story.** Not a catalogue of scenarios — one, carried end to end.
3. **Almost every word links to a definition.** The README does not say what a
   Tool *is*; it hyperlinks the term to its JSON Schema definition. Same for
   every other term. The prose is a path through the vocabulary, and the
   vocabulary is defined where it is already machine-readable.
4. **It ends with a three-step handoff**, which is the README's actual job:
   point the reader at the `.md` skill for loading and navigating a KG; point
   them at the bootstrap JSON-LD and have them load the graph and read the
   bootstrap process; start the bootstrap BPMN.

**The graph documents itself; the README is a conformance test of that.** Not
every term has to appear in the README — but every term must be defined in the
graph's own JSON/JSON-LD self-documentation, and the README is one pass that
demonstrates it. A README that cannot be written without inventing a definition
has found a gap in the graph.

## 3. The BPMN is a decision tree

One process, and it is small: **initialize, or load.**

- The repository is already an instance → *load* its declaration and proceed.
- It is not → *initialize*, which requires **user input**, and the diagram says
  so with a request-user-input step rather than guessing.

That is the entire control flow. It is a BPMN rather than prose for the reason
`AGENTS.md` gives generally — if it has actors, activities and a control flow
it is a process — and because the rest of the repository already executes BPMN,
so bootstrap's process is inspectable by the same tools without a second
mechanism.

## 4. Two skills, and no MCP

Bootstrap carries **exactly two skills**:

1. **Read and navigate a knowledge graph** — how to load a JSON-LD graph, walk
   it, and read a markdown node. This is the skill the README's handoff points
   at first, because without it the reader cannot follow the second step.
2. **Determine user intent** — what the agent is being asked to make this
   repository into. §5 is about what its output is.

**There is no MCP tool call anywhere in bootstrap.** Tool calls are
cat-harness-level machinery; an agent in bootstrap may not have a connected
server, and a bootstrap that required one would fail in exactly the
cold-start case it exists for.

For the same reason, **UI concerns are not bootstrap's**. Translations, the KG
viewer, the skills and tooling around them belong to cat-harness. And bootstrap
must not need `VoiceGraph`, `LibraryGraph` or `PreviewGraph` — those are
content-model concepts that presuppose a folio, which bootstrap does not yet
know it has.

**Hardcoded JSON/JSON-LD assets in bootstrap are acceptable but not
preferred.** A bootstrap that cannot resolve anything has to carry something;
the preference is that it carries as little as possible and reads the rest.
That concession is also the rule `check:declared-paths` now enforces repo-wide:
permitted and discouraged means **declared and checked**, not forbidden and not
free.

## 5. Intent is an instance reference, not an enum

This is the part that changed late, and the correction is worth keeping.

Read on its own, *"the repo_name instance declaration needs to be made in repo
once the user's intent on harness type is known (e.g. folio, smart-guideline
DAK, smart guideline IG or whatever)"* suggests the intent skill produces a
**harness type** — a value from a closed set. The worked example says otherwise:

> **"make this repo into a `litlfred/f-a-sci` instance"** — which would turn it
> into a folio with the f-a-sci knowledge graph loaded and using milnor as
> voice.

**The user names an upstream instance, and everything else is read from that
instance's declaration.** One reference yields the harness type (folio), the
knowledge graph to load (f-a-sci's), and the voice (milnor). Nobody is asked
three questions.

So the intent skill's output is **an instance reference**. An enum would be a
second answer to "what kind of thing is this repo", free to disagree with the
upstream declaration it came from, and a fourth place the harness type is
written down — the drift this repository keeps paying for.

**And it is what makes an earlier decision pay off rather than merely be tidy.**
`milnorlink` and `voices/milnor.json` are bound for `folio-asst-sci` on the
grounds that a library document, its voice and the skill derived from it are
one bundle. This is what that buys: *"using milnor as voice"* is not a fourth
thing the command configures — it is a **consequence** of naming f-a-sci,
because the voice lives there. Had milnor stayed in the platform, the command
would have had to name it separately and the bundle argument would have been
decoration.

### The order is load-bearing

**instance reference → read ITS declaration → write this repo's declaration
from what that says → cache what the declaration needs.**

Not: ask the type, write a declaration, fetch things. Writing a declaration
before reading the upstream one leaves a window in which the repository
declares something it is not — and every consumer that reads a declaration
would believe it.

## 6. The cache is the stub pattern, not a new mechanism

When bootstrap instantiates a repository that is not yet an instance, the
upstream library is **replicated under `bootstrap/<instance>/`** as a local
cache — `bootstrap/cat-harness/`, and under §5 `bootstrap/f-a-sci/` beside it —
and those directories are **declared in bootstrap's own `harness.json`**, so
ordinary resolution finds them with no special case.

That is deliberately the same shape as `tools/<stub>/` (shipped 2026-09-19) and
the planned `skills/`, `library/`, `docs/` layout. A cache needing its own
lookup path would be a second answer to "where do skills live"; a cache that is
just another declared directory is not. Naming each cached directory for the
instance it came from is what makes two upstreams composable rather than
colliding — which is what the stub pattern is *for*.

## 7. Two questions this does not answer

Recorded so they are not rediscovered as surprises.

### Staleness — the question every cache owes

This repository's doctrine is that a copy with no staleness check drifts and is
believed anyway. `render:bpmn:check` exists for that; `translate-bpmn --check`
was added on 2026-09-19 after twelve diagrams turned out to have no `.pot` at
all and eighteen more still named a directory that had moved; `check:harness-dirs`
gates the two duplicates `AGENTS.md` says cannot be removed.

**"It was copied at init" is not an answer.** The cheapest honest version
records the source ref and compares against it, reporting **could not
determine** when the upstream is unreachable rather than silently passing —
the third state this repository applies everywhere else.

### What subset is replicated

`f-a-sci`'s knowledge graph is not all of cat-harness, and a bootstrap that
copies everything stops being lean. Under §5 the named instance's own
declaration is the obvious selector — it already says which directories it has,
which would mean the subset needs no separate rule.

**That claim is untested.** It should be checked against a real `f-a-sci`
declaration before anything relies on it, and §0 treats it as one of the three
things that would change this design.

---

## 8. Status

**Not built.** The design is settled to the level above and no code exists. The
adjacent work that has shipped and that bootstrap depends on:

| shipped | why bootstrap needs it |
|---|---|
| `tools/<stub>/` with an aggregating barrel | the cache in §6 reuses this exact shape |
| `harness.json` directory declarations | bootstrap declares its cache through them |
| `workflowDirs()` / `workflowFiles()` reading the declaration | a topical `bootstrap/workflows/` is found without a code change |
| `bs:` / `cat:` / `fac:` namespaces | bootstrap's terms are minted in its own namespace |
| `check:declared-paths` | enforces §4's "declared and checked" rule corpus-wide |

Still outstanding before bootstrap can be built as described: `resolveSkillDirs`
in `schemas/harness-config.ts` computes the cross-instance skill overlay and has
**no caller**, so a dependency's skills are not reachable today — which is
precisely what §6's cache assumes works.
