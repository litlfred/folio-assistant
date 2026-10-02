---
# folio-assistant-28jx
title: cat-harness declares title folio-assistant, so the navbar labels it folio-assistant (cat-harness)
status: scrapped
type: bug
priority: normal
created_at: 2026-09-21T17:11:38Z
updated_at: 2026-09-21T17:31:42Z
parent: folio-assistant-yj32
---

Issue https://github.com/litlfred/folio-assistant/issues/756 item 8. cat-harness/cat-harness.json has name cat-harness and title folio-assistant; disambiguate() in scripts/harness-tiles.ts:462 is correct, the declaration is not.



## Reasons for Scrapping

Superseded by `t3n8` before any work started. This bean proposed fixing ONE
title -- cat-harness declaring `folio-assistant` -- and the owner then asked
for the general rule: "harnesses should list the names (they should be named
in schmeas, e.g. cat-boostrap should be named 'Boostrap', f-a => Folio
Assistant, cat-harness => C@T Harness)".

Fixing the one collision would have left every other instance titled after its
directory and the schema still permitting the collision that caused this. Two
beans over one field is the duplication this store's own guidance warns about,
so the narrow one is scrapped rather than left open beside the general one.

Scrapped, not deleted: the diagnosis in the body above -- that `disambiguate()`
behaved correctly and the declaration was at fault -- is the finding `t3n8`
builds on, and a deleted bean would leave the next agent unable to tell
abandonment from accident.
