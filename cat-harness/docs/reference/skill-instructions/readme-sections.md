---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'A folio''s README'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/readme-sections.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/readme-sections.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/readme-sections.md){: .fa-edit-source }

{% raw %}
# A folio's README — the folio owns the file, the platform owns the markers

Two tools divide the file between them, and **between them no link in a folio
README is unaccounted for**: **sync** owns the marked regions, **audit** checks
everything else. Neither ever rewrites the author's prose.

| | what it does | writes? |
|---|---|---|
| `readme_sync` · `readme:sync` | refresh each generated section | only between markers |
| `readme_audit` · `readme:audit` | verify every Markdown link resolves | never |

`readme:sync:check` is the CI form; `readme:sections` lists what a README can
opt into. Registered among the **generic** tools — a document folio has
chapters, simulators and workflows for the same reason a paper folio does, and
simply never carries the Lean markers.

## Opt-in is per section, and absence means "not opted in"

A section is written **only where the README already carries its
`<!-- marker:begin -->` / `<!-- marker:end -->` pair**. Nothing outside a marked
region is ever touched, and a README with no markers is a README this tool
leaves entirely alone. Adding a section is one registry entry: a marker, a
one-line summary, and a renderer returning Markdown plus operator notes — the
CLI, the MCP tool and the staleness check all read the registry.

## "Could not determine" is a third state, everywhere

A section that cannot establish its answer returns **skip**, and the region is
left exactly as it was. This is not decoration:

- A folio configuring its simulators under a platform submodule has no such
  directory until that submodule is checked out. The first version rendered
  *directory absent* as *this folio has no simulators* — **replacing a correct
  nine-row table with a sentence.**
- A shallow clone cannot read the publish ref. "Could not read it" must not
  silently blank a table that was right yesterday.

**An empty directory is still a determined empty.** Absent and empty are
different answers, and only one of them is safe to render.

## Resolve links; never compose them

The contents table's predecessor built every PDF cell by convention —
`<pages>/papers/<paper>/chapters/<dir>.pdf` — and checked it against nothing.
The folio's publish branch had no `chapters/` directory, so **all twenty-three
chapter links were 404 and always had been**; three of six appendix links
happened to resolve. Every cell is now looked up in a real listing of the
publish ref, and a chapter with no published PDF renders `—`.

The audit half exists for the same reason and reports three states, never two:
an external host, an in-page anchor, and a ref this checkout cannot read are all
**NOT CHECKED**, so a shallow clone does not produce a wall of false findings.

## On link style — `raw` is not the private-repo answer

A private folio whose README links to a Pages URL is unreachable for exactly the
people who have repository access, and a raw-content host does not fix it: it
404s on a private repo without a token, and a browser session cookie does not
authenticate it.

**The default is `blob`** — the forge's own file view — which follows the
viewer's session, works whether the repo is public or private, and renders PDFs
inline. The other styles remain configurable, and each prints a note under the
table saying who can follow its links.

## Why generating the rest was the wrong instinct

Two defects, both easy to write again.

**The predecessor described one folio from inside the platform.** It ended in a
whole-file copy, carrying one folio's title, badges, a registry of that folio's
own indices, a project-structure table naming its directories, and a licence
block. Run it in any other folio and the author loses their README. Only five of
its sections were derived from the tree at all; **prose about a folio belongs to
that folio.** Three literals went with it, each worth recognising in new code: a
namespace prefix applied regardless of the folio's actual build library (now
read from the build file, and left **unprefixed** when none names one — a wrong
namespace is worse than none, because it is what a reader pastes into an
import); descriptions from a hardcoded map of one folio's filenames consulted
*before* the artefact's own declared name; and a hardcoded simulator directory.

**And the authored half is worth keeping.** One folio's Published Artefacts
table listed two directories that had never existed on its publish branch —
both rows dead in both columns. But its labels were prose a generator would have
had to invent. **The defect was never a stale layout; it was targets that do not
resolve.** So that half is audited, not generated.

## `cat-harness:instances` — the root README indexes every instance

Added 2026-09-20 (issue #592). The owner:

> find beans related to readme, associated to harness instances, they must add
> to main one. should provide both Agent links (agents.md , memories) AND human
> docuemntaion (docs/) link for each harness.

One row per instance declaring a declaration, with **two entries because two
readers arrive**: an agent entry (`AGENTS.md`, memories) and a human one
(README, docs). Both halves are resolved from that instance's own declaration —
declared assets for the file links, declared `graphs` for the directory links.

**Never composed from a convention.** `join(root, "AGENTS.md")` would link a
file that may not be declared, and the criterion in `check:subgraph-coverage`
rests on an undeclared file being one no checker has a reason to look at.
Scope is honoured too: a directory declared `scope: "repository"` is linked at
the repository root, which is how `memory/` was first rendered dead as
`./cat-harness/memory/`. **A dead link in a generated table is worse than a
missing row — the row asserts the entry exists.**

**A gap is rendered AS a gap**: an em dash plus a counted note under the table,
naming the check that lists them. Never a blank cell, never a guessed path.
Eight of eleven instances had no agent entry when this was written, and a table
that quietly omitted them would have read as though the work were done.

### Which README, and the `--dir` flag

`readme:sync` with no `--dir` resolves to whichever instance carries a `folio/`
— **which is `cat-harness`, not the repository root.** Before #592 the two were
one file (`cat-harness` declared the root's README with `scope: "repository"`),
so the difference could not show. Use the pair:

| | |
|---|---|
| `readme:sync` · `readme:audit` | the cat-harness instance's README |
| `readme:sync:root` · `readme:audit:root` | the REPOSITORY's README |

Both are gated in `code-quality-gates.yml`, and that is not belt and braces:
when the split landed, the bare `readme:audit` silently narrowed to
cat-harness's and took the root README's 41 links out of the gate **without
failing anything**. A gate that stops covering something still reports green.

### Where the README render sits in the pipeline

Stage 1, **after** the current-state json/jsonld and **before** every other
harness render, and **fatal** on failure — it is the file a reader opens first.
The order and the reasoning are in
[`render-order`](render-order.md); do not restate them here.

## Maintaining these files is memory work, not documentation work

`README.md` and `AGENTS.md` are **declared assets with a declared purpose**
(`ASSET_ROLES` in `schemas/cat-harness.ts` — one place, per ROLE, not
per asset). Keeping them true is part of
[`agent-memory`](agent-memory.md), and the owner put them there:

> it is an asset and has a defined purpose (that is part of skills of mantiaing
> agent memroies)

The one distinction that governs how each is written: **a file is read, memory
is injected.** Nothing truncates a file, so `AGENTS.md` carries what an agent
must be able to look up; `MEMORY.md` carries what must arrive unasked and pays
a 200-line budget for it.
{% endraw %}
