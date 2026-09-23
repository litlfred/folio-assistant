---
layout: default
title: 'Code lists'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/code-lists.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/code-lists.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/code-lists.md){: .fa-edit-source }

{% raw %}
# Code lists

Owner, 2026-09-23: *"we need an expandable option, not just declared in code.
list of codes and corresponding narrative desc and source should be part of a
node/asset."* A value that lived as a bare string in a BPMN attribute or as a
constant in a `.ts` file said nothing about itself. A code list says what each
code means and where the decision came from, and extending it means adding an
entry, not editing code.

## Where they live

The `code-list` graph kind, declared in `<instance>.json` (here
`cat-harness/code-lists/`). One file per list, `"$schema":
"folio-code-list/v1"`; the shape is `schemas/code-list.ts`. An instance sees
its own lists and every dependency's (`codeListDirs`), and a list with the same
id in the instance overrides the inherited one.

## Writing one

- `id`, `title`, a `description` of the question the list answers, and a
  `source` (a link, a ruling, or both).
- Each code: `code` (lower-case kebab, the token a record carries), `label`,
  a `definition` a reader can act on, and optionally its own `source` and a
  `value` when it stands for something (a namespace IRI, say).
- **Never delete or rename a code that was used.** Set `"status": "retired"`.
  A recorded outcome must still resolve; a retired code is published with
  `owl:deprecated` and stops counting as one of the list's values.

## Who reads them

| consumer | how | checked by |
|---|---|---|
| an adjudication step | `<folio:adjudication codes="…" list="<id>"/>` | the engine, at load: the codes must equal the list's active codes |
| `schemas/namespaces.ts` | `own-namespaces.json`, by code | `code-list.test.ts`; `external-schemas:check` treats every value as ours |

`bun run code-lists:check` refuses a malformed list and an adjudication that
declares codes with no `list`. `bun run glossary:export` publishes every list
as a `skos:ConceptScheme` in `<stub>-code-lists.jsonld`, beside the swimlane
glossary: `notation`, `prefLabel`, `definition`, `dcterms:source`.

## Adding a consumer

Read the list through `loadCodeLists(await codeListDirs(root))`, never a path
literal, and check what you read against `activeCodes(list)`. If a module
cannot use the resolver (it is imported by `cat-harness.ts`, as
`namespaces.ts` is), import the JSON statically and add a test pinning the
two together.
{% endraw %}
