---
# folio-assistant-9hfi
title: 'smart-immunizations codings.html: CodeSystems and ValueSets show ''not rendered: list-simple-*.xhtml'''
status: todo
type: bug
created_at: 2026-10-06T05:56:52Z
updated_at: 2026-10-06T05:56:52Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-06: on https://litlfred.github.io/smart-immunizations/codings.html both lists render as placeholders:

    CodeSystems ✎ 📣
    ⟦not rendered: list-simple-codesystems.xhtml⟧ — the IG Publisher renders it from a source this build does not hold; no renderer was given to this build.
    ValueSets ✎ 📣
    ⟦not rendered: list-simple-valuesets.xhtml⟧ — (same)

The owner asked "what to do to fix?". Investigation started in session https://claude.ai/code/session_01EcBv3uwKYcnNbCC6BcPG92.

## Done when
- [ ] root cause recorded here, with the fix options and the owner's choice
- [ ] codings.html on the built smart-immunizations site lists its CodeSystems and ValueSets, checked on a built page
- [ ] a gate or test fails when a list-simple-* include on a published IG page renders as the placeholder

Related: jut3 (smart-* via just-the-docs, which defines how IG includes render).
