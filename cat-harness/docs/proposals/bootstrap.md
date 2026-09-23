---
title: "The bootstrap graph"
kind: proposal
movedOn: 2026-09-19
movedFrom: "docs/folio-assistant/proposals/bootstrap.md"
summary: >-
  Design for `bootstrap/` — the graph an agent reads before it knows whether the repository is an instance, what kind, or what for. NOTHING HERE IS BUILT. Arrived on main in docs/ the same day proposals left the rendered site; moved here by the same rule, since a design a folio's readers do not need is not a page. Bean `x3bd`.
---

# `bootstrap/` — the graph an agent can read before it knows anything

> **Editorial correction, 2026-09-23.** This proposal was written while the
> instance declaration was a fixed `harness.json`; it is `<name>.json` since
> the 2026-09-21 split (`<name>.config.json` is the config beside it). The
> references below were updated so a reader is not sent to a file that does not
> exist — the proposal's argument is untouched, and only the filename moved.
> The occurrences were invisible while this lived under `fsh-guts/`, which the
> filename gate counts as retired material; publishing it is what surfaced them.

{: .no_toc }

Every other graph in this repository assumes a reader who already knows what a
folio is, what a lane is, and which tools are connected. **CatBootstrap assumes
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
heading. Four things would:

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
- **An `AGENTS.md` that cannot serve both phases.** §7 claims one file can be
  valid before cat-harness is installed and still valid after. If writing it
  turns out to need two incompatible halves — a pre-harness one that must be
  *deleted* rather than added to — then the copy is a template rather than an
  asset, and §7's staleness argument collapses with it.

---

## 1. CatBootstrap is a standalone graph

**`bootstrap/` is its own knowledge graph, not a directory inside the harness
one.** It declares itself, it is loadable on its own, and cat-harness is an
*instance loaded through it* rather than its parent.

> **Sharpened in §7**: it is an **instance**, not merely a standalone graph.
> The wording here is kept as written because everything it says stays true —
> §7 names the mechanism it was reaching for.

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

CatBootstrap carries **exactly two skills**:

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

**And it does not end at the cache.** The owner, 2026-09-19: bootstrap's last
step, *after* installing cat-harness, is to **re-read the active harness's own
bootstrap next-steps**. So the full order is:

> instance reference → read ITS declaration → write this repo's declaration →
> cache what the declaration needs → **re-enter, through the now-active
> harness**.

That final step is not tidiness. Everything before it runs in a repository that
does not yet have a harness, so it can only do what bootstrap alone can do. The
moment cat-harness is present, the set of available next steps *changes* — and
the authority on what they are is the harness that just arrived, not the
bootstrap that predates it. Hardcoding the post-install steps into bootstrap
would make bootstrap the authority on a graph it does not own, and would go
stale the first time that harness changed its own onboarding.

Note "**or whichever is the active harness**": the re-entry names the harness
that was actually installed, not cat-harness by assumption. A repository
bootstrapped against a different harness re-enters through *that* one.

## 6. The cache is the stub pattern, not a new mechanism

When bootstrap instantiates a repository that is not yet an instance, the
upstream library is **replicated under `bootstrap/<instance>/`** as a local
cache — `bootstrap/cat-harness/`, and under §5 `bootstrap/f-a-sci/` beside it —
and those directories are **declared in bootstrap's own `<name>.json`**, so
ordinary resolution finds them with no special case.

That is deliberately the same shape as `tools/<stub>/` (shipped 2026-09-19) and
the planned `skills/`, `library/`, `docs/` layout. A cache needing its own
lookup path would be a second answer to "where do skills live"; a cache that is
just another declared directory is not. Naming each cached directory for the
instance it came from is what makes two upstreams composable rather than
colliding — which is what the stub pattern is *for*.

## 7. `AGENTS.md` is a declared asset of the bootstrap instance

The owner, 2026-09-19: *"agents.md should itself be an asset as part of
bootstrap"*, and *"bootstrap should be an instance and contain its own
definitions — minimal, self-defining."*

§1 and §6 already have most of this: bootstrap declares itself, and its cache
directories live in **bootstrap's own `<name>.json`**. Saying *instance*
rather than *standalone graph* closes the gap, because an instance is a thing
this repository already knows how to compose, inherit from and override **by
`id`**. CatBootstrap then stops being a directory the platform must know about
and becomes the smallest possible instance, with cat-harness composed on top.

`AGENTS.md` is the artefact that move is worth making for. It is the first
file a cold agent reads, and today — measured 2026-09-19 — it is the **only**
root artefact this instance does not declare: `<name>.json` declares
`directories[]` and `images[]`, and `AGENTS.md` appears in neither.

### The default is to copy, and the copy is the problem

Default behaviour is to copy `bootstrap/AGENTS.md` into the repository being
initialized. That file does not exist yet; `bootstrap/` currently holds
`README.md` alone.

**A copy with no staleness check is exactly what §8 says is not an answer.**
That section is about the cache, but the argument does not care what is being
copied:

> *"'It was copied at init' is not an answer. The cheapest honest version
> records the source ref and compares against it, reporting could not
> determine when the upstream is unreachable."*

This is not hypothetical for this file. Bean `v8gh` measured seven dead links
in the root `AGENTS.md`, five of which broke in a single directory move —
including the one its own banner calls the place to start, so a cold agent
following the banner hit a 404. Nothing caught them, because `readme:audit`
checks `README.md` only and `check:agents-xref` checks **citations into**
`AGENTS.md` rather than links **out of** it.

Declaring it as an asset is what makes the check follow rather than be
special-cased: a declared artefact can carry its source ref, and
`runReadmeAudit` already takes an arbitrary `file` — it needs no new checker,
only something that says this file is ours and where it came from.

### One file, two phases

The owner's constraint: the copied file *"needs to be good enough to also work
once cat-harness is also installed."*

That is sharper than it looks, because **the root `AGENTS.md` we ship today
would fail as `bootstrap/AGENTS.md`.** Its cold-start line is
`scripts/install-beans.sh && … && beans prime`; its "Getting skills" box says
to use `skill_list` and `skill_fetch`. A repository mid-bootstrap has no
`scripts/`, no `skills/`, no beans and no MCP server — and §4 forbids a tool
call anywhere in bootstrap precisely because an agent here may have none.
Every one of those instructions is post-harness.

So phase 1 must be self-sufficient: valid with nothing installed. Phase 2 must
point **into** the knowledge graph rather than restate it — which is what the
root file already does well, and what its own banner means by *"`AGENTS.md` is
a bootstrap pointer, not the source of truth."* That sentence describes this
design; it was written before the design existed.

The two are reconciled by §5's fifth step rather than by a second file: phase 1
is copied, and the re-entry through the now-active harness is what supplies
phase 2. **The file is added to, never replaced** — which is also why §0 now
carries the falsifier it does. If phase 1 turns out to need *deleting* rather
than extending, this is a template and not an asset, and the staleness
argument above goes with it.

### Generation is an instance's business, not a rule here

The owner: *"maybe it is auto-generated based on metadata… it's up to harness
instance behaviour."*

That fits without a new mechanism, and the phasing says why. Generating from
metadata requires metadata, and the declaration does not exist until step 3 of
§5 has run — so generation is inherently a **phase-2** option. An instance that
wants it generates from its own declaration at re-entry; an instance that wants
a hand-written file keeps one. What this proposal fixes is that the file is
**declared**, so a consumer can tell which it is; it deliberately does not fix
how the bytes are produced.

The same discipline as `readme-sections`, and for the same reason: the folio
owns the file, the platform owns the markers.

## 8. Two questions this does not answer

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
declaration before anything relies on it, and §0 treats it as one of the
things that would change this design.

---

## 9. Status

**Not built.** The design is settled to the level above and no code exists. The
adjacent work that has shipped and that bootstrap depends on:

| shipped | why bootstrap needs it |
|---|---|
| `tools/<stub>/` with an aggregating barrel | the cache in §6 reuses this exact shape |
| `<name>.json` directory declarations | bootstrap declares its cache through them |
| `workflowDirs()` / `workflowFiles()` reading the declaration | a topical `bootstrap/workflows/` is found without a code change |
| `bs:` / `cat:` / `fac:` namespaces | bootstrap's terms are minted in its own namespace |
| `check:declared-paths` | enforces §4's "declared and checked" rule corpus-wide |

Still outstanding before bootstrap can be built as described: `resolveSkillDirs`
in `schemas/harness-config.ts` computes the cross-instance skill overlay and has
**no caller**, so a dependency's skills are not reachable today — which is
precisely what §6's cache assumes works.

**§7 is the part that does not wait on that.** Declaring the bootstrap instance,
declaring `AGENTS.md` as its asset with a source ref, and authoring a
phase-1-valid `bootstrap/AGENTS.md` are all statements about *bootstrap's own*
declaration. None of them resolves a dependency's skills, so none of them needs
the overlay. That makes §7 the first buildable slice of this proposal, and it is
worth saying so explicitly: a proposal whose every part waits on one blocker
tends to wait entirely.
