<!-- Generated from skills/memory/adapter-vs-profile.md by `bun run agent-memory`. -->
<!-- Not injected into MEMORY.md; read on demand. Edits here are lost. -->

`PaperContentAdapter` extends `DocumentContentAdapter`; `MATH_BLOCK_KINDS` is
written out in `schemas/block-kinds.ts` and `DOCUMENT_BLOCK_KINDS` is its
**derived** complement, so a kind added to `BLOCK_KINDS` cannot go
unclassified. Keep that derivation — do not hand-maintain both lists.
