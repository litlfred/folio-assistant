---
layout: default
title: '`fsh-guts/`'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/fsh-guts.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/fsh-guts.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/fsh-guts.md){: .fa-edit-source }

{% raw %}
# `fsh-guts/` — the trashcan that is kept

**Delete means relocate.** Nothing in this repository is removed with `rm`
unless the owner has explicitly confirmed that removal; everything else that
has outlived its use moves to `fsh-guts/`, where it stays addressable,
exported and greppable, and where no reader of the folio will meet it.

Owner, 2026-09-19:

> do not pollute the KG with SDLC churn.... if you need to keep it, make a
> folder called `fsh-guts/` that you can put structured content in but that
> does not enter into main render pipeline. […] it is the trashcan that does
> not get rendered but […] where deprecated, throwaway stuff goes. […] do not
> delete unless explicit confirm.

## What makes it different from every other non-renderable graph

The declaration declares nine graph kinds and none of them renders. That makes
`renderable: false` look like a weak signal, and for the others it is: `tools`,
`schemas`, `beans` and the rest are graphs a **tool** reads, and there was
never a page to make of them.

**`fsh-guts` is the one whose contents COULD be rendered and deliberately are
not.** It exists so that something can be kept without being published. That
is a different fact wearing the same flag, and it is why this skill exists
rather than a line in the conventions table.

## Why the never-delete rule needed a destination

`AGENTS.md` has always forbidden deleting a bean, and its reason was never
about beans:

> a scrapped bean records that something was considered and rejected, which is
> what stops the next agent re-entering the same dead end; a deleted one leaves
> a sibling unable to tell abandonment from accident.

Every word of that is true of a page, a diagram, a script or a workflow. The
rule could not be applied to them because an agent removing one had only `rm`
and no third option. `fsh-guts/` is that option, and it converts an
unenforceable principle into a move.

**So the rule now reads, for everything:**

1. Work that is wanted but wrong → fix it.
2. Work that is not wanted → **move it to `fsh-guts/`**, with a note saying
   what superseded it.
3. Actual deletion → **only on explicit confirmation from the owner**, asked
   for as a question, never inferred from "this is obviously dead".

A thing in `fsh-guts/` can be read, cited and restored. A thing that is gone
cannot be told from a thing that was never there.

## Files declare themselves

Same contract as the bean and workflow stores: a directory is a place to look,
and the file says what it is. Every node carries front matter:

```yaml
---
$schema: folio-fsh-guts/v1
title: "Deployment topologies and operating modes"
kind: proposal
movedOn: 2026-09-19
movedFrom: "docs/folio-assistant/proposals/deployment-topologies.md"
issue: 363
summary: >-
  One or two sentences on what this was and why it left.
---
```

`movedFrom` and `movedOn` are the part that earns its keep. Without them a
node here is an orphan — a reader can see what it says and not where it used
to live, which is exactly the "abandonment or accident" ambiguity the rule
exists to prevent. `issue` points at the conversation that superseded it,
where there is one.

`kind` is **open**. A proposal, a webpage, a todo, a retired diagram, a script
nobody calls any more — the trashcan does not get to be fussy about what is
thrown into it.

## It is exported, and it is not rendered — and it is not in the KG either

- served as `<base>/fsh-guts.jsonld`, alongside the instance's other
  renderings, so a consumer can walk it **by name** — built by
  `scripts/fsh-guts-export.ts`, published by `docs-site.yml`, with a
  `.json` alias because Pages has no media type for `.jsonld` and serves it
  as octet-stream. **Logs are excluded by DECLARATION**: a file is included
  only if it says `$schema: folio-fsh-guts/v1`, so a log entry is left out
  because of what it says it is, not because `.gitignore` kept it off the
  build machine — which is a property of the checkout and not of the export
- **absent from the site build** — this is the property, not a side effect.
  A change that causes `fsh-guts/` to render has broken it
- **stripped from every other published graph.** Owner, 2026-09-19: *"NEVER
  include fsh-guts, references to fsh-guts stripped out of KG before sending
  to publication."*

**Those last two are different properties and the second is easy to miss.**
Keeping the CONTENT out of the render pipeline does not keep the REFERENCE
out of the graph: an instance's declared directories become nodes in
`<stub>.jsonld`, so declaring this directory — required, or nothing can find
it — put its id, path and description into the published document. That was
shipped and then corrected the same day.

A consumer may fetch `fsh-guts.jsonld` deliberately. It must never **arrive**
there by following an edge. Mechanism and the three emitters that had to be
filtered: [`kg-export`](kg-export.md) §"`fsh-guts` NEVER reaches a published
graph".

Reaching it as a human is the dead-fish icon under settings, with a node
counter and a select dialog. Bean `folio-assistant-7vhe`; until that exists,
the files are reachable through the repository and the JSON-LD.

## On the name

`.fsh` is **FHIR Shorthand** — in `schemas/dak.ts`, `jsonld.ts`,
`translation-tools.ts`, `block-qa.ts`, and throughout the WHO SMART folios
this platform targets. The overlap was raised and the owner confirmed this
spelling anyway.

It is recorded here so the next agent meets it as a known fact instead of
rediscovering it and proposing a rename. **Do not re-litigate it.** If you are
grepping for FHIR Shorthand, exclude this directory.

## What does NOT go here

- **Anything a reader of the folio needs.** That is `docs/`, and moving it
  here to tidy up is the opposite mistake.
- **A bean.** Beans have their own lifecycle — `scrapped`, with reasons — and
  a second disposal mechanism for them would be two answers to one question.
- **Secrets, credentials or personal data.** This is not rendered; it is still
  committed, still public in a public repository, and still in the JSON-LD.
  Not-rendered is not private, and treating it as private is the one way this
  directory could do real harm.
{% endraw %}
