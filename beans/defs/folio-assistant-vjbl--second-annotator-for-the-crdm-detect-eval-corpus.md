---
# folio-assistant-vjbl
title: Second annotator for the crdm-detect eval corpus
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:07:07Z
updated_at: 2026-09-18T15:07:53Z
parent: folio-assistant-ahvw
---

The `crdm-detect` eval's ground truth is **one annotator's, unblinded** — the
same agent wrote the labels and the scorer. That is the first thing to fix
before quoting 71% / 63% as a property of the skill rather than of this corpus.

Each label in `scripts/eval/crdm-detect-corpus.json` carries a one-line reason,
so a second annotator can disagree with a specific claim rather than the whole
set. The hard cases to look at first are the ones that turn on intent rather
than wording: #187 (asks for a document ABOUT features), #222 (document the
current-state pipeline), #243 (write a code policy).

Blocks treating `xfoh`'s re-measurement as authoritative.
