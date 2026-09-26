No citations, no bibliography, no glossary, no automatic cross-reference
numbering. `\cite{…}` passes through **verbatim**, visible in the output rather
than silently dropped, so a folio that needs references today should write them
as Markdown links or footnotes.

Cross-references do work: every labelled block emits an HTML anchor, so
`[see the scope statement](#rec:scope)` resolves in both HTML and PDF. Use the
block's `label`, never a heading-derived anchor — the heading anchor changes
whenever the title is edited, which is exactly when the link most needs to keep
working.

---
