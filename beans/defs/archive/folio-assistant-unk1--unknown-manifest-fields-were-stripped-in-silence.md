---
# folio-assistant-unk1
title: unknown manifest fields were stripped in silence
status: completed
type: bug
created_at: 2026-08-10T05:00:00Z
updated_at: 2026-08-10T05:00:00Z
---

Branch `claude/unknown-manifest-fields-2026-08-10`.

The Zod block schemas are non-strict, so a key nothing declares is **stripped
without an error**. A misspelt field name vanishes and the data it carried never
reaches the graph — no warning, no diff, nothing to notice.

Found via `qou/fwr10`: two proof blocks declare their parent as `proofOf` where
the canonical field is `of`, so those parent links are **absent from the
dependency graph entirely**. Two independent readers hit it in different
tranches.

The class had bitten this schema before. `ProofSchema` carries a comment
recording that `of` was declared on the TS `ProofBlock` and missing from the Zod
object, "so it was silently stripped".

**Detected without changing what validates.** Zod strips, so comparing the raw
object's keys against the parsed result's is exactly the signal. No schema
change, no strict mode, no source-text scanning — the last of which is its own
known hazard here (`fsl7`, `mcp1`).

Reported at **warning**, not error: the field is inert rather than malformed, so
the block is still valid content and failing a build over it is
disproportionate. Saying nothing is what let two sit in a real paper.

**Corpus impact: 35 warnings across qou**, and the number is instructive. A first
survey found 6 unknown keys by collecting schema identifiers globally; that
undercounted, because a field can be declared on the paper or chapter schema and
still be unknown *on a block*. `chapter:` is the case — 11 blocks set it and it
is dropped every time. Only the parse itself knows what a given kind accepts.

`run-validate` on qou goes 5 issues to 40, all warnings, still ✓ Valid. The
content fixes are qou-side and not done here.
