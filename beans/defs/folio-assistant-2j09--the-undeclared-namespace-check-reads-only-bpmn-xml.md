---
# folio-assistant-2j09
title: The undeclared-namespace check reads only BPMN xmlns, so a JSON-LD vocabulary can go unpinned forever
status: todo
type: task
created_at: 2026-09-22T11:48:29Z
updated_at: 2026-09-22T11:48:29Z
parent: folio-assistant-1swy
---

Split out of the 2026-09-22 fix to `external-schemas.ts`, deliberately not taken there because it is a much larger decision than the bug beside it.

## The fix that was taken

`unusedNamespaces` was reporting Dublin Core — 43 real uses, live in the glossary's own `@context` — as *"a record outliving its dependency"*, because `namespacesInUse()` reads **only** `processes/*.bpmn|dmn`. A vocabulary can be used in more than one syntax; a reader that knows `xmlns` reports `@context` as absent. Repaired by scanning the corpus for the IRI string, which is syntax-agnostic by construction. Mutation-tested: a record naming an IRI nothing mentions is still reported.

## The question NOT taken

`undeclaredNamespaces` still reads diagram bindings only. So the registry can pin every namespace a **BPMN file** binds, and pin **none** that only a JSON-LD `@context` binds — and report a clean pass over the gap.

Measured on main, 2026-09-22: `skos:`, `owl:`, `rdfs:`, `schema:` and `dcterms:` all appear in emitted `@context` blocks. Before this session only `dcterms:` had a record, and it got one because DC arrives through the catalogue pipeline rather than because anything checked the contexts.

## Why widening it is not obviously right

Widening `undeclared` to every IRI mentioned anywhere would demand a registry record for `owl:`, `rdfs:`, `xsd:` and every other IRI a context happens to bind — including ones this repo merely *names* without conforming to or reading. The `use` enum already distinguishes `conforms` / `reads` / `cites`, so the vocabulary exists to express "we cite this and nothing breaks" — but somebody has to decide which of the unpinned ones are which, and a gate that demands records before that decision is made would be a gate whose remedy is guesswork.

The same argument the OWN-namespace block in that file already makes: a gate whose remedy is wrong is worse than one that says nothing, because somebody follows it.

## Done when

- [ ] Decide which JSON-LD-bound namespaces need a record, and at which `use` level
- [ ] Either widen `undeclaredNamespaces` to a declared source set, or record why the diagram-only reading is the right scope
- [ ] Whichever way it goes, the check must not report clean over a namespace nobody decided about — "nobody has said" is not "nothing to check"
