---
layout: default
title: 'UML overview: generated from declarations and schemas, never drawn'
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-core/uml-overview.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-core/uml-overview.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/skills/folio-core/uml-overview.md){: .fa-edit-source }

{% raw %}
# UML overview: generated from declarations and schemas, never drawn

**Every UML diagram here is generated.** Nothing in a class box is typed by
hand. If a diagram is wrong, the fix belongs in a harness declaration, a graph
kind's registry entry, or a schema, and then you regenerate. Editing a `.puml`,
`.mmd` or page under `docs/uml/` is overwritten on the next run, and CI fails
while it is stale.

## What is drawn, and from where

| Diagram | Written by | Tool |
|---|---|---|
| one per harness, and one per **named sub-graph** it declares | `scripts/gen-uml-overview.ts` | `uml-overview` |
| the harness **object model** (Actor, Role, Skill, Process, Task, Todo, Bean, Test, …) | `scripts/gen-object-model-uml.ts` | `uml-object-model` |

**A group is a named sub-graph,** meaning one entry of a harness's declaration
(`<instance>.json` `directories[]`), drawn as `<instance>/<entry id>`, for
example `bootstrap/processes`. The generator never invents a grouping. Owner,
2026-09-23: *"sections are sub-graphs in a harness"*.

**A class comes from a node schema,** resolved in this order:

1. the graph kind's `nodeSchemas`, keeping only the `$schema` tags actually
   present under that directory (see
   [`directory-conventions`](directory-conventions.md) §"Node schemas, one per
   `$schema` family");
2. the kind's `validator`: a Zod schema, converted by
   `schemas/to-json-schema.ts`;
3. the kind's `schema` field: an external-schema record (BPMN's terms), or a
   module named with no fields.

When none of these applies, the kind is drawn **dashed, as "could not
determine"**, with the reason. That box is a finding about the registry, not an
empty shape. Close it by registering a node schema, not by editing the diagram.

## Where the output lives

- `uml/overview/<instance>.puml|.mmd`: every sub-graph of one harness, stacked
  vertically, with every data field.
- `uml/overview/<instance>/<sub-graph>.puml|.mmd`: one sub-graph.
- `docs/uml/overview/…`: the pages. They render the Mermaid through
  just-the-docs and link both source files. Published at
  `<site>/uml/overview/<instance>.html`; the index is
  `<site>/uml/overview/index.html`. The site menu has a **UML overview** entry
  with one child per harness. The sub-graph pages stay out of the menu and are
  linked from their harness page, because a menu listing every sub-graph would
  be too long to scan.
- `uml/harness-object-model.puml`: the object model.

**Colours are declared once, in `docs/assets/css/uml.css`**, one CSS class per
graph kind in five families: schema, scenario, process, state and test. The
Mermaid pages take them from CSS directly. The `.puml` files write the same
colour onto each class, read from that stylesheet by `scripts/uml-palette.ts`,
because PlantUML's SVG has no CSS hooks and ELK drops package colours. To
recolour a kind, edit `uml.css`, never a diagram.

## Regenerating

```sh
bun run uml:overview           # write every overview diagram and page
bun run uml:overview:check     # CI: fail if any is stale or orphaned
bun run cat-harness/scripts/gen-object-model-uml.ts           # the object model
bun run cat-harness/scripts/gen-object-model-uml.ts --check   # needs the beans CLI
```

Run `uml:overview` after changing a declaration's `directories[]`, a graph
kind's `nodeSchemas`, `validator` or `schema`, or any schema those point at.

**The object model's `--check` needs the `beans` CLI**, because the Bean class is
read from `beans graphql --schema`. Without it the check exits 2, "could not
check", and never passes. That is why it is not a CI gate.

## Three things that have already gone wrong

- **A converter change emptied every box silently.** When the repo moved to
  Zod 4, `zod-to-json-schema` returned empty schemas and the overview drew boxes
  with no fields. The overview now throws on a resolved schema with no
  properties, and the object model refuses to write if a relationship's field
  is missing.
- **A family was drawn where it does not live.** The kind-wide `nodeSchemas` map
  put cat-harness's voice schemas inside `bootstrap/skills`. Each sub-graph now
  draws only the `$schema` tags found in its own directory.
- **Importing a generator wrote files.** Both scripts ran their main block on
  import, which dirtied the tree in CI (no `beans` CLI, so different output).
  Both are guarded by `import.meta.main`. A new generator needs the same guard.

## A 404 on a page you just merged

The site build writes the page to `gh-pages`, but GitHub Pages deploys from that
branch **separately**, and every staging-preview push cancels the deploy before
it. Before calling a page missing, look for the file on `gh-pages`
(`git ls-tree -r origin/gh-pages | grep uml/`). If it is there, wait for a
"pages build and deployment" run that is not cancelled.
[`ci-health`](ci-health.md) treats `cancelled` as a third state for this reason.
{% endraw %}
