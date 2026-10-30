---
# folio-assistant-h11k
$schema: bean/1.0.0
title: 'BLOCK TRANSLATION GAPS: math placeholders, inline-markup placeholders, manifest extraction, locale render path'
status: in-progress
type: task
priority: high
created_at: 2026-10-30T12:45:00Z
updated_at: 2026-10-30T13:23:00Z
parent: folio-assistant-slw1
---

Split from folio-assistant#206, which closed on 2026-10-30 because every requirement it listed is on main. These are the open gaps from `cat-harness/docs/proposals/translation-block-audit.md`, as measured on main on 2026-10-30.

## Done when
- [ ] G1: math is protected through extraction. Today `$a*b*c$` comes out as `$abc$`, and a `- x + y` row inside `$$…$$` is read as a list item. Subscripts already survive.
- [ ] G3: code spans and link targets are kept as placeholders. Today `` `f(x)` `` is dropped.
- [ ] G4: `extractFromManifest` is called from the pipeline, not only from tests.
- [ ] G5: blocks have a translated render path.

G1 comes first, because the owner's content is mathematical.

Opened on the owner's card "A. Apply all", 2026-10-30 12:39Z (thread "Finish leftovers from closed lanes"). (https://claude.ai/code/session_01Qmmkt7iaCtGYwZbW9x7eYe)
