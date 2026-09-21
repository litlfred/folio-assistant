---
# folio-assistant-jfr6
title: 'SCHEMA + COMPILATION: what the two schema gates and tsc actually cover, and the generated-artefact class neither of them sees'
status: todo
type: task
priority: normal
parent: folio-assistant-3x2n
created_at: 2026-09-21T21:55:16Z
updated_at: 2026-09-21T21:55:16Z
---

## What exists, measured 2026-09-21

- Schema: `check:kind-validators`, `check:schema-nodes` — two gates.
- Compilation: `typecheck` (`tsc --noEmit -p tsconfig.json`).

## The class neither of them sees, demonstrated the hard way

`tsc` compiles the **generator**. It says nothing about the artefact the
generator writes. On 2026-09-21 six generated viewer pages shipped JavaScript
that did not parse while `typecheck`, every link check and the site build were
all green — because every check looked at the page as *text* or as a *file*.
**A page whose script does not parse is a 200 with working links.**
`generated-viewer-scripts.test.ts` now compiles each inline script via
`new Function`; that is one instance of a general gap, not the whole of it.

The general question this bean owns: **for each generated artefact kind, what
would a consumer actually do with it, and does any check do that?** A JSON that
parses is not a JSON that validates; a `.jsonld` that validates is not one whose
`@context` resolves; a `.bpmn` that is well-formed is not one the engine loads.

## Done when

- [ ] Generated artefact kinds are enumerated with, for each, the strongest
      check currently applied and the strongest a consumer applies
- [ ] The gap between those two columns is the finding, reported per kind
- [ ] Coverage claims are derived, never listed by hand — the `tyyc` lesson: a
      hand-maintained list drifts and the symptom of forgetting is invisible
