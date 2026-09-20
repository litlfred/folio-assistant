---
layout: default
title: A folio's README
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/readme-sections.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/readme-sections.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/readme-sections.md){: .fa-edit-source }

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
{% endraw %}
