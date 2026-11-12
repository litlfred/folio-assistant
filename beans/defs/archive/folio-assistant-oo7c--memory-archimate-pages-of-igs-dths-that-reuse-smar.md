---
# folio-assistant-oo7c
$schema: bean/1.0.0
title: 'Memory: ArchiMate pages of IGs/DTHs that reuse smart-ra elements link back via overlay:base (tools#1950, smart-trust-demo#133); legacy IRI form'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:17:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `archimate-ra-backlinks-2026-11-12.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: ArchiMate pages of IGs/DTHs that reuse smart-ra elements link back via overlay:base (tools#1950, smart-trust-demo#133); legacy IRI form

Thread "Link demo ArchiMate elements back to smart-ra" (cmsg_017WNUkNK8kdDziPK58Pv6G9RBRzWsBEvv2Z19MPdrGVRt), 2026-11-12.

- Cause: gen-archimate-pages mints every node IRI under the layer's own iriBase, so a copied smart-ra element is a separate node; nothing read the `overlay:base` property DTHs already used.
- Fix: cat-harness-tools#1950 (issue #1949): overlay:base -> dcterms:source + "Reused from smart-ra 0.3.0-draft.1" link; own elements following Realization/Specialization to a copy get "Plays <block> in smart-ra …". Legacy `…/elements/<id>.jsonld` read as `…/element/<id>`.
- smart-trust-demo#133 (issue #132): build.py `tag_base` stamps overlay:base on 827 copied smart-ra items; lock has new `iri`. Model has mixed CRLF/LF (smart-ra base is CRLF).
- Links resolve only after smart-ra republishes with current tools (smart-ra#241; its gh-pages still has old `elements/` layout).
- Q-RAL-2 = C (owner tap 09:18Z): core#764 (issue #763, code) checker reads both IRI forms; DTH regen PRs held for owner: dth-hrh#121 (#120), dth-phc#41 (#40), dth-sfp#10 (#9, stacked on #8; also fixed 3 relationships tagged element/). Folio meta.archimate links still old form (checker accepts both). Pushing onto another PR's branch (dth-sfp#8) was refused by auto mode: stack a new PR instead.
- Both PRs handed to merge manager 09:2xZ under the merge window.
