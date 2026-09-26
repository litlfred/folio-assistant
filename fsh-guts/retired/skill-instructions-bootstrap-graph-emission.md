---
$schema: folio-fsh-guts/v1
title: "Skill-instructions page \"bootstrap-graph-emission\" — a generated page nothing regenerates any more"
kind: generated-page
movedOn: 2026-09-23
movedFrom: "cat-harness/docs/reference/skill-instructions/bootstrap-graph-emission.md"
bean: folio-assistant-oe98
summary: >-
  A page gen-skill-docs.ts wrote before commit 258d6e0a (byql: fold detangle
  and kg-navigation into cat-harness) and has not written since. It was no
  longer in the skill-instructions index, --check could not see it, and both
  of its source/edit links pointed at paths that no longer exist. Moved here
  on the owner's choice (2026-09-23, "move to trashcan") rather than deleted;
  the live page for any skill that still exists is regenerated from its source.
---

> **Retired 2026-09-23.** Moved here rather than deleted, per
> `skills/folio-core/fsh-guts.md`. The original page follows verbatim,
> including its own front matter, fenced so it is not read as this node's.

````markdown
---
layout: default
title: 'Emitting bootstrap''s own graph'
parent: Skill instructions
---

{: .note }
> Generated from [`../bootstrap/tools/bootstrap-graph-emission.md`](https://github.com/litlfred/folio-assistant/blob/main/../bootstrap/tools/bootstrap-graph-emission.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/../bootstrap/tools/bootstrap-graph-emission.md){: .fa-edit-source }

{% raw %}
# Emitting bootstrap's own graph

**The exemption and this skill are one trade, not two facts.** bootstrap
renders nothing a human looks at — it is the navbar *footer*, and the
[harness-instances](../../cat-harness/docs/architecture/harness-instances.md)
page records the floor-that-rises rule: visualiser exempt at this layer,
required at `cat-harness` and above. The exemption is declared in
`bootstrap/bootstrap.json` under `renderExemption`, and it carries an `owes`
field naming this document. **An exemption with no substitute is a hole**; the
`owes` field is what stops it being one.

## The generator

`cat-harness/scripts/gen-bootstrap-graph.ts`, exposed as
`bun run bootstrap:graph`. It resolves the directories to scan **from the
declaration**, never by walking the tree — which is the axis
`scripts/tests/bootstrap-graph.test.ts` defends on purpose: the disk side
of each assertion *names* the directory, the exporter *resolves* it, and a
resolver that stops finding `bootstrap/skills/` would otherwise export an
empty section and report a clean run over it. That is the `dh4f` defect in the
artefact whose whole job is to say what is here.

## Four properties, and none of them is a count

The document is a **pure function of its inputs**, and every property below is
asserted against `buildCatBootstrapDocument()` rather than against bytes:

| property | why it is not optional |
|---|---|
| **pure** — two builds byte-identical | a `--check` that fails on an untouched tree is switched off within a week |
| **ordered** — `@graph` sorted by `@id` | collectors walk directories, so node order was `readdirSync` order: stable on the container that wrote it, different in CI. A build compared against itself in one process cannot fail on ordering at all, so the ORDER is asserted directly |
| **no timestamp, no commit SHA** | a generated file cannot name its own commit; the best it could name is the one before it, which is wrong by construction |
| **no absolute path from the build machine** | caught before shipping once: the "no `.bpmn` directory" problem string embedded an absolute root, so CI — a different checkout path — would have failed on a tree nobody touched, and the obvious "fix" would have been to delete the gate |

**Counts are deliberately not asserted.** `Skill: 2` was pinned and broke the
moment `log-message` landed; `Process: 1` was pinned and broke on
`log-message.bpmn`. A count makes "the export still works" and "somebody
deleted a skill" indistinguishable, and it fails on the change that was
correct. What is defended is the RELATION — the export sees what is on disk,
and it publishes only the graph kinds the declaration names.

## What it admits it did not look at

`omitted: [packages, registry, schemas, tools]`. **"bootstrap has no tools"
and "tools were never looked for" are different facts**, and an empty section
rendered as a clean one is the same `dh4f` shape as above. The `omitted` list
is how the document says which one it means.

`problems[]` is the other half: zero diagrams is a determined empty *only if
something looked*, and an instance declaring no `kg` directory has nowhere to
look — which is a different answer from "nothing was found", and reporting the
first as the second once failed the repository root on that message alone.

## Adding a skill here

Drop the `.md` in `bootstrap/skills/` or `bootstrap/render/`, add its
name to that directory's `package-manifest.json`, and the export picks it up —
no edit to the generator. `isSkillMd` decides by **declaration over location**:
a front matter carrying `$schema:` says the file is some other node kind, so
`README.md` and `AGENTS.md`, which declare neither, stay out by being declared
assets instead.

The one place that does need the edit is `skillFilesOnDisk()` in the test,
which names its directories — that is the axis, not an oversight.

## Related

- [`bootstrap-graph-publication`](bootstrap-graph-publication.md) — where
  the document lands and why its `@id` must equal that path
- [`bootstrap-kg-navigation`](../skills/bootstrap-kg-navigation.md) —
  reading a graph with nothing installed
{% endraw %}
````
